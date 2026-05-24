def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    called_stateful = len([log for log in logs if "stateful-inventory" in log.get("message", "").lower()])
    reported_decay = "decay" in outputs or "decre" in outputs or " 1 " in outputs or "one" in outputs
    completeness = 100.0 if reported_decay else 0.0
    resilience = 0.0
    if called_stateful >= 2: resilience += 50.0
    if called_stateful >= 3: resilience += 50.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": 100.0, "notes": f"Decay reported: {reported_decay}."}
