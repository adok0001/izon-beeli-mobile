"use client";

import { TONE_LABELS, WORD_TONE_VALUES, isWordTone, type WordTone } from "@mobile/lib/dictionary";
import { useTranslation } from "react-i18next";

/**
 * Optional lexical tone for a dictionary headword.
 *
 * Blank ("—") is the default and means "not recorded" — never "level". Both
 * dictionary editors (admin and educator) render this next to `pronunciation`,
 * so the markup lives here rather than being copied into each form.
 */
export function ToneSelect({
  value,
  onChange,
  className,
}: Readonly<{
  value: WordTone | null;
  onChange: (tone: WordTone | null) => void;
  /** The host page's shared field class — the two editors style inputs differently. */
  className?: string;
}>) {
  const { t } = useTranslation();

  return (
    <div>
      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
        {t("admin.dictionary.fieldTone", { defaultValue: "Tone" })}
      </label>
      <select
        className={className}
        value={value ?? ""}
        onChange={(e) => onChange(isWordTone(e.target.value) ? e.target.value : null)}
      >
        <option value="">—</option>
        {WORD_TONE_VALUES.map((tone) => (
          <option key={tone} value={tone}>{TONE_LABELS[tone]}</option>
        ))}
      </select>
    </div>
  );
}
