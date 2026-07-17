"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useForm } from "@/lib/use-form";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Field, fieldCls, labelCls, type PlacementActivity, type TokenDraft, type ZoneDraft } from "./shared";
import { ImageDropZone } from "./image-drop-zone";
import { ZoneCanvas } from "./zone-canvas";
import { ZoneEditorList } from "./zone-editor-list";
import { TokenList } from "./token-list";

interface PlacementFormState {
  imageFile: File | null;
  imagePreviewUrl: string | null;
  imageAlt: string;
  zones: ZoneDraft[];
  tokens: TokenDraft[];
  selectedZoneId: string | null;
  uploading: boolean;
}

export function VisualPlacementForm({
  initial, languageId, onSave, onCancel, saving,
}: {
  initial?: Partial<PlacementActivity>; languageId: string;
  onSave: (data: Omit<PlacementActivity, "id" | "type">) => void;
  onCancel: () => void; saving: boolean;
}) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const blobRef = useRef<string | null>(null);
  const [state, set] = useForm<PlacementFormState>({
    imageFile: null,
    imagePreviewUrl: initial?.imageUrl ?? null,
    imageAlt: initial?.imageAlt ?? "",
    zones: (initial?.zones ?? []).map((z) => ({ ...z })),
    tokens: (initial?.tokens ?? []).map((t) => ({ ...t, audioUrl: t.audioUrl ?? "" })),
    selectedZoneId: null,
    uploading: false,
  });
  const { imageFile, imagePreviewUrl, imageAlt, zones, tokens, selectedZoneId, uploading } = state;

  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  function handleImageFile(file: File) {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    const url = URL.createObjectURL(file);
    blobRef.current = url;
    set({ imageFile: file, imagePreviewUrl: url });
  }

  function addZone(zone: ZoneDraft) { set({ zones: [...zones, zone], selectedZoneId: zone.id }); }
  function updateZone(id: string, field: "label" | "labelTranslation", value: string) {
    set({ zones: zones.map((z) => z.id === id ? { ...z, [field]: value } : z) });
  }
  function deleteZone(id: string) {
    set({
      zones: zones.filter((z) => z.id !== id),
      selectedZoneId: selectedZoneId === id ? null : selectedZoneId,
    });
  }

  function addToken() { set({ tokens: [...tokens, { id: crypto.randomUUID(), word: "", translation: "", audioUrl: "" }] }); }
  function updateToken(id: string, field: keyof Omit<TokenDraft, "id">, value: string) {
    set({ tokens: tokens.map((t) => t.id === id ? { ...t, [field]: value } : t) });
  }
  function deleteToken(id: string) { set({ tokens: tokens.filter((t) => t.id !== id) }); }

  async function handleSave() {
    if (!imagePreviewUrl) { toast.error(t("admin.activities.validationUploadImage")); return; }
    if (zones.length === 0) { toast.error(t("admin.activities.validationDrawZone")); return; }
    if (zones.some((z) => !z.label)) { toast.error(t("admin.activities.validationZoneLabel")); return; }
    if (tokens.length === 0) { toast.error(t("admin.activities.validationAddToken")); return; }

    let imageUrl = imagePreviewUrl;
    if (imageFile) {
      set({ uploading: true });
      try {
        const fd = new FormData();
        fd.append("file", imageFile);
        const res = await apiFetch<{ url: string }>("/upload/image", {
          method: "POST", body: fd, token: (await getToken()) ?? undefined,
        });
        imageUrl = res.url;
      } catch {
        toast.error(t("admin.activities.imageUploadFailed")); set({ uploading: false }); return;
      }
      set({ uploading: false });
    }

    onSave({
      languageId, imageUrl, imageAlt,
      zones: zones.map(({ id, label, labelTranslation, x, y, width, height }) => ({ id, label, labelTranslation, x, y, width, height })),
      tokens: tokens.map(({ id, word, translation, audioUrl }) => ({ id, word, translation, audioUrl: audioUrl || undefined })),
    });
  }

  return (
    <div className="space-y-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">{t("admin.activities.placementFormTitle")}</p>

      <ImageDropZone previewUrl={imagePreviewUrl} onFile={handleImageFile} />

      {imagePreviewUrl && (
        <>
          <Field label={t("admin.activities.sceneDescription")}>
            <input className={fieldCls} value={imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} placeholder="A busy West African marketplace" />
          </Field>
          <div>
            <p className={cn(labelCls, "mb-2")}>{t("admin.activities.drawZonesLabel")}</p>
            <ZoneCanvas imageUrl={imagePreviewUrl} zones={zones} selectedId={selectedZoneId}
              onAddZone={addZone} onSelectZone={(id) => set({ selectedZoneId: id })} onDeleteZone={deleteZone} />
          </div>
          <ZoneEditorList zones={zones} selectedId={selectedZoneId}
            onSelect={(id) => set({ selectedZoneId: id })} onChange={updateZone} onDelete={deleteZone} />
          <TokenList tokens={tokens} onChange={updateToken} onDelete={deleteToken} onAdd={addToken} />
        </>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          {t("admin.activities.cancel")}
        </button>
        <button type="button" onClick={handleSave} disabled={saving || uploading || !imagePreviewUrl}
          className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-40 transition-colors">
          {uploading ? t("admin.activities.uploading") : saving ? t("admin.activities.saving") : t("admin.activities.save")}
        </button>
      </div>
    </div>
  );
}
