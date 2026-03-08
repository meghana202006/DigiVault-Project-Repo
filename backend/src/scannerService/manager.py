"""
What is this file doing?
1-Parallel Start: It triggers the ClamAV and YARA scanners at the exact same time.
2-The "Waiting Room": Once those are done, it checks if there are already 2 files being scanned by Triage.
(i have set the limit to 2 file at a time scanning)
3-The Gatekeeper: If a slot is free, it sends the file to Triage. If 2 files are already there, it puts this file in a "Waiting" list in Redis.
4-Final Report: It gathers all 3 results and updates the Redis status for the React team.
"""
import os
import redis
import json
import threading
from dotenv import load_dotenv

# --- YOUR SCANNER IMPORTS ---
# Importing the actual functions from your scanner files
from scanners.clamScanner import scan_with_clamav
from scanners.yaraScanner import scan_with_yara

load_dotenv()

# --- CONFIGURATION ---
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)

redis_client = redis.StrictRedis(
    host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, decode_responses=True
)

# TRIAGE LIMIT: Managed by the Gatekeeper (File 4/7)
MAX_TRIAGE_CONCURRENT = 2

def update_status(file_id, stage, result=None):
    """Updates the Redis status for the frontend ."""
    status_key = f"status:{file_id}"
    update_data = {"current_stage": stage}
    if result:
        # result is a dictionary containing scanner outputs
        update_data.update({k: json.dumps(v) for k, v in result.items()})
    redis_client.hset(status_key, mapping=update_data)

def run_manager():
    print("[*] Scan Manager started. Monitoring 'manager_queue'...")
    
    while True:
        # 1. Wait for the Assembler to say a file is ready
        _, file_id = redis_client.blpop("manager_queue")
        
        try:
            file_path = redis_client.hget(f"status:{file_id}", "file_path")
            if not file_path or not os.path.exists(file_path):
                print(f"[-] Error: File path for {file_id} invalid or missing.")
                continue

            print(f"[*] Processing Scan for: {file_id}")
            update_status(file_id, "STAGE_1_AND_2_START")

            # --- PHASE 1: PARALLEL SCANS (ClamAV & YARA) ---
            results = {}

            def run_clam():
                print(f"[*] Starting ClamAV for {file_id}...")
                results['clamav'] = scan_with_clamav(file_path)

            def run_yara():
                print(f"[*] Starting YARA for {file_id}...")
                results['yara'] = scan_with_yara(file_path)

            # Creating threads for parallel execution
            t1 = threading.Thread(target=run_clam)
            t2 = threading.Thread(target=run_yara)

            t1.start()
            t2.start()

            # Wait for both local scanners to finish
            t1.join()
            t2.join()

            print(f"[+] Local scans complete for {file_id}")
            update_status(file_id, "STAGE_1_2_COMPLETE", {
                "clamav_result": results.get('clamav'),
                "yara_result": results.get('yara')
            })

            # --- PHASE 2: SEQUENTIAL SCAN (TRIAGE WITH LIMIT) ---
            # Instead of running it now, we put it in a 'Triage Waiting Queue'
            # The Triage Gatekeeper (File 4/7) will pull from here based on the 2-file limit.
            print(f"[*] Moving {file_id} to Triage Waiting Queue...")
            update_status(file_id, "WAITING_FOR_TRIAGE_SLOT")
            
            # Record that this file is ready for the VM scan
            redis_client.rpush("triage_waiting_queue", file_id)

            # Trigger the Gatekeeper to check if one of the 2 slots is free
            redis_client.rpush("gatekeeper_trigger", "check")

        except Exception as e:
            print(f"[-] Manager Error: {str(e)}")
            update_status(file_id, "MANAGER_ERROR", {"error": str(e)})

if __name__ == "__main__":
    run_manager()