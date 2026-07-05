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
 * Studio Web — Quiz Bank editor. Reviewer-scoped (admins see all languages).
 * Mirrors the Proverbs editor: language picker, draft/submit/publish workflow,
 * and CRUD against /quiz-bank/admin.
 */

type QuizQuestionEntity = {
  id: string;
  languageId: string;
  type: string;
  prompt: string;
  answer: string;
  options: string[];
  audioUrl: string | null;
  explanation: string | null;
  status?: ContentStatus;
  createdBy?: string | null;
};

type QuizForm = {
  type: string;
  prompt: string;
  answer: string;
  options: string;
  audioUrl: string;
  explanation: string;
};

const QUIZ_TYPES = ["word-to-english", "english-to-word", "fill-in-the-blank", "listening"] as const;

const EMPTY_FORM: QuizForm = {
  type: QUIZ_TYPES[0],
  prompt: "",
  answer: "",
  options: "",
  audioUrl: "",
  explanation: "",
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

function QuizBankEditor() {
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const languages = useScopedLanguages(me);

  const [languageId, setLanguageId] = useState<string>("");
  const activeLanguageId = languageId || languages[0]?.id || "";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuizForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const questionsQuery = useQuery<QuizQuestionEntity[]>({
    queryKey: ["quiz-bank", "admin", activeLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<QuizQuestionEntity[]>(`/quiz-bank/admin?languageId=${activeLanguageId}`, { token: token ?? undefined });
    },
    enabled: !!activeLanguageId,
  });

  const actor = { isAdmin: me?.isAdmin ?? false, reviewerRole: me?.reviewerRole, userId: me?.id };

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(q: QuizQuestionEntity) {
    setEditingId(q.id);
    setForm({
      type: q.type,
      prompt: q.prompt,
      answer: q.answer,
      options: (q.options ?? []).join(", "),
      audioUrl: q.audioUrl ?? "",
      explanation: q.explanation ?? "",
    });
    setError(null);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["quiz-bank", "admin", activeLanguageId] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const payload = {
        languageId: activeLanguageId,
        type: form.type.trim(),
        prompt: form.prompt.trim(),
        answer: form.answer.trim(),
        options: form.options.split(",").map((o) => o.trim()).filter(Boolean),
        audioUrl: form.audioUrl.trim() || null,
        explanation: form.explanation.trim() || null,
      };
      if (editingId) {
        return apiFetch(`/quiz-bank/admin/${editingId}`, {
          method: "PATCH",
          token: token ?? undefined,
          body: JSON.stringify(payload),
        });
      }
      return apiFetch("/quiz-bank/admin", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      resetForm();
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/quiz-bank/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/quiz-bank/admin/${id}`, {
        method: "PATCH",
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
      return publishContent("quiz_questions", id, token ?? undefined);
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const canSave = form.type.trim() && form.prompt.trim() && form.answer.trim() && activeLanguageId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Quiz Bank</h2>
          <p className="text-sm text-neutral-500">Authored quiz questions across question types.</p>
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
          {editingId ? "Edit question" : "New question"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Type <span className="text-red-500">*</span>
            </span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-neutral-900 dark:text-white"
            >
              {QUIZ_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <Field label="Prompt" value={form.prompt} onChange={(v) => setForm({ ...form, prompt: v })} required />
          <Field label="Answer" value={form.answer} onChange={(v) => setForm({ ...form, answer: v })} required />
          <Field label="Options (comma-separated)" value={form.options} onChange={(v) => setForm({ ...form, options: v })} />
          <Field label="Audio URL" value={form.audioUrl} onChange={(v) => setForm({ ...form, audioUrl: v })} />
          <Field label="Explanation" value={form.explanation} onChange={(v) => setForm({ ...form, explanation: v })} />
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : editingId ? "Save changes" : "Create draft"}
          </button>
          {editingId && (
            <button onClick={resetForm} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05]">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {questionsQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
        {questionsQuery.data?.length === 0 && <p className="text-sm text-neutral-500">No questions yet for this language.</p>}
        {questionsQuery.data?.map((q) => (
          <div key={q.id} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white">{q.prompt}</span>
                  <StatusPill status={q.status} />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{q.answer}</p>
                <p className="text-xs text-neutral-500 mt-1">{q.type}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {canSubmitForReview(q.status) && (
                  <ActionButton onClick={() => submitMutation.mutate(q.id)}>Submit</ActionButton>
                )}
                {canPublishContent(q.status, q.createdBy, actor) && (
                  <ActionButton tone="publish" onClick={() => publishMutation.mutate(q.id)}>Publish</ActionButton>
                )}
                <ActionButton onClick={() => startEdit(q)}>Edit</ActionButton>
                <ActionButton tone="danger" onClick={() => deleteMutation.mutate(q.id)}>Delete</ActionButton>
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
}: Readonly<{ label: string; value: string; onChange: (v: string) => void; required?: boolean }>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-neutral-900 dark:text-white"
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

export default function QuizBankPage() {
  return (
    <StudioShell access="reviewer">
      <QuizBankEditor />
    </StudioShell>
  );
}
