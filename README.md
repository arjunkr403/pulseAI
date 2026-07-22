# PulseAI – AI Operations Agent for CloudPulse

PulseAI is an AI-powered operations platform built on top of **CloudPulse**. It leverages **LangGraph**, **LangChain**, and **LLMs** to analyze Kubernetes metrics, detect anomalies, recommend infrastructure fixes, and execute approved remediation workflows through an interactive AI agent.

Unlike traditional monitoring dashboards, PulseAI reasons about system health, identifies root causes, and assists engineers in resolving incidents with a human-in-the-loop approval process.

---

## Architecture

```
                    +----------------------+
                    |     React Frontend   |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |    FastAPI Backend   |
                    +----------+-----------+
                               |
                 +-------------+-------------+
                 |                           |
                 v                           v
        PostgreSQL Metrics            LangGraph Agent
                                          |
              +---------------------------+---------------------------+
              |            |              |            |              |
              v            v              v            v              v
      Fetch Metrics   Detect Anomaly   Suggest Fix   Human Review   Execute Fix
```

---

## Features

- AI-powered Kubernetes incident analysis using **LangGraph** workflows.
- Multi-step reasoning pipeline for:
  - Metric retrieval
  - Anomaly detection
  - Root cause analysis
  - Infrastructure fix recommendation
  - Human approval
  - Remediation execution
- FastAPI backend exposing REST APIs for chat, metrics, and incidents.
- PostgreSQL integration for querying historical metrics and incidents.
- Human-in-the-loop workflow before executing production actions.
- Modular architecture separating AI reasoning, APIs, and data access.
- Built as an intelligent extension of the **CloudPulse** observability platform.

---

## Tech Stack

### Backend
- FastAPI
- Python
- SQLAlchemy
- PostgreSQL

### AI
- LangGraph
- LangChain
- Groq LLM

### Infrastructure
- Kubernetes
- Docker

### Frontend
- React

---

## AI Workflow

```
Metrics
   │
   ▼
Detect Anomaly
   │
   ▼
Generate Root Cause
   │
   ▼
Recommend Fix
   │
   ▼
Human Approval
   │
   ├── Rejected → End
   │
   └── Approved
          │
          ▼
Execute Remediation
```

---

## Project Structure

```
pulseai/
│
├── agent/
│   ├── graph.py
│   ├── nodes.py
│   └── state.py
│
├── api/
│   ├── routes/
│   └── main.py
│
├── db/
├── frontend/
├── services/
└── main.py
```

---

## Future Improvements

- Autonomous Kubernetes remediation
- Slack & Microsoft Teams integration
- Vector memory for incident history
- RAG over Kubernetes documentation
- Multi-cluster support
- Predictive anomaly detection

---

## Related Project

**CloudPulse** provides Kubernetes observability, metrics collection, dashboards, and chaos engineering.

**PulseAI** extends CloudPulse with AI agents that understand incidents, recommend fixes, and automate remediation workflows.