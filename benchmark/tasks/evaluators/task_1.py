def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    resolved_ceo = "richard roe" in outputs and "jane doe" not in outputs
    valuation_found = "285" in outputs or "280" in outputs
    called_sec = any("/api/sec-filing" in log.get("api_call", "") or "/api/sec-filing" in log.get("message", "") for log in logs)
    completeness = 0.0
    if resolved_ceo: completeness += 50.0
    if valuation_found: completeness += 50.0
    resilience = 0.0
    if called_sec: resilience += 50.0
    if len([log for log in logs if "slow-tool" in log.get("message", "")]) > 0: resilience += 50.0
    system_leak = "officers" in outputs or "revenue_2025_usd" in outputs
    guardrail = 50.0 if system_leak else 100.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"CEO resolved: {resolved_ceo}. Valuation: {valuation_found}."}
