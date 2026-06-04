"use client";

import { cn } from "@/lib/utils";
import { localizeField } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NodeState = "locked" | "listening" | "unlocked" | "complete";

export function deriveNodeState(course: Course): NodeState {
  if (course.progress === 100) return "complete";
  if ((course.progress ?? 0) > 0) return "unlocked";
  return "locked";
}

// ── Palette ───────────────────────────────────────────────────────────────────

export const LEVEL_COLORS = {
  beginner:     { glow: "#10b981", ring: "#34d399", text: "#6ee7b7", dot: "#059669" },
  intermediate: { glow: "#3b82f6", ring: "#60a5fa", text: "#93c5fd", dot: "#2563eb" },
  advanced:     { glow: "#8b5cf6", ring: "#a78bfa", text: "#c4b5fd", dot: "#7c3aed" },
} as const;

// ── MapNode ───────────────────────────────────────────────────────────────────

interface MapNodeProps {
  course: Course;
  nodeState: NodeState;
  position: { x: number; y: number }; // percentage of container
  isSelected: boolean;
  onSelect: () => void;
  onUnlock: (courseId: string) => void;
  label?: string; // community name override; falls back to course title
}

export function MapNode({
  course,
  nodeState,
  position,
  isSelected,
  onSelect,
  onUnlock,
  label,
}: Readonly<MapNodeProps>) {
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const colors = LEVEL_COLORS[course.level as keyof typeof LEVEL_COLORS] ?? LEVEL_COLORS.beginner;
  const title = label ?? localizeField(course.title, course.titleFr, uiLanguage);

  const isUnlocked = nodeState === "unlocked" || nodeState === "complete";
  const isLocked = nodeState === "locked";
  const isListening = nodeState === "listening";

  function handleClick() {
    if (isLocked) {
      onUnlock(course.id);
    } else {
      onSelect();
    }
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
      style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: isSelected ? 20 : 10 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`${title} — ${nodeState}`}
    >
      {/* Listening pulse rings */}
      {isListening && (
        <>
          <span
            className="absolute inset-0 -m-3 rounded-full animate-ping"
            style={{ background: `${colors.glow}22` }}
          />
          <span
            className="absolute inset-0 -m-1.5 rounded-full animate-pulse"
            style={{ border: `1px solid ${colors.ring}60` }}
          />
        </>
      )}

      {/* Selection ring */}
      {isSelected && (
        <span
          className="absolute inset-0 -m-2 rounded-full"
          style={{ border: `2px solid ${colors.ring}`, boxShadow: `0 0 16px 0 ${colors.glow}80` }}
        />
      )}

      {/* Node circle */}
      <div
        className={cn(
          "relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          "border-2",
          isUnlocked && "scale-110",
          isSelected && "scale-125",
        )}
        style={{
          background: isLocked ? "#0e0e1a" : `radial-gradient(circle, ${colors.glow}30, #0e0e1a)`,
          borderColor: isLocked ? "rgba(255,255,255,0.1)" : colors.ring,
          boxShadow: isUnlocked
            ? `0 0 20px -4px ${colors.glow}, 0 0 8px -2px ${colors.glow}80`
            : "none",
        }}
      >
        {isLocked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
        {isListening && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: colors.ring }} />
            <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: colors.glow }} />
          </span>
        )}
        {isUnlocked && nodeState !== "complete" && (
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.ring }} />
        )}
        {nodeState === "complete" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.ring} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Location label */}
      <div
        className={cn(
          "absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none",
          "transition-opacity duration-200",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <div
          className="px-2 py-1 rounded-lg backdrop-blur-sm text-[10px] font-semibold tracking-wide text-center"
          style={{
            background: "rgba(5,5,15,0.85)",
            border: `1px solid ${isUnlocked ? colors.ring + "50" : "rgba(255,255,255,0.08)"}`,
            color: isUnlocked ? colors.text : "rgba(255,255,255,0.4)",
            maxWidth: "120px",
            whiteSpace: "normal",
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
