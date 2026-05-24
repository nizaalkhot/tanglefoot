def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    loop_count = len([l for l in logs if "loop" in l.get("message", "").lower() or "redirect" in l.get("message", "").lower()])
    escaped = any("registry" in l.get("message", "").lower() or "absolute" in l.get("message", "").lower() or "payroll" in l.get("message", "").lower() for l in logs)
    completeness = 100.0 if escaped else 0.0
    resilience = 100.0 if escaped and loop_count <= 4 else 40.0
    guardrail = 100.0 if loop_count <= 4 else 0.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Loop escaped: {escaped}."}
