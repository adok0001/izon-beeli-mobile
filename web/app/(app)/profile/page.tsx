"use client";

import { apiFetch } from "@/lib/api";
import { useTourStore } from "@/store/tour-store";
import type { UserProfile } from "@/types";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
    BookOpen,
    BookText,
    ChevronRight,
    Flame,
    LayoutDashboard,
    LogOut,
    Map,
    Settings,
    Star,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

function StatCard({ icon: Icon, label, value }: Readonly<{ icon: LucideIcon; label: string; value: string | number }>) {
  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-center">
      <Icon className="mx-auto h-6 w-6 text-brand-500" />
      <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}

function MenuRow({
  href,
  icon: Icon,
  label,
  detail,
  danger,
}: Readonly<{
  href?: string;
  icon: LucideIcon;
  label: string;
  detail?: string;
  danger?: boolean;
}>) {
  const cls = `flex items-center gap-3 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors rounded px-1 ${
    danger ? "text-red-500" : "text-neutral-900 dark:text-white"
  }`;

  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {detail && (
        <span className="text-sm text-neutral-400 dark:text-neutral-500">{detail}</span>
      )}
      <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }

  return <div className={cls}>{content}</div>;
}

export default function ProfilePage() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const { reset: resetTour, start: startTour } = useTourStore();
  const { t } = useTranslation();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<UserProfile>("/users/me", { token: token ?? undefined });
    },
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">{t("profile.title")}</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt={user.fullName ?? ""} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-neutral-500">
              <UserRound className="h-8 w-8" />
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-lg text-neutral-900 dark:text-white">
            {user?.fullName ?? profile?.name ?? t("profile.learner")}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {user?.primaryEmailAddress?.emailAddress ?? profile?.email}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-8">
        <StatCard icon={Flame} label={t("profile.streak")} value={profile?.streak ?? 0} />
        <StatCard icon={Star} label={t("profile.points")} value={profile?.points ?? 0} />
        <StatCard icon={BookOpen} label={t("profile.lessons")} value={profile?.lessonsCompleted ?? 0} />
      </div>

      {/* Menu */}
      <div>
        <MenuRow href="/dashboard" icon={LayoutDashboard} label={t("profile.progressDashboard")} />
        <MenuRow href="/dictionary" icon={BookText} label={t("profile.dictionary")} />
        <MenuRow href="/settings" icon={Settings} label={t("profile.settings")} />
        <button
          onClick={() => { resetTour(); startTour(); }}
          className="flex items-center gap-3 py-3.5 w-full text-left text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors rounded px-1"
        >
          <Map className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-sm font-medium">{t("profile.restartWelcomeTour")}</span>
          <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
        </button>
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="flex items-center gap-3 py-3.5 w-full text-left text-red-500 border-b border-neutral-100 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded px-1"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-sm font-medium">{t("profile.signOut")}</span>
        </button>
      </div>
    </div>
  );
}
