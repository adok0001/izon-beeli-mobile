"use client";

import { TactileAudioPlayer } from "@/components/lesson/tactile-audio-player";
import { SecretDiaryTranscript } from "@/components/lesson/secret-diary-transcript";
import { apiFetch } from "@/lib/api";
import { localizePair } from "@/lib/localize";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Lesson, TranscriptSegment } from "@/types";
import type { TranslationMap } from "@/lib/localize";
import type { UiLanguage } from "@/lib/ui-language";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, BookText, CheckCircle2, Sparkles, Trophy, Volume2 } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

// ── Types ────────────────────────────────────────────────────
// `type` distinguishes real lessons from block-closing mini-game rows, which
// `/lessons/:id` serves alike (mobile/lib/course-path.ts). The web `Lesson`
// type doesn't carry it yet, so declare it here.
type LessonRow = Lesson & { type?: string };

/**
 * A culture beat attached to this lesson in Studio. Join-derived rather than a
 * lesson column, so it rides on the detail response only — see
 * `selectLessonCulturalNotes` (server/src/lib/content-selectors.ts). Both text
 * fields arrive as full gloss maps, never as flat strings.
 */
interface LessonCulturalNote {
  title: TranslationMap;
  body: TranslationMap;
  /** Category chips; the card renders `tags[0]` as its overline. */
  tags?: string[];
}

interface LessonDetail extends LessonRow {
  transcript: TranscriptSegment[];
  culturalNotes?: LessonCulturalNote[];
}
interface CompletionResult {
  completed: boolean; pointsEarned: number; totalPoints: number;
  streak: number; leveledUp: boolean; newLevel?: number; newTitle?: string;
}

// ── Action row ───────────────────────────────────────────────
// Shared by the audio and no-audio headers so the two branches can't drift.
function LessonActions({ lesson, nextLesson, completion }: Readonly<{
  lesson: LessonDetail;
  nextLesson: LessonRow | null;
  completion: { isCompleted: boolean; isPending: boolean; onComplete: () => void };
}>) {
  const { t } = useTranslation();
  const pill = "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors";

  return (
    <div className="flex items-center gap-2 justify-end flex-wrap">
      {!completion.isCompleted && (
        <button
          onClick={completion.onComplete} disabled={completion.isPending}
          className={`${pill} border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-60`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />{t("lesson.markComplete")}
        </button>
      )}
      {nextLesson && (
        <Link
          href={`/lesson/${nextLesson.id}`}
          className={`${pill} border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04]`}
        >
          {t("lesson.continueToNext")}<ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
      <Link
        href={`/quiz?courseId=${lesson.courseId}&lessonId=${lesson.id}`}
        className={`${pill} border-brand-500 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20`}
      >
        <Trophy className="h-3.5 w-3.5" />{t("lesson.practice")}
      </Link>
    </div>
  );
}

// ── Culture note ─────────────────────────────────────────────
// Bodies run long, so each note is a collapsed disclosure — the transcript
// stays the page's centre of gravity until the learner opens one.
function CultureNoteCard({ note, uiLanguage }: Readonly<{ note: LessonCulturalNote; uiLanguage: UiLanguage }>) {
  const { t } = useTranslation();
  const title = localizePair(note.title, null, uiLanguage);
  const body = localizePair(note.body, null, uiLanguage);
  const tag = note.tags?.[0]?.replaceAll("_", " ");
  if (!title && !body) return null;

  return (
    <details className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/[0.03] px-4 py-3">
      <summary className="flex items-center gap-2 cursor-pointer list-none">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-500 dark:text-brand-400" />
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400">
          {t("lesson.culture")}{tag ? <span className="text-neutral-400 dark:text-neutral-500">{`  ·  ${tag}`}</span> : null}
        </span>
        <span className="ml-auto min-w-0 truncate text-xs font-medium text-neutral-700 dark:text-neutral-200">{title}</span>
      </summary>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-neutral-600 dark:text-neutral-300">{body}</p>
    </details>
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

  // Siblings, purely to resolve "next lesson". Shares the course page's query
  // key, so arriving from the course path is a cache hit rather than a fetch.
  const courseId = lesson?.courseId;
  const { data: courseLessons = [] } = useQuery<LessonRow[]>({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<LessonRow[]>(`/lessons?courseId=${courseId}`, { token: token ?? undefined });
    },
    enabled: !!courseId,
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
  const lessonTitle = lesson ? localizePair(lesson.titleTranslations, lesson.title, uiLanguage) : "";
  const lessonDescription = lesson ? localizePair(lesson.descriptionTranslations, lesson.description ?? "", uiLanguage) : "";
  const canDo = lesson ? localizePair(lesson.canDoTranslations, lesson.canDo, uiLanguage) : "";

  // Mini-game rows aren't playable, so "next" skips them exactly as the course
  // path does. The endpoint already orders by `order`, so position is the order.
  const playable = courseLessons.filter((l) => l.type !== "game");
  const currentIndex = playable.findIndex((l) => l.id === id);
  const nextLesson = currentIndex >= 0 ? playable[currentIndex + 1] ?? null : null;

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

  // Block-closing mini-game rows aren't playable lessons — mobile never lists
  // them, and completing one here would award XP mobile never would. If one is
  // opened directly by URL, show the missing-content notice instead.
  if (lesson.type === "game") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-6">
        <BookText className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        <p className="text-neutral-600 dark:text-neutral-400">{t("lesson.gameGateNotice")}</p>
        <Link href={`/course/${lesson.courseId}`} className="text-sm text-brand-600 dark:text-brand-400 underline">{t("common.goBack")}</Link>
      </div>
    );
  }

  const hasAudio = !!lesson.audioUrl;
  const actions = (
    <LessonActions
      lesson={lesson}
      nextLesson={nextLesson}
      completion={{ isCompleted, isPending: complete.isPending, onComplete: () => complete.mutate() }}
    />
  );

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
            {actions}
          </div>
        )}

        {!hasAudio && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-neutral-400 dark:text-neutral-500">
              <Volume2 className="h-4 w-4" />{t("lesson.noAudio")}
            </span>
            <div className="ml-auto">{actions}</div>
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

      {/* Can-do — the competence this lesson is actually for. Stated up front so
          the learner knows what "done" means before they get there. */}
      {canDo && (
        <div className="shrink-0 mx-5 mt-3 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50 dark:bg-brand-900/20 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400">
            {t("lesson.youCanNow", { defaultValue: "You can now" })}
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-800 dark:text-neutral-100">{canDo}</p>
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

      {/* Culture notes — collapsed so they never crowd out the transcript. */}
      {lesson.culturalNotes && lesson.culturalNotes.length > 0 && (
        <div className="shrink-0 max-h-56 overflow-y-auto border-t border-neutral-200 dark:border-neutral-800 px-5 py-3 space-y-2">
          {lesson.culturalNotes.map((note, i) => (
            <CultureNoteCard key={i} note={note} uiLanguage={uiLanguage} />
          ))}
        </div>
      )}
    </div>
  );
}
