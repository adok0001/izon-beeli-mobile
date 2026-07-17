"use client";

import { cn } from "@/lib/utils";
import { SoundboardMixQuiz, WordPlacementQuiz } from "@/components/learn/mini-apps";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Activity } from "./shared";

export function ActivityRow({
  activity, onEdit, onDelete,
}: {
  activity: Activity; onEdit: () => void; onDelete: () => void;
}) {
  const [previewing, setPreviewing] = useState(false);
  const title = activity.type === "soundboard" ? `${activity.targetWordNative} — ${activity.targetWord}` : activity.imageAlt;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn(
          "shrink-0 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border",
          activity.type === "soundboard"
            ? "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-900/40 dark:bg-blue-950/30"
            : "text-violet-600 border-violet-200 bg-violet-50 dark:text-violet-400 dark:border-violet-900/40 dark:bg-violet-950/30"
        )}>
          {activity.type === "soundboard" ? "Soundboard" : "Placement"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{title}</p>
          {activity.type === "soundboard" && (
            <p className="text-xs text-neutral-400 truncate mt-0.5">{activity.sentence}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => setPreviewing((v) => !v)} title={previewing ? "Hide preview" : "Preview"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.07] transition-colors">
            {previewing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onEdit} title="Edit"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.07] transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} title="Delete"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {previewing && (
        <div className="px-4 pb-4 border-t border-neutral-100 dark:border-white/[0.05] pt-4">
          {activity.type === "soundboard" ? (
            <SoundboardMixQuiz sentence={activity.sentence} targetWord={activity.targetWord} targetWordNative={activity.targetWordNative} channels={activity.channels} />
          ) : (
            <WordPlacementQuiz imageUrl={activity.imageUrl} imageAlt={activity.imageAlt} zones={activity.zones} tokens={activity.tokens} />
          )}
        </div>
      )}
    </div>
  );
}
