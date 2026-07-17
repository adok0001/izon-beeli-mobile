"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, Music, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ErrorMsg, fieldCls, Label, LanguagePicker, StepHeader, type Course } from "../_components/shared";
import { useForm } from "../_components/use-form";

interface TranscriptSegment {
  id: number;
  text: string;
  translation: string;
  startTime: number;
  endTime: number;
}

let segIdSeq = 1;
function newSeg(startTime = 0): TranscriptSegment {
  return { id: segIdSeq++, text: "", translation: "", startTime, endTime: startTime + 5 };
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface LessonState {
  step: number;
  langId: string;
  courseId: string;
  title: string;
  description: string;
  audioFile: File | null;
  audioUrl: string | null;
  segments: TranscriptSegment[];
  error: string | null;
}

export function LessonFlow({ onDone }: Readonly<{ onDone: () => void }>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();

  const [state, set] = useForm<LessonState>({
    step: 1,
    langId: selectedLanguageId,
    courseId: "",
    title: "",
    description: "",
    audioFile: null,
    audioUrl: null,
    segments: [newSeg()],
    error: null,
  });
  const { step, langId, courseId, title, description, audioFile, audioUrl, segments, error } = state;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["courses-for-contribute", langId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>(`/courses?languageId=${langId}`, { token: token ?? undefined });
    },
    enabled: !!langId && step >= 2,
  });

  function handleAudio(file: File) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    set({ audioFile: file, audioUrl: URL.createObjectURL(file) });
  }

  function markTime(segId: number, field: "startTime" | "endTime") {
    const currentTime = audioRef.current?.currentTime ?? 0;
    set({ segments: segments.map((s) => s.id === segId ? { ...s, [field]: Number.parseFloat(currentTime.toFixed(2)) } : s) });
  }

  function updateSeg(id: number, field: keyof TranscriptSegment, value: string | number) {
    set({ segments: segments.map((s) => s.id === id ? { ...s, [field]: value } : s) });
  }

  function addSeg() {
    const last = segments[segments.length - 1];
    set({ segments: [...segments, newSeg(last ? last.endTime : 0)] });
  }

  function removeSeg(id: number) {
    set({ segments: segments.filter((s) => s.id !== id) });
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!audioFile) throw new Error("Audio file required");
      const token = await getToken();
      const form = new FormData();
      form.append("languageId", langId);
      if (courseId) form.append("courseId", courseId);
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("audio", audioFile);
      const segs = segments
        .filter((s) => s.text.trim())
        .map(({ text, translation, startTime, endTime }) => ({ text, translation, startTime, endTime }));
      form.append("segments", JSON.stringify(segs));
      return apiFetch("/lesson-contributions", { method: "POST", body: form, token: token ?? undefined });
    },
    onSuccess: onDone,
    onError: (err: Error) => set({ error: err.message }),
  });

  if (step === 1) {
    return (
      <div>
        <StepHeader step={1} total={5} title={t("contribute.chooseLanguage")} onBack={onDone} />
        <LanguagePicker value={langId} onChange={(v) => set({ langId: v })} />
        <button
          onClick={() => set({ step: 2 })}
          disabled={!langId}
          className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <StepHeader step={2} total={5} title={t("contribute.chooseCourseOptional")} onBack={() => set({ step: 1 })} />
        <div className="space-y-2">
          <button
            onClick={() => set({ courseId: "" })}
            className={cn(
              "w-full py-3 px-4 rounded-xl border text-sm font-medium text-left transition-colors",
              !courseId
                ? "bg-purple-600 text-white border-purple-600"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-purple-400"
            )}
          >
            {t("contribute.standaloneLesson")}
          </button>
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => set({ courseId: course.id })}
              className={cn(
                "w-full py-3 px-4 rounded-xl border text-sm font-medium text-left transition-colors",
                courseId === course.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-purple-400"
              )}
            >
              {course.title}
            </button>
          ))}
        </div>
        <button
          onClick={() => set({ step: 3 })}
          className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        <StepHeader step={3} total={5} title={t("contribute.lessonDetails")} onBack={() => set({ step: 2 })} />
        <div className="space-y-4">
          <div>
            <Label>{t("contribute.wordRequired")}</Label>
            <input className={fieldCls} value={title} onChange={(e) => set({ title: e.target.value })} placeholder={t("contribute.lessonTitlePlaceholder")} autoFocus />
          </div>
          <div>
            <Label>{t("contribute.descriptionLabel")}</Label>
            <textarea
              className={cn(fieldCls, "resize-none")}
              rows={3}
              value={description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder={t("contribute.lessonDescPlaceholder")}
            />
          </div>
        </div>
        <button
          onClick={() => set({ step: 4 })}
          disabled={!title.trim()}
          className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <StepHeader step={4} total={5} title={t("contribute.uploadAudio")} onBack={() => set({ step: 3 })} />
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 p-8 cursor-pointer hover:border-purple-400 transition-colors">
            <Music className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <span className="text-sm text-neutral-500">
              {audioFile ? audioFile.name : t("contribute.chooseFileFormats")}
            </span>
            <input type="file" accept="audio/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudio(f); }} />
          </label>

          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full h-10"
            />
          )}
        </div>
        <button
          onClick={() => set({ step: 5 })}
          disabled={!audioFile}
          className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("contribute.nextAddTranscript")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Step 5: Transcript
  return (
    <div>
      <StepHeader step={5} total={5} title={t("contribute.timedTranscript")} onBack={() => set({ step: 4 })} />

      {audioUrl && (
        <div className="mb-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
          <audio ref={audioRef} src={audioUrl} controls className="w-full h-8" />
          <p className="text-xs text-neutral-400 mt-2">
            {t("contribute.addTranscriptDesc")}
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {segments.map((seg, idx) => (
          <div key={seg.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">{t("contribute.segmentN", { number: idx + 1 })}</span>
              {segments.length > 1 && (
                <button onClick={() => removeSeg(seg.id)} className="text-neutral-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("contribute.textLabel")}</Label>
                <input className={cn(fieldCls, "py-1.5")} value={seg.text} onChange={(e) => updateSeg(seg.id, "text", e.target.value)} placeholder="Language text" />
              </div>
              <div>
                <Label>{t("contribute.translationLabel")}</Label>
                <input className={cn(fieldCls, "py-1.5")} value={seg.translation} onChange={(e) => updateSeg(seg.id, "translation", e.target.value)} placeholder="English" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("contribute.startTimeLabel", { time: formatTime(seg.startTime) })}</Label>
                <button
                  onClick={() => markTime(seg.id, "startTime")}
                  className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  {t("contribute.markStart")}
                </button>
              </div>
              <div>
                <Label>{t("contribute.endTimeLabel", { time: formatTime(seg.endTime) })}</Label>
                <button
                  onClick={() => markTime(seg.id, "endTime")}
                  className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  {t("contribute.markEnd")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addSeg} className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline">
        <Plus className="h-3.5 w-3.5" /> {t("contribute.addSegment")}
      </button>

      <ErrorMsg msg={error} />

      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {submit.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("contribute.submitting")}</> : t("contribute.submitLesson")}
      </button>
    </div>
  );
}
