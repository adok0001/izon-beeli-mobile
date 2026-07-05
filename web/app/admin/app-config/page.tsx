"use client";

import { StudioShell } from "@/app/(studio)/_components/studio-shell";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Studio Web — App Config editor. Admin-only feature-flag / key-value store.
 * No editorial workflow: each entry is a plain { key, value } string pair,
 * upserted via PATCH /admin/config. Boolean-ish flags ("true"/"false") are
 * treated as plain strings.
 */

type ConfigEntry = {
  key: string;
  value: string;
};

function AppConfigEditor() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const configQuery = useQuery<ConfigEntry[]>({
    queryKey: ["app-config"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ConfigEntry[]>("/admin/config", { token: token ?? undefined });
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["app-config"] });
  }

  const upsertMutation = useMutation({
    mutationFn: async ({ key, value }: ConfigEntry) => {
      const token = await getToken();
      return apiFetch("/admin/config", {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify({ key, value }),
      });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const token = await getToken();
      return apiFetch(`/admin/config/${encodeURIComponent(key)}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  function addFlag() {
    const key = newKey.trim();
    if (!key) return;
    upsertMutation.mutate(
      { key, value: newValue },
      {
        onSuccess: () => {
          setNewKey("");
          setNewValue("");
          invalidate();
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">App Config</h2>
          <p className="text-sm text-neutral-500">Feature flags and runtime key-value settings.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Add flag form */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Add flag</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Key" value={newKey} onChange={setNewKey} required />
          <Field label="Value" value={newValue} onChange={setNewValue} />
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!newKey.trim() || upsertMutation.isPending}
            onClick={addFlag}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {upsertMutation.isPending ? "Saving…" : "Add flag"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {configQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
        {configQuery.data?.length === 0 && <p className="text-sm text-neutral-500">No config entries yet.</p>}
        {configQuery.data?.map((entry) => (
          <ConfigRow
            key={entry.key}
            entry={entry}
            onSave={(value) => upsertMutation.mutate({ key: entry.key, value })}
            onDelete={() => deleteMutation.mutate(entry.key)}
          />
        ))}
      </div>
    </div>
  );
}

function ConfigRow({
  entry,
  onSave,
  onDelete,
}: Readonly<{ entry: ConfigEntry; onSave: (value: string) => void; onDelete: () => void }>) {
  const [value, setValue] = useState(entry.value);
  const dirty = value !== entry.value;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-white min-w-0 break-all">
          {entry.key}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-neutral-900 dark:text-white"
          />
          <ActionButton tone="publish" onClick={() => onSave(value)}>
            {dirty ? "Save*" : "Save"}
          </ActionButton>
          <ActionButton tone="danger" onClick={onDelete}>Delete</ActionButton>
        </div>
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

export default function AppConfigPage() {
  return (
    <StudioShell access="admin">
      <AppConfigEditor />
    </StudioShell>
  );
}
