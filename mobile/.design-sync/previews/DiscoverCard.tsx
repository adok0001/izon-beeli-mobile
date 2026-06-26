import React from "react";
import { DiscoverCard } from "izon-beeli-mobile";

const podcast = {
  id: "d1", type: "podcast", title: "Voices of the Delta",
  description: "An oral-history series on Ijaw storytelling and the rhythms of river life.",
  author: "Beeli Studio", publishedAt: "2026-05-01T00:00:00Z", duration: 1320,
  coverGradient: ["#a78bfa", "#7c3aed"] as [string, string], coverEmoji: "🎙️", featured: true,
};
const blog = {
  id: "d2", type: "blog", title: "Why tone matters in Izon",
  description: "A short read on how pitch shapes meaning across Niger Delta languages.",
  author: "A. Diri", publishedAt: "2026-04-12T00:00:00Z", duration: 240,
  coverGradient: ["#38bdf8", "#0ea5e9"] as [string, string], coverEmoji: "📖",
};

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, width: 420, boxSizing: "border-box" }}>{children}</div>
);

export function Featured() {
  return (
    <Panel>
      <DiscoverCard item={podcast} onStoryPress={() => {}} />
    </Panel>
  );
}

export function Compact() {
  return (
    <Panel>
      <DiscoverCard item={blog} onStoryPress={() => {}} compact />
    </Panel>
  );
}
