"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, ChevronLeft, Clock, ExternalLink, Loader2, Plus, Search, X, XCircle } from "lucide-react";
import { useState } from "react";
import { ErrorMsg, fieldCls, Label } from "../_components/shared";
import { useForm } from "../_components/use-form";

const REVIEWER_ROLES = [
  { id: "teacher", label: "Teacher", description: "You teach a language in a formal or informal setting." },
  { id: "professor", label: "Professor", description: "You have an academic background in linguistics or language education." },
  { id: "elder", label: "Elder / Community Leader", description: "You are a native speaker or cultural authority within your language community." },
] as const;

interface ReviewerApp {
  id: string;
  role: string;
  languages: string[];
  status: "pending" | "approved" | "rejected";
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface ReviewerState {
  role: string;
  background: string;
  reason: string;
  selectedLangs: string[];
  error: string | null;
}

export function ReviewerFlow({ onBack }: Readonly<{ onBack: () => void }>) {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const [state, set] = useForm<ReviewerState>({
    role: "teacher",
    background: "",
    reason: "",
    selectedLangs: [],
    error: null,
  });
  const { role, background, reason, selectedLangs, error } = state;

  const { data: existing, isLoading } = useQuery<ReviewerApp | null>({
    queryKey: ["reviewer-application-me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ReviewerApp | null>("/reviewer-applications/me", { token: token ?? undefined });
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/reviewer-applications", {
        method: "POST",
        body: JSON.stringify({ role, background: background.trim(), reason: reason.trim(), languages: selectedLangs }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["reviewer-application-me"] }),
    onError: (err: Error) => set({ error: err.message }),
  });

  function toggleLang(id: string) {
    set({ selectedLangs: selectedLangs.includes(id) ? selectedLangs.filter((l) => l !== id) : [...selectedLangs, id] });
  }

  // Header
  const header = (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div>
        <h2 className="font-bold text-neutral-900 dark:text-white">Become a Reviewer</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Help curate content for your language community</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (existing?.status === "pending") {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6 flex flex-col items-center text-center gap-3">
          <Clock className="h-10 w-10 text-amber-500" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Application Under Review</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
              Your application as a <strong>{existing.role}</strong> is being reviewed. We&apos;ll notify you once a decision has been made.
            </p>
          <p className="text-xs text-neutral-400">
            Submitted {new Date(existing.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  if (existing?.status === "approved") {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-6 flex flex-col items-center text-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <h3 className="font-bold text-neutral-900 dark:text-white">You&apos;re a Reviewer!</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
            Your application was approved. You can now access the educator panel to review contributions.
          </p>
          <a
            href="/educator"
            className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Go to Educator Panel <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (existing?.status === "rejected") {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6 flex flex-col items-center text-center gap-3 mb-6">
          <XCircle className="h-10 w-10 text-red-400" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Application Not Approved</h3>
          {existing.reviewerNote && (
            <p className="text-sm text-red-700 dark:text-red-300 max-w-xs">{existing.reviewerNote}</p>
          )}
          <p className="text-xs text-neutral-400">You may submit a new application below.</p>
        </div>
        {/* Fall through to form */}
        <ReviewerForm
          role={role} setRole={(v) => set({ role: v })}
          background={background} setBackground={(v) => set({ background: v })}
          reason={reason} setReason={(v) => set({ reason: v })}
          selectedLangs={selectedLangs} toggleLang={toggleLang}
          error={error}
          pending={submit.isPending}
          onSubmit={() => submit.mutate()}
        />
      </div>
    );
  }

  // No existing application
  return (
    <div>
      {header}
      <ReviewerForm
        role={role} setRole={(v) => set({ role: v })}
        background={background} setBackground={(v) => set({ background: v })}
        reason={reason} setReason={(v) => set({ reason: v })}
        selectedLangs={selectedLangs} toggleLang={toggleLang}
        error={error}
        pending={submit.isPending}
        onSubmit={() => submit.mutate()}
      />
    </div>
  );
}

function ReviewerForm({
  role, setRole,
  background, setBackground,
  reason, setReason,
  selectedLangs, toggleLang,
  error, pending, onSubmit,
}: Readonly<{
  role: string; setRole: (v: string) => void;
  background: string; setBackground: (v: string) => void;
  reason: string; setReason: (v: string) => void;
  selectedLangs: string[]; toggleLang: (id: string) => void;
  error: string | null; pending: boolean; onSubmit: () => void;
}>) {
  const [langSearch, setLangSearch] = useState("");
  const customLangName = langSearch.trim();
  const filteredLangs = LANGUAGES.filter((lang) => {
    const q = langSearch.toLowerCase();
    return !q || lang.name.toLowerCase().includes(q) || lang.nativeName.toLowerCase().includes(q) || lang.region.toLowerCase().includes(q);
  });
  const isExactMatch = LANGUAGES.some((l) => l.name.toLowerCase() === customLangName.toLowerCase() || l.id.toLowerCase() === customLangName.toLowerCase());
  const canSubmit = background.trim().length >= 20 && reason.trim().length >= 20 && selectedLangs.length > 0;
  return (
    <div className="space-y-5">
      <div>
        <Label>Your role</Label>
        <div className="grid gap-2 mt-1">
          {REVIEWER_ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={cn(
                "text-left px-4 py-3 rounded-xl border-2 transition-colors",
                role === r.id
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700"
              )}
            >
              <span className="block text-sm font-semibold text-neutral-900 dark:text-white">{r.label}</span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{r.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Languages you can review</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
          <input
            className={cn(fieldCls, "pl-9")}
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            placeholder="Search or type a language…"
          />
          {langSearch && (
            <button type="button" onClick={() => setLangSearch("")} className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {customLangName && !isExactMatch && (
          <button
            type="button"
            onClick={() => { toggleLang(customLangName); setLangSearch(""); }}
            className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add &quot;{customLangName}&quot;
          </button>
        )}
        {selectedLangs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedLangs.map((id) => {
              const lang = LANGUAGES.find((l) => l.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {lang?.name ?? id}
                  <button type="button" onClick={() => toggleLang(id)} className="ml-0.5 hover:text-indigo-900 dark:hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
          {filteredLangs.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => toggleLang(lang.id)}
              className={cn(
                "flex items-center justify-between text-left px-3 py-2 rounded-xl border transition-colors",
                selectedLangs.includes(lang.id)
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700"
              )}
            >
              <span>
                <span className="block text-xs font-medium text-neutral-900 dark:text-white">{lang.name}</span>
                <span className="block text-[10px] text-neutral-400">{lang.nativeName} · {lang.region}</span>
              </span>
              {selectedLangs.includes(lang.id) && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
            </button>
          ))}
        </div>
        {selectedLangs.length === 0 && (
          <p className="text-xs text-neutral-400 mt-1">Select at least one language</p>
        )}
      </div>

      <div>
        <Label>Your background</Label>
        <textarea
          className={cn(fieldCls, "resize-none")}
          rows={3}
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder="Describe your background with this language (native speaker, teacher, researcher, etc.)"
        />
        <p className="text-xs text-neutral-400 mt-1">{background.trim().length}/3000</p>
      </div>

      <div>
        <Label>Why do you want to be a reviewer?</Label>
        <textarea
          className={cn(fieldCls, "resize-none")}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you'd like to review contributions for this language"
        />
        <p className="text-xs text-neutral-400 mt-1">{reason.trim().length}/3000</p>
      </div>

      <ErrorMsg msg={error} />

      <button
        type="button"
        onClick={onSubmit}
        disabled={pending || !canSubmit}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Application"}
      </button>
    </div>
  );
}
