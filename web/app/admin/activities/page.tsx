"use client";

import { apiFetch } from "@/lib/api";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gamepad2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Activity, ActivityType } from "./_components/shared";
import { ActivityRow } from "./_components/activity-row";
import { VisualPlacementForm } from "./_components/visual-placement-form";
import { VisualSoundboardForm } from "./_components/visual-soundboard-form";

// ── Page ──────────────────────────────────────────────────────────────────────

type Creating = { open: false } | { open: true; activityType: ActivityType };
type Editing  = { open: false } | { open: true; activity: Activity };

export default function ActivitiesAdminPage() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [languageId, setLanguageId] = useState("izon");
  const [creating, setCreating] = useState<Creating>({ open: false });
  const [editing, setEditing]   = useState<Editing>({ open: false });

  async function tok() { return (await getToken()) ?? undefined; }

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["admin-activities", languageId],
    queryFn: async () => apiFetch<Activity[]>(`/activities?languageId=${languageId}`, { token: await tok() }),
  });

  const create = useMutation({
    mutationFn: async (body: Omit<Activity, "id">) =>
      apiFetch("/activities/admin", { method: "POST", body: JSON.stringify(body), token: await tok() }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-activities"] }); setCreating({ open: false }); toast.success(t("admin.activities.createSuccess")); },
    onError: () => toast.error(t("admin.activities.createError")),
  });

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Omit<Activity, "id"> }) =>
      apiFetch(`/activities/admin/${id}`, { method: "PUT", body: JSON.stringify(body), token: await tok() }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-activities"] }); setEditing({ open: false }); toast.success(t("admin.activities.updateSuccess")); },
    onError: () => toast.error(t("admin.activities.updateError")),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => apiFetch(`/activities/admin/${id}`, { method: "DELETE", token: await tok() }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-activities"] }); toast.success(t("admin.activities.deleteSuccess")); },
  });

  const soundboard = activities.filter((a) => a.type === "soundboard");
  const placement  = activities.filter((a) => a.type === "placement");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="h-5 w-5 text-amber-500" />
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">{t("admin.activities.title")}</h1>
        </div>
        <p className="text-sm text-neutral-500">{t("admin.activities.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelector value={languageId} onChange={setLanguageId} allowCustom className="w-52" />
        <div className="flex gap-2 ml-auto">
          <button type="button"
            onClick={() => { setEditing({ open: false }); setCreating({ open: true, activityType: "soundboard" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold transition-colors">
            <Plus className="h-4 w-4" /> {t("admin.activities.addSoundboard")}
          </button>
          <button type="button"
            onClick={() => { setEditing({ open: false }); setCreating({ open: true, activityType: "placement" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-violet-200 dark:border-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 font-semibold transition-colors">
            <Plus className="h-4 w-4" /> {t("admin.activities.addPlacement")}
          </button>
        </div>
      </div>

      {creating.open && creating.activityType === "soundboard" && (
        <VisualSoundboardForm languageId={languageId}
          onSave={(data) => create.mutate({ type: "soundboard", ...data })}
          onCancel={() => setCreating({ open: false })} saving={create.isPending} />
      )}
      {creating.open && creating.activityType === "placement" && (
        <VisualPlacementForm languageId={languageId}
          onSave={(data) => create.mutate({ type: "placement", ...data })}
          onCancel={() => setCreating({ open: false })} saving={create.isPending} />
      )}
      {editing.open && editing.activity.type === "soundboard" && (
        <VisualSoundboardForm initial={editing.activity} languageId={languageId}
          onSave={(data) => update.mutate({ id: editing.activity.id, body: { type: "soundboard", ...data } })}
          onCancel={() => setEditing({ open: false })} saving={update.isPending} />
      )}
      {editing.open && editing.activity.type === "placement" && (
        <VisualPlacementForm initial={editing.activity} languageId={languageId}
          onSave={(data) => update.mutate({ id: editing.activity.id, body: { type: "placement", ...data } })}
          onCancel={() => setEditing({ open: false })} saving={update.isPending} />
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((k) => <div key={k} className="h-16 skeleton rounded-xl" />)}</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-sm">{t("admin.activities.noActivities")}</div>
      ) : (
        <div className="space-y-8">
          {soundboard.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Soundboard — {soundboard.length}</p>
              {soundboard.map((a) => (
                <ActivityRow key={a.id} activity={a}
                  onEdit={() => { setCreating({ open: false }); setEditing({ open: true, activity: a }); }}
                  onDelete={() => { if (confirm(t("admin.activities.deleteConfirm"))) remove.mutate(a.id); }} />
              ))}
            </div>
          )}
          {placement.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Placement — {placement.length}</p>
              {placement.map((a) => (
                <ActivityRow key={a.id} activity={a}
                  onEdit={() => { setCreating({ open: false }); setEditing({ open: true, activity: a }); }}
                  onDelete={() => { if (confirm(t("admin.activities.deleteConfirm"))) remove.mutate(a.id); }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
