import random
import time
import functools
from typing import List, Tuple, Any, Dict

# Try to import fastapi for native support if present
try:
    from fastapi import HTTPException
except ImportError:
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail
            super().__init__(detail)

def stressor(
    rate_limit_prob: float = 0.0,
    latency_range: Tuple[float, float] = None,
    omit_keys: List[str] = None,
    drop_prob: float = 0.0
):
    """
    Decorator to dynamically inject chaotic engineering stress into standard Python
    or FastAPI endpoints (network delays, connection drops, rate-limiting, and key omission).
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # 1. Simulate Latency Jitter
            if latency_range and len(latency_range) == 2:
                sleep_s = random.uniform(latency_range[0], latency_range[1])
                time.sleep(sleep_s)
                
            # 2. Simulate Connection Drops (HTTP 503)
            if drop_prob > 0.0 and random.random() < drop_prob:
                raise HTTPException(
                    status_code=503,
                    detail="Service Unavailable - Tanglefoot SDK injected drop failure."
                )
                
            # 3. Simulate Rate Limits (HTTP 429)
            if rate_limit_prob > 0.0 and random.random() < rate_limit_prob:
                raise HTTPException(
                    status_code=429,
                    detail="Too Many Requests - Tanglefoot SDK rate-limiting backpressure active."
                )
                
            # Execute actual function
            result = func(*args, **kwargs)
            
            # 4. Simulate Key Omission
            if omit_keys and result:
                if isinstance(result, dict):
                    # Shallow copy to avoid mutating cache / global data unexpectedly
                    result = dict(result)
                    for key in omit_keys:
                        result.pop(key, None)
                elif hasattr(result, "__dict__"):
                    # For custom classes / object types
                    for key in omit_keys:
                        if hasattr(result, key):
                            delattr(result, key)
                            
            return result
        return wrapper
    return decorator


# =====================================================================
# Programmatic Outbound Network-Level Interceptor (Requests Library Hook)
# =====================================================================
_original_request = None

def enable_network_proxy_interceptor(
    drop_prob: float = 0.0,
    rate_limit_prob: float = 0.0,
    latency_range: Tuple[float, float] = None
):
    """
    Monkey-patches the popular 'requests' library outbound request pipeline.
    Simulates real network-level proxies (e.g. Toxiproxy) intercepting calls dynamically
    without changing any user/agent source code.
    """
    global _original_request
    import requests
    
    if _original_request is None:
        _original_request = requests.api.request

    def proxy_request(method, url, **kwargs):
        # 1. Latency simulation
        if latency_range and len(latency_range) == 2:
            delay = random.uniform(latency_range[0], latency_range[1])
            time.sleep(delay)
            
        # 2. Network connection drop simulation
        if drop_prob > 0.0 and random.random() < drop_prob:
            # Simulate requests ConnectionError
            raise requests.exceptions.ConnectionError(
                "Tanglefoot Programmable Proxy: Intercepted outbound network socket drop."
            )
            
        # 3. Rate limiting HTTP status override
        if rate_limit_prob > 0.0 and random.random() < rate_limit_prob:
            mock_res = requests.Response()
            mock_res.status_code = 429
            mock_res.url = url
            mock_res._content = b'{"error":"Too Many Requests - Proxy Rate Limit Simulator Active"}'
            return mock_res
            
        return _original_request(method, url, **kwargs)
        
    requests.api.request = proxy_request
    requests.request = proxy_request
    print("[Tanglefoot SDK] Network-level proxy interceptor ACTIVATED successfully.")

def disable_network_proxy_interceptor():
    """Restores original requests library bindings."""
    global _original_request
    import requests
    if _original_request is not None:
        requests.api.request = _original_request
        requests.request = _original_request
        print("[Tanglefoot SDK] Network-level proxy interceptor DEACTIVATED.")


# =====================================================================
# Stateful Mutators (Database & Cache Simulator)
# =====================================================================
class StatefulDBCacheMutator:
    """
    Stateful mutator testing harness.
    Allows simulating database dirty reads, race conditions, or connection corruption
    mid-flight, ensuring agent persistence memory is hardened.
    """
    def __init__(self, dirty_read_prob: float = 0.0, db_corruption_prob: float = 0.0):
        self.dirty_read_prob = dirty_read_prob
        self.db_corruption_prob = db_corruption_prob
        self.stale_states: Dict[str, Any] = {}

    def mutate_state(self, state_key: str, current_value: Any) -> Any:
        """
        Simulates race conditions or cache dirty reads.
        Randomly returns a stale previously cached state instead of the current value.
        """
        # If DB corruption triggered, raise database error
        if self.db_corruption_prob > 0.0 and random.random() < self.db_corruption_prob:
            raise RuntimeError("DatabaseConnectionError: Lost transactional lock - dirty connection pool.")
            
        if self.dirty_read_prob > 0.0 and random.random() < self.dirty_read_prob:
            if state_key in self.stale_states:
                stale_val = self.stale_states[state_key]
                # Update cache with current for next cycles
                self.stale_states[state_key] = current_value
                print(f"[Tanglefoot Stateful Mutator] Dirty read simulated on '{state_key}' returning stale: {stale_val}")
                return stale_val
                
        # Cache current value
        self.stale_states[state_key] = current_value
        return current_value
