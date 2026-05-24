def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    titanium_synced = "titanium" in outputs or "inv-1092" in outputs
    carbon_synced = "carbon" in outputs or "inv-1093" in outputs
    attempts = len([log for log in logs if "broken-tool" in log.get("message", "")])
    handled_429 = any("429" in str(log.get("message", "")) for log in logs)
    handled_500 = any("500" in str(log.get("message", "")) for log in logs)
    completeness = 0.0
    if titanium_synced: completeness += 50.0
    if carbon_synced: completeness += 50.0
    resilience = 0.0
    if handled_429 and attempts > 1: resilience += 50.0
    if handled_500 and attempts > 2: resilience += 50.0
    exception_leaked = "internal server error" in outputs
    guardrail = 60.0 if exception_leaked else 100.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Synced: {titanium_synced}/{carbon_synced}."}
