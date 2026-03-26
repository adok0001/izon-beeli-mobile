"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Mic,
  Volume2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface PendingContribution {
  id: string;
  word: string;
  english: string;
  category: string;
  languageId: string;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  type: string;
  status: string;
  audioUrl?: string | null;
  dictionaryEntryId?: string | null;
  submitterName?: string | null;
  createdAt: string;
}

function TypeBadge({ type }: Readonly<{ type: string }>) {
  const styles: Record<string, string> = {
    word: "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    phrase: "text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
    audio: "text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    entry_audio: "text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    entry_meaning: "text-teal-700 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400",
  };
  const hasAudio = type === "audio" || type === "entry_audio";
  const label = type.replace("entry_", "");
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1", styles[type] ?? "text-neutral-600 bg-neutral-100")}>
      {hasAudio ? <Mic className="h-2.5 w-2.5" /> : null}
      {label}
    </span>
  );
}

function ContributionCard({
  item,
  onAction,
  busy,
}: Readonly<{
  item: PendingContribution;
  onAction: (id: string, action: "approve" | "reject", note?: string) => void;
  busy: boolean;
}>) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-neutral-900 dark:text-white text-lg">{item.word}</p>
            <TypeBadge type={item.type} />
            <span className="text-xs text-neutral-400 capitalize">{item.languageId}</span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.english}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-neutral-400">{item.submitterName ?? "Unknown"}</p>
          <p className="text-xs text-neutral-300 dark:text-neutral-600">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        {item.category && (
          <div>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Category</span>
            <p className="text-neutral-700 dark:text-neutral-300">{item.category}</p>
          </div>
        )}
        {item.pronunciation && (
          <div>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Pronunciation</span>
            <p className="text-neutral-700 dark:text-neutral-300 font-mono">{item.pronunciation}</p>
          </div>
        )}
        {item.example && (
          <div className="col-span-2">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Example</span>
            <p className="text-neutral-700 dark:text-neutral-300 italic">{item.example}</p>
            {item.exampleTranslation && (
              <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">{item.exampleTranslation}</p>
            )}
          </div>
        )}
      </div>

      {/* Audio playback */}
      {item.audioUrl && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
          <Volume2 className="h-4 w-4 text-brand-500 shrink-0" />
          <audio controls className="flex-1 h-8" src={item.audioUrl} />
        </div>
      )}

      {/* Reviewer note */}
      {showNote && (
        <div className="mb-3">
          <textarea
            rows={2}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Optional reviewer note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 justify-between">
        <button
          onClick={() => setShowNote((v) => !v)}
          className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {showNote ? "Hide note" : "Add note"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onAction(item.id, "reject", note)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
          <button
            onClick={() => onAction(item.id, "approve", note)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const { data: pending = [], isLoading } = useQuery<PendingContribution[]>({
    queryKey: ["admin", "contributions", "pending"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<PendingContribution[]>("/contributions/pending", { token: token ?? undefined });
    },
    staleTime: 15_000,
  });

  const review = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: "approve" | "reject"; note?: string }) => {
      const token = await getToken();
      return apiFetch(`/contributions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ action, note }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "contributions"] });
      void qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Review Contributions</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {pending.length} pending {pending.length === 1 ? "submission" : "submissions"}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-40 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && pending.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">All caught up!</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">No pending contributions to review.</p>
        </div>
      )}

      <div className="space-y-4">
        {pending.map((item) => (
          <ContributionCard
            key={item.id}
            item={item}
            busy={review.isPending}
            onAction={(id, action, note) => review.mutate({ id, action, note })}
          />
        ))}
      </div>
    </div>
  );
}
