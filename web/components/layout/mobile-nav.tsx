"use client";

import { cn } from "@/lib/utils";
import {
    BookOpen,
    Globe2,
    Headphones,
    NotebookPen,
    UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const NAV_ITEMS = [
  { href: "/learn", labelKey: "tabs.learn", icon: BookOpen },
  { href: "/listen", labelKey: "tabs.listen", icon: Headphones },
  { href: "/journal", labelKey: "tabs.journal", icon: NotebookPen },
  { href: "/feed", labelKey: "tabs.feed", icon: Globe2 },
  { href: "/profile", labelKey: "tabs.profile", icon: UserRound },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex">
      {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors",
              active
                ? "text-brand-600 dark:text-brand-400"
                : "text-neutral-400 dark:text-neutral-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
