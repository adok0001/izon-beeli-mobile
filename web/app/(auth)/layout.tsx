"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05050c] p-4 relative overflow-hidden">
      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-100" />

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-brand-900/30 blur-[140px] animate-aurora" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-brand-900/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-indigo-900/15 blur-[90px]" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-purple-800/10 blur-[70px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Brand header */}
        <div className="text-center mb-8">
          {/* Icon with aurora ring */}
          <div className="relative inline-flex mb-5">
            <div className="absolute inset-0 rounded-2xl bg-brand-500/30 blur-xl scale-150 animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-800 flex items-center justify-center shadow-glow-lg">
              <Languages className="h-8 w-8 text-white drop-shadow" />
              <div className="absolute inset-0 rounded-2xl shadow-inner-bright" />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight">Beeli (Aurufie)</h1>
          <p className="text-neutral-500 mt-2 text-sm font-medium">{t("auth.brandSubtitle")}</p>
        </div>

        {/* Auth card — glass */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.09] shadow-lift">
          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
          <div className="bg-white/[0.04] backdrop-blur-2xl px-6 py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
