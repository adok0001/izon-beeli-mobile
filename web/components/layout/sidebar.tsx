"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { UserMe } from "@/types";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart2,
    BookOpen,
    BookText,
    Brain,
    ClipboardList,
    FileText,
    FlipHorizontal2,
    Globe2,
    Headphones,
    LayoutDashboard,
    Languages,
    NotebookPen,
    Plus,
    Settings,
    ShieldCheck,
    Star,
    Trophy,
    UserRound,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const ADMIN_NAV = [
  { href: "/admin",         labelKey: "admin.nav.overview", icon: BarChart2,     exact: true },
  { href: "/admin/review",  labelKey: "admin.nav.review",   icon: ClipboardList, exact: false },
  { href: "/admin/users",   labelKey: "admin.nav.users",    icon: Users,         exact: false },
  { href: "/admin/courses", labelKey: "admin.nav.courses",  icon: BookOpen,      exact: false },
] as const;

const NAV_ITEMS = [
  { href: "/learn",   labelKey: "tabs.learn",   icon: BookOpen,    tourId: "nav-learn" },
  { href: "/listen",  labelKey: "tabs.listen",  icon: Headphones,  tourId: "nav-listen" },
  { href: "/journal", labelKey: "tabs.journal", icon: NotebookPen, tourId: "nav-journal" },
  { href: "/feed",    labelKey: "tabs.feed",    icon: Globe2,      tourId: "nav-feed" },
  { href: "/profile", labelKey: "tabs.profile", icon: UserRound,   tourId: "nav-profile" },
] as const;

const SECONDARY_GROUPS = [
  {
    labelKey: "common.practiceSection",
    items: [
      { href: "/quiz",        labelKey: "quiz.title",            icon: Brain,            tourId: "nav-quiz" },
      { href: "/word-review", labelKey: "wordReview.title",      icon: FlipHorizontal2,  tourId: undefined },
      { href: "/leaderboard", labelKey: "leaderboard.title",     icon: Trophy,           tourId: undefined },
    ],
  },
  {
    labelKey: "common.exploreSection",
    items: [
      { href: "/dictionary",  labelKey: "dictionaryPage.title",  icon: BookText,         tourId: undefined },
      { href: "/bounties",    labelKey: "bounties.title",        icon: Star,             tourId: undefined },
    ],
  },
  {
    labelKey: "common.contributeSection",
    items: [
      { href: "/contribute",        labelKey: "contribute.title",       icon: Plus,      tourId: undefined },
      { href: "/my-contributions",  labelKey: "myContributions.title",  icon: FileText,  tourId: undefined },
    ],
  },
  {
    labelKey: "common.accountSection",
    items: [
      { href: "/dashboard",  labelKey: "profile.progressDashboard", icon: LayoutDashboard, tourId: undefined },
      { href: "/classroom",  labelKey: "profile.classroom",         icon: Users,           tourId: undefined },
      { href: "/settings",   labelKey: "settings.title",            icon: Settings,        tourId: undefined },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { getToken, isSignedIn } = useAuth();

  const { data: me } = useQuery<UserMe>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<UserMe>("/users/me", { token: token ?? undefined });
    },
    enabled: !!isSignedIn,
  });

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <Link href="/learn" className="flex items-center gap-2">
          <Languages className="h-6 w-6 text-brand-700 dark:text-brand-400" />
          <span className="font-bold text-lg text-brand-700 dark:text-brand-400">Beeli</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {/* Primary */}
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

        {/* Secondary — grouped */}
        {SECONDARY_GROUPS.map((group) => (
          <div key={group.labelKey} className="pt-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1">
              {t(group.labelKey)}
            </p>
            {group.items.map(({ href, labelKey, icon: Icon, tourId }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  {...(tourId ? { "data-tour": tourId } : {})}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
          </div>
        ))}
      </nav>

      {/* Admin section */}
      {me?.isAdmin && (
        <div className="px-3 pb-3 border-t border-neutral-100 dark:border-neutral-800 pt-3">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-600 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            {t("admin.panelTitle")}
          </p>
          {ADMIN_NAV.map(({ href, labelKey, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(labelKey)}
              </Link>
            );
          })}
        </div>
      )}

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
