from fastapi import APIRouter
from agent.nodes import get_metrics
from agent.state import AgentState

router = APIRouter()


@router.get("/metrics")
def fetch_metrics():
    state = AgentState( #Initial State
        messages=[],
        metrics={},
        anomaly_detected=False,
        suggested_fix="",
        approved=False,
    )
    result = get_metrics(state)
    metrics = result["metrics"]

    anomaly = (
        metrics["cpu_usage"] >1 or
        metrics["pod_status"] != "Running" or
        metrics["latency_p95"] > 0.01
    )

    return {
        **metrics, # dict unpacking 
        "anomaly_detected": anomaly
    }

