"use client";

import { apiFetch } from "@/lib/api";
import { DictionaryEditPanel } from "@/components/studio/dictionary-edit-panel";
import { LessonImportPanel } from "@/components/studio/lesson-import-panel";
import { UnifiedImportPanel } from "@/components/studio/unified-import-panel";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface EducatorMe {
  name: string;
  isAdmin: boolean;
  reviewerLanguages: string[];
  languages: { id: string; name: string; nativeName: string }[];
}

type Mode = "content" | "lessons" | "edit";

const MODE_BLURB: Record<Mode, React.ReactNode> = {
  content: <>Fill one spreadsheet, upload it here. Rows go to your language’s dictionary, sentence drills, proverbs and quiz bank based on each row’s <code>type</code>.</>,
  lessons: <>Upload a spreadsheet of transcript lines. Rows sharing a title become one lesson, all placed in the course you pick.</>,
  edit: <>Export the words you want to correct, fix them in a spreadsheet, and upload the same sheet back. Rows are matched on <code>id</code>, so this can only change what is already there.</>,
};

export default function EducatorImportPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  // A deep link (e.g. the dictionary page's "Bulk edit" button) can land here
  // with a mode and its scoping params preselected.
  const initialMode = searchParams.get("mode");
  const initialCategory = searchParams.get("category") ?? undefined;
  const [languageId, setLanguageId] = useState(searchParams.get("languageId") ?? "");
  const [mode, setMode] = useState<Mode>(
    initialMode === "content" || initialMode === "lessons" || initialMode === "edit" ? initialMode : "content",
  );

  const { data: me } = useQuery<EducatorMe>({
    queryKey: ["educator", "me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorMe>("/educator/me", { token: token ?? undefined });
    },
  });

  const languages = me?.languages ?? [];
  const activeLanguage = languageId || languages[0]?.id || "";

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Bulk import</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{MODE_BLURB[mode]}</p>
      </div>

      {/* Mode toggle */}
      <div className="mb-6 inline-flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-50 dark:bg-neutral-900">
        {(["content", "lessons", "edit"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors",
              mode === m
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {languages.length > 1 && (
        <div className="mb-6 flex items-center gap-2">
          <label htmlFor="import-language" className="text-xs font-medium text-neutral-500">Language</label>
          <select
            id="import-language"
            value={activeLanguage}
            onChange={(e) => setLanguageId(e.target.value)}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-2 py-1 text-neutral-900 dark:text-white"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>
      )}

      {activeLanguage ? (
        mode === "content" ? <UnifiedImportPanel key={activeLanguage} languageId={activeLanguage} />
        : mode === "lessons" ? <LessonImportPanel key={activeLanguage} languageId={activeLanguage} />
        : <DictionaryEditPanel key={activeLanguage} languageId={activeLanguage} initialCategory={initialCategory} />
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No language assigned to your account yet.</p>
      )}
    </div>
  );
}
