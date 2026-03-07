# this file alone start all the python script at onces when you run the backend npm run dev.

import subprocess
import sys
import time
import signal
import os

# --- CONFIGURATION ---
# List of all your service files
# Ensure these are in the same directory as mainRunner.py
services = [
    "fetch.py",
    "assembler.py",
    "manager.py",
    "triage_gatekeeper.py",
    "sendStatus.py",
    "cleanup_service.py"
]

processes = []

def check_redis():
    """Simple check to see if Redis is reachable before starting."""
    try:
        import redis
        from dotenv import load_dotenv
        load_dotenv()
        r = redis.StrictRedis(
            host=os.getenv('REDIS_HOST', '127.0.0.1'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            password=os.getenv('REDIS_PASSWORD', None),
            socket_timeout=1
        )
        r.ping()
        print("[*] Redis Connection: OK")
        return True
    except Exception as e:
        print(f"[-] Error: Could not connect to Redis. {e}")
        print("[!] Please ensure Redis is running before starting the services.")
        return False

def start_services():
    print(f"[*] Starting {len(services)} Python background services...")
    for service in services:
        try:
            # Start each service as a separate background process
            # Use sys.executable to ensure we use the same environment
            p = subprocess.Popen([sys.executable, service])
            processes.append(p)
            print(f"[+] Started: {service} (PID: {p.pid})")
        except Exception as e:
            print(f"[-] Failed to start {service}: {e}")

def signal_handler(sig, frame):
    print("\n[*] Stopping all Python services...")
    for p in processes:
        p.terminate()
        p.wait() # Ensure they are fully closed
    print("[*] All services stopped. Goodbye!")
    sys.exit(0)

if __name__ == "__main__":
    # Handle Ctrl+C (SIGINT) to stop everything cleanly
    signal.signal(signal.SIGINT, signal_handler)
    
    # 1. Check Redis first
    if check_redis():
        # 2. Launch the fleet
        start_services()
        
        # 3. Keep the master script alive
        print("[!] All systems go. Press Ctrl+C to stop everything.")
        while True:
            # Check if any process died unexpectedly
            for p in processes:
                if p.poll() is not None:
                    print(f"[!] Warning: One of the services has stopped unexpectedly.")
            time.sleep(5)