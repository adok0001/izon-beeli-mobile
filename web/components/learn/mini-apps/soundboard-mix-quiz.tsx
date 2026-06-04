"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";

export interface SoundboardChannel {
  id: string;
  label: string;
  targetLevel: number;   // 0–100
  initialLevel: number;
  isVoice: boolean;
}

interface SoundboardMixQuizProps {
  sentence: string;
  targetWord: string;
  targetWordNative: string;
  channels: SoundboardChannel[];
  onSuccess?: (word: string) => void;
}

const TOLERANCE = 14;
const WAVEFORM_AMPS = [0.3, 0.7, 1.0, 0.6, 0.85, 0.45, 0.9, 0.55];

function WaveformBars({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-7" aria-hidden>
      {WAVEFORM_AMPS.map((amp, i) => (
        <div
          key={i}
          className="w-[3px] rounded-[1px]"
          style={{
            height: `${Math.max(2, amp * (level / 100) * 24)}px`,
            background: color,
            opacity: 0.45 + level / 200,
            transition: "height 70ms ease",
          }}
        />
      ))}
    </div>
  );
}

function VerticalFader({
  level,
  label,
  color,
  isNearTarget,
  onChange,
}: {
  level: number;
  label: string;
  color: string;
  isNearTarget: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 24, height: 88 }}>
      {/* Track bg */}
      <div
        className="absolute rounded-full"
        style={{ width: 3, height: 80, background: "rgba(255,255,255,0.07)" }}
      />
      {/* Filled track */}
      <div
        className="absolute bottom-1 rounded-full transition-all"
        style={{
          width: 3,
          height: `${(level / 100) * 80}px`,
          background: color,
          boxShadow: isNearTarget ? `0 0 8px 2px ${color}60` : "none",
          transition: "height 70ms ease, box-shadow 300ms ease",
        }}
      />
      {/* Thumb knob */}
      <div
        className="absolute rounded-sm border border-white/20 shadow-md"
        style={{
          width: 14,
          height: 6,
          bottom: `calc(${(level / 100) * 80}px - 3px)`,
          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)",
          transition: "bottom 70ms ease",
          pointerEvents: "none",
        }}
      />
      {/* Invisible rotated range input */}
      <input
        type="range"
        min={0}
        max={100}
        value={level}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} level`}
        style={{
          position: "absolute",
          width: 80,
          height: 24,
          transform: "rotate(-90deg)",
          opacity: 0,
          cursor: "ns-resize",
          margin: 0,
          padding: 0,
          zIndex: 1,
        }}
      />
    </div>
  );
}

function ChannelStrip({
  channel,
  level,
  onChange,
}: {
  channel: SoundboardChannel;
  level: number;
  onChange: (v: number) => void;
}) {
  const isNearTarget = Math.abs(level - channel.targetLevel) <= TOLERANCE;
  const color = isNearTarget ? "#34d399" : channel.isVoice ? "#60a5fa" : "#818cf8";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-all duration-300",
        isNearTarget
          ? "border-emerald-500/40 bg-emerald-500/[0.05]"
          : "border-white/[0.07] bg-white/[0.02]"
      )}
      style={{ minWidth: 68 }}
    >
      <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 text-center">
        {channel.label}
      </span>

      <WaveformBars level={level} color={color} />

      <VerticalFader
        level={level}
        label={channel.label}
        color={color}
        isNearTarget={isNearTarget}
        onChange={onChange}
      />

      <span className="text-[10px] font-mono tabular-nums" style={{ color }}>
        {String(level).padStart(3, "0")}
      </span>

      <div className={cn("transition-opacity duration-300", isNearTarget ? "opacity-100" : "opacity-0")}>
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
      </div>
    </div>
  );
}

export function SoundboardMixQuiz({
  sentence,
  targetWord,
  targetWordNative,
  channels,
  onSuccess,
}: SoundboardMixQuizProps) {
  const [levels, setLevels] = useState<Record<string, number>>(
    () => Object.fromEntries(channels.map((c) => [c.id, c.initialLevel]))
  );
  const [celebrated, setCelebrated] = useState(false);

  const allCorrect = useMemo(
    () => channels.every((c) => Math.abs((levels[c.id] ?? 0) - c.targetLevel) <= TOLERANCE),
    [channels, levels]
  );

  function handleChange(id: string, value: number) {
    setLevels((prev) => {
      const next = { ...prev, [id]: value };
      if (!celebrated) {
        const nowCorrect = channels.every(
          (c) => Math.abs((next[c.id] ?? 0) - c.targetLevel) <= TOLERANCE
        );
        if (nowCorrect) {
          setCelebrated(true);
          onSuccess?.(targetWordNative);
        }
      }
      return next;
    });
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/[0.07] p-6"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, #0a1020 0%, #05060e 70%)",
        boxShadow: allCorrect ? "0 0 40px -10px rgba(52,211,153,0.2)" : "none",
        transition: "box-shadow 600ms ease",
      }}
    >
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-600">
            Soundboard Quiz
          </span>
          <div className="flex-1 h-px bg-white/[0.04]" />
          <span className="text-[9px] font-mono text-neutral-700 uppercase tracking-widest">
            {targetWord}
          </span>
        </div>
        <p className="text-sm text-neutral-400 font-mono leading-relaxed">
          &ldquo;{sentence}&rdquo;
        </p>
        <p className="text-[11px] text-neutral-600 mt-1.5">
          Bring the voice channel up — push background noise down.
        </p>
      </div>

      {/* Channel strips */}
      <div className="flex gap-3 justify-center flex-wrap">
        {channels.map((ch) => (
          <ChannelStrip
            key={ch.id}
            channel={ch}
            level={levels[ch.id] ?? ch.initialLevel}
            onChange={(v) => handleChange(ch.id, v)}
          />
        ))}
      </div>

      {/* Reveal on success */}
      <div
        className={cn(
          "mt-6 text-center transition-all duration-700",
          allCorrect ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        )}
      >
        <div className="inline-block px-6 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08]">
          <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-600 mb-1">
            Identified
          </p>
          <p
            className="text-2xl font-bold tracking-tight text-emerald-300"
            style={{ textShadow: "0 0 20px rgba(52,211,153,0.55)" }}
          >
            {targetWordNative}
          </p>
          <p className="text-xs text-neutral-500 mt-1">{targetWord}</p>
        </div>
      </div>
    </div>
  );
}
