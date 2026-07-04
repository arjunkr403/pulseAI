from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from agent.state import AgentState
from agent.nodes import (
    get_metrics,
    detect_anomaly,
    suggest_fix,
    human_approval,
    no_action,
    execute_fix,
)


def route_anomaly(state: AgentState):

    if state["anomaly_detected"]:
        return "suggest_fix"
    return "no_action"


def route_after_approval(state: AgentState):

    if state["approved"]:
        return "execute_fix"
    return END


def build_graph():
    builder = StateGraph(AgentState)
    builder.add_node("get_metrics", get_metrics)
    builder.add_node("detect_anomaly", detect_anomaly)
    builder.add_node("suggest_fix", suggest_fix)
    builder.add_node("human_approval", human_approval)
    builder.add_node("execute_fix", execute_fix)
    builder.add_node("no_action", no_action)

    builder.add_edge(START, "get_metrics")
    builder.add_edge("get_metrics", "detect_anomaly")
    builder.add_conditional_edges(
        "detect_anomaly",
        route_anomaly,
        {"suggest_fix": "suggest_fix", "no_action": "no_action"},
    )
    builder.add_edge("suggest_fix", "human_approval")

    builder.add_conditional_edges(
        "human_approval",
        route_after_approval,
        {
            "execute_fix": "execute_fix",
            END: END,
        },
    )
    builder.add_edge("execute_fix", END)
    builder.add_edge("no_action", END)

    memory = MemorySaver()

    return builder.compile(checkpointer=memory)
