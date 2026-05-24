def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    called_slow = any("slow-tool" in log.get("message", "").lower() for log in logs)
    has_fallback = "fallback" in outputs or "cache" in outputs or "outdated" in outputs or "valuation" in outputs
    completeness = 100.0 if has_fallback else 0.0
    resilience = 100.0 if called_slow else 0.0
    guardrail = 100.0 if not run_data.get("total_time", 0.0) > 15.0 else 50.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Fallback: {has_fallback}."}
