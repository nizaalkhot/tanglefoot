import asyncio
import json
import websockets

async def test_live_run():
    uri = "ws://localhost:8005/ws"
    print(f"Connecting to live Tanglefoot WebSocket at {uri}...")
    
    async with websockets.connect(uri) as websocket:
        print("Connected successfully!")
        
        # Trigger an execution run payload
        payload = {
            "action": "run",
            "agent": "react_baseline",
            "task": "task_1"
        }
        
        print(f"Sending trigger payload: {payload}")
        await websocket.send(json.dumps(payload))
        
        print("\nStreaming live execution logs from subprocess:")
        print("==================================================")
        
        success_received = False
        try:
            # We expect to receive multiple streamed log frame messages
            while True:
                msg = await websocket.recv()
                data = json.loads(msg)
                
                log_type = data.get("type", "INFO").upper()
                timestamp = data.get("timestamp", "00:00.0")
                message = data.get("message", "")
                
                # Safe print with fallbacks for character map restrictions
                print(f"[{log_type}] {timestamp} - {message}")
                
                # Check for success completion tag
                if log_type == "SUCCESS" and "subprocess completed" in message.lower():
                    success_received = True
                    break
        except asyncio.TimeoutError:
            print("[TIMEOUT] Stopped receiving logs.")
        except Exception as e:
            print(f"[ERROR] Exception during message reception: {e}")
            
        print("==================================================")
        if success_received:
            print("\n[SUCCESS] Subprocess run completed and streamed over WebSocket perfectly!")
        else:
            print("\n[FAILURE] WebSocket run did not complete or stream expected outputs.")

if __name__ == "__main__":
    asyncio.run(test_live_run())
