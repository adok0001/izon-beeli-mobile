"use client";

import { apiFetch } from "@/lib/api";
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
import { useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  courseId: string;
  courseTitle: string;
  languageId: string;
  title: string;
  description: string;
  type: string;
  audioUrl: string | null;
  duration: number | null;
  order: number;
  artist: string | null;
  genre: string | null;
  isActive: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  languageId: string;
  level: string;
  courseType: string | null;
  order: number;
}

const LESSON_TYPES = ["lesson", "story", "music", "pronunciation"] as const;

function fmtDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Lesson Modal ─────────────────────────────────────────────────────────────

function LessonModal({
  courseId,
  languageId,
  lesson,
  onClose,
}: Readonly<{
  courseId: string;
  languageId: string;
  lesson: Lesson | null;
  onClose: () => void;
}>) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const audioRef = useRef<HTMLInputElement>(null);

  const isEdit = !!lesson;
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [type, setType] = useState<string>(lesson?.type ?? "lesson");
  const [artist, setArtist] = useState(lesson?.artist ?? "");
  const [genre, setGenre] = useState(lesson?.genre ?? "");
  const [order, setOrder] = useState(String(lesson?.order ?? 999));
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (isEdit) {
        return apiFetch(`/educator/lessons/${lesson.id}`, {
          method: "PATCH",
          token: token!,
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            type,
            artist: artist.trim() || null,
            genre: genre.trim() || null,
            order: parseInt(order) || 999,
          }),
        });
      }
      const fd = new FormData();
      fd.append("languageId", languageId);
      fd.append("courseId", courseId);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("type", type);
      if (artist.trim()) fd.append("artist", artist.trim());
      if (genre.trim()) fd.append("genre", genre.trim());
      fd.append("order", order || "999");
      if (audioFile) fd.append("audio", audioFile);
      return apiFetch("/educator/lessons", { method: "POST", token: token!, body: fd });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = title.trim().length > 0 && description.trim().length > 0 && !save.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            {isEdit ? "Edit Lesson" : "New Lesson"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Type</label>
            <div className="flex gap-2 flex-wrap">
              {LESSON_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    type === t
                      ? "bg-brand-500 text-white"
                      : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/[0.1]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Description <span className="text-red-400">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this lesson"
              rows={3}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Audio file</label>
              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                  file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700
                  dark:file:bg-brand-900/30 dark:file:text-brand-300
                  hover:file:bg-brand-100 dark:hover:file:bg-brand-900/50"
              />
              {audioFile && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{audioFile.name} · {(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Artist</label>
              <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Optional" className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Genre</label>
              <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Optional" className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Order</label>
            <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="w-24 rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!canSave}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {save.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const [modal, setModal] = useState<"create" | Lesson | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);

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
      setDeleteId(null);
    },
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
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["educator-lessons"] }),
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      void qc.invalidateQueries({ queryKey: ["educator-courses"] });
    },
  });

  const courseTitle = course?.title ?? lessons[0]?.courseTitle ?? "Course";
  const levelLabel = course?.level ?? "";

  return (
    <div>
      <Link
        href="/educator/courses"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All courses
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
              <span className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">
                {course.courseType.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{courseTitle}</h1>
          {course?.description && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">{course.description}</p>
          )}
        </div>
        <button
          onClick={() => setModal("create")}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Lesson
        </button>
      </div>

      {/* Lessons */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">No lessons yet</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 mb-5">Create a lesson manually, or seed the stub template.</p>
          {course?.courseType && (
            <button
              onClick={() => generateStubsMutation.mutate()}
              disabled={generateStubsMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {generateStubsMutation.isPending ? "Seeding…" : "Seed stub lessons"}
            </button>
          )}
          {generateStubsMutation.isError && (
            <p className="mt-3 text-xs text-red-500">{(generateStubsMutation.error as Error).message}</p>
          )}
          {generateStubsMutation.isSuccess && (
            <p className="mt-3 text-xs text-green-600 dark:text-green-400">
              Seeded {generateStubsMutation.data.lessons} lessons — all inactive until reviewed.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 w-8">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Title</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Duration</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, i) => (
                <tr
                  key={lesson.id}
                  className={`${i < lessons.length - 1 ? "border-b border-neutral-100 dark:border-white/[0.04]" : ""} hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors`}
                >
                  <td className="px-4 py-3 text-xs text-neutral-400 tabular-nums">{lesson.order}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/educator/courses/${courseId}/lessons/${lesson.id}`}
                      className="font-medium text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 group"
                    >
                      {lesson.title}
                      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                    </Link>
                    {lesson.artist && <p className="text-xs text-neutral-400 mt-0.5">{lesson.artist}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 capitalize">
                      {lesson.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      lesson.isActive
                        ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                        : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400"
                    }`}>
                      {lesson.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs tabular-nums">
                    {fmtDuration(lesson.duration)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {lesson.audioUrl && (
                        <button
                          onClick={() => setPlayUrl(playUrl === lesson.audioUrl ? null : lesson.audioUrl)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                          title="Play audio"
                        >
                          <Play className={`h-3.5 w-3.5 ${playUrl === lesson.audioUrl ? "text-brand-500" : "text-neutral-400"}`} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: lesson.id, isActive: !lesson.isActive })}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                        title={lesson.isActive ? "Deactivate" : "Activate"}
                      >
                        {lesson.isActive
                          ? <EyeOff className="h-3.5 w-3.5 text-neutral-400" />
                          : <Eye className="h-3.5 w-3.5 text-green-500" />}
                      </button>
                      <button
                        onClick={() => setModal(lesson)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5 text-neutral-400" />
                      </button>
                      <button
                        onClick={() => setDeleteId(lesson.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/[0.1] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
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
      {playUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white dark:bg-[#0f0f1a] border border-neutral-200 dark:border-white/[0.08] rounded-2xl shadow-xl px-4 py-3">
          <audio src={playUrl} controls autoPlay className="h-8 w-64" />
          <button onClick={() => setPlayUrl(null)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06]">
            <X className="h-4 w-4 text-neutral-400" />
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      {modal !== null && (
        <LessonModal
          courseId={courseId}
          languageId={languageId}
          lesson={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-2xl p-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Delete lesson?</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              This will permanently remove the lesson and all its transcript segments.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
