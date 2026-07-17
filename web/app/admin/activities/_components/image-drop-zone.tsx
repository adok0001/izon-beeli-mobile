"use client";

import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function ImageDropZone({ previewUrl, onFile }: { previewUrl: string | null; onFile: (f: File) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  function handle(file: File) {
    if (!file.type.startsWith("image/")) { toast.error(t("admin.activities.imageTypeError")); return; }
    onFile(file);
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed transition-colors cursor-pointer",
        previewUrl ? "border-transparent" : "border-neutral-200 dark:border-neutral-700 hover:border-brand-400"
      )}
      onClick={() => !previewUrl && inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
    >
      {previewUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Scene" className="w-full rounded-xl object-cover" style={{ aspectRatio: "16/9" }} />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 text-white text-xs font-semibold hover:bg-black/80 transition-colors"
          >
            <Upload className="h-3 w-3" /> {t("admin.activities.imageReplace")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
          <Upload className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">{t("admin.activities.imageDropHint")}</p>
          <p className="text-xs mt-0.5 opacity-60">{t("admin.activities.imageRatio")}</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
    </div>
  );
}
