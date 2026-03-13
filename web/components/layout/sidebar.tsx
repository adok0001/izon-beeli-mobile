"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/learn", label: "Learn", icon: "📚", tourId: "nav-learn" },
  { href: "/listen", label: "Listen", icon: "🎧", tourId: "nav-listen" },
  { href: "/journal", label: "Journal", icon: "📓", tourId: "nav-journal" },
  { href: "/feed", label: "Community", icon: "🌍", tourId: "nav-feed" },
  { href: "/profile", label: "Profile", icon: "👤", tourId: "nav-profile" },
] as const;

const SECONDARY_NAV = [
  { href: "/quiz", label: "Quiz", icon: "🧠", tourId: "nav-quiz" },
  { href: "/dictionary", label: "Dictionary", icon: "📖", tourId: undefined },
  { href: "/settings", label: "Settings", icon: "⚙️", tourId: undefined },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <Link href="/learn" className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <span className="font-bold text-lg text-brand-700 dark:text-brand-400">
            Izon Beeli
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon, tourId }) => {
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
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}

        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            More
          </p>
        </div>

        {SECONDARY_NAV.map(({ href, label, icon, tourId }) => {
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
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User account */}
      <div className="px-4 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
        <UserButton afterSignOutUrl="/sign-in" />
        <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
          My Account
        </span>
      </div>
    </aside>
  );
}
