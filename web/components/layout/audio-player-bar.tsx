"use client";

import { formatDuration } from "@/lib/utils";
import { SPEED_OPTIONS, useAudioStore, type PlaybackSpeed } from "@/store/audio-store";
import { FastForward, Pause, Play, Rewind, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AudioPlayerBar() {
  const { t } = useTranslation();
  const {
    currentLesson, isPlaying, position, duration, speed,
    pause, resume, seek, skipForward, skipBackward, setSpeed, stop,
  } = useAudioStore();

  if (!currentLesson) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-60 z-40 bg-[#0d0d18]/95 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/[0.08] shadow-lift">
      {/* Progress bar */}
      <div className="relative h-[3px] bg-white/[0.08]">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-500 to-brand-400 shadow-glow-xs transition-all"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={position}
          onChange={(e) => seek(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-3 px-5 py-3">
        {/* Lesson info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{currentLesson.title}</p>
          <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
            {formatDuration(position)} / {formatDuration(duration)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => skipBackward(10)}
            className="p-2 text-neutral-500 hover:text-white rounded-lg hover:bg-white/[0.07] transition-all"
            aria-label={t("lesson.rewind10")}
          >
            <Rewind className="h-4 w-4" />
          </button>

          <button
            onClick={isPlaying ? pause : resume}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm hover:shadow-glow transition-all mx-1"
            aria-label={isPlaying ? t("lesson.pause") : t("lesson.play")}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            onClick={() => skipForward(10)}
            className="p-2 text-neutral-500 hover:text-white rounded-lg hover:bg-white/[0.07] transition-all"
            aria-label={t("lesson.forward10")}
          >
            <FastForward className="h-4 w-4" />
          </button>

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value) as PlaybackSpeed)}
            className="ml-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/[0.07] text-neutral-300 border border-white/[0.08] outline-none cursor-pointer hover:bg-white/[0.1] transition-colors"
            aria-label={t("lesson.playbackSpeed")}
          >
            {SPEED_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-neutral-900 text-white">{s}×</option>
            ))}
          </select>

          <button
            onClick={stop}
            className="ml-1 p-2 text-neutral-600 hover:text-neutral-300 rounded-lg hover:bg-white/[0.07] transition-all"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
