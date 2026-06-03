"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, ShieldOff, UserCheck, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  points: number;
  streak: number;
  isAdmin: boolean;
  isReviewer: boolean;
  reviewerLanguages: string[];
  reviewerRole?: string | null;
  selectedLanguageId?: string | null;
  createdAt: string;
}

type ReviewerRole = "teacher" | "professor" | "elder";

const ROLE_STYLES: Record<ReviewerRole, string> = {
  teacher:   "bg-blue-500/[0.1] text-blue-700 dark:text-blue-400 border-blue-500/[0.2]",
  professor: "bg-indigo-500/[0.1] text-indigo-700 dark:text-indigo-400 border-indigo-500/[0.2]",
  elder:     "bg-teal-500/[0.1] text-teal-700 dark:text-teal-400 border-teal-500/[0.2]",
};

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
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [editingLangs, setEditingLangs] = useState<string | null>(null); // user id
  const [langInput, setLangInput] = useState("");
  const [roleInput, setRoleInput] = useState<ReviewerRole>("teacher");
  const langInputRef = useRef<HTMLInputElement>(null);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<AdminUser[]>("/admin/users?limit=100", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    : users;

  const toggleReviewer = useMutation({
    mutationFn: async ({ id, isReviewer, reviewerLanguages, reviewerRole }: { id: string; isReviewer: boolean; reviewerLanguages?: string[]; reviewerRole?: string | null }) => {
      const token = await getToken();
      return apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          isReviewer,
          ...(reviewerLanguages !== undefined ? { reviewerLanguages } : {}),
          ...(reviewerRole !== undefined ? { reviewerRole } : {}),
        }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
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
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{t("admin.users.title")}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("admin.users.registeredCount", { count: users.length })}</p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.users.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t("admin.users.colUser")}</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">{t("admin.users.colEmail")}</th>
              <th className="text-right px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t("admin.users.colPoints")}</th>
              <th className="text-center px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t("admin.users.colAdmin")}</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden lg:table-cell">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
                  {t("admin.users.noResults")}
                </td>
              </tr>
            )}
            {filtered.map((user) => (
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
                      <Shield className="h-3 w-3" /> {t("admin.users.colAdmin")}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">—</span>
                  )}
                </td>
                {/* Role cell */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-col gap-1.5 items-start">
                    {/* Role badge */}
                    {user.isReviewer && user.reviewerRole && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide",
                        ROLE_STYLES[user.reviewerRole as ReviewerRole] ?? "bg-neutral-100 text-neutral-600 border-neutral-200"
                      )}>
                        {user.reviewerRole}
                      </span>
                    )}
                    {/* Language tags */}
                    {user.isReviewer && user.reviewerLanguages.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {user.reviewerLanguages.map((lang) => (
                          <span key={lang} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 capitalize">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Inline editor */}
                    {editingLangs === user.id ? (
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <select
                          value={roleInput}
                          onChange={(e) => setRoleInput(e.target.value as ReviewerRole)}
                          className="text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="teacher">Teacher</option>
                          <option value="professor">Professor</option>
                          <option value="elder">Elder</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <input
                            ref={langInputRef}
                            value={langInput}
                            onChange={(e) => setLangInput(e.target.value)}
                            placeholder="izon, igbo, ..."
                            className="text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white w-28 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const langs = langInput.split(",").map((l) => l.trim()).filter(Boolean);
                                toggleReviewer.mutate({ id: user.id, isReviewer: true, reviewerLanguages: langs, reviewerRole: roleInput });
                                setEditingLangs(null);
                              } else if (e.key === "Escape") {
                                setEditingLangs(null);
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const langs = langInput.split(",").map((l) => l.trim()).filter(Boolean);
                              toggleReviewer.mutate({ id: user.id, isReviewer: true, reviewerLanguages: langs, reviewerRole: roleInput });
                              setEditingLangs(null);
                            }}
                            className="text-[10px] px-1.5 py-1 rounded bg-brand-600 text-white hover:bg-brand-700"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingLangs(null)} className="text-neutral-400 hover:text-neutral-600">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : user.isReviewer ? (
                      <button
                        onClick={() => {
                          setLangInput(user.reviewerLanguages.join(", "));
                          setRoleInput((user.reviewerRole as ReviewerRole) ?? "teacher");
                          setEditingLangs(user.id);
                          setTimeout(() => langInputRef.current?.focus(), 50);
                        }}
                        className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {user.isReviewer ? (
                      <button
                        onClick={() => toggleReviewer.mutate({ id: user.id, isReviewer: false, reviewerRole: null })}
                        disabled={toggleReviewer.isPending}
                        className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40"
                      >
                        <UserCheck className="h-3 w-3" />
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setLangInput("");
                          setRoleInput("teacher");
                          setEditingLangs(user.id);
                          setTimeout(() => langInputRef.current?.focus(), 50);
                        }}
                        className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40"
                      >
                        <UserCheck className="h-3 w-3" />
                        Grant Role
                      </button>
                    )}
                    <button
                      onClick={() => toggleAdmin.mutate({ id: user.id, isAdmin: !user.isAdmin })}
                      disabled={toggleAdmin.isPending}
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors",
                        user.isAdmin
                          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40"
                          : "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                      )}
                    >
                      {user.isAdmin ? (
                        <><ShieldOff className="h-3 w-3" /> {t("admin.users.demote")}</>
                      ) : (
                        <><Shield className="h-3 w-3" /> {t("admin.users.promote")}</>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
