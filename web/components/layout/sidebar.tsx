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
    Clapperboard,
    ClipboardList,
    FileText,
    FlipHorizontal2,
    Globe2,
    GraduationCap,
    Languages,
    LayoutDashboard,
    NotebookPen,
    Plus,
    Settings,
    ShieldCheck,
    Sparkles,
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

const EDUCATOR_NAV = [
  { href: "/educator",            labelKey: "educator.nav.overview",   icon: LayoutDashboard, exact: true },
  { href: "/educator/review",     labelKey: "educator.nav.review",     icon: ClipboardList,   exact: false },
  { href: "/educator/dictionary", labelKey: "educator.nav.dictionary", icon: BookText,        exact: false },
] as const;

const NAV_ITEMS = [
  { href: "/learn",   labelKey: "tabs.learn",   icon: BookOpen,    tourId: "nav-learn" },
  { href: "/listen",  labelKey: "tabs.practice", icon: Sparkles,   tourId: "nav-listen" },
  { href: "/journal", labelKey: "tabs.journal", icon: NotebookPen, tourId: "nav-journal" },
  { href: "/feed",    labelKey: "tabs.feed",    icon: Globe2,      tourId: "nav-feed" },
  { href: "/profile", labelKey: "tabs.profile", icon: UserRound,   tourId: "nav-profile" },
] as const;

const SECONDARY_GROUPS = [
  {
    labelKey: "common.practiceSection",
    items: [
      { href: "/quiz",        labelKey: "quiz.title",        icon: Brain,           tourId: "nav-quiz" },
      { href: "/word-review", labelKey: "wordReview.title",  icon: FlipHorizontal2, tourId: undefined },
      { href: "/leaderboard", labelKey: "leaderboard.title", icon: Trophy,          tourId: undefined },
    ],
  },
  {
    labelKey: "common.exploreSection",
    items: [
      { href: "/culture",    labelKey: "tabs.culture",         icon: Clapperboard, tourId: undefined },
      { href: "/dictionary", labelKey: "dictionaryPage.title", icon: BookText,     tourId: undefined },
      { href: "/bounties",   labelKey: "bounties.title",       icon: Star,         tourId: undefined },
    ],
  },
  {
    labelKey: "common.contributeSection",
    items: [
      { href: "/contribute",       labelKey: "contribute.title",      icon: Plus,     tourId: undefined },
      { href: "/my-contributions", labelKey: "myContributions.title", icon: FileText, tourId: undefined },
    ],
  },
  {
    labelKey: "common.accountSection",
    items: [
      { href: "/dashboard", labelKey: "profile.progressDashboard", icon: LayoutDashboard, tourId: undefined },
      { href: "/classroom", labelKey: "profile.classroom",         icon: Users,           tourId: undefined },
      { href: "/settings",  labelKey: "settings.title",            icon: Settings,        tourId: undefined },
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
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-white/[0.055]"
      style={{
        background: "linear-gradient(180deg, #0b0b16 0%, #07070f 100%)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-[18px] border-b border-white/[0.055]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-[0_0_20px_-4px_rgb(245_158_11_/0.55)]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-700" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Languages className="h-[18px] w-[18px] text-white relative z-10 drop-shadow" />
            </div>
            <div className="absolute inset-0 shadow-inner-bright rounded-xl" />
          </div>
          <span className="font-display font-bold text-[18px] text-white tracking-tight group-hover:text-amber-200 transition-colors">
            Beeli
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide space-y-0.5">
        {/* Primary */}
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon, tourId }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              data-tour={tourId}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-amber-500/[0.14] text-amber-200 ring-1 ring-inset ring-amber-500/[0.25] shadow-[0_0_14px_-4px_rgb(245_158_11_/0.4)]"
                  : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.05]"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-amber-400" : "text-neutral-500 group-hover:text-neutral-300")} />
              {t(labelKey)}
            </Link>
          );
        })}

        {/* Secondary — grouped */}
        {SECONDARY_GROUPS.map((group) => (
          <div key={group.labelKey} className="pt-5">
            <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-600 flex items-center gap-2">
              <span className="h-px flex-1 bg-white/[0.05]" />
              {t(group.labelKey)}
              <span className="h-px flex-1 bg-white/[0.05]" />
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, labelKey, icon: Icon, tourId }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    {...(tourId ? { "data-tour": tourId } : {})}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-amber-500/[0.11] text-amber-300 ring-1 ring-inset ring-amber-500/[0.18]"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.05]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-amber-400" : "text-neutral-600")} />
                    {t(labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Educator section — inside scroll area */}
        {me?.isReviewer && (
          <div className="pt-5">
            <div className="mb-1.5 px-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-white/[0.05]" />
              <GraduationCap className={cn(
                "h-3 w-3",
                me.reviewerRole === "elder" ? "text-teal-400" : me.reviewerRole === "professor" ? "text-indigo-400" : "text-blue-400"
              )} />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-[0.15em]",
                me.reviewerRole === "elder" ? "text-teal-400" : me.reviewerRole === "professor" ? "text-indigo-400" : "text-blue-400"
              )}>
                {me.reviewerRole === "elder" ? t("reviewerApplication.roleElder")
                  : me.reviewerRole === "professor" ? t("reviewerApplication.roleProfessor")
                  : me.reviewerRole === "teacher" ? t("reviewerApplication.roleTeacher")
                  : t("educator.panelTitle")}
              </span>
              <span className="h-px flex-1 bg-white/[0.05]" />
            </div>
            <div className="space-y-0.5">
              {EDUCATOR_NAV.map(({ href, labelKey, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? me?.reviewerRole === "elder"
                          ? "bg-teal-500/[0.12] text-teal-300 ring-1 ring-inset ring-teal-500/[0.2]"
                          : me?.reviewerRole === "professor"
                          ? "bg-indigo-500/[0.12] text-indigo-300 ring-1 ring-inset ring-indigo-500/[0.2]"
                          : "bg-blue-500/[0.12] text-blue-300 ring-1 ring-inset ring-blue-500/[0.2]"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.05]"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0",
                      active
                        ? me?.reviewerRole === "elder" ? "text-teal-400" : me?.reviewerRole === "professor" ? "text-indigo-400" : "text-blue-400"
                        : "text-neutral-600"
                    )} />
                    {t(labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin section — inside scroll area */}
        {me?.isAdmin && (
          <div className="pt-5 pb-2">
            <div className="mb-1.5 px-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-white/[0.05]" />
              <ShieldCheck className="h-3 w-3 text-gold-400" />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gold-400">
                {t("admin.panelTitle")}
              </span>
              <span className="h-px flex-1 bg-white/[0.05]" />
            </div>
            <div className="space-y-0.5">
              {ADMIN_NAV.map(({ href, labelKey, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-gold-500/[0.14] text-gold-300 ring-1 ring-inset ring-gold-500/[0.22] shadow-glow-gold"
                        : "text-neutral-500 hover:text-gold-300 hover:bg-gold-500/[0.07]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-gold-400" : "text-neutral-600")} />
                    {t(labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User account */}
      <div className="px-4 py-4 border-t border-white/[0.055]">
        {isSignedIn ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] transition-colors cursor-pointer">
            <UserButton />
            <span className="text-sm text-neutral-400 truncate font-medium">
              {t("common.myAccount")}
            </span>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] transition-colors"
          >
            <UserRound className="h-4 w-4 shrink-0 text-neutral-500" />
            <span className="text-sm text-neutral-400 truncate font-medium">
              {t("common.signIn")}
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
