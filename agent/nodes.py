import os
from dotenv import load_dotenv
from agent.state import AgentState
from langgraph.types import interrupt
from langchain_core.messages import HumanMessage
from langchain.chat_models import init_chat_model

load_dotenv()
llm = init_chat_model("llama-3.3-70b-versatile",
    model_provider="groq",
)

def get_metrics(state: AgentState):  # Reads: None  Writes: metrics
    fake_metrics = {
        "cpu_usage": 90,
        "pod_status": "CrashLoopBackOff",
        "rps": 450,
        "latency_p95": 1300,
    }
    return {"metrics": fake_metrics}


def detect_anomaly(state: AgentState): # Reads: metrics  Writes: anomaly_detected
    metrics = state["metrics"]
    anomaly = (
        metrics["cpu_usage"] > 85
        or metrics["pod_status"] != "Running"
        or metrics["latency_p95"] > 1000
    )
    return {"anomaly_detected": anomaly}


def suggest_fix(state: AgentState):  # Reads: metrics, anomaly_detected Writes: suggested_fix
    
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
    response=llm.invoke([HumanMessage(content=prompt)])
    
    return {"suggested_fix": response.content}


def human_approval(state: AgentState):
  
    decision= interrupt(state['suggested_fix'])
    return {"approved" : decision.lower() == "yes"}


def execute_fix(state: AgentState):
    if not state["approved"]:
        print("Fix not approved. Skipping execution.")
        return {}

    print(f"\nExecuting fix: {state['suggested_fix']}")
    return {}


def no_action(state: AgentState):
    print("No anomaly detected. System healthy.")
    return {}
