"use client";

import { StudioShell } from "@/app/(studio)/_components/studio-shell";
import { apiFetch } from "@/lib/api";
import {
  canPublishContent,
  canSubmitForReview,
  publishContent,
  type ContentStatus,
} from "@/lib/content-workflow";
import { useMe } from "@/lib/hooks/use-me";
import { StatusPill } from "@/components/ui/status-pill";
import type { Language, UserMe } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

/**
 * Studio Web — Story Arc editor. Reviewer-scoped (admins see all languages).
 * Arcs belong to a course and carry ordered chapters. The list endpoint is
 * language-scoped server-side, so we filter client-side by the active language.
 */

type Chapter = {
  id?: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
};

type StoryArcSummary = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  updatedAt: string;
  status?: ContentStatus;
  createdBy?: string | null;
  languageId: string;
};

type StoryArcDetail = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  chapters: Chapter[];
};

type ArcForm = {
  courseId: string;
  title: string;
  description: string;
};

const EMPTY_FORM: ArcForm = {
  courseId: "",
  title: "",
  description: "",
};

const EMPTY_CHAPTER: Chapter = {
  lessonId: "",
  title: "",
  narrativeIntro: "",
  narrativeOutro: "",
  order: 0,
};

/** Languages a user may edit: reviewers are scoped; admins get the full catalogue. */
function useScopedLanguages(me: UserMe | undefined) {
  const { getToken } = useAuth();
  const { data: allLanguages } = useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Language[]>("/languages", { token: token ?? undefined });
    },
    enabled: me?.isAdmin === true,
  });

  return useMemo(() => {
    if (!me) return [];
    if (me.isAdmin) return allLanguages ?? [];
    return me.reviewerLanguages.map((id) => ({ id, name: id, nativeName: id, region: "" }));
  }, [me, allLanguages]);
}

function StoryArcsEditor() {
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const languages = useScopedLanguages(me);

  const [languageId, setLanguageId] = useState<string>("");
  const activeLanguageId = languageId || languages[0]?.id || "";

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingArcId, setEditingArcId] = useState<string | null>(null);
  const [form, setForm] = useState<ArcForm>(EMPTY_FORM);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);

  const arcsQuery = useQuery<StoryArcSummary[]>({
    queryKey: ["story-arcs", "admin"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<StoryArcSummary[]>("/educator/story-arcs", { token: token ?? undefined });
    },
  });

  const visibleArcs = useMemo(
    () => (arcsQuery.data ?? []).filter((a) => a.languageId === activeLanguageId),
    [arcsQuery.data, activeLanguageId],
  );

  const detailQuery = useQuery<StoryArcDetail>({
    queryKey: ["story-arcs", "detail", editingCourseId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<StoryArcDetail>(`/educator/story-arcs/${editingCourseId}`, { token: token ?? undefined });
    },
    enabled: !!editingCourseId,
  });

  const actor = { isAdmin: me?.isAdmin ?? false, reviewerRole: me?.reviewerRole, userId: me?.id };

  function resetForm() {
    setEditingCourseId(null);
    setEditingArcId(null);
    setForm(EMPTY_FORM);
    setChapters([]);
    setError(null);
  }

  function startEdit(a: StoryArcSummary) {
    setEditingCourseId(a.courseId);
    setEditingArcId(a.id);
    setForm({ courseId: a.courseId, title: a.title, description: a.description });
    setChapters([]);
    setError(null);
  }

  function loadDetail() {
    if (!detailQuery.data) return;
    setForm({
      courseId: detailQuery.data.courseId,
      title: detailQuery.data.title,
      description: detailQuery.data.description,
    });
    setChapters(detailQuery.data.chapters ?? []);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["story-arcs", "admin"] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (editingArcId) {
        return apiFetch(`/educator/story-arcs/${editingArcId}`, {
          method: "PUT",
          token: token ?? undefined,
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
          }),
        });
      }
      return apiFetch("/educator/story-arcs", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({
          courseId: form.courseId.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
        }),
      });
    },
    onSuccess: () => {
      resetForm();
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const saveChaptersMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!editingArcId) return;
      return apiFetch(`/educator/story-arcs/${editingArcId}/chapters`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({
          chapters: chapters.map((c, i) => ({
            id: c.id,
            lessonId: c.lessonId.trim(),
            title: c.title.trim(),
            narrativeIntro: c.narrativeIntro.trim(),
            narrativeOutro: c.narrativeOutro.trim(),
            order: c.order ?? i,
          })),
        }),
      });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${id}`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({ status: "in_review" }),
      });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return publishContent("story_arcs", id, token ?? undefined);
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  function updateChapter(index: number, patch: Partial<Chapter>) {
    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function addChapter() {
    setChapters((prev) => [...prev, { ...EMPTY_CHAPTER, order: prev.length }]);
  }

  function removeChapter(index: number) {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  }

  const canSave = editingArcId
    ? form.title.trim().length > 0
    : form.courseId.trim() && form.title.trim() && activeLanguageId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Seasons</h2>
          <p className="text-sm text-neutral-500">Seasons that thread a course&apos;s lessons into chapters.</p>
        </div>
        <select
          value={activeLanguageId}
          onChange={(e) => setLanguageId(e.target.value)}
          className="rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-neutral-900 dark:text-white"
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.id})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Editor form */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {editingArcId ? "Edit season" : "New season"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Course ID"
            value={form.courseId}
            onChange={(v) => setForm({ ...form, courseId: v })}
            required
            disabled={!!editingArcId}
          />
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : editingArcId ? "Save season" : "Create draft"}
          </button>
          {editingArcId && (
            <button onClick={resetForm} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05]">
              Cancel
            </button>
          )}
        </div>

        {/* Chapters editor (edit mode only) */}
        {editingArcId && (
          <div className="mt-4 space-y-3 border-t border-neutral-200 dark:border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Chapters</h4>
              <div className="flex items-center gap-1.5">
                {detailQuery.data && (
                  <ActionButton onClick={loadDetail}>
                    {detailQuery.isPending ? "Loading…" : "Load chapters"}
                  </ActionButton>
                )}
                <ActionButton onClick={addChapter}>Add chapter</ActionButton>
              </div>
            </div>

            {chapters.length === 0 && (
              <p className="text-sm text-neutral-500">No chapters loaded. Load existing chapters or add a new one.</p>
            )}

            {chapters.map((c, i) => (
              <div key={c.id ?? `new-${i}`} className="rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">Chapter {i + 1}</span>
                  <ActionButton tone="danger" onClick={() => removeChapter(i)}>Remove</ActionButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Lesson ID" value={c.lessonId} onChange={(v) => updateChapter(i, { lessonId: v })} required />
                  <Field label="Title" value={c.title} onChange={(v) => updateChapter(i, { title: v })} required />
                  <Field label="Narrative intro" value={c.narrativeIntro} onChange={(v) => updateChapter(i, { narrativeIntro: v })} />
                  <Field label="Narrative outro" value={c.narrativeOutro} onChange={(v) => updateChapter(i, { narrativeOutro: v })} />
                  <Field
                    label="Order"
                    value={String(c.order)}
                    onChange={(v) => updateChapter(i, { order: Number(v) || 0 })}
                  />
                </div>
              </div>
            ))}

            <button
              disabled={saveChaptersMutation.isPending}
              onClick={() => saveChaptersMutation.mutate()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saveChaptersMutation.isPending ? "Saving…" : "Save chapters"}
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {arcsQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
        {!arcsQuery.isPending && visibleArcs.length === 0 && (
          <p className="text-sm text-neutral-500">No seasons yet for this language.</p>
        )}
        {visibleArcs.map((a) => (
          <div key={a.id} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white">{a.title}</span>
                  <StatusPill status={a.status} />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{a.description}</p>
                <p className="text-xs text-neutral-500 mt-1">Course: {a.courseId}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {canSubmitForReview(a.status) && (
                  <ActionButton onClick={() => submitMutation.mutate(a.id)}>Submit</ActionButton>
                )}
                {canPublishContent(a.status, a.createdBy, actor) && (
                  <ActionButton tone="publish" onClick={() => publishMutation.mutate(a.id)}>Publish</ActionButton>
                )}
                <ActionButton onClick={() => startEdit(a)}>Edit</ActionButton>
                <ActionButton tone="danger" onClick={() => deleteMutation.mutate(a.id)}>Delete</ActionButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  disabled,
}: Readonly<{ label: string; value: string; onChange: (v: string) => void; required?: boolean; disabled?: boolean }>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-neutral-900 dark:text-white disabled:opacity-50"
      />
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  tone,
}: Readonly<{ children: React.ReactNode; onClick: () => void; tone?: "publish" | "danger" }>) {
  const cls =
    tone === "publish"
      ? "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
      : tone === "danger"
      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05]";
  return (
    <button onClick={onClick} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${cls}`}>
      {children}
    </button>
  );
}

export default function StoryArcsPage() {
  return (
    <StudioShell access="reviewer">
      <StoryArcsEditor />
    </StudioShell>
  );
}
