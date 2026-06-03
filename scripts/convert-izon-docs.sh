#!/usr/bin/env bash
# Convert all Izon lesson notes (PDF + DOCX) + the dictionary PDF to plain text
# in scripts/.cache/izon-docs-text/ so the audit script can ingest them.
set -euo pipefail
SRC="/Users/tamaraadokeme/Projects/beeli/userio-docs"
OUT="/Users/tamaraadokeme/Projects/beeli/scripts/.cache/izon-docs-text"
mkdir -p "$OUT"

cd "$SRC"
shopt -s nullglob

# PDFs (lesson notes + dictionary + colours pdf) — anything mentioning izon/ịzọn
for f in *.pdf; do
  base=$(basename "$f" .pdf)
  out="$OUT/${base}.txt"
  [ -f "$out" ] && [ "$out" -nt "$f" ] && continue
  pdftotext -layout "$f" "$out" 2>/dev/null && echo "pdf  → $out"
done

# DOCX (extract <w:t> text)
for f in *.docx; do
  base=$(basename "$f" .docx)
  out="$OUT/${base}.txt"
  [ -f "$out" ] && [ "$out" -nt "$f" ] && continue
  unzip -p "$f" word/document.xml 2>/dev/null \
    | sed -E 's#</w:p>#\n#g; s#<[^>]+>##g' \
    > "$out" && echo "docx → $out"
done

echo "Total: $(ls "$OUT" | wc -l) files in $OUT"
