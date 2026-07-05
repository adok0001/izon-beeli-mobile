"use client";

import { StudioShell } from "@/app/(studio)/_components/studio-shell";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Music, Search, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface MediaAsset {
  id: string;
  url: string;
  kind: "image" | "audio";
  filename: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MediaLibrary() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"all" | "image" | "audio">("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const assetsQuery = useQuery({
    queryKey: ["media-assets", "admin", kind, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (kind !== "all") params.set("kind", kind);
      if (search) params.set("search", search);
      const token = await getToken();
      return apiFetch<{ assets: MediaAsset[] }>(`/upload/media?${params}`, { token: token ?? undefined });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/upload/media/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-assets"] });
      toast.success("Deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  async function handleUpload(file: File) {
    setUploading(true);
    const isImage = file.type.startsWith("image/");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const token = await getToken();
      await apiFetch(`/upload/${isImage ? "image" : "audio"}`, {
        method: "POST", body: fd, token: token ?? undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["media-assets"] });
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  }

  const assets = assetsQuery.data?.assets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Media Library</h2>
          <p className="text-sm text-neutral-500">Every image and audio file uploaded through Beeli Studio, in one place.</p>
        </div>
        <button
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,audio/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename…"
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm pl-8 pr-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 w-64"
          />
        </div>
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {(["all", "image", "audio"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3 py-1.5 text-xs font-medium capitalize ${
                kind === k
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {assetsQuery.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
      {!assetsQuery.isPending && assets.length === 0 && (
        <p className="text-sm text-neutral-500">No media yet — upload an image or audio file to get started.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden group"
          >
            {asset.kind === "image" ? (
              <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800">
                <Image src={asset.url} alt={asset.filename} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                <Music className="h-8 w-8 text-neutral-400" />
              </div>
            )}
            <div className="p-2 space-y-1">
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate" title={asset.filename}>
                {asset.filename}
              </p>
              <p className="text-[10px] text-neutral-400">{formatSize(asset.size)}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyUrl(asset.url)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05]"
                >
                  <Copy className="h-3 w-3" /> Copy URL
                </button>
                <button
                  onClick={() => deleteMutation.mutate(asset.id)}
                  className="rounded-md px-2 py-1 text-[10px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MediaPage() {
  return (
    <StudioShell access="admin">
      <MediaLibrary />
    </StudioShell>
  );
}
