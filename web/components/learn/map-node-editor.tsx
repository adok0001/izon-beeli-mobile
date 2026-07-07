"use client";

import { localizeField } from "@/lib/localize";
import { cn } from "@/lib/utils";
import type { UiLanguage } from "@/store/ui-language-store";
import type { MapNodeConfig } from "@/types";

type CourseOption = { id: string; title: string; level: string };
import { MapPin } from "lucide-react";
import { useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NodeDraft = Pick<MapNodeConfig, "communityName" | "zoneName" | "courseId" | "x" | "y" | "previewAudioUrl">;

interface MapNodeEditorProps {
  draft: NodeDraft;
  courses: CourseOption[];
  existingZones: string[];   // datalist suggestions
  uiLanguage?: UiLanguage;
  onChange: (patch: Partial<NodeDraft>) => void;
}

// ── Position picker ────────────────────────────────────────────────────────────
// Clicking anywhere on the mini canvas sets x/y as a percentage of canvas size.

function PositionPicker({ x, y, onChange }: { x: number; y: number; onChange: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const ny = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChange(Math.max(0, Math.min(100, nx)), Math.max(0, Math.min(100, ny)));
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
        Position on map
      </label>

      {/* Mini canvas */}
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative w-full cursor-crosshair rounded-xl overflow-hidden select-none",
          "border border-white/[0.08]",
        )}
        style={{
          aspectRatio: "16 / 9",
          background: "radial-gradient(ellipse at 35% 45%, #0d1226 0%, #05060e 65%)",
        }}
        aria-label="Click to set node position"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!ref.current) return;
          const step = e.shiftKey ? 5 : 1;
          if (e.key === "ArrowRight") onChange(Math.min(100, x + step), y);
          if (e.key === "ArrowLeft")  onChange(Math.max(0, x - step), y);
          if (e.key === "ArrowDown")  onChange(x, Math.min(100, y + step));
          if (e.key === "ArrowUp")    onChange(x, Math.max(0, y - step));
        }}
      >
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <pattern id="picker-grid" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.3" fill="rgba(255,255,255,0.07)" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#picker-grid)" />
          {/* Crosshair lines at current position */}
          <line x1={x} y1="0" x2={x} y2="100" stroke="rgba(245,158,11,0.25)" strokeWidth="0.4" strokeDasharray="2 2" />
          <line x1="0" y1={y} x2="100" y2={y} stroke="rgba(245,158,11,0.25)" strokeWidth="0.4" strokeDasharray="2 2" />
        </svg>

        {/* Draggable pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div
            className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.25)", boxShadow: "0 0 12px 0 rgba(245,158,11,0.5)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        </div>

        {/* Coordinate readout */}
        <div className="absolute bottom-1.5 right-2 pointer-events-none">
          <span className="text-[9px] font-mono text-amber-500/60">{x}, {y}</span>
        </div>
      </div>

      {/* Numeric fallback */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-[10px] text-neutral-500 font-mono w-3">X</span>
          <input
            type="number"
            min={0} max={100}
            value={x}
            onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value))), y)}
            className="w-full px-2 py-1 rounded-lg text-xs bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-[10px] text-neutral-500 font-mono w-3">Y</span>
          <input
            type="number"
            min={0} max={100}
            value={y}
            onChange={(e) => onChange(x, Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-full px-2 py-1 rounded-lg text-xs bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>
      </div>
    </div>
  );
}

// ── Input helper ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg text-sm bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50";

// ── MapNodeEditor ─────────────────────────────────────────────────────────────

export function MapNodeEditor({ draft, courses, existingZones, uiLanguage = "en", onChange }: Readonly<MapNodeEditorProps>) {
  return (
    <div className="space-y-5">
      <Field label="Community name">
        <input
          type="text"
          value={draft.communityName}
          onChange={(e) => onChange({ communityName: e.target.value })}
          placeholder="e.g. Yenagoa Town Square"
          className={inputCls}
        />
      </Field>

      <Field label="Zone name">
        <>
          <input
            type="text"
            list="zone-suggestions"
            value={draft.zoneName}
            onChange={(e) => onChange({ zoneName: e.target.value })}
            placeholder="e.g. The Waterside"
            className={inputCls}
          />
          <datalist id="zone-suggestions">
            {existingZones.map((z) => <option key={z} value={z} />)}
          </datalist>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-600">
            Nodes in the same zone are connected by a path on the map.
          </p>
        </>
      </Field>

      <Field label="Linked course">
        <select
          value={draft.courseId}
          onChange={(e) => onChange({ courseId: e.target.value })}
          className={inputCls}
        >
          <option value="">— Select a course —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {localizeField(c.title, null, uiLanguage)} ({c.level})
            </option>
          ))}
        </select>
      </Field>

      <Field label="Soundscape audio URL">
        <>
          <input
            type="url"
            value={draft.previewAudioUrl ?? ""}
            onChange={(e) => onChange({ previewAudioUrl: e.target.value || undefined })}
            placeholder="https://…/soundscape.mp3"
            className={inputCls}
          />
          <p className="text-[11px] text-neutral-400 dark:text-neutral-600">
            10–30s ambient clip. Learners hear this before unlocking the course.
          </p>
        </>
      </Field>

      <PositionPicker
        x={draft.x}
        y={draft.y}
        onChange={(x, y) => onChange({ x, y })}
      />
    </div>
  );
}
