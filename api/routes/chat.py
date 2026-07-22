from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from langgraph.types import Command
from langchain_core.messages import HumanMessage, SystemMessage
from agent.graph import build_graph
from agent.nodes import llm
from api.models import ChatRequest, ApprovalRequest
from db.database import get_db, Incident
import uuid

router = APIRouter()
app_graph = build_graph()


@router.post("/chat")
def chat(db: Session = Depends(get_db)):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    result = app_graph.invoke({"messages": [], "approved": False}, config=config)
    metrics = result.get("metrics", {})
    anomaly = result.get("anomaly_detected", False)
    suggested_fix = result.get("suggested_fix", "") if anomaly else ""
    requires_approval = "__interrupt__" in result

    if anomaly:
        incident = Incident(
            thread_id=thread_id,
            cpu_usage=metrics.get("cpu_usage", 0),
            rps=metrics.get("rps", 0),
            latency_p95=metrics.get("latency_p95", 0),
            pod_status=metrics.get("pod_status", "Unknown"),
            suggested_fix=suggested_fix,
            fix_type=result.get("fix_type", ""),
            approved=False,
            executed=False,
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

    return {
    "suggested_fix": suggested_fix,
    "fix_type": result.get("fix_type", ""),
    "fix_result": result.get("fix_result", ""),
    "metrics": metrics,
    "anomaly_detected": anomaly,
    "requires_approval": requires_approval,
    "thread_id": thread_id,
}


@router.post("/approve")
def approve(request: ApprovalRequest, db: Session = Depends(get_db)):
    config = {"configurable": {"thread_id": request.thread_id}}

    result = app_graph.invoke(
        Command(resume="yes" if request.approved else "no"), config=config
    )

    fix_result = result.get("fix_result", "")

    incident = (
        db.query(Incident)
        .filter(Incident.thread_id == request.thread_id)
        .order_by(Incident.created_at.desc())
        .first()
    )

    if incident:
        incident.approved = request.approved
        incident.executed = request.approved
        incident.fix_result = fix_result  # store what was executed
        db.commit()

    return {
        "status": "executed" if request.approved else "rejected",
        "fix_result": fix_result
    }


@router.post("/followup")
def followup(request: ChatRequest, db: Session = Depends(get_db)):
    if not request.thread_id:
        return {"error": "thread_id required for follow-up"}

    incident = (
        db.query(Incident)
        .filter(Incident.thread_id == request.thread_id)
        .order_by(Incident.created_at.desc())
        .first()
    )

    context = ""
    if incident:
        context = f"""Previous scan context:
- CPU: {incident.cpu_usage}%
- Latency: {incident.latency_p95}ms
- Pod status: {incident.pod_status}
- AI diagnosis: {incident.suggested_fix}"""

    response = llm.invoke([
        SystemMessage(content=f"You are a Kubernetes SRE assistant. Answer concisely in 2-3 sentences. {context}"),
        HumanMessage(content=request.message)
    ])

    return {
        "response": response.content,
        "thread_id": request.thread_id
    }

# Frontend
#     │
#     ├── POST /chat
#     │       │
#     │       ▼
#     │   FastAPI generates thread_id (UUID)
#     │       │
#     │       ▼
#     │   Invoke LangGraph
#     │       │
#     │       ▼
#     │   get_metrics → detect_anomaly → suggest_fix → human_approval (interrupt)
#     │       │
#     │       ▼
#     │   If anomaly → Create Incident in DB (with thread_id)
#     │       │
#     │       ▼
#     │   Return {suggested_fix, metrics, anomaly_detected, requires_approval, thread_id}
#     │       │
#     │       ▼
#     │   Frontend stores thread_id
#     │       │
#     │       ├── If requires_approval → POST /approve (thread_id)
#     │       │           │
#     │       │           ▼
#     │       │   Command(resume="yes"/"no")
#     │       │           │
#     │       │           ▼
#     │       │   LangGraph resumes → execute_fix or END
#     │       │           │
#     │       │           ▼
#     │       │   FastAPI updates Incident (approved, executed)
#     │       │           │
#     │       │           ▼
#     │       │   Return {status: "executed"/"rejected"}
#     │       │
#     │       └── POST /followup (thread_id + message)
#     │                   │
#     │                   ▼
#     │           Fetch Incident by thread_id from DB
#     │                   │
#     │                   ▼
#     │           Build context (cpu, latency, pod_status, diagnosis)
#     │                   │
#     │                   ▼
#     │           Groq LLM (SystemMessage + context + HumanMessage)
#     │                   │
#     │                   ▼
#     │           Return {response, thread_id}
#     │
#     └── GET /metrics (auto-refresh every 30s, independent of scan)
#     │
#     └── GET /incidents (refresh after each scan/approve)