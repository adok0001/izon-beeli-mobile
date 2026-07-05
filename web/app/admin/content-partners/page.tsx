"use client";

import { StudioShell } from "@/app/(studio)/_components/studio-shell";
import { apiFetch } from "@/lib/api";
import { canPublishContent, publishContent, type ContentStatus } from "@/lib/content-workflow";
import { useMe } from "@/lib/hooks/use-me";
import { StatusPill } from "@/components/ui/status-pill";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Studio Web — Content Partners editor. Admin-only.
 * Partners are not language-scoped, so there is no language picker; the page
 * lists every partner regardless of status. Publishing is admin-only on the
 * server, and this whole page is admin-gated, so the Publish button renders
 * whenever canPublishContent() allows it (actor.isAdmin is always true here).
 */

type Partner = {
  id: string;
  name: string;
  type: string;
  region: string | null;
  url: string | null;
  logoUrl: string | null;
  languageIds: string[];
  isActive: boolean;
  status?: ContentStatus;
  createdBy?: string | null;
};

type PartnerForm = {
  id: string;
  name: string;
  type: string;
  region: string;
  url: string;
  logoUrl: string;
  languageIds: string;
};

const EMPTY_FORM: PartnerForm = {
  id: "",
  name: "",
  type: "",
  region: "",
  url: "",
  logoUrl: "",
  languageIds: "",
};

function ContentPartnersEditor() {
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const partnersQuery = useQuery<Partner[]>({
    queryKey: ["content-partners", "admin"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Partner[]>("/partners/admin", { token: token ?? undefined });
    },
  });

  const actor = { isAdmin: me?.isAdmin ?? false, reviewerRole: me?.reviewerRole, userId: me?.id };

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(p: Partner) {
    setEditingId(p.id);
    setForm({
      id: p.id,
      name: p.name,
      type: p.type,
      region: p.region ?? "",
      url: p.url ?? "",
      logoUrl: p.logoUrl ?? "",
      languageIds: (p.languageIds ?? []).join(", "),
    });
    setError(null);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["content-partners", "admin"] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const languageIds = form.languageIds.split(",").map((t) => t.trim()).filter(Boolean);
      if (editingId) {
        return apiFetch(`/partners/admin/${editingId}`, {
          method: "PATCH",
          token: token ?? undefined,
          body: JSON.stringify({
            name: form.name.trim(),
            type: form.type.trim(),
            region: form.region.trim() || null,
            url: form.url.trim() || null,
            logoUrl: form.logoUrl.trim() || null,
            languageIds,
          }),
        });
      }
      return apiFetch("/partners/admin", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({
          id: form.id.trim(),
          name: form.name.trim(),
          type: form.type.trim(),
          region: form.region.trim() || null,
          url: form.url.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
          languageIds,
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
      return apiFetch(`/partners/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async (p: Partner) => {
      const token = await getToken();
      return apiFetch(`/partners/admin/${p.id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify({ isActive: !p.isActive }),
      });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return publishContent("content_partners", id, token ?? undefined);
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const canSave = editingId
    ? form.name.trim() && form.type.trim()
    : form.id.trim() && form.name.trim() && form.type.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Content Partners</h2>
          <p className="text-sm text-neutral-500">Institutions and organizations credited across the catalogue.</p>
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
          {editingId ? "Edit partner" : "New partner"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!editingId && (
            <Field label="ID" value={form.id} onChange={(v) => setForm({ ...form, id: v })} required />
          )}
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field
            label="Type"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            required
            hint="university | research | institution"
          />
          <Field label="Region" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
          <Field label="URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} />
          <Field label="Logo URL" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} />
          <Field
            label="Language IDs (comma-separated)"
            value={form.languageIds}
            onChange={(v) => setForm({ ...form, languageIds: v })}
          />
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
        {partnersQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
        {partnersQuery.data?.length === 0 && <p className="text-sm text-neutral-500">No partners yet.</p>}
        {partnersQuery.data?.map((p) => (
          <div key={p.id} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-neutral-900 dark:text-white">{p.name}</span>
                  <StatusPill status={p.status} />
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                      p.isActive
                        ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                        : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-white/[0.06]"
                    }`}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {p.type}
                  {p.region ? ` · ${p.region}` : ""}
                </p>
                {p.languageIds?.length > 0 && (
                  <p className="text-xs text-neutral-500 mt-1">{p.languageIds.join(", ")}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {canPublishContent(p.status, p.createdBy, actor) && (
                  <ActionButton tone="publish" onClick={() => publishMutation.mutate(p.id)}>Publish</ActionButton>
                )}
                <ActionButton onClick={() => toggleMutation.mutate(p)}>
                  {p.isActive ? "Deactivate" : "Activate"}
                </ActionButton>
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
  hint,
}: Readonly<{ label: string; value: string; onChange: (v: string) => void; required?: boolean; hint?: string }>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-neutral-400 dark:text-neutral-500 font-normal"> — {hint}</span>}
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

export default function ContentPartnersPage() {
  return (
    <StudioShell access="admin">
      <ContentPartnersEditor />
    </StudioShell>
  );
}
