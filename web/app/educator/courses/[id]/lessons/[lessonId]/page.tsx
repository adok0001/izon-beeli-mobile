"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  GripVertical,
  Mic,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Segment {
  id?: string;
  text: string;
  translation: string;
  startTime: number;
  endTime: number;
  order: number;
}

interface LessonDetail {
  id: string;
  courseId: string;
  courseTitle: string;
  languageId: string;
  title: string;
  description: string;
  type: string;
  audioUrl: string | null;
  duration: number | null;
  order: number;
  artist: string | null;
  genre: string | null;
  isActive: boolean;
  segments: Segment[];
}

function toSeconds(str: string): number {
  str = str.trim();
  if (str.includes(":")) {
    const [min, sec] = str.split(":");
    return parseInt(min, 10) * 60 + parseFloat(sec);
  }
  return parseFloat(str) || 0;
}

function fmtTime(seconds: number): string {
  if (!seconds && seconds !== 0) return "";
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

function TimeInput({
  value,
  onChange,
  onCapture,
  placeholder,
}: Readonly<{
  value: number;
  onChange: (v: number) => void;
  onCapture?: () => void;
  placeholder: string;
}>) {
  const [raw, setRaw] = useState(fmtTime(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setRaw(fmtTime(value));
  }, [value, focused]);

  return (
    <div className="flex items-center gap-1">
      <input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const s = toSeconds(raw);
          setRaw(fmtTime(s));
          onChange(s);
        }}
        placeholder={placeholder}
        className="w-20 rounded-md border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-2 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-500 tabular-nums font-mono"
      />
      {onCapture && (
        <button
          type="button"
          onClick={onCapture}
          title="Capture current playback position"
          className="p-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          <Mic className="h-3 w-3 text-brand-400" />
        </button>
      )}
    </div>
  );
}

function SegmentRow({
  seg,
  index,
  onChange,
  onDelete,
  onCaptureStart,
  onCaptureEnd,
}: Readonly<{
  seg: Segment;
  index: number;
  onChange: (s: Segment) => void;
  onDelete: () => void;
  onCaptureStart: () => void;
  onCaptureEnd: () => void;
}>) {
  return (
    <div className="flex items-start gap-2 group rounded-xl border border-neutral-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-3 hover:border-neutral-200 dark:hover:border-white/[0.1] transition-colors">
      <div className="flex items-center gap-1 pt-1.5 text-neutral-300 dark:text-neutral-600 select-none shrink-0">
        <GripVertical className="h-4 w-4" />
        <span className="text-xs tabular-nums w-5 text-center">{index + 1}</span>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mb-1">
            Native text <span className="text-red-400">*</span>
          </label>
          <textarea
            value={seg.text}
            onChange={(e) => onChange({ ...seg, text: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            placeholder="Text in target language…"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mb-1">
            Translation
          </label>
          <textarea
            value={seg.translation}
            onChange={(e) => onChange({ ...seg, translation: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            placeholder="English translation…"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
        <div>
          <label className="block text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mb-1">Start</label>
          <TimeInput
            value={seg.startTime}
            onChange={(v) => onChange({ ...seg, startTime: v })}
            onCapture={onCaptureStart}
            placeholder="0:00.0"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mb-1">End</label>
          <TimeInput
            value={seg.endTime}
            onChange={(v) => onChange({ ...seg, endTime: v })}
            onCapture={onCaptureEnd}
            placeholder="0:05.0"
          />
        </div>
      </div>
      <button
        onClick={onDelete}
        className="mt-1 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/[0.1] transition-all"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-400" />
      </button>
    </div>
  );
}

export default function LessonDetailPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentsDirty, setSegmentsDirty] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [audioError, setAudioError] = useState("");

  const { data: lesson, isLoading } = useQuery<LessonDetail>({
    queryKey: ["educator-lesson", lessonId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<LessonDetail>(`/educator/lessons/${lessonId}`, { token: token! });
    },
  });

  useEffect(() => {
    if (lesson) {
      setSegments(
        lesson.segments.map((s) => ({
          id: s.id,
          text: s.text,
          translation: s.translation ?? "",
          startTime: s.startTime,
          endTime: s.endTime,
          order: s.order,
        }))
      );
      setSegmentsDirty(false);
    }
  }, [lesson]);

  const saveSegments = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/lessons/${lessonId}/segments`, {
        method: "PUT",
        token: token!,
        body: JSON.stringify({
          segments: segments.map((s, i) => ({
            text: s.text,
            translation: s.translation || undefined,
            startTime: s.startTime,
            endTime: s.endTime,
            order: i,
          })),
        }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lesson", lessonId] });
      setSegmentsDirty(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    },
  });

  const uploadAudio = useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken();
      const fd = new FormData();
      fd.append("audio", file);
      const duration = audioRef.current?.duration;
      if (duration && isFinite(duration)) fd.append("duration", String(Math.round(duration)));
      return apiFetch<{ audioUrl: string }>(`/educator/lessons/${lessonId}/audio`, {
        method: "POST",
        token: token!,
        body: fd,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lesson", lessonId] });
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      setAudioError("");
    },
    onError: (e: Error) => setAudioError(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/lessons/${lessonId}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ isActive: !lesson?.isActive }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lesson", lessonId] });
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
    },
  });

  function updateSegment(i: number, updated: Segment) {
    setSegments((prev) => prev.map((s, j) => (j === i ? updated : s)));
    setSegmentsDirty(true);
  }

  function deleteSegment(i: number) {
    setSegments((prev) => prev.filter((_, j) => j !== i));
    setSegmentsDirty(true);
  }

  function addSegment() {
    const last = segments[segments.length - 1];
    const newStart = last ? last.endTime : 0;
    setSegments((prev) => [
      ...prev,
      { text: "", translation: "", startTime: newStart, endTime: newStart + 5, order: prev.length },
    ]);
    setSegmentsDirty(true);
  }

  function captureTime(i: number, field: "startTime" | "endTime") {
    const t = audioRef.current?.currentTime ?? 0;
    updateSegment(i, { ...segments[i], [field]: Math.round(t * 10) / 10 });
  }

  if (isLoading || !lesson) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Link
        href={`/educator/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {lesson.courseTitle}
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 capitalize">
              {lesson.type}
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Lesson {lesson.order}</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{lesson.title}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{lesson.description}</p>
          {(lesson.artist || lesson.genre) && (
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              {[lesson.artist, lesson.genre].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <button
          onClick={() => toggleActive.mutate()}
          disabled={toggleActive.isPending}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
            lesson.isActive
              ? "border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/30"
              : "border-neutral-200 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400 bg-white dark:bg-white/[0.04] hover:bg-neutral-50 dark:hover:bg-white/[0.06]"
          }`}
        >
          {lesson.isActive ? <><Eye className="h-3.5 w-3.5" /> Active</> : <><EyeOff className="h-3.5 w-3.5" /> Inactive</>}
        </button>
      </div>

      {/* Audio */}
      <div className="mb-8 rounded-2xl border border-neutral-200 dark:border-white/[0.07] bg-neutral-50 dark:bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Audio</h2>
          <button
            onClick={() => audioInputRef.current?.click()}
            disabled={uploadAudio.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploadAudio.isPending ? "Uploading…" : lesson.audioUrl ? "Replace audio" : "Upload audio"}
          </button>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAudio.mutate(f);
              e.target.value = "";
            }}
          />
        </div>
        {lesson.audioUrl ? (
          <audio ref={audioRef} src={lesson.audioUrl} controls className="w-full h-10" />
        ) : (
          <div className="flex items-center justify-center h-10 rounded-xl border-2 border-dashed border-neutral-200 dark:border-white/[0.08]">
            <p className="text-xs text-neutral-400">No audio yet — upload above</p>
          </div>
        )}
        {audioError && <p className="mt-2 text-xs text-red-500">{audioError}</p>}
      </div>

      {/* Segments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
              Transcript segments
              <span className="ml-2 text-xs font-normal text-neutral-400">({segments.length})</span>
            </h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              One segment per utterance — native text, English translation, and timestamps for audio sync.
              Click the <Mic className="inline h-3 w-3" /> icon while audio is playing to capture the current position.
            </p>
          </div>
          <button
            onClick={() => saveSegments.mutate()}
            disabled={!segmentsDirty || saveSegments.isPending}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              saveOk
                ? "bg-green-500 text-white"
                : segmentsDirty
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 cursor-not-allowed"
            }`}
          >
            {saveOk ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : saveSegments.isPending ? "Saving…" : <><Save className="h-4 w-4" /> Save segments</>}
          </button>
        </div>

        {saveSegments.isError && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
            <p className="text-xs text-red-600 dark:text-red-400">{(saveSegments.error as Error).message}</p>
          </div>
        )}

        <div className="space-y-2">
          {segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-white/[0.07]">
              <p className="text-sm font-semibold text-neutral-400 dark:text-neutral-500">No segments yet</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 text-center max-w-xs">
                Add transcript segments to enable audio-synced reading and comprehension exercises.
              </p>
            </div>
          ) : (
            segments.map((seg, i) => (
              <SegmentRow
                key={i}
                seg={seg}
                index={i}
                onChange={(updated) => updateSegment(i, updated)}
                onDelete={() => deleteSegment(i)}
                onCaptureStart={() => captureTime(i, "startTime")}
                onCaptureEnd={() => captureTime(i, "endTime")}
              />
            ))
          )}
        </div>

        <button
          onClick={addSegment}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 dark:border-white/[0.07] py-3 text-sm font-medium text-neutral-400 dark:text-neutral-500 hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-700 dark:hover:text-brand-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add segment
        </button>

        {segments.length > 0 && (
          <div className="mt-6 flex items-center justify-end">
            <button
              onClick={() => saveSegments.mutate()}
              disabled={!segmentsDirty || saveSegments.isPending}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                saveOk
                  ? "bg-green-500 text-white"
                  : segmentsDirty
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 cursor-not-allowed"
              }`}
            >
              {saveOk ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : saveSegments.isPending ? "Saving…" : <><Save className="h-4 w-4" /> Save {segments.length} segments</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
