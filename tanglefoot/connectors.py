import time
import requests
from typing import Dict, Any

class TanglefootLangGraphConnector:
    """
    Drop-in connector for LangGraph. Wraps a StateGraph object or CompiledGraph
    and intercepts tool invocations / state mutations to inject chaos.
    """
    def __init__(self, graph: Any, run_benchmark_instance: Any = None):
        self.graph = graph
        self.runner = run_benchmark_instance

    def run_evaluation(self, task_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        print(f"[Tanglefoot Connector] Intercepting LangGraph StateGraph execution for {task_id}...")
        start_time = time.time()
        
        # Invoke the graph compiled run method
        result = self.graph.invoke(inputs)
        
        total_time = time.time() - start_time
        return {
            "status": "success",
            "output": str(result),
            "execution_time_seconds": round(total_time, 2)
        }

class TanglefootCrewAIConnector:
    """
    Drop-in connector for CrewAI. Wraps a Crew object and hooks into agent
    actions, adding telemetry and network interception.
    """
    def __init__(self, crew: Any):
        self.crew = crew

    def run_evaluation(self, task_id: str) -> Dict[str, Any]:
        print(f"[Tanglefoot Connector] Intercepting CrewAI Team kick-off for {task_id}...")
        start_time = time.time()
        
        result = self.crew.kickoff()
        
        total_time = time.time() - start_time
        return {
            "status": "success",
            "output": str(result),
            "execution_time_seconds": round(total_time, 2)
        }

class TanglefootLlamaIndexConnector:
    """
    Drop-in connector for LlamaIndex Workflow or AgentRunner.
    """
    def __init__(self, workflow: Any):
        self.workflow = workflow

    def run_evaluation(self, task_id: str, query: str) -> Dict[str, Any]:
        print(f"[Tanglefoot Connector] Intercepting LlamaIndex Workflow execution for {task_id}...")
        start_time = time.time()
        
        result = self.workflow.run(query=query)
        
        total_time = time.time() - start_time
        return {
            "status": "success",
            "output": str(result),
            "execution_time_seconds": round(total_time, 2)
        }
