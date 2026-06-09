"use client";

import { useDiscover, type DiscoverFilter } from "@/lib/hooks/use-discover";
import type { DiscoverItem } from "@/types";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Film,
  Headphones,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GRAIN_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

type TypeConfig = {
  color: string;
  label: string;
  Icon: typeof BookOpen;
  cta: string;
};

const TYPE_CONFIG: Record<string, TypeConfig> = {
  blog:    { color: "#38bdf8", label: "BLOG",    Icon: BookOpen,   cta: "Read Article" },
  podcast: { color: "#a78bfa", label: "PODCAST", Icon: Headphones, cta: "Listen" },
  film:    { color: "#fb923c", label: "FILM",    Icon: Film,       cta: "Watch" },
};

const FILTER_OPTIONS: { id: DiscoverFilter; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "blog",    label: "Blog" },
  { id: "podcast", label: "Podcast" },
  { id: "film",    label: "Film" },
];

const FILTER_COLORS: Record<string, string> = {
  all:     "#C4862A",
  blog:    "#38bdf8",
  podcast: "#a78bfa",
  film:    "#fb923c",
};

function formatDur(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full" style={{ background: "#C4862A" }} />
        <span className="text-[9px] font-black tracking-[2.5px] uppercase" style={{ color: "#5A5570" }}>
          {label}
        </span>
        <div className="w-1 h-1 rounded-full" style={{ background: "#C4862A" }} />
      </div>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

function HeroCard({
  item,
  onStoryPress,
}: {
  item: DiscoverItem;
  onStoryPress: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.Icon;

  function handleClick() {
    if (item.type === "film" && item.storyId) {
      onStoryPress(item.storyId);
    } else if (item.contentUrl) {
      window.open(item.contentUrl, "_blank");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="group relative w-full rounded-2xl overflow-hidden text-left"
      style={{ minHeight: 240, background: item.coverGradient[0] }}
    >
      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: GRAIN_URI, opacity: 0.05 }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent 25%, ${item.coverGradient[0]}cc 65%, #0D0F1A 100%)`,
        }}
      />
      {/* Hover tint */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.025] transition-colors duration-300" />

      {/* Emoji bg */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[120px]" style={{ opacity: 0.07 }}>
          {item.coverEmoji}
        </span>
      </div>

      {/* Type badge */}
      <div
        className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{
          background: "rgba(13,15,26,0.7)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${cfg.color}40`,
        }}
      >
        <Icon className="h-2.5 w-2.5" style={{ color: cfg.color }} />
        <span className="text-[9px] font-black tracking-[1.5px]" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p
          className="text-[22px] font-black text-[#F7F2E8] tracking-tight leading-tight mb-2 group-hover:text-white transition-colors"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium" style={{ color: "rgba(247,242,232,0.6)" }}>
            {item.author}
          </span>
          <span style={{ color: "rgba(247,242,232,0.3)" }}>·</span>
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: `${cfg.color}25` }}
          >
            <span className="text-[10px] font-bold" style={{ color: cfg.color }}>
              {cfg.cta}
            </span>
            <ArrowRight className="h-2.5 w-2.5" style={{ color: cfg.color }} />
          </div>
        </div>
      </div>
    </button>
  );
}

function ContentCard({
  item,
  onStoryPress,
}: {
  item: DiscoverItem;
  onStoryPress: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[item.type];
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    if (item.type === "film" && item.storyId) {
      onStoryPress(item.storyId);
    } else if (item.contentUrl) {
      window.open(item.contentUrl, "_blank");
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group w-full flex gap-4 rounded-xl p-4 text-left transition-colors duration-150"
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Thumb */}
      <div
        className="shrink-0 w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center relative"
        style={{
          background: `linear-gradient(135deg, ${item.coverGradient[0]}, ${item.coverGradient[1]})`,
        }}
      >
        <span className="text-2xl">{item.coverEmoji}</span>
        {item.type === "film" && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Play className="h-4 w-4 fill-white text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1 h-1 rounded-full" style={{ background: cfg.color }} />
          <span
            className="text-[8px] font-black tracking-[2px] uppercase"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <p
          className="text-sm font-bold leading-snug line-clamp-2 mb-1.5 transition-colors"
          style={{ color: hovered ? "#fef3c7" : "#F7F2E8" }}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium truncate" style={{ color: "#5A5570" }}>
            {item.author}
          </span>
          <div className="flex items-center gap-1 shrink-0" style={{ color: "#4A4760" }}>
            <Clock className="h-2.5 w-2.5" />
            <span className="text-[10px]">{formatDur(item.duration)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function CulturePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>("all");
  const { featured, rest } = useDiscover(activeFilter);

  const handleStoryPress = (storyId: string) => router.push(`/culture/story/${storyId}`);

  return (
    <div className="min-h-screen" style={{ background: "#0D0F1A" }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 px-5 py-5 border-b"
        style={{
          background: "rgba(13,15,26,0.95)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(255,255,255,0.05)",
        }}
      >
        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: GRAIN_URI, opacity: 0.035 }}
        />
        <div className="relative max-w-4xl mx-auto">
          <h1
            className="font-black text-[#F7F2E8] leading-none"
            style={{ fontSize: 32, letterSpacing: -1 }}
          >
            CULTURE
          </h1>
          <p
            className="font-bold mt-1"
            style={{ fontSize: 9, letterSpacing: 3, color: "#C4862A" }}
          >
            STORIES · PODCASTS · FILM
          </p>
          <div className="h-px mt-3 mb-4" style={{ background: "rgba(196,134,42,0.22)" }} />

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.id;
              const col = FILTER_COLORS[opt.id] ?? "#C4862A";
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveFilter(opt.id)}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-150"
                  style={{
                    background: isActive ? `${col}18` : "rgba(46,50,69,0.5)",
                    border: `1px solid ${isActive ? col + "55" : "rgba(46,50,69,1)"}`,
                    color: isActive ? col : "#9A9480",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 pb-20 pt-6">
        {featured.length > 0 && (
          <section>
            <SectionLabel label="FEATURED" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              {featured.map((item) => (
                <HeroCard key={item.id} item={item} onStoryPress={handleStoryPress} />
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <SectionLabel label="ALL CONTENT" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rest.map((item) => (
                <ContentCard key={item.id} item={item} onStoryPress={handleStoryPress} />
              ))}
            </div>
          </section>
        )}

        {featured.length === 0 && rest.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="text-5xl mb-4">🎬</span>
            <p className="text-base font-bold mb-1" style={{ color: "#F7F2E8" }}>
              Nothing here yet
            </p>
            <p className="text-sm" style={{ color: "#5A5570" }}>
              Check back soon for new stories and films.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
