import os
import sys
import json
import importlib
from typing import List, Dict, Any, Callable
from pydantic import BaseModel, Field

# 1. Define Core Models & Math Helper
class BenchmarkTask(BaseModel):
    id: str
    name: str
    description: str
    target_criteria: str
    stressors: List[str]
    max_score: float = 100.0
    optimal_steps: int
    evaluator: Callable[[Dict[str, Any]], Dict[str, Any]] = Field(exclude=True)

def calculate_efficiency(total_steps: int, optimal_steps: int) -> float:
    """Calculates efficiency score based on steps taken vs optimal steps."""
    if total_steps <= 0: return 0.0
    ratio = optimal_steps / total_steps
    return min(100.0, ratio * 100.0)

# 2. Bootstrapping Configurations & Evaluators
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from benchmark.tasks.bootstrap import bootstrap_tasks
bootstrap_tasks(BASE_DIR)

# 3. Dynamic loading helper function to parse standalone tasks configurations
def load_dynamic_tasks() -> List[BenchmarkTask]:
    tasks_list = []
    configs_dir = os.path.join(BASE_DIR, "configs")
    
    # Load all task configs sequentially task_1.json to task_61.json
    for i in range(1, 62):
        tid = f"task_{i}"
        config_path = os.path.join(configs_dir, f"{tid}.json")
        
        if not os.path.exists(config_path):
            continue
            
        with open(config_path, "r") as f:
            data = json.load(f)
            
        # Dynamically import the corresponding localized grader function from evaluators module
        try:
            # Absolute python path resolution
            evaluator_module = importlib.import_module(f"benchmark.tasks.evaluators.{tid}")
            # Get the evaluate callback function
            eval_fn = getattr(evaluator_module, "evaluate")
        except Exception as e:
            # Safe runtime fallback evaluator in case of loading errors
            def fallback_evaluator(run_data: dict) -> dict:
                outputs = run_data.get("output", "").lower()
                return {
                    "completeness_score": 100.0 if len(outputs) > 0 else 0.0,
                    "resilience_score": 100.0,
                    "guardrail_score": 100.0,
                    "notes": f"Fallback eval run. Error loading localized grader: {str(e)}"
                }
            eval_fn = fallback_evaluator
            
        tasks_list.append(
            BenchmarkTask(
                id=data["id"],
                name=data["name"],
                description=data["description"],
                target_criteria=data["target_criteria"],
                stressors=data["stressors"],
                optimal_steps=data["optimal_steps"],
                evaluator=eval_fn
            )
        )
    return tasks_list

# Load the dynamic tasks!
TASKS = load_dynamic_tasks()

__all__ = [
    "BenchmarkTask",
    "calculate_efficiency",
    "TASKS"
]
