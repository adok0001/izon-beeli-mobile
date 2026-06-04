"use client";

import { TactileAudioPlayer } from "@/components/lesson/tactile-audio-player";
import { SecretDiaryTranscript } from "@/components/lesson/secret-diary-transcript";
import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Lesson, TranscriptSegment } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, BookText, CheckCircle2, Trophy, Volume2 } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

// ── Types ────────────────────────────────────────────────────
interface LessonDetail extends Lesson { transcript: TranscriptSegment[]; }
interface CompletionResult {
  completed: boolean; pointsEarned: number; totalPoints: number;
  streak: number; leveledUp: boolean; newLevel?: number; newTitle?: string;
}

// ── Main page ────────────────────────────────────────────────
export default function LessonPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { uiLanguage } = useUiLanguageStore();
  const { selectedLanguageId } = useLanguageStore();
  const { currentLesson, isPlaying, position, load, seek } = useAudioStore();
  const [completionBanner, setCompletionBanner] = useState<CompletionResult | null>(null);

  const { data: lesson, isLoading, isError } = useQuery<LessonDetail>({
    queryKey: ["lesson", id],
    queryFn: () => apiFetch<LessonDetail>(`/lessons/${id}`),
    enabled: !!id,
  });

  const { data: completedIds } = useQuery<string[]>({
    queryKey: ["completed-lessons"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      return apiFetch<string[]>("/progress", { token });
    },
    staleTime: 60_000,
  });

  const complete = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return apiFetch<CompletionResult>(`/progress/${id}/complete`, { method: "POST", token });
    },
    onSuccess: (result) => {
      setCompletionBanner(result);
      queryClient.invalidateQueries({ queryKey: ["completed-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const isCurrentLesson = currentLesson?.id === id;
  const isCompleted = completedIds?.includes(id ?? "") ?? lesson?.completed ?? false;
  const lessonTitle = lesson ? localizeField(lesson.title, lesson.titleFr, uiLanguage) : "";
  const lessonDescription = lesson ? localizeField(lesson.description ?? "", lesson.descriptionFr, uiLanguage) : "";

  const handleSegmentClick = useCallback((startTime: number) => {
    if (!lesson) return;
    if (isCurrentLesson) { seek(startTime); }
    else { load(lesson); setTimeout(() => seek(startTime), 300); }
  }, [lesson, isCurrentLesson, load, seek]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-6 w-2/3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-32 w-full bg-neutral-200 dark:bg-neutral-700 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-6">
        <BookText className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        <p className="text-neutral-600 dark:text-neutral-400">{t("lesson.notFound")}</p>
        <Link href="/learn" className="text-sm text-brand-600 dark:text-brand-400 underline">{t("common.goBack")}</Link>
      </div>
    );
  }

  const hasAudio = !!lesson.audioUrl;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 pt-4 pb-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
        <Link href={`/course/${lesson.courseId}`} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />{t("common.back")}
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">{lessonTitle}</h1>
            {lessonDescription && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{lessonDescription}</p>}
          </div>
          {isCompleted && (
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />{t("lesson.done")}
            </span>
          )}
        </div>

        {hasAudio && (
          <div className="space-y-2">
            <TactileAudioPlayer lesson={lesson} />
            <div className="flex items-center gap-2 justify-end flex-wrap">
              {!isCompleted && (
                <button
                  onClick={() => complete.mutate()} disabled={complete.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />{t("lesson.markComplete")}
                </button>
              )}
              <Link
                href={`/quiz?courseId=${lesson.courseId}&lessonId=${lesson.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-500 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                <Trophy className="h-3.5 w-3.5" />{t("lesson.practice")}
              </Link>
            </div>
          </div>
        )}

        {!hasAudio && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-neutral-400 dark:text-neutral-500">
              <Volume2 className="h-4 w-4" />{t("lesson.noAudio")}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {!isCompleted && (
                <button
                  onClick={() => complete.mutate()} disabled={complete.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />{t("lesson.markComplete")}
                </button>
              )}
              <Link
                href={`/quiz?courseId=${lesson.courseId}&lessonId=${lesson.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-500 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                <Trophy className="h-3.5 w-3.5" />{t("lesson.practice")}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Completion banner */}
      {completionBanner && (
        <div className="shrink-0 mx-5 mt-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-green-800 dark:text-green-200 text-sm">{t("lesson.lessonComplete")}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              +{completionBanner.pointsEarned} {t("profile.points")}
              {completionBanner.leveledUp && completionBanner.newTitle ? ` · ${t("lesson.levelUp", { title: completionBanner.newTitle })}` : ""}
            </p>
          </div>
          <button onClick={() => setCompletionBanner(null)} className="text-green-400 hover:text-green-600 text-xs">✕</button>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {lesson.transcript && lesson.transcript.length > 0 ? (
          <>
            <p className="shrink-0 px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{t("lesson.transcript")}</p>
            <SecretDiaryTranscript
              segments={lesson.transcript}
              position={isCurrentLesson ? position : 0}
              languageId={selectedLanguageId ?? "izon"}
              onSegmentClick={handleSegmentClick}
              isPlaying={isCurrentLesson && isPlaying}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <BookOpen className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("lesson.noTranscript")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
