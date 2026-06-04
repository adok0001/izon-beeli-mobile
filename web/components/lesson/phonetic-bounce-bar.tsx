"use client";

import { cn } from "@/lib/utils";

interface PhoneticBounceBarProps {
  text: string;
  isPlaying: boolean;
  startTime: number;
  endTime: number;
  position: number;
}

export function PhoneticBounceBar({ text, isPlaying, startTime, endTime, position }: Readonly<PhoneticBounceBarProps>) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const segmentDuration = endTime - startTime;
  const ratio = segmentDuration > 0 ? (position - startTime) / segmentDuration : 0;
  const clamped = Math.max(0, Math.min(0.9999, ratio));
  const activeIdx = Math.floor(clamped * words.length);

  return (
    <div
      className="flex flex-wrap gap-x-2 gap-y-1 px-1 pt-2 pb-1"
      aria-hidden="true" // decorative — the transcript text is already readable
    >
      {words.map((word, i) => {
        const isActive = i === activeIdx;
        return (
          <span key={`bounce-${i}-${word}`} className="relative inline-flex flex-col items-center">
            {/* Hopping dot */}
            <span
              className={cn(
                "mb-0.5 h-1.5 w-1.5 rounded-full transition-opacity duration-150",
                isActive && isPlaying
                  ? "bg-amber-400 opacity-100 animate-bounce"
                  : "bg-transparent opacity-0",
              )}
            />
            <span
              className={cn(
                "text-[11px] font-mono transition-colors duration-150",
                isActive
                  ? "text-amber-400 font-semibold"
                  : "text-neutral-500 dark:text-neutral-600",
              )}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  );
}
