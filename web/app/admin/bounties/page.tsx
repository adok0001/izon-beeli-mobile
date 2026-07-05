"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Target, Trash2, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---------- Types (mirror server bountySelectFields + withProgress) ----------

type BountyStatus = "active" | "completed" | "cancelled";

interface Bounty {
  id: string;
  title: string;
  description: string;
  languageId: string;
  category: string | null;
  contributionType: string | null;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  status: string;
  expiresAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  progressPercent: number;
}

// POST /bounties/admin/create body shape
interface CreateBountyInput {
  title: string;
  description: string;
  languageId: string;
  category?: string;
  contributionType?: "word" | "phrase" | "audio";
  targetCount: number;
  xpReward: number;
  expiresAt?: string;
}

// PATCH /bounties/admin/:id body shape
interface UpdateBountyInput {
  status?: BountyStatus;
  title?: string;
  description?: string;
  targetCount?: number;
  xpReward?: number;
  expiresAt?: string | null;
}

// Editable form draft — a superset used for both create and edit.
interface BountyDraft {
  title: string;
  description: string;
  languageId: string;
  category: string;
  contributionType: "" | "word" | "phrase" | "audio";
  targetCount: string;
  xpReward: string;
  expiresAt: string; // YYYY-MM-DD
  status: BountyStatus;
}

const BLANK_DRAFT: BountyDraft = {
  title: "",
  description: "",
  languageId: "",
  category: "",
  contributionType: "",
  targetCount: "20",
  xpReward: "25",
  expiresAt: "",
  status: "active",
};

const CONTRIBUTION_TYPES = [
  { value: "", label: "Any" },
  { value: "word", label: "Word" },
  { value: "phrase", label: "Phrase" },
  { value: "audio", label: "Audio" },
] as const;

const STATUS_OPTIONS: BountyStatus[] = ["active", "completed", "cancelled"];

const STATUS_STYLES: Record<BountyStatus, string> = {
  active: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
  completed: "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  cancelled: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400",
};

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

const labelCls =
  "block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1";

function statusStyle(status: string): string {
  return STATUS_STYLES[status as BountyStatus] ?? STATUS_STYLES.cancelled;
}

function draftFromBounty(b: Bounty): BountyDraft {
  const type = b.contributionType;
  return {
    title: b.title,
    description: b.description,
    languageId: b.languageId,
    category: b.category ?? "",
    contributionType:
      type === "word" || type === "phrase" || type === "audio" ? type : "",
    targetCount: String(b.targetCount),
    xpReward: String(b.xpReward),
    expiresAt: b.expiresAt ? b.expiresAt.slice(0, 10) : "",
    status: STATUS_OPTIONS.includes(b.status as BountyStatus)
      ? (b.status as BountyStatus)
      : "active",
  };
}

// ---------- EditDrawer ----------

interface DrawerProps {
  draft: BountyDraft;
  isNew: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: BountyDraft) => void;
}

function EditDrawer({ draft: initial, isNew, isSaving, error, onClose, onSave }: DrawerProps) {
  const [d, setD] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  function set<K extends keyof BountyDraft>(field: K, value: BountyDraft[K]) {
    setD((prev) => ({ ...prev, [field]: value }));
  }

  const target = Number(d.targetCount);
  const xp = Number(d.xpReward);
  const valid =
    d.title.trim().length > 0 &&
    d.description.trim().length > 0 &&
    d.languageId.trim().length > 0 &&
    Number.isInteger(target) &&
    target > 0 &&
    Number.isInteger(xp) &&
    xp > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        ref={ref}
        className="w-full max-w-lg h-full overflow-y-auto bg-white dark:bg-neutral-900 shadow-2xl flex flex-col"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {isNew ? "New bounty" : "Edit bounty"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              className={fieldCls}
              value={d.title}
              maxLength={300}
              placeholder="e.g. Izon Food & Cooking Vocabulary"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              className={cn(fieldCls, "resize-none")}
              rows={3}
              value={d.description}
              maxLength={1000}
              placeholder="Describe what contributors should submit…"
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Language ID <span className="text-red-400">*</span>
              </label>
              <input
                className={fieldCls}
                value={d.languageId}
                maxLength={32}
                placeholder="e.g. izon"
                disabled={!isNew}
                onChange={(e) =>
                  set("languageId", e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input
                className={fieldCls}
                value={d.category}
                placeholder="e.g. food"
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Contribution type</label>
            <div className="flex gap-2">
              {CONTRIBUTION_TYPES.map((ct) => (
                <button
                  key={ct.value || "any"}
                  type="button"
                  onClick={() => set("contributionType", ct.value)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                    d.contributionType === ct.value
                      ? "bg-brand-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  )}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Target count <span className="text-red-400">*</span>
              </label>
              <input
                className={fieldCls}
                type="number"
                min={1}
                max={10000}
                value={d.targetCount}
                placeholder="20"
                onChange={(e) => set("targetCount", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>
                XP reward <span className="text-red-400">*</span>
              </label>
              <input
                className={fieldCls}
                type="number"
                min={1}
                max={1000}
                value={d.xpReward}
                placeholder="25"
                onChange={(e) => set("xpReward", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Expires at (optional)</label>
              <input
                className={fieldCls}
                type="date"
                value={d.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </div>
            {!isNew && (
              <div>
                <label className={labelCls}>Status</label>
                <select
                  className={fieldCls}
                  value={d.status}
                  onChange={(e) => set("status", e.target.value as BountyStatus)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 bg-white dark:bg-neutral-900 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!valid || isSaving}
            onClick={() => onSave(d)}
            className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            {isSaving ? "Saving…" : isNew ? "Create bounty" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function AdminBountiesPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [drawer, setDrawer] = useState<{ bounty: Bounty | null } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | BountyStatus>("all");
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    data: bounties = [],
    isLoading,
    isError,
    error: queryError,
  } = useQuery<Bounty[]>({
    queryKey: ["admin", "bounties"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Bounty[]>("/bounties/admin", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ["admin", "bounties"] });

  const saveMutation = useMutation({
    mutationFn: async ({ id, draft }: { id: string | null; draft: BountyDraft }) => {
      const token = await getToken();
      if (id === null) {
        const body: CreateBountyInput = {
          title: draft.title.trim(),
          description: draft.description.trim(),
          languageId: draft.languageId.trim(),
          targetCount: Number(draft.targetCount),
          xpReward: Number(draft.xpReward),
          ...(draft.category.trim() ? { category: draft.category.trim() } : {}),
          ...(draft.contributionType ? { contributionType: draft.contributionType } : {}),
          ...(draft.expiresAt
            ? { expiresAt: new Date(draft.expiresAt).toISOString() }
            : {}),
        };
        return apiFetch<Bounty>("/bounties/admin/create", {
          method: "POST",
          token: token ?? undefined,
          body: JSON.stringify(body),
        });
      }
      const body: UpdateBountyInput = {
        status: draft.status,
        title: draft.title.trim(),
        description: draft.description.trim(),
        targetCount: Number(draft.targetCount),
        xpReward: Number(draft.xpReward),
        expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
      };
      return apiFetch<Bounty>(`/bounties/admin/${id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      invalidate();
      setDrawer(null);
    },
    onError: (err: unknown) => {
      setMutationError(err instanceof Error ? err.message : "Failed to save bounty.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ cancelled: boolean; id: string }>(`/bounties/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: invalidate,
    onError: (err: unknown) => {
      setMutationError(err instanceof Error ? err.message : "Failed to cancel bounty.");
    },
  });

  const visible =
    statusFilter === "all"
      ? bounties
      : bounties.filter((b) => b.status === statusFilter);

  const counts = {
    active: bounties.filter((b) => b.status === "active").length,
    completed: bounties.filter((b) => b.status === "completed").length,
    cancelled: bounties.filter((b) => b.status === "cancelled").length,
  };

  function openNew() {
    setMutationError(null);
    setDrawer({ bounty: null });
  }

  function openEdit(bounty: Bounty) {
    setMutationError(null);
    setDrawer({ bounty });
  }

  function handleCancel(bounty: Bounty) {
    setMutationError(null);
    if (confirm(`Cancel "${bounty.title}"? This soft-deletes the bounty.`)) {
      cancelMutation.mutate(bounty.id);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-500" />
            Bounties
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {bounties.length} bounties across all statuses
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New bounty
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "active", "completed", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors",
              statusFilter === s
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
          >
            {s}
            {s !== "all" && counts[s] > 0 && (
              <span className="ml-1 opacity-70">({counts[s]})</span>
            )}
          </button>
        ))}
      </div>

      {mutationError && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {mutationError}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : isError ? (
        <p className="text-sm text-red-500">
          {queryError instanceof Error ? queryError.message : "Failed to load bounties."}
        </p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-neutral-400">
          {statusFilter === "all" ? "No bounties yet." : `No ${statusFilter} bounties.`}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {b.title}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full capitalize",
                      statusStyle(b.status)
                    )}
                  >
                    {b.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {b.languageId}
                  </span>
                  {b.category && (
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {b.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-2">
                  {b.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    {b.currentCount}/{b.targetCount} ({b.progressPercent}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    {b.xpReward} XP
                  </span>
                  {b.contributionType && (
                    <span className="capitalize">{b.contributionType}</span>
                  )}
                  {b.expiresAt && (
                    <span>Expires {new Date(b.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(b)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Edit bounty"
                >
                  <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                </button>
                <button
                  onClick={() => handleCancel(b)}
                  disabled={b.status === "cancelled" || cancelMutation.isPending}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30"
                  aria-label="Cancel bounty"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {drawer && (
        <EditDrawer
          draft={drawer.bounty ? draftFromBounty(drawer.bounty) : { ...BLANK_DRAFT }}
          isNew={drawer.bounty === null}
          isSaving={saveMutation.isPending}
          error={mutationError}
          onClose={() => setDrawer(null)}
          onSave={(draft) =>
            saveMutation.mutate({ id: drawer.bounty?.id ?? null, draft })
          }
        />
      )}
    </div>
  );
}
