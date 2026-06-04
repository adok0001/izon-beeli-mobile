"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/ui/language-selector";
import { SoundboardMixQuiz, WordPlacementQuiz } from "@/components/learn/mini-apps";
import type { SoundboardChannel, PlacementZone, WordToken } from "@/components/learn/mini-apps";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Gamepad2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActivityType = "soundboard" | "placement";

interface SoundboardActivity {
  id: string;
  type: "soundboard";
  languageId: string;
  sentence: string;
  targetWord: string;
  targetWordNative: string;
  channels: SoundboardChannel[];
}

interface PlacementActivity {
  id: string;
  type: "placement";
  languageId: string;
  imageUrl: string;
  imageAlt: string;
  zones: PlacementZone[];
  tokens: WordToken[];
}

type Activity = SoundboardActivity | PlacementActivity;

// ── Shared helpers ────────────────────────────────────────────────────────────

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

const labelCls = "text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function JsonTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        className={cn(fieldCls, "font-mono text-xs min-h-[120px] resize-y")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </Field>
  );
}

// ── Soundboard form ───────────────────────────────────────────────────────────

function SoundboardForm({
  initial,
  languageId,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<SoundboardActivity>;
  languageId: string;
  onSave: (data: Omit<SoundboardActivity, "id" | "type">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [sentence, setSentence] = useState(initial?.sentence ?? "");
  const [targetWord, setTargetWord] = useState(initial?.targetWord ?? "");
  const [targetWordNative, setTargetWordNative] = useState(initial?.targetWordNative ?? "");
  const [channelsJson, setChannelsJson] = useState(
    JSON.stringify(
      initial?.channels ?? [
        { id: "voice", label: "Voice",  targetLevel: 85, initialLevel: 25, isVoice: true },
        { id: "crowd", label: "Crowd",  targetLevel: 12, initialLevel: 80, isVoice: false },
        { id: "rain",  label: "Rain",   targetLevel: 10, initialLevel: 65, isVoice: false },
      ],
      null, 2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleSave() {
    let channels: SoundboardChannel[];
    try {
      channels = JSON.parse(channelsJson);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON in channels field");
      return;
    }
    onSave({ languageId, sentence, targetWord, targetWordNative, channels });
  }

  return (
    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Soundboard Activity</p>
      <Field label="Sentence *">
        <input className={fieldCls} value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="Sentence played to the learner" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Target word (English) *">
          <input className={fieldCls} value={targetWord} onChange={(e) => setTargetWord(e.target.value)} placeholder="marketplace" />
        </Field>
        <Field label="Target word (native) *">
          <input className={fieldCls} value={targetWordNative} onChange={(e) => setTargetWordNative(e.target.value)} placeholder="ọjà" />
        </Field>
      </div>
      <JsonTextarea label="Channels JSON *" value={channelsJson} onChange={setChannelsJson} />
      {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !sentence || !targetWord || !targetWordNative} className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-40 transition-colors">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Placement form ────────────────────────────────────────────────────────────

function PlacementForm({
  initial,
  languageId,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<PlacementActivity>;
  languageId: string;
  onSave: (data: Omit<PlacementActivity, "id" | "type">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? "");
  const [zonesJson, setZonesJson] = useState(
    JSON.stringify(
      initial?.zones ?? [
        { id: "basket", label: "àgbọ̀n", labelTranslation: "basket", x: 5,  y: 52, width: 20, height: 36 },
      ],
      null, 2
    )
  );
  const [tokensJson, setTokensJson] = useState(
    JSON.stringify(
      initial?.tokens ?? [
        { id: "t1", word: "àgbọ̀n", translation: "basket" },
      ],
      null, 2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleSave() {
    let zones: PlacementZone[], tokens: WordToken[];
    try {
      zones = JSON.parse(zonesJson);
      tokens = JSON.parse(tokensJson);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON in zones or tokens field");
      return;
    }
    onSave({ languageId, imageUrl, imageAlt, zones, tokens });
  }

  return (
    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Word Placement Activity</p>
      <Field label="Image URL *">
        <input className={fieldCls} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="Image alt text *">
        <input className={fieldCls} value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="A busy marketplace…" />
      </Field>
      <JsonTextarea label="Drop zones JSON *" value={zonesJson} onChange={setZonesJson} />
      <JsonTextarea label="Word tokens JSON *" value={tokensJson} onChange={setTokensJson} />
      {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !imageUrl || !imageAlt} className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-40 transition-colors">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [previewing, setPreviewing] = useState(false);

  const title =
    activity.type === "soundboard"
      ? `${activity.targetWordNative} — ${activity.targetWord}`
      : activity.imageAlt;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn(
          "shrink-0 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border",
          activity.type === "soundboard"
            ? "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-900/40 dark:bg-blue-950/30"
            : "text-violet-600 border-violet-200 bg-violet-50 dark:text-violet-400 dark:border-violet-900/40 dark:bg-violet-950/30"
        )}>
          {activity.type === "soundboard" ? "Soundboard" : "Placement"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{title}</p>
          {activity.type === "soundboard" && (
            <p className="text-xs text-neutral-400 truncate mt-0.5">{activity.sentence}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewing((v) => !v)}
            title={previewing ? "Hide preview" : "Preview"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.07] transition-colors"
          >
            {previewing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.07] transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {previewing && (
        <div className="px-4 pb-4 border-t border-neutral-100 dark:border-white/[0.05] pt-4">
          {activity.type === "soundboard" ? (
            <SoundboardMixQuiz
              sentence={activity.sentence}
              targetWord={activity.targetWord}
              targetWordNative={activity.targetWordNative}
              channels={activity.channels}
            />
          ) : (
            <WordPlacementQuiz
              imageUrl={activity.imageUrl}
              imageAlt={activity.imageAlt}
              zones={activity.zones}
              tokens={activity.tokens}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Creating = { open: false } | { open: true; activityType: ActivityType };
type Editing = { open: false } | { open: true; activity: Activity };

export default function ActivitiesAdminPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [languageId, setLanguageId] = useState("izon");
  const [creating, setCreating] = useState<Creating>({ open: false });
  const [editing, setEditing] = useState<Editing>({ open: false });

  async function tok() { return (await getToken()) ?? undefined; }

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["admin-activities", languageId],
    queryFn: async () => apiFetch<Activity[]>(`/activities?languageId=${languageId}`, { token: await tok() }),
  });

  const create = useMutation({
    mutationFn: async (body: Omit<Activity, "id">) =>
      apiFetch("/activities", { method: "POST", body: JSON.stringify(body), token: await tok() }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-activities"] }); setCreating({ open: false }); },
  });

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Omit<Activity, "id"> }) =>
      apiFetch(`/activities/${id}`, { method: "PUT", body: JSON.stringify(body), token: await tok() }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-activities"] }); setEditing({ open: false }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/activities/${id}`, { method: "DELETE", token: await tok() }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-activities"] }),
  });

  const soundboard = activities.filter((a) => a.type === "soundboard");
  const placement  = activities.filter((a) => a.type === "placement");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="h-5 w-5 text-amber-500" />
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Activities</h1>
        </div>
        <p className="text-sm text-neutral-500">Manage interactive mini-apps shown on the Discover page.</p>
      </div>

      {/* Language filter + add buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelector value={languageId} onChange={setLanguageId} allowCustom className="w-52" />
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={() => { setEditing({ open: false }); setCreating({ open: true, activityType: "soundboard" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Soundboard
          </button>
          <button
            type="button"
            onClick={() => { setEditing({ open: false }); setCreating({ open: true, activityType: "placement" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-violet-200 dark:border-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Placement
          </button>
        </div>
      </div>

      {/* Create form */}
      {creating.open && creating.activityType === "soundboard" && (
        <SoundboardForm
          languageId={languageId}
          onSave={(data) => create.mutate({ type: "soundboard", ...data })}
          onCancel={() => setCreating({ open: false })}
          saving={create.isPending}
        />
      )}
      {creating.open && creating.activityType === "placement" && (
        <PlacementForm
          languageId={languageId}
          onSave={(data) => create.mutate({ type: "placement", ...data })}
          onCancel={() => setCreating({ open: false })}
          saving={create.isPending}
        />
      )}

      {/* Edit form */}
      {editing.open && editing.activity.type === "soundboard" && (
        <SoundboardForm
          initial={editing.activity}
          languageId={languageId}
          onSave={(data) => update.mutate({ id: editing.activity.id, body: { type: "soundboard", ...data } })}
          onCancel={() => setEditing({ open: false })}
          saving={update.isPending}
        />
      )}
      {editing.open && editing.activity.type === "placement" && (
        <PlacementForm
          initial={editing.activity}
          languageId={languageId}
          onSave={(data) => update.mutate({ id: editing.activity.id, body: { type: "placement", ...data } })}
          onCancel={() => setEditing({ open: false })}
          saving={update.isPending}
        />
      )}

      {/* Lists */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((k) => <div key={k} className="h-16 skeleton rounded-xl" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-sm">
          No activities for this language yet.
        </div>
      ) : (
        <div className="space-y-8">
          {soundboard.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                Soundboard — {soundboard.length}
              </p>
              {soundboard.map((a) => (
                <ActivityRow
                  key={a.id}
                  activity={a}
                  onEdit={() => { setCreating({ open: false }); setEditing({ open: true, activity: a }); }}
                  onDelete={() => { if (confirm("Delete this activity?")) remove.mutate(a.id); }}
                />
              ))}
            </div>
          )}
          {placement.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                Placement — {placement.length}
              </p>
              {placement.map((a) => (
                <ActivityRow
                  key={a.id}
                  activity={a}
                  onEdit={() => { setCreating({ open: false }); setEditing({ open: true, activity: a }); }}
                  onDelete={() => { if (confirm("Delete this activity?")) remove.mutate(a.id); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
