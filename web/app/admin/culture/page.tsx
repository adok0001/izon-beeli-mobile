"use client";

import { apiFetch } from "@/lib/api";
import type { DiscoverItem } from "@/app/(app)/culture/culture-client";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Clapperboard,
  ExternalLink,
  Mic2,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---------- types ----------

const BLANK: DiscoverItem = {
  id: "",
  type: "blog",
  title: "",
  description: "",
  author: "",
  publishedAt: new Date().toISOString().slice(0, 10) + "T08:00:00Z",
  duration: 300,
  coverGradient: ["#0F2A4A", "#0D0F1A"],
  coverEmoji: "📝",
  featured: false,
  contentUrl: "",
  body: "",
  showNotes: "",
  audioUrl: "",
  storyId: "",
};

const TYPE_CFG = {
  blog:    { color: "#38bdf8", label: "BLOG",    icon: BookOpen },
  podcast: { color: "#a855f7", label: "PODCAST", icon: Mic2 },
  film:    { color: "#fb923c", label: "FILM",    icon: Clapperboard },
} as const;

function formatDuration(s: number) {
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`;
}

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

const labelCls = "block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1";

// ---------- TypeBadge ----------

function TypeBadge({ type }: { type: DiscoverItem["type"] }) {
  const cfg = TYPE_CFG[type];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest"
      style={{ backgroundColor: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ---------- EditDrawer ----------

interface DrawerProps {
  draft: DiscoverItem;
  onSave: (item: DiscoverItem) => void;
  onClose: () => void;
  isNew: boolean;
  isSaving: boolean;
}

function EditDrawer({ draft: initial, onSave, onClose, isNew, isSaving }: DrawerProps) {
  const [d, setD] = useState<DiscoverItem>(initial);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  function set(field: keyof DiscoverItem, value: unknown) {
    setD((prev) => ({ ...prev, [field]: value }));
  }

  const valid = d.id.trim() && d.title.trim() && d.author.trim();

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div ref={ref} className="w-full max-w-lg h-full overflow-y-auto bg-white dark:bg-neutral-900 shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {isNew ? "New item" : "Edit item"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>ID <span className="text-red-400">*</span></label>
            <input
              className={fieldCls}
              value={d.id}
              onChange={(e) => set("id", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="blog-004"
              disabled={!isNew}
            />
            {!isNew && <p className="text-[11px] text-neutral-400 mt-1">ID cannot be changed after creation.</p>}
          </div>

          <div>
            <label className={labelCls}>Type <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              {(["blog", "podcast", "film"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => set("type", t)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                    d.type === t
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300"
                  )}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Title <span className="text-red-400">*</span></label>
            <input className={fieldCls} value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Article title" />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea className={`${fieldCls} resize-none`} rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Short summary shown on the card" />
          </div>

          <div>
            <label className={labelCls}>Author <span className="text-red-400">*</span></label>
            <input className={fieldCls} value={d.author} onChange={(e) => set("author", e.target.value)} placeholder="Amara Nwosu" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Published at</label>
              <input type="date" className={fieldCls} value={d.publishedAt.slice(0, 10)} onChange={(e) => set("publishedAt", e.target.value + "T08:00:00Z")} />
            </div>
            <div>
              <label className={labelCls}>Duration (seconds)</label>
              <input type="number" className={fieldCls} value={d.duration} min={0} onChange={(e) => set("duration", Number(e.target.value))} />
              <p className="text-[11px] text-neutral-400 mt-1">{formatDuration(d.duration)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Emoji</label>
              <input className={fieldCls} value={d.coverEmoji} onChange={(e) => set("coverEmoji", e.target.value)} placeholder="🎙️" />
            </div>
            <div>
              <label className={labelCls}>Gradient from</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-9 rounded cursor-pointer border border-neutral-200 dark:border-neutral-700" value={d.coverGradient[0]} onChange={(e) => set("coverGradient", [e.target.value, d.coverGradient[1]])} />
                <input className={fieldCls} value={d.coverGradient[0]} onChange={(e) => set("coverGradient", [e.target.value, d.coverGradient[1]])} placeholder="#0F2A4A" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Gradient to</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-9 rounded cursor-pointer border border-neutral-200 dark:border-neutral-700" value={d.coverGradient[1]} onChange={(e) => set("coverGradient", [d.coverGradient[0], e.target.value])} />
                <input className={fieldCls} value={d.coverGradient[1]} onChange={(e) => set("coverGradient", [d.coverGradient[0], e.target.value])} placeholder="#0D0F1A" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => set("featured", !d.featured)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                d.featured ? "bg-brand-500" : "bg-neutral-300 dark:bg-neutral-600"
              )}
            >
              <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", d.featured ? "translate-x-5" : "translate-x-0.5")} />
            </button>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none" onClick={() => set("featured", !d.featured)}>
              Featured
            </label>
          </div>

          <div>
            <label className={labelCls}>Content URL (escape hatch)</label>
            <input className={fieldCls} value={d.contentUrl ?? ""} onChange={(e) => set("contentUrl", e.target.value)} placeholder="https://beeli.app/blog/..." />
          </div>

          {d.type === "podcast" && (
            <div>
              <label className={labelCls}>Audio URL</label>
              <input className={fieldCls} value={d.audioUrl ?? ""} onChange={(e) => set("audioUrl", e.target.value)} placeholder="https://cdn.beeli.app/podcast/ep-xx.mp3" />
            </div>
          )}

          {d.type === "film" && (
            <div>
              <label className={labelCls}>Story ID (interactive story — leave blank for synopsis only)</label>
              <input className={fieldCls} value={d.storyId ?? ""} onChange={(e) => set("storyId", e.target.value)} placeholder="griot-path" />
            </div>
          )}

          {d.type === "blog" && (
            <div>
              <label className={labelCls}>Body (separate paragraphs with blank line)</label>
              <textarea
                className={`${fieldCls} resize-y`}
                rows={8}
                value={d.body ?? ""}
                onChange={(e) => set("body", e.target.value)}
                placeholder={"First paragraph...\n\nSecond paragraph..."}
              />
            </div>
          )}

          {(d.type === "podcast" || d.type === "film") && (
            <div>
              <label className={labelCls}>Show notes / Synopsis</label>
              <textarea
                className={`${fieldCls} resize-y`}
                rows={8}
                value={d.showNotes ?? ""}
                onChange={(e) => set("showNotes", e.target.value)}
                placeholder="Guest bio, talking points, timestamps..."
              />
            </div>
          )}

          {/* Mini preview */}
          <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <p className="text-[9px] font-black tracking-widest text-neutral-400 uppercase px-3 pt-2.5 pb-1">Preview</p>
            <div
              className="relative h-20 flex items-end px-3 pb-3"
              style={{ background: `linear-gradient(135deg, ${d.coverGradient[0]}, ${d.coverGradient[1]})` }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-4xl opacity-[0.07] select-none">{d.coverEmoji}</span>
              <div className="relative z-10">
                <TypeBadge type={d.type} />
                <p className="text-xs font-bold text-white mt-1 line-clamp-1">{d.title || "Untitled"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-3">
          <button
            onClick={() => onSave(d)}
            disabled={!valid || isSaving}
            className="flex-1 rounded-lg py-2.5 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving…" : isNew ? "Add item" : "Save changes"}
          </button>
          <button
            onClick={onClose}
            className="px-4 rounded-lg text-sm font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- DeleteConfirm ----------

function DeleteConfirm({ item, onConfirm, onCancel, isDeleting }: { item: DiscoverItem; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 className="h-4 w-4 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">Delete item?</h3>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{item.title}</span> will be permanently deleted from the database.
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 rounded-lg py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
          <button onClick={onCancel} className="flex-1 rounded-lg py-2 text-sm font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main page ----------

type FilterType = "all" | DiscoverItem["type"];

function toApiBody(item: DiscoverItem) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    author: item.author,
    publishedAt: item.publishedAt,
    duration: item.duration,
    coverGradientFrom: item.coverGradient[0],
    coverGradientTo: item.coverGradient[1],
    coverEmoji: item.coverEmoji,
    featured: item.featured,
    storyId: item.storyId ?? null,
    audioUrl: item.audioUrl ?? null,
    contentUrl: item.contentUrl ?? null,
    body: item.body ?? null,
    showNotes: item.showNotes ?? null,
  };
}

export default function AdminCulturePage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [editing, setEditing] = useState<DiscoverItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<DiscoverItem | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const { data: items = [], isLoading } = useQuery<DiscoverItem[]>({
    queryKey: ["culture-items-admin"],
    queryFn: () => apiFetch<DiscoverItem[]>("/culture-items"),
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: async (item: DiscoverItem) => {
      const token = await getToken();
      return apiFetch<DiscoverItem>("/culture-items/admin", {
        method: "POST",
        body: JSON.stringify(toApiBody(item)),
        token: token ?? undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["culture-items-admin"] }); qc.invalidateQueries({ queryKey: ["culture-items"] }); setEditing(null); flash(); },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: DiscoverItem) => {
      const token = await getToken();
      return apiFetch<DiscoverItem>(`/culture-items/admin/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(toApiBody(item)),
        token: token ?? undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["culture-items-admin"] }); qc.invalidateQueries({ queryKey: ["culture-items"] }); setEditing(null); flash(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/culture-items/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["culture-items-admin"] }); qc.invalidateQueries({ queryKey: ["culture-items"] }); setDeleting(null); flash(); },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const token = await getToken();
      return apiFetch(`/culture-items/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ featured }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["culture-items-admin"] }); qc.invalidateQueries({ queryKey: ["culture-items"] }); },
  });

  function flash() { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2500); }

  const filtered = filterType === "all" ? items : items.filter((i) => i.type === filterType);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "all",     label: `All (${items.length})` },
    { id: "blog",    label: `Blog (${items.filter((i) => i.type === "blog").length})` },
    { id: "podcast", label: `Podcast (${items.filter((i) => i.type === "podcast").length})` },
    { id: "film",    label: `Film (${items.filter((i) => i.type === "film").length})` },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Discover Media</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage blogs, podcasts, and films shown in the Culture tab.
          </p>
        </div>
        <button
          onClick={() => { setIsNew(true); setEditing({ ...BLANK }); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>

      {savedFlash && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-2.5 mb-4 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Saved to database.
        </div>
      )}

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(({ id, label }) => {
          const active = filterType === id;
          const color = id === "blog" ? "#38bdf8" : id === "podcast" ? "#a855f7" : id === "film" ? "#fb923c" : "#f59e0b";
          return (
            <button
              key={id}
              onClick={() => setFilterType(id)}
              className="rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all"
              style={{
                backgroundColor: active ? `${color}15` : undefined,
                border: `1px solid ${active ? `${color}50` : "rgba(0,0,0,0.12)"}`,
                color: active ? color : undefined,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 hidden md:table-cell">Author</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 hidden md:table-cell">Duration</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Featured</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 transition-colors",
                    idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-neutral-50/50 dark:bg-neutral-900/30"
                  )}
                >
                  <td className="px-4 py-3"><TypeBadge type={item.type} /></td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-900 dark:text-white leading-snug line-clamp-1">{item.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">{item.id}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 hidden md:table-cell">{item.author}</td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-500 hidden md:table-cell">{formatDuration(item.duration)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleFeaturedMutation.mutate({ id: item.id, featured: !item.featured })}
                      title={item.featured ? "Unfeature" : "Feature"}
                      disabled={toggleFeaturedMutation.isPending}
                    >
                      <Star
                        className="h-4 w-4 mx-auto transition-colors"
                        style={{ fill: item.featured ? "#f59e0b" : "none", color: item.featured ? "#f59e0b" : "#d4d4d4" }}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {item.contentUrl && (
                        <a
                          href={item.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Open content URL"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => { setIsNew(false); setEditing({ ...item }); }}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(item)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-400">
                    No items match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <EditDrawer
          draft={editing}
          onSave={(item) => isNew ? createMutation.mutate(item) : updateMutation.mutate(item)}
          onClose={() => setEditing(null)}
          isNew={isNew}
          isSaving={isSaving}
        />
      )}
      {deleting && (
        <DeleteConfirm
          item={deleting}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
