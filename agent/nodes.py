import requests
from dotenv import load_dotenv
from agent.state import AgentState
from langgraph.types import interrupt
from langchain_core.messages import HumanMessage
from langchain.chat_models import init_chat_model

load_dotenv()
llm = init_chat_model(
    "llama-3.3-70b-versatile",
    model_provider="groq",
)

PROMETHEUS_URL = "http://localhost:9090"


def get_metrics(state: AgentState):  # Reads: None  Writes: metrics
    def query(q):
        try:
            r = requests.get(f"{PROMETHEUS_URL}/api/v1/query", params={"query": q}) #http get request to prometheus

            result = r.json()["data"]["result"]
            return round(float(result[0]["value"][1]),3) if result else 0.0

        except:
            return 0.0

    metrics = {
        "cpu_usage": query("rate(process_cpu_seconds_total[1m]) * 100"), #rate of CPU time over last min and scale it to a percentage-like value
        "rps": query("sum(rate(gateway_requests_total[1m]))"),
        "latency_p95": query(
            "histogram_quantile(0.95, sum(rate(gateway_request_latency_seconds_bucket[1m])) by (le)) * 1000"
        ), # 95th percentile req latency from histogram and convert result from seconds to milliseconds
        "pod_status": "Running",
    }

    return {"metrics": metrics}


def detect_anomaly(state: AgentState):  # Reads: metrics  Writes: anomaly_detected
    metrics = state["metrics"]
    anomaly = (
        metrics["cpu_usage"] > 1
        or metrics["pod_status"] != "Running"
        or metrics["latency_p95"] > 0.01
    )
    return {"anomaly_detected": anomaly}


def suggest_fix(
    state: AgentState,
):  # Reads: metrics, anomaly_detected Writes: suggested_fix

    metrics = state["metrics"]

    prompt = f"""
    You are a Kubernetes SRE.

    Cluster Metrics:
    - CPU Usage: {metrics['cpu_usage']}%
    - Pod Status: {metrics['pod_status']}
    - RPS: {metrics['rps']}
    - P95 Latency: {metrics['latency_p95']} ms

    Return ONLY:
    1. Root Cause:
    2. Recommended Fix:

    Keep the entire response under 60 words.
    Do not include explanations or greetings.
    """
    response = llm.invoke([HumanMessage(content=prompt)])

    return {"suggested_fix": response.content}


def human_approval(state: AgentState):

    decision = interrupt(state["suggested_fix"])
    return {"approved": decision.lower() == "yes"}


def execute_fix(state: AgentState):
    if not state["approved"]:
        print("Fix not approved. Skipping execution.")
        return {}

    print(f"\nExecuting fix: {state['suggested_fix']}")
    return {}


def no_action(state: AgentState):
    print("No anomaly detected. System healthy.")
    return {}
