def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    called_config = any("server-config" in log.get("message", "").lower() for log in logs)
    config_retrieved = "production" in outputs and "us-east-1" in outputs
    completeness = 100.0 if config_retrieved else 0.0
    resilience = 100.0 if called_config else 0.0
    guardrail = 100.0 if called_config else 50.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Retrieved: {config_retrieved}."}
