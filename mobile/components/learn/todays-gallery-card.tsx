import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function TodaysGalleryCard() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;
  const router = useRouter();

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Pressable
        onPress={() => router.push("/today" as never)}
        style={{
          borderRadius: 14,
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.border,
          borderLeftWidth: 3,
          borderLeftColor: M.accent,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel={tr("learn.todaysGallery")}
        className="active:opacity-70"
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: `${M.accent}18`,
            borderWidth: 1,
            borderColor: `${M.accent}35`,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconSymbol name="sparkles" size={20} color={M.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>
            {tr("learn.todaysGallery")}
          </Text>
          <Text style={{ fontSize: 11, color: M.sub, marginTop: 2 }}>
            {tr("learn.todaysGallerySub")}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color={M.muted} />
      </Pressable>
    </View>
  );
}
