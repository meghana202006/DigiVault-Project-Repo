import subprocess

def scan_with_clamav(file_path):
    try:
        result = subprocess.run(
            ['clamscan', '--no-summary', file_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        output = result.stdout.strip()
        error_output = result.stderr.strip() # We are capturing the hidden error now!
        
        if result.returncode == 0:
            return {"engine": "ClamAV", "safe": True, "threats": []}
        elif result.returncode == 1:
            threat = output.split(': ')[-1].replace(' FOUND', '')
            return {"engine": "ClamAV", "safe": False, "threats": [threat]}
        else:
            # This will print EXACTLY why ClamAV failed
            return {
                "engine": "ClamAV", 
                "safe": False, 
                "error": f"ClamAV Code {result.returncode} | Output: {output} | Error: {error_output}"
            }

    except FileNotFoundError:
        return {"engine": "ClamAV", "safe": False, "error": "ClamAV is not installed or not in PATH"}