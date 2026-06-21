"use client";

import { cn } from "@/lib/utils";
import { ChevronUp, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

export type LocalizedText = Partial<Record<string, string>>;

interface Gloss {
  key: string;
  label: string;
  placeholder: string;
  name: string;
}

export const GLOSS_LANGUAGES: Gloss[] = [
  { key: "en", label: "EN", placeholder: "English", name: "English" },
  { key: "fr", label: "FR", placeholder: "Français", name: "Français" },
  { key: "pcm", label: "PCM", placeholder: "Naija", name: "Naijá (Pidgin)" },
  { key: "ar", label: "AR", placeholder: "العربية", name: "العربية" },
  { key: "pt", label: "PT", placeholder: "Português", name: "Português" },
];

/** The base gloss that always stays visible — every entry is anchored to English. */
const ANCHOR_KEY = "en";
/** Show an inline search box in the picker once the language list gets long. */
const SEARCH_THRESHOLD = 8;

const baseField =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

interface Props {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  required?: boolean;
  multiline?: boolean;
}

/**
 * Localized gloss editor with progressive disclosure. Renders the anchor
 * language plus any already-translated languages and hides the rest behind an
 * "Add translation" picker, so the field scales to many languages without
 * stacking dozens of inputs at once. Mirrors the mobile LocalizedTextInput.
 */
export function LocalizedTextInput({ label, value, onChange, required, multiline }: Props) {
  const [added, setAdded] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const visible = useMemo(() => {
    const shown = new Set<string>([ANCHOR_KEY, ...added]);
    GLOSS_LANGUAGES.forEach((l) => {
      if (value[l.key]?.trim()) shown.add(l.key);
    });
    return GLOSS_LANGUAGES.filter((l) => shown.has(l.key));
  }, [value, added]);

  const remaining = GLOSS_LANGUAGES.filter((l) => !visible.includes(l));
  const filledCount = GLOSS_LANGUAGES.filter((l) => value[l.key]?.trim()).length;

  const addLang = (key: string) => {
    setAdded((a) => (a.includes(key) ? a : [...a, key]));
    if (remaining.length <= 1) setPickerOpen(false);
  };

  const removeLang = (key: string) => {
    setAdded((a) => a.filter((k) => k !== key));
    if (value[key] !== undefined) {
      const next = { ...value };
      delete next[key];
      onChange(next);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          {label}
          {required ? " *" : ""}
        </label>
        <span className={cn("text-[10px] font-semibold", filledCount > 0 ? "text-brand-600 dark:text-brand-400" : "text-neutral-400")}>
          {filledCount}/{GLOSS_LANGUAGES.length}
        </span>
      </div>

      <div className="space-y-2">
        {visible.map((lang) => (
          <LanguageRow
            key={lang.key}
            lang={lang}
            value={value[lang.key] ?? ""}
            onChange={(text) => onChange({ ...value, [lang.key]: text })}
            onRemove={lang.key === ANCHOR_KEY ? undefined : () => removeLang(lang.key)}
            multiline={multiline}
          />
        ))}
      </div>

      {remaining.length > 0 && (
        <AddLanguagePicker
          remaining={remaining}
          open={pickerOpen}
          onToggle={() => setPickerOpen((o) => !o)}
          onPick={addLang}
        />
      )}
    </div>
  );
}

interface RowProps {
  lang: Gloss;
  value: string;
  onChange: (text: string) => void;
  onRemove?: () => void;
  multiline?: boolean;
}

function LanguageRow({ lang, value, onChange, onRemove, multiline }: RowProps) {
  const filled = !!value.trim();
  const badge = (
    <span
      className={cn(
        "shrink-0 w-9 text-center text-[10px] font-bold rounded-md border py-1.5",
        filled
          ? "text-brand-600 dark:text-brand-400 border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20"
          : "text-neutral-400 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800",
        multiline && "self-start",
      )}
    >
      {lang.label}
    </span>
  );

  return (
    <div className="flex items-center gap-2">
      {badge}
      {multiline ? (
        <textarea
          rows={2}
          className={cn(baseField, "resize-none")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={lang.placeholder}
        />
      ) : (
        <input
          className={baseField}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={lang.placeholder}
        />
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${lang.name}`}
          className={cn(
            "shrink-0 p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
            multiline && "self-start",
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface PickerProps {
  remaining: Gloss[];
  open: boolean;
  onToggle: () => void;
  onPick: (key: string) => void;
}

function AddLanguagePicker({ remaining, open, onToggle, onPick }: PickerProps) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = q
    ? remaining.filter((l) => l.name.toLowerCase().includes(q) || l.key.includes(q))
    : remaining;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-brand-300 dark:border-brand-700 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        {open ? "Done" : `Add translation (${remaining.length})`}
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          {GLOSS_LANGUAGES.length >= SEARCH_THRESHOLD && (
            <div className="flex items-center gap-2 mb-2.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages"
                className="flex-1 bg-transparent py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {filtered.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => onPick(l.key)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
              >
                <span className="text-[10px] font-bold text-neutral-400">{l.label}</span>
                <span className="text-xs text-neutral-700 dark:text-neutral-200">{l.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <span className="text-xs text-neutral-400 py-1">No languages found</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Build a LocalizedText map from a legacy flat entry's english/french fields. */
export function toLocalizedText(en?: string | null, fr?: string | null): LocalizedText {
  const out: LocalizedText = {};
  if (en?.trim()) out.en = en;
  if (fr?.trim()) out.fr = fr;
  return out;
}
