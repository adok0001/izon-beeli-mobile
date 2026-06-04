"use client";

import { cn, formatDuration } from "@/lib/utils";
import { SPEED_OPTIONS, useAudioStore, type PlaybackSpeed } from "@/store/audio-store";
import type { Lesson } from "@/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

// ── Sub-components ────────────────────────────────────────────

function PlayButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center w-14 h-14 rounded-full cursor-pointer shrink-0",
        "transition-transform duration-200 hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50",
      )}
      style={{
        background: active
          ? "radial-gradient(circle at 35% 30%, #fbbf24, #b45309 60%, #78350f)"
          : "radial-gradient(circle at 35% 30%, #fde68a, #d97706 60%, #92400e)",
        border: "2px solid rgb(180 120 30 / 0.4)",
        boxShadow: [
          "0 0 0 4px rgb(251 191 36 / 0.15)",
          active ? "0 0 28px rgb(251 191 36 / 0.45)" : "0 4px 16px rgb(120 60 10 / 0.25)",
          "inset 0 1px 0 rgb(255 255 255 / 0.3)",
          "inset 0 -2px 6px rgb(0 0 0 / 0.2)",
        ].join(", "),
        animation: active ? "amber-breathe 2.2s ease-in-out infinite" : "none",
      }}
      aria-label={active ? "Pause" : "Play"}
    >
      <div
        aria-hidden
        className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-2.5 rounded-full blur-sm opacity-30"
        style={{ background: "#fef3c7" }}
      />
      {active ? (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="rgb(120 53 15)" className="relative z-10" aria-hidden>
          <rect x="3" y="2" width="4" height="14" rx="1.5" />
          <rect x="11" y="2" width="4" height="14" rx="1.5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="rgb(120 53 15)" className="relative z-10 translate-x-0.5" aria-hidden>
          <path d="M4 2.5l12 6.5-12 6.5V2.5z" />
        </svg>
      )}
    </button>
  );
}

function Scrubber({ position, duration, isCurrentLesson, onSeek }: {
  position: number; duration: number; isCurrentLesson: boolean; onSeek: (t: number) => void;
}) {
  const progress = duration > 0 ? (position / duration) * 100 : 0;
  return (
    <div className="relative h-7 flex items-center">
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgb(180 130 60 / 0.15)", border: "1px solid rgb(180 130 60 / 0.2)" }}
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #d97706, #f59e0b)" }}
        />
      </div>

      {/* Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full pointer-events-none transition-[left] duration-100"
        style={{
          left: `${progress}%`,
          background: "linear-gradient(145deg, #fef3c7, #d97706)",
          boxShadow: "0 1px 4px rgb(120 60 10 / 0.4), inset 0 1px 0 rgb(255 255 255 / 0.5)",
          border: "1px solid rgb(180 120 30 / 0.5)",
        }}
        aria-hidden
      />

      <input
        type="range" min={0} max={duration || 100}
        value={isCurrentLesson ? position : 0}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        aria-label="Seek audio"
      />
    </div>
  );
}

function SkipButton({ label, onClick, disabled, ariaLabel }: {
  label: string; onClick: () => void; disabled: boolean; ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold font-mono text-amber-800/50 transition-colors hover:text-amber-800 hover:bg-amber-200/40 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ border: "1px solid rgb(180 130 60 / 0.2)" }}
    >
      {label}
    </button>
  );
}

// ── Waveform ──────────────────────────────────────────────────

function Waveform({ progress, active }: { progress: number; active: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-8" aria-hidden>
      {Array.from({ length: 40 }, (_, i) => {
        const h = 22 + Math.abs(Math.sin(i * 0.7 + 1.2) * 62 + Math.cos(i * 0.4) * 20);
        const filled = (i / 40) * 100 <= progress;
        return (
          <div
            key={i}
            className="flex-1 rounded-[2px] transition-colors"
            style={{
              height: `${h}%`,
              background: filled
                ? "linear-gradient(to top, #b45309, #fbbf24)"
                : "rgb(180 130 60 / 0.18)",
              animation: active ? `wave-pulse 1.2s ease-in-out ${i * 35}ms infinite alternate` : "none",
              transformOrigin: "bottom",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────

interface Props { lesson: Lesson; }

export function TactileAudioPlayer({ lesson }: Readonly<Props>) {
  const { t } = useTranslation();
  const { currentLesson, isPlaying, position, duration, speed, load, pause, resume, seek, skipForward, skipBackward, setSpeed } = useAudioStore();

  const isCurrentLesson = currentLesson?.id === lesson.id;
  const progress = isCurrentLesson && duration > 0 ? (position / duration) * 100 : 0;
  const active = isCurrentLesson && isPlaying;

  const handlePlayPause = useCallback(() => {
    if (isCurrentLesson) { isPlaying ? pause() : resume(); }
    else { load(lesson); }
  }, [lesson, isCurrentLesson, isPlaying, pause, resume, load]);

  return (
    <div
      className="space-y-3 rounded-2xl p-4"
      style={{
        background: "linear-gradient(160deg, #fef9ec 0%, #fdf3d0 100%)",
        border: "1px solid rgb(180 130 60 / 0.25)",
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.7), 0 4px 20px rgb(120 80 20 / 0.12)",
      }}
    >
      <Waveform progress={progress} active={active} />

      <Scrubber
        position={isCurrentLesson ? position : 0}
        duration={duration || lesson.duration || 100}
        isCurrentLesson={isCurrentLesson}
        onSeek={seek}
      />

      <div className="flex justify-between text-[11px] text-amber-800/40 font-mono tabular-nums">
        <span>{isCurrentLesson ? formatDuration(position) : "0:00"}</span>
        <span>{lesson.duration ? formatDuration(lesson.duration) : "--:--"}</span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <SkipButton label="↺ 10" onClick={() => skipBackward(10)} disabled={!isCurrentLesson} ariaLabel={t("lesson.rewind10")} />
        <PlayButton active={active} onClick={handlePlayPause} />
        <SkipButton label="10 ↻" onClick={() => skipForward(10)} disabled={!isCurrentLesson} ariaLabel={t("lesson.forward10")} />
        <select
          value={isCurrentLesson ? speed : 1}
          onChange={(e) => setSpeed(Number(e.target.value) as PlaybackSpeed)}
          disabled={!isCurrentLesson}
          aria-label={t("lesson.playbackSpeed")}
          className="text-[11px] font-bold font-mono text-amber-800/50 bg-amber-100/50 border border-amber-200/60 rounded-lg px-2 py-1.5 cursor-pointer outline-none hover:bg-amber-100 disabled:opacity-30 transition-colors"
        >
          {SPEED_OPTIONS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
      </div>

      <style>{`
        @keyframes wave-pulse {
          from { transform: scaleY(0.55); }
          to   { transform: scaleY(1.2); }
        }
        @keyframes amber-breathe {
          0%,100% { box-shadow: 0 0 0 4px rgb(251 191 36/.15), 0 4px 16px rgb(120 60 10/.25), inset 0 1px 0 rgb(255 255 255/.3); }
          50%      { box-shadow: 0 0 0 8px rgb(251 191 36/.25), 0 0 36px rgb(251 191 36/.5), inset 0 1px 0 rgb(255 255 255/.3); }
        }
      `}</style>
    </div>
  );
}
