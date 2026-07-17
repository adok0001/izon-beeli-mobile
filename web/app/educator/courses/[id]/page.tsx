"use client";

import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { useForm } from "@/lib/use-form";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Pencil,
    Play,
    Plus,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LessonModal } from "./_components/lesson-modal";
import { StoryArcSection } from "./_components/story-arc-section";
import { fmtDuration, type Course, type Lesson } from "./_components/shared";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const { id: courseId } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { uiLanguage } = useUiLanguageStore();

  const [ui, setUi] = useForm({
    modal: null as "create" | Lesson | null,
    deleteId: null as string | null,
    playUrl: null as string | null,
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["educator-courses"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>("/educator/courses", { token: token! });
    },
  });

  const { data: allLessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["educator-lessons"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Lesson[]>("/educator/lessons", { token: token! });
    },
  });

  const course = courses.find((c) => c.id === courseId);
  const lessons = allLessons
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => a.order - b.order);
  const languageId = course?.languageId ?? lessons[0]?.languageId ?? "";

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/lessons/${id}`, { method: "DELETE", token: token! });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      setUi({ deleteId: null });
      toast.success(t("educator.courseDetail.lessonDeleted"));
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.failedDelete"), { description: e.message }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const token = await getToken();
      return apiFetch(`/educator/lessons/${id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      toast.success(variables.isActive ? t("educator.courseDetail.lessonPublished") : t("educator.courseDetail.lessonHidden"));
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.failedUpdate"), { description: e.message }),
  });

  const generateStubsMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<{ courses: number; lessons: number }>("/educator/generate-stubs", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ languageId, courseType: course?.courseType }),
      });
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      void qc.invalidateQueries({ queryKey: ["educator-courses"] });
      toast.success(t("educator.courseDetail.stubsGenerated"), { description: `${result.courses} course · ${result.lessons} lessons created.` });
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.stubsFailed"), { description: e.message }),
  });

  const displayTitle = course ? localizeField(course.title, course.titleFr, uiLanguage) : undefined;
  const displayDescription = course ? localizeField(course.description, course.descriptionFr, uiLanguage) : undefined;
  const courseTitle = displayTitle ?? lessons[0]?.courseTitle ?? "Course";
  const levelLabel = course?.level ?? "";

  return (
    <div>
      <Link
        href="/educator/courses"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("educator.courseDetail.backToCourses")}
      </Link>

      {/* Course header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {levelLabel && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 capitalize">
                {levelLabel}
              </span>
            )}
            {course?.courseType && (
              <span className="text-xs text-neutral-500 dark:text-neutral-300 capitalize">
                {course.courseType.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{courseTitle}</h1>
          {course?.description && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300 max-w-2xl">{displayDescription}</p>
          )}
        </div>
        <button
          onClick={() => setUi({ modal: "create" })}
          className="flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("educator.courseDetail.newLesson")}
        </button>
      </div>

      {/* Lessons */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">{t("educator.courseDetail.noLessons")}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1 mb-5">{t("educator.courseDetail.noLessonsHint")}</p>
          {course?.courseType && (
            <button
              onClick={() => generateStubsMutation.mutate()}
              disabled={generateStubsMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {generateStubsMutation.isPending ? t("educator.courseDetail.seeding") : t("educator.courseDetail.seedStubs")}
            </button>
          )}
          {generateStubsMutation.isError && (
            <p className="mt-3 text-xs text-red-500">{(generateStubsMutation.error as Error).message}</p>
          )}
          {generateStubsMutation.isSuccess && (
            <p className="mt-3 text-xs text-green-600 dark:text-green-400">
              {t("educator.courseDetail.seededCount", { count: generateStubsMutation.data.lessons })}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300 w-8">{t("educator.courseDetail.colOrder")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.colTitle")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.colType")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.colStatus")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.colDuration")}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, i) => (
                <tr
                  key={lesson.id}
                  className={`${i < lessons.length - 1 ? "border-b border-neutral-100 dark:border-white/[0.04]" : ""} hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors`}
                >
                  <td className="px-4 py-3 text-xs text-neutral-400 dark:text-neutral-300 tabular-nums">{lesson.order}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/educator/courses/${courseId}/lessons/${lesson.id}`}
                      className="font-medium text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 group"
                    >
                      {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
                      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                    </Link>
                    {lesson.artist && <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5">{lesson.artist}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 capitalize">
                      {lesson.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: lesson.id, isActive: !lesson.isActive })}
                      disabled={toggleActiveMutation.isPending}
                      title={lesson.isActive ? t("educator.courseDetail.deactivateLesson") : t("educator.courseDetail.activateLesson")}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                        lesson.isActive
                          ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30"
                          : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.1]"
                      }`}
                    >
                      {lesson.isActive
                        ? <><Eye className="h-3 w-3" /> {t("educator.courseDetail.statusActive")}</>
                        : <><EyeOff className="h-3 w-3" /> {t("educator.courseDetail.statusInactive")}</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-300 text-xs tabular-nums">
                    {fmtDuration(lesson.duration)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {lesson.audioUrl && (
                        <button
                          onClick={() => setUi({ playUrl: ui.playUrl === lesson.audioUrl ? null : lesson.audioUrl })}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                          title={t("educator.courseDetail.playAudio")}
                        >
                          <Play className={`h-3.5 w-3.5 ${ui.playUrl === lesson.audioUrl ? "text-brand-500" : "text-neutral-400 dark:text-neutral-300"}`} />
                        </button>
                      )}
                      <button
                        onClick={() => setUi({ modal: lesson })}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                        title={t("educator.courseDetail.editLesson")}
                      >
                        <Pencil className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-300" />
                      </button>
                      <button
                        onClick={() => setUi({ deleteId: lesson.id })}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/[0.1] transition-colors"
                        title={t("educator.courseDetail.deleteLesson")}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline audio player */}
      {ui.playUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white dark:bg-[#0f0f1a] border border-neutral-200 dark:border-white/[0.08] rounded-2xl shadow-xl px-4 py-3">
          <audio src={ui.playUrl} controls autoPlay className="h-8 w-64" />
          <button onClick={() => setUi({ playUrl: null })} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06]">
            <X className="h-4 w-4 text-neutral-500 dark:text-neutral-300" />
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      {ui.modal !== null && (
        <LessonModal
          courseId={courseId}
          languageId={languageId}
          lesson={ui.modal === "create" ? null : ui.modal}
          onClose={() => setUi({ modal: null })}
        />
      )}

      {/* Story Arc */}
      <StoryArcSection courseId={courseId} lessons={lessons} />

      {/* Delete confirmation */}
      {ui.deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-2xl p-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{t("educator.courseDetail.deleteTitle")}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-300 mb-6">
              {t("educator.courseDetail.deleteDesc")}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setUi({ deleteId: null })} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
                {t("educator.courseDetail.deleteCancel")}
              </button>
              <button
                onClick={() => deleteMutation.mutate(ui.deleteId!)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? t("educator.courseDetail.deleting") : t("educator.courseDetail.deleteButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
