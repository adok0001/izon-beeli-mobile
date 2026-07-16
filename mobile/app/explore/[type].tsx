import { DiscoverRoom } from "@/components/explore/discover-room";
import { DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export { ErrorBoundary } from "@/components/screen-error-boundary";

const VALID_TYPES = ["blog", "podcast", "film"] as const;
type RoomType = (typeof VALID_TYPES)[number];

function RoomHero({ type, color }: { type: RoomType; color: string }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;
  const { featured } = useDiscover(type);
  const router = useRouter();
  const cfg = DISCOVER_TYPE_CONFIG[type];
  const item = featured[0] ?? null;

  if (!item) return null;

  return (
    <Pressable
      onPress={() => router.push(`/discover-content/${item.id}` as never)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      className="active:opacity-90"
    >
      <LinearGradient
        colors={[item.coverGradient[0], M.ink]}
        style={{
          borderRadius: 18,
          padding: 20,
          paddingTop: 24,
          paddingBottom: 18,
          minHeight: 160,
          justifyContent: "flex-end",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <IconSymbol
          name={cfg.icon}
          size={52}
          color={cfg.color}
          style={{ position: "absolute", top: 16, right: 16, opacity: 0.25 }}
        />
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: cfg.accentDim,
            marginBottom: 10,
          }}
        >
          <IconSymbol name={cfg.icon} size={10} color={color} />
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1, color }}>
            {tr("library.featuredToday")}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={{ fontSize: 20, fontWeight: "800", color: M.parchment, lineHeight: 26 }}
        >
          {item.title}
        </Text>
        <Text style={{ fontSize: 12, color: M.sub, marginTop: 5 }}>
          {item.author}
          {item.duration ? ` · ${Math.round(item.duration / 60)} min` : ""}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function RoomScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();

  const roomType = VALID_TYPES.includes(type as RoomType) ? (type as RoomType) : null;

  if (!roomType) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: M.muted }}>Room not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = DISCOVER_TYPE_CONFIG[roomType];
  const color = cfg.color;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Foyer header in the room's colour */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Library"
          className="active:opacity-60"
        >
          <IconSymbol name="chevron.left" size={14} color={color} />
          <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, color }}>
            {tr("explore.title").toUpperCase()}
          </Text>
        </Pressable>
        <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 2, color, marginBottom: 4 }}>
          {tr(cfg.roomKickerKey)}
        </Text>
        <Text style={{ fontSize: 28, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
          {tr(cfg.roomTitleKey).toUpperCase()}
        </Text>
        <View style={{ height: 1, backgroundColor: color, opacity: 0.25, marginTop: 12 }} />
      </View>

      <DiscoverRoom
        filter={roomType}
        accentColor={color}
        hero={<RoomHero type={roomType} color={color} />}
      />
    </SafeAreaView>
  );
}
