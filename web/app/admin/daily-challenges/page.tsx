"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Pencil, Plus, Trash2, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---------- Types (mirror server dailyChallengeTemplates table) ----------

type ChallengeType =
  | "complete_quiz"
  | "review_words"
  | "listen_lesson"
  | "complete_lesson"
  | "save_words";

interface ChallengeTemplate {
  id: string;
  challengeType: ChallengeType;
  title: string;
  titleFr: string | null;
  description: string;
  descriptionFr: string | null;
  xpReward: number;
  targetCasual: number;
  targetSteady: number;
  targetIntensive: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// POST /daily-challenges/admin/create body shape
interface CreateTemplateInput {
  challengeType: ChallengeType;
  title: string;
  titleFr?: string;
  description: string;
  descriptionFr?: string;
  xpReward: number;
  targetCasual: number;
  targetSteady: number;
  targetIntensive: number;
  active?: boolean;
}

// PATCH /daily-challenges/admin/:id body shape
type UpdateTemplateInput = Partial<Omit<CreateTemplateInput, "titleFr" | "descriptionFr">> & {
  titleFr?: string | null;
  descriptionFr?: string | null;
};

// Editable form draft — a superset used for both create and edit.
interface TemplateDraft {
  challengeType: ChallengeType;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  xpReward: string;
  targetCasual: string;
  targetSteady: string;
  targetIntensive: string;
  active: boolean;
}

const BLANK_DRAFT: TemplateDraft = {
  challengeType: "complete_quiz",
  title: "",
  titleFr: "",
  description: "",
  descriptionFr: "",
  xpReward: "20",
  targetCasual: "1",
  targetSteady: "2",
  targetIntensive: "3",
  active: true,
};

const CHALLENGE_TYPES: { value: ChallengeType; label: string }[] = [
  { value: "complete_quiz", label: "Complete quiz" },
  { value: "review_words", label: "Review words" },
  { value: "listen_lesson", label: "Listen lesson" },
  { value: "complete_lesson", label: "Complete lesson" },
  { value: "save_words", label: "Save words" },
];

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

const labelCls =
  "block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1";

function draftFromTemplate(t: ChallengeTemplate): TemplateDraft {
  return {
    challengeType: t.challengeType,
    title: t.title,
    titleFr: t.titleFr ?? "",
    description: t.description,
    descriptionFr: t.descriptionFr ?? "",
    xpReward: String(t.xpReward),
    targetCasual: String(t.targetCasual),
    targetSteady: String(t.targetSteady),
    targetIntensive: String(t.targetIntensive),
    active: t.active,
  };
}

// ---------- EditDrawer ----------

interface DrawerProps {
  draft: TemplateDraft;
  isNew: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: TemplateDraft) => void;
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

  function set<K extends keyof TemplateDraft>(field: K, value: TemplateDraft[K]) {
    setD((prev) => ({ ...prev, [field]: value }));
  }

  const xp = Number(d.xpReward);
  const casual = Number(d.targetCasual);
  const steady = Number(d.targetSteady);
  const intensive = Number(d.targetIntensive);
  const valid =
    d.title.trim().length > 0 &&
    d.description.trim().length > 0 &&
    Number.isInteger(xp) &&
    xp > 0 &&
    Number.isInteger(casual) &&
    casual > 0 &&
    Number.isInteger(steady) &&
    steady > 0 &&
    Number.isInteger(intensive) &&
    intensive > 0;

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
            {isNew ? "New challenge template" : "Edit challenge template"}
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
            <label className={labelCls}>Challenge type</label>
            <select
              className={fieldCls}
              value={d.challengeType}
              onChange={(e) => set("challengeType", e.target.value as ChallengeType)}
            >
              {CHALLENGE_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              className={fieldCls}
              value={d.title}
              maxLength={200}
              placeholder="e.g. Quiz Champion"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Title (French)</label>
            <input
              className={fieldCls}
              value={d.titleFr}
              maxLength={200}
              placeholder="e.g. Champion du Quiz"
              onChange={(e) => set("titleFr", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              className={cn(fieldCls, "resize-none")}
              rows={2}
              value={d.description}
              maxLength={2000}
              placeholder="e.g. Complete a quiz session"
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Description (French)</label>
            <textarea
              className={cn(fieldCls, "resize-none")}
              rows={2}
              value={d.descriptionFr}
              maxLength={2000}
              placeholder="e.g. Terminez une session de quiz"
              onChange={(e) => set("descriptionFr", e.target.value)}
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
              placeholder="20"
              onChange={(e) => set("xpReward", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>
              Targets by daily goal <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="block text-[11px] text-neutral-400 mb-1">Casual</span>
                <input
                  className={fieldCls}
                  type="number"
                  min={1}
                  max={1000}
                  value={d.targetCasual}
                  onChange={(e) => set("targetCasual", e.target.value)}
                />
              </div>
              <div>
                <span className="block text-[11px] text-neutral-400 mb-1">Steady</span>
                <input
                  className={fieldCls}
                  type="number"
                  min={1}
                  max={1000}
                  value={d.targetSteady}
                  onChange={(e) => set("targetSteady", e.target.value)}
                />
              </div>
              <div>
                <span className="block text-[11px] text-neutral-400 mb-1">Intensive</span>
                <input
                  className={fieldCls}
                  type="number"
                  min={1}
                  max={1000}
                  value={d.targetIntensive}
                  onChange={(e) => set("targetIntensive", e.target.value)}
                />
              </div>
            </div>
          </div>

          {!isNew && (
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={d.active}
                onChange={(e) => set("active", e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700"
              />
              Active (eligible to be picked for a user&apos;s day)
            </label>
          )}

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
            {isSaving ? "Saving…" : isNew ? "Create template" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function AdminDailyChallengesPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [drawer, setDrawer] = useState<{ template: ChallengeTemplate | null } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    data: templates = [],
    isLoading,
    isError,
    error: queryError,
  } = useQuery<ChallengeTemplate[]>({
    queryKey: ["admin", "daily-challenge-templates"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ChallengeTemplate[]>("/daily-challenges/admin", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ["admin", "daily-challenge-templates"] });

  const saveMutation = useMutation({
    mutationFn: async ({ id, draft }: { id: string | null; draft: TemplateDraft }) => {
      const token = await getToken();
      if (id === null) {
        const body: CreateTemplateInput = {
          challengeType: draft.challengeType,
          title: draft.title.trim(),
          description: draft.description.trim(),
          xpReward: Number(draft.xpReward),
          targetCasual: Number(draft.targetCasual),
          targetSteady: Number(draft.targetSteady),
          targetIntensive: Number(draft.targetIntensive),
          ...(draft.titleFr.trim() ? { titleFr: draft.titleFr.trim() } : {}),
          ...(draft.descriptionFr.trim() ? { descriptionFr: draft.descriptionFr.trim() } : {}),
        };
        return apiFetch<ChallengeTemplate>("/daily-challenges/admin/create", {
          method: "POST",
          token: token ?? undefined,
          body: JSON.stringify(body),
        });
      }
      const body: UpdateTemplateInput = {
        challengeType: draft.challengeType,
        title: draft.title.trim(),
        titleFr: draft.titleFr.trim() || null,
        description: draft.description.trim(),
        descriptionFr: draft.descriptionFr.trim() || null,
        xpReward: Number(draft.xpReward),
        targetCasual: Number(draft.targetCasual),
        targetSteady: Number(draft.targetSteady),
        targetIntensive: Number(draft.targetIntensive),
        active: draft.active,
      };
      return apiFetch<ChallengeTemplate>(`/daily-challenges/admin/${id}`, {
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
      setMutationError(err instanceof Error ? err.message : "Failed to save template.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deactivated: boolean; id: string }>(`/daily-challenges/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: invalidate,
    onError: (err: unknown) => {
      setMutationError(err instanceof Error ? err.message : "Failed to deactivate template.");
    },
  });

  const visible =
    statusFilter === "all"
      ? templates
      : templates.filter((t) => (statusFilter === "active" ? t.active : !t.active));

  const counts = {
    active: templates.filter((t) => t.active).length,
    inactive: templates.filter((t) => !t.active).length,
  };

  function openNew() {
    setMutationError(null);
    setDrawer({ template: null });
  }

  function openEdit(template: ChallengeTemplate) {
    setMutationError(null);
    setDrawer({ template });
  }

  function handleDeactivate(template: ChallengeTemplate) {
    setMutationError(null);
    if (confirm(`Deactivate "${template.title}"? It will stop being assigned to users.`)) {
      deactivateMutation.mutate(template.id);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-brand-500" />
            Daily Challenges
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {templates.length} templates — 3 are picked per user per day from the active pool
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New template
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "active", "inactive"] as const).map((s) => (
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
          {queryError instanceof Error ? queryError.message : "Failed to load templates."}
        </p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-neutral-400">
          {statusFilter === "all" ? "No templates yet." : `No ${statusFilter} templates.`}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {t.title}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full capitalize",
                      t.active
                        ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400"
                    )}
                  >
                    {t.active ? "active" : "inactive"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t.challengeType.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-2">
                  {t.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    {t.xpReward} XP
                  </span>
                  <span>
                    Target — Casual {t.targetCasual} · Steady {t.targetSteady} · Intensive{" "}
                    {t.targetIntensive}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(t)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Edit template"
                >
                  <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                </button>
                <button
                  onClick={() => handleDeactivate(t)}
                  disabled={!t.active || deactivateMutation.isPending}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30"
                  aria-label="Deactivate template"
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
          draft={drawer.template ? draftFromTemplate(drawer.template) : { ...BLANK_DRAFT }}
          isNew={drawer.template === null}
          isSaving={saveMutation.isPending}
          error={mutationError}
          onClose={() => setDrawer(null)}
          onSave={(draft) =>
            saveMutation.mutate({ id: drawer.template?.id ?? null, draft })
          }
        />
      )}
    </div>
  );
}
