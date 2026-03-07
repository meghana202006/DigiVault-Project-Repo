import time
import os
from triage import Client

# 1. Initialize the client
# Use your API Key, i am not able to acess the site.
API_KEY = "YOUR_API_KEY_HERE"
client = Client(API_KEY)

def scan_and_detonate(file_path):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return 0

    print(f"[*] Uploading {file_path} to Hatching Triage...")
    
    # 2. Submit the file
    with open(file_path, "rb") as f:
        sample = client.submit_sample(f)
    
    sample_id = sample['id']
    print(f"[+] File submitted! Sample ID: {sample_id}")

    # 3. Wait for the VM to finish execution
    print("[*] Waiting for VM detonation and report generation...")
    while True:
        sample_info = client.sample_by_id(sample_id)
        status = sample_info.get('status')
        
        if status == "reported":
            break
        elif status == "failed":
            print("[!] Analysis failed in the VM.")
            return 0
            
        time.sleep(10)

    # 4. Fetch the summary report
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
    
    sigs = report.get('signatures', [])
    if sigs:
        print("Detected Behaviors:")
        for s in sigs:
            print(f"- {s.get('label')}")
    print("="*30)

    # This sends the score back to triage_gatekeeper.py
    return score

# scan_and_detonate("test_file.exe")