"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TourFloatingButton } from "@/components/tour/tour-floating-button";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, BookText, ClipboardList, Globe2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const EDUCATOR_NAV = [
  { href: "/educator",            labelKey: "educator.nav.overview",   icon: LayoutDashboard, exact: true, tourId: "educator-nav-overview" },
  { href: "/educator/review",     labelKey: "educator.nav.review",     icon: ClipboardList, tourId: "educator-nav-review" },
  { href: "/educator/dictionary", labelKey: "educator.nav.dictionary", icon: BookText, tourId: "educator-nav-dictionary" },
  { href: "/educator/courses",    labelKey: "educator.nav.lessons",    icon: BookOpen, tourId: "educator-nav-courses" },
  { href: "/educator/culture",    labelKey: "educator.nav.culture",    icon: Globe2, tourId: "educator-nav-culture" },
] as const;

interface Me {
  isAdmin: boolean;
  isReviewer: boolean;
  reviewerLanguages: string[];
  reviewerRole?: string | null;
  name: string;
}

export function EducatorShell({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const { data: me, isPending } = useQuery<Me>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Me>("/users/me", { token: token ?? undefined });
    },
    enabled: isLoaded && isSignedIn === true,
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/sign-in"); return; }
    if (me !== undefined && !me.isAdmin && !me.isReviewer) router.replace("/learn");
  }, [isLoaded, isSignedIn, me, router]);

  if (!isLoaded || isPending || me === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#07070f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!me.isAdmin && !me.isReviewer) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#07070f]">
      <header className="sticky top-0 z-30 border-b border-neutral-200/60 dark:border-white/[0.07] bg-white/90 dark:bg-[#0b0b16]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                {t("educator.panelTitle")}
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
          <div className="flex items-center gap-4">
            {me.isAdmin && (
              <Link href="/admin" className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
                {t("educator.adminPanel")}
              </Link>
            )}
            <Link href="/learn" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
              {t("admin.backToApp")}
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-0 flex gap-0.5 overflow-x-auto scrollbar-hide">
          {EDUCATOR_NAV.map(({ href, labelKey, icon: Icon, tourId, ...rest }) => {
            const exact = "exact" in rest && rest.exact;
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
