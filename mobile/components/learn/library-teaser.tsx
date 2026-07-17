import { DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ContentTeaserCard } from "@/components/ui/section-header";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export function LibraryTeaser() {
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;
  const router = useRouter();
  const { all } = useDiscover("all");

  const item = all.find((i) => i.featured) ?? all[0] ?? null;
  if (!item) return null;

  const cfg = DISCOVER_TYPE_CONFIG[item.type];

  return (
    <ContentTeaserCard
      eyebrow={tr("learn.fromLibrary")}
      icon={cfg.icon}
      iconColor={cfg.color}
      iconBackground={cfg.accentDim}
      accentColor={cfg.color}
      title={item.title}
      subtitle={item.author}
      badge={
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
      }
      onPress={() => router.push(`/explore/${item.type}` as never)}
      accessibilityLabel={item.title}
    />
  );
}
