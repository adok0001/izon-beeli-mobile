"use client";

import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks/use-me";
import { useTourStore } from "@/store/tour-store";
import type { UserProfile } from "@/types";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  BookText,
  ChevronRight,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function StatCard({ icon: Icon, label, value }: Readonly<{ icon: LucideIcon; label: string; value: string | number }>) {
  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-center">
      <Icon className="mx-auto h-6 w-6 text-amber-500" />
      <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">{label}</p>
    </div>
  );
}

function MenuRow({
  href,
  icon: Icon,
  label,
  detail,
  danger,
  onClick,
}: Readonly<{
  href?: string;
  icon: LucideIcon;
  label: string;
  detail?: string;
  danger?: boolean;
  onClick?: () => void;
}>) {
  const cls = `flex items-center gap-3 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors rounded px-1 ${
    danger ? "text-red-500" : "text-neutral-900 dark:text-white"
  }`;

  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {detail && <span className="text-sm text-neutral-600 dark:text-neutral-300">{detail}</span>}
      <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
    </>
  );

  if (href) return <Link href={href} className={cls}>{content}</Link>;
  return <button onClick={onClick} className={`w-full text-left ${cls}`}>{content}</button>;
}

function FeedbackModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [category, setCategory] = useState<"bug" | "suggestion" | "other">("suggestion");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      (previousFocusRef.current as HTMLElement | null)?.focus();
    };
  }, [onClose]);

  const CATEGORY_LABELS: Record<"bug" | "suggestion" | "other", string> = {
    bug: t("profile.categoryBug"),
    suggestion: t("profile.categorySuggestion"),
    other: t("profile.categoryOther"),
  };

  const submit = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({ category, message: message.trim(), platform: "web" }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => setDone(true),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="profile-modal-title" className="font-bold text-neutral-900 dark:text-white">{t("profile.sendFeedback")}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <p className="font-semibold text-neutral-900 dark:text-white">{t("profile.thanks")}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t("profile.feedbackHint")}</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors">
              {t("common.close")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              {(["bug", "suggestion", "other"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    category === cat
                      ? "bg-brand-600 text-white border-brand-600"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-brand-400"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <textarea
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("profile.feedbackPlaceholder")}
              maxLength={2000}
              autoFocus
            />
            <p className="text-xs text-neutral-600 dark:text-neutral-300 text-right mt-1">{message.length}/2000</p>
            {submit.isError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{(submit.error as Error).message}</p>
            )}
            <button
              onClick={() => submit.mutate()}
              disabled={!message.trim() || submit.isPending}
              className="mt-3 w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submit.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("profile.sending")}</> : t("common.submit")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const { reset: resetTour, start: startTour } = useTourStore();
  const { t } = useTranslation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<UserProfile>("/users/me", { token: token ?? undefined });
    },
  });

  const { data: me } = useMe();

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-px bg-amber-500/50" />
        <span className="text-[10px] uppercase tracking-[0.28em] text-amber-500/70 font-semibold">Your Profile</span>
      </div>
      <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-6">{t("profile.title")}</h1>

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
        <MenuRow href="/bounties" icon={Star} label={t("bounties.title", { defaultValue: "Bounties" })} />
        <MenuRow href="/my-contributions" icon={FileText} label={t("profile.myContributions")} />
        <MenuRow href="/classroom" icon={Users} label={t("profile.classroom")} />
        <MenuRow href="/dictionary" icon={BookText} label={t("profile.dictionary")} />
        <MenuRow href="/leaderboard" icon={Map} label={t("leaderboard.title", { defaultValue: "Leaderboard" })} />
        <MenuRow href="/settings" icon={Settings} label={t("profile.settings")} />
        <MenuRow icon={MessageSquare} label={t("profile.sendFeedback")} onClick={() => setFeedbackOpen(true)} />
        <MenuRow
          icon={Map}
          label={t("profile.restartWelcomeTour", { defaultValue: "Restart Welcome Checklist" })}
          onClick={() => { resetTour(); startTour(); }}
        />
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="flex items-center gap-3 py-3.5 w-full text-left text-red-600 dark:text-red-400 border-b border-neutral-100 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded px-1"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-sm font-medium">{t("profile.signOut")}</span>
        </button>
      </div>

      {/* Educator / Admin panel — visible on mobile where the sidebar is hidden */}
      {(me?.isReviewer || me?.isAdmin) && (
        <div className="mt-8 md:hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-300 mb-3 px-1">
            {me.isAdmin ? t("admin.panelTitle") : t("educator.panelTitle")}
          </p>
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {me.isReviewer && (
              <MenuRow
                href="/educator"
                icon={GraduationCap}
                label={t("educator.panelTitle")}
                detail={
                  me.reviewerRole === "elder"
                    ? t("reviewerApplication.roleElder")
                    : me.reviewerRole === "professor"
                    ? t("reviewerApplication.roleProfessor")
                    : me.reviewerRole === "teacher"
                    ? t("reviewerApplication.roleTeacher")
                    : undefined
                }
              />
            )}
            {me.isAdmin && (
              <MenuRow
                href="/admin"
                icon={ShieldCheck}
                label={t("admin.panelTitle")}
              />
            )}
          </div>
        </div>
      )}

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
