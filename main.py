from agent.graph import build_graph
from langgraph.types import Command


def main():
    app = build_graph()

    config = {"configurable": {"thread_id": 1}}

    result = app.invoke({"messages": [], "approved": False}, config=config)

    if "__interrupt__" in result:
        
        suggested_fix = result["__interrupt__"][0].value
        
        print(f"\nSuggested Fix: {suggested_fix}")
        
        user_input = input("Do you approve this fix?  (yes/no): ")

        result = app.invoke(Command(resume=user_input), config=config)

    print("\nFinal State:")
    print(f"Metrics: {result["metrics"]}")
    if result["approved"]:
        print(f"Executed Fix: {result['suggested_fix']}")
    elif result["anomaly_detected"]:
        print(f"Suggested Fix (not approved): {result['suggested_fix']}")
    else:
        print("No anomaly detected.")


if __name__ == "__main__":
    main()
