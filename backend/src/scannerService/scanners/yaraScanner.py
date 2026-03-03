import yara
import os

# Load the rules once when the app starts (saves time)
RULES_DIR = os.path.join(os.path.dirname(__file__), '../rules/malicious.yar')
try:
    compiled_rules = yara.compile(RULES_DIR)
except Exception as e:
    print(f"Warning: YARA rules not found or invalid at {RULES_DIR}")
    compiled_rules = None

def scan_with_yara(file_path):
    if not compiled_rules:
        return {"engine": "YARA", "safe": True, "error": "No rules loaded"}
    
    try:
        matches = compiled_rules.match(file_path)
        if matches:
            # If it finds a match, it's malicious
            threats = [match.rule for match in matches]
            return {"engine": "YARA", "safe": False, "threats": threats}
        
        return {"engine": "YARA", "safe": True, "threats": []}
    except Exception as e:
        return {"engine": "YARA", "safe": False, "error": str(e)}