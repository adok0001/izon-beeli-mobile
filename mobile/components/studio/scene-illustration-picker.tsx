import { SCENE_KINDS, SceneIllustration, type SceneKind } from "@/components/learn/journey-scenery";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUploadSceneIllustration } from "@/lib/hooks/educator/use-scene-illustration-upload";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import * as DocumentPicker from "expo-document-picker";
import { Pressable, Text, View } from "react-native";
import { SvgUri } from "react-native-svg";

export const SCENE_KIND_LABELS: Record<SceneKind, string> = {
  village: "Village",
  house: "House",
  kitchen: "Kitchen",
  market: "Market",
  creek: "Creek",
  city: "City",
  bushes: "Bushes",
};

/**
 * Pick one of the hand-drawn background illustrations a scene can use, or
 * upload a custom SVG. A custom URL, when set, takes precedence over the
 * preset chip selection — clear it to fall back to a preset again.
 */
export function SceneIllustrationPicker({
  value,
  onChange,
  customUrl,
  onCustomUrlChange,
}: Readonly<{
  value: SceneKind;
  onChange: (kind: SceneKind) => void;
  customUrl?: string | null;
  onCustomUrlChange: (url: string | null) => void;
}>) {
  const M = useMuseumTheme();
  const uploadSvg = useUploadSceneIllustration();

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "image/svg+xml", copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    uploadSvg.mutate(
      { uri: asset.uri, filename: asset.name ?? "scene.svg" },
      { onSuccess: (res) => onCustomUrlChange(res.url) },
    );
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {SCENE_KINDS.map((kind) => {
          const isSel = !customUrl && value === kind;
          return (
            <Pressable
              key={kind}
              onPress={() => {
                onCustomUrlChange(null);
                onChange(kind);
              }}
              style={{
                width: 76,
                borderRadius: 12,
                borderWidth: 1,
                overflow: "hidden",
                borderColor: isSel ? M.accent : M.border,
                backgroundColor: isSel ? `${M.accent}14` : M.bg,
              }}
              className="active:opacity-70"
            >
              <SceneIllustration kind={kind} width={76} height={40} thumbnail />
              <Text
                style={{
                  paddingVertical: 5,
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: "600",
                  color: isSel ? M.accent : M.sub,
                }}
              >
                {SCENE_KIND_LABELS[kind]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {customUrl ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: M.accent,
            backgroundColor: `${M.accent}12`,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <SvgUri uri={customUrl} width={28} height={28} />
            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: M.accent, flex: 1 }}>
              Custom SVG
            </Text>
          </View>
          <Pressable onPress={() => onCustomUrlChange(null)} hitSlop={8} className="active:opacity-70">
            <IconSymbol name="xmark.circle.fill" size={18} color={M.muted} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleUpload}
          disabled={uploadSvg.isPending}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: M.border,
            paddingVertical: 9,
            opacity: uploadSvg.isPending ? 0.6 : 1,
          }}
          className="active:opacity-70"
        >
          <IconSymbol name="square.and.arrow.up" size={13} color={M.sub} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: M.sub }}>
            {uploadSvg.isPending ? "Uploading…" : "Upload your own SVG"}
          </Text>
        </Pressable>
      )}
      {uploadSvg.isError ? (
        <Text style={{ fontSize: 11, color: M.error }}>{(uploadSvg.error as Error).message}</Text>
      ) : null}
    </View>
  );
}
