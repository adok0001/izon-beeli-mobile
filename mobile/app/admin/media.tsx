import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { StudioSearchInput } from "@/components/studio/studio-search-input";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { friendlyError } from "@/lib/api";
import {
  useDeleteMediaAsset,
  useMediaAssets,
  useUploadMediaAsset,
  type MediaAsset,
} from "@/lib/hooks/use-media-assets";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Clipboard, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const KIND_OPTIONS = [
  { id: "all" as const, label: "All" },
  { id: "image" as const, label: "Image" },
  { id: "audio" as const, label: "Audio" },
];

/**
 * Studio Mobile — media library. Browse, upload, and reuse every asset
 * uploaded through Beeli Studio (mirrors web's /admin/media). Reviewer-gated
 * (not admin-only) since authors need to upload/reuse assets for their own
 * drafts too.
 */
export default function MediaLibraryScreen() {
  const M = useMuseumTheme();
  useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [kind, setKind] = useState<"all" | "image" | "audio">("all");
  const [search, setSearch] = useState("");
  const assetsQuery = useMediaAssets(kind, search.trim() || undefined);
  const upload = useUploadMediaAsset();
  const remove = useDeleteMediaAsset();

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const filename = asset.uri.split("/").pop() ?? "image.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    upload.mutate(
      { uri: asset.uri, kind: "image", filename, mimeType },
      {
        onSuccess: () => toastSuccess("Uploaded"),
        onError: (err: Error) => toastError("Upload failed", friendlyError(err, err.message)),
      }
    );
  }

  async function pickAudio() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["audio/*"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    upload.mutate(
      { uri: asset.uri, kind: "audio", filename: asset.name, mimeType: asset.mimeType ?? "audio/m4a" },
      {
        onSuccess: () => toastSuccess("Uploaded"),
        onError: (err: Error) => toastError("Upload failed", friendlyError(err, err.message)),
      }
    );
  }

  function copyUrl(url: string) {
    Clipboard.setString(url);
    toastSuccess("URL copied");
  }

  const assets = assetsQuery.data?.assets ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <StudioScreenHeader title="Media Library" subtitle="Browse and reuse uploaded images and audio." />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <Pressable
            onPress={pickImage}
            disabled={upload.isPending}
            style={{ flex: 1, borderRadius: 12, paddingVertical: 11, backgroundColor: M.accent, alignItems: "center" }}
            className="active:opacity-80"
          >
            <Text style={{ fontWeight: "800", color: M.ink, fontSize: 13 }}>
              {upload.isPending ? "Uploading…" : "Upload image"}
            </Text>
          </Pressable>
          <Pressable
            onPress={pickAudio}
            disabled={upload.isPending}
            style={{ flex: 1, borderRadius: 12, paddingVertical: 11, backgroundColor: M.bg, borderWidth: 1, borderColor: M.border, alignItems: "center" }}
            className="active:opacity-70"
          >
            <Text style={{ fontWeight: "700", color: M.sub, fontSize: 13 }}>
              {upload.isPending ? "Uploading…" : "Upload audio"}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginBottom: 10 }}>
          <StudioSearchInput value={search} onChangeText={setSearch} placeholder="Search by filename…" />
        </View>

        <View style={{ marginBottom: 16 }}>
          <StudioFilterPills options={KIND_OPTIONS} value={kind} onChange={setKind} />
        </View>

        {assetsQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {!assetsQuery.isPending && assets.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No media yet — upload an image or audio file to get started.</Text>
        )}

        <View style={{ gap: 10 }}>
          {assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              M={M}
              onCopy={() => copyUrl(asset.url)}
              onDelete={() =>
                remove.mutate(asset.id, {
                  onSuccess: () => toastSuccess("Deleted"),
                  onError: (err: Error) => toastError("Delete failed", friendlyError(err)),
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type M = ReturnType<typeof useMuseumTheme>;

function AssetRow({
  asset, M, onCopy, onDelete,
}: Readonly<{ asset: MediaAsset; M: M; onCopy: () => void; onDelete: () => void }>) {
  return (
    <StudioCard style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {asset.kind === "image" ? (
        <Image source={{ uri: asset.url }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: M.card }} />
      ) : (
        <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: M.card, alignItems: "center", justifyContent: "center" }}>
          <IconSymbol name="waveform" size={20} color={M.muted} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }} numberOfLines={1}>{asset.filename}</Text>
        <Text style={{ fontSize: 11, color: M.muted, marginTop: 2 }}>{asset.kind}</Text>
      </View>
      <ActionPill icon="square.on.square" label="Copy" onPress={onCopy} />
      <ActionPill icon="trash.fill" label="Delete" tone="danger" onPress={onDelete} />
    </StudioCard>
  );
}
