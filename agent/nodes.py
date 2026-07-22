import os
import datetime
import requests
from dotenv import load_dotenv
from agent.state import AgentState
from langgraph.types import interrupt
from langchain_core.messages import HumanMessage, SystemMessage
from langchain.chat_models import init_chat_model
from kubernetes import client, config as k8s_config

load_dotenv()
llm = init_chat_model(
    "llama-3.3-70b-versatile",
    model_provider="groq",
)

PROMETHEUS_URL = "http://localhost:9090"
NAMESPACE = "cloudpulse"


def get_metrics(state: AgentState):  # Reads: None  Writes: metrics
    def query(q):
        try:
            r = requests.get(
                f"{PROMETHEUS_URL}/api/v1/query", params={"query": q}
            )  # http get request to prometheus

            result = r.json()["data"]["result"]
            return round(float(result[0]["value"][1]), 3) if result else 0.0

        except:
            return 0.0

    metrics = {
        "cpu_usage": query(
            "rate(process_cpu_seconds_total[1m]) * 100"
        ),  # rate of CPU time over last min and scale it to a percentage-like value
        "rps": query("sum(rate(gateway_requests_total[1m]))"),
        "latency_p95": query(
            "histogram_quantile(0.95, sum(rate(gateway_request_latency_seconds_bucket[1m])) by (le)) * 1000"
        ),  # 95th percentile req latency from histogram and convert result from seconds to milliseconds
        "pod_status": "Running",
    }

    return {"metrics": metrics}


def detect_anomaly(state: AgentState):  # Reads: metrics  Writes: anomaly_detected
    metrics = state["metrics"]
    anomaly = (
        metrics["cpu_usage"] > 0.1
        or metrics["pod_status"] != "Running"
        or metrics["latency_p95"] > 50
    )
    return {"anomaly_detected": anomaly}


def classify_fix_type(metrics: dict) -> str:
    # Route fix type based on which metric is anomalous
    if metrics["pod_status"] != "Running":
        return "restart_pod"  # pod crashed — delete and let K8s restart
    elif metrics["latency_p95"] > 50 and metrics["cpu_usage"] < 10:
        return (
            "restart_gateway"  # high latency but low CPU — likely connection pool issue
        )
    elif metrics["cpu_usage"] > 20:
        return "scale_up"  # high CPU — scale health service replicas
    else:
        return "scale_up"  # default fallback


def suggest_fix(
    state: AgentState,
):  # Reads: metrics, anomaly_detected  Writes: suggested_fix, fix_type
    metrics = state["metrics"]
    fix_type = classify_fix_type(metrics)

    prompt = f"""You are a Kubernetes SRE analyzing live cluster metrics. Respond ONLY with valid JSON, no markdown, no backticks.

Current cluster state:
- CPU usage: {metrics['cpu_usage']:.2f}%
- P95 request latency: {metrics['latency_p95']:.2f}ms
- Requests per second: {metrics['rps']:.2f}
- Pod status: {metrics['pod_status']}
- Fix type: {fix_type}

Return this exact JSON structure:
{{
  "anomaly_reason": "one sentence — what is happening right now with specific numbers",
  "root_cause": "one sentence — most likely cause",
  "kubectl_command": "exact kubectl command to fix this — use namespace cloudpulse, deployment health",
  "action": "{fix_type}"
}}"""

    response = llm.invoke([HumanMessage(content=prompt)])

    # Parse JSON response
    import json

    try:
        parsed = json.loads(response.content)
        suggested_fix = json.dumps(parsed)  # store as JSON string
    except:
        # Fallback if LLM doesn't return valid JSON
        suggested_fix = json.dumps(
            {
                "anomaly_reason": response.content,
                "root_cause": "Unable to parse structured response",
                "kubectl_command": f"kubectl scale deployment health -n cloudpulse --replicas=3",
                "action": fix_type,
            }
        )

    return {"suggested_fix": suggested_fix, "fix_type": fix_type}


def human_approval(state: AgentState):  # Reads: suggested_fix  Writes: approved
    # HITL interrupt — pauses graph and waits for human decision
    decision = interrupt(state["suggested_fix"])
    return {"approved": decision.lower() == "yes"}


def execute_fix(
    state: AgentState,
):  # Reads: approved, fix_type, metrics  Writes: fix_result
    if not state["approved"]:
        print("Fix not approved. Skipping execution.")
        return {"fix_result": ""}

    fix_type = state.get("fix_type", "scale_up")
    metrics = state["metrics"]

    try:
        k8s_config.load_kube_config()  # loads kubeconfig from ~/.kube/config
        apps_v1 = client.AppsV1Api()  # for deployments
        core_v1 = client.CoreV1Api()  # for pods

        if fix_type == "scale_up":
            # High CPU — scale health service replicas up by 1 (max 5)
            deployment = apps_v1.read_namespaced_deployment(
                name="health", namespace=NAMESPACE
            )
            current = deployment.spec.replicas
            new_replicas = min(current + 1, 5)
            deployment.spec.replicas = new_replicas
            apps_v1.patch_namespaced_deployment(
                name="health", namespace=NAMESPACE, body=deployment
            )
            result = f"Scaled health service from {current} to {new_replicas} replicas"

        elif fix_type == "restart_pod":
            # Pod not Running — delete it so K8s restarts it via restart policy
            pods = core_v1.list_namespaced_pod(
                namespace=NAMESPACE, label_selector="app=health"
            )
            if pods.items:
                pod_name = pods.items[0].metadata.name
                core_v1.delete_namespaced_pod(name=pod_name, namespace=NAMESPACE)
                result = f"Deleted crashed pod {pod_name} — K8s will restart it automatically"
            else:
                result = "No health pods found to restart"

        elif fix_type == "restart_gateway":
            # High latency low CPU — rolling restart of gateway to clear connection pool
            deployment = apps_v1.read_namespaced_deployment(
                name="gateway", namespace=NAMESPACE
            )
            if not deployment.spec.template.metadata.annotations:
                deployment.spec.template.metadata.annotations = {}
            deployment.spec.template.metadata.annotations[
                "kubectl.kubernetes.io/restartedAt"
            ] = datetime.datetime.utcnow().isoformat()
            apps_v1.patch_namespaced_deployment(
                name="gateway", namespace=NAMESPACE, body=deployment
            )
            result = "Triggered rolling restart of gateway to clear connection pool"

        else:
            result = "No automated fix available for current anomaly type"

        print(f"\nFix executed: {result}")
        return {"fix_result": result}

    except Exception as e:
        return {"fix_result": f"Fix execution failed: {str(e)}"}


def no_action(state: AgentState):  # Reads: None  Writes: None
    print("No anomaly detected. System healthy.")
    return {}
