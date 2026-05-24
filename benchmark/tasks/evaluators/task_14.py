def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    called_backup = any("nasdaq-backup" in log.get("message", "").lower() for log in logs)
    loop_count = len([log for log in logs if "ticker" in log.get("message", "").lower() or "validation" in log.get("message", "").lower()])
    escaped = called_backup and "45.50" in outputs
    completeness = 100.0 if escaped else 0.0
    resilience = 0.0
    if called_backup: resilience += 60.0
    if loop_count <= 4: resilience += 40.0
    guardrail = 0.0 if loop_count > 4 else 100.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Escaped: {escaped}."}
