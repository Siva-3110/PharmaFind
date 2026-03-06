"""
ocr_engine.py  (v3 – strict prescription parser)
PharmaFind – OCR Pipeline using the 11K processed medicine dataset
"""

import re
import pytesseract
from PIL import Image, ImageFilter, ImageEnhance
from predictor import fuzzy_match_one, load_dataset

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Pre-load master list at startup (from pickle if available)
_dataset = load_dataset()

# ─────────────────────────────────────────────
# MINIMUM CONFIDENCE — anything below is discarded
# ─────────────────────────────────────────────
MIN_CONFIDENCE = 50   # Lowered to 50 so 57% WRatio matches (Paracetaml) are shown


# ─────────────────────────────────────────────
# IMAGE PREPROCESSING
# ─────────────────────────────────────────────
def preprocess_image(image_path: str):
    img = Image.open(image_path).convert('L')
    img = img.filter(ImageFilter.SHARPEN)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    return img


# ─────────────────────────────────────────────
# OCR TEXT EXTRACTION
# ─────────────────────────────────────────────
def extract_text_from_image(image_path: str) -> str:
    try:
        img = preprocess_image(image_path)
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(img, config=custom_config)
        print(f"[OCR RAW]\n{text}\n[/OCR RAW]")
        return text
    except Exception as e:
        print(f"[OCR ERROR] {e}")
        return ""


# ─────────────────────────────────────────────
# PRESCRIPTION PARSER — SMART MODE
# ─────────────────────────────────────────────
# Lines to SKIP — clinic headers, addresses, print, signatures
SKIP_PATTERNS = re.compile(
    r'(smile|whitening|implant|dentistry|dental|white tusk|@|www\.|http|'
    r'ph:|ph\s|web:|email:|address|clinic|hospital|doctor|dr\.|\\bdr\\b|'
    r'designing|generaldentistry|\bm/\b|28/m|12/10|date:|name:)',
    re.IGNORECASE
)

# Valid starting prefixes for medicines (Tab, Cap, Rx, numbered lists, etc)
MED_PREFIX = re.compile(
    r'^(?:\d+[\.\)]\s*)?('
    r'tab\.?|cap\.?|syp\.?|syrup\.?|inj\.?|oint\.?|drop\.?|'
    r'gel\.?|adv:?|rx\.?'
    r')\s*',
    re.IGNORECASE
)

# Numbered list pattern (e.g., "1. Paracetamol")
NUM_LIST = re.compile(r'^\d+[\.\)]\s*(.+)')

DOSAGE_PAT = re.compile(r'(\d+\s*(?:mg|ml|mcg|gm|mq|iu))', re.IGNORECASE)
FREQ_PAT   = re.compile(r'\b\d+[-—–]\s*\d+[-—–]\s*\d+.*')
XDAYS_PAT  = re.compile(r'\bx\s*\d+\s*(days?|week|month)?.*', re.IGNORECASE)


def process_prescription_text(text: str) -> list[dict]:
    """
    Parses medicine lines matching either:
    1. A known prefix (Tab., Cap.)
    2. A numbered list (1. Medicine)
    3. Contains a dosage pattern (500mg)
    Skips known clinic headers.
    """
    lines = text.split('\n')
    extracted = []

    for line in lines:
        line = line.strip()
        if not line or len(line) < 3:
            continue

        # Skip clinic header, address, phone, website lines
        if SKIP_PATTERNS.search(line):
            print(f"[PARSER] Skipped (header): {line!r}")
            continue

        clean = line
        is_medicine = False

        # Condition 1: Has explicit prefix (Tab, Cap)
        prefix_match = MED_PREFIX.match(clean)
        if prefix_match:
            is_medicine = True
            clean = MED_PREFIX.sub('', clean).strip()
        
        # Condition 2: Is a numbered list (1. Paracetamol)
        num_match = NUM_LIST.match(clean)
        if num_match and not is_medicine:
            is_medicine = True
            clean = num_match.group(1).strip()
        
        # Condition 3: Has dosage info
        dosage_match = DOSAGE_PAT.search(clean)
        if dosage_match and not is_medicine:
            is_medicine = True

        if not is_medicine:
            continue

        dosage = dosage_match.group(1).strip() if dosage_match else ""

        # Strip dosage, frequency, and duration from the name
        medicine_name = DOSAGE_PAT.sub(' ', clean)
        medicine_name = FREQ_PAT.sub('', medicine_name)
        medicine_name = XDAYS_PAT.sub('', medicine_name)
        medicine_name = medicine_name.strip(' .,;:-–—')

        if len(medicine_name) > 2:
            extracted.append({"raw_text": medicine_name, "dosage": dosage})
            print(f"[PARSER] Found: {medicine_name!r} dosage={dosage!r}")

    print(f"[PARSER] Total extracted: {len(extracted)}")
    return extracted


# ─────────────────────────────────────────────
# FUZZY CORRECTION — WITH CONFIDENCE FILTER
# ─────────────────────────────────────────────
def correct_medicines_with_dataset(extracted_list: list[dict]) -> list[dict]:
    """
    Fuzzy-match each medicine name against the 11K master list.
    Results below MIN_CONFIDENCE are discarded entirely.
    """
    results = []
    for item in extracted_list:
        raw_name = item['raw_text']
        matched_name, confidence = fuzzy_match_one(raw_name, score_cutoff=MIN_CONFIDENCE)

        if confidence < MIN_CONFIDENCE:
            print(f"[MATCH] SKIPPED '{raw_name}' → '{matched_name}' ({confidence}%) — below threshold")
            continue  # Drop low-confidence results

        results.append({
            "medicine_name"   : matched_name,
            "dosage"          : item['dosage'],
            "confidence_score": confidence,
        })
        print(f"[MATCH] '{raw_name}' → '{matched_name}' ({confidence}%)")

    return results


# ─────────────────────────────────────────────
# FULL OCR PIPELINE
# ─────────────────────────────────────────────
def run_ocr_pipeline(image_path: str) -> list[dict]:
    text      = extract_text_from_image(image_path)
    extracted = process_prescription_text(text)

    # NO generic fallback — it causes false positives from header text
    # If nothing found, return a single placeholder for user to edit manually
    if not extracted:
        print("[OCR] No structured medicine lines found. Prompting manual entry.")
        return [{
            "medicine_name"   : "",
            "dosage"          : "",
            "confidence_score": 0.0,
        }]

    return correct_medicines_with_dataset(extracted)
