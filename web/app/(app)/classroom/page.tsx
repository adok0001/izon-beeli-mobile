"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Copy, Loader2, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface GroupMember { userId: string; name: string; role: string; }
interface Group { id: string; name: string; languageId: string; inviteCode: string; createdAt: string; members: GroupMember[]; }

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

const ROLE_COLORS: Record<string, string> = {
  teacher: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400",
  parent: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  student: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400",
};

function CopyButton({ text }: Readonly<{ text: string }>) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = () => {
    void navigator.clipboard.writeText(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, 1500);
  };
  return (
    <button onClick={copy} className="p-1 rounded text-neutral-400 hover:text-brand-600 transition-colors">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function GroupCard({ group }: Readonly<{ group: Group }>) {
  const [expanded, setExpanded] = useState(false);
  const langName = LANGUAGES.find((l) => l.id === group.languageId)?.name ?? group.languageId;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
            <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-neutral-900 dark:text-white">{group.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {langName} · {group.members.length} member{group.members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ChevronRight className={cn("h-4 w-4 text-neutral-400 transition-transform", expanded && "rotate-90")} />
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 pb-4 pt-3 space-y-3">
          {/* Invite code */}
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5">
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Invite code</p>
              <p className="text-lg font-bold tracking-widest text-neutral-900 dark:text-white">{group.inviteCode}</p>
            </div>
            <CopyButton text={group.inviteCode} />
          </div>

          {/* Members */}
          <div className="space-y-1.5">
            {group.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between py-1">
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{m.name}</p>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", ROLE_COLORS[m.role] ?? ROLE_COLORS.student)}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateGroupModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [langId, setLangId] = useState("izon");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/classroom/groups", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), languageId: langId }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["classroom-groups"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-neutral-900 dark:text-white">Create a group</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Group name</label>
            <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Izon Beginners" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Language</label>
            <select className={fieldCls} value={langId} onChange={(e) => setLangId(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={!name.trim() || create.isPending}
          className="mt-5 w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {create.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create group"}
        </button>
      </div>
    </div>
  );
}

function JoinGroupModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const join = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/classroom/groups/join-by-code", {
        method: "POST",
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["classroom-groups"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-neutral-900 dark:text-white">Join a group</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <label className="block text-xs font-medium text-neutral-500 mb-1">Invite code</label>
        <input
          className={fieldCls}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC123"
          maxLength={6}
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <button
          onClick={() => join.mutate()}
          disabled={code.trim().length < 4 || join.isPending}
          className="mt-4 w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {join.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</> : "Join group"}
        </button>
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [modal, setModal] = useState<"create" | "join" | null>(null);

  const { data: groups = [], isLoading, isError, error } = useQuery<Group[]>({
    queryKey: ["classroom-groups"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/classroom/groups", { token: token ?? undefined });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {t("profile.classroom")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Study groups and classes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModal("join")}
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-brand-400 transition-colors"
          >
            Join
          </button>
          <button
            onClick={() => setModal("create")}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            + Create
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-20 text-red-400">
          <p className="font-medium">{t("common.error")}</p>
          <p className="text-sm mt-1 text-neutral-500">{(error as Error)?.message}</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-neutral-400 dark:text-neutral-500">
          <Users className="mb-3 h-10 w-10" />
          <p className="font-medium">No groups yet</p>
          <p className="text-sm mt-1">Create a group or join one with an invite code.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => <GroupCard key={group.id} group={group} />)}
        </div>
      )}

      {modal === "create" && <CreateGroupModal onClose={() => setModal(null)} />}
      {modal === "join" && <JoinGroupModal onClose={() => setModal(null)} />}
    </div>
  );
}
