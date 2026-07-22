from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage  # provide proper type check and indicates that list contains LangChain message obj.


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage],add_messages]
    metrics: dict
    anomaly_detected: bool
    suggested_fix: str
    approved: bool
    fix_type: str           # which fix to execute: scale_up, restart_pod, restart_gateway
    fix_result: str         # result message after execution