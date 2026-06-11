import { GameCard } from "@/components/playground/game-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { relevantGames, usePlaygroundStore, GAME_CATEGORIES, type GameCategory } from "@/lib/playground";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

type Filter = "all" | GameCategory;

export default function PlaygroundScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedLanguageId } = useLanguageStore();
  const { data: dueWords = [] } = useWordsDueForReview(selectedLanguageId);
  const [filter, setFilter] = useState<Filter>("all");
  const playedToday = usePlaygroundStore((s) => s.playedToday);
  const hydrate = usePlaygroundStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const games = useMemo(() => relevantGames(selectedLanguageId), [selectedLanguageId]);
  const playedCount = games.filter((g) => playedToday.includes(g.id)).length;
  const visible = filter === "all" ? games : games.filter((g) => g.category === filter);
  const availableCategories = GAME_CATEGORIES.filter((c) => games.some((g) => g.category === c));

  // Pair games into 2-column rows.
  const rows = useMemo(() => {
    const out: (typeof visible)[] = [];
    for (let i = 0; i < visible.length; i += 2) out.push(visible.slice(i, i + 2));
    return out;
  }, [visible]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Dark foyer header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10, alignSelf: "flex-start" }}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <IconSymbol name="chevron.left" size={14} color={M.parchment} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: M.parchment }}>{t("common.back")}</Text>
        </Pressable>
        <Text style={{ fontSize: 32, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
          {t("playground.title").toUpperCase()}
        </Text>
        <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 2.5, color: M.accent, marginTop: 3 }}>
          {t("playground.headerSubtitle", { total: String(games.length), played: String(playedCount) }).toUpperCase()}
        </Text>

        {/* Gold rule */}
        <View style={{ height: 1, backgroundColor: M.accent, opacity: 0.25, marginTop: 12, marginBottom: 12 }} />

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(["all", ...availableCategories] as Filter[]).map((opt) => {
            const isActive = filter === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setFilter(opt)}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                  backgroundColor: isActive ? `${M.accent}18` : M.card,
                  borderWidth: 1,
                  borderColor: isActive ? `${M.accent}55` : M.border,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: isActive ? M.accent : M.sub }}>
                  {opt === "all" ? t("playground.filterAll") : t(`playground.categories.${opt}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Game grid */}
      <ScrollView
        style={{ flex: 1, backgroundColor: M.bg }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row) => (
          <View key={row[0].id} style={{ flexDirection: "row", gap: 10 }}>
            {row.map((game) => (
              <GameCard key={game.id} game={game} dueCount={dueWords.length} />
            ))}
            {row.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ))}

        {/* Multiplayer keeps its distinct full-width treatment */}
        <Pressable
          onPress={() => router.push("/multiplayer" as never)}
          style={{
            borderRadius: 16, overflow: "hidden",
            backgroundColor: "#0F1B4A",
            borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.3)",
            borderLeftWidth: 4, borderLeftColor: getAccent("blue").solid,
            marginTop: 4,
          }}
          className="active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={t("practice.multiplayerTitle")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(59, 130, 246, 0.2)" }}>
              <IconSymbol name="trophy.fill" size={20} color="#60a5fa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: "#60a5fa" }}>
                {t("practice.multiplayer").toUpperCase()}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 15, fontWeight: "800", color: M.text }}>
                {t("practice.multiplayerTitle")}
              </Text>
              <Text style={{ fontSize: 11, color: "#60a5fa", marginTop: 1 }}>
                {t("practice.multiplayerSubtitle")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={14} color="#60a5fa" />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
