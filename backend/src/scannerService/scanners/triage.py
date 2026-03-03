import time
from triage import Client

# 1. Initialize the client
# my ip got block i don't knwo why, can you use your account to get api
API_KEY = "YOUR_API_KEY_HERE"
client = Client(API_KEY)

def scan_and_detonate(file_path):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    print(f"[*] Uploading {file_path} to Hatching Triage...")
    
    # 2. Submit the file
    # Use 'submit_sample' as the standard method for local files
    with open(file_path, "rb") as f:
        # We pass the file handle directly
        sample = client.submit_sample(f)
    
    sample_id = sample['id']
    print(f"[+] File submitted! Sample ID: {sample_id}")

    # 3. Wait for the VM to finish execution
    print("[*] Waiting for VM detonation and report generation...")
    while True:
        # In the official API, sample_by_id returns a dictionary
        sample_info = client.sample_by_id(sample_id)
        status = sample_info.get('status')
        
        if status == "reported":
            break
        elif status == "failed":
            print("[!] Analysis failed in the VM.")
            return
            
        time.sleep(10)

    # 4. Fetch the summary report
    # 'sample_get_summary' provides the score and behavioral tags
    report = client.sample_get_summary(sample_id)
    score = report.get('score', 0)
    
    print("\n" + "="*30)
    print(f"RESULTS FOR: {os.path.basename(file_path)}")
    print(f"Malware Score: {score}/10")
    
    if score >= 8:
        print("STATUS: [DANGER] Malicious behavior detected.")
    elif score >= 4:
        print("STATUS: [WARNING] Suspicious activity found.")
    else:
        print("STATUS: [CLEAN] No threats detected.")
    
    # Signatures are more detailed than tags for vulnerability research
    sigs = report.get('signatures', [])
    if sigs:
        print("Detected Behaviors:")
        for s in sigs:
            print(f"- {s.get('label')}")
    print("="*30)

# Example usage
scan_and_detonate("File anem with it extntion")