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
    <div className="min-h-screen flex items-center justify-center bg-[#06060e] p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />

      {/* Warm ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-amber-900/[0.2] blur-[160px] animate-aurora" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-900/20 blur-[110px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-amber-800/[0.12] blur-[90px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex mb-5">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/25 blur-xl scale-150 animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-[0_0_52px_-12px_rgb(245_158_11_/0.7)]">
              <Languages className="h-8 w-8 text-white drop-shadow" />
              <div className="absolute inset-0 rounded-2xl shadow-inner-bright" />
            </div>
          </div>

          <h1 className="font-display font-bold text-4xl text-white tracking-tight">Beeli</h1>
          <p className="text-neutral-500 mt-2 text-sm font-medium">{t("auth.brandSubtitle")}</p>
        </div>

        {/* Auth card */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.09] shadow-lift">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="bg-white/[0.04] backdrop-blur-2xl px-6 py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
