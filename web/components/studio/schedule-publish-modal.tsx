"use client";

import { useState } from "react";

/** Shared by the dictionary and lesson editors — a bare date-time input that
 * calls the guarded /schedule-publish endpoint via the caller's mutation. */
export function SchedulePublishModal({
  onClose, onSchedule, saving,
}: Readonly<{ onClose: () => void; onSchedule: (publishAt: Date) => void; saving: boolean }>) {
  const [value, setValue] = useState("");
  const isValid = value && new Date(value).getTime() > Date.now();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-sm p-5 space-y-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Schedule publish</h3>
        <div>
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Publish at</label>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => isValid && onSchedule(new Date(value))}
            disabled={!isValid || saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            {saving ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
