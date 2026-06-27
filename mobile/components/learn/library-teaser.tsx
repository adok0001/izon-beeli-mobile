import { DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Eyebrow } from "@/components/ui/section-header";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function LibraryTeaser() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;
  const router = useRouter();
  const { all } = useDiscover("all");

  const item = all.find((i) => i.featured) ?? all[0] ?? null;
  if (!item) return null;

  const cfg = DISCOVER_TYPE_CONFIG[item.type];

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Eyebrow label={tr("learn.fromLibrary")} style={{ marginBottom: 8 }} />
      <Pressable
        onPress={() => router.push(`/explore/${item.type}` as never)}
        style={{
          borderRadius: 16,
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.border,
          borderLeftWidth: 3,
          borderLeftColor: cfg.color,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        className="active:opacity-70"
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: cfg.accentDim,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 20 }}>{item.coverEmoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderRadius: 999,
              paddingHorizontal: 7,
              paddingVertical: 2,
              backgroundColor: cfg.accentDim,
              marginBottom: 5,
            }}
          >
            <IconSymbol name={cfg.icon} size={9} color={cfg.color} />
            <Text style={{ fontSize: 8, fontWeight: "800", letterSpacing: 0.8, color: cfg.color }}>
              {cfg.label}
            </Text>
          </View>
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: M.text }}>
            {item.title}
          </Text>
          <Text style={{ fontSize: 11, color: M.sub, marginTop: 2 }}>
            {item.author}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color={M.muted} />
      </Pressable>
    </View>
  );
}
