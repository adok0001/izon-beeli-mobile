"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  BookText,
  Brain,
  Clapperboard,
  FileText,
  FlipHorizontal2,
  LayoutDashboard,
  NotebookPen,
  Plus,
  Settings,
  Star,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;
};

type Group = {
  label: string;
  items: NavItem[];
};

export default function ExplorePage() {
  const { t } = useTranslation();

  const groups: Group[] = [
    {
      label: t("common.exploreSection"),
      items: [
        { href: "/culture",    label: t("tabs.culture"),           icon: Clapperboard,   color: "#fb923c" },
        { href: "/dictionary", label: t("dictionaryPage.title"),   icon: BookText,       color: "#38bdf8" },
        { href: "/bounties",   label: t("bounties.title"),         icon: Star,           color: "#C4862A" },
      ],
    },
    {
      label: t("common.practiceSection"),
      items: [
        { href: "/quiz",        label: t("quiz.title"),        icon: Brain,           color: "#a78bfa" },
        { href: "/word-review", label: t("wordReview.title"),  icon: FlipHorizontal2, color: "#34d399" },
        { href: "/leaderboard", label: t("leaderboard.title"), icon: Trophy,          color: "#fbbf24" },
      ],
    },
    {
      label: t("common.contributeSection"),
      items: [
        { href: "/contribute",       label: t("contribute.title"),      icon: Plus,     color: "#38bdf8" },
        { href: "/my-contributions", label: t("profile.myContributions"), icon: FileText, color: "#9A9480" },
      ],
    },
    {
      label: t("common.accountSection"),
      items: [
        { href: "/dashboard", label: t("profile.progressDashboard"), icon: LayoutDashboard, color: "#C4862A" },
        { href: "/classroom", label: t("profile.classroom"),         icon: Users,           color: "#38bdf8" },
        { href: "/settings",  label: t("settings.title"),            icon: Settings,        color: "#9A9480" },
        { href: "/profile",   label: t("tabs.profile"),              icon: UserRound,       color: "#a78bfa" },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#0D0F1A" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-5 pt-6 pb-4 border-b"
        style={{ backgroundColor: "#0D0F1A", borderColor: "#2E3245" }}
      >
        <h1 className="text-3xl font-black text-[#F7F2E8] tracking-tight leading-none">
          EXPLORE
        </h1>
        <p className="text-[9px] font-bold tracking-[0.3em] text-amber-600 mt-1 uppercase">
          Everything in one place
        </p>
        <div className="h-px mt-3 opacity-30" style={{ backgroundColor: "#C4862A" }} />
      </div>

      <div className="px-5 pt-6 space-y-8">
        {groups.map((group) => (
          <section key={group.label}>
            {/* Section label */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-amber-600" />
                <span className="text-[9px] font-black tracking-[0.2em] text-[#9A9480] uppercase">
                  {group.label}
                </span>
                <div className="w-1 h-1 rounded-full bg-amber-600" />
              </div>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-3">
              {group.items.map(({ href, label, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04] active:scale-95 transition-all text-center"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <span className="text-[11px] font-bold text-[#F7F2E8] leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
