"use client";

import { X } from "lucide-react";

/**
 * Phone-bezel mock for the Beeli Studio "learner device-preview" — a
 * slide-over panel showing a draft (dictionary entry or lesson) the way a
 * learner would see it, before it's published. Pure CSS, no device-frame
 * dependency; the content inside is built fresh per entity (see
 * DictionaryPreviewCard / LessonPreviewCard) since web has no components
 * shared with the mobile learner app.
 */
export function DevicePreview({
  open, onClose, children,
}: Readonly<{ open: boolean; onClose: () => void; children: React.ReactNode }>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
      <div className="h-full w-full max-w-md overflow-y-auto bg-neutral-100 dark:bg-neutral-950 p-6 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Draft preview</p>
          <button onClick={onClose} className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Phone bezel */}
        <div className="w-[300px] rounded-[2.5rem] border-[10px] border-neutral-900 dark:border-neutral-800 bg-neutral-900 dark:bg-neutral-800 shadow-2xl overflow-hidden">
          {/* Notch */}
          <div className="relative h-6 bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center">
            <div className="h-3.5 w-24 rounded-full bg-black" />
          </div>
          {/* Screen */}
          <div className="h-[560px] overflow-y-auto bg-white dark:bg-neutral-900">
            {children}
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-400 text-center">
          This is not yet published — learners won&apos;t see this until you publish it.
        </p>
      </div>
    </div>
  );
}
