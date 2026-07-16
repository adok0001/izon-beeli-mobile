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
import { ImportSection } from "@/components/studio/import-panel";
import { IMPORT_TYPES } from "@/lib/import-types";
import { useMemo, useState } from "react";

/**
 * Studio Web — Proverbs editor. Reviewer-scoped (admins see all languages).
 * Reference implementation for the Phase 3 authoring editors: language picker,
 * draft/submit/publish workflow, and CRUD against /proverbs/admin.
 */

type Proverb = {
  id: string;
  languageId: string;
  text: string;
  translation: string;
  translationFr: string | null;
  meaning: string;
  meaningFr: string | null;
  literal: string | null;
  context: string | null;
  tags: string[] | null;
  status?: ContentStatus;
  createdBy?: string | null;
};

type ProverbForm = {
  text: string;
  translation: string;
  translationFr: string;
  meaning: string;
  meaningFr: string;
  literal: string;
  context: string;
  tags: string;
};

const EMPTY_FORM: ProverbForm = {
  text: "",
  translation: "",
  translationFr: "",
  meaning: "",
  meaningFr: "",
  literal: "",
  context: "",
  tags: "",
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

function ProverbsEditor() {
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const languages = useScopedLanguages(me);

  const [languageId, setLanguageId] = useState<string>("");
  const activeLanguageId = languageId || languages[0]?.id || "";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProverbForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const proverbsQuery = useQuery<Proverb[]>({
    queryKey: ["proverbs", "admin", activeLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Proverb[]>(`/proverbs/admin?languageId=${activeLanguageId}`, { token: token ?? undefined });
    },
    enabled: !!activeLanguageId,
  });

  const actor = { isAdmin: me?.isAdmin ?? false, reviewerRole: me?.reviewerRole, userId: me?.id };

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(p: Proverb) {
    setEditingId(p.id);
    setForm({
      text: p.text,
      translation: p.translation,
      translationFr: p.translationFr ?? "",
      meaning: p.meaning,
      meaningFr: p.meaningFr ?? "",
      literal: p.literal ?? "",
      context: p.context ?? "",
      tags: (p.tags ?? []).join(", "),
    });
    setError(null);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["proverbs", "admin", activeLanguageId] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const payload = {
        languageId: activeLanguageId,
        text: form.text.trim(),
        translation: form.translation.trim(),
        translationFr: form.translationFr.trim() || null,
        meaning: form.meaning.trim(),
        meaningFr: form.meaningFr.trim() || null,
        literal: form.literal.trim() || null,
        context: form.context.trim() || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (editingId) {
        return apiFetch(`/proverbs/admin/${editingId}`, {
          method: "PATCH",
          token: token ?? undefined,
          body: JSON.stringify(payload),
        });
      }
      return apiFetch("/proverbs/admin", {
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
      return apiFetch(`/proverbs/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/proverbs/admin/${id}`, {
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
      return publishContent("proverbs", id, token ?? undefined);
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const canSave = form.text.trim() && form.translation.trim() && form.meaning.trim() && activeLanguageId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Proverbs</h2>
          <p className="text-sm text-neutral-500">Authored proverbs with their meanings and context.</p>
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

      <ImportSection
        {...IMPORT_TYPES.proverbs}
        languageId={activeLanguageId}
        onImported={() => void queryClient.invalidateQueries({ queryKey: ["proverbs", "admin", activeLanguageId] })}
      />

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Editor form */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {editingId ? "Edit proverb" : "New proverb"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Proverb (native)" value={form.text} onChange={(v) => setForm({ ...form, text: v })} required />
          <Field label="Translation (EN)" value={form.translation} onChange={(v) => setForm({ ...form, translation: v })} required />
          <Field label="Translation (FR)" value={form.translationFr} onChange={(v) => setForm({ ...form, translationFr: v })} />
          <Field label="Meaning (EN)" value={form.meaning} onChange={(v) => setForm({ ...form, meaning: v })} required />
          <Field label="Meaning (FR)" value={form.meaningFr} onChange={(v) => setForm({ ...form, meaningFr: v })} />
          <Field label="Literal" value={form.literal} onChange={(v) => setForm({ ...form, literal: v })} />
          <Field label="Context" value={form.context} onChange={(v) => setForm({ ...form, context: v })} />
          <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />
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
        {proverbsQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
        {proverbsQuery.data?.length === 0 && <p className="text-sm text-neutral-500">No proverbs yet for this language.</p>}
        {proverbsQuery.data?.map((p) => (
          <div key={p.id} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white">{p.text}</span>
                  <StatusPill status={p.status} />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{p.translation}</p>
                <p className="text-xs text-neutral-500 mt-1">{p.meaning}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {canSubmitForReview(p.status) && (
                  <ActionButton onClick={() => submitMutation.mutate(p.id)}>Submit</ActionButton>
                )}
                {canPublishContent(p.status, p.createdBy, actor) && (
                  <ActionButton tone="publish" onClick={() => publishMutation.mutate(p.id)}>Publish</ActionButton>
                )}
                <ActionButton onClick={() => startEdit(p)}>Edit</ActionButton>
                <ActionButton tone="danger" onClick={() => deleteMutation.mutate(p.id)}>Delete</ActionButton>
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

export default function ProverbsPage() {
  return (
    <StudioShell access="reviewer">
      <ProverbsEditor />
    </StudioShell>
  );
}
