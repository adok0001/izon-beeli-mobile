"use client";

import { Images, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type ElementType } from "react";
import { MediaPickerModal } from "./media-picker-modal";

/**
 * Shared upload control for the dictionary editors (previously duplicated
 * verbatim across web/app/admin/dictionary/page.tsx and
 * web/app/educator/dictionary/page.tsx). `onPickUrl` is optional so callers
 * that don't want the library-picker button can omit it.
 */
export function FileUploadField({
  label, accept, existingUrl, file, onFile, onClear, onPickUrl, icon: Icon, previewType,
}: Readonly<{
  label: string;
  accept: string;
  existingUrl: string | null;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  onPickUrl?: (url: string) => void;
  icon: ElementType;
  previewType: "audio" | "image";
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const previewUrl = file ? URL.createObjectURL(file) : existingUrl;

  return (
    <div>
      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">{label}</label>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-3 space-y-2">
        {previewUrl && previewType === "audio" && (
          <audio controls src={previewUrl} className="w-full h-8" />
        )}
        {previewUrl && previewType === "image" && (
          <div className="relative w-full h-28 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <Image src={previewUrl} alt="preview" fill className="object-cover" unoptimized />
          </div>
        )}
        {previewUrl && !file && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{previewUrl}</p>}
        {file && <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium truncate">↑ {file.name}</p>}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <Upload className="h-3 w-3" />{file ?? existingUrl ? "Replace" : "Upload"}
          </button>
          {onPickUrl && (
            <button type="button" onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <Images className="h-3 w-3" />Library
            </button>
          )}
          {previewUrl && (
            <button type="button" onClick={onClear}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <X className="h-3 w-3" /> Remove
            </button>
          )}
          {!previewUrl && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <Icon className="h-3 w-3" /> No {previewType}
            </span>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      {pickerOpen && onPickUrl && (
        <MediaPickerModal
          kind={previewType}
          onPick={(url) => { onPickUrl(url); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
