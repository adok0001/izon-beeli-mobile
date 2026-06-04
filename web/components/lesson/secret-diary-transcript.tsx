"use client";

import { apiFetch } from "@/lib/api";
import { cn, formatDuration } from "@/lib/utils";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { TranscriptSegment } from "@/types";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PhoneticBounceBar } from "./phonetic-bounce-bar";

// ── Types ─────────────────────────────────────────────────────

interface DictionaryEntry {
  id: string; word: string; english: string; french?: string | null;
  pronunciation?: string | null; example?: string | null; imageUrl?: string | null;
}

// ── Word popup ────────────────────────────────────────────────

function WordPopup({ word, languageId, onClose }: Readonly<{ word: string; languageId: string; onClose: () => void }>) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const { data, isLoading } = useQuery<DictionaryEntry[]>({
    queryKey: ["dict-lookup", word.toLowerCase(), languageId],
    queryFn: () => apiFetch<DictionaryEntry[]>(`/dictionary?languageId=${encodeURIComponent(languageId)}&search=${encodeURIComponent(word)}`),
    staleTime: 5 * 60 * 1000,
  });
  const match = data?.[0] ?? null;

  let content: ReactNode;
  if (isLoading) {
    content = <p className="text-xs text-amber-800/60">{t("common.loading")}</p>;
  } else if (match) {
    const def = uiLanguage === "fr" && match.french ? match.french : match.english;
    content = (
      <>
        {match.imageUrl && (
          <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden">
            <Image src={match.imageUrl} alt={match.word} fill className="object-cover" sizes="240px" />
          </div>
        )}
        <p className="font-semibold text-sm text-amber-950">{match.word}</p>
        {match.pronunciation && <p className="text-xs text-amber-700/60 italic mb-1">{match.pronunciation}</p>}
        <p className="text-sm text-amber-800">{def}</p>
        {match.example && <p className="text-xs text-amber-700/50 mt-1 italic">{match.example}</p>}
      </>
    );
  } else {
    content = <p className="text-xs text-amber-800/50">{t("lesson.wordNotFound")}</p>;
  }

  return (
    <span
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-48 max-w-60 rounded-xl p-3 text-left"
      style={{
        background: "linear-gradient(160deg, #fef3c7, #fde68a)",
        border: "1px solid rgb(180 120 40 / 0.25)",
        boxShadow: "0 8px 32px rgb(120 80 20 / 0.2), 0 2px 8px rgb(0 0 0 / 0.12)",
      }}
      role="tooltip"
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-amber-600/50 hover:text-amber-800 text-xs">✕</button>
      {content}
    </span>
  );
}

// ── Clickable word ────────────────────────────────────────────

function ClickableWord({ word, languageId, isActive }: Readonly<{ word: string; languageId: string; isActive: boolean }>) {
  const [open, setOpen] = useState(false);
  const clean = word.replaceAll(/[.,!?;:“”‘’]/g, "");
  if (!clean.trim()) return <span>{word} </span>;
  return (
    <span className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={cn(
          "underline decoration-dotted underline-offset-2 cursor-pointer rounded px-0.5 transition-colors",
          isActive
            ? "text-amber-950 decoration-amber-600 font-semibold"
            : "text-amber-900/80 decoration-amber-700/40 hover:bg-amber-200/40",
        )}
      >{word}</button>{" "}
      {open && <WordPopup word={clean} languageId={languageId} onClose={() => setOpen(false)} />}
    </span>
  );
}

// ── Segment row ───────────────────────────────────────────────

function DiarySegment({ seg, index, isActive, languageId, onSegmentClick, isPlaying, position, segRef }: Readonly<{
  seg: TranscriptSegment; index: number; isActive: boolean; languageId: string;
  onSegmentClick: (t: number) => void; isPlaying: boolean; position: number;
  segRef: (el: HTMLButtonElement | null) => void;
}>) {
  const { uiLanguage } = useUiLanguageStore();
  const translation = uiLanguage === "fr" && seg.translationFr ? seg.translationFr : seg.translation;

  return (
    <button
      ref={segRef}
      onClick={() => onSegmentClick(seg.startTime)}
      className={cn(
        "w-full text-left px-5 py-3 border-l-[3px] transition-all duration-200 relative",
        isActive
          ? "border-l-amber-500"
          : "border-l-transparent hover:bg-amber-950/[0.03]",
      )}
      style={isActive ? {
        background: "linear-gradient(90deg, rgb(251 191 36 / 0.08), transparent 80%)",
      } : undefined}
      aria-label={`Jump to ${formatDuration(seg.startTime)}`}
    >
      {isActive && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
          style={{ background: "linear-gradient(to bottom, rgb(245 158 11), rgb(180 83 9))", boxShadow: "2px 0 8px rgb(245 158 11 / 0.4)" }}
          aria-hidden
        />
      )}
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 text-[11px] font-mono text-amber-800/40 select-none">
          {formatDuration(seg.startTime)}
        </span>
        <div className="flex-1">
          <p className={cn("text-sm leading-relaxed flex flex-wrap", isActive ? "text-amber-950" : "text-amber-900/75")}>
            {seg.text.split(" ").map((word, wi) => (
              <ClickableWord key={`${seg.id}-${wi}`} word={word} languageId={languageId} isActive={isActive} />
            ))}
          </p>
          {translation && (
            <p className={cn("mt-0.5 text-xs italic", isActive ? "text-amber-700" : "text-amber-800/40")}>{translation}</p>
          )}
          {isActive && (
            <PhoneticBounceBar text={seg.text} isPlaying={isPlaying} startTime={seg.startTime} endTime={seg.endTime} position={position} />
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────

interface Props {
  segments: TranscriptSegment[];
  position: number;
  languageId: string;
  onSegmentClick: (t: number) => void;
  isPlaying: boolean;
}

export function SecretDiaryTranscript({ segments, position, languageId, onSegmentClick, isPlaying }: Readonly<Props>) {
  const { t } = useTranslation();
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = segments.findIndex((seg) => position >= seg.startTime && position < seg.endTime);

  useEffect(() => {
    segmentRefs.current[activeIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  if (segments.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-amber-800/40">{t("lesson.noTranscript")}</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto flex-1 relative"
      style={{
        background: "linear-gradient(160deg, #fdf6e3 0%, #fef9ec 50%, #fdf3d4 100%)",
        backgroundImage: [
          "linear-gradient(160deg, #fdf6e3 0%, #fef9ec 50%, #fdf3d4 100%)",
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
        ].join(", "),
        borderTop: "1px solid rgb(180 130 60 / 0.12)",
      }}
    >
      {/* Faint ruled lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, rgb(180 130 60 / 0.07) 32px)",
          backgroundPositionY: "8px",
        }}
        aria-hidden
      />

      {segments.map((seg, i) => (
        <DiarySegment
          key={seg.id}
          seg={seg}
          index={i}
          isActive={i === activeIndex}
          languageId={languageId}
          onSegmentClick={onSegmentClick}
          isPlaying={isPlaying}
          position={position}
          segRef={(el) => { segmentRefs.current[i] = el; }}
        />
      ))}
      <div className="h-24" />
    </div>
  );
}
