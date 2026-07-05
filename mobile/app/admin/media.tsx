import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { friendlyError } from "@/lib/api";
import {
  useDeleteMediaAsset,
  useMediaAssets,
  useUploadMediaAsset,
  type MediaAsset,
} from "@/lib/hooks/use-media-assets";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Clipboard, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — media library. Browse, upload, and reuse every asset
 * uploaded through Beeli Studio (mirrors web's /admin/media). Reviewer-gated
 * (not admin-only) since authors need to upload/reuse assets for their own
 * drafts too.
 */
export default function MediaLibraryScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  useStudioAccess();
  const { success: toastSuccess, error: toastError } = useToast();

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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>Media Library</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Browse and reuse uploaded images and audio.</Text>
        </View>
      </View>

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

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by filename…"
          placeholderTextColor={M.inputPlaceholder}
          style={{
            borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder,
            backgroundColor: M.inputBg, color: M.inputText,
            paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10,
          }}
        />

        <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
          {(["all", "image", "audio"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                backgroundColor: kind === k ? M.accent : M.bg,
                borderWidth: 1, borderColor: kind === k ? M.accent : M.border,
              }}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: kind === k ? M.ink : M.sub, textTransform: "capitalize" }}>
                {k}
              </Text>
            </Pressable>
          ))}
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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 12 }}>
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
      <Pressable onPress={onCopy} hitSlop={8} className="active:opacity-70">
        <IconSymbol name="square.on.square" size={18} color={M.sub} />
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8} className="active:opacity-70">
        <IconSymbol name="trash.fill" size={18} color={M.error} />
      </Pressable>
    </View>
  );
}
