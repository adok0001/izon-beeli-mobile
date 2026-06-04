"use client";

import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";
import { useRef, useState } from "react";

export interface PlacementZone {
  id: string;
  label: string;           // exact native word that belongs here
  labelTranslation: string;
  x: number; y: number;    // % of image container
  width: number; height: number;
}

export interface WordToken {
  id: string;
  word: string;
  translation: string;
  audioUrl?: string;
}

interface WordPlacementQuizProps {
  imageUrl: string;
  imageAlt: string;
  zones: PlacementZone[];
  tokens: WordToken[];
  onComplete?: (correct: number, total: number) => void;
}

function playAudio(url: string) {
  new Audio(url).play().catch(() => {});
}

function TokenChip({
  token,
  isPlaced,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  token: WordToken;
  isPlaced: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={!isPlaced}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2 rounded-xl border select-none",
        "transition-all duration-200",
        isPlaced
          ? "opacity-20 pointer-events-none border-white/[0.05] bg-white/[0.02]"
          : isDragging
          ? "scale-95 opacity-60 border-blue-400/50 bg-blue-500/[0.08] cursor-grabbing"
          : "border-white/[0.12] bg-white/[0.04] hover:border-white/[0.22] hover:bg-white/[0.07] cursor-grab"
      )}
    >
      <span className="text-sm font-bold text-white/90">{token.word}</span>
      <span className="text-[10px] text-neutral-600">{token.translation}</span>
      {token.audioUrl && !isPlaced && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); playAudio(token.audioUrl!); }}
          aria-label={`Pronounce ${token.word}`}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Volume2 className="h-3 w-3 text-neutral-500 hover:text-neutral-300 transition-colors" />
        </button>
      )}
    </div>
  );
}

function DropZoneOverlay({
  zone,
  isCorrect,
  isHovered,
  isShaking,
  placedToken,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  zone: PlacementZone;
  isCorrect: boolean;
  isHovered: boolean;
  isShaking: boolean;
  placedToken: WordToken | undefined;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      className={cn(
        "absolute rounded-lg border transition-all duration-200",
        isCorrect
          ? "border-emerald-400/60 bg-emerald-500/[0.18]"
          : isHovered
          ? "border-blue-400/50 bg-blue-500/[0.12]"
          : "border-white/10 bg-white/[0.03]"
      )}
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        boxShadow: isCorrect ? "0 0 18px -4px rgba(52,211,153,0.5)" : "none",
        animation: isShaking ? "beeli-shake 0.45s ease" : "none",
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {isCorrect && placedToken ? (
          <span
            className="text-xs font-bold text-emerald-300 px-2 py-1 rounded-md text-center"
            style={{
              background: "rgba(4,8,18,0.88)",
              textShadow: "0 0 10px rgba(52,211,153,0.7)",
              maxWidth: "90%",
            }}
          >
            {placedToken.word}
          </span>
        ) : (
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest text-center px-1">
            {zone.labelTranslation}
          </span>
        )}
      </div>
    </div>
  );
}

export function WordPlacementQuiz({
  imageUrl,
  imageAlt,
  zones,
  tokens,
  onComplete,
}: WordPlacementQuizProps) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const [correctZones, setCorrectZones] = useState<Set<string>>(new Set());
  const celebratedRef = useRef(false);

  const placedTokenIds = new Set(Object.values(placements));

  function handleDrop(zoneId: string) {
    if (!dragging) return;
    const zone = zones.find((z) => z.id === zoneId);
    const token = tokens.find((t) => t.id === dragging);
    if (!zone || !token) return;

    setHovered(null);

    if (token.word === zone.label) {
      const nextPlacements = { ...placements, [zoneId]: dragging };
      const nextCorrect = new Set([...correctZones, zoneId]);
      setPlacements(nextPlacements);
      setCorrectZones(nextCorrect);
      if (token.audioUrl) playAudio(token.audioUrl);
      if (!celebratedRef.current && nextCorrect.size === zones.length) {
        celebratedRef.current = true;
        onComplete?.(nextCorrect.size, zones.length);
      }
    } else {
      setShaking(zoneId);
      setTimeout(() => setShaking(null), 500);
    }
    setDragging(null);
  }

  const isComplete = correctZones.size === zones.length && zones.length > 0;

  return (
    <>
      <style>{`
        @keyframes beeli-shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
      `}</style>

      <div
        className="rounded-2xl overflow-hidden border border-white/[0.07]"
        style={{ background: "#05060e" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-white/[0.05]">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-600">
            Word Placement
          </span>
          <div className="flex-1 h-px bg-white/[0.04]" />
          <span className="text-[9px] font-mono tabular-nums text-neutral-700">
            {correctZones.size} / {zones.length}
          </span>
        </div>

        {/* Scene with drop zones */}
        <div
          className="relative mx-4 mt-4 rounded-xl overflow-hidden"
          style={{ aspectRatio: "16/9" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />

          {zones.map((zone) => (
            <DropZoneOverlay
              key={zone.id}
              zone={zone}
              isCorrect={correctZones.has(zone.id)}
              isHovered={hovered === zone.id && !correctZones.has(zone.id)}
              isShaking={shaking === zone.id}
              placedToken={placements[zone.id] ? tokens.find((t) => t.id === placements[zone.id]) : undefined}
              onDragOver={() => setHovered(zone.id)}
              onDragLeave={() => setHovered(null)}
              onDrop={() => handleDrop(zone.id)}
            />
          ))}
        </div>

        <p className="text-[11px] text-neutral-600 text-center mt-3 font-mono px-4">
          Drag each word token onto its matching element in the scene
        </p>

        {/* Token tray */}
        <div className="flex flex-wrap gap-2 justify-center p-4">
          {tokens.map((token) => (
            <TokenChip
              key={token.id}
              token={token}
              isPlaced={placedTokenIds.has(token.id)}
              isDragging={dragging === token.id}
              onDragStart={() => setDragging(token.id)}
              onDragEnd={() => setDragging(null)}
            />
          ))}
        </div>

        {/* Completion banner */}
        <div
          className={cn(
            "mx-4 mb-4 p-4 rounded-xl border text-center transition-all duration-500",
            isComplete
              ? "opacity-100 border-emerald-500/30 bg-emerald-500/[0.07]"
              : "opacity-0 pointer-events-none border-transparent"
          )}
        >
          <p className="text-sm font-semibold text-emerald-300">Scene complete</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">All words placed correctly</p>
        </div>
      </div>
    </>
  );
}
