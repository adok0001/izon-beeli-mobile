"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EtymologyNode {
  era: string;
  form: string;
  language: string;
  note: string;
}

interface EtymologyEntry {
  id: string;
  languageId: string;
  word: string;
  english: string;
  trail: EtymologyNode[];
}

const BLANK_ENTRY: Omit<EtymologyEntry, "id"> = {
  languageId: "",
  word: "",
  english: "",
  trail: [{ era: "", form: "", language: "", note: "" }],
};

const BLANK_NODE: EtymologyNode = { era: "", form: "", language: "", note: "" };

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

const labelCls =
  "block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1";

// ---------- TrailEditor ----------

function TrailEditor({
  trail,
  onChange,
}: {
  trail: EtymologyNode[];
  onChange: (trail: EtymologyNode[]) => void;
}) {
  function update(i: number, field: keyof EtymologyNode, value: string) {
    const next = trail.map((n, idx) => (idx === i ? { ...n, [field]: value } : n));
    onChange(next);
  }

  function add() {
    onChange([...trail, { ...BLANK_NODE }]);
  }

  function remove(i: number) {
    onChange(trail.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      {trail.map((node, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 space-y-2 relative">
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={trail.length === 1}
            className="absolute top-2 right-2 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30"
          >
            <X className="h-3 w-3 text-neutral-400" />
          </button>
          <p className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">Node {i + 1}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Era</label>
              <input className={fieldCls} value={node.era} placeholder="e.g. Proto-Yoruboid (~1000 BCE)" onChange={(e) => update(i, "era", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Form</label>
              <input className={fieldCls} value={node.form} placeholder="e.g. *imo" onChange={(e) => update(i, "form", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <input className={fieldCls} value={node.language} placeholder="e.g. Proto-Yoruboid" onChange={(e) => update(i, "language", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Note</label>
            <textarea className={cn(fieldCls, "resize-none")} rows={2} value={node.note} placeholder="Historical context…" onChange={(e) => update(i, "note", e.target.value)} />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add node
      </button>
    </div>
  );
}

// ---------- EditDrawer ----------

type DraftEntry = Omit<EtymologyEntry, "id"> & { id?: string };

interface DrawerProps {
  draft: DraftEntry;
  onSave: (entry: DraftEntry) => void;
  onClose: () => void;
  isNew: boolean;
  isSaving: boolean;
}

function EditDrawer({ draft: initial, onSave, onClose, isNew, isSaving }: DrawerProps) {
  const [d, setD] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  function set<K extends keyof typeof d>(field: K, value: typeof d[K]) {
    setD((prev) => ({ ...prev, [field]: value }));
  }

  const valid = d.languageId.trim() && d.word.trim() && d.english.trim() && d.trail.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div ref={ref} className="w-full max-w-lg h-full overflow-y-auto bg-white dark:bg-neutral-900 shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {isNew ? "New entry" : "Edit entry"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Word <span className="text-red-400">*</span></label>
              <input className={fieldCls} value={d.word} placeholder="e.g. Ìmọ̀" onChange={(e) => set("word", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>English <span className="text-red-400">*</span></label>
              <input className={fieldCls} value={d.english} placeholder="e.g. Knowledge" onChange={(e) => set("english", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Language ID <span className="text-red-400">*</span></label>
            <input
              className={fieldCls}
              value={d.languageId}
              placeholder="e.g. yoruba"
              onChange={(e) => set("languageId", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            />
          </div>

          <div>
            <label className={cn(labelCls, "mb-2")}>Trail nodes <span className="text-red-400">*</span></label>
            <TrailEditor trail={d.trail} onChange={(trail) => set("trail", trail)} />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 bg-white dark:bg-neutral-900 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            disabled={!valid || isSaving}
            onClick={() => onSave(d)}
            className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function EtymologyAdminPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [drawer, setDrawer] = useState<{ entry: EtymologyEntry | null; isNew: boolean } | null>(null);
  const [langFilter, setLangFilter] = useState("all");

  const { data: entries = [], isLoading } = useQuery<EtymologyEntry[]>({
    queryKey: ["etymology-admin"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EtymologyEntry[]>("/etymology", { token: token ?? undefined });
    },
  });

  const langs = ["all", ...new Set(entries.map((e) => e.languageId))];
  const visible = langFilter === "all" ? entries : entries.filter((e) => e.languageId === langFilter);

  const saveMutation = useMutation({
    mutationFn: async (entry: DraftEntry) => {
      const token = await getToken();
      const isNew = !entry.id;
      return apiFetch<EtymologyEntry>(
        isNew ? "/etymology/admin" : `/etymology/admin/${entry.id}`,
        { method: isNew ? "POST" : "PATCH", body: JSON.stringify(entry), token: token ?? undefined }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["etymology-admin"] });
      setDrawer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/etymology/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etymology-admin"] }),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Etymology Trail</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{entries.length} entries</p>
        </div>
        <button
          onClick={() => setDrawer({ entry: null, isNew: true })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New entry
        </button>
      </div>

      {/* Language filter pills */}
      <div className="flex flex-wrap gap-2">
        {langs.map((lang) => (
          <button
            key={lang}
            onClick={() => setLangFilter(lang)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
              langFilter === lang
                ? "bg-brand-600 text-white border-brand-600"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-brand-400"
            )}
          >
            {lang === "all" ? "All" : lang.charAt(0).toUpperCase() + lang.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-neutral-400">No entries yet.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-neutral-900 dark:text-white">{entry.word}</span>
                  <span className="text-xs text-neutral-400">·</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{entry.english}</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {entry.languageId}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">{entry.trail.length} era{entry.trail.length !== 1 ? "s" : ""}: {entry.trail.map((n) => n.era).join(" → ")}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setDrawer({ entry, isNew: false })}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${entry.word}"?`)) deleteMutation.mutate(entry.id);
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {drawer && (
        <EditDrawer
          draft={drawer.entry ?? { ...BLANK_ENTRY }}
          isNew={drawer.isNew}
          isSaving={saveMutation.isPending}
          onClose={() => setDrawer(null)}
          onSave={(entry) => saveMutation.mutate(entry)}
        />
      )}
    </div>
  );
}
