"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ErrorMsg, fieldCls, Label, LanguagePicker, StepHeader, CATEGORIES, type Category } from "../_components/shared";
import { useForm } from "../_components/use-form";

interface WordState {
  step: number;
  langId: string;
  word: string;
  english: string;
  category: Category;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  audioFile: File | null;
  error: string | null;
}

export function WordFlow({
  onDone,
  bountyId,
  initialLangId,
  initialCategory,
}: Readonly<{
  onDone: () => void;
  bountyId?: string;
  initialLangId?: string;
  initialCategory?: Category;
}>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const qc = useQueryClient();

  const [state, set] = useForm<WordState>({
    step: 1,
    langId: initialLangId ?? selectedLanguageId,
    word: "",
    english: "",
    category: initialCategory ?? "other",
    pronunciation: "",
    example: "",
    exampleTranslation: "",
    audioFile: null,
    error: null,
  });
  const { step, langId, word, english, category, pronunciation, example, exampleTranslation, audioFile, error } = state;

  const submit = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const body: Record<string, unknown> = {
        type: "word",
        languageId: langId,
        word: word.trim(),
        english: english.trim(),
        category,
        pronunciation: pronunciation.trim() || undefined,
        example: example.trim() || undefined,
        exampleTranslation: exampleTranslation.trim() || undefined,
        bountyId: bountyId || undefined,
      };

      if (audioFile) {
        const form = new FormData();
        Object.entries(body).forEach(([k, v]) => { if (v !== undefined) form.append(k, String(v)); });
        form.append("audio", audioFile);
        return apiFetch("/contributions", { method: "POST", body: form, token: token ?? undefined });
      }

      return apiFetch("/contributions", {
        method: "POST",
        body: JSON.stringify(body),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dictionary"] });
      onDone();
    },
    onError: (err: Error) => set({ error: err.message }),
  });

  if (step === 1) {
    return (
      <div>
        <StepHeader step={1} total={3} title={t("contribute.chooseLanguage")} onBack={onDone} />
        <LanguagePicker value={langId} onChange={(v) => set({ langId: v })} />
        <button
          onClick={() => set({ step: 2 })}
          disabled={!langId}
          className="mt-6 w-full py-3 rounded-xl bg-amber-500 text-[#06060e] font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <StepHeader step={2} total={3} title={t("contribute.wordMeaning")} onBack={() => set({ step: 1 })} />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("contribute.wordRequired")}</Label>
              <input className={fieldCls} value={word} onChange={(e) => set({ word: e.target.value })} placeholder="e.g. àmà" autoFocus />
            </div>
            <div>
              <Label>{t("contribute.englishMeaning")}</Label>
              <input className={fieldCls} value={english} onChange={(e) => set({ english: e.target.value })} placeholder="e.g. water" />
            </div>
          </div>
          <div>
            <Label>{t("contribute.category")}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => set({ category: cat })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors",
                    category === cat
                      ? "bg-amber-500 text-[#06060e] border-amber-500 font-bold"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-brand-400"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => set({ step: 3 })}
          disabled={!word.trim() || !english.trim()}
          className="mt-6 w-full py-3 rounded-xl bg-amber-500 text-[#06060e] font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Step 3
  return (
    <div>
      <StepHeader step={3} total={3} title={t("contribute.detailsOptional")} onBack={() => set({ step: 2 })} />
      <div className="space-y-4">
        <div>
          <Label>{t("contribute.pronunciationLabel")}</Label>
          <input className={fieldCls} value={pronunciation} onChange={(e) => set({ pronunciation: e.target.value })} placeholder="Phonetic spelling" />
        </div>
        <div>
          <Label>{t("contribute.exampleSentenceLabel")}</Label>
          <input className={fieldCls} value={example} onChange={(e) => set({ example: e.target.value })} placeholder="Example in the language" />
        </div>
        <div>
          <Label>{t("contribute.exampleTranslationLabel")}</Label>
          <input className={fieldCls} value={exampleTranslation} onChange={(e) => set({ exampleTranslation: e.target.value })} placeholder="English translation" />
        </div>
        <div>
          <Label>{t("contribute.audioFileLabel")}</Label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 cursor-pointer hover:border-brand-400 transition-colors">
            <Upload className="h-4 w-4 text-neutral-400" />
            <span className="text-sm text-neutral-500">{audioFile ? audioFile.name : "Upload .mp3 / .m4a"}</span>
            <input type="file" accept="audio/*" className="sr-only" onChange={(e) => set({ audioFile: e.target.files?.[0] ?? null })} />
          </label>
        </div>
        <ErrorMsg msg={error} />
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {t("contribute.reviewNote")}
        </p>
      </div>
      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="mt-6 w-full py-3 rounded-xl bg-amber-500 text-[#06060e] font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {submit.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("contribute.submitting")}</> : t("contribute.submitForReview")}
      </button>
    </div>
  );
}
