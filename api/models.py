from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# SQLAlchemy Models → Define how data is stored in the database.
# Pydantic Models → Define how data is received from clients and returned in API responses.


class MetricsResponse(BaseModel):  # Defines the response when returning system metrics.
    cpu_usage: float
    rps: float
    latency_p95: float
    pod_status: str
    anomaly_detected: bool


class ChatRequest(BaseModel):  # Defines what the frontend sends to the chatbot.
    message: str = "scan"
    thread_id: str | None = None


class ChatResponse(BaseModel):  # Defines what your AI chatbot returns.
    suggested_fix: str
    metrics: dict
    anomaly_detected: bool
    requires_approval: bool
    thread_id: (
        str  # Returns the conversation ID so the frontend can continue the same chat.
    )


class ApprovalRequest(
    BaseModel
):  # Defines what the frontend sends when a user approves or rejects an AI recommendation.
    thread_id: str
    approved: bool


class IncidentResponse(
    BaseModel
):  # Defines the response returned when fetching incident records from the database.
    id: int
    cpu_usage: float
    rps: float
    latency_p95: float
    pod_status: str
    suggested_fix: str
    approved: bool
    executed: bool
    created_at: datetime

    class Config:
        from_attributes = True

    # Allows Pydantic to convert SQLAlchemy ORM objects directly into response models.

    #    PostgreSQL
    #       │
    #       ▼
    # SQLAlchemy Query
    #       │
    #       ▼
    # Incident ORM Object
    #       │
    #       ▼
    # Pydantic (from_attributes=True)
    #       │
    #       ▼
    # JSON Response
    #       │
    #       ▼
    # Frontend
