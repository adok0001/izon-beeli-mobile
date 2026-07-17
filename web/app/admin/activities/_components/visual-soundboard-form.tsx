"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useForm } from "@/lib/use-form";
import { SoundboardMixQuiz } from "@/components/learn/mini-apps";
import type { SoundboardChannel } from "@/components/learn/mini-apps";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { extensionFromMimeType, Field, fieldCls, isAudioFile, labelCls, type ChannelDraft, type SoundboardActivity } from "./shared";
import { AudioUploadPanel } from "./audio-upload-panel";
import { ChannelBuilder } from "./channel-builder";
import { LessonSeedPicker } from "./lesson-seed-picker";

interface SoundboardFormState {
  sentence: string;
  targetWord: string;
  targetWordNative: string;
  audioFile: File | null;
  audioPreviewUrl: string | null;
  isRecording: boolean;
  recordingError: string;
  audioError: string;
  uploading: boolean;
  channels: ChannelDraft[];
}

export function VisualSoundboardForm({
  initial, languageId, onSave, onCancel, saving,
}: {
  initial?: Partial<SoundboardActivity>; languageId: string;
  onSave: (data: Omit<SoundboardActivity, "id" | "type">) => void;
  onCancel: () => void; saving: boolean;
}) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const blobRef = useRef<string | null>(null);

  const [state, set] = useForm<SoundboardFormState>({
    sentence: initial?.sentence ?? "",
    targetWord: initial?.targetWord ?? "",
    targetWordNative: initial?.targetWordNative ?? "",
    audioFile: null,
    audioPreviewUrl: initial?.audioUrl ?? null,
    isRecording: false,
    recordingError: "",
    audioError: "",
    uploading: false,
    channels: (initial?.channels ?? [
      { id: "voice", label: "Voice",  targetLevel: 85, initialLevel: 25, isVoice: true },
      { id: "crowd", label: "Crowd",  targetLevel: 12, initialLevel: 80, isVoice: false },
      { id: "rain",  label: "Rain",   targetLevel: 10, initialLevel: 65, isVoice: false },
    ]).map((c) => ({ ...c })),
  });
  const { sentence, targetWord, targetWordNative, audioFile, audioPreviewUrl, isRecording, recordingError, audioError, uploading, channels } = state;

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  function setPendingAudio(file: File) {
    if (!isAudioFile(file)) { set({ audioError: "Please select a valid audio file." }); return; }
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    const url = URL.createObjectURL(file);
    blobRef.current = url;
    set({ audioFile: file, audioPreviewUrl: url, audioError: "" });
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
      set({ isRecording: true, recordingError: "" });
    } catch {
      set({ recordingError: "Microphone access denied." });
    }
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); set({ isRecording: false }); }

  function handleChannelChange(id: string, updated: ChannelDraft) {
    set({
      channels: updated.isVoice
        ? channels.map((c) => c.id === id ? updated : { ...c, isVoice: false })
        : channels.map((c) => c.id === id ? updated : c),
    });
  }

  function addChannel() {
    set({ channels: [...channels, { id: crypto.randomUUID(), label: "Channel", targetLevel: 15, initialLevel: 60, isVoice: false }] });
  }

  function deleteChannel(id: string) {
    const next = channels.filter((c) => c.id !== id);
    if (!next.some((c) => c.isVoice) && next.length > 0) next[0] = { ...next[0], isVoice: true };
    set({ channels: next });
  }

  async function handleSave() {
    if (!sentence) { toast.error(t("admin.activities.validationSentence")); return; }
    if (!targetWord || !targetWordNative) { toast.error(t("admin.activities.validationTargetWord")); return; }
    if (channels.length === 0) { toast.error(t("admin.activities.validationChannel")); return; }

    let audioUrl: string | undefined = initial?.audioUrl;
    if (audioFile) {
      set({ uploading: true });
      try {
        const fd = new FormData();
        fd.append("file", audioFile);
        const res = await apiFetch<{ url: string }>("/upload/audio", {
          method: "POST", body: fd, token: (await getToken()) ?? undefined,
        });
        audioUrl = res.url;
      } catch {
        toast.error(t("admin.activities.audioUploadFailed")); set({ uploading: false }); return;
      }
      set({ uploading: false });
    }

    onSave({ languageId, sentence, targetWord, targetWordNative, audioUrl, channels });
  }

  const previewChannels: SoundboardChannel[] = channels.map(({ id, label, targetLevel, initialLevel, isVoice }) => ({ id, label, targetLevel, initialLevel, isVoice }));

  return (
    <div className="space-y-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">{t("admin.activities.soundboardFormTitle")}</p>

      <LessonSeedPicker
        languageId={languageId}
        onSeed={(seg, url) => {
          set({
            sentence: sentence || seg,
            ...(url && !audioPreviewUrl ? { audioPreviewUrl: url } : {}),
          });
        }}
      />

      <AudioUploadPanel
        audioPreviewUrl={audioPreviewUrl} audioRef={audioRef}
        isRecording={isRecording} recordingError={recordingError} audioError={audioError}
        onFile={setPendingAudio} onStartRecord={startRecording} onStopRecord={stopRecording}
      />

      <Field label={t("admin.activities.labelSentence")}>
        <input className={fieldCls} value={sentence} onChange={(e) => set({ sentence: e.target.value })} placeholder="Sentence played to the learner" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("admin.activities.labelTargetWordEn")}>
          <input className={fieldCls} value={targetWord} onChange={(e) => set({ targetWord: e.target.value })} placeholder="marketplace" />
        </Field>
        <Field label={t("admin.activities.labelTargetWordNative")}>
          <input className={fieldCls} value={targetWordNative} onChange={(e) => set({ targetWordNative: e.target.value })} placeholder="ọjà" />
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
          <p className={cn(labelCls, "mb-2")}>{t("admin.activities.livePreview")}</p>
          <SoundboardMixQuiz sentence={sentence} targetWord={targetWord || "…"} targetWordNative={targetWordNative || "…"} channels={previewChannels} />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          {t("admin.activities.cancel")}
        </button>
        <button type="button" onClick={handleSave} disabled={saving || uploading}
          className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-40 transition-colors">
          {uploading ? t("admin.activities.uploading") : saving ? t("admin.activities.saving") : t("admin.activities.save")}
        </button>
      </div>
    </div>
  );
}
