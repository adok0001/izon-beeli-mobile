"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronDown, ChevronRight, Edit2, Layers, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

interface AdminCourse {
  id: string;
  languageId: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  level: string;
  lessonsCount: number;
  order: number;
}

interface AdminLesson {
  id: string;
  courseId: string;
  title: string;
  titleFr?: string | null;
  description: string;
  audioUrl?: string | null;
  duration?: number | null;
  order: number;
}

const LANGUAGES = [
  "izon", "akan", "amharic", "yoruba", "swahili", "hausa", "igbo", "oromo",
];
const LEVELS = ["beginner", "intermediate", "advanced"];

// ── Inline Form ───────────────────────────────────────────────────────────────

function CourseForm({
  initial,
  onSave,
  onCancel,
  saving,
}: Readonly<{
  initial?: Partial<AdminCourse>;
  onSave: (data: Omit<AdminCourse, "lessonsCount">) => void;
  onCancel: () => void;
  saving: boolean;
}>) {
  const [id, setId] = useState(initial?.id ?? "");
  const [languageId, setLanguageId] = useState(initial?.languageId ?? "izon");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleFr, setTitleFr] = useState(initial?.titleFr ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionFr, setDescriptionFr] = useState(initial?.descriptionFr ?? "");
  const [level, setLevel] = useState(initial?.level ?? "beginner");
  const [order, setOrder] = useState(initial?.order ?? 0);

  const fieldCls = "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">ID *</label>
          <input className={fieldCls} value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. izon-beginner-1" disabled={!!initial?.id} />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Language *</label>
          <select className={fieldCls} value={languageId} onChange={(e) => setLanguageId(e.target.value)}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Title (EN) *</label>
          <input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Title (FR)</label>
          <input className={fieldCls} value={titleFr} onChange={(e) => setTitleFr(e.target.value)} placeholder="Titre du cours" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Description (EN) *</label>
        <textarea className={cn(fieldCls, "resize-none")} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Course description" />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Description (FR)</label>
        <textarea className={cn(fieldCls, "resize-none")} rows={2} value={descriptionFr} onChange={(e) => setDescriptionFr(e.target.value)} placeholder="Description en français" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Level *</label>
          <select className={fieldCls} value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Order</label>
          <input type="number" className={fieldCls} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Cancel</button>
        <button
          onClick={() => onSave({ id, languageId, title, titleFr: titleFr || null, description, descriptionFr: descriptionFr || null, level, order })}
          disabled={saving || !id || !title || !description}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function LessonForm({
  courseId,
  initial,
  onSave,
  onCancel,
  saving,
}: Readonly<{
  courseId: string;
  initial?: Partial<AdminLesson>;
  onSave: (data: Omit<AdminLesson, "courseId">) => void;
  onCancel: () => void;
  saving: boolean;
}>) {
  const [id, setId] = useState(initial?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleFr, setTitleFr] = useState(initial?.titleFr ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [order, setOrder] = useState(initial?.order ?? 0);

  const fieldCls = "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 p-4 ml-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Lesson ID *</label>
          <input className={fieldCls} value={id} onChange={(e) => setId(e.target.value)} placeholder={`${courseId}-lesson-1`} disabled={!!initial?.id} />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Order</label>
          <input type="number" className={fieldCls} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Title (EN) *</label>
          <input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title" />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Title (FR)</label>
          <input className={fieldCls} value={titleFr} onChange={(e) => setTitleFr(e.target.value)} placeholder="Titre de la leçon" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Description (EN) *</label>
        <textarea className={cn(fieldCls, "resize-none")} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Audio URL</label>
          <input className={fieldCls} value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://…/audio.mp3" />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Duration (seconds)</label>
          <input type="number" className={fieldCls} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Cancel</button>
        <button
          onClick={() => onSave({ id, title, titleFr: titleFr || null, description, audioUrl: audioUrl || null, duration: duration ? Number(duration) : null, order })}
          disabled={saving || !id || !title || !description}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save Lesson"}
        </button>
      </div>
    </div>
  );
}

// ── Lessons sub-panel ─────────────────────────────────────────────────────────

function LessonsPanel({ courseId, token }: Readonly<{ courseId: string; token: string | null }>) {
  const qc = useQueryClient();
  const [addingLesson, setAddingLesson] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: lessons = [], isLoading } = useQuery<AdminLesson[]>({
    queryKey: ["admin", "lessons", courseId],
    queryFn: () => apiFetch<AdminLesson[]>(`/admin/lessons?courseId=${courseId}`, { token: token ?? undefined }),
    enabled: !!token,
  });

  const createLesson = useMutation({
    mutationFn: (data: AdminLesson) =>
      apiFetch(`/admin/lessons`, { method: "POST", body: JSON.stringify(data), token: token ?? undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "lessons", courseId] });
      void qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      setAddingLesson(false);
    },
  });

  const updateLesson = useMutation({
    mutationFn: ({ id, ...data }: Partial<AdminLesson> & { id: string }) =>
      apiFetch(`/admin/lessons/${id}`, { method: "PATCH", body: JSON.stringify(data), token: token ?? undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "lessons", courseId] });
      setEditingId(null);
    },
  });

  const deleteLesson = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/lessons/${id}`, { method: "DELETE", token: token ?? undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "lessons", courseId] });
      void qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
  });

  return (
    <div className="ml-4 mt-3 space-y-2 border-l-2 border-neutral-100 dark:border-neutral-800 pl-4">
      {isLoading && <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />}
      {lessons.map((lesson) =>
        editingId === lesson.id ? (
          <LessonForm
            key={lesson.id}
            courseId={courseId}
            initial={lesson}
            saving={updateLesson.isPending}
            onCancel={() => setEditingId(null)}
            onSave={(data) => updateLesson.mutate({ ...data, id: lesson.id })}
          />
        ) : (
          <div
            key={lesson.id}
            className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-sm"
          >
            <BookOpen className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <span className="flex-1 font-medium text-neutral-800 dark:text-neutral-200 truncate">{lesson.title}</span>
            {lesson.duration && (
              <span className="text-xs text-neutral-400">{Math.round(lesson.duration / 60)}m</span>
            )}
            <button onClick={() => setEditingId(lesson.id)} className="p-1 text-neutral-400 hover:text-brand-500 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
            <button
              onClick={() => { if (confirm(`Delete lesson "${lesson.title}"?`)) deleteLesson.mutate(lesson.id); }}
              className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      )}
      {addingLesson ? (
        <LessonForm
          courseId={courseId}
          saving={createLesson.isPending}
          onCancel={() => setAddingLesson(false)}
          onSave={(data) => createLesson.mutate({ courseId, ...data })}
        />
      ) : (
        <button
          onClick={() => setAddingLesson(true)}
          className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline px-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add lesson
        </button>
      )}
    </div>
  );
}

// ── Course Row ────────────────────────────────────────────────────────────────

function CourseRow({
  course,
  token,
  onEdit,
  onDelete,
}: Readonly<{
  course: AdminCourse;
  token: string | null;
  onEdit: () => void;
  onDelete: () => void;
}>) {
  const [expanded, setExpanded] = useState(false);
  const levelColors: Record<string, string> = {
    beginner: "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
    intermediate: "text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
    advanced: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setExpanded((v) => !v)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">{course.title}</p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", levelColors[course.level] ?? "text-neutral-600 bg-neutral-100")}>{course.level}</span>
            <span className="text-xs text-neutral-400 capitalize">{course.languageId}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{course.id}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 shrink-0">
          <Layers className="h-3.5 w-3.5" />
          {course.lessonsCount}
        </div>
        <button onClick={onEdit} className="p-1.5 text-neutral-400 hover:text-brand-500 transition-colors"><Edit2 className="h-4 w-4" /></button>
        <button onClick={onDelete} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <LessonsPanel courseId={course.id} token={token} />
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCoursesPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [addingCourse, setAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [filterLang, setFilterLang] = useState("all");

  // Eagerly get token once
  useState(() => {
    getToken().then((t) => setToken(t));
  });

  const { data: courses = [], isLoading } = useQuery<AdminCourse[]>({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const t = await getToken();
      setToken(t);
      return apiFetch<AdminCourse[]>("/admin/courses", { token: t ?? undefined });
    },
    staleTime: 15_000,
  });

  const createCourse = useMutation({
    mutationFn: (data: Omit<AdminCourse, "lessonsCount">) =>
      apiFetch("/admin/courses", { method: "POST", body: JSON.stringify(data), token: token ?? undefined }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "courses"] }); setAddingCourse(false); },
  });

  const updateCourse = useMutation({
    mutationFn: ({ id, ...data }: Partial<AdminCourse> & { id: string }) =>
      apiFetch(`/admin/courses/${id}`, { method: "PATCH", body: JSON.stringify(data), token: token ?? undefined }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "courses"] }); setEditingCourse(null); },
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/courses/${id}`, { method: "DELETE", token: token ?? undefined }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "courses"] }); },
  });

  const filtered = filterLang === "all" ? courses : courses.filter((c) => c.languageId === filterLang);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Courses</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{courses.length} total courses</p>
        </div>
        <button
          onClick={() => { setAddingCourse(true); setEditingCourse(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Course
        </button>
      </div>

      {/* Language filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {["all", ...LANGUAGES].map((l) => (
          <button
            key={l}
            onClick={() => setFilterLang(l)}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize",
              filterLang === l
                ? "bg-brand-600 text-white border-brand-600"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-brand-400"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {addingCourse && (
        <div className="mb-4">
          <CourseForm
            saving={createCourse.isPending}
            onCancel={() => setAddingCourse(false)}
            onSave={(data) => createCourse.mutate(data)}
          />
        </div>
      )}

      {editingCourse && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Edit2 className="h-4 w-4" /> Editing: {editingCourse.title}
            <button onClick={() => setEditingCourse(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
          <CourseForm
            initial={editingCourse}
            saving={updateCourse.isPending}
            onCancel={() => setEditingCourse(null)}
            onSave={(data) => updateCourse.mutate({ ...data, id: editingCourse.id })}
          />
        </div>
      )}

      <div className="space-y-3">
        {isLoading && Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
        {filtered.map((course) => (
          <CourseRow
            key={course.id}
            course={course}
            token={token}
            onEdit={() => { setEditingCourse(course); setAddingCourse(false); }}
            onDelete={() => { if (confirm(`Delete course "${course.title}"?`)) deleteCourse.mutate(course.id); }}
          />
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-400 dark:text-neutral-500">
            <BookOpen className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">No courses yet. Add one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
