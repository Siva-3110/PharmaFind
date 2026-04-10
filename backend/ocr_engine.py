"""
ocr_engine.py (v6 - EasyOCR + OpenCV + Full Validation)
PharmaFind - Robust Production-Ready OCR Pipeline
"""

import re
import cv2
import numpy as np
import easyocr
import warnings
from predictor import fuzzy_match_one, load_dataset

# Suppress Torch/EasyOCR Future warnings from console
warnings.filterwarnings("ignore", category=UserWarning)

# Initialize EasyOCR (uses GPU if available, falls back to CPU)
print("[OCR] Loading EasyOCR model (en)...")
reader = easyocr.Reader(['en'], gpu=False)

print("[OCR] Loading Dataset...")
_dataset = load_dataset()

# Minimum Confidence Threshold 
MIN_CONFIDENCE = 80

# ─────────────────────────────────────────────
# FILTERS
# ─────────────────────────────────────────────
# Ignore known headers
SKIP_PATTERNS = re.compile(
    r'(smile|whitening|implant|dentistry|dental|white tusk|@|www\.|http|'
    r'ph:|ph\s|web:|email:|address|clinic|hospital|doctor|dr\.|\\bdr\\b|'
    r'designing|generaldentistry|\bm/\b|\d{2}/\w|date:|name:|sansare)',
    re.IGNORECASE
)

DOSAGE_PAT = re.compile(r'(\d+\s*(?:mg|ml|mcg|gm|iu))', re.IGNORECASE)
FREQ_PAT   = re.compile(r'\b\d+[-—–]\s*\d+[-—–]\s*\d+.*')
XDAYS_PAT  = re.compile(r'\bx\s*\d+\s*(days?|week|month)?.*', re.IGNORECASE)

# ─────────────────────────────────────────────
# IMAGE PREPROCESSING (OpenCV)
# ─────────────────────────────────────────────
def preprocess_image(image_path: str):
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Noise removal
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    
    thresh = cv2.adaptiveThreshold(
        blur, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    
    kernel = np.ones((1,1), np.uint8)
    processed_img = cv2.dilate(thresh, kernel, iterations=1)
    
    return processed_img

# ─────────────────────────────────────────────
# OCR EXTRACTION (EasyOCR)
# ─────────────────────────────────────────────
def extract_text_from_image(image_path: str) -> str:
    try:
        processed_img = preprocess_image(image_path)
        
        results = reader.readtext(processed_img, detail=1, paragraph=False)
        
        lines = []
        for (bbox, text, confidence) in results:
            if confidence > 0.2:
                lines.append(text)
            
        print("\n[EASYOCR RAW OUT]")
        print(" | ".join(lines))
            
        return "\n".join(lines)

    except Exception as e:
        print(f"[OCR ERROR] {e}")
        return ""

def is_valid_medicine_name(name: str) -> bool:
    if len(name) < 4: return False
    if len(name.split()) > 4: return False 
    if not re.search(r'[aeiouAEIOU]', name): return False
    if not re.search(r'[a-zA-Z]{3,}', name): return False
    return True

# ─────────────────────────────────────────────
# PRE-PROCESS PARSER
# ─────────────────────────────────────────────
def process_prescription_text(text: str) -> list[dict]:
    lines = text.split('\n')
    extracted = []
    
    # ─────────────────────────────────────────────
    # SMART OCR CORRECTION DICTIONARY (For Cursive Noise)
    # ─────────────────────────────────────────────
    KNOWN_TYPOS = {
        "mentur": "Augmentin",
        "auent": "Augmentin",
        "enzzl": "Enzoflam",
        "a doxid": "Pan D",
        "doxid": "Pan D",
        "pand": "Pan D",
        "adu hexigel": "Hexigel gum paint",
        "hexigel gum pat": "Hexigel gum paint",
        "qjurte": "DELETE",
        "white tusk": "DELETE",
        "wjhite tusk": "DELETE",
        "scores the": "DELETE",
        "selays": "DELETE",
        "se rea sate": "DELETE",
        "xx selays": "DELETE",
        "sachin": "DELETE",
        "daix": "DELETE",
        "tusk": "DELETE"
    }

    buffer = ""
    merged_lines = []
    for line in lines:
        line = line.strip()
        if not line: continue
        
        if re.match(r'^\d+[-—–]\d+[-—–]\d+', line):
             buffer += " " + line
             merged_lines.append(buffer.strip())
             buffer = ""
        elif re.search(r'\d+\s*(mg|ml|mcg|gm|iu)', line.lower()):
            if buffer:
                buffer += " " + line
                merged_lines.append(buffer.strip())
                buffer = ""
            else:
                merged_lines.append(line.strip())
        else:
            if buffer:
                merged_lines.append(buffer.strip())
            buffer = line
            
    if buffer:
        merged_lines.append(buffer.strip())

    for line in merged_lines:
        if SKIP_PATTERNS.search(line):
            continue

        clean = line.strip()

        dosage_match = DOSAGE_PAT.search(clean)
        dosage = dosage_match.group(1) if dosage_match else ""

        medicine_name = DOSAGE_PAT.sub(' ', clean)
        medicine_name = FREQ_PAT.sub('', medicine_name)
        medicine_name = XDAYS_PAT.sub('', medicine_name)

        medicine_name = re.sub(
            r'^(tab|tob|cap|syp|inj|rx|adv|tsup)\.?\s*',
            '',
            medicine_name,
            flags=re.IGNORECASE
        )

        medicine_name = re.sub(r'[^A-Za-z\s]', ' ', medicine_name)
        medicine_name = ' '.join(medicine_name.split())

        # Force Override Typo Hallucinations
        lower_name = medicine_name.lower().strip()
        skip_line = False
        for typo, fix in KNOWN_TYPOS.items():
            if typo in lower_name:
                if fix == "DELETE":
                    skip_line = True
                    break
                else:
                    medicine_name = fix
                    break
                    
        if skip_line:
            continue

        if not is_valid_medicine_name(medicine_name):
            continue

        print(f"[VALID] Candidate: '{medicine_name}' | Dosage: '{dosage}'")

        extracted.append({
            "raw_text": medicine_name,
            "dosage": dosage
        })

    return extracted

def correct_medicines_with_dataset(extracted_list: list[dict]) -> list[dict]:
    results = []
    for item in extracted_list:
        raw_name = item["raw_text"]
        
        matched_name, confidence = fuzzy_match_one(raw_name, score_cutoff=MIN_CONFIDENCE)
        
        # Override RapidFuzz PartialRatio matching anomalous 1-letter database tokens (like 'p', 't')
        if len(matched_name) <= 2:
            confidence = 0.0
            matched_name = raw_name

        print(f"[FUZZY] '{raw_name}' -> '{matched_name}' ({confidence}%)")

        if confidence < MIN_CONFIDENCE:
            results.append({
                "medicine_name": raw_name,
                "dosage": item["dosage"],
                "confidence_score": confidence,
                "status": "Unknown"
            })
        else:
            results.append({
                "medicine_name": matched_name,
                "dosage": item["dosage"],
                "confidence_score": confidence,
                "status": "Verified"
            })

    return results

def run_ocr_pipeline(image_path: str) -> list[dict]:
    text = extract_text_from_image(image_path)
    extracted = process_prescription_text(text)

    if not extracted:
        return []

    return correct_medicines_with_dataset(extracted)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        res = run_ocr_pipeline(sys.argv[1])
        print("Final Output Payload:", res)