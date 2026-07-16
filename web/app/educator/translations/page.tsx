"use client";

import { StudioShell } from "@/app/(studio)/_components/studio-shell";
import { LanguageSelector } from "@/components/ui/language-selector";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const GLOSS_LOCALES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pcm", label: "Pidgin" },
  { code: "ar", label: "العربية" },
  { code: "pt", label: "Português" },
] as const;
type GlossLocale = (typeof GLOSS_LOCALES)[number]["code"];

interface EducatorMe {
  id: string;
  languages: { id: string; name: string; nativeName: string }[];
  isAdmin: boolean;
}

interface QueueEntry {
  id: string;
  word: string;
  example: string | null;
  translations: Record<string, string> | null;
  exampleTranslations: Record<string, string> | null;
}

interface QueueResponse {
  languageId: string;
  locale: string;
  total: number;
  missing: QueueEntry[];
}

function TranslationQueue() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [locale, setLocale] = useState<GlossLocale>("fr");
  const [drafts, setDrafts] = useState<Record<string, { gloss: string; exampleGloss: string }>>({});

  const { data: me } = useQuery<EducatorMe>({
    queryKey: ["educator", "me"],
    queryFn: async () => apiFetch<EducatorMe>("/educator/me", { token: (await getToken()) ?? undefined }),
    staleTime: 60_000,
  });

  const languages = me?.languages ?? [];
  const effectiveLanguage = selectedLanguage || languages[0]?.id || "";
  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.name, region: "Other" }
  );

  const queueQuery = useQuery<QueueResponse>({
    queryKey: ["educator", "translation-queue", effectiveLanguage, locale],
    queryFn: async () =>
      apiFetch<QueueResponse>(`/educator/translation-queue?languageId=${effectiveLanguage}&locale=${locale}`, {
        token: (await getToken()) ?? undefined,
      }),
    enabled: !!effectiveLanguage,
    staleTime: 15_000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ entry, gloss, exampleGloss }: { entry: QueueEntry; gloss: string; exampleGloss: string }) => {
      const token = await getToken();
      const body: Record<string, unknown> = {
        translations: { ...entry.translations, [locale]: gloss },
      };
      if (entry.example) {
        body.exampleTranslations = { ...entry.exampleTranslations, [locale]: exampleGloss };
      }
      return apiFetch(`/educator/dictionary/${entry.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        token: token ?? undefined,
      });
    },
    onSuccess: (_data, { entry }) => {
      toast.success(`Saved "${entry.word}"`);
      queryClient.invalidateQueries({ queryKey: ["educator", "translation-queue"] });
    },
    onError: () => toast.error("Save failed"),
  });

  function draftFor(entry: QueueEntry) {
    return drafts[entry.id] ?? { gloss: "", exampleGloss: "" };
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Translation Queue</h2>
        <p className="text-sm text-neutral-500">Fill in missing glosses per locale for the dictionary.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-64">
          <LanguageSelector value={effectiveLanguage} onChange={setSelectedLanguage} languages={enrichedLanguages} allowCustom={false} />
        </div>
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {GLOSS_LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={`px-3 py-1.5 text-xs font-medium ${
                locale === l.code
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {queueQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
      {queueQuery.data && (
        <p className="text-sm text-neutral-500">
          {queueQuery.data.missing.length} of {queueQuery.data.total} entries missing a {locale} gloss.
        </p>
      )}
      {queueQuery.data?.missing.length === 0 && (
        <p className="text-sm text-green-600 dark:text-green-400">Every entry has a {locale} gloss.</p>
      )}

      <div className="space-y-3">
        {queueQuery.data?.missing.map((entry) => {
          const draft = draftFor(entry);
          const needsExampleGloss = !!entry.example;
          return (
            <div key={entry.id} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{entry.word}</p>
                {entry.example && <p className="text-xs text-neutral-500 mt-0.5">{entry.example}</p>}
              </div>
              <textarea
                value={draft.gloss}
                onChange={(e) => setDrafts((d) => ({ ...d, [entry.id]: { ...draft, gloss: e.target.value } }))}
                placeholder={`Gloss in ${locale}…`}
                rows={2}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
              />
              {needsExampleGloss && (
                <textarea
                  value={draft.exampleGloss}
                  onChange={(e) => setDrafts((d) => ({ ...d, [entry.id]: { ...draft, exampleGloss: e.target.value } }))}
                  placeholder={`Example translation in ${locale}…`}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
                />
              )}
              <button
                disabled={!draft.gloss.trim() || (needsExampleGloss && !draft.exampleGloss.trim()) || saveMutation.isPending}
                onClick={() => saveMutation.mutate({ entry, gloss: draft.gloss.trim(), exampleGloss: draft.exampleGloss.trim() })}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TranslationsPage() {
  return (
    <StudioShell access="reviewer">
      <TranslationQueue />
    </StudioShell>
  );
}
