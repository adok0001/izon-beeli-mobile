import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCultural } from "@/lib/hooks/use-cultural";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { CulturalCategory, CulturalContent } from "@/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "@/components/loading-screen";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CULTURAL_CATEGORIES: { id: CulturalCategory; label: string; emoji: string }[] = [
  { id: "colors", label: "Colors", emoji: "🎨" },
  { id: "naming_ceremonies", label: "Naming", emoji: "👶" },
  { id: "festivals", label: "Festivals", emoji: "🎉" },
  { id: "creation_myths", label: "Myths & Stories", emoji: "🌟" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "clothing", label: "Clothing", emoji: "🧣" },
  { id: "cuisine", label: "Cuisine", emoji: "🍜" },
  { id: "greetings_etiquette", label: "Greetings", emoji: "👋" },
];

function KeyTermPill({ word, english }: { word: string; english: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ marginBottom: 6, marginRight: 6, flexDirection: "row", alignItems: "center", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: M.accentBorder }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>
        {word}
      </Text>
      <Text style={{ marginHorizontal: 4, color: M.muted }}>
        {"→"}
      </Text>
      <Text style={{ fontSize: 13, color: M.sub }}>
        {english}
      </Text>
    </View>
  );
}

function ExpandedCulturalCard({ item }: { item: CulturalContent }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: 16, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <Text style={{ fontSize: 48 }}>{item.imageEmoji}</Text>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <View style={{ alignSelf: "flex-start", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: M.accentBorder }}>
            <Text style={{ fontSize: 11, fontWeight: "500", color: M.accent }}>
              {t(`cultural.categories.${item.category}` as any)}
            </Text>
          </View>
          <Text style={{ marginTop: 6, fontSize: 18, fontWeight: "700", color: M.text }}>
            {item.title}
          </Text>
        </View>
      </View>

      <Text style={{ marginTop: 12, fontSize: 13, lineHeight: 20, color: M.sub }}>
        {item.description}
      </Text>

      {item.keyTerms.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ marginBottom: 8, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
            {t("cultural.keyTerms")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {item.keyTerms.map((term) => (
              <KeyTermPill
                key={term.word}
                word={term.word}
                english={term.english}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function CulturalScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { languageId } = useLocalSearchParams<{ languageId: string }>();
  const { data: allContent = [], isLoading } = useCultural(languageId ?? "");
  const categories = CULTURAL_CATEGORIES;
  const [selectedCategory, setSelectedCategory] = useState<CulturalCategory | null>(null);

  const filteredContent = useMemo(() => {
    if (!selectedCategory) return allContent;
    return allContent.filter((item) => item.category === selectedCategory);
  }, [allContent, selectedCategory]);

  const availableCategories = useMemo(() => {
    const categorySet = new Set(allContent.map((item) => item.category));
    return categories.filter((cat) => categorySet.has(cat.id));
  }, [allContent, categories]);

  const languageTitle =
    (languageId ?? "").charAt(0).toUpperCase() + (languageId ?? "").slice(1);

  const renderItem = useCallback(
    ({ item }: { item: CulturalContent }) => <ExpandedCulturalCard item={item} />,
    []
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: `${languageTitle} ${t("cultural.titleSuffix")}`,
          headerBackTitle: t("common.back"),
        }}
      />

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: M.border, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        <Pressable
          onPress={() => setSelectedCategory(null)}
          style={{
            borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8,
            backgroundColor: selectedCategory === null ? M.accent : M.card,
            borderWidth: 1, borderColor: selectedCategory === null ? M.accent : M.border,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "500", color: selectedCategory === null ? M.ink : M.sub }}>
            {t("cultural.all")}
          </Text>
        </Pressable>

        {availableCategories.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(active ? null : cat.id)}
              style={{
                borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8,
                backgroundColor: active ? M.accent : M.card,
                borderWidth: 1, borderColor: active ? M.accent : M.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: active ? M.ink : M.sub }}>
                {cat.emoji} {t(`cultural.categories.${cat.id}` as any)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <LoadingScreen />
      ) : filteredContent.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder, marginBottom: 16 }}>
            <IconSymbol name="book.fill" size={28} color={M.accent} />
          </View>
          <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "700", color: M.text }}>
            {t("cultural.noContent")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContent}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
