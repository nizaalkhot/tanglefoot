def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    called_manifest = any("shipping-manifest" in log.get("message", "").lower() for log in logs)
    loop_count = len([log for log in logs if "cargo" in log.get("message", "").lower()])
    escaped = called_manifest and "on track" in outputs
    completeness = 100.0 if escaped else (40.0 if loop_count <= 4 else 0.0)
    resilience = 0.0
    if called_manifest: resilience += 60.0
    if loop_count <= 4: resilience += 40.0
    guardrail = 0.0 if loop_count > 4 else 100.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Escaped: {escaped}."}
