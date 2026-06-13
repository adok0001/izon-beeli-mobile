#!/usr/bin/env python3
"""
Link English wordbank entries to Ịzọn translations drawn from the
Williamson & Blench *Dictionary of Kolokuma Ịzọn* PDF.

The PDF is an Ịzọn→English dictionary; we build a reverse index
(English gloss → Ịzọn headword) and find a translation for every
ENGLISH_WORDBANK entry that does not yet have an Ịzọn entry linked
via `englishWordId`.

Prints ready-to-paste `e(...)` lines for appending to izon.ts.

Run:  python3 mobile/scripts/link-izon-to-wordbank.py
"""
import re
from pathlib import Path
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextBox, LTChar, LTTextLine

ROOT = Path(__file__).parent.parent
PDF_PATH = ROOT.parent / "userio-docs" / "Izon dictionary.pdf"
IZON_TS = ROOT / "lib" / "data" / "izon.ts"
ENGLISH_TS = ROOT / "lib" / "data" / "english.ts"

POS_RE = re.compile(
    r"^(v\.(?:t|i|a|cs|p|loc)|n\.(?:f|m\.f|pl)|p\.n|n|a|id|excl|conj|adv|indf|dem|emph|pron|quant)\."
)

STOP = {"the", "a", "an", "of", "to", "for", "in", "on", "with", "or", "and",
        "kind", "type", "sort", "esp", "usu", "see", "cf", "etc", "spp"}


def extract_text_with_fonts(pdf_path):
    for page_layout in extract_pages(str(pdf_path)):
        for element in page_layout:
            if not isinstance(element, LTTextBox):
                continue
            for line in element:
                if not isinstance(line, LTTextLine):
                    continue
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


def parse_entries(pdf_path):
    entries, hw, df = [], None, ""
    for text, is_bold in extract_text_with_fonts(pdf_path):
        t = text.strip()
        if not t:
            continue
        if is_bold:
            if hw and df.strip():
                entries.append((hw, df.strip()))
            hw, df = t, ""
        else:
            df += " " + t
    if hw and df.strip():
        entries.append((hw, df.strip()))
    return entries


def clean_headword(word):
    word = re.sub(r"[¹²³⁴⁵⁶⁷⁸⁹]+$", "", word)
    word = re.sub(r"\s*\[\d+\]\s*$", "", word)
    return word.strip("-–—").strip()


def gloss_after_pos(definition):
    """Return the English gloss text with the POS marker stripped."""
    d = definition.strip()
    # skip a leading frequency marker like "[2]" or "[5]"
    d = re.sub(r"^\[\d+\]\s*", "", d)
    m = POS_RE.match(d)
    if not m:
        return None
    return d[m.end():].strip()


def senses(gloss):
    """Split a gloss into individual sense phrases, cleaned."""
    # drop bracketed scientific / cross-ref content
    g = re.sub(r"\([^)]*\)", "", gloss)
    g = re.sub(r"\[[^\]]*\]", "", g)
    out = []
    for part in re.split(r"[;,:]", g):
        p = part.strip().strip(".").strip()
        # cut at example sentences (capitalised Ịzọn text is hard to detect;
        # use a length cap and drop very long descriptive senses)
        p = re.sub(r"\s+", " ", p)
        if p and len(p) <= 40:
            out.append(p)
    return out


def tokens(s):
    return [w for w in re.findall(r"[a-z]+", s.lower()) if w not in STOP]


def load_existing_izon():
    text = IZON_TS.read_text(encoding="utf-8")
    words = re.findall(r'e\(\d+,\s*"([^"]+)"', text)
    linked = set(re.findall(r'"(ew-\d+)"', text))
    max_id = max(int(n) for n in re.findall(r"e\((\d+),", text))
    return {w.lower() for w in words}, linked, max_id


def load_wordbank():
    text = ENGLISH_TS.read_text(encoding="utf-8")
    rows = re.findall(r'w\("(ew-\d+)",\s*"([^"]+)",\s*"([^"]+)"', text)
    return rows  # (id, word, category)


def category_for(pos_marker):
    pos = (pos_marker or "").rstrip(".")
    if pos.startswith("v"):
        return "verbs"
    if pos == "a" or pos == "id":
        return "adjectives"
    if pos in ("excl", "conj", "adv", "indf", "dem", "emph"):
        return "phrases"
    if pos == "pron":
        return "pronouns"
    if pos == "quant":
        return "numbers"
    return "nouns"


def main():
    existing_words, linked_ids, max_id = load_existing_izon()
    print(f"// existing izon headwords: {len(existing_words)}, "
          f"linked ew ids: {len(linked_ids)}, max d-id: {max_id}")

    raw = parse_entries(PDF_PATH)

    # Build reverse index: sense phrase -> list of (headword, score_quality, posmarker)
    exact_index = {}   # sense phrase (lower) -> (headword, posmarker)
    token_index = {}   # single token -> list of (headword, posmarker, n_tokens_in_sense)
    for hw_raw, definition in raw:
        gloss = gloss_after_pos(definition)
        if not gloss:
            continue
        hw = clean_headword(hw_raw)
        if not hw or len(hw) <= 1:
            continue
        posm = POS_RE.match(re.sub(r"^\[\d+\]\s*", "", definition.strip())).group(1)
        for sense in senses(gloss):
            key = sense.lower()
            exact_index.setdefault(key, (hw, posm))
            toks = tokens(sense)
            if len(toks) == 1:
                token_index.setdefault(toks[0], []).append((hw, posm, len(toks)))

    wordbank = load_wordbank()
    next_id = max_id + 1
    lines = []
    matched = 0
    for ew_id, word, wb_cat in wordbank:
        if ew_id in linked_ids:
            continue
        key = word.lower()
        hit = None
        if key in exact_index:
            hit = exact_index[key]
        elif key in token_index:
            # prefer shortest headword among single-token senses
            cands = sorted(token_index[key], key=lambda c: len(c[0]))
            hit = (cands[0][0], cands[0][1])
        if not hit:
            continue
        hw, posm = hit
        if hw.lower() in existing_words:
            # headword already in dictionary; skip to avoid duplicate headword
            continue
        cat = category_for(posm)
        # keep the wordbank's own category when it is more specific than nouns
        if wb_cat in ("family", "body", "food", "animals", "time", "numbers",
                      "occupations", "money", "market"):
            cat = wb_cat
        esc = lambda s: s.replace('"', '\\"')
        lines.append(
            f'  e({next_id}, "{esc(hw)}", "{esc(word)}", "{cat}", '
            f'undefined, undefined, undefined, "{ew_id}"),'
        )
        existing_words.add(hw.lower())
        next_id += 1
        matched += 1

    print(f"// matched {matched} new izon entries")
    out = ROOT / "scripts" / "out" / "izon-wordbank-links.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"// written {out}")


if __name__ == "__main__":
    main()
