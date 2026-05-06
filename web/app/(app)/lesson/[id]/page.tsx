"use client";

import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { cn, formatDuration } from "@/lib/utils";
import { SPEED_OPTIONS, useAudioStore, type PlaybackSpeed } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Lesson, TranscriptSegment } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    BookOpen,
    BookText,
    CheckCircle2,
    FastForward,
    Pause,
    Play,
    Rewind,
    Trophy, Volume2,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

// ── Types ────────────────────────────────────────────────────
interface LessonDetail extends Lesson { transcript: TranscriptSegment[]; }
interface CompletionResult {
  completed: boolean; pointsEarned: number; totalPoints: number;
  streak: number; leveledUp: boolean; newLevel?: number; newTitle?: string;
}
interface DictionaryEntry {
  id: string; word: string; english: string; french?: string | null;
  pronunciation?: string | null; example?: string | null;
}

// ── Word popup ───────────────────────────────────────────────
function WordPopup({ word, languageId, onClose }: Readonly<{ word: string; languageId: string; onClose: () => void }>) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const { data, isLoading } = useQuery<DictionaryEntry[]>({
    queryKey: ["dict-lookup", word.toLowerCase(), languageId],
    queryFn: () => apiFetch<DictionaryEntry[]>(`/dictionary?languageId=${encodeURIComponent(languageId)}&search=${encodeURIComponent(word)}`),
    staleTime: 5 * 60 * 1000,
  });
  const match = data?.[0] ?? null;
  let popupContent: ReactNode;
  if (isLoading) {
    popupContent = <p className="text-xs text-neutral-500">{t("common.loading")}</p>;
  } else if (match) {
    const defText = uiLanguage === "fr" && match.french ? match.french : match.english;
    popupContent = (
      <>
        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{match.word}</p>
        {match.pronunciation && <p className="text-xs text-neutral-400 italic mb-1">{match.pronunciation}</p>}
        <p className="text-sm text-brand-600 dark:text-brand-400">{defText}</p>
        {match.example && <p className="text-xs text-neutral-400 mt-1 italic">{match.example}</p>}
      </>
    );
  } else {
    popupContent = <p className="text-xs text-neutral-500">{t("lesson.wordNotFound")}</p>;
  }
  return (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-48 max-w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-3 text-left" role="tooltip">
      <button onClick={onClose} className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-700 text-xs">✕</button>
      {popupContent}
    </span>
  );
}

// ── Clickable word ───────────────────────────────────────────
function ClickableWord({ word, languageId, isActive }: Readonly<{ word: string; languageId: string; isActive: boolean }>) {
  const [open, setOpen] = useState(false);
  const clean = word.replaceAll(/[.,!?;:\u201c\u201d\u2018\u2019]/g, "");
  if (!clean.trim()) return <span>{word} </span>;
  return (
    <span className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={cn("underline decoration-dotted underline-offset-2 cursor-pointer rounded px-0.5 transition-colors",
          isActive ? "text-brand-700 dark:text-brand-300 decoration-brand-400" : "text-neutral-800 dark:text-neutral-200 decoration-neutral-400 hover:bg-brand-50 dark:hover:bg-brand-900/30")}
      >{word}</button>{" "}
      {open && <WordPopup word={clean} languageId={languageId} onClose={() => setOpen(false)} />}
    </span>
  );
}

// ── Interactive transcript ───────────────────────────────────
function InteractiveTranscript({ segments, position, languageId, onSegmentClick }: Readonly<{
  segments: TranscriptSegment[]; position: number; languageId: string; onSegmentClick: (t: number) => void;
}>) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = segments.findIndex((seg) => position >= seg.startTime && position < seg.endTime);
  useEffect(() => {
    const el = segmentRefs.current[activeIndex];
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);
  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("lesson.noTranscript")}</p>
      </div>
    );
  }
  return (
    <div className="overflow-y-auto flex-1">
      {segments.map((seg, i) => {
        const isActive = i === activeIndex;
        const translation = uiLanguage === "fr" && seg.translationFr ? seg.translationFr : seg.translation;
        return (
          <button key={seg.id} ref={(el) => { segmentRefs.current[i] = el; }} onClick={() => onSegmentClick(seg.startTime)}
            className={cn("w-full text-left px-5 py-3 border-l-2 transition-all",
              isActive ? "border-l-brand-500 bg-brand-50 dark:bg-brand-950/40" : "border-l-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50")}
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-xs font-mono text-neutral-400 select-none">{formatDuration(seg.startTime)}</span>
              <div className="flex-1">
                <p className={cn("text-sm leading-relaxed flex flex-wrap",
                  isActive ? "font-semibold text-brand-800 dark:text-brand-200" : "text-neutral-800 dark:text-neutral-200")}>
                  {seg.text.split(" ").map((word, wi) => (
                    <ClickableWord key={`${seg.id}-${wi}`} word={word} languageId={languageId} isActive={isActive} />
                  ))}
                </p>
                {translation && (
                  <p className={cn("mt-1 text-xs", isActive ? "text-brand-600 dark:text-brand-400" : "text-neutral-500 dark:text-neutral-400")}>{translation}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
      <div className="h-24" />
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function LessonPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { uiLanguage } = useUiLanguageStore();
  const { selectedLanguageId } = useLanguageStore();
  const { currentLesson, isPlaying, position, duration, speed, load, pause, resume, seek, skipForward, skipBackward, setSpeed } = useAudioStore();
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

  const handlePlayPause = useCallback(() => {
    if (!lesson) return;
    if (isCurrentLesson) { if (isPlaying) { pause(); } else { resume(); } }
    else { load(lesson); }
  }, [lesson, isCurrentLesson, isPlaying, pause, resume, load]);

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
  const progress = isCurrentLesson && duration > 0 ? (position / duration) * 100 : 0;

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
            {/* Waveform + seek */}
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-0.5 h-8">
                {Array.from({ length: 48 }, (_, i) => (
                  <div key={i}
                    className={cn("flex-1 rounded-full transition-colors",
                      isCurrentLesson && (i / 48) * 100 <= progress ? "bg-brand-500" : "bg-neutral-200 dark:bg-neutral-700")}
                    style={{ height: `${30 + Math.sin(i * 0.8) * 18}%` }}
                  />
                ))}
              </div>
              <div className="relative h-1 rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div className="absolute inset-y-0 left-0 rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
                <input type="range" min={0} max={duration || 100} value={isCurrentLesson ? position : 0} onChange={(e) => seek(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
              </div>
              <div className="flex justify-between text-xs text-neutral-400 tabular-nums">
                <span>{isCurrentLesson ? formatDuration(position) : "0:00"}</span>
                <span>{lesson.duration ? formatDuration(lesson.duration) : "--:--"}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => skipBackward(10)} disabled={!isCurrentLesson} className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40" aria-label={t("lesson.rewind10")}>
                <Rewind className="h-4 w-4" />
              </button>
              <button onClick={handlePlayPause} className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white transition-colors font-medium text-sm">
                {isCurrentLesson && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {((): string => {
                  if (isCurrentLesson && isPlaying) return t("lesson.pause");
                  if (isCurrentLesson) return t("lesson.resume");
                  return t("lesson.play");
                })()}
                {lesson.duration && !isCurrentLesson && <span className="text-brand-200 text-xs">{formatDuration(lesson.duration)}</span>}
              </button>
              <button onClick={() => skipForward(10)} disabled={!isCurrentLesson} className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40" aria-label={t("lesson.forward10")}>
                <FastForward className="h-4 w-4" />
              </button>
              <select value={isCurrentLesson ? speed : 1} onChange={(e) => setSpeed(Number(e.target.value) as PlaybackSpeed)} disabled={!isCurrentLesson}
                className="text-xs font-medium px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-none outline-none cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-40"
                aria-label={t("lesson.playbackSpeed")}>
                {SPEED_OPTIONS.map((s) => <option key={s} value={s}>{s}×</option>)}
              </select>
              <div className="flex items-center gap-2 ml-auto">
                {!isCompleted && (
                  <button onClick={() => complete.mutate()} disabled={complete.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-60">
                    <CheckCircle2 className="h-3.5 w-3.5" />{t("lesson.markComplete")}
                  </button>
                )}
                <Link href={`/quiz?courseId=${lesson.courseId}&lessonId=${lesson.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-500 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                  <Trophy className="h-3.5 w-3.5" />{t("lesson.practice")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {!hasAudio && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-neutral-400 dark:text-neutral-500"><Volume2 className="h-4 w-4" />{t("lesson.noAudio")}</span>
            <div className="ml-auto flex items-center gap-2">
              {!isCompleted && (
                <button onClick={() => complete.mutate()} disabled={complete.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-60">
                  <CheckCircle2 className="h-3.5 w-3.5" />{t("lesson.markComplete")}
                </button>
              )}
              <Link href={`/quiz?courseId=${lesson.courseId}&lessonId=${lesson.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-500 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
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
            <InteractiveTranscript
              segments={lesson.transcript}
              position={isCurrentLesson ? position : 0}
              languageId={selectedLanguageId ?? "izon"}
              onSegmentClick={handleSegmentClick}
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
