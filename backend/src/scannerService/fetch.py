"""
The do this file do ?
this is the entry point of this backend for data to get in python scanner.
Listens to Redis wait for the React frontend to push a "chunk" of data.
Organizes Storage: For every new file, it creates a unique temporary folder on the disk.
Saves Chunks: It writes each binary chunk into that folder immediately. This keeps the system's RAM usage low, even for large files.
Tracks Progress: it updates a Redis "Status Hash" so the frontend can see that the file is currently being received.
Signals Completion: Once it sees the "final chunk" flag, it notifies the next step in the flow.
"""
import os
import redis
import json
import base64
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# --- CONFIGURATION FROM .env ---
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
# You can change this path to any folder you prefer
CHUNKS_DIR = os.getenv('SCANNER_TEMP_PATH', "/tmp/scanner/raw")

# Initialize Redis client with your .env settings
redis_client = redis.StrictRedis(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    password=REDIS_PASSWORD, 
    decode_responses=True
)

os.makedirs(CHUNKS_DIR, exist_ok=True)

def start_fetching():
    print(f"[>] Fetcher service started. Storing chunks in: {CHUNKS_DIR}")
    
    while True:
        # Blocking pop: waits for data from the React frontend
        _, message = redis_client.blpop("file_chunks_queue")
        
        try:
            data = json.loads(message)
            file_id = data['file_id']
            chunk_index = data['chunk_index']
            total_chunks = data['total_chunks']
            is_final = data.get('is_final', False)
            
            # Use the file_id to create a unique sub-folder
            save_path = os.path.join(CHUNKS_DIR, file_id)
            os.makedirs(save_path, exist_ok=True)
            
            chunk_filename = os.path.join(save_path, f"{chunk_index}.part")
            
            chunk_data = data['binary_data']
            with open(chunk_filename, "wb") as f:
                # Decode Base64 if the frontend sends it as a string
                if isinstance(chunk_data, str):
                    f.write(base64.b64decode(chunk_data))
                else:
                    f.write(chunk_data)
            
            # Status update for the frontend: Tracking RECEIVING progress
            status_key = f"status:{file_id}"
            redis_client.hset(status_key, mapping={
                "state": "RECEIVING",
                "received_chunks": chunk_index + 1,
                "total_chunks": total_chunks
            })

            # Check if we are done with this file
            if is_final or (chunk_index + 1 == total_chunks):
                print(f"[+] File {file_id} received. Moving to Assembly stage.")
                redis_client.hset(status_key, "state", "READY_TO_ASSEMBLE")
                # Notify the next file in the pipeline
                redis_client.rpush("assembly_queue", file_id)

        except Exception as e:
            print(f"[-] Fetcher Error: {str(e)}")
            continue

if __name__ == "__main__":
    start_fetching()