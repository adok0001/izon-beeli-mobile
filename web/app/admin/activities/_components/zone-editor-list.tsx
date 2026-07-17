"use client";

import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fieldCls, labelCls, type ZoneDraft } from "./shared";

export function ZoneEditorList({
  zones, selectedId, onSelect, onChange, onDelete,
}: {
  zones: ZoneDraft[]; selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, field: "label" | "labelTranslation", value: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (zones.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className={labelCls}>{t("admin.activities.zonesEditorLabel")}</p>
      {zones.map((zone, i) => (
        <div
          key={zone.id}
          className={cn(
            "rounded-lg border p-3 transition-colors cursor-pointer",
            zone.id === selectedId ? "border-amber-400/50 bg-amber-500/[0.05]" : "border-neutral-200 dark:border-neutral-700"
          )}
          onClick={() => onSelect(zone.id)}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-neutral-400">Zone {i + 1}</span>
            <span className="text-[10px] text-neutral-400 ml-auto opacity-60">
              {zone.x.toFixed(1)}%, {zone.y.toFixed(1)}% · {zone.width.toFixed(1)}×{zone.height.toFixed(1)}
            </span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(zone.id); }} className="text-red-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className={fieldCls}
              placeholder="Native word (e.g. ọjà)"
              value={zone.label}
              onChange={(e) => onChange(zone.id, "label", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <input
              className={fieldCls}
              placeholder="Translation (e.g. market)"
              value={zone.labelTranslation}
              onChange={(e) => onChange(zone.id, "labelTranslation", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
