"use client";

import { TourFloatingButton } from "@/components/tour/tour-floating-button";
import { useMe } from "@/lib/hooks/use-me";
import { cn } from "@/lib/utils";
import { useUiLanguageStore, type UiLanguage } from "@/store/ui-language-store";
import { useAuth } from "@clerk/nextjs";
import {
  Bell,
  BookMarked,
  BookOpen,
  BookText,
  BrainCircuit,
  CalendarCheck,
  Clapperboard,
  ClipboardList,
  CreditCard,
  Flag,
  Flame,
  Gamepad2,
  Globe2,
  Handshake,
  Images,
  Landmark,
  Languages,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  MessageSquareDiff,
  MessagesSquare,
  Quote,
  SpellCheck,
  Sun,
  Target,
  Type,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Which section a Studio layout guards. `admin` requires `isAdmin`; `reviewer`
 * admits admins and language reviewers alike. The gate lives here so the
 * `/admin` and `/educator` route groups inherit the same rule — a reviewer who
 * deep-links an `/admin/*` ops page is redirected, never leaked in.
 */
export type StudioAccess = "admin" | "reviewer";

type NavItem = {
  href: string;
  /**
   * Where an admin goes for this entity, when it differs from the reviewer
   * destination. `culture`, `dictionary`, and `review` are NOT true duplicates:
   * the `/admin/*` pages operate cross-language (and, for review, over the
   * global pending queue) while the `/educator/*` pages are reviewer-scoped.
   * So the nav sends each role to the surface that matches its scope rather
   * than redirecting one onto the other and dropping capability. Unifying them
   * for real is deferred to the editorial-workflow phase.
   */
  adminHref?: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
  tourId?: string;
};

// Authoring surfaces — shown to any reviewer (and admins).
const AUTHORING_NAV: readonly NavItem[] = [
  { href: "/educator/review",     adminHref: "/admin/review",     labelKey: "educator.nav.review",     icon: ClipboardList,     tourId: "educator-nav-review" },
  { href: "/educator/dictionary", adminHref: "/admin/dictionary", labelKey: "educator.nav.dictionary", icon: BookText,          tourId: "educator-nav-dictionary" },
  { href: "/educator/courses",    labelKey: "educator.nav.lessons",    icon: BookOpen,          tourId: "educator-nav-courses" },
  { href: "/educator/sentences",  labelKey: "educator.nav.sentences",  icon: MessageSquareDiff, tourId: "educator-nav-sentences" },
  { href: "/educator/culture",    adminHref: "/admin/culture",    labelKey: "educator.nav.culture",    icon: Globe2,            tourId: "educator-nav-culture" },
  { href: "/educator/etymology",  labelKey: "admin.nav.etymology",     icon: Landmark,          tourId: "educator-nav-etymology" },
  { href: "/educator/proverbs",   labelKey: "educator.nav.proverbs",   icon: Quote,             tourId: "educator-nav-proverbs" },
  { href: "/educator/scenarios",  labelKey: "educator.nav.scenarios",  icon: MessagesSquare,    tourId: "educator-nav-scenarios" },
  { href: "/educator/story-arcs", labelKey: "educator.nav.storyArcs",  icon: BookMarked,        tourId: "educator-nav-story-arcs" },
  { href: "/educator/quiz-bank",  labelKey: "educator.nav.quizBank",   icon: ListChecks,        tourId: "educator-nav-quiz-bank" },
  { href: "/educator/translations", labelKey: "educator.nav.translations", icon: Type,          tourId: "educator-nav-translations" },
];

// Operations surfaces — admin only.
const OPS_NAV: readonly NavItem[] = [
  { href: "/admin/users",         labelKey: "admin.nav.users",         icon: Users,        tourId: "admin-nav-users" },
  { href: "/admin/applications",  labelKey: "admin.nav.applications",  icon: UserCheck,    tourId: "admin-nav-applications" },
  { href: "/admin/organizations", labelKey: "admin.nav.billing",       icon: CreditCard,   tourId: "admin-nav-billing" },
  { href: "/admin/feedback",      labelKey: "admin.nav.feedback",      icon: MessageSquare, tourId: "admin-nav-feedback" },
  { href: "/admin/notifications", labelKey: "admin.nav.notifications", icon: Bell,         tourId: "admin-nav-notifications" },
  { href: "/admin/daily-content", labelKey: "admin.nav.dailyContent",  icon: Sun,          tourId: "admin-nav-daily-content" },
  { href: "/admin/activities",    labelKey: "admin.nav.activities",    icon: Gamepad2,     tourId: "admin-nav-activities" },
  { href: "/admin/quiz",          labelKey: "admin.nav.quiz",          icon: BrainCircuit, tourId: "admin-nav-quiz" },
  { href: "/admin/bounties",      labelKey: "admin.nav.bounties",      icon: Target,       tourId: "admin-nav-bounties" },
  { href: "/admin/daily-challenges", labelKey: "admin.nav.dailyChallenges", icon: CalendarCheck, tourId: "admin-nav-daily-challenges" },
  { href: "/admin/discover-stories", labelKey: "admin.nav.discoverStories", icon: Clapperboard, tourId: "admin-nav-discover-stories" },
  { href: "/admin/streak-tools",  labelKey: "admin.nav.streakTools",   icon: Flame,        tourId: "admin-nav-streak-tools" },
  { href: "/admin/languages",     labelKey: "admin.nav.languages",     icon: Languages,    tourId: "admin-nav-languages" },
  { href: "/admin/content-partners", labelKey: "admin.nav.contentPartners", icon: Handshake, tourId: "admin-nav-content-partners" },
  { href: "/admin/english-wordbank", labelKey: "admin.nav.englishWordbank", icon: SpellCheck, tourId: "admin-nav-english-wordbank" },
  { href: "/admin/app-config",    labelKey: "admin.nav.appConfig",     icon: Flag,         tourId: "admin-nav-app-config" },
  { href: "/admin/media",         labelKey: "admin.nav.media",        icon: Images,       tourId: "admin-nav-media" },
];

function hasAccess(access: StudioAccess, me: { isAdmin: boolean; isReviewer: boolean }): boolean {
  return access === "admin" ? me.isAdmin : me.isAdmin || me.isReviewer;
}

/**
 * Which language content fields (title/description, etc.) render in across
 * Studio — drives every `localizeField(...)` call on these pages. Separate
 * from the learner-facing UI chrome language, though it shares the same
 * store so a Studio pick also updates the "Retour à l'application" chrome.
 */
const CONTENT_LANGS: readonly { id: UiLanguage; label: string }[] = [
  { id: "en",  label: "English"   },
  { id: "fr",  label: "Français"  },
  { id: "pcm", label: "Naija"     },
  { id: "ar",  label: "العربية"   },
  { id: "pt",  label: "Português" },
];

export function StudioShell({
  access,
  children,
}: Readonly<{ access: StudioAccess; children: React.ReactNode }>) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: me, isPending } = useMe();
  const { uiLanguage, setUiLanguage } = useUiLanguageStore();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    if (me !== undefined && !hasAccess(access, me)) {
      // No Studio access at all (not admin, not a reviewer) → send them to apply.
      // A reviewer hitting an admin-only page already has *some* access, just
      // not this route's — that's a permissions mismatch, not a missing
      // application, so send them to their own home instead of the apply flow.
      router.replace(me.isAdmin || me.isReviewer ? "/educator" : "/contribute?flow=reviewer");
    }
  }, [isLoaded, isSignedIn, me, access, router]);

  if (!isLoaded || isPending || me === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#07070f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!hasAccess(access, me)) return null;

  const overview: NavItem = {
    href: me.isAdmin ? "/admin" : "/educator",
    labelKey: "educator.nav.overview",
    icon: LayoutDashboard,
    exact: true,
    tourId: me.isAdmin ? "admin-nav-overview" : "educator-nav-overview",
  };
  const navItems: NavItem[] = [overview, ...AUTHORING_NAV, ...(me.isAdmin ? OPS_NAV : [])].map(
    (item) => ({ ...item, href: me.isAdmin && item.adminHref ? item.adminHref : item.href })
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#07070f]">
      <header className="sticky top-0 z-30 border-b border-neutral-200/60 dark:border-white/[0.07] bg-white/90 dark:bg-[#0b0b16]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                Studio
              </h1>
              {me.reviewerRole && (
                <span className={
                  me.reviewerRole === "elder"
                    ? "text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/[0.1] text-teal-600 dark:text-teal-400 border border-teal-500/[0.2] uppercase tracking-wide"
                    : me.reviewerRole === "professor"
                    ? "text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/[0.1] text-indigo-600 dark:text-indigo-400 border border-indigo-500/[0.2] uppercase tracking-wide"
                    : "text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/[0.1] text-blue-600 dark:text-blue-400 border border-blue-500/[0.2] uppercase tracking-wide"
                }>
                  {t(`reviewerApplication.role${me.reviewerRole.charAt(0).toUpperCase()}${me.reviewerRole.slice(1)}`)}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
              {me.isAdmin
                ? t("educator.subtitleAdmin")
                : t("educator.subtitleReviewer", { languages: me.reviewerLanguages.join(", ") })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.08] px-2.5 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                title="Content display language"
              >
                <Globe2 className="h-3.5 w-3.5" />
                {CONTENT_LANGS.find((l) => l.id === uiLanguage)?.label}
              </button>
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0b0b16] shadow-lg overflow-hidden">
                    {CONTENT_LANGS.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => { setUiLanguage(id); setLangMenuOpen(false); }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors",
                          uiLanguage === id
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Link href="/learn" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
              {t("admin.backToApp")}
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-0 flex gap-0.5 overflow-x-auto scrollbar-hide">
          {navItems.map(({ href, labelKey, icon: Icon, exact, tourId }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-tour={tourId}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-all",
                  active
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-neutral-500 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(labelKey)}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      {/* Welcome checklist floating button */}
      <TourFloatingButton />
    </div>
  );
}
