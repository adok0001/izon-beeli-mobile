"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/types";

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  onEdit: (e: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
            {entry.title}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
            {entry.content}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            {formatDate(entry.createdAt)}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors rounded"
            aria-label="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded"
            aria-label="Delete"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryModal({
  entry,
  onClose,
}: {
  entry: Partial<JournalEntry> | null;
  onClose: () => void;
}) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const isEdit = !!entry?.id;

  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (isEdit) {
        return apiFetch(`/journal/${entry!.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title, content }),
          token: token ?? undefined,
        });
      }
      return apiFetch("/journal", {
        method: "POST",
        body: JSON.stringify({ title, content }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 dark:text-white">
            {isEdit ? "Edit Entry" : "New Entry"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title..."
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              rows={6}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!title.trim() || save.isPending}
            className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [modalEntry, setModalEntry] = useState<Partial<JournalEntry> | null>(null);

  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["journal"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<JournalEntry[]>("/journal", { token: token ?? undefined });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/journal/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Journal</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Reflect on your learning journey
          </p>
        </div>
        <button
          onClick={() => setModalEntry({})}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + New Entry
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <p className="text-4xl mb-3">📓</p>
          <p className="font-medium">No entries yet</p>
          <p className="text-sm mt-1">Start by adding your first journal entry.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={setModalEntry}
              onDelete={(id) => deleteEntry.mutate(id)}
            />
          ))}
        </div>
      )}

      {modalEntry !== null && (
        <EntryModal entry={modalEntry} onClose={() => setModalEntry(null)} />
      )}
    </div>
  );
}
