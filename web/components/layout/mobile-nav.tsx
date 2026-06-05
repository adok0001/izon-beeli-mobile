"use client";

import { cn } from "@/lib/utils";
import {
    BookOpen,
    Compass,
    Globe2,
    NotebookPen,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const NAV_ITEMS = [
  { href: "/learn", labelKey: "tabs.learn", icon: BookOpen, tourId: "nav-learn" },
  { href: "/listen", labelKey: "tabs.practice", icon: Sparkles, tourId: "nav-listen" },
  { href: "/journal", labelKey: "tabs.journal", icon: NotebookPen, tourId: "nav-journal" },
  { href: "/feed", labelKey: "tabs.feed", icon: Globe2, tourId: "nav-feed" },
  { href: "/explore", labelKey: "common.exploreSection", icon: Compass, tourId: "nav-explore" },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/88 dark:bg-neutral-950/92 backdrop-blur-2xl backdrop-saturate-200 border-t border-neutral-200/50 dark:border-white/[0.07] flex">
      {NAV_ITEMS.map(({ href, labelKey, icon: Icon, tourId }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            data-tour={tourId}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-semibold transition-all duration-150",
              active
                ? "text-amber-600 dark:text-amber-400"
                : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
            )}
          >
            <div
              className={cn(
                "w-10 h-7 rounded-full flex items-center justify-center transition-all duration-150",
                active
                  ? "bg-amber-500/[0.12] dark:bg-amber-500/[0.18] shadow-[0_0_14px_-4px_rgb(245_158_11_/0.4)]"
                  : ""
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] transition-transform duration-150", active && "scale-110")} />
            </div>
            <span className="leading-none">{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
