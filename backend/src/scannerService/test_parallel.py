import os
import time
import concurrent.futures

# Make sure these import names match your exact file names!
from scanners.clamScanner import scan_with_clamav
from scanners.yaraScanner import scan_with_yara

def run_parallel_scan(file_path):
    print(f"\n🔍 Starting Parallel Scan for: {file_path}")
    
    # Start a timer to prove it's running in parallel
    start_time = time.time()

    # The ThreadPoolExecutor runs our functions at the exact same time
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # 1. Dispatch the jobs
        future_clam = executor.submit(scan_with_clamav, file_path)
        future_yara = executor.submit(scan_with_yara, file_path)
        
        # 2. Wait for both to finish and grab the results
        clam_result = future_clam.result()
        yara_result = future_yara.result()
        
    end_time = time.time()
    
    print(f"⏱️ Scans completed in {end_time - start_time:.2f} seconds")
    print(f"🛡️ ClamAV Result: {clam_result}")
    print(f"🛡️ YARA Result:   {yara_result}")
    
    # If either scanner says "safe: False", the whole file is bad.
    is_safe = clam_result["safe"] and yara_result["safe"]
    print(f"🎯 FINAL VERDICT: {'✅ SAFE' if is_safe else '🚨 MALICIOUS - DESTROY FILE'}")

# --- SETUP TEST FILES ---
safe_file = "safe_parallel.txt"
with open(safe_file, "w", encoding="utf-8") as f:
    f.write("Just a normal, happy file going about its day.")

bad_file = "bad_parallel.txt"
with open(bad_file, "w", encoding="utf-8") as f:
    # We put BOTH viruses in this file!
    f.write(r"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*")
    f.write("\nDIGIVAULT_MALWARE_TEST_STRING")

# --- RUN TESTS ---
print("=========================================")
run_parallel_scan(safe_file)
print("=========================================")
run_parallel_scan(bad_file)
print("=========================================")

# Cleanup
os.remove(safe_file)
os.remove(bad_file)