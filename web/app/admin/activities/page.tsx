"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/ui/language-selector";
import { SoundboardMixQuiz, WordPlacementQuiz } from "@/components/learn/mini-apps";
import { VerticalFader } from "@/components/learn/mini-apps/soundboard-mix-quiz";
import type { SoundboardChannel, PlacementZone, WordToken } from "@/components/learn/mini-apps";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, ChevronDown, Eye, EyeOff, Gamepad2, Mic, Pencil, Plus, Square, Trash2, Upload, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ── Activity types ────────────────────────────────────────────────────────────

type ActivityType = "soundboard" | "placement";

interface SoundboardActivity {
  id: string; type: "soundboard"; languageId: string;
  sentence: string; targetWord: string; targetWordNative: string;
  audioUrl?: string;
  channels: SoundboardChannel[];
}

interface PlacementActivity {
  id: string; type: "placement"; languageId: string;
  imageUrl: string; imageAlt: string;
  zones: PlacementZone[]; tokens: WordToken[];
}

type Activity = SoundboardActivity | PlacementActivity;

// ── Draft types ───────────────────────────────────────────────────────────────

interface ZoneDraft {
  id: string; label: string; labelTranslation: string;
  x: number; y: number; width: number; height: number;
}

interface TokenDraft { id: string; word: string; translation: string; audioUrl: string; }

interface ChannelDraft {
  id: string; label: string; targetLevel: number; initialLevel: number; isVoice: boolean;
}

// ── Audio helpers (mirrors educator lesson page) ──────────────────────────────

const AUDIO_FILE_ACCEPT = "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.webm,.mp4,.mpeg";

function isAudioFile(file: File): boolean {
  if (file.type.toLowerCase().startsWith("audio/")) return true;
  return /\.(mp3|wav|m4a|aac|ogg|oga|webm|mp4|mpeg)$/i.test(file.name);
}

function extensionFromMimeType(mimeType: string): string {
  const n = mimeType.toLowerCase();
  if (n.includes("wav")) return "wav";
  if (n.includes("mpeg") || n.includes("mp3")) return "mp3";
  if (n.includes("mp4") || n.includes("m4a")) return "m4a";
  if (n.includes("ogg")) return "ogg";
  return "webm";
}

// ── Shared form helpers ───────────────────────────────────────────────────────

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

// ── Image drop zone ───────────────────────────────────────────────────────────

function ImageDropZone({ previewUrl, onFile }: { previewUrl: string | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handle(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    onFile(file);
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed transition-colors cursor-pointer",
        previewUrl ? "border-transparent" : "border-neutral-200 dark:border-neutral-700 hover:border-brand-400"
      )}
      onClick={() => !previewUrl && inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
    >
      {previewUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Scene" className="w-full rounded-xl object-cover" style={{ aspectRatio: "16/9" }} />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 text-white text-xs font-semibold hover:bg-black/80 transition-colors"
          >
            <Upload className="h-3 w-3" /> Replace
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
          <Upload className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">Drop an image or click to upload</p>
          <p className="text-xs mt-0.5 opacity-60">16:9 recommended</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Zone canvas ───────────────────────────────────────────────────────────────

interface DrawState { active: boolean; startX: number; startY: number; currentX: number; currentY: number; }

function ZoneCanvas({
  imageUrl, zones, selectedId, onAddZone, onSelectZone, onDeleteZone,
}: {
  imageUrl: string; zones: ZoneDraft[]; selectedId: string | null;
  onAddZone: (z: ZoneDraft) => void; onSelectZone: (id: string | null) => void; onDeleteZone: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draw, setDraw] = useState<DrawState>({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });

  function coords(e: React.MouseEvent) {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  }

  function handleDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    const { x, y } = coords(e);
    setDraw({ active: true, startX: x, startY: y, currentX: x, currentY: y });
    onSelectZone(null);
  }

  function handleMove(e: React.MouseEvent) {
    if (!draw.active) return;
    const { x, y } = coords(e);
    setDraw((p) => ({ ...p, currentX: x, currentY: y }));
  }

  function handleUp() {
    if (!draw.active) return;
    const w = Math.abs(draw.currentX - draw.startX);
    const h = Math.abs(draw.currentY - draw.startY);
    if (w > 3 && h > 3) {
      const zone: ZoneDraft = {
        id: crypto.randomUUID(), label: "", labelTranslation: "",
        x: Math.min(draw.startX, draw.currentX),
        y: Math.min(draw.startY, draw.currentY),
        width: w, height: h,
      };
      onAddZone(zone);
    }
    setDraw({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  }

  const preview = draw.active ? {
    left: `${Math.min(draw.startX, draw.currentX)}%`,
    top: `${Math.min(draw.startY, draw.currentY)}%`,
    width: `${Math.abs(draw.currentX - draw.startX)}%`,
    height: `${Math.abs(draw.currentY - draw.startY)}%`,
  } : null;

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden select-none"
      style={{ aspectRatio: "16/9", cursor: "crosshair" }}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {zones.map((zone) => (
        <div
          key={zone.id}
          className={cn(
            "absolute rounded border-2 transition-colors",
            zone.id === selectedId ? "border-amber-400 bg-amber-400/20" : "border-white/60 bg-white/10 hover:border-white/90",
          )}
          style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
          onMouseDown={(e) => { e.stopPropagation(); onSelectZone(zone.id); }}
        >
          <button
            type="button"
            onMouseDown={(e) => { e.stopPropagation(); onDeleteZone(zone.id); }}
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 z-10"
          >
            <X className="h-2.5 w-2.5" />
          </button>
          {zone.label && (
            <span className="absolute bottom-1 left-1 text-[9px] font-mono bg-black/70 text-white px-1 rounded pointer-events-none">
              {zone.label}
            </span>
          )}
        </div>
      ))}

      {preview && (
        <div className="absolute rounded border-2 border-amber-400/80 bg-amber-400/10 pointer-events-none" style={preview} />
      )}

      {zones.length === 0 && !draw.active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/70 text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">
            Click and drag to draw drop zones
          </p>
        </div>
      )}
    </div>
  );
}

// ── Zone editor list ──────────────────────────────────────────────────────────

function ZoneEditorList({
  zones, selectedId, onSelect, onChange, onDelete,
}: {
  zones: ZoneDraft[]; selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, field: "label" | "labelTranslation", value: string) => void;
  onDelete: (id: string) => void;
}) {
  if (zones.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className={labelCls}>Drop zones — click a zone on the image or a row here to edit</p>
      {zones.map((zone, i) => (
        <div
          key={zone.id}
          className={cn(
            "rounded-lg border p-3 transition-colors cursor-pointer",
            zone.id === selectedId ? "border-amber-400/50 bg-amber-500/[0.05]" : "border-neutral-200 dark:border-neutral-700"
          )}
          onClick={() => onSelect(zone.id)}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-neutral-400">Zone {i + 1}</span>
            <span className="text-[10px] text-neutral-400 ml-auto opacity-60">
              {zone.x.toFixed(1)}%, {zone.y.toFixed(1)}% · {zone.width.toFixed(1)}×{zone.height.toFixed(1)}
            </span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(zone.id); }} className="text-red-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className={fieldCls}
              placeholder="Native word (e.g. ọjà)"
              value={zone.label}
              onChange={(e) => onChange(zone.id, "label", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <input
              className={fieldCls}
              placeholder="Translation (e.g. market)"
              value={zone.labelTranslation}
              onChange={(e) => onChange(zone.id, "labelTranslation", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Token list ────────────────────────────────────────────────────────────────

function TokenList({
  tokens, onChange, onDelete, onAdd,
}: {
  tokens: TokenDraft[];
  onChange: (id: string, field: keyof Omit<TokenDraft, "id">, value: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className={labelCls}>Word tokens (include distractors)</p>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold">
          <Plus className="h-3 w-3" /> Add token
        </button>
      </div>
      <div className="space-y-2">
        {tokens.map((token) => (
          <div key={token.id} className="flex gap-2 items-center">
            <input className={fieldCls} placeholder="Native word" value={token.word} onChange={(e) => onChange(token.id, "word", e.target.value)} />
            <input className={fieldCls} placeholder="Translation" value={token.translation} onChange={(e) => onChange(token.id, "translation", e.target.value)} />
            <input className={cn(fieldCls, "shrink-0 w-44")} placeholder="Audio URL (opt.)" value={token.audioUrl} onChange={(e) => onChange(token.id, "audioUrl", e.target.value)} />
            <button type="button" onClick={() => onDelete(token.id)} className="shrink-0 text-red-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Visual placement form ─────────────────────────────────────────────────────

function VisualPlacementForm({
  initial, languageId, onSave, onCancel, saving,
}: {
  initial?: Partial<PlacementActivity>; languageId: string;
  onSave: (data: Omit<PlacementActivity, "id" | "type">) => void;
  onCancel: () => void; saving: boolean;
}) {
  const { getToken } = useAuth();
  const blobRef = useRef<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? "");
  const [zones, setZones] = useState<ZoneDraft[]>((initial?.zones ?? []).map((z) => ({ ...z })));
  const [tokens, setTokens] = useState<TokenDraft[]>((initial?.tokens ?? []).map((t) => ({ ...t, audioUrl: t.audioUrl ?? "" })));
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  function handleImageFile(file: File) {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    const url = URL.createObjectURL(file);
    blobRef.current = url;
    setImageFile(file);
    setImagePreviewUrl(url);
  }

  function addZone(zone: ZoneDraft) { setZones((p) => [...p, zone]); setSelectedZoneId(zone.id); }
  function updateZone(id: string, field: "label" | "labelTranslation", value: string) {
    setZones((p) => p.map((z) => z.id === id ? { ...z, [field]: value } : z));
  }
  function deleteZone(id: string) {
    setZones((p) => p.filter((z) => z.id !== id));
    if (selectedZoneId === id) setSelectedZoneId(null);
  }

  function addToken() { setTokens((p) => [...p, { id: crypto.randomUUID(), word: "", translation: "", audioUrl: "" }]); }
  function updateToken(id: string, field: keyof Omit<TokenDraft, "id">, value: string) {
    setTokens((p) => p.map((t) => t.id === id ? { ...t, [field]: value } : t));
  }
  function deleteToken(id: string) { setTokens((p) => p.filter((t) => t.id !== id)); }

  async function handleSave() {
    if (!imagePreviewUrl) { toast.error("Upload an image first"); return; }
    if (zones.length === 0) { toast.error("Draw at least one drop zone"); return; }
    if (zones.some((z) => !z.label)) { toast.error("Every zone needs a native word label"); return; }
    if (tokens.length === 0) { toast.error("Add at least one word token"); return; }

    let imageUrl = imagePreviewUrl;
    if (imageFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("image", imageFile);
        const res = await apiFetch<{ url: string }>("/upload/image", {
          method: "POST", body: fd, token: (await getToken()) ?? undefined,
        });
        imageUrl = res.url;
      } catch {
        toast.error("Image upload failed"); setUploading(false); return;
      }
      setUploading(false);
    }

    onSave({
      languageId, imageUrl, imageAlt,
      zones: zones.map(({ id, label, labelTranslation, x, y, width, height }) => ({ id, label, labelTranslation, x, y, width, height })),
      tokens: tokens.map(({ id, word, translation, audioUrl }) => ({ id, word, translation, audioUrl: audioUrl || undefined })),
    });
  }

  return (
    <div className="space-y-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Word Placement Activity</p>

      <ImageDropZone previewUrl={imagePreviewUrl} onFile={handleImageFile} />

      {imagePreviewUrl && (
        <>
          <Field label="Scene description *">
            <input className={fieldCls} value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="A busy West African marketplace" />
          </Field>
          <div>
            <p className={cn(labelCls, "mb-2")}>Draw drop zones on the image</p>
            <ZoneCanvas imageUrl={imagePreviewUrl} zones={zones} selectedId={selectedZoneId}
              onAddZone={addZone} onSelectZone={setSelectedZoneId} onDeleteZone={deleteZone} />
          </div>
          <ZoneEditorList zones={zones} selectedId={selectedZoneId}
            onSelect={setSelectedZoneId} onChange={updateZone} onDelete={deleteZone} />
          <TokenList tokens={tokens} onChange={updateToken} onDelete={deleteToken} onAdd={addToken} />
        </>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || uploading || !imagePreviewUrl}
          className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-40 transition-colors">
          {uploading ? "Uploading…" : saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Audio upload panel ────────────────────────────────────────────────────────

function AudioUploadPanel({
  audioPreviewUrl, audioRef, isRecording, recordingError, audioError, onFile, onStartRecord, onStopRecord,
}: {
  audioPreviewUrl: string | null; audioRef: React.RefObject<HTMLAudioElement | null>;
  isRecording: boolean; recordingError: string; audioError: string;
  onFile: (f: File) => void; onStartRecord: () => void; onStopRecord: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canRecord = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="space-y-2">
      <p className={labelCls}>Sentence audio (optional — for playback while setting levels)</p>
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <Upload className="h-4 w-4" /> Upload audio
        </button>
        {canRecord && (
          <button type="button" onClick={isRecording ? onStopRecord : onStartRecord}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            )}>
            {isRecording ? <><Square className="h-4 w-4" /> Stop</> : <><Mic className="h-4 w-4" /> Record</>}
          </button>
        )}
        {isRecording && <span className="flex items-center gap-1.5 text-xs text-red-500 animate-pulse"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Recording…</span>}
      </div>
      <input ref={inputRef} type="file" accept={AUDIO_FILE_ACCEPT} className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      {audioPreviewUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio ref={audioRef} src={audioPreviewUrl} controls className="w-full h-9 mt-1" />
      )}
      {(audioError || recordingError) && <p className="text-xs text-red-500">{audioError || recordingError}</p>}
    </div>
  );
}

// ── Channel row ───────────────────────────────────────────────────────────────

function ChannelRow({
  channel, voiceCount, onChange, onDelete,
}: {
  channel: ChannelDraft; voiceCount: number;
  onChange: (updated: ChannelDraft) => void; onDelete: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
      channel.isVoice ? "border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20" : "border-neutral-200 dark:border-neutral-700"
    )}>
      <label title="Mark as voice channel" className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
        <input type="radio" name="voice-channel" checked={channel.isVoice}
          onChange={() => onChange({ ...channel, isVoice: true })} className="accent-blue-500" />
        <span className="text-[8px] font-mono uppercase text-blue-500">voice</span>
      </label>

      <input className={cn(fieldCls, "w-24 shrink-0")} placeholder="Label" value={channel.label}
        onChange={(e) => onChange({ ...channel, label: e.target.value })} />

      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-[8px] font-mono text-neutral-400 uppercase">Target</span>
        <VerticalFader level={channel.targetLevel} label={`${channel.label} target`}
          color={channel.isVoice ? "#60a5fa" : "#818cf8"} isNearTarget={false}
          onChange={(v) => onChange({ ...channel, targetLevel: v })} />
        <span className="text-[10px] font-mono tabular-nums text-neutral-500">{channel.targetLevel}</span>
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-[8px] font-mono text-neutral-400 uppercase">Start</span>
        <VerticalFader level={channel.initialLevel} label={`${channel.label} start`}
          color="#6b7280" isNearTarget={false}
          onChange={(v) => onChange({ ...channel, initialLevel: v })} />
        <span className="text-[10px] font-mono tabular-nums text-neutral-500">{channel.initialLevel}</span>
      </div>

      <button type="button" onClick={onDelete} disabled={channel.isVoice && voiceCount <= 1}
        className="ml-auto text-red-400 hover:text-red-500 disabled:opacity-20 transition-colors shrink-0">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Channel builder ───────────────────────────────────────────────────────────

function ChannelBuilder({
  channels, onChange, onAdd, onDelete,
}: {
  channels: ChannelDraft[];
  onChange: (id: string, updated: ChannelDraft) => void;
  onAdd: () => void; onDelete: (id: string) => void;
}) {
  const voiceCount = channels.filter((c) => c.isVoice).length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className={labelCls}>Channels</p>
          <p className="text-[11px] text-neutral-400 -mt-0.5">Select Voice. Target = where learner must move fader. Start = initial position.</p>
        </div>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold shrink-0">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      {channels.map((ch) => (
        <ChannelRow key={ch.id} channel={ch} voiceCount={voiceCount}
          onChange={(updated) => {
            if (updated.isVoice) {
              channels.forEach((c) => { if (c.id !== ch.id && c.isVoice) onChange(c.id, { ...c, isVoice: false }); });
            }
            onChange(ch.id, updated);
          }}
          onDelete={() => onDelete(ch.id)}
        />
      ))}
    </div>
  );
}

// ── Lesson seed picker ────────────────────────────────────────────────────────

interface LessonStub { id: string; title: string; audioUrl: string | null; }
interface TranscriptSegment { text: string; translation: string | null; order: number; }
interface LessonDetail { audioUrl: string | null; transcript: TranscriptSegment[]; }

function LessonSeedPicker({
  languageId,
  onSeed,
}: {
  languageId: string;
  onSeed: (sentence: string, audioUrl: string | null) => void;
}) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [seeding, setSeeding] = useState(false);

  const { data: lessonList = [] } = useQuery<LessonStub[]>({
    queryKey: ["lessons-for-seed", languageId],
    queryFn: async () => {
      const token = (await getToken()) ?? undefined;
      return apiFetch<LessonStub[]>(`/lessons?languageId=${encodeURIComponent(languageId)}`, { token });
    },
    enabled: open && !!languageId,
    staleTime: 5 * 60 * 1000,
  });

  async function handleApply() {
    if (!selectedId) return;
    setSeeding(true);
    try {
      const token = (await getToken()) ?? undefined;
      const detail = await apiFetch<LessonDetail>(`/lessons/${selectedId}`, { token });
      const firstSegment = detail.transcript.sort((a, b) => a.order - b.order)[0];
      onSeed(firstSegment?.text ?? "", detail.audioUrl);
    } catch {
      toast.error("Failed to load lesson");
    }
    setSeeding(false);
    setOpen(false);
  }

  return (
    <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Seed from lesson
        <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <select
            className={fieldCls}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— pick a lesson —</option>
            {lessonList.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-500">
            Pre-fills the sentence from the first transcript segment and the audio URL. You can edit both after.
          </p>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedId || seeding}
            className="px-3 py-1.5 rounded-lg text-xs bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold disabled:opacity-40 transition-colors hover:opacity-80"
          >
            {seeding ? "Loading…" : "Apply"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Visual soundboard form ────────────────────────────────────────────────────

function VisualSoundboardForm({
  initial, languageId, onSave, onCancel, saving,
}: {
  initial?: Partial<SoundboardActivity>; languageId: string;
  onSave: (data: Omit<SoundboardActivity, "id" | "type">) => void;
  onCancel: () => void; saving: boolean;
}) {
  const { getToken } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const blobRef = useRef<string | null>(null);

  const [sentence, setSentence] = useState(initial?.sentence ?? "");
  const [targetWord, setTargetWord] = useState(initial?.targetWord ?? "");
  const [targetWordNative, setTargetWordNative] = useState(initial?.targetWordNative ?? "");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(initial?.audioUrl ?? null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [audioError, setAudioError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [channels, setChannels] = useState<ChannelDraft[]>(
    (initial?.channels ?? [
      { id: "voice", label: "Voice",  targetLevel: 85, initialLevel: 25, isVoice: true },
      { id: "crowd", label: "Crowd",  targetLevel: 12, initialLevel: 80, isVoice: false },
      { id: "rain",  label: "Rain",   targetLevel: 10, initialLevel: 65, isVoice: false },
    ]).map((c) => ({ ...c }))
  );

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  function setPendingAudio(file: File) {
    if (!isAudioFile(file)) { setAudioError("Please select a valid audio file."); return; }
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    const url = URL.createObjectURL(file);
    blobRef.current = url;
    setAudioFile(file);
    setAudioPreviewUrl(url);
    setAudioError("");
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setPendingAudio(new File([blob], `recording.${extensionFromMimeType(mimeType)}`, { type: mimeType }));
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      };
      recorder.start();
      setIsRecording(true);
      setRecordingError("");
    } catch {
      setRecordingError("Microphone access denied.");
    }
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); setIsRecording(false); }

  function handleChannelChange(id: string, updated: ChannelDraft) {
    setChannels((prev) =>
      updated.isVoice
        ? prev.map((c) => c.id === id ? updated : { ...c, isVoice: false })
        : prev.map((c) => c.id === id ? updated : c)
    );
  }

  function addChannel() {
    setChannels((p) => [...p, { id: crypto.randomUUID(), label: "Channel", targetLevel: 15, initialLevel: 60, isVoice: false }]);
  }

  function deleteChannel(id: string) {
    setChannels((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (!next.some((c) => c.isVoice) && next.length > 0) next[0] = { ...next[0], isVoice: true };
      return next;
    });
  }

  async function handleSave() {
    if (!sentence) { toast.error("Enter the sentence"); return; }
    if (!targetWord || !targetWordNative) { toast.error("Enter the target word in both languages"); return; }
    if (channels.length === 0) { toast.error("Add at least one channel"); return; }

    let audioUrl: string | undefined = initial?.audioUrl;
    if (audioFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("audio", audioFile);
        const res = await apiFetch<{ url: string }>("/upload/audio", {
          method: "POST", body: fd, token: (await getToken()) ?? undefined,
        });
        audioUrl = res.url;
      } catch {
        toast.error("Audio upload failed"); setUploading(false); return;
      }
      setUploading(false);
    }

    onSave({ languageId, sentence, targetWord, targetWordNative, audioUrl, channels });
  }

  const previewChannels: SoundboardChannel[] = channels.map(({ id, label, targetLevel, initialLevel, isVoice }) => ({ id, label, targetLevel, initialLevel, isVoice }));

  return (
    <div className="space-y-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Soundboard Activity</p>

      <LessonSeedPicker
        languageId={languageId}
        onSeed={(seg, url) => {
          setSentence((prev) => prev || seg);
          if (url && !audioPreviewUrl) setAudioPreviewUrl(url);
        }}
      />

      <AudioUploadPanel
        audioPreviewUrl={audioPreviewUrl} audioRef={audioRef}
        isRecording={isRecording} recordingError={recordingError} audioError={audioError}
        onFile={setPendingAudio} onStartRecord={startRecording} onStopRecord={stopRecording}
      />

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

      <ChannelBuilder
        channels={channels}
        onChange={handleChannelChange}
        onAdd={addChannel}
        onDelete={deleteChannel}
      />

      {sentence && channels.length > 0 && (
        <div>
          <p className={cn(labelCls, "mb-2")}>Live preview — adjust faders to validate the puzzle</p>
          <SoundboardMixQuiz sentence={sentence} targetWord={targetWord || "…"} targetWordNative={targetWordNative || "…"} channels={previewChannels} />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || uploading}
          className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-40 transition-colors">
          {uploading ? "Uploading…" : saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({
  activity, onEdit, onDelete,
}: {
  activity: Activity; onEdit: () => void; onDelete: () => void;
}) {
  const [previewing, setPreviewing] = useState(false);
  const title = activity.type === "soundboard" ? `${activity.targetWordNative} — ${activity.targetWord}` : activity.imageAlt;

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
          <button type="button" onClick={() => setPreviewing((v) => !v)} title={previewing ? "Hide preview" : "Preview"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.07] transition-colors">
            {previewing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onEdit} title="Edit"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.07] transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} title="Delete"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {previewing && (
        <div className="px-4 pb-4 border-t border-neutral-100 dark:border-white/[0.05] pt-4">
          {activity.type === "soundboard" ? (
            <SoundboardMixQuiz sentence={activity.sentence} targetWord={activity.targetWord} targetWordNative={activity.targetWordNative} channels={activity.channels} />
          ) : (
            <WordPlacementQuiz imageUrl={activity.imageUrl} imageAlt={activity.imageAlt} zones={activity.zones} tokens={activity.tokens} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Creating = { open: false } | { open: true; activityType: ActivityType };
type Editing  = { open: false } | { open: true; activity: Activity };

export default function ActivitiesAdminPage() {
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
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-activities"] }); setCreating({ open: false }); toast.success("Activity created"); },
    onError: () => toast.error("Failed to create activity"),
  });

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Omit<Activity, "id"> }) =>
      apiFetch(`/activities/admin/${id}`, { method: "PUT", body: JSON.stringify(body), token: await tok() }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-activities"] }); setEditing({ open: false }); toast.success("Activity updated"); },
    onError: () => toast.error("Failed to update activity"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => apiFetch(`/activities/admin/${id}`, { method: "DELETE", token: await tok() }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-activities"] }); toast.success("Deleted"); },
  });

  const soundboard = activities.filter((a) => a.type === "soundboard");
  const placement  = activities.filter((a) => a.type === "placement");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="h-5 w-5 text-amber-500" />
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Activities</h1>
        </div>
        <p className="text-sm text-neutral-500">Manage interactive mini-apps shown on the Discover page.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelector value={languageId} onChange={setLanguageId} allowCustom className="w-52" />
        <div className="flex gap-2 ml-auto">
          <button type="button"
            onClick={() => { setEditing({ open: false }); setCreating({ open: true, activityType: "soundboard" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Soundboard
          </button>
          <button type="button"
            onClick={() => { setEditing({ open: false }); setCreating({ open: true, activityType: "placement" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-violet-200 dark:border-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Placement
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
        <div className="text-center py-12 text-neutral-400 text-sm">No activities for this language yet.</div>
      ) : (
        <div className="space-y-8">
          {soundboard.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Soundboard — {soundboard.length}</p>
              {soundboard.map((a) => (
                <ActivityRow key={a.id} activity={a}
                  onEdit={() => { setCreating({ open: false }); setEditing({ open: true, activity: a }); }}
                  onDelete={() => { if (confirm("Delete this activity?")) remove.mutate(a.id); }} />
              ))}
            </div>
          )}
          {placement.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Placement — {placement.length}</p>
              {placement.map((a) => (
                <ActivityRow key={a.id} activity={a}
                  onEdit={() => { setCreating({ open: false }); setEditing({ open: true, activity: a }); }}
                  onDelete={() => { if (confirm("Delete this activity?")) remove.mutate(a.id); }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
