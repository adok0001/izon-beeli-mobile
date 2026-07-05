"use client";

export interface PreviewLessonSegment {
  text: string;
  translation: string;
}

export interface PreviewLesson {
  title: string;
  description: string;
  type: string;
  segments: PreviewLessonSegment[];
}

/** Web's lesson editors only author title/description/transcript (no
 * vocab/objectives — that's a different lesson type) — same scope as the
 * mobile lesson editor's preview, just laid out inside the phone frame. */
export function LessonPreviewCard({ lesson }: Readonly<{ lesson: PreviewLesson }>) {
  return (
    <div className="px-5 py-8">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-500">
        {lesson.type || "Lesson"}
      </p>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{lesson.title || "Untitled"}</h1>
      {lesson.description && (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{lesson.description}</p>
      )}

      {lesson.segments.filter((s) => s.text.trim()).length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Transcript</p>
          <div className="space-y-3">
            {lesson.segments
              .filter((s) => s.text.trim())
              .map((s, i) => (
                <div key={i}>
                  <p className="text-sm text-neutral-900 dark:text-white">{s.text}</p>
                  {s.translation && (
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{s.translation}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
