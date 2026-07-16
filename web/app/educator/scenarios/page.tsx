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
 * Studio Web — Conversation Scenarios editor. Reviewer-scoped (admins see all
 * languages). Mirrors the Proverbs editor: language picker, draft/submit/publish
 * workflow, and CRUD against /educator/scenarios.
 */

type ScenarioTurn = {
  text: string;
  translation: string;
  audioUrl?: string;
};

type Scenario = {
  id: string;
  languageId: string;
  situation: string;
  turns: ScenarioTurn[];
  status?: ContentStatus;
  createdBy?: string | null;
};

type ScenarioForm = {
  situation: string;
  turns: ScenarioTurn[];
};

const EMPTY_TURN: ScenarioTurn = { text: "", translation: "", audioUrl: "" };

const EMPTY_FORM: ScenarioForm = {
  situation: "",
  turns: [{ ...EMPTY_TURN }],
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

function ScenariosEditor() {
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const languages = useScopedLanguages(me);

  const [languageId, setLanguageId] = useState<string>("");
  const activeLanguageId = languageId || languages[0]?.id || "";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScenarioForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const scenariosQuery = useQuery<Scenario[]>({
    queryKey: ["scenarios", "admin", activeLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Scenario[]>(`/educator/scenarios?languageId=${activeLanguageId}`, { token: token ?? undefined });
    },
    enabled: !!activeLanguageId,
  });

  const actor = { isAdmin: me?.isAdmin ?? false, reviewerRole: me?.reviewerRole, userId: me?.id };

  function resetForm() {
    setEditingId(null);
    setForm({ situation: "", turns: [{ ...EMPTY_TURN }] });
    setError(null);
  }

  function startEdit(s: Scenario) {
    setEditingId(s.id);
    setForm({
      situation: s.situation,
      turns: s.turns.length
        ? s.turns.map((t) => ({ text: t.text, translation: t.translation, audioUrl: t.audioUrl ?? "" }))
        : [{ ...EMPTY_TURN }],
    });
    setError(null);
  }

  function updateTurn(index: number, patch: Partial<ScenarioTurn>) {
    setForm((f) => ({
      ...f,
      turns: f.turns.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  }

  function addTurn() {
    setForm((f) => ({ ...f, turns: [...f.turns, { ...EMPTY_TURN }] }));
  }

  function removeTurn(index: number) {
    setForm((f) => ({
      ...f,
      turns: f.turns.length > 1 ? f.turns.filter((_, i) => i !== index) : f.turns,
    }));
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["scenarios", "admin", activeLanguageId] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const turns = form.turns
        .map((t) => ({
          text: t.text.trim(),
          translation: t.translation.trim(),
          audioUrl: (t.audioUrl ?? "").trim() || undefined,
        }))
        .filter((t) => t.text && t.translation);
      const payload = {
        languageId: activeLanguageId,
        situation: form.situation.trim(),
        turns,
      };
      if (editingId) {
        return apiFetch(`/educator/scenarios/${editingId}`, {
          method: "PATCH",
          token: token ?? undefined,
          body: JSON.stringify({ situation: payload.situation, turns: payload.turns }),
        });
      }
      return apiFetch("/educator/scenarios", {
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
      return apiFetch(`/educator/scenarios/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/scenarios/${id}`, {
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
      return publishContent("scenarios", id, token ?? undefined);
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const hasValidTurn = form.turns.some((t) => t.text.trim() && t.translation.trim());
  const canSave = form.situation.trim() && hasValidTurn && activeLanguageId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Scenarios</h2>
          <p className="text-sm text-neutral-500">Authored conversation scenarios with dialogue turns.</p>
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
        {...IMPORT_TYPES.scenarios}
        languageId={activeLanguageId}
        onImported={() => void queryClient.invalidateQueries({ queryKey: ["scenarios", "admin", activeLanguageId] })}
      />

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Editor form */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {editingId ? "Edit scenario" : "New scenario"}
        </h3>
        <Field
          label="Situation"
          value={form.situation}
          onChange={(v) => setForm({ ...form, situation: v })}
          required
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Turns <span className="text-red-500">*</span>
            </span>
            <ActionButton onClick={addTurn}>+ Add turn</ActionButton>
          </div>
          {form.turns.map((turn, i) => (
            <div
              key={i}
              className="rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500">Turn {i + 1}</span>
                {form.turns.length > 1 && (
                  <ActionButton tone="danger" onClick={() => removeTurn(i)}>Remove</ActionButton>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Text (native)" value={turn.text} onChange={(v) => updateTurn(i, { text: v })} required />
                <Field label="Translation (EN)" value={turn.translation} onChange={(v) => updateTurn(i, { translation: v })} required />
                <Field label="Audio URL" value={turn.audioUrl ?? ""} onChange={(v) => updateTurn(i, { audioUrl: v })} />
              </div>
            </div>
          ))}
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
        {scenariosQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
        {scenariosQuery.data?.length === 0 && <p className="text-sm text-neutral-500">No scenarios yet for this language.</p>}
        {scenariosQuery.data?.map((s) => (
          <div key={s.id} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white">{s.situation}</span>
                  <StatusPill status={s.status} />
                </div>
                <p className="text-xs text-neutral-500 mt-1">{s.turns.length} turn{s.turns.length === 1 ? "" : "s"}</p>
                {s.turns[0] && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {s.turns[0].text} — {s.turns[0].translation}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {canSubmitForReview(s.status) && (
                  <ActionButton onClick={() => submitMutation.mutate(s.id)}>Submit</ActionButton>
                )}
                {canPublishContent(s.status, s.createdBy, actor) && (
                  <ActionButton tone="publish" onClick={() => publishMutation.mutate(s.id)}>Publish</ActionButton>
                )}
                <ActionButton onClick={() => startEdit(s)}>Edit</ActionButton>
                <ActionButton tone="danger" onClick={() => deleteMutation.mutate(s.id)}>Delete</ActionButton>
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

export default function ScenariosPage() {
  return (
    <StudioShell access="reviewer">
      <ScenariosEditor />
    </StudioShell>
  );
}
