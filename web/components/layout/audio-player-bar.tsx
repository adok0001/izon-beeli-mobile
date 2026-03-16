"use client";

import { formatDuration } from "@/lib/utils";
import { SPEED_OPTIONS, useAudioStore, type PlaybackSpeed } from "@/store/audio-store";
import { FastForward, Pause, Play, Rewind, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AudioPlayerBar() {
  const { t } = useTranslation();
  const { currentLesson, isPlaying, position, duration, speed, pause, resume, seek, skipForward, skipBackward, setSpeed, stop } =
    useAudioStore();

  if (!currentLesson) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-60 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-lg">
      {/* Progress bar */}
      <div className="relative h-1 bg-neutral-200 dark:bg-neutral-700">
        <div
          className="absolute inset-y-0 left-0 bg-brand-500 transition-all"
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

      <div className="flex items-center gap-3 px-4 py-2 pb-safe">
        {/* Lesson info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {currentLesson.title}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatDuration(position)} / {formatDuration(duration)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => skipBackward(10)}
            className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={t("lesson.rewind10")}
          >
            <Rewind className="h-4 w-4" />
          </button>
          <button
            onClick={isPlaying ? pause : resume}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            aria-label={isPlaying ? t("lesson.pause") : t("lesson.play")}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => skipForward(10)}
            className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={t("lesson.forward10")}
          >
            <FastForward className="h-4 w-4" />
          </button>

          {/* Speed selector */}
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value) as PlaybackSpeed)}
            className="ml-1 text-xs font-medium px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-none outline-none cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label={t("lesson.playbackSpeed")}
          >
            {SPEED_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}×</option>
            ))}
          </select>

          {/* Close / stop */}
          <button
            onClick={stop}
            className="ml-1 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
