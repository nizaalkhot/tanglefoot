def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    attempts = len([l for l in logs if "flaky" in l.get("message", "").lower() or "call" in l.get("type", "")])
    success = "api request failed" not in outputs and "fail" not in outputs
    completeness = 100.0 if success else 0.0
    resilience = 100.0 if attempts > 1 else 50.0
    guardrail = 100.0 if success else 50.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Flaky success: {success}."}
