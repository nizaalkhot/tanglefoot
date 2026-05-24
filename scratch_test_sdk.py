import time
from tanglefoot.stressor import stressor

# Decorate a test function simulating a REST endpoint
@stressor(rate_limit_prob=0.3, latency_range=(0.2, 0.8), omit_keys=["email"], drop_prob=0.1)
def get_user_data():
    return {
        "id": 42,
        "name": "Alice Smith",
        "email": "alice@tanglefoot.ai",
        "role": "Lead Architect"
    }

print("==================================================")
print("Tanglefoot SDK @stressor Chaos Verification")
print("==================================================\n")

success_count = 0
drop_count = 0
rate_limit_count = 0

for i in range(1, 11):
    t_start = time.time()
    try:
        data = get_user_data()
        elapsed = time.time() - t_start
        print(f"Call #{i:02d}: [SUCCESS] {elapsed:.3f}s - Returns: {data}")
        # Verify email is omitted and other keys are intact
        assert "email" not in data, "Key 'email' was not omitted!"
        assert "name" in data, "Key 'name' was lost!"
        success_count += 1
    except Exception as e:
        elapsed = time.time() - t_start
        error_name = type(e).__name__
        # Capture status code if FastAPI-like HTTPException
        status = getattr(e, "status_code", "N/A")
        print(f"Call #{i:02d}: [FAILURE] {elapsed:.3f}s - {error_name} (Status: {status}) - {str(e)}")
        if status == 503:
            drop_count += 1
        elif status == 429:
            rate_limit_count += 1

print("\n==================================================")
print("Execution Statistics Summary")
print("==================================================")
print(f"Total Invocations  : 10")
print(f"Successful Calls   : {success_count}")
print(f"HTTP 429 Rate Limits: {rate_limit_count}")
print(f"HTTP 503 Socket Drops: {drop_count}")
print("==================================================")
