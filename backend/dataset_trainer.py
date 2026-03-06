"""
dataset_trainer.py
PharmaFind – Medicine Dataset Preparation Pipeline

Run this once to process Medicine_Details 1.csv and save a pickle file
for fast loading in the OCR and prediction engines.

Usage:
    python dataset_trainer.py
"""

import re
import pickle
import pandas as pd
from pathlib import Path

DATASET_PATH = Path("data/Medicine_Details 1.csv")
OUTPUT_PATH  = Path("data/processed_medicine_data.pkl")


# ─────────────────────────────────────────────
# 1. LOAD DATASET
# ─────────────────────────────────────────────
def load_dataset(path: Path = DATASET_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    # Standardise column names (strip spaces)
    df.columns = [c.strip() for c in df.columns]
    print(f"[TRAINER] Loaded {len(df)} medicines from {path}")
    return df


# ─────────────────────────────────────────────
# 2. TEXT CLEANING
# ─────────────────────────────────────────────
REMOVE_WORDS = re.compile(
    r'\b(tablet|tablets|cap|capsule|capsules|syrup|injection|'
    r'cream|gel|drops|lotion|ointment|solution|suspension|'
    r'inhaler|spray|sachet|powder|liquid|forte|plus|sr|er|'
    r'mr|xr|od|ds|xl|pr|junior|sugar\s*free|readymix)\b',
    re.IGNORECASE
)
REMOVE_DOSAGE  = re.compile(r'\d+(\.\d+)?\s*(mg|ml|mcg|iu|gm|%|w/w|w/v)', re.IGNORECASE)
REMOVE_SPECIAL = re.compile(r'[^a-z\s]')


def clean_text(text: str) -> str:
    """Lowercase → strip dosage → strip form words → strip non-alpha → trim."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = REMOVE_DOSAGE.sub(' ', text)
    text = REMOVE_WORDS.sub(' ', text)
    text = REMOVE_SPECIAL.sub(' ', text)
    return re.sub(r'\s+', ' ', text).strip()


# ─────────────────────────────────────────────
# 3. EXTRACT GENERIC DRUGS FROM COMPOSITION
# ─────────────────────────────────────────────
SPLIT_COMP = re.compile(r'\+|,|;')

def extract_generics(composition: str) -> list[str]:
    """
    Input:  'Amoxycillin (500mg) + Clavulanic Acid (125mg)'
    Output: ['amoxycillin', 'clavulanic acid']
    """
    if not isinstance(composition, str):
        return []
    parts = SPLIT_COMP.split(composition)
    generics = []
    for part in parts:
        cleaned = clean_text(part)
        if cleaned and len(cleaned) > 2:
            generics.append(cleaned)
    return generics


# ─────────────────────────────────────────────
# 4. BUILD MASTER MEDICINE LIST
# ─────────────────────────────────────────────
def build_master_list(df: pd.DataFrame) -> list[str]:
    """
    Combines:
    - All cleaned medicine names
    - All extracted generic drug names from Composition
    Returns a deduplicated sorted list.
    """
    # Clean medicine names
    medicine_names_raw = df['Medicine Name'].dropna().tolist()
    medicine_names_clean = [clean_text(n) for n in medicine_names_raw]

    # Raw (uncleaned) medicine names for fuzzy matching — keep originals too
    medicine_names_orig = [n.strip() for n in medicine_names_raw if isinstance(n, str)]

    # Extract generics from Composition column
    compositions = df['Composition'].dropna().tolist()
    generics = []
    for comp in compositions:
        generics.extend(extract_generics(comp))

    # Combine all
    all_terms = set()
    for name in medicine_names_orig:
        all_terms.add(name)                # original casing e.g. "Augmentin 625 Duo Tablet"
    for name in medicine_names_clean:
        if name:
            all_terms.add(name)            # cleaned e.g. "augmentin duo"
    for g in generics:
        if g:
            all_terms.add(g)               # generics e.g. "amoxycillin"

    master_list = sorted(all_terms)
    print(f"[TRAINER] Master list: {len(master_list)} unique terms "
          f"({len(medicine_names_orig)} medicine names + {len(set(generics))} generics)")
    return master_list


# ─────────────────────────────────────────────
# 5. SAVE PROCESSED DATA
# ─────────────────────────────────────────────
def save_processed_data(df: pd.DataFrame, master_list: list[str], medicine_names: list[str], output: Path = OUTPUT_PATH):
    data = {
        "dataframe": df,
        "master_medicine_list": master_list,       # 21K+ terms (names + generics)
        "medicine_names_list": medicine_names,      # ~11K names only — used for fast OCR fuzzy match
    }
    with open(output, "wb") as f:
        pickle.dump(data, f)
    print(f"[TRAINER] Saved processed data → {output}  ({output.stat().st_size // 1024} KB)")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("PharmaFind – Dataset Trainer")
    print("=" * 50)

    df = load_dataset()

    # Add clean_medicine_name column
    df["clean_medicine_name"] = df["Medicine Name"].apply(clean_text)

    # Build master list
    master_list = build_master_list(df)

    # Build smaller medicine-names-only list for fast fuzzy matching
    medicine_names = sorted({n.strip() for n in df["Medicine Name"].dropna().tolist() if isinstance(n, str) and len(n.strip()) > 2})
    print(f"[TRAINER] Medicine names list: {len(medicine_names)} entries")

    # Save both
    save_processed_data(df, master_list, medicine_names)

    print("\n[TRAINER] Sample master list entries:")
    for entry in master_list[:10]:
        print(f"  • {entry}")

    print("\n[TRAINER] ✅ Training complete!")
    print(f"[TRAINER]    Output: {OUTPUT_PATH}")
    print(f"[TRAINER]    Total medicines: {len(df)}")
    print(f"[TRAINER]    Master list size: {len(master_list)}")
