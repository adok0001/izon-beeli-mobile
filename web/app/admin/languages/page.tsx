"use client";

import { StudioShell } from "@/app/(studio)/_components/studio-shell";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks/use-me";
import type { Language } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Studio Web — Languages catalogue editor. Admin-only, no editorial workflow.
 * A language's id is its slug (e.g. "izon") and is immutable once created.
 */

type LanguageForm = {
  id: string;
  name: string;
  nativeName: string;
  region: string;
};

const EMPTY_FORM: LanguageForm = {
  id: "",
  name: "",
  nativeName: "",
  region: "",
};

function LanguagesEditor() {
  const { getToken } = useAuth();
  useMe();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LanguageForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const languagesQuery = useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Language[]>("/languages", { token: token ?? undefined });
    },
  });

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(l: Language) {
    setEditingId(l.id);
    setForm({ id: l.id, name: l.name, nativeName: l.nativeName, region: l.region });
    setError(null);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["languages"] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (editingId) {
        return apiFetch(`/languages/admin/${editingId}`, {
          method: "PATCH",
          token: token ?? undefined,
          body: JSON.stringify({
            name: form.name.trim(),
            nativeName: form.nativeName.trim(),
            region: form.region.trim(),
          }),
        });
      }
      return apiFetch("/languages/admin", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({
          id: form.id.trim(),
          name: form.name.trim(),
          nativeName: form.nativeName.trim(),
          region: form.region.trim(),
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
      return apiFetch(`/languages/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const canSave = editingId
    ? form.name.trim() && form.nativeName.trim() && form.region.trim()
    : form.id.trim() && form.name.trim() && form.nativeName.trim() && form.region.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Languages</h2>
          <p className="text-sm text-neutral-500">The catalogue of languages available across Beeli.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Editor form */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {editingId ? "Edit language" : "New language"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!editingId && (
            <Field label="ID (slug, e.g. izon)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} required />
          )}
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Native name" value={form.nativeName} onChange={(v) => setForm({ ...form, nativeName: v })} required />
          <Field label="Region" value={form.region} onChange={(v) => setForm({ ...form, region: v })} required />
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : editingId ? "Save changes" : "Create language"}
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
        {languagesQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
        {languagesQuery.data?.length === 0 && <p className="text-sm text-neutral-500">No languages yet.</p>}
        {languagesQuery.data?.map((l) => (
          <div key={l.id} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="font-semibold text-neutral-900 dark:text-white">{l.name}</span>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {l.nativeName} · {l.region} · {l.id}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ActionButton onClick={() => startEdit(l)}>Edit</ActionButton>
                <ActionButton tone="danger" onClick={() => deleteMutation.mutate(l.id)}>Delete</ActionButton>
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

export default function LanguagesPage() {
  return (
    <StudioShell access="admin">
      <LanguagesEditor />
    </StudioShell>
  );
}
