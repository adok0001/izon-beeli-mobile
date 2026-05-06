"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, BookOpen, BookText, ClipboardList, MessageSquare, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const ADMIN_NAV = [
  { href: "/admin",              labelKey: "admin.nav.overview",     icon: BarChart2,     exact: true },
  { href: "/admin/users",        labelKey: "admin.nav.users",        icon: Users },
  { href: "/admin/courses",      labelKey: "admin.nav.courses",      icon: BookOpen },
  { href: "/admin/dictionary",   labelKey: "admin.nav.dictionary",   icon: BookText },
  { href: "/admin/review",       labelKey: "admin.nav.review",       icon: ClipboardList },
  { href: "/admin/applications", labelKey: "admin.nav.applications", icon: UserCheck },
  { href: "/admin/feedback",     labelKey: "admin.nav.feedback",     icon: MessageSquare },
] as const;

interface Me { isAdmin: boolean }

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
    if (me !== undefined && !me.isAdmin) router.replace("/learn");
  }, [isLoaded, isSignedIn, me, router]);

  if (!isLoaded || isPending || me === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#07070f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!me.isAdmin) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#07070f]">
      <header className="sticky top-0 z-30 border-b border-neutral-200/60 dark:border-white/[0.07] bg-white/90 dark:bg-[#0b0b16]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
              {t("admin.panelTitle")}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{t("admin.internalTools")}</p>
          </div>
          <Link href="/learn" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
            {t("admin.backToApp")}
          </Link>
        </div>
        {/* Tab nav */}
        <div className="max-w-7xl mx-auto px-6 pb-0 flex gap-0.5 overflow-x-auto scrollbar-hide">
          {ADMIN_NAV.map(({ href, labelKey, icon: Icon, ...rest }) => {
            const exact = "exact" in rest && rest.exact;
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
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
    </div>
  );
}
