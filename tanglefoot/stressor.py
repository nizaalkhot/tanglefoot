import random
import time
import functools
from typing import List, Tuple, Any

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
