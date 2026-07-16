"use client";

import { cn } from "@/lib/utils";
import { localizeField } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";
import { ArrowRight, X, Volume2, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LEVEL_COLORS, type NodeState } from "./map-node";

// ── Level badge ───────────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<string, { text: string; border: string; bg: string }> = {
  beginner:     { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  intermediate: { text: "text-blue-400",    border: "border-blue-500/30",    bg: "bg-blue-500/10"    },
  advanced:     { text: "text-violet-400",  border: "border-violet-500/30",  bg: "bg-violet-500/10"  },
};

// ── LocationDrawer ────────────────────────────────────────────────────────────

interface LocationDrawerProps {
  course: Course | null;
  nodeState: NodeState;
  onClose: () => void;
  onUnlock: (courseId: string) => void;
}

export function LocationDrawer({ course, nodeState, onClose, onUnlock }: Readonly<LocationDrawerProps>) {
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);

  const isOpen = course !== null;

  if (!course) {
    return (
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-[360px] z-30 pointer-events-none",
          "transition-transform duration-300 ease-in-out translate-x-full",
        )}
      />
    );
  }

  const colors = LEVEL_COLORS[course.level as keyof typeof LEVEL_COLORS] ?? LEVEL_COLORS.beginner;
  const badge = LEVEL_BADGE[course.level] ?? LEVEL_BADGE.beginner;
  const title = localizeField(course.title, course.titleFr, uiLanguage);
  const description = localizeField(course.description, course.descriptionFr, uiLanguage);
  const isUnlocked = nodeState === "unlocked" || nodeState === "complete";
  const isListening = nodeState === "listening";
  const isLocked = nodeState === "locked";
  const estimatedXp = course.lessonsCount * 50;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px]",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-[360px] z-30 flex flex-col",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        style={{
          background: "linear-gradient(180deg, #0c0c1a 0%, #080811 100%)",
          borderLeft: `1px solid ${colors.ring}25`,
          boxShadow: `-16px 0 48px -8px ${colors.glow}20`,
        }}
      >
        {/* Top accent */}
        <div
          className="h-[3px] shrink-0"
          style={{ background: `linear-gradient(90deg, transparent, ${colors.ring}, transparent)` }}
        />

        {/* Hero image */}
        <div className="relative h-44 shrink-0 overflow-hidden">
          {course.imageUrl ? (
            <Image src={course.imageUrl} alt="" fill className="object-cover" sizes="360px" style={{ filter: "brightness(0.75)" }} />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${colors.glow}30 0%, #080811 70%)` }}
            />
          )}
          {/* Noise grain */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
          />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0c0c1a] to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>

          {/* State badge */}
          {nodeState === "complete" && (
            <div
              className="absolute top-3 left-3 px-2 py-0.5 rounded-full backdrop-blur-sm"
              style={{ background: `${colors.glow}25`, border: `1px solid ${colors.ring}50` }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: colors.ring }}>
                ★ Complete
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Level + XP */}
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-0.5 rounded-full border", badge.text, badge.border, badge.bg)}>
              {t(`levels.${course.level}`, { defaultValue: course.level })}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: `${colors.ring}15`, border: `1px solid ${colors.ring}30`, color: colors.ring }}
            >
              <Zap className="h-3 w-3" /> {estimatedXp} XP
            </span>
          </div>

          {/* Title + description */}
          <div>
            <h2 className="font-display font-bold text-white text-xl leading-snug mb-2">{title}</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
          </div>

          {/* Lessons count */}
          <p className="text-[11px] text-neutral-600 uppercase tracking-wider">
            {t("learn.totalLessons", { count: course.lessonsCount, defaultValue: `${course.lessonsCount} lessons` })}
          </p>

          {/* Progress */}
          {(course.progress ?? 0) > 0 && (
            <div className="pt-4 border-t border-white/[0.05]">
              <div className="flex justify-between text-[11px] mb-2">
                <span className="text-neutral-500 uppercase tracking-wider">Progress</span>
                <span className="font-bold" style={{ color: colors.text }}>{course.progress}%</span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%`, background: `linear-gradient(90deg, ${colors.glow}, ${colors.ring})` }}
                />
              </div>
            </div>
          )}

          {/* MindMaze flavour text */}
          <div
            className="flex items-start gap-2 p-3 rounded-xl text-xs text-neutral-500 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Volume2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Each location hides a soundscape. Listen carefully — the city will reveal itself.</span>
          </div>
        </div>

        {/* CTA footer */}
        <div className="shrink-0 p-5 border-t border-white/[0.05]">
          {isLocked && (
            <button
              type="button"
              onClick={() => onUnlock(course.id)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: `${colors.glow}18`,
                border: `1px solid ${colors.ring}40`,
                color: colors.ring,
              }}
            >
              <Volume2 className="w-4 h-4" />
              Listen to unlock
            </button>
          )}

          {isListening && (
            <div
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl"
              style={{ background: `${colors.glow}12`, border: `1px solid ${colors.ring}30` }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: colors.ring }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: colors.glow }} />
              </span>
              <span className="text-sm font-semibold tracking-wide" style={{ color: colors.ring }}>Listening…</span>
            </div>
          )}

          {isUnlocked && (
            <Link
              href={`/course/${course.id}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${colors.glow}, ${colors.dot})`,
                color: "#fff",
                boxShadow: `0 0 24px -4px ${colors.glow}60`,
              }}
            >
              {nodeState === "complete" ? "Revisit location" : "Enter location"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
