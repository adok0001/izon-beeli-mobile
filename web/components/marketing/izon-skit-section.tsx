"use client";

import { useState } from "react";
import Link from "next/link";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { SKITS, type SkitId } from "@/components/marketing/skit-registry";

// The skits are built around Bricolage Grotesque (display) + Hanken Grotesk (text).
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-skit-display",
  display: "swap",
});
const text = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-skit-text",
  display: "swap",
});

export function IzonSkitSection() {
  const [active, setActive] = useState<SkitId>("izon");
  const current = SKITS.find((s) => s.id === active) ?? SKITS[0];
  const Active = current.Component;

  return (
    <section className="relative py-28 px-6 border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-neutral-700 mb-4">
          The skits · 9:16
        </span>
        <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight max-w-2xl">
          Stories worth sharing
        </h2>
        <p className="mt-5 max-w-xl text-neutral-400 text-base sm:text-lg">{current.blurb}</p>

        {/* skit selector */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {SKITS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              aria-pressed={s.id === active}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                s.id === active
                  ? "bg-amber-500 text-neutral-950"
                  : "bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 9:16 phone-shaped frame; the skit's Stage scales to fill it. */}
        <div
          key={current.id}
          className={`${display.variable} ${text.variable} relative mt-12 w-full max-w-[340px] aspect-[9/16] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl`}
          style={{ background: "#0a0a0a" }}
        >
          <Active />
        </div>

        <Link
          href={`/skits/${current.id}`}
          className="mt-6 text-sm font-medium text-amber-500 hover:text-amber-400"
        >
          Open full screen ↗
        </Link>
      </div>
    </section>
  );
}

export default IzonSkitSection;
