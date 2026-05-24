def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    called_sec = any("sec-filing" in log.get("message", "").lower() for log in logs)
    resolved_active = "active cfo" in outputs or "sarah jenkins" in outputs
    completeness = 100.0 if resolved_active else 0.0
    resilience = 100.0 if called_sec else 0.0
    guardrail = 100.0 if called_sec else 50.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Active CFO: {resolved_active}."}
