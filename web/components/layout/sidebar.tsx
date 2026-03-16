"use client";

import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import {
    BookOpen,
    BookText,
    Brain,
    Globe2,
    Headphones,
    Languages,
    LayoutDashboard,
    NotebookPen,
    Plus,
    Settings,
    Trophy,
    UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const NAV_ITEMS = [
  { href: "/learn", labelKey: "tabs.learn", icon: BookOpen, tourId: "nav-learn" },
  { href: "/listen", labelKey: "tabs.listen", icon: Headphones, tourId: "nav-listen" },
  { href: "/journal", labelKey: "tabs.journal", icon: NotebookPen, tourId: "nav-journal" },
  { href: "/feed", labelKey: "tabs.feed", icon: Globe2, tourId: "nav-feed" },
  { href: "/profile", labelKey: "tabs.profile", icon: UserRound, tourId: "nav-profile" },
] as const;

const SECONDARY_NAV = [
  { href: "/quiz", labelKey: "quiz.title", icon: Brain, tourId: "nav-quiz" },
  { href: "/dashboard", labelKey: "profile.progressDashboard", icon: LayoutDashboard, tourId: undefined },
  { href: "/leaderboard", labelKey: "leaderboard.title", icon: Trophy, tourId: undefined },
  { href: "/dictionary", labelKey: "dictionaryPage.title", icon: BookText, tourId: undefined },
  { href: "/contribute", labelKey: "contribute.title", icon: Plus, tourId: undefined },
  { href: "/settings", labelKey: "settings.title", icon: Settings, tourId: undefined },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <Link href="/learn" className="flex items-center gap-2">
          <Languages className="h-6 w-6 text-brand-700 dark:text-brand-400" />
          <span className="font-bold text-lg text-brand-700 dark:text-brand-400">
            Beeli
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon, tourId }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              data-tour={tourId}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </Link>
          );
        })}

        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            {t("common.more")}
          </p>
        </div>

        {SECONDARY_NAV.map(({ href, labelKey, icon: Icon, tourId }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              {...(tourId ? { "data-tour": tourId } : {})}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User account */}
      <div className="px-4 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
        <UserButton />
        <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
          {t("common.myAccount")}
        </span>
      </div>
    </aside>
  );
}
