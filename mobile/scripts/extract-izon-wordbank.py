#!/usr/bin/env python3
"""
Extract entries from the Williamson & Blench Dictionary of Kolokuma Ịzọn PDF.
Produces two output files:
  out/english-wordbank.json   — English wordbank entries
  out/izon-new-entries.json   — New Ịzọn dictionary entries
"""
import re
import json
import sys
from pathlib import Path
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextBox, LTChar, LTTextLine

PDF_PATH = Path(__file__).parent.parent.parent / "userio-docs" / "Izon dictionary.pdf"
OUT_DIR = Path(__file__).parent / "out"
IZON_TS = Path(__file__).parent.parent / "lib" / "data" / "izon.ts"

# Part-of-speech → DictionaryCategory mapping
POS_CATEGORY = {
    "n": "nouns",
    "n.f": "nouns",
    "n.m.f": "nouns",
    "n.pl": "nouns",
    "p.n": "nouns",
    "v.t": "verbs",
    "v.i": "verbs",
    "v.a": "verbs",
    "v.cs": "verbs",
    "v.p": "verbs",
    "v.loc": "verbs",
    "v": "verbs",
    "a": "adjectives",
    "id": "adjectives",
    "excl": "phrases",
    "conj": "phrases",
    "adv": "phrases",
    "indf": "phrases",
    "dem": "phrases",
    "emph": "phrases",
    "pron": "pronouns",
    "quant": "numbers",
}

POS_TYPE = {
    "nouns": "noun",
    "verbs": "verb",
    "adjectives": "adjective",
    "phrases": "phrase",
    "pronouns": "pronoun",
    "numbers": "number",
}

# POS regex: matches things like "n.", "v.t.", "v.i.", "id.", "excl.", "a.", etc.
POS_RE = re.compile(
    r"^(v\.(?:t|i|a|cs|p|loc)|n\.(?:f|m\.f|pl)|p\.n|n|a|id|excl|conj|adv|indf|dem|emph|pron|quant)\."
)

# Skip pure cross-reference entries
SKIP_RE = re.compile(r"^\s*(?:see|=|cf\.)\s", re.IGNORECASE)


def load_existing_izon_words() -> set:
    """Parse existing izon.ts to get all headwords already present."""
    text = IZON_TS.read_text(encoding="utf-8")
    words = re.findall(r'e\(\d+,\s*"([^"]+)"', text)
    return {w.lower() for w in words}


def extract_text_with_fonts(pdf_path: Path):
    """
    Yield (text_chunk, is_bold) tuples from the PDF.
    Bold = headword, regular = definition.
    """
    for page_layout in extract_pages(str(pdf_path)):
        for element in page_layout:
            if not isinstance(element, LTTextBox):
                continue
            for line in element:
                if not isinstance(line, LTTextLine):
                    continue
                # Collect characters, grouping by bold/non-bold runs
                current_bold = None
                current_text = ""
                for char in line:
                    if isinstance(char, LTChar):
                        is_bold = "Bold" in char.fontname or "bold" in char.fontname
                        if is_bold != current_bold and current_text.strip():
                            yield current_text, current_bold
                            current_text = ""
                        current_bold = is_bold
                        current_text += char.get_text()
                    elif hasattr(char, "get_text"):
                        current_text += char.get_text()
                if current_text.strip():
                    yield current_text, current_bold


def clean_gloss(text: str) -> str:
    """Extract the primary English gloss from definition text."""
    text = text.strip()
    # Remove leading POS marker
    text = POS_RE.sub("", text).strip()
    # Take only first segment (before ; or newline)
    text = re.split(r"[;\n]", text)[0].strip()
    # Remove trailing example sentence reference in bold brackets
    text = re.sub(r"\[.*?\]$", "", text).strip()
    # Remove parenthetical scientific/cross-ref content
    text = re.sub(r"\s*\([A-Za-z=].*?\)\s*$", "", text).strip()
    # Remove any remaining parenthetical groups
    text = re.sub(r"\s*\(.*?\)", "", text).strip()
    # Truncate at cross-reference markers
    text = re.split(r"\s*\(=", text)[0].strip()
    text = re.split(r"\s*\[=", text)[0].strip()
    # Remove trailing punctuation
    text = text.rstrip(".,;:").strip()
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text)
    # Trim to reasonable length
    if len(text) > 200:
        text = text[:200].rsplit(" ", 1)[0]
    return text


def get_pos_and_category(definition_start: str):
    """Return (category, posType) from the start of a definition."""
    definition_start = definition_start.strip()
    m = POS_RE.match(definition_start)
    if not m:
        return "nouns", "noun"
    pos_key = m.group(1).rstrip(".")
    cat = POS_CATEGORY.get(pos_key, "nouns")
    return cat, POS_TYPE.get(cat, "noun")


def parse_entries(pdf_path: Path):
    """
    Parse the PDF into (headword, definition_text) pairs.
    Strategy: bold text = headword candidate, following non-bold = definition.
    """
    entries = []
    pending_headword = None
    pending_def = ""

    for text, is_bold in extract_text_with_fonts(pdf_path):
        text_stripped = text.strip()
        if not text_stripped:
            continue

        if is_bold:
            # Flush previous entry
            if pending_headword and pending_def.strip():
                entries.append((pending_headword, pending_def.strip()))
            pending_headword = text_stripped
            pending_def = ""
        else:
            pending_def += " " + text_stripped

    # Flush last entry
    if pending_headword and pending_def.strip():
        entries.append((pending_headword, pending_def.strip()))

    return entries


def clean_headword(word: str) -> str:
    """Normalise headword: remove superscript numbers, leading/trailing space."""
    # Remove trailing superscript digits (¹²³⁴⁵ or plain 1-5 after word)
    word = re.sub(r"[¹²³⁴⁵⁶⁷⁸⁹]+$", "", word)
    word = re.sub(r"\s*\[\d+\]\s*$", "", word)
    # Remove leading/trailing dashes used for affixes
    word = word.strip("-–—").strip()
    return word.strip()


def is_valid_entry(headword: str, definition: str) -> bool:
    if not headword or not definition:
        return False
    # Skip single-character headwords (likely extraction artifacts)
    if len(headword) <= 1:
        return False
    # Skip entries that are all caps (section headers like "A", "B")
    if headword.isupper() and len(headword) <= 3:
        return False
    # Skip headwords that are just punctuation or numbers
    if re.match(r"^[\d\W]+$", headword):
        return False
    # Skip pure cross-references
    if SKIP_RE.match(definition):
        return False
    # Must have a POS marker in the definition to be a real entry
    if not POS_RE.search(definition):
        return False
    return True


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading existing Ịzọn words...")
    existing = load_existing_izon_words()
    print(f"  {len(existing)} existing entries to skip")

    print(f"Extracting from {PDF_PATH.name}...")
    raw_entries = parse_entries(PDF_PATH)
    print(f"  {len(raw_entries)} raw bold/regular pairs found")

    english_wordbank = []  # {id, word, definition, category, posType}
    izon_new = []          # {id, word, english, category, englishWordId}

    ew_id = 1
    d_id = 1064  # Continue from last existing entry

    seen_english = {}  # word.lower() → ew_id string (deduplicate wordbank)
    seen_izon = set(existing)

    for headword_raw, definition in raw_entries:
        headword = clean_headword(headword_raw)
        if not is_valid_entry(headword, definition):
            continue

        category, pos_type = get_pos_and_category(definition)
        gloss = clean_gloss(definition)
        if not gloss or len(gloss) < 3:
            continue
        # Skip if gloss starts with non-alpha (artifact like "(=" )
        if not re.match(r"^[a-zA-Z]", gloss):
            continue

        # Deduplicate English wordbank by normalised English gloss
        gloss_key = gloss.lower()
        if gloss_key not in seen_english:
            ew_entry_id = f"ew-{ew_id}"
            seen_english[gloss_key] = ew_entry_id
            english_wordbank.append({
                "id": ew_entry_id,
                "word": gloss,
                "definition": None,
                "category": category,
                "posType": pos_type,
            })
            ew_id += 1
        english_word_id = seen_english[gloss_key]

        # Only add Ịzọn entry if headword not already in izon.ts
        if headword.lower() not in seen_izon:
            izon_new.append({
                "id": f"d{d_id}",
                "word": headword,
                "english": gloss,
                "category": category,
                "englishWordId": english_word_id,
            })
            seen_izon.add(headword.lower())
            d_id += 1

    print(f"  {len(english_wordbank)} English wordbank entries")
    print(f"  {len(izon_new)} new Ịzọn dictionary entries")

    with open(OUT_DIR / "english-wordbank.json", "w", encoding="utf-8") as f:
        json.dump(english_wordbank, f, ensure_ascii=False, indent=2)
    print(f"  Written: out/english-wordbank.json")

    with open(OUT_DIR / "izon-new-entries.json", "w", encoding="utf-8") as f:
        json.dump(izon_new, f, ensure_ascii=False, indent=2)
    print(f"  Written: out/izon-new-entries.json")

    print("Done.")


if __name__ == "__main__":
    main()
