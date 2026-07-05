"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Music, Search, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface MediaAsset {
  id: string;
  url: string;
  kind: "image" | "audio";
  filename: string;
  createdAt: string;
}

/** Browse-and-pick modal over the Beeli Studio media library (GET /upload/media). */
export function MediaPickerModal({
  kind, onPick, onClose,
}: Readonly<{ kind: "image" | "audio"; onPick: (url: string) => void; onClose: () => void }>) {
  const { getToken } = useAuth();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["media-assets", kind, search],
    queryFn: async () => {
      const params = new URLSearchParams({ kind });
      if (search) params.set("search", search);
      return apiFetch<{ assets: MediaAsset[] }>(`/upload/media?${params}`, {
        token: (await getToken()) ?? undefined,
      });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Choose {kind === "image" ? "an image" : "an audio file"} from the library
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename…"
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm pl-8 pr-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <p className="text-sm text-neutral-400">Loading…</p>}
          {!isLoading && data?.assets.length === 0 && (
            <p className="text-sm text-neutral-400">No {kind} assets yet.</p>
          )}
          {kind === "image" ? (
            <div className="grid grid-cols-4 gap-3">
              {data?.assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onPick(asset.url)}
                  className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:ring-2 hover:ring-brand-500 transition"
                  title={asset.filename}
                >
                  <Image src={asset.url} alt={asset.filename} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onPick(asset.url)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:ring-2 hover:ring-brand-500 transition text-left"
                >
                  <Music className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{asset.filename}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
