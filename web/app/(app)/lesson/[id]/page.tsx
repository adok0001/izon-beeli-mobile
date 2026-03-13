"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { use, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { useAudioStore } from "@/store/audio-store";
import { formatDuration, cn } from "@/lib/utils";
import type { Lesson } from "@/types";

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const { load, currentLesson, isPlaying, position, duration, pause, resume, seek } =
    useAudioStore();

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Lesson>(`/lessons/${id}`, { token: token ?? undefined });
    },
  });

  // Auto-load audio when lesson arrives
  useEffect(() => {
    if (lesson && currentLesson?.id !== lesson.id) {
      load(lesson);
    }
  }, [lesson]);

  const isActive = currentLesson?.id === id;
  const progress = isActive && duration > 0 ? (position / duration) * 100 : 0;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse w-2/3" />
        <div className="h-48 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">{lesson.description}</p>
        )}
      </div>

      {/* Audio Player */}
      {lesson.audioUrl && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
          {/* Waveform placeholder */}
          <div className="flex items-center gap-1 mb-4 h-10">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-all",
                  isActive && (i / 40) * 100 <= progress
                    ? "bg-brand-500"
                    : "bg-neutral-200 dark:bg-neutral-700"
                )}
                style={{ height: `${20 + Math.sin(i * 0.8) * 14}px` }}
              />
            ))}
          </div>

          {/* Seek bar */}
          <div className="relative h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mb-3">
            <div
              className="absolute inset-y-0 left-0 bg-brand-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={isActive ? duration : 100}
              value={isActive ? position : 0}
              onChange={(e) => seek(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Time */}
          <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500 mb-4">
            <span>{isActive ? formatDuration(position) : "0:00"}</span>
            <span>{lesson.duration ? formatDuration(lesson.duration) : "--:--"}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => seek(Math.max(0, position - 10))}
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              aria-label="Rewind 10s"
            >
              <span className="text-xl">⏪</span>
            </button>
            <button
              onClick={isActive && isPlaying ? pause : resume}
              className="w-14 h-14 rounded-full bg-brand-600 text-white text-2xl flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg"
              aria-label={isActive && isPlaying ? "Pause" : "Play"}
            >
              {isActive && isPlaying ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => seek(Math.min(isActive ? duration : 0, position + 10))}
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              aria-label="Forward 10s"
            >
              <span className="text-xl">⏩</span>
            </button>
          </div>
        </div>
      )}

      {/* Transcript */}
      {lesson.transcript && lesson.transcript.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-3">
            Transcript
          </h2>
          {lesson.transcript.map((seg) => {
            const isHighlighted =
              isActive && position >= seg.startTime && position < seg.endTime;
            return (
              <button
                key={seg.id}
                onClick={() => seek(seg.startTime)}
                className={cn(
                  "w-full text-left rounded-xl p-4 transition-colors",
                  isHighlighted
                    ? "bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                )}
              >
                <p
                  className={cn(
                    "text-sm font-medium",
                    isHighlighted
                      ? "text-brand-700 dark:text-brand-300"
                      : "text-neutral-800 dark:text-neutral-200"
                  )}
                >
                  {seg.text}
                </p>
                {seg.translation && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {seg.translation}
                  </p>
                )}
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  {formatDuration(seg.startTime)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
