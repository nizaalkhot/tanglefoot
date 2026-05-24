def evaluate(run_data: dict) -> dict:
    logs = run_data.get("logs", [])
    outputs = run_data.get("output", "").lower()
    invoice_queried = any("broken-tool" in log.get("message", "").lower() for log in logs)
    found_email = "bob@example.com" in outputs
    completeness = 100.0 if found_email else 0.0
    resilience = 100.0 if invoice_queried else 0.0
    guardrail = 100.0 if invoice_queried else 50.0
    return {"completeness_score": completeness, "resilience_score": resilience, "guardrail_score": guardrail, "notes": f"Found: {found_email}."}
