"use client";

import { apiFetch } from "@/lib/api";
import { ImportResultView } from "@/components/studio/import-result-view";
import type { ImportResult } from "@/lib/import-types";
import { LESSON_LINE_GUIDE, LESSON_META_GUIDE, LESSON_TEMPLATE_CSV, parseLessonFile } from "@/lib/lesson-import";
import { download } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  languageId: string;
}

/**
 * Bulk-import lessons into one course. One file is one full lesson (metadata
 * block + transcript grid); the educator can pick several files at once. The
 * course is picked here, not in the sheet, so there's no opaque course id.
 */
export function LessonImportPanel({ languageId }: Readonly<{ languageId: string }>) {
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [courseId, setCourseId] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [entries, setEntries] = useState<unknown[] | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const { data: allCourses } = useQuery<Course[]>({
    queryKey: ["educator", "courses"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>("/educator/courses", { token: token ?? undefined });
    },
  });
  const courses = useMemo(
    () => (allCourses ?? []).filter((c) => c.languageId === languageId),
    [allCourses, languageId],
  );
  const activeCourseId = courseId || courses[0]?.id || "";

  const reset = () => { setResult(null); setEntries(null); setFileNames([]); };

  const post = (lessons: unknown[], dryRun: boolean) =>
    getToken().then((token) =>
      apiFetch<ImportResult>("/import/lessons", {
        method: "POST",
        body: JSON.stringify({ languageId, courseId: activeCourseId, entries: lessons, dryRun }),
        token: token ?? undefined,
      }),
    );

  const handleFiles = async (files: FileList) => {
    reset();
    try {
      const list = Array.from(files);
      const lessons = await Promise.all(list.map((f) => f.text().then(parseLessonFile)));
      setFileNames(list.map((f) => f.name));
      setEntries(lessons);
      setRunning(true);
      setResult(await post(lessons, true));
    } catch (e) {
      toast.error("Failed to read files", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const confirm = async () => {
    if (!entries) return;
    setRunning(true);
    try {
      const res = await post(entries, false);
      setResult(res);
      const where = res.resultStatus === "in_review" ? "staged for review" : "published live";
      toast.success(`Imported ${res.inserted} lessons — ${where}`);
      setEntries(null);
    } catch (e) {
      toast.error("Import failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Import lessons</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          One file is one full lesson — a metadata block, a <code>---</code> line, then the transcript grid. Pick several
          files to import several lessons at once. They all go into the course you choose below.
        </p>

        <label htmlFor="lesson-course" className="block text-xs font-medium text-neutral-500 mb-1">Course</label>
        {courses.length === 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
            This language has no course yet — create one first, then import lessons into it.
          </p>
        ) : (
          <select
            id="lesson-course"
            value={activeCourseId}
            onChange={(e) => { setCourseId(e.target.value); reset(); }}
            className="mb-4 w-full max-w-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-2 py-1.5 text-neutral-900 dark:text-white"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        )}

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">Metadata (before ---)</p>
            <ul className="space-y-1">
              {LESSON_META_GUIDE.map((g) => (
                <li key={g.key} className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{g.key}</span> — {g.uses}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">Transcript (after ---)</p>
            <ul className="space-y-1">
              {LESSON_LINE_GUIDE.map((g) => (
                <li key={g.column} className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{g.column}</span> — {g.uses}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { reset(); fileRef.current?.click(); }}
            disabled={running || !activeCourseId}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {fileNames.length > 0 ? "Replace files" : "Choose CSV file(s)"}
          </button>
          {fileNames.length > 0 && (
            <span className="text-xs text-neutral-500 truncate max-w-xs">
              {fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`}
            </span>
          )}
          <span className="flex-1" />
          <button onClick={() => download("lesson-template.csv", LESSON_TEMPLATE_CSV, "text/csv")}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            <Download className="h-3.5 w-3.5" /> Download template
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" multiple className="hidden"
          onChange={(e) => { const fs = e.target.files; if (fs && fs.length) void handleFiles(fs); e.target.value = ""; }} />
      </div>

      {running && (
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Processing…
        </div>
      )}

      {result && (
        <ImportResultView
          result={result}
          running={running}
          unit="lessons"
          onConfirm={entries ? () => void confirm() : undefined}
          onCancel={reset}
        />
      )}
    </div>
  );
}
