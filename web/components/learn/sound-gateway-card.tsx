"use client";

import { cn } from "@/lib/utils";
import { localizeField } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";
import { ArrowRight, MapPin, Volume2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ── Level palette ─────────────────────────────────────────────

const LEVEL_META: Record<string, { bar: string; badge: string; stripe: string }> = {
  beginner:     { bar: "from-emerald-500 to-emerald-400", badge: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", stripe: "bg-emerald-500" },
  intermediate: { bar: "from-blue-500 to-blue-400",       badge: "text-blue-400 border-blue-500/30 bg-blue-500/10",         stripe: "bg-blue-500"    },
  advanced:     { bar: "from-violet-500 to-violet-400",   badge: "text-violet-400 border-violet-500/30 bg-violet-500/10",   stripe: "bg-violet-500"  },
};

// ── Gateway states ────────────────────────────────────────────

type GatewayState = "locked" | "listening" | "unlocked" | "complete";

function deriveInitialState(course: Course): GatewayState {
  if (course.progress === 100) return "complete";
  if ((course.progress ?? 0) > 0) return "unlocked";
  return "locked";
}

// ── Stamp illustration ────────────────────────────────────────
// Top third of the card: course image or a textured gradient placeholder.

function StampArea({ imageUrl, state, level }: Readonly<{ imageUrl?: string; state: GatewayState; level: string }>) {
  const gradients: Record<string, string> = {
    beginner:     "from-emerald-950 via-emerald-900 to-neutral-900",
    intermediate: "from-blue-950 via-blue-900 to-neutral-900",
    advanced:     "from-violet-950 via-violet-900 to-neutral-900",
  };
  const gradient = gradients[level] ?? "from-neutral-900 to-neutral-800";

  return (
    <div className={cn("relative h-28 overflow-hidden", imageUrl ? "" : `bg-gradient-to-br ${gradient}`)}>
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill className="object-cover" sizes="256px" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <MapPin className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
      )}

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      {/* Sepia tint when locked */}
      {state === "locked" && (
        <div className="absolute inset-0 bg-neutral-950/60 mix-blend-color" />
      )}

      {/* Completed stamp */}
      {state === "complete" && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-sm">
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Complete</span>
        </div>
      )}

      {/* Bottom fade to card */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#0d0d18] to-transparent" />
    </div>
  );
}

// ── Unlock button ─────────────────────────────────────────────

function UnlockButton({ state, hasAudio, onClick }: Readonly<{ state: GatewayState; hasAudio: boolean; onClick: () => void }>) {
  if (state !== "locked") return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50 transition-all duration-200 text-xs font-semibold text-amber-400 hover:text-amber-300"
    >
      <Volume2 className={cn("h-3 w-3 shrink-0", !hasAudio && "opacity-50")} />
      {hasAudio ? "Listen to unlock" : "Unlock gateway"}
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:animate-ping" />
    </button>
  );
}

// ── Pulsing ring (while audio plays) ─────────────────────────

function ListeningRing() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <span className="text-xs font-semibold text-amber-400 tracking-wide">Listening…</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

interface SoundGatewayCardProps {
  course: Course;
  previewAudioUrl?: string;
}

export function SoundGatewayCard({ course, previewAudioUrl }: Readonly<SoundGatewayCardProps>) {
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<GatewayState>(deriveInitialState(course));

  const meta = LEVEL_META[course.level] ?? LEVEL_META.beginner;
  const title = localizeField(course.title, course.titleFr, uiLanguage);
  const description = localizeField(course.description, course.descriptionFr, uiLanguage);

  function handleUnlock() {
    if (previewAudioUrl) {
      const audio = new Audio(previewAudioUrl);
      audioRef.current = audio;
      audio.play().catch(() => setState("unlocked")); // graceful fallback
      setState("listening");
      audio.addEventListener("ended", () => setState("unlocked"), { once: true });
      audio.addEventListener("error", () => setState("unlocked"), { once: true });
    } else {
      // No preview clip yet — unlock immediately
      setState("unlocked");
    }
  }

  const isUnlocked = state === "unlocked" || state === "complete";

  return (
    <div
      className={cn(
        "w-64 shrink-0 group relative rounded-2xl overflow-hidden flex flex-col",
        "bg-[#0d0d18] border transition-all duration-300",
        isUnlocked
          ? "border-amber-500/30 shadow-[0_0_28px_-6px_rgb(245_158_11_/0.35)]"
          : "border-white/[0.06] hover:border-white/[0.12]",
      )}
    >
      {/* Level accent line */}
      <div className={`h-[3px] bg-gradient-to-r ${meta.bar} shrink-0`} />

      {/* Stamp illustration */}
      <StampArea imageUrl={course.imageUrl} state={state} level={course.level} />

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <span className={cn("self-start text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-0.5 rounded-full border mb-3", meta.badge)}>
          {t(`levels.${course.level}`, { defaultValue: course.level })}
        </span>

        <h3 className="font-display font-semibold text-white text-base leading-snug mb-1.5 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed flex-1">
          {description}
        </p>

        {/* Gateway mechanic */}
        <div className="mt-4">
          {state === "listening" && <ListeningRing />}
          <UnlockButton state={state} hasAudio={!!previewAudioUrl} onClick={handleUnlock} />

          {/* CTA — visible once unlocked */}
          {isUnlocked && (
            <Link
              href={`/course/${course.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wide transition-colors group-hover:gap-2"
            >
              {state === "complete" ? "Continue" : "Enter"} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Progress bar */}
        {(course.progress ?? 0) > 0 && (
          <div className="mt-3 pt-3 border-t border-white/[0.05]">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-neutral-500 uppercase tracking-wider">{t("learn.progress", { defaultValue: "Progress" })}</span>
              <span className="font-bold text-neutral-400">{course.progress}%</span>
            </div>
            <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-500", meta.bar)}
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Lesson count */}
        <p className="mt-2 text-[10px] text-neutral-600 uppercase tracking-wider">
          {t("learn.totalLessons", { count: course.lessonsCount, defaultValue: `${course.lessonsCount} lessons` })}
        </p>
      </div>
    </div>
  );
}
