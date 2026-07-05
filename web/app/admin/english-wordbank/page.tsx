"use client";

import { StudioShell } from "@/app/(studio)/_components/studio-shell";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks/use-me";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Studio Web — English wordbank editor. Admin-only, no editorial workflow.
 * Entries carry a `translations` map (read-only here) surfaced by the public list.
 */

type WordbankEntry = {
  id: string;
  word: string;
  definition: string | null;
  category: string;
  posType: string | null;
  translations?: Record<string, unknown>;
};

type WordbankForm = {
  id: string;
  word: string;
  definition: string;
  category: string;
  posType: string;
};

const EMPTY_FORM: WordbankForm = {
  id: "",
  word: "",
  definition: "",
  category: "",
  posType: "",
};

function WordbankEditor() {
  const { getToken } = useAuth();
  useMe();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WordbankForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const entriesQuery = useQuery<WordbankEntry[]>({
    queryKey: ["english-wordbank", search],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<WordbankEntry[]>(
        `/english-wordbank?search=${encodeURIComponent(search)}&limit=100`,
        { token: token ?? undefined },
      );
    },
  });

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(e: WordbankEntry) {
    setEditingId(e.id);
    setForm({
      id: e.id,
      word: e.word,
      definition: e.definition ?? "",
      category: e.category,
      posType: e.posType ?? "",
    });
    setError(null);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["english-wordbank"] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (editingId) {
        return apiFetch(`/english-wordbank/admin/${editingId}`, {
          method: "PATCH",
          token: token ?? undefined,
          body: JSON.stringify({
            word: form.word.trim(),
            definition: form.definition.trim() || null,
            category: form.category.trim(),
            posType: form.posType.trim() || null,
          }),
        });
      }
      return apiFetch("/english-wordbank/admin", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({
          id: form.id.trim(),
          word: form.word.trim(),
          definition: form.definition.trim() || null,
          category: form.category.trim(),
          posType: form.posType.trim() || null,
        }),
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
      return apiFetch(`/english-wordbank/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const canSave = editingId
    ? form.word.trim() && form.category.trim()
    : form.id.trim() && form.word.trim() && form.category.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">English wordbank</h2>
          <p className="text-sm text-neutral-500">The English source vocabulary used across translations.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-neutral-900 dark:text-white"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Editor form */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {editingId ? "Edit entry" : "New entry"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!editingId && (
            <Field label="ID" value={form.id} onChange={(v) => setForm({ ...form, id: v })} required />
          )}
          <Field label="Word" value={form.word} onChange={(v) => setForm({ ...form, word: v })} required />
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} required />
          <Field label="Part of speech" value={form.posType} onChange={(v) => setForm({ ...form, posType: v })} />
          <Field label="Definition" value={form.definition} onChange={(v) => setForm({ ...form, definition: v })} />
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : editingId ? "Save changes" : "Create entry"}
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
        {entriesQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
        {entriesQuery.data?.length === 0 && <p className="text-sm text-neutral-500">No entries found.</p>}
        {entriesQuery.data?.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="font-semibold text-neutral-900 dark:text-white">{entry.word}</span>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {entry.category}
                  {entry.posType ? ` · ${entry.posType}` : ""}
                </p>
                {entry.definition && <p className="text-xs text-neutral-500 mt-1">{entry.definition}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ActionButton onClick={() => startEdit(entry)}>Edit</ActionButton>
                <ActionButton tone="danger" onClick={() => deleteMutation.mutate(entry.id)}>Delete</ActionButton>
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

export default function EnglishWordbankPage() {
  return (
    <StudioShell access="admin">
      <WordbankEditor />
    </StudioShell>
  );
}
