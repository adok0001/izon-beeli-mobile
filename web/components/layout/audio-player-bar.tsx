"use client";

import { useAudioStore } from "@/store/audio-store";
import { formatDuration } from "@/lib/utils";

export function AudioPlayerBar() {
  const { currentLesson, isPlaying, position, duration, pause, resume, seek } =
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => seek(Math.max(0, position - 10))}
            className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            aria-label="Rewind 10s"
          >
            ⏪
          </button>
          <button
            onClick={isPlaying ? pause : resume}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶️"}
          </button>
          <button
            onClick={() => seek(Math.min(duration, position + 10))}
            className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            aria-label="Forward 10s"
          >
            ⏩
          </button>
        </div>
      </div>
    </div>
  );
}
