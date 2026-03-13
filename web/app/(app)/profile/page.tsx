"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import type { UserProfile } from "@/types";

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-center">
      <p className="text-2xl">{emoji}</p>
      <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}

function MenuRow({
  href,
  emoji,
  label,
  detail,
  danger,
}: {
  href?: string;
  emoji: string;
  label: string;
  detail?: string;
  danger?: boolean;
}) {
  const cls = `flex items-center gap-3 py-3.5 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors rounded px-1 ${
    danger ? "text-red-500" : "text-neutral-900 dark:text-white"
  }`;

  const content = (
    <>
      <span className="text-lg shrink-0">{emoji}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {detail && (
        <span className="text-sm text-neutral-400 dark:text-neutral-500">{detail}</span>
      )}
      <span className="text-neutral-300 dark:text-neutral-600 text-sm">›</span>
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
  const { selectedLanguageId } = useLanguageStore();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<UserProfile>("/users/me", { token: token ?? undefined });
    },
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Profile</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={user.fullName ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-neutral-500">
              👤
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-lg text-neutral-900 dark:text-white">
            {user?.fullName ?? profile?.name ?? "Learner"}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {user?.primaryEmailAddress?.emailAddress ?? profile?.email}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-8">
        <StatCard emoji="🔥" label="Streak" value={profile?.streak ?? 0} />
        <StatCard emoji="⭐" label="Points" value={profile?.points ?? 0} />
        <StatCard emoji="📚" label="Lessons" value={profile?.lessonsCompleted ?? 0} />
      </div>

      {/* Menu */}
      <div>
        <MenuRow href="/dictionary" emoji="📖" label="Dictionary" />
        <MenuRow href="/settings" emoji="⚙️" label="Settings" />
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="flex items-center gap-3 py-3.5 w-full text-left text-red-500 border-b border-neutral-100 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded px-1"
        >
          <span className="text-lg shrink-0">🚪</span>
          <span className="flex-1 text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
