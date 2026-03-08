# this file alone start all the python script at onces when you run the backend npm run dev.

import subprocess
import sys
import time
import signal
import os

# --- PATH LOGIC ---
# Get the absolute path of the folder where mainRunner.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Force the script to treat the scannerService folder as the starting point
os.chdir(BASE_DIR)

services = [
    "fetch.py",
    "assembler.py",
    "manager.py",
    "triage_gatekeeper.py",
    "sendStatus.py",
    "cleanUpService.py"
]

processes = []

def check_redis():
    try:
        import redis
        from dotenv import load_dotenv
        # Look for .env in current folder, then try one folder up
        if not load_dotenv(os.path.join(BASE_DIR, ".env")):
            load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

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
        print(f"[-] Redis Error: {e}")
        return False

def start_services():
    print(f"[*] Starting Python services from: {BASE_DIR}")
    for service in services:
        try:
            # We build the FULL path to the file to avoid "File Not Found" errors
            full_path = os.path.join(BASE_DIR, service)
            
            # Explicitly set the 'cwd' (Current Working Directory) for the subprocess
            p = subprocess.Popen([sys.executable, full_path], cwd=BASE_DIR)
            processes.append(p)
            print(f"[+] Launched: {service} (PID: {p.pid})")
        except Exception as e:
            print(f"[-] Failed to start {service}: {e}")

def signal_handler(sig, frame):
    print("\n[*] Stopping all services...")
    for p in processes:
        p.terminate()
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    
    if check_redis():
        start_services()
        print("[!] All systems operational. Press Ctrl+C to stop.")
        while True:
            for i, p in enumerate(processes):
                if p.poll() is not None:
                    print(f"[!] Warning: {services[i]} has stopped (Exit code: {p.returncode})")
            time.sleep(10)