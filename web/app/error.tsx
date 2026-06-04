"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06060e] px-6 overflow-hidden">

      {/* Film grain */}
      <div aria-hidden className="grain-overlay" />

      {/* Ambient glow — red-tinted for error state */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-red-900/[0.12] blur-[160px]" />
      </div>

      {/* Fractal bg */}
      <svg aria-hidden className="pointer-events-none fixed inset-0 w-full h-full opacity-[0.02] select-none">
        <defs>
          <pattern id="triErr" x="0" y="0" width="80" height="69.28" patternUnits="userSpaceOnUse">
            <polygon points="40,0 80,69.28 0,69.28" fill="none" stroke="rgb(245,158,11)" strokeWidth="0.5" />
            <polygon points="0,0 40,69.28 80,0" fill="none" stroke="rgb(245,158,11)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#triErr)" />
      </svg>

      <div className="relative text-center max-w-md">

        {/* Window chrome */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03]">
          <span className="w-2 h-2 rounded-full" style={{ background: "#ff5f56", opacity: 0.7 }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "#ffbd2e", opacity: 0.45 }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "#27c93f", opacity: 0.2 }} />
          <span className="font-mono text-[9px] text-neutral-600 tracking-wide ml-1">error.500 — unexpected</span>
        </div>

        {/* Flat waveform (interrupted) */}
        <div className="flex items-end justify-center gap-1 h-10 mb-6" aria-hidden>
          {[6, 12, 18, 10, 4, 2, 2, 2, 2, 2].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                height: `${h}px`,
                background: i < 5 ? "rgb(245 158 11 / 0.55)" : "rgb(255 255 255 / 0.06)",
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mb-5">
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-red-500/50">Signal Lost</span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white leading-snug mb-3">
          Something went wrong.
        </h1>
        <p className="font-display italic text-neutral-500 text-base mb-8">
          An unexpected error occurred. Please try again.
        </p>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_40px_-8px_rgb(245_158_11_/0.6)] hover:shadow-[0_0_60px_-8px_rgb(245_158_11_/0.8)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
