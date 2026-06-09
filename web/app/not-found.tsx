import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 – Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070f] px-6 overflow-hidden">

      {/* Film grain */}
      <div aria-hidden className="grain-overlay" />

      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-amber-900/[0.14] blur-[160px]" />
      </div>

      {/* Fractal bg */}
      <svg aria-hidden className="pointer-events-none fixed inset-0 w-full h-full opacity-[0.02] select-none">
        <defs>
          <pattern id="tri404" x="0" y="0" width="80" height="69.28" patternUnits="userSpaceOnUse">
            <polygon points="40,0 80,69.28 0,69.28" fill="none" stroke="rgb(245,158,11)" strokeWidth="0.5" />
            <polygon points="0,0 40,69.28 80,0" fill="none" stroke="rgb(245,158,11)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tri404)" />
      </svg>

      <div className="relative text-center max-w-md">

        {/* Window chrome */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03]">
          <span className="w-2 h-2 rounded-full" style={{ background: "#ff5f56", opacity: 0.5 }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "#ffbd2e", opacity: 0.5 }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "#27c93f", opacity: 0.5 }} />
          <span className="font-mono text-[9px] text-neutral-600 tracking-wide ml-1">error.404 — not found</span>
        </div>

        {/* Large 404 */}
        <div
          className="font-display font-bold text-white/[0.04] select-none leading-none mb-0 pointer-events-none"
          style={{ fontSize: "clamp(8rem, 22vw, 14rem)" }}
          aria-hidden
        >
          404
        </div>

        {/* Waveform — 5 flat bars */}
        <div className="flex items-end justify-center gap-1 h-5 -mt-4 mb-6" aria-hidden>
          {[4, 8, 14, 8, 4].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-amber-500/50"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mb-5">
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-500/60">Page Not Found</span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white leading-snug mb-3">
          This page doesn&apos;t exist.
        </h1>
        <p className="font-display italic text-neutral-500 text-base mb-8">
          It may have been moved or the URL is incorrect.
        </p>

        <Link
          href="/learn"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all duration-200 shadow-[0_0_40px_-8px_rgb(245_158_11_/0.6)] hover:shadow-[0_0_60px_-8px_rgb(245_158_11_/0.8)]"
        >
          Go to Learn
        </Link>
      </div>
    </div>
  );
}
