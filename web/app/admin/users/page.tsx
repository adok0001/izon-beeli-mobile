"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";
import { Shield, ShieldOff } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  points: number;
  streak: number;
  isAdmin: boolean;
  selectedLanguageId?: string | null;
  createdAt: string;
}

function UserAvatar({ name, avatarUrl }: Readonly<{ name: string; avatarUrl?: string | null }>) {
  if (avatarUrl) {
    return <Image src={avatarUrl} alt={name} width={32} height={32} className="rounded-full object-cover" />;
  }
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 text-xs font-bold">
      {initials}
    </div>
  );
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<AdminUser[]>("/admin/users?limit=100", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      const token = await getToken();
      return apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isAdmin }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Users</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{users.length} registered users</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">User</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">Email</th>
              <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Points</th>
              <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Admin</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{user.name}</p>
                      {user.selectedLanguageId && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{user.selectedLanguageId}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 hidden md:table-cell">{user.email}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {user.points.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  {user.isAdmin ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                      <Shield className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAdmin.mutate({ id: user.id, isAdmin: !user.isAdmin })}
                    disabled={toggleAdmin.isPending}
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors",
                      user.isAdmin
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40"
                        : "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    )}
                  >
                    {user.isAdmin ? (
                      <><ShieldOff className="h-3 w-3" /> Demote</>
                    ) : (
                      <><Shield className="h-3 w-3" /> Promote</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
