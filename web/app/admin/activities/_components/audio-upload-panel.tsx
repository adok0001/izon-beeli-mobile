"use client";

import { cn } from "@/lib/utils";
import { Mic, Square, Upload } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { AUDIO_FILE_ACCEPT, labelCls } from "./shared";

export function AudioUploadPanel({
  audioPreviewUrl, audioRef, isRecording, recordingError, audioError, onFile, onStartRecord, onStopRecord,
}: {
  audioPreviewUrl: string | null; audioRef: React.RefObject<HTMLAudioElement | null>;
  isRecording: boolean; recordingError: string; audioError: string;
  onFile: (f: File) => void; onStartRecord: () => void; onStopRecord: () => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const canRecord = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="space-y-2">
      <p className={labelCls}>{t("admin.activities.audioLabel")}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <Upload className="h-4 w-4" /> {t("admin.activities.uploadAudio")}
        </button>
        {canRecord && (
          <button type="button" onClick={isRecording ? onStopRecord : onStartRecord}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            )}>
            {isRecording ? <><Square className="h-4 w-4" /> {t("admin.activities.stop")}</> : <><Mic className="h-4 w-4" /> {t("admin.activities.record")}</>}
          </button>
        )}
        {isRecording && <span className="flex items-center gap-1.5 text-xs text-red-500 animate-pulse"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {t("admin.activities.recording")}</span>}
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
