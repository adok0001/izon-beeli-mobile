"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit, ChevronLeft, ChevronRight, Eye, Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsStats {
  total: number;
  avgAccuracy: string | null;
  avgDurationMs: string | null;
  avgQuestions: string | null;
}

interface ByLanguage {
  languageId: string;
  total: number;
  avgAccuracy: string | null;
}

interface DailyCount { date: string; attempts: number }

interface AnalyticsResponse {
  stats: AnalyticsStats;
  byLanguage: ByLanguage[];
  daily: DailyCount[];
}

interface QuizResult {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  languageId: string;
  score: number;
  accuracy: number;
  durationMs: number;
  questionCount: number;
  createdAt: string;
}

interface ResultsResponse {
  results: QuizResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface QuizConfig {
  "quiz.xp_multiplier": string;
  "quiz.max_question_count": string;
  "quiz.min_vocabulary_count": string;
}

interface PreviewQuestion {
  id: string;
  type: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";
const labelCls = "text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block";

type Tab = "analytics" | "results" | "configuration" | "preview";

const TABS: { id: Tab; label: string }[] = [
  { id: "analytics", label: "Analytics" },
  { id: "results", label: "Results" },
  { id: "configuration", label: "Configuration" },
  { id: "preview", label: "Preview" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminQuizPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<Tab>("analytics");

  async function tok() {
    return (await getToken()) ?? undefined;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit className="h-5 w-5" />
          <h1 className="font-display font-bold text-2xl">Quiz Controls</h1>
        </div>
        <p className="text-sm text-neutral-500">Analytics, results management, configuration, and question preview.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all",
              tab === id
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "analytics" && <AnalyticsTab tok={tok} />}
      {tab === "results" && <ResultsTab tok={tok} />}
      {tab === "configuration" && <ConfigurationTab tok={tok} />}
      {tab === "preview" && <PreviewTab />}
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────────────────

function AnalyticsTab({ tok }: { tok: () => Promise<string | undefined> }) {
  const [languageId, setLanguageId] = useState("");

  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ["admin-quiz-analytics", languageId],
    queryFn: async () => {
      const params = languageId ? `?languageId=${encodeURIComponent(languageId)}` : "";
      return apiFetch<AnalyticsResponse>(`/quiz/admin/analytics${params}`, { token: await tok() });
    },
  });

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelector value={languageId} onChange={setLanguageId} placeholder="All languages" />
        {languageId && (
          <button
            onClick={() => setLanguageId("")}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total quizzes" value={stats?.total ?? 0} />
          <StatCard
            label="Avg accuracy"
            value={stats?.avgAccuracy ? `${Math.round(parseFloat(stats.avgAccuracy))}%` : "—"}
          />
          <StatCard
            label="Avg duration"
            value={stats?.avgDurationMs ? fmtDuration(parseFloat(stats.avgDurationMs)) : "—"}
          />
          <StatCard
            label="Avg questions"
            value={stats?.avgQuestions ? Math.round(parseFloat(stats.avgQuestions)) : "—"}
          />
        </div>
      )}

      {!languageId && (data?.byLanguage?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">By language</h2>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500">Language</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500">Quizzes</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500">Avg accuracy</th>
                </tr>
              </thead>
              <tbody>
                {data!.byLanguage.map((row) => (
                  <tr key={row.languageId} className="border-b last:border-0 border-neutral-100 dark:border-neutral-800">
                    <td className="px-4 py-2.5 font-medium">{row.languageId}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.total}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {row.avgAccuracy ? `${Math.round(parseFloat(row.avgAccuracy))}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(data?.daily?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Daily attempts (last 30 days)</h2>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800/60">
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {[...data!.daily].reverse().map((row) => (
                  <tr key={row.date} className="border-b last:border-0 border-neutral-100 dark:border-neutral-800">
                    <td className="px-4 py-2.5">{row.date}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && (data?.daily?.length ?? 0) === 0 && (
        <p className="text-center py-12 text-sm text-neutral-400">No quiz data yet.</p>
      )}
    </div>
  );
}

// ── Results tab ───────────────────────────────────────────────────────────────

function ResultsTab({ tok }: { tok: () => Promise<string | undefined> }) {
  const qc = useQueryClient();
  const [languageId, setLanguageId] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<ResultsResponse>({
    queryKey: ["admin-quiz-results", languageId, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (languageId) params.set("languageId", languageId);
      return apiFetch<ResultsResponse>(`/quiz/admin/results?${params}`, { token: await tok() });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/quiz/admin/results/${id}`, { method: "DELETE", token: await tok() }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-quiz-results"] });
      void qc.invalidateQueries({ queryKey: ["admin-quiz-analytics"] });
      toast.success("Result deleted");
    },
    onError: () => toast.error("Failed to delete result"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelector value={languageId} onChange={(v) => { setLanguageId(v); setPage(1); }} placeholder="All languages" />
        {languageId && (
          <button
            onClick={() => { setLanguageId(""); setPage(1); }}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors"
          >
            Clear filter
          </button>
        )}
        {data && (
          <span className="text-xs text-neutral-400 ml-auto">{data.total} result{data.total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : (data?.results.length ?? 0) === 0 ? (
        <p className="text-center py-12 text-sm text-neutral-400">No results found.</p>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500">Lang</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500">Accuracy</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500">Qs</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500">Duration</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500">Date</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data!.results.map((r) => (
                <tr key={r.id} className="border-b last:border-0 border-neutral-100 dark:border-neutral-800">
                  <td className="px-4 py-2.5">
                    <div className="font-medium truncate max-w-[140px]">{r.userName}</div>
                    <div className="text-xs text-neutral-400 truncate max-w-[140px]">{r.userEmail}</div>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500">{r.languageId}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    <span className={cn("font-semibold", r.accuracy >= 80 ? "text-green-600 dark:text-green-400" : r.accuracy >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500")}>
                      {r.accuracy}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-500">{r.questionCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-500">{fmtDuration(r.durationMs)}</td>
                  <td className="px-4 py-2.5 text-xs text-neutral-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => remove.mutate(r.id)}
                      disabled={remove.isPending}
                      className="text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Delete result"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-neutral-500">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Configuration tab ─────────────────────────────────────────────────────────

function ConfigurationTab({ tok }: { tok: () => Promise<string | undefined> }) {
  const { data: config, isLoading } = useQuery<QuizConfig>({
    queryKey: ["admin-quiz-config"],
    queryFn: async () => apiFetch<QuizConfig>("/quiz/admin/config", { token: await tok() }),
  });

  const [xpMultiplier, setXpMultiplier] = useState("");
  const [maxQuestions, setMaxQuestions] = useState("");
  const [minVocab, setMinVocab] = useState("");

  useEffect(() => {
    if (!config) return;
    setXpMultiplier(config["quiz.xp_multiplier"]);
    setMaxQuestions(config["quiz.max_question_count"]);
    setMinVocab(config["quiz.min_vocabulary_count"]);
  }, [config]);

  const [saving, setSaving] = useState(false);

  async function saveConfig() {
    setSaving(true);
    try {
      const token = await tok();
      const entries: [string, string][] = [
        ["quiz.xp_multiplier", xpMultiplier],
        ["quiz.max_question_count", maxQuestions],
        ["quiz.min_vocabulary_count", minVocab],
      ];
      await Promise.all(
        entries.map(([key, value]) =>
          apiFetch("/admin/config", {
            method: "PATCH",
            body: JSON.stringify({ key, value }),
            token,
          })
        )
      );
      toast.success("Configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <div className="h-40 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />;
  }

  return (
    <div className="max-w-sm space-y-5">
      <p className="text-sm text-neutral-500">
        Changes take effect within 60 seconds (server-side cache TTL).
      </p>
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        <div>
          <label className={labelCls}>XP multiplier</label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="10"
            value={xpMultiplier}
            onChange={(e) => setXpMultiplier(e.target.value)}
            className={fieldCls}
          />
          <p className="text-xs text-neutral-400 mt-1">XP = max(1, round(accuracy% × questions × multiplier))</p>
        </div>
        <div>
          <label className={labelCls}>Max question count</label>
          <input
            type="number"
            step="1"
            min="1"
            max="100"
            value={maxQuestions}
            onChange={(e) => setMaxQuestions(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div>
          <label className={labelCls}>Min vocabulary threshold</label>
          <input
            type="number"
            step="1"
            min="1"
            value={minVocab}
            onChange={(e) => setMinVocab(e.target.value)}
            className={fieldCls}
          />
          <p className="text-xs text-neutral-400 mt-1">Minimum entries needed to generate a quiz for a scope.</p>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Preview tab ───────────────────────────────────────────────────────────────

function PreviewTab() {
  const [languageId, setLanguageId] = useState("izon");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [count, setCount] = useState("10");
  const [questions, setQuestions] = useState<PreviewQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!languageId) return;
    setLoading(true);
    setError(null);
    setQuestions(null);
    try {
      const params = new URLSearchParams({ languageId, count });
      if (courseId) params.set("courseId", courseId);
      if (lessonId) params.set("lessonId", lessonId);
      const qs = await apiFetch<PreviewQuestion[]>(`/quiz/questions?${params}`);
      setQuestions(qs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500">
        Preview which questions would be generated for a given scope without recording a quiz attempt.
      </p>

      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Language</label>
            <LanguageSelector value={languageId} onChange={setLanguageId} />
          </div>
          <div>
            <label className={labelCls}>Question count</label>
            <input
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls}>Course ID (optional)</label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="Leave blank for all vocabulary"
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls}>Lesson ID (optional)</label>
            <input
              type="text"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              placeholder="Leave blank for course scope"
              className={fieldCls}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={generate}
            disabled={loading || !languageId}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-40 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            {loading ? "Generating…" : "Generate preview"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {questions && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">{questions.length} question{questions.length !== 1 ? "s" : ""} generated</p>
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Q{i + 1}</span>
                  <p className="text-base font-bold mt-0.5">{q.prompt}</p>
                </div>
                <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded px-2 py-0.5 whitespace-nowrap">
                  {q.type}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt) => (
                  <div
                    key={opt}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm border",
                      opt === q.correctAnswer
                        ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                    )}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}
