"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, UserCheck, XCircle } from "lucide-react";
import { useState } from "react";

type AppStatus = "pending" | "approved" | "rejected";

interface ReviewerApp {
  id: string;
  role: string;
  background: string;
  reason: string;
  languages: string[];
  status: AppStatus;
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  userName: string | null;
  userEmail: string | null;
  userId: string;
}

const STATUS_STYLES: Record<AppStatus, string> = {
  pending: "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
  approved: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
  rejected: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
};

const ROLE_STYLES: Record<string, string> = {
  teacher: "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  professor: "text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
  elder: "text-teal-700 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400",
};

function ActionModal({
  app,
  action,
  onConfirm,
  onClose,
  busy,
}: Readonly<{
  app: ReviewerApp;
  action: "approve" | "reject";
  onConfirm: (note: string, grantLanguages: string[]) => void;
  onClose: () => void;
  busy: boolean;
}>) {
  const [note, setNote] = useState("");
  const [langsInput, setLangsInput] = useState(app.languages.join(", "));
  const isApprove = action === "approve";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
          {isApprove ? "Approve Application" : "Reject Application"}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          {app.userName ?? app.userEmail} — <span className="capitalize">{app.role}</span>
        </p>

        {isApprove && (
          <div className="mb-4">
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 block">
              Grant languages (comma-separated)
            </label>
            <input
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={langsInput}
              onChange={(e) => setLangsInput(e.target.value)}
              placeholder="izon, igbo"
            />
          </div>
        )}

        <div className="mb-5">
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 block">
            Note to applicant (optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[80px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isApprove ? "Welcome to the reviewer team!" : "Tell them why..."}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const langs = langsInput
                .split(",")
                .map((l) => l.trim().toLowerCase())
                .filter(Boolean);
              onConfirm(note.trim(), langs);
            }}
            disabled={busy}
            className={cn(
              "px-4 py-2 text-sm rounded-lg font-semibold text-white disabled:opacity-50",
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {busy ? "Saving…" : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({
  app,
  onAction,
  busy,
}: Readonly<{
  app: ReviewerApp;
  onAction: (id: string, action: "approve" | "reject", note: string, grantLanguages: string[]) => void;
  busy: boolean;
}>) {
  const [modal, setModal] = useState<"approve" | "reject" | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-bold text-neutral-900 dark:text-white">
                {app.userName ?? "Unknown"}
              </p>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", ROLE_STYLES[app.role] ?? "text-neutral-600 bg-neutral-100")}>
                {app.role}
              </span>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", STATUS_STYLES[app.status])}>
                {app.status}
              </span>
            </div>
            <p className="text-xs text-neutral-400">{app.userEmail}</p>
            {app.languages.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {app.languages.map((l) => (
                  <span key={l} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full">
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-400 shrink-0">
            {new Date(app.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded((x) => !x)}
          className="text-xs text-blue-500 hover:underline mb-3"
        >
          {expanded ? "Hide details" : "Show details"}
        </button>

        {expanded && (
          <div className="space-y-3 mb-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Background</p>
              <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{app.background}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Reason</p>
              <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{app.reason}</p>
            </div>
            {app.reviewerNote && (
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Reviewer note</p>
                <p className="text-neutral-600 dark:text-neutral-400 italic">{app.reviewerNote}</p>
              </div>
            )}
          </div>
        )}

        {app.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => setModal("approve")}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={() => setModal("reject")}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>

      {modal && (
        <ActionModal
          app={app}
          action={modal}
          busy={busy}
          onClose={() => setModal(null)}
          onConfirm={(note, grantLanguages) => {
            onAction(app.id, modal, note, grantLanguages);
            setModal(null);
          }}
        />
      )}
    </>
  );
}

export default function AdminApplicationsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | AppStatus>("pending");

  const { data: apps = [], isLoading } = useQuery<ReviewerApp[]>({
    queryKey: ["admin", "reviewer-applications"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ReviewerApp[]>("/reviewer-applications/admin", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      reviewerNote,
      grantLanguages,
    }: {
      id: string;
      status: "approved" | "rejected";
      reviewerNote: string;
      grantLanguages: string[];
    }) => {
      const token = await getToken();
      return apiFetch(`/reviewer-applications/admin/${id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify({ status, reviewerNote, grantLanguages }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "reviewer-applications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const filtered =
    statusFilter === "all" ? apps : apps.filter((a) => a.status === statusFilter);

  const counts = {
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-teal-500" />
          Reviewer Applications
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Review and action applications from users who want to become language reviewers.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors",
              statusFilter === s
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
          >
            {s}
            {s !== "all" && counts[s] > 0 && (
              <span className="ml-1 opacity-70">({counts[s]})</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-neutral-400">No {statusFilter === "all" ? "" : statusFilter} applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              busy={reviewMutation.isPending}
              onAction={(id, action, note, grantLanguages) =>
                reviewMutation.mutate({
                  id,
                  status: action === "approve" ? "approved" : "rejected",
                  reviewerNote: note,
                  grantLanguages,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
