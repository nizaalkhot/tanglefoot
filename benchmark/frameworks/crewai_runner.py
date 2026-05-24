from typing import Any
from benchmark.run_benchmark import ExecutionTracker

# Safe imports for CrewAI
try:
    from crewai import Agent, Task, Crew, Process
except ImportError:
    Agent = None
    Task = None
    Crew = None

class CrewAIRunner:
    def __init__(self, llm: Any, tracker: Any):
        self.llm = llm
        self.tracker = tracker

    def run(self, task_id: str) -> str:
        self.tracker.add_log("thought", f"Initializing actual CrewAI multi-agent workspace for task: {task_id}...")
        
        if Crew is None:
            self.tracker.add_log("thought", "[CrewAI mock] Running vulnerable conversation loop simulation fallback...")
            from benchmark.run_benchmark import CrewAIAgent
            agent = CrewAIAgent(self.tracker)
            return agent.execute_task(task_id)
            
        self.tracker.add_log("thought", "[CrewAI active] Booting agents and task crews...")
        # Define a real crew
        researcher = Agent(
            role='Senior Researcher',
            goal='Solve tasks under intentional network failures',
            backstory='Expert at retry loops and omission handling.',
            llm=self.llm,
            verbose=True
        )
        
        execution_task = Task(
            description=f"Resolve the target task metrics: {task_id}",
            expected_output="Final validated fact answers.",
            agent=researcher
        )
        
        crew = Crew(
            agents=[researcher],
            tasks=[execution_task],
            process=Process.sequential
        )
        
        result = crew.kickoff()
        return str(result)
