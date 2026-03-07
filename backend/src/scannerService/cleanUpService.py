"""
What is this file doing?
1-Queue Listening: It monitors the cleanup_queue in Redis. It only acts when sendStatus.py confirms the user has received their results.
2-Chunk Deletion: It recursively deletes the folder containing the original Lego-like pieces (chunks) from the disk.
3-Active File Deletion: It removes the reassembled, unencrypted file from the scanning directory.
4-Redis Housekeeping: It deletes the status:{file_id} hash from Redis so your memory doesn't get cluttered with old scan reports.
"""
import os
import shutil
import redis
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# --- CONFIGURATION FROM .env ---
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)

# Paths used by fetch.py and assembler.py
CHUNKS_DIR = os.getenv('SCANNER_TEMP_PATH', "/tmp/scanner/raw")
ACTIVE_SCAN_DIR = "/tmp/scanner/active"

# Initialize Redis client
redis_client = redis.StrictRedis(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    password=REDIS_PASSWORD, 
    decode_responses=True
)

def start_cleanup_service():
    """
    Background worker that wipes all temporary unencrypted data
    after the scan results have been delivered to the frontend.
    """
    print("[*] Cleanup Service started. Watching 'cleanup_queue'...")
    
    while True:
        # Blocking pop: waits for a file_id to be ready for deletion
        _, file_id = redis_client.blpop("cleanup_queue")
        
        try:
            print(f"[*] Starting purge for File ID: {file_id}")
            
            # 1. Delete the raw chunks folder
            chunk_path = os.path.join(CHUNKS_DIR, file_id)
            if os.path.exists(chunk_path):
                shutil.rmtree(chunk_path, ignore_errors=True)
                print(f"[+] Deleted chunks for {file_id}")

            # 2. Delete the reassembled unencrypted file
            # We fetch the path from the status before we delete the status
            status_key = f"status:{file_id}"
            assembled_file = os.path.join(ACTIVE_SCAN_DIR, f"{file_id}.tmp")
            
            if os.path.exists(assembled_file):
                os.remove(assembled_file)
                print(f"[+] Deleted active file: {assembled_file}")

            # 3. Final Step: Clear the Redis status to free up memory
            # We wait a few seconds to ensure the React frontend has finished its final read
            redis_client.delete(status_key)
            print(f"[+] Redis records for {file_id} wiped. Job Complete.")

        except Exception as e:
            print(f"[-] Cleanup Error for {file_id}: {str(e)}")

if __name__ == "__main__":
    start_cleanup_service()