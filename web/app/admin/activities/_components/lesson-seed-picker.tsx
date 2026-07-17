"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useForm } from "@/lib/use-form";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { fieldCls } from "./shared";

interface LessonStub { id: string; title: string; audioUrl: string | null; }
interface TranscriptSegment { text: string; translation: string | null; order: number; }
interface LessonDetail { audioUrl: string | null; transcript: TranscriptSegment[]; }

interface SeedState { open: boolean; selectedId: string; seeding: boolean; }

export function LessonSeedPicker({
  languageId,
  onSeed,
}: {
  languageId: string;
  onSeed: (sentence: string, audioUrl: string | null) => void;
}) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [state, set] = useForm<SeedState>({ open: false, selectedId: "", seeding: false });
  const { open, selectedId, seeding } = state;

  const { data: lessonList = [] } = useQuery<LessonStub[]>({
    queryKey: ["lessons-for-seed", languageId],
    queryFn: async () => {
      const token = (await getToken()) ?? undefined;
      return apiFetch<LessonStub[]>(`/lessons?languageId=${encodeURIComponent(languageId)}`, { token });
    },
    enabled: open && !!languageId,
    staleTime: 5 * 60 * 1000,
  });

  async function handleApply() {
    if (!selectedId) return;
    set({ seeding: true });
    try {
      const token = (await getToken()) ?? undefined;
      const detail = await apiFetch<LessonDetail>(`/lessons/${selectedId}`, { token });
      const firstSegment = detail.transcript.sort((a, b) => a.order - b.order)[0];
      onSeed(firstSegment?.text ?? "", detail.audioUrl);
    } catch {
      toast.error(t("admin.activities.lessonLoadFailed"));
    }
    set({ seeding: false, open: false });
  }

  return (
    <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => set({ open: !open })}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {t("admin.activities.seedFromLesson")}
        <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <select
            className={fieldCls}
            value={selectedId}
            onChange={(e) => set({ selectedId: e.target.value })}
          >
            <option value="">— pick a lesson —</option>
            {lessonList.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-500">
            {t("admin.activities.seedHint")}
          </p>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedId || seeding}
            className="px-3 py-1.5 rounded-lg text-xs bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold disabled:opacity-40 transition-colors hover:opacity-80"
          >
            {seeding ? t("admin.activities.loading") : t("admin.activities.apply")}
          </button>
        </div>
      )}
    </div>
  );
}
