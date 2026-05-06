"use client";

import { LANGUAGES, type LanguageEntry } from "@mobile/lib/data/languages";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LanguageSelectorProps {
  /** Current selected value — a language id or a free-text custom name. */
  value: string;
  onChange: (value: string) => void;
  /** Restrict the list to a subset (e.g. educator's scoped languages).
   *  When omitted, the full LANGUAGES list is shown. */
  languages?: Pick<LanguageEntry, "id" | "name" | "nativeName" | "region">[];
  placeholder?: string;
  /** Allow typing a name that doesn't appear in the list. Default true. */
  allowCustom?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByRegion(
  list: Pick<LanguageEntry, "id" | "name" | "nativeName" | "region">[],
): [string, Pick<LanguageEntry, "id" | "name" | "nativeName" | "region">[]][] {
  const map = new Map<string, Pick<LanguageEntry, "id" | "name" | "nativeName" | "region">[]>();
  for (const lang of list) {
    const bucket = map.get(lang.region) ?? [];
    bucket.push(lang);
    map.set(lang.region, bucket);
  }
  return [...map.entries()];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LanguageSelector({
  value,
  onChange,
  languages,
  placeholder = "Select a language…",
  allowCustom = true,
  className = "",
}: LanguageSelectorProps) {
  const pool = languages ?? LANGUAGES;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve the display label for the current value
  const selectedLabel = useMemo(() => {
    const found = pool.find((l) => l.id === value) ?? LANGUAGES.find((l) => l.id === value);
    return found?.name ?? value ?? "";
  }, [value, pool]);

  // Filter pool by search query
  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return pool;
    return pool.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q),
    );
  }, [pool, q]);

  const grouped = useMemo(() => groupByRegion(filtered), [filtered]);

  // Detect whether the typed search exactly matches an existing entry
  const hasExactMatch = pool.some(
    (l) =>
      l.name.toLowerCase() === search.trim().toLowerCase() ||
      l.id.toLowerCase() === search.trim().toLowerCase(),
  );
  const showCustomOption = allowCustom && search.trim().length > 0 && !hasExactMatch;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Focus the search input when the dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSearch("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors
          ${open
            ? "border-brand-500 ring-2 ring-brand-500/20"
            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
          }
          bg-white dark:bg-neutral-900 text-left`}
      >
        <span className={selectedLabel ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500"}>
          {selectedLabel || placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-neutral-400">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={(e) => e.key === "Enter" && clear(e as unknown as React.MouseEvent)}
              className="rounded p-0.5 hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[260px] rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/[0.06] px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, native name, or region…"
              className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto py-1">
            {grouped.length === 0 && !showCustomOption && (
              <p className="px-4 py-3 text-xs text-neutral-400 dark:text-neutral-500">No languages found.</p>
            )}

            {grouped.map(([region, langs]) => (
              <div key={region}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  {region}
                </p>
                {langs.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => select(lang.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.05]
                      ${value === lang.id ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300" : "text-neutral-900 dark:text-white"}`}
                  >
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            ))}

            {/* Custom language option */}
            {showCustomOption && (
              <button
                type="button"
                onClick={() => select(search.trim())}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border-t border-neutral-100 dark:border-white/[0.06]"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>Add &ldquo;<strong>{search.trim()}</strong>&rdquo;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
