"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DISCOVER_TYPE_ICON, type DiscoverItem } from "../../culture-client";
import { Clapperboard } from "lucide-react";

function formatDuration(seconds: number) {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min read`;
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

const TYPE_CONFIG = {
  blog:    { color: "#38bdf8", label: "BLOG" },
  podcast: { color: "#a855f7", label: "PODCAST" },
  film:    { color: "#fb923c", label: "FILM" },
};

export default function ContentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: item, isLoading, isError } = useQuery<DiscoverItem>({
    queryKey: ["culture-items", id],
    queryFn: () => apiFetch<DiscoverItem>(`/culture-items/${id}`),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07080F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#07080F" }}>
        <Clapperboard className="w-12 h-12" strokeWidth={1.25} style={{ color: "#9A9480" }} />
        <p className="text-base font-bold" style={{ color: "#F7F2E8" }}>Content not found</p>
        <button
          onClick={() => router.push("/culture")}
          className="mt-2 px-5 py-2.5 rounded-full text-sm font-bold"
          style={{ background: "rgba(196,134,42,0.15)", border: "1px solid rgba(196,134,42,0.4)", color: "#C4862A" }}
        >
          ← Return to Culture
        </button>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[item.type];
  const Icon = DISCOVER_TYPE_ICON[item.type];
  const date = new Date(item.publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bodyText = item.body ?? item.showNotes ?? item.description;
  const paragraphs = bodyText.split("\n\n").filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: "#07080F" }}>
      {/* Back button */}
      <button
        onClick={() => router.push("/culture")}
        className="fixed top-6 left-5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150"
        style={{
          background: "rgba(13,15,26,0.6)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(247,242,232,0.7)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#F7F2E8")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(247,242,232,0.7)")}
      >
        ← Culture
      </button>

      {/* Hero */}
      <div
        className="relative h-48 flex items-end"
        style={{ background: `linear-gradient(135deg, ${item.coverGradient[0]}, ${item.coverGradient[1]})` }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent 30%, ${item.coverGradient[1]}ee)` }}
        />
        <span className="absolute inset-0 flex items-center justify-center opacity-[0.07] select-none pointer-events-none">
          <Icon className="w-24 h-24 text-neutral-50" strokeWidth={1.25} />
        </span>
        <div
          className="absolute top-4 left-5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black tracking-widest"
          style={{ backgroundColor: "rgba(7,7,15,0.7)", color: cfg.color, border: `1px solid ${cfg.color}40` }}
        >
          {cfg.label}
        </div>
        <div className="relative z-10 px-5 pb-5 w-full">
          <h1 className="text-xl font-black tracking-tight leading-snug mb-1" style={{ color: "#F7F2E8" }}>
            {item.title}
          </h1>
          <p className="text-[11px] font-semibold" style={{ color: "rgba(247,242,232,0.6)" }}>
            {item.author}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2" style={{ color: "#737373", fontSize: 11 }}>
        <span>{item.author}</span>
        <span style={{ color: "#404040" }}>·</span>
        <span>{date}</span>
        <span style={{ color: "#404040" }}>·</span>
        <span>{formatDuration(item.duration)}</span>
      </div>

      {/* Audio player */}
      {item.type === "podcast" && item.audioUrl && (
        <div className="mx-5 mt-3 mb-1 p-4 rounded-xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <p className="text-[9px] font-black tracking-widest mb-2" style={{ color: "#a855f7" }}>LISTEN</p>
          <audio
            controls
            src={item.audioUrl}
            className="w-full"
            style={{ accentColor: "#a855f7", height: 36 }}
          />
        </div>
      )}

      {/* Body */}
      <div className="px-5 md:px-10 max-w-3xl mx-auto pt-5 pb-4">
        {item.type === "film" && !item.scenes && !item.showNotes ? (
          <>
            <p className="mb-4 leading-[26px]" style={{ fontSize: 15, color: "#d4d4d4" }}>
              {item.description}
            </p>
            <p className="italic" style={{ fontSize: 14, color: "#737373" }}>
              Full film coming soon.
            </p>
          </>
        ) : (
          paragraphs.map((para, i) => (
            <p key={i} className="mb-5 leading-[26px]" style={{ fontSize: 15, color: "#d4d4d4" }}>
              {para}
            </p>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 md:px-10 max-w-3xl mx-auto pt-2 pb-20 flex flex-col items-start gap-4">
        {item.contentUrl && (
          <a
            href={item.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold transition-colors duration-150"
            style={{ color: "#C4862A", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#d4962e")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#C4862A")}
          >
            Also available on the web →
          </a>
        )}
        <button
          onClick={() => router.push("/culture")}
          className="px-6 py-3 rounded-full text-sm font-bold transition-colors duration-150"
          style={{ background: "rgba(196,134,42,0.15)", border: "1px solid rgba(196,134,42,0.4)", color: "#C4862A" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,134,42,0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,134,42,0.15)")}
        >
          ← Return to Culture
        </button>
      </div>
    </div>
  );
}
