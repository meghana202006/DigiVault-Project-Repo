"""
What do this file do?
Imagine the frontend sends a large video in 100 small "lego pieces" (chunks).
1-Wait for the signal: It sits and waits until File 1 says, "I have all 100 pieces!"
2-The Glue: It opens a new file and "glues" all those pieces together in the right order (0, 1, 2...).
3-The Result: It creates one single, full-size video or document on the disk.
4-The Hand-off: Once the file is whole, it tells the Manager: "The file is ready! Start the scanning process now."
"""
import os
import redis
import time
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# --- CONFIGURATION FROM .env ---
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)

# Path where chunks are currently stored (must match fetch.py)
CHUNKS_DIR = os.getenv('SCANNER_TEMP_PATH', "/tmp/scanner/raw")
# Path where the assembled whole file will be stored for scanning
ACTIVE_SCAN_DIR = "/tmp/scanner/active"

# Initialize Redis client
redis_client = redis.StrictRedis(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    password=REDIS_PASSWORD, 
    decode_responses=True
)

# Ensure the active scanning directory exists
os.makedirs(ACTIVE_SCAN_DIR, exist_ok=True)

def assemble_file():
    """
    Watches the 'assembly_queue' for completed chunk sets and 
    merges them into a single file for the scanners.
    """
    print(f"[*] Assembler service started. Monitoring queue...")
    
    while True:
        # Wait for a file_id to appear in the assembly queue
        _, file_id = redis_client.blpop("assembly_queue")
        
        try:
            print(f"[*] Starting assembly for File ID: {file_id}")
            status_key = f"status:{file_id}"
            redis_client.hset(status_key, "state", "ASSEMBLING")
            
            chunk_dir = os.path.join(CHUNKS_DIR, file_id)
            
            # Fetch the total number of chunks we expect
            total_chunks_raw = redis_client.hget(status_key, "total_chunks")
            if not total_chunks_raw:
                raise Exception(f"Metadata missing for {file_id}")
            
            total_chunks = int(total_chunks_raw)
            
            # Define the final path for the reassembled file
            # We use the file_id to keep the name unique
            final_file_path = os.path.join(ACTIVE_SCAN_DIR, f"{file_id}.tmp")
            
            # Start the merging process
            with open(final_file_path, "wb") as outfile:
                for i in range(total_chunks):
                    chunk_path = os.path.join(chunk_dir, f"{i}.part")
                    
                    if not os.path.exists(chunk_path):
                        raise Exception(f"Missing chunk {i} at {chunk_path}")
                    
                    with open(chunk_path, "rb") as infile:
                        outfile.write(infile.read())
            
            print(f"[+] Assembly complete: {final_file_path}")
            
            # Update Redis status for the frontend
            redis_client.hset(status_key, mapping={
                "state": "ASSEMBLED",
                "file_path": final_file_path
            })
            
            # Trigger the Manager (Orchestrator) to start Stage 1 & 2 (ClamAV & YARA)
            redis_client.rpush("manager_queue", file_id)

        except Exception as e:
            error_msg = f"Assembly Error: {str(e)}"
            print(f"[-] {error_msg}")
            redis_client.hset(f"status:{file_id}", mapping={
                "state": "ERROR",
                "error_details": error_msg
            })

if __name__ == "__main__":
    assemble_file()