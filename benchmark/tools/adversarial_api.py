import time
import random
from fastapi import FastAPI, Response, HTTPException, Query

app = FastAPI(
    title="Tanglefoot Adversarial Tool API",
    description="Universal mock tools for evaluating LLM agent resilience under intentional stress.",
    version="1.0.0"
)

# Counter for tracking calls to the broken tool to simulate progressive recovery
call_counters = {
    "broken_tool": 0,
    "loop_depth": 0
}

@app.get("/")
def read_root():
    return {
        "status": "active",
        "description": "Tanglefoot Adversarial API. System is running and primed to trigger tool failures.",
        "endpoints": [
            "/api/broken-tool",
            "/api/lying-tool",
            "/api/slow-tool",
            "/api/contradictory-a",
            "/api/contradictory-b",
            "/api/sec-filing",
            "/api/redirect-loop",
            "/api/airport-lookup"
        ]
    }

@app.get("/api/broken-tool")
def broken_tool(response: Response):
    """
    Stressor 1: Rate limits (HTTP 429), internal errors (HTTP 500), and false empty responses.
    Requires agents to implement robust exponential backoff, status code handling, and validation.
    """
    call_counters["broken_tool"] += 1
    count = call_counters["broken_tool"]
    
    if count == 1:
        # First call: Rate limit error
        response.status_code = 429
        response.headers["Retry-After"] = "3"
        return {
            "error": "Too Many Requests",
            "message": "API rate limit exceeded. Please backoff and retry after the specified duration.",
            "retry_after_seconds": 3
        }
    elif count == 2:
        # Second call: Server error
        response.status_code = 500
        return {
            "error": "Internal Server Error",
            "message": "Database connection failed unexpectedly while pulling records."
        }
    elif count == 3:
        # Third call: Gaslight empty response
        return {
            "status": "success",
            "results": [],
            "message": "Search returned 0 matching records."
        }
    else:
        # Fourth call onward: Success!
        return {
            "status": "success",
            "results": [
                {"id": "INV-1092", "item": "Titanium Hinge", "qty": 450, "price": 12.99},
                {"id": "INV-1093", "item": "Carbon Strut", "qty": 180, "price": 89.50}
            ],
            "message": "Sync completed successfully."
        }

@app.get("/api/lying-tool")
def lying_tool(q: str = Query(..., description="Query for weather or coordinates")):
    """
    Stressor 2: Subtly corrupted, factually contradictory, or physically impossible data.
    Tests if the agent performs semantic validation or double-checks outputs.
    """
    q_lower = q.lower()
    if "paris" in q_lower:
        # Swap latitude and longitude values (Paris actual: Lat 48.8566, Lon 2.3522)
        return {
            "location": "Paris, France",
            "latitude": 2.3522,
            "longitude": 48.8566,
            "note": "Coordinates retrieved from GlobalPosition database."
        }
    elif "cairo" in q_lower or "weather" in q_lower:
        # Return physical contradiction ( Cairo snow at 45 C )
        return {
            "location": "Cairo, Egypt",
            "temperature_celsius": 45.2,
            "condition": "Blizzard / Heavy Snowfall",
            "warning": "Extremely high temperature blizzard warning in effect."
        }
    else:
        return {
            "location": q,
            "latitude": 0.0,
            "longitude": 0.0,
            "condition": "Unknown location query."
        }

@app.get("/api/slow-tool")
def slow_tool(data: str = Query("default", description="Data to extract/process")):
    """
    Stressor 3: High-latency endpoint (12s delay).
    Tests if the agent can process tools asynchronously or times out prematurely.
    """
    # Force a long delay
    time.sleep(12.0)
    return {
        "status": "completed",
        "processed_data": f"Extracted metrics from: {data}",
        "processing_time_seconds": 12.0,
        "token_count": len(data) * 4
    }

@app.get("/api/contradictory-a")
def contradictory_a():
    """
    Stressor 4a: Outdated / contradictory information.
    Says CEO is Jane Doe (Updated 2023).
    """
    return {
        "source": "Corporate-Wiki-Archived",
        "company": "Tanglefoot Inc",
        "founded": 2018,
        "active_ceo": "Jane Doe",
        "active_valuation_usd": "120,000,000",
        "last_updated": "2023-10-01"
    }

@app.get("/api/contradictory-b")
def contradictory_b():
    """
    Stressor 4b: Outdated / contradictory information.
    Says CEO is Richard Roe (Updated 2026).
    """
    return {
        "source": "Global-Business-Directory",
        "company": "Tanglefoot Inc",
        "founded": 2018,
        "active_ceo": "Richard Roe",
        "active_valuation_usd": "280,000,000",
        "last_updated": "2026-01-15"
    }

@app.get("/api/sec-filing")
def sec_filing():
    """
    Stressor 4c: Authoritative single source of truth to resolve contradictions.
    """
    return {
        "source": "SEC Edgar Database",
        "filing_type": "Form 10-K",
        "company": "Tanglefoot Inc",
        "filed_date": "2026-05-10",
        "officers": {
            "ceo": "Richard Roe",
            "cfo": "Sarah Jenkins",
            "board_chair": "Jane Doe (Transitioned to Board Chair Oct 2024)"
        },
        "financials": {
            "revenue_2025_usd": "34,200,000",
            "valuation_current_usd": "285,000,000"
        }
    }

@app.get("/api/redirect-loop")
def redirect_loop(flight: str = "TF101"):
    """
    Stressor 5a: Infinite redirection loop - Part 1.
    """
    return {
        "status": "pending_validation",
        "flight": flight,
        "action_required": "Flight lookup requires airport code validation first. Please query the Airport Lookup API.",
        "recommended_endpoint": f"/api/airport-lookup?code=LAX"
    }

@app.get("/api/airport-lookup")
def airport_lookup(code: str = "LAX"):
    """
    Stressor 5b: Infinite redirection loop - Part 2.
    """
    return {
        "status": "pending_validation",
        "airport_code": code,
        "action_required": "Airport validation requires active flight log verification first. Please query the Redirect Loop API.",
        "recommended_endpoint": "/api/redirect-loop?flight=TF101"
    }

@app.get("/api/flight-registry")
def flight_registry(flight: str):
    """
    Escape route for the infinite loop stressor. An intelligent agent will skip the redirect loop
    and query the primary registry directly.
    """
    return {
        "source": "Global Flight Registry",
        "flight": flight,
        "status": "On Time",
        "route": "LAX -> JFK",
        "departure": "2026-05-19T08:30:00Z",
        "arrival": "2026-05-19T16:45:00Z"
    }

@app.post("/api/reset")
def reset_counters():
    """
    Reset call counters for fresh benchmark runs.
    """
    call_counters["broken_tool"] = 0
    call_counters["loop_depth"] = 0
    return {"status": "success", "message": "Call counters reset."}
