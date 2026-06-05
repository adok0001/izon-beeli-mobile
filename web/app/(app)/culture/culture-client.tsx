"use client";

import { useState } from "react";

type DiscoverItem = {
  id: string;
  type: "film" | "podcast" | "blog";
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  duration: number;
  coverGradient: [string, string];
  coverEmoji: string;
  featured: boolean;
  storyId?: string;
  audioUrl?: string;
  contentUrl?: string;
};

type DiscoverFilter = "all" | "blog" | "podcast" | "film";

const ITEMS: DiscoverItem[] = [
  {
    id: "film-001",
    type: "film",
    title: "The Griot's Path",
    description:
      "A living archive — follow an apprentice Griot across three countries as he memorises centuries of oral history in a single month.",
    author: "Sahel Stories",
    publishedAt: "2025-10-05T12:00:00Z",
    duration: 1740,
    coverGradient: ["#7C3A1A", "#0D0F1A"],
    coverEmoji: "🥁",
    featured: true,
    storyId: "griot-path",
  },
  {
    id: "podcast-001",
    type: "podcast",
    title: "Ep. 12 — Learning Izon as a Diaspora Kid",
    description:
      "Our guest grew up in London and reconnected with Izon at 28. She shares the emotional and linguistic journey of reclaiming a mother tongue.",
    author: "Beeli Conversations",
    publishedAt: "2025-11-01T06:00:00Z",
    duration: 2520,
    coverGradient: ["#3B1F6E", "#0D0F1A"],
    coverEmoji: "🎙️",
    featured: true,
    audioUrl: "https://cdn.beeli.app/podcast/ep-12.mp3",
    contentUrl: "https://beeli.app/podcast/ep-12",
  },
  {
    id: "film-002",
    type: "film",
    title: "Writing Systems of Africa",
    description:
      "From Ge'ez to Nsibidi to N'Ko — Africa's indigenous scripts are among the world's most underappreciated achievements. A visual survey.",
    author: "Pan-African Media Lab",
    publishedAt: "2025-08-12T12:00:00Z",
    duration: 1980,
    coverGradient: ["#1A3A2E", "#0D0F1A"],
    coverEmoji: "✍️",
    featured: true,
    storyId: "naming-ceremony",
    contentUrl: "https://beeli.app/film/writing-systems",
  },
  {
    id: "blog-001",
    type: "blog",
    title: "Why Tonal Languages Are Easier Than You Think",
    description:
      "Most learners fear tones. A simple reframe turns them from obstacles into superpowers. We break down the logic with three Izon examples.",
    author: "Amara Nwosu",
    publishedAt: "2025-11-10T08:00:00Z",
    duration: 360,
    coverGradient: ["#0F2A4A", "#0D0F1A"],
    coverEmoji: "🗣️",
    featured: false,
    contentUrl: "https://beeli.app/blog/tonal-languages",
  },
  {
    id: "podcast-002",
    type: "podcast",
    title: "Ep. 11 — The Science of Language Revival",
    description:
      "Linguist Dr. Ifunanya Obi explains why endangered language programmes succeed or fail, and what the data says about African language apps.",
    author: "Beeli Conversations",
    publishedAt: "2025-10-15T06:00:00Z",
    duration: 3060,
    coverGradient: ["#3B1F6E", "#0D0F1A"],
    coverEmoji: "🔬",
    featured: false,
    audioUrl: "https://cdn.beeli.app/podcast/ep-11.mp3",
    contentUrl: "https://beeli.app/podcast/ep-11",
  },
  {
    id: "blog-002",
    type: "blog",
    title: "The Oral Tradition: Why Stories Matter",
    description:
      "For millennia, African languages were transmitted orally. Here's how you can harness that same tradition to accelerate your fluency.",
    author: "Chibuike Eze",
    publishedAt: "2025-10-22T09:30:00Z",
    duration: 480,
    coverGradient: ["#2A1F0F", "#0D0F1A"],
    coverEmoji: "📖",
    featured: false,
    contentUrl: "https://beeli.app/blog/oral-tradition",
  },
  {
    id: "podcast-003",
    type: "podcast",
    title: "Ep. 10 — Twi in the Modern Workplace",
    description:
      "Three professionals share how speaking Twi transformed their careers and sense of identity inside corporate Accra.",
    author: "Beeli Conversations",
    publishedAt: "2025-09-28T06:00:00Z",
    duration: 2160,
    coverGradient: ["#3B1F6E", "#0D0F1A"],
    coverEmoji: "💼",
    featured: false,
    audioUrl: "https://cdn.beeli.app/podcast/ep-10.mp3",
    contentUrl: "https://beeli.app/podcast/ep-10",
  },
  {
    id: "blog-003",
    type: "blog",
    title: "5 Phrases Every Izon Learner Should Know First",
    description:
      "Greetings open doors. Before vocabulary lists, master these five phrases and watch how native speakers respond differently.",
    author: "Beeli Editorial",
    publishedAt: "2025-11-18T07:00:00Z",
    duration: 240,
    coverGradient: ["#0F2A4A", "#0D0F1A"],
    coverEmoji: "👋",
    featured: false,
    contentUrl: "https://beeli.app/blog/5-phrases",
  },
];

const TYPE_CONFIG = {
  blog:    { color: "#38bdf8", label: "BLOG",    cta: "Read Article" },
  podcast: { color: "#a78bfa", label: "PODCAST", cta: "Listen" },
  film:    { color: "#fb923c", label: "FILM",    cta: "Watch" },
};

function formatDuration(seconds: number) {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

function HeroCard({ item }: { item: DiscoverItem }) {
  const cfg = TYPE_CONFIG[item.type];
  const href = item.contentUrl ?? "#";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden mb-6 group"
      style={{ textDecoration: "none" }}
    >
      <div
        className="relative h-60 flex items-end"
        style={{ background: `linear-gradient(135deg, ${item.coverGradient[0]}, ${item.coverGradient[1]})` }}
      >
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent 30%, ${item.coverGradient[1]}dd)` }}
        />
        {/* Background emoji */}
        <span className="absolute inset-0 flex items-center justify-center text-8xl opacity-[0.07] select-none pointer-events-none">
          {item.coverEmoji}
        </span>
        {/* Type badge */}
        <div
          className="absolute top-4 left-5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black tracking-widest"
          style={{ backgroundColor: "rgba(13,15,26,0.7)", color: cfg.color, border: `1px solid ${cfg.color}40` }}
        >
          {cfg.label}
        </div>
        {/* Content */}
        <div className="relative z-10 p-5 w-full">
          <h2 className="text-xl font-black text-[#F7F2E8] tracking-tight leading-snug mb-1.5 group-hover:text-amber-200 transition-colors line-clamp-2">
            {item.title}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#F7F2E8]/60 font-semibold">{item.author}</span>
            <span className="text-[#F7F2E8]/30 text-xs">·</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${cfg.color}25`, color: cfg.color }}
            >
              {cfg.cta}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function ContentCard({ item }: { item: DiscoverItem }) {
  const cfg = TYPE_CONFIG[item.type];
  const href = item.contentUrl ?? "#";
  const date = new Date(item.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all group"
      style={{ textDecoration: "none", borderLeftWidth: 3, borderLeftColor: cfg.color }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
        style={{ background: `linear-gradient(135deg, ${item.coverGradient[0]}, ${item.coverGradient[1]})` }}
      >
        {item.coverEmoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
          <span className="text-[#9A9480] text-[10px]">· {formatDuration(item.duration)}</span>
        </div>
        <h3 className="text-sm font-bold text-[#F7F2E8] leading-snug group-hover:text-amber-200 transition-colors line-clamp-2 mb-1">
          {item.title}
        </h3>
        <p className="text-[11px] text-[#9A9480] line-clamp-2">{item.description}</p>
        <div className="mt-1.5 text-[10px] text-[#9A9480]/70">{item.author} · {date}</div>
      </div>
    </a>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-1">
      <div className="flex-1 h-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-amber-600" />
        <span className="text-[9px] font-black tracking-[0.2em] text-[#9A9480] uppercase">{label}</span>
        <div className="w-1 h-1 rounded-full bg-amber-600" />
      </div>
      <div className="flex-1 h-px bg-white/[0.08]" />
    </div>
  );
}

const FILTERS: { id: DiscoverFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blog", label: "Blog" },
  { id: "podcast", label: "Podcast" },
  { id: "film", label: "Film" },
];

export function CulturePage() {
  const [filter, setFilter] = useState<DiscoverFilter>("all");

  const filtered = filter === "all" ? ITEMS : ITEMS.filter((i) => i.type === filter);
  const featured = filtered.filter((i) => i.featured);
  const rest = filtered.filter((i) => !i.featured);
  const hero = featured[0];
  const featuredStrip = featured.slice(1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0D0F1A" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-5 md:px-10 pt-6 pb-4 border-b"
        style={{ backgroundColor: "#0D0F1A", borderColor: "#2E3245" }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-[9px] font-bold tracking-[0.3em] text-amber-600 uppercase mb-1">
            Beeli Media
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-[#F7F2E8] tracking-tight leading-none">
            CULTURE
          </h1>
          <p className="text-sm text-[#9A9480] mt-1.5">
            Essays, conversations, and films from inside the world of African languages.
          </p>
          <div className="h-px mt-3 mb-4 opacity-30" style={{ backgroundColor: "#C4862A" }} />
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((opt) => {
              const active = filter === opt.id;
              const color = opt.id === "blog" ? "#38bdf8" : opt.id === "podcast" ? "#a78bfa" : opt.id === "film" ? "#fb923c" : "#C4862A";
              return (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  className="rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all"
                  style={{
                    backgroundColor: active ? `${color}18` : "rgba(46,50,69,0.6)",
                    border: `1px solid ${active ? `${color}60` : "#2E3245"}`,
                    color: active ? color : "#9A9480",
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
      <div className="max-w-3xl mx-auto px-5 md:px-10 pt-6 pb-20">
        {hero && <HeroCard item={hero} />}

        {featuredStrip.length > 0 && (
          <div className="mb-6">
            <SectionRule label="Featured" />
            <div className="grid md:grid-cols-2 gap-3">
              {featuredStrip.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <SectionRule label="All Content" />
            <div className="grid md:grid-cols-2 gap-3">
              {rest.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="text-5xl mb-4">🎬</span>
            <p className="text-base font-bold text-[#F7F2E8] mb-1">Nothing here yet</p>
            <p className="text-sm text-[#9A9480]">Check back soon for new stories and films.</p>
          </div>
        )}
      </div>
    </div>
  );
}
