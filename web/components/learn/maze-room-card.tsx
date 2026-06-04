"use client";

import { cn } from "@/lib/utils";
import { localizeField } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ── Room palette by level ─────────────────────────────────────

const ROOM_META: Record<string, {
  glow: string; doorBorder: string; accentFrom: string; accentTo: string;
  badgeText: string; badgeBg: string; floorTint: string;
}> = {
  beginner: {
    glow: "rgb(52 211 153 / 0.45)", doorBorder: "rgb(52 211 153 / 0.4)",
    accentFrom: "#059669", accentTo: "#34d399",
    badgeText: "text-emerald-300", badgeBg: "bg-emerald-500/10 border-emerald-500/25",
    floorTint: "from-emerald-950/80",
  },
  intermediate: {
    glow: "rgb(96 165 250 / 0.45)", doorBorder: "rgb(96 165 250 / 0.4)",
    accentFrom: "#2563eb", accentTo: "#60a5fa",
    badgeText: "text-blue-300", badgeBg: "bg-blue-500/10 border-blue-500/25",
    floorTint: "from-blue-950/80",
  },
  advanced: {
    glow: "rgb(167 139 250 / 0.45)", doorBorder: "rgb(167 139 250 / 0.4)",
    accentFrom: "#7c3aed", accentTo: "#a78bfa",
    badgeText: "text-violet-300", badgeBg: "bg-violet-500/10 border-violet-500/25",
    floorTint: "from-violet-950/80",
  },
};

type RoomState = "locked" | "listening" | "open" | "complete";

function deriveRoomState(course: Course): RoomState {
  if (course.progress === 100) return "complete";
  if ((course.progress ?? 0) > 0) return "open";
  return "locked";
}

// ── Doorframe illustration ────────────────────────────────────

function RoomScene({ imageUrl, state, level, meta }: Readonly<{
  imageUrl?: string; state: RoomState; level: string;
  meta: (typeof ROOM_META)[string];
}>) {
  const isOpen = state === "open" || state === "complete";
  return (
    <div className="relative h-36 overflow-hidden">
      {/* Room background */}
      {imageUrl ? (
        <Image
          src={imageUrl} alt="" fill className="object-cover"
          sizes="280px"
          style={{ filter: state === "locked" ? "grayscale(0.7) brightness(0.6)" : "brightness(0.85)" }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${meta.accentFrom}22 0%, #0a0a14 70%)`,
          }}
        />
      )}

      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.045] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        aria-hidden
      />

      {/* Doorframe */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 h-24 rounded-t-2xl transition-all duration-300"
        style={{
          border: `2px solid ${isOpen ? meta.doorBorder : "rgb(255 255 255 / 0.08)"}`,
          borderBottom: "none",
          boxShadow: isOpen ? `0 0 24px -4px ${meta.glow}, inset 0 0 12px -4px ${meta.glow}` : "none",
          background: state === "locked"
            ? "rgb(0 0 0 / 0.5)"
            : `linear-gradient(to bottom, ${meta.accentFrom}18, ${meta.accentFrom}08)`,
        }}
        aria-hidden
      >
        {/* Lock icon */}
        {state === "locked" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}
        {/* Door handle */}
        {isOpen && (
          <div
            className="absolute bottom-4 right-2 w-[5px] h-[5px] rounded-full"
            style={{ background: meta.accentTo, boxShadow: `0 0 8px ${meta.accentTo}` }}
          />
        )}
      </div>

      {/* Complete star */}
      {state === "complete" && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full backdrop-blur-sm" style={{ background: "rgb(0 0 0 / 0.5)", border: `1px solid ${meta.doorBorder}` }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: meta.accentTo }}>★ Done</span>
        </div>
      )}

      {/* Floor gradient */}
      <div className={cn("absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t to-transparent", meta.floorTint)} aria-hidden />
    </div>
  );
}

// ── Listening indicator ───────────────────────────────────────

function ListeningPulse({ accentColor }: { accentColor: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgb(255 255 255 / 0.04)", border: `1px solid ${accentColor}40` }}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accentColor }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: accentColor }} />
      </span>
      <span className="text-xs font-semibold tracking-wide" style={{ color: accentColor }}>Listening…</span>
    </div>
  );
}

// ── XP badge ─────────────────────────────────────────────────

function XpBadge({ xp, accentTo }: { xp: number; accentTo: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: `${accentTo}18`, border: `1px solid ${accentTo}35`, color: accentTo }}
    >
      ⚡ {xp} XP
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────

interface Props { course: Course; previewAudioUrl?: string; }

export function MazeRoomCard({ course, previewAudioUrl }: Readonly<Props>) {
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<RoomState>(deriveRoomState(course));

  const meta = ROOM_META[course.level] ?? ROOM_META.beginner;
  const title = localizeField(course.title, course.titleFr, uiLanguage);
  const description = localizeField(course.description, course.descriptionFr, uiLanguage);
  const isOpen = state === "open" || state === "complete";
  const estimatedXp = course.lessonsCount * 50;

  function handleUnlock() {
    if (previewAudioUrl) {
      const audio = new Audio(previewAudioUrl);
      audioRef.current = audio;
      audio.play().catch(() => setState("open"));
      setState("listening");
      audio.addEventListener("ended", () => setState("open"), { once: true });
      audio.addEventListener("error", () => setState("open"), { once: true });
    } else {
      setState("open");
    }
  }

  return (
    <div
      className="w-[270px] shrink-0 flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "linear-gradient(180deg, #0e0d1a 0%, #0a0a12 100%)",
        border: `1px solid ${isOpen ? meta.doorBorder : "rgb(255 255 255 / 0.06)"}`,
        boxShadow: isOpen ? `0 0 32px -8px ${meta.glow}` : "none",
      }}
    >
      {/* Top accent line */}
      <div
        className="h-[3px] shrink-0"
        style={{ background: `linear-gradient(90deg, ${meta.accentFrom}, ${meta.accentTo})` }}
        aria-hidden
      />

      <RoomScene imageUrl={course.imageUrl} state={state} level={course.level} meta={meta} />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <span className={cn("text-[9px] font-bold uppercase tracking-[0.22em] px-2 py-0.5 rounded-full border", meta.badgeText, meta.badgeBg)}>
            {t(`levels.${course.level}`, { defaultValue: course.level })}
          </span>
          <XpBadge xp={estimatedXp} accentTo={meta.accentTo} />
        </div>

        {/* Title */}
        <div>
          <h3 className="font-display font-semibold text-white text-base leading-snug line-clamp-2 mb-1">
            {title}
          </h3>
          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{description}</p>
        </div>

        {/* Mechanic */}
        <div className="mt-auto">
          {state === "listening" && <ListeningPulse accentColor={meta.accentTo} />}
          {state === "locked" && (
            <button
              type="button"
              onClick={handleUnlock}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                background: `${meta.accentFrom}18`,
                border: `1px solid ${meta.accentFrom}40`,
                color: meta.accentTo,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 18v-2m0 0a6 6 0 1 0-6-6" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
              {previewAudioUrl ? "Listen to enter" : "Open room"}
            </button>
          )}
          {isOpen && (
            <Link
              href={`/course/${course.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-150"
              style={{ color: meta.accentTo }}
            >
              {state === "complete" ? "Revisit room" : "Enter room"}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </Link>
          )}
        </div>

        {/* Progress rail */}
        {(course.progress ?? 0) > 0 && (
          <div className="pt-3 border-t border-white/[0.04]">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-neutral-600 uppercase tracking-wider">Progress</span>
              <span className="font-bold text-neutral-500">{course.progress}%</span>
            </div>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgb(255 255 255 / 0.05)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${course.progress}%`, background: `linear-gradient(90deg, ${meta.accentFrom}, ${meta.accentTo})` }}
              />
            </div>
          </div>
        )}

        <p className="text-[10px] text-neutral-700 uppercase tracking-wider">
          {t("learn.totalLessons", { count: course.lessonsCount, defaultValue: `${course.lessonsCount} lessons` })}
        </p>
      </div>
    </div>
  );
}
