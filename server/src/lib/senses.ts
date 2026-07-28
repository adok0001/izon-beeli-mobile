/**
 * A dictionary headword's meanings are stored two ways at once: as
 * `dictionary_senses` rows (one per meaning) and as the flat
 * `dictionary_entries.english` string those rows project back to. Same
 * arrangement as `translations` / `english` — the flat column stays because it
 * is `notNull`, it is what search, quizzes and CSV export read, and roughly 120
 * call sites would otherwise need rewriting at once.
 *
 * `parseSenses` is the reader (flat → rows, used by the backfill and by any
 * write that still arrives as one `;`-delimited string) and `projectSenses` is
 * the writer (rows → flat). They must stay inverses.
 *
 * Duplicated from `mobile/lib/dictionary.ts` because the API deploys from
 * `server/` alone and has no path alias into the app. `__tests__/senses.test.ts`
 * runs both implementations over the same corpus fixtures to catch drift.
 */

/** A single dictionary sense: the gloss plus an optional disambiguation note. */
export interface Sense {
  /** The meaning itself, e.g. "to call". */
  text: string;
  /** Parenthetical disambiguation pulled out of the meaning, e.g. "of humans". */
  note?: string;
}

/** Combining diacritics — see the `;` rule in {@link parseSenses}. */
const COMBINING_MARK = /[̀-ͯ]/;

/**
 * A trailing `(…)` is a disambiguation only when whitespace separates it from
 * the gloss. Abutting the previous word it is inflectional morphology that
 * belongs *in* the gloss — `"corrugated iron sheet(s)"`, `"guerrilla war(fare)"`,
 * `"handcuff(s)"` — and lifting it out produced the gloss "corrugated iron
 * sheet" with the note "s".
 */
const TRAILING_NOTE = /^(.*\S)\s+\(([^()]*)\)$/;

/**
 * Parse a `;`-delimited English field into discrete senses.
 *
 * Splits only on semicolons at parenthesis depth 0, so a note that itself
 * contains a semicolon — e.g. `"And (conjunction; consonant phoneme m)"` —
 * stays intact as one sense.
 */
export function parseSenses(raw: string): Sense[] {
  const parts: string[] = [];
  const chars = [...raw];
  let depth = 0;
  let current = "";
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === ";" && depth === 0) {
      // 15 corpus entries carry a combining mark typed *after* its semicolon
      // (`bịdẹ́ àbaaraí;̣ B. hang…` for `…àbaaraị́;`). Splitting on the `;` would
      // orphan the mark at the head of the next sense, where it renders on
      // whatever letter follows. Pull it back onto the sense it belongs to.
      while (i + 1 < chars.length && COMBINING_MARK.test(chars[i + 1])) {
        current += chars[(i += 1)];
      }
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const match = p.match(TRAILING_NOTE);
      return match ? { text: match[1], note: match[2].trim() } : { text: p };
    });
}

/**
 * The flat `english` column a sense list projects back to — the inverse of
 * {@link parseSenses}.
 *
 * Round-trips byte-identically over 99.34% of the live corpus; the remainder
 * differs only by whitespace the parser normalizes (a space before a `;`, an
 * empty trailing sense).
 */
export function projectSenses(senses: Sense[]): string {
  return senses
    .map((s) => {
      const text = s.text.trim();
      const note = s.note?.trim();
      if (!note) return text;
      return text ? `${text} (${note})` : `(${note})`;
    })
    .filter(Boolean)
    .join("; ");
}

/**
 * The normalized form of a flat gloss column — what `english` becomes once the
 * sense rows are the source of truth.
 *
 * Differs from the stored string on 78 of 12,299 entries, always by whitespace
 * the split has to normalize anyway: a space before a `;`, a doubled `;`, a
 * trailing one.
 */
export function canonicalGloss(raw: string): string {
  return projectSenses(parseSenses(raw));
}

/**
 * Whether the sense split loses anything, as opposed to merely tidying.
 *
 * Normalization is expected and harmless, so comparing the projection against
 * the raw string flags 78 false positives. What must not happen is a projection
 * that parses back into *different senses* — a lost gloss, a note swallowed, a
 * split that moves with each pass. So the test is that the round trip reaches a
 * fixed point: canonicalize twice, and nothing further may change.
 */
export function isLossyGloss(raw: string): boolean {
  const once = canonicalGloss(raw);
  return canonicalGloss(once) !== once;
}

/** `dictionary_entries.english` is varchar(500). `dictionary_senses.gloss` is not. */
export const GLOSS_COLUMN_LIMIT = 500;

/**
 * Add an approved meaning to a headword's gloss list.
 *
 * Both contribution-approval routes built this by hand as
 * `` english.includes(x) ? english : `${english}; ${x}` ``, which got two things
 * wrong. `includes` is a substring test, so approving "way" was silently
 * discarded against a gloss already containing "always"; and nothing checked the
 * 500-char cap, so a merge onto a long gloss threw a Postgres 22001 and the
 * approval failed outright.
 *
 * Returns the merged column, or null when there is nothing to do — the meaning
 * is already a sense, or adding it would not fit. Callers keep the entry as it
 * is; this never returns a string that the column would reject.
 *
 * Once `dictionary_senses` is the source of truth (phase 3) this becomes an
 * insert, and the cap stops mattering. Until then it is the one place the
 * merge happens.
 */
export function mergeSense(existing: string, addition: string): string | null {
  const incoming = addition.trim();
  if (!incoming) return null;

  const senses = parseSenses(existing);
  const key = (s: Sense) => projectSenses([s]).toLowerCase();
  const incomingKey = key({ text: incoming });
  if (senses.some((s) => key(s) === incomingKey)) return null;

  const merged = projectSenses([...senses, { text: incoming }]);
  return merged.length > GLOSS_COLUMN_LIMIT ? null : merged;
}

/**
 * Whether an entry's `example` is a usage example at all.
 *
 * 82 of the 1,489 populated `example` columns are not examples: the gloss
 * overflowed `english`'s 500-char cap and the full text was dumped here, so the
 * column repeats the gloss verbatim and then continues past the truncation.
 * Promoting one of those into the shared corpus would publish a paragraph of
 * dictionary prose as a sentence. Real examples are short — the longest is 37
 * characters, the median 15.
 *
 * Resolving the 82 is an editorial decision (the gloss needs re-splitting), not
 * something the backfill should guess at, so they are reported and skipped.
 */
export function isGlossOverflow(english: string, example: string): boolean {
  const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
  const head = collapse(english).slice(0, 80);
  return head.length > 0 && collapse(example).startsWith(head);
}
