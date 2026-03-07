"""
What is this file doing?
1-React Communication: It provides a simple API endpoint that the React frontend calls every few seconds (polling) using the file_id.
2-Data Retrieval: It reads the "Status Hash" from Redis that has been updated by the Fetcher, Assembler, Manager, and Gatekeeper.
3-JSON Formatting: It gathers the results from ClamAV, YARA, and Triage, and packages them into a clean JSON format that the frontend can easily display.
4-Cleanup Trigger: once it sends the "COMPLETED" status to the frontend, it signals the next file (Cleanup Service) to delete the unencrypted temporary data.
"""
import os
import redis
import json
from flask import Flask, jsonify
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

app = Flask(__name__)

# --- CONFIGURATION FROM .env ---
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)

# Initialize Redis client
redis_client = redis.StrictRedis(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    password=REDIS_PASSWORD, 
    decode_responses=True
)

@app.route('/scan-status/<file_id>', methods=['GET'])
def get_scan_status(file_id):
    """
    The main endpoint for the React frontend to poll for updates.
    """
    status_key = f"status:{file_id}"
    
    # 1. Check if the job actually exists in Redis
    if not redis_client.exists(status_key):
        return jsonify({"error": "Scan job not found"}), 404
    
    # 2. Pull all progress and result data
    scan_data = redis_client.hgetall(status_key)
    current_stage = scan_data.get("current_stage", "UNKNOWN")

    # 3. Construct the response for the frontend
    # We parse the JSON strings we saved earlier in the Manager
    response = {
        "file_id": file_id,
        "status": current_stage,
        "progress": {
            "chunks_received": scan_data.get("received_chunks"),
            "total_chunks": scan_data.get("total_chunks")
        },
        "results": {
            "clamav": json.loads(scan_data.get("clamav_result", "{}")),
            "yara": json.loads(scan_data.get("yara_result", "{}")),
            "triage_score": scan_data.get("triage_result", "Pending")
        }
    }

    # 4. Handle Final State and Cleanup Trigger
    # Once the scan is 'COMPLETED', we signal the cleanup service to wipe the unencrypted data
    if current_stage == "COMPLETED" or "ERROR" in current_stage:
        print(f"[!] Scan for {file_id} is finished. Triggering cleanup.")
        # Push to the cleanup queue for File 6
        redis_client.rpush("cleanup_queue", file_id)

    return jsonify(response)

if __name__ == "__main__":
    # Runs on port 5001 to keep the main API port free
    app.run(host='0.0.0.0', port=5001)