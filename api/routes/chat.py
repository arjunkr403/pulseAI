from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from langgraph.types import Command
from agent.graph import build_graph
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
    suggested_fix = result.get("suggested_fix", "")
    requires_approval = "__interrupt__" in result

    if anomaly:  # if anomaly create ORM object
        incident = Incident(
            thread_id=thread_id,
            cpu_usage=metrics.get("cpu_usage", 0),
            rps=metrics.get("rps", 0),
            latency_p95=metrics.get("latency_p95", 0),
            pod_status=metrics.get("pod_status", "Unknown"),
            suggested_fix=suggested_fix,
            approved=False,
            executed=False,
        )
        db.add(
            incident
        )  # Places the object into SQLAlchemy's session. Nothing is written yet
        db.commit()  # Now the row exists in the database
        db.refresh(incident)  # Reloads the object from PostgreSQL.

    return {
        "suggested_fix": suggested_fix,
        "metrics": metrics,
        "anomaly_detected": anomaly,
        "requires_approval": requires_approval,
        "thread_id": thread_id,
    }


# This endpoint is called after the user clicks Approve or Reject.
@router.post("/approve")
def approve(request: ApprovalRequest, db: Session = Depends(get_db)):
    config = {"configurable": {"thread_id": request.thread_id}}

    result = app_graph.invoke(
        Command(resume="yes" if request.approved else "no"), config=config
    )

    incident = (
        db.query(Incident)  # SELECT * FROM incidents
        .filter(Incident.thread_id == request.thread_id)  # WHERE thread_id ="abc"
        .order_by(Incident.created_at.desc())  # ORDER BY created_at DESC
        .first()  # LIMIT 1;
    )

    if incident:
        incident.approved = request.approved
        incident.executed = request.approved
        db.commit()
    # UPDATE incidents
    # SET approved = true,
    # executed = true
    # WHERE id = ...;

    return {"status": "executed" if request.approved else "rejected"}


# Frontend
#     │
# POST /chat
#     │
#     ▼
# FastAPI
#     │
#     ├── Validate ChatRequest
#     ├── Create DB Session (get_db)
#     └── Invoke LangGraph
#             │
#             ▼
#       get_metrics
#             │
#             ▼
#       detect_anomaly
#             │
#             ▼
#       suggest_fix
#             │
#             ▼
#       human_approval (interrupt if needed)
#             │
#             ▼
#       Return graph state
#             │
#             ▼
#         FastAPI
#             │
#             ├── If anomaly:
#             │      ├── Create Incident
#             │      ├── db.add()
#             │      └── db.commit()
#             │
#             └── Return JSON Response
#             │
#             ▼
#          Frontend
#             │
#             ▼
#     If requires_approval
#             │
#       POST /approve
#             │
#             ▼
# Command(resume="yes"/"no")
#             │
#             ▼
#     LangGraph resumes
#             │
#             ▼
# FastAPI updates Incident
#             │
#             ▼
#       db.commit()
#             │
#             ▼
#       Return Status
