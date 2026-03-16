"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, BookOpen, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: BarChart2, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/review", label: "Review", icon: ClipboardList },
] as const;

interface Me {
  isAdmin: boolean;
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    if (me !== undefined && !me.isAdmin) {
      router.replace("/learn");
    }
  }, [isLoaded, isSignedIn, me, router]);

  if (!isLoaded || isPending || me === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!me.isAdmin) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Admin Panel</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Beeli — internal tools</p>
          </div>
          <a href="/learn" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
            ← Back to app
          </a>
        </div>
        {/* Tab navigation */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-1">
          {ADMIN_NAV.map(({ href, label, icon: Icon, ...rest }) => {
            const exact = "exact" in rest && rest.exact;
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
