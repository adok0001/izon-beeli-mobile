"use client";

import { cn } from "@/lib/utils";
import { useForm } from "@/lib/use-form";
import { X } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ZoneDraft } from "./shared";

interface DrawState { active: boolean; startX: number; startY: number; currentX: number; currentY: number; }

export function ZoneCanvas({
  imageUrl, zones, selectedId, onAddZone, onSelectZone, onDeleteZone,
}: {
  imageUrl: string; zones: ZoneDraft[]; selectedId: string | null;
  onAddZone: (z: ZoneDraft) => void; onSelectZone: (id: string | null) => void; onDeleteZone: (id: string) => void;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [draw, setDraw] = useForm<DrawState>({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });

  function coords(e: React.MouseEvent) {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  }

  function handleDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    const { x, y } = coords(e);
    setDraw({ active: true, startX: x, startY: y, currentX: x, currentY: y });
    onSelectZone(null);
  }

  function handleMove(e: React.MouseEvent) {
    if (!draw.active) return;
    const { x, y } = coords(e);
    setDraw({ currentX: x, currentY: y });
  }

  function handleUp() {
    if (!draw.active) return;
    const w = Math.abs(draw.currentX - draw.startX);
    const h = Math.abs(draw.currentY - draw.startY);
    if (w > 3 && h > 3) {
      const zone: ZoneDraft = {
        id: crypto.randomUUID(), label: "", labelTranslation: "",
        x: Math.min(draw.startX, draw.currentX),
        y: Math.min(draw.startY, draw.currentY),
        width: w, height: h,
      };
      onAddZone(zone);
    }
    setDraw({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  }

  const preview = draw.active ? {
    left: `${Math.min(draw.startX, draw.currentX)}%`,
    top: `${Math.min(draw.startY, draw.currentY)}%`,
    width: `${Math.abs(draw.currentX - draw.startX)}%`,
    height: `${Math.abs(draw.currentY - draw.startY)}%`,
  } : null;

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden select-none"
      style={{ aspectRatio: "16/9", cursor: "crosshair" }}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {zones.map((zone) => (
        <div
          key={zone.id}
          className={cn(
            "absolute rounded border-2 transition-colors",
            zone.id === selectedId ? "border-amber-400 bg-amber-400/20" : "border-white/60 bg-white/10 hover:border-white/90",
          )}
          style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
          onMouseDown={(e) => { e.stopPropagation(); onSelectZone(zone.id); }}
        >
          <button
            type="button"
            onMouseDown={(e) => { e.stopPropagation(); onDeleteZone(zone.id); }}
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 z-10"
          >
            <X className="h-2.5 w-2.5" />
          </button>
          {zone.label && (
            <span className="absolute bottom-1 left-1 text-[9px] font-mono bg-black/70 text-white px-1 rounded pointer-events-none">
              {zone.label}
            </span>
          )}
        </div>
      ))}

      {preview && (
        <div className="absolute rounded border-2 border-amber-400/80 bg-amber-400/10 pointer-events-none" style={preview} />
      )}

      {zones.length === 0 && !draw.active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/70 text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">
            {t("admin.activities.zonesCanvasHint")}
          </p>
        </div>
      )}
    </div>
  );
}
