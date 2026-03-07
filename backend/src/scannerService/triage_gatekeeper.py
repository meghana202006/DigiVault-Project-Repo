"""
What is this file doing?
1-oncurrency Management: It tracks how many files are currently being scanned in the Triage VM using a Redis counter (triage_active_count).
2-Queue Processing: It pulls file_ids from the triage_waiting_queue (where the Manager left them) only when a slot is available (< 2).
3-VM Detonation: It imports triage.py logic to upload the file and wait for the behavioral report.
4-Reporting & Cleanup: It updates the final status for the frontend and signals the system that a slot has become free, allowing the next file in line to enter.
"""
import os
import redis
import time
import threading
from dotenv import load_dotenv

# --- YOUR TRIAGE IMPORT ---
# Importing the actual detonation function from your triage.py
from scanners.triage import scan_and_detonate

load_dotenv()

# --- CONFIGURATION ---
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)

redis_client = redis.StrictRedis(
    host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, decode_responses=True
)

# Your specific rule: Only 2 files at a time for the 3rd scanner
MAX_CONCURRENT = 2
ACTIVE_COUNT_KEY = "triage_active_count"

# Initialize counter to 0 if it doesn't exist
if not redis_client.exists(ACTIVE_COUNT_KEY):
    redis_client.set(ACTIVE_COUNT_KEY, 0)

def update_status(file_id, stage, result=None):
    """Updates the Redis status for the frontend team."""
    status_key = f"status:{file_id}"
    update_data = {"current_stage": stage}
    if result:
        update_data["triage_result"] = result
    redis_client.hset(status_key, mapping=update_data)

def process_triage(file_id, file_path):
    """
    Wrapper to run the Triage scan and manage the counter.
    This runs in a separate thread for each of the 2 allowed slots.
    """
    try:
        print(f"[*] [SLOT START] Detonating {file_id} in Triage VM...")
        update_status(file_id, "TRIAGE_DETONATION_IN_PROGRESS")
        
        # Calling your actual triage.py function
        # Note: You might need to modify your triage.py to return the score/result 
        # instead of just printing it.
        result_score = scan_and_detonate(file_path)
        
        update_status(file_id, "COMPLETED", result=str(result_score))
        print(f"[+] [SLOT FINISH] Triage complete for {file_id}. Score: {result_score}")

    except Exception as e:
        print(f"[-] Triage Gatekeeper Error for {file_id}: {e}")
        update_status(file_id, "TRIAGE_ERROR", result=str(e))
    
    finally:
        # Crucial: Decrement the counter and trigger the gatekeeper to check for next in line
        redis_client.decr(ACTIVE_COUNT_KEY)
        redis_client.rpush("gatekeeper_trigger", "check")

def run_gatekeeper():
    print(f"[*] Triage Gatekeeper started. Limit: {MAX_CONCURRENT} concurrent scans.")
    
    while True:
        # We wait for a trigger (either from the Manager or from a finishing scan)
        redis_client.blpop("gatekeeper_trigger")
        
        # Check current active count
        current_active = int(redis_client.get(ACTIVE_COUNT_KEY))
        
        if current_active < MAX_CONCURRENT:
            # Try to pull the next file from the waiting queue
            file_id = redis_client.lpop("triage_waiting_queue")
            
            if file_id:
                file_path = redis_client.hget(f"status:{file_id}", "file_path")
                
                if file_path and os.path.exists(file_path):
                    # Increment counter immediately to "lock" the slot
                    redis_client.incr(ACTIVE_COUNT_KEY)
                    
                    # Start the triage scan in a background thread so the gatekeeper 
                    # can keep monitoring the second slot
                    t = threading.Thread(target=process_triage, args=(file_id, file_path))
                    t.start()
                else:
                    print(f"[-] Missing file for {file_id}, skipping Triage.")
            else:
                # Nothing in queue, just go back to waiting
                pass

if __name__ == "__main__":
    run_gatekeeper()