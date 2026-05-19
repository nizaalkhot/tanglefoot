import time
import random
from typing import List
from fastapi import FastAPI, Response, HTTPException, Query, WebSocket, WebSocketDisconnect

app = FastAPI(
    title="Tanglefoot Adversarial Tool API",
    description="Universal mock tools for evaluating LLM agent resilience under intentional stress.",
    version="2.0.0"
)

# Counter for tracking calls to the broken tool to simulate progressive recovery
call_counters = {
    "broken_tool": 0,
    "loop_depth": 0
}

# V2: Stateful inventory database dictionary
stateful_inventory = {
    "stock_count": 100,
    "last_updated": time.time()
}

# V2: Chaos engineering network controls
chaos_config = {
    "enabled": False,
    "latency_jitter": False,
    "connection_drops": False
}

# V2: Active WebSocket subscription connection manager
active_connections: List[WebSocket] = []

def apply_chaos(response: Response):
    """
    Applies network latency jitter and socket drops dynamically
    if chaos engineering mode is enabled.
    """
    if chaos_config["enabled"]:
        if chaos_config["connection_drops"] and random.random() < 0.25:
            # Simulate 503 Service Unavailable crash
            raise HTTPException(
                status_code=503, 
                detail="Service Unavailable - Dynamic chaos connection drop triggered."
            )
        if chaos_config["latency_jitter"]:
            # Introduce network jitter sleep delay (0.5 to 2.5 seconds)
            jitter_delay = random.uniform(0.5, 2.5)
            time.sleep(jitter_delay)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    V2: WebSocket handler allowing the React Web Dashboard to subscribe 
    to live terminal logs streamed from the local Python benchmark runner.
    """
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Keep client connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)

@app.post("/api/broadcast-log")
async def broadcast_log(payload: dict):
    """
    V2: Broadcasts execution logs and real-time telemetry metrics 
    from the run_benchmark.py CLI script to all subscribed web UI dashboards.
    """
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_json(payload)
        except Exception:
            disconnected.append(connection)
            
    for conn in disconnected:
        if conn in active_connections:
            active_connections.remove(conn)
            
    return {"status": "broadcasted", "recipients": len(active_connections)}

@app.post("/api/chaos/toggle")
def toggle_chaos(enabled: bool = True, jitter: bool = True, drops: bool = True):
    """
    Toggle chaos network simulations dynamically during test loops.
    """
    chaos_config["enabled"] = enabled
    chaos_config["latency_jitter"] = jitter
    chaos_config["connection_drops"] = drops
    return {"status": "success", "chaos_config": chaos_config}

@app.get("/api/stateful-inventory")
def get_stateful_inventory(response: Response):
    """
    V2 Stateful API Trap: Stock count decrements by 1 on every query.
    Tests if agents adapt to real-time state mutations.
    """
    apply_chaos(response)
    if stateful_inventory["stock_count"] > 0:
        stateful_inventory["stock_count"] -= 1
        
    return {
        "status": "success",
        "item": "Titanium Hinge",
        "remaining_qty": stateful_inventory["stock_count"],
        "price": 12.99,
        "timestamp": time.time()
    }

@app.get("/")
def read_root():
    return {
        "status": "active",
        "description": "Tanglefoot Adversarial API. System is running and primed to trigger tool failures.",
        "chaos_mode": chaos_config,
        "endpoints": [
            "/api/broken-tool",
            "/api/lying-tool",
            "/api/slow-tool",
            "/api/contradictory-a",
            "/api/contradictory-b",
            "/api/sec-filing",
            "/api/redirect-loop",
            "/api/airport-lookup",
            "/api/stateful-inventory"
        ]
    }


@app.get("/api/broken-tool")
def broken_tool(response: Response):
    """
    Stressor 1: Rate limits (HTTP 429), internal errors (HTTP 500), and false empty responses.
    Requires agents to implement robust exponential backoff, status code handling, and validation.
    """
    apply_chaos(response)
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
def lying_tool(response: Response, q: str = Query(..., description="Query for weather or coordinates")):
    """
    Stressor 2: Subtly corrupted, factually contradictory, or physically impossible data.
    Tests if the agent performs semantic validation or double-checks outputs.
    """
    apply_chaos(response)
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
def slow_tool(response: Response, data: str = Query("default", description="Data to extract/process")):
    """
    Stressor 3: High-latency endpoint (12s delay).
    Tests if the agent can process tools asynchronously or times out prematurely.
    """
    apply_chaos(response)
    # Force a long delay
    time.sleep(12.0)
    return {
        "status": "completed",
        "processed_data": f"Extracted metrics from: {data}",
        "processing_time_seconds": 12.0,
        "token_count": len(data) * 4
    }

@app.get("/api/contradictory-a")
def contradictory_a(response: Response):
    """
    Stressor 4a: Outdated / contradictory information.
    Says CEO is Jane Doe (Updated 2023).
    """
    apply_chaos(response)
    return {
        "source": "Corporate-Wiki-Archived",
        "company": "Tanglefoot Inc",
        "founded": 2018,
        "active_ceo": "Jane Doe",
        "active_valuation_usd": "120,000,000",
        "last_updated": "2023-10-01"
    }

@app.get("/api/contradictory-b")
def contradictory_b(response: Response):
    """
    Stressor 4b: Outdated / contradictory information.
    Says CEO is Richard Roe (Updated 2026).
    """
    apply_chaos(response)
    return {
        "source": "Global-Business-Directory",
        "company": "Tanglefoot Inc",
        "founded": 2018,
        "active_ceo": "Richard Roe",
        "active_valuation_usd": "280,000,000",
        "last_updated": "2026-01-15"
    }

@app.get("/api/sec-filing")
def sec_filing(response: Response):
    """
    Stressor 4c: Authoritative single source of truth to resolve contradictions.
    """
    apply_chaos(response)
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
def redirect_loop(response: Response, flight: str = "TF101"):
    """
    Stressor 5a: Infinite redirection loop - Part 1.
    """
    apply_chaos(response)
    return {
        "status": "pending_validation",
        "flight": flight,
        "action_required": "Flight lookup requires airport code validation first. Please query the Airport Lookup API.",
        "recommended_endpoint": f"/api/airport-lookup?code=LAX"
    }

@app.get("/api/airport-lookup")
def airport_lookup(response: Response, code: str = "LAX"):
    """
    Stressor 5b: Infinite redirection loop - Part 2.
    """
    apply_chaos(response)
    return {
        "status": "pending_validation",
        "airport_code": code,
        "action_required": "Airport validation requires active flight log verification first. Please query the Redirect Loop API.",
        "recommended_endpoint": "/api/redirect-loop?flight=TF101"
    }

@app.get("/api/flight-registry")
def flight_registry(response: Response, flight: str):
    """
    Escape route for the infinite loop stressor. An intelligent agent will skip the redirect loop
    and query the primary registry directly.
    """
    apply_chaos(response)
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
    stateful_inventory["stock_count"] = 100
    return {"status": "success", "message": "Call counters reset."}

