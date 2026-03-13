"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/learn", label: "Learn", icon: "📚" },
  { href: "/listen", label: "Listen", icon: "🎧" },
  { href: "/journal", label: "Journal", icon: "📓" },
  { href: "/feed", label: "Feed", icon: "🌍" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex">
      {NAV_ITEMS.map(({ href, label, icon }) => {
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
            <span className="text-xl leading-none">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
