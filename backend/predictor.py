"""
predictor.py
PharmaFind – Medicine Prediction Engine

Functions:
    load_dataset()           → loads processed pickle or raw CSV
    clean_text(text)         → cleans OCR text
    fuzzy_match(word, n)     → fuzzy-match an OCR word against master list
    predict_missing_medicine(db, known_medicines) → frequency-based prediction
"""

import re
import pickle
import os
from pathlib import Path
from collections import Counter

from rapidfuzz import process, fuzz
from sqlalchemy.orm import Session

# ─────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────
PICKLE_PATH  = Path("data/processed_medicine_data.pkl")
CSV_FALLBACK = Path("data/Medicine_Details 1.csv")


# ─────────────────────────────────────────────
# 1. LOAD DATASET
# ─────────────────────────────────────────────
_cache = {}   # simple in-memory cache so we only load once

def load_dataset() -> dict:
    """
    Returns a dict with keys:
      - 'master_medicine_list' : list[str]
      - 'dataframe'            : pd.DataFrame
    Tries pickle first; falls back to CSV.
    """
    if _cache:
        return _cache

    if PICKLE_PATH.exists():
        with open(PICKLE_PATH, "rb") as f:
            data = pickle.load(f)
        print(f"[PREDICTOR] Loaded from pickle: {len(data['master_medicine_list'])} terms")
    else:
        # Fallback: build on-the-fly from CSV
        print("[PREDICTOR] Pickle not found — building from CSV (slower)...")
        import pandas as pd
        from dataset_trainer import build_master_list, load_dataset as _load, clean_text as _clean
        df = _load()
        df["clean_medicine_name"] = df["Medicine Name"].apply(_clean)
        master_list = build_master_list(df)
        data = {"dataframe": df, "master_medicine_list": master_list}

    _cache.update(data)
    return _cache


# ─────────────────────────────────────────────
# 2. CLEAN TEXT
# ─────────────────────────────────────────────
REMOVE_DOSAGE  = re.compile(r'\d+(\.\d+)?\s*(mg|ml|mcg|iu|gm|%|w/w|w/v)', re.IGNORECASE)
REMOVE_FORMS   = re.compile(
    r'\b(tablet|tablets|cap|capsule|syrup|injection|cream|gel|drops|'
    r'ointment|solution|suspension|inhaler|spray|sachet|powder|forte|'
    r'plus|sr|er|mr|xr|od|ds|xl|pr|junior)\b', re.IGNORECASE
)
REMOVE_SPECIAL = re.compile(r'[^a-z0-9\s]')

def clean_text(text: str) -> str:
    """Full pipeline: lowercase → strip dosage → strip form words → strip specials → trim."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = REMOVE_DOSAGE.sub(' ', text)
    text = REMOVE_FORMS.sub(' ', text)
    text = REMOVE_SPECIAL.sub(' ', text)
    return re.sub(r'\s+', ' ', text).strip()


# ─────────────────────────────────────────────
# 3. FUZZY MATCH
# ─────────────────────────────────────────────
def fuzzy_match(ocr_word: str, top_n: int = 1, score_cutoff: int = 40):
    """
    Fuzzy-match an OCR word/phrase against the medicine names list (~11K entries).
    Uses medicine_names_list (not full master list) for speed.

    Returns list of (matched_name, score) tuples, or [] if no match.
    """
    data = load_dataset()
    # Use the FULL master_medicine_list because it contains the pure generic names
    # (e.g. "paracetamol"). If we only use "medicine_names_list", a word like "Paracetaml"
    # gets blocked from matching "Paracetamol 500mg Tablet" because it's too long!
    match_list = data["master_medicine_list"]

    cleaned = clean_text(ocr_word)
    query = cleaned if cleaned else ocr_word
    q_len = len(query)

    # Pre-filter match_list so 'Paracetamol' (11 chars) doesn't get compared to 
    # 'StayHappi Chlorzoxazone+Diclofenac+Paracetamol 500mq/50mq/325mq Tab' (67 chars)
    # We only check medicines where the length is within +/- 40% of our query length,
    # or +/- 6 characters, whichever is larger.
    tolerance = max(6, int(q_len * 0.4))
    min_len = q_len - tolerance
    max_len = q_len + tolerance
    
    filtered_list = [m for m in match_list if min_len <= len(m) <= max_len]
    
    # If the filtered list is empty for some reason, fallback to the full list
    target_list = filtered_list if filtered_list else match_list

    results = process.extract(
        query,
        target_list,
        scorer=fuzz.WRatio,       # WRatio is best for missing letters (Cetirzine -> Cetirizine), length filter protects it
        limit=top_n,
        score_cutoff=50,
    )
    return [(r[0], round(r[1], 2)) for r in results]


def fuzzy_match_one(ocr_word: str, score_cutoff: int = 50):
    """
    Returns (best_match, confidence_score) or (raw_input, 0.0) if nothing found.
    """
    matches = fuzzy_match(ocr_word, top_n=1, score_cutoff=score_cutoff)
    if matches:
        return matches[0][0], matches[0][1]
    return ocr_word, 0.0   # keep raw OCR text instead of "Unknown"


# ─────────────────────────────────────────────
# 4. PREDICT MISSING MEDICINE
# ─────────────────────────────────────────────
def predict_unknown_medicine(db: Session, known_medicines: list[str], top_n: int = 5) -> list[dict]:
    """
    Frequency-based prediction:
    1. Query all prescriptions that contain at least one known medicine.
    2. Find which OTHER medicines appear most frequently alongside them.
    3. Return the top N suggestions with confidence % based on frequency.

    Args:
        db              : SQLAlchemy DB session
        known_medicines : list of already-identified medicine names
        top_n           : how many suggestions to return

    Returns:
        list of { 'medicine_name': str, 'frequency': int, 'confidence': float }
    """
    if not known_medicines:
        return []

    # Import models here to avoid circular imports
    import models

    # Find all prescription IDs that contain any known medicine
    matching_prescriptions = (
        db.query(models.ExtractedMedicine.prescription_id)
        .filter(models.ExtractedMedicine.medicine_name.in_(known_medicines))
        .distinct()
        .all()
    )
    prescription_ids = [row[0] for row in matching_prescriptions]

    if not prescription_ids:
        return []

    # Get ALL medicines from those prescriptions (excluding already known ones)
    co_occurring = (
        db.query(models.ExtractedMedicine.medicine_name)
        .filter(
            models.ExtractedMedicine.prescription_id.in_(prescription_ids),
            ~models.ExtractedMedicine.medicine_name.in_(known_medicines),
            models.ExtractedMedicine.medicine_name != "Unknown",
            models.ExtractedMedicine.medicine_name != "",
        )
        .all()
    )

    if not co_occurring:
        return []

    # Count frequency
    freq_counter = Counter(row[0] for row in co_occurring)
    total_count  = sum(freq_counter.values())

    predictions = []
    for medicine_name, freq in freq_counter.most_common(top_n):
        confidence = round((freq / total_count) * 100, 1)
        predictions.append({
            "medicine_name": medicine_name,
            "frequency": freq,
            "confidence": confidence,
        })

    return predictions
