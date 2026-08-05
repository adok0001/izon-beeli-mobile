"use client";

import { apiFetch } from "@/lib/api";
import { ImportResultView } from "@/components/studio/import-result-view";
import type { ImportResult } from "@/lib/import-types";
import {
  buildLessonsFile,
  LESSON_LINE_GUIDE,
  LESSON_META_GUIDE,
  LESSON_TEMPLATE_CSV,
  lessonExportFilename,
  parseLessonFiles,
} from "@/lib/lesson-import";
import type { LessonExport } from "@mobile/lib/lesson-import";
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

interface CourseLesson {
  id: string;
  courseId: string;
  title: string;
  type: string;
}

/**
 * Bulk import **and export** lessons for one course.
 *
 * A file holds one or more lessons, separated by `===`; the educator can also
 * pick several files at once. The course is chosen here rather than in the
 * sheet, so there is no opaque course id to copy around.
 *
 * The export scopes to the whole Movement by default, or to individually ticked
 * lessons, and hands back a single file — the same file this panel uploads.
 */
export function LessonImportPanel({ languageId }: Readonly<{ languageId: string }>) {
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [courseId, setCourseId] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [entries, setEntries] = useState<unknown[] | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  // Empty means the whole Movement — the common case, and the one with no clicking.
  const [picked, setPicked] = useState<Set<string>>(new Set());

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

  const { data: allLessons } = useQuery<CourseLesson[]>({
    queryKey: ["educator", "lessons"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<CourseLesson[]>("/educator/lessons", { token: token ?? undefined });
    },
  });
  const courseLessons = useMemo(
    () => (allLessons ?? []).filter((l) => l.courseId === activeCourseId),
    [allLessons, activeCourseId],
  );

  const reset = () => { setResult(null); setEntries(null); setFileNames([]); };

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const exportLessons = async () => {
    setRunning(true);
    try {
      const query = new URLSearchParams({ languageId, courseId: activeCourseId });
      if (picked.size > 0) query.set("ids", [...picked].join(","));
      const token = await getToken();
      const data = await apiFetch<LessonExport>(`/import/lesson-export?${query}`, { token: token ?? undefined });
      if (data.lessonCount === 0) { toast.error("No lessons to export in that course"); return; }
      download(lessonExportFilename(activeCourseId), buildLessonsFile(data.lessons), "text/csv");
      if (data.truncated) {
        toast.warning(`${data.totalCount} lessons in this course`, {
          description: `You can upload ${data.cap} at a time, so only the first ${data.lessonCount} are in this file. Tick the ones you need instead.`,
        });
      }
    } catch (e) {
      toast.error("Export failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

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
      // Several files, and several lessons per file — an exported Movement is one sheet.
      const lessons = (await Promise.all(list.map((f) => f.text().then(parseLessonFiles)))).flat();
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
          A lesson is a metadata block, a <code>---</code> line, then the transcript grid. One file may hold several
          lessons with a <code>===</code> line between them — which is what the export below hands back, so you can
          upload it straight back. They all go into the course you choose below.
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

      {activeCourseId && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Export lessons to fix</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            {picked.size === 0
              ? `Exports all ${courseLessons.length} lessons in this Movement. Tick lessons to narrow it.`
              : `Exports the ${picked.size} ticked lesson${picked.size === 1 ? "" : "s"}.`}{" "}
            They arrive as one file — edit it and upload it straight back.
          </p>

          {courseLessons.length > 0 && (
            <div className="mb-4 max-h-56 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              {courseLessons.map((lesson) => (
                <label key={lesson.id} className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                  <input type="checkbox" checked={picked.has(lesson.id)} onChange={() => toggle(lesson.id)} />
                  <span className="flex-1 truncate">{lesson.title}</span>
                  {lesson.type === "game" && (
                    <span className="text-[10px] font-semibold uppercase text-neutral-400">Gate</span>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void exportLessons()}
              disabled={running}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            {picked.size > 0 && (
              <button onClick={() => setPicked(new Set())}
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}

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
