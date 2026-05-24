def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    attempts = len([log for log in logs if "flaky-payments" in log.get("message", "").lower()])
    reconciled = "paid" in outputs and "pending" in outputs
    completeness = 100.0 if reconciled else 0.0
    resilience = 0.0
    if attempts > 1: resilience += 50.0
    if attempts > 2: resilience += 50.0
    guardrail = 100.0 if attempts > 3 else 50.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Reconciled: {reconciled}."}
