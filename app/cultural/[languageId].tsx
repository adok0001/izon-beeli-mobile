import { useCultural } from "@/lib/hooks/use-cultural";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { CulturalCategory, CulturalContent } from "@/types";

const CULTURAL_CATEGORIES: { id: CulturalCategory; label: string; emoji: string }[] = [
  { id: "colors", label: "Colors", emoji: "\uD83C\uDFA8" },
  { id: "naming_ceremonies", label: "Naming", emoji: "\uD83D\uDC76" },
  { id: "festivals", label: "Festivals", emoji: "\uD83C\uDF89" },
  { id: "creation_myths", label: "Myths & Stories", emoji: "\uD83C\uDF1F" },
  { id: "music", label: "Music", emoji: "\uD83C\uDFB5" },
  { id: "clothing", label: "Clothing", emoji: "\uD83E\udDE3" },
  { id: "cuisine", label: "Cuisine", emoji: "\uD83C\uDF5C" },
  { id: "greetings_etiquette", label: "Greetings", emoji: "\uD83D\uDC4B" },
];
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function KeyTermPill({ word, english }: { word: string; english: string }) {
  return (
    <View className="mb-1.5 mr-1.5 flex-row items-center rounded-full bg-amber-100/60 px-3 py-1.5 dark:bg-amber-900/30">
      <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
        {word}
      </Text>
      <Text className="mx-1 text-neutral-400 dark:text-neutral-500">
        {"\u2192"}
      </Text>
      <Text className="text-sm text-neutral-600 dark:text-neutral-400">
        {english}
      </Text>
    </View>
  );
}

function ExpandedCulturalCard({ item }: { item: CulturalContent }) {
  return (
    <View className="mb-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="flex-row items-start">
        <Text className="text-5xl">{item.imageEmoji}</Text>
        <View className="ml-3 flex-1">
          <View className="self-start rounded-full bg-amber-100 px-2.5 py-0.5 dark:bg-amber-900/40">
            <Text className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {getCategoryLabel(item.category)}
            </Text>
          </View>
          <Text className="mt-1.5 text-lg font-bold text-neutral-900 dark:text-white">
            {item.title}
          </Text>
        </View>
      </View>

      <Text className="mt-3 text-sm leading-5 text-neutral-700 dark:text-neutral-300">
        {item.description}
      </Text>

      {item.keyTerms.length > 0 && (
        <View className="mt-3">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Key Terms
          </Text>
          <View className="flex-row flex-wrap">
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

const CATEGORY_LABELS: Record<string, string> = {
  colors: "Colors",
  naming_ceremonies: "Naming",
  festivals: "Festivals",
  creation_myths: "Myths & Stories",
  music: "Music",
  clothing: "Clothing",
  cuisine: "Cuisine",
  greetings_etiquette: "Greetings",
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export default function CulturalScreen() {
  const { languageId } = useLocalSearchParams<{ languageId: string }>();
  const { data: allContent = [], isLoading } = useCultural(languageId ?? "");
  const categories = CULTURAL_CATEGORIES;
  const [selectedCategory, setSelectedCategory] =
    useState<CulturalCategory | null>(null);

  const filteredContent = useMemo(() => {
    if (!selectedCategory) return allContent;
    return allContent.filter((item) => item.category === selectedCategory);
  }, [allContent, selectedCategory]);

  // Only show categories that have content for this language
  const availableCategories = useMemo(() => {
    const categorySet = new Set(allContent.map((item) => item.category));
    return categories.filter((cat) => categorySet.has(cat.id));
  }, [allContent, categories]);

  const languageTitle =
    (languageId ?? "").charAt(0).toUpperCase() + (languageId ?? "").slice(1);

  const renderItem = useCallback(
    ({ item }: { item: CulturalContent }) => (
      <ExpandedCulturalCard item={item} />
    ),
    []
  );

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-neutral-900"
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: `${languageTitle} Cultural Heritage`,
          headerBackTitle: "Back",
        }}
      />

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-neutral-100 dark:border-neutral-800"
        contentContainerClassName="px-4 py-3 gap-2"
      >
        <Pressable
          onPress={() => setSelectedCategory(null)}
          className={`rounded-full px-4 py-2 ${
            selectedCategory === null
              ? "bg-amber-500 dark:bg-amber-600"
              : "bg-neutral-100 dark:bg-neutral-800"
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              selectedCategory === null
                ? "text-white"
                : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            All
          </Text>
        </Pressable>

        {availableCategories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() =>
              setSelectedCategory(
                selectedCategory === cat.id ? null : cat.id
              )
            }
            className={`rounded-full px-4 py-2 ${
              selectedCategory === cat.id
                ? "bg-amber-500 dark:bg-amber-600"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedCategory === cat.id
                  ? "text-white"
                  : "text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {cat.emoji} {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : filteredContent.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="book.fill" size={48} color="#d1d5db" />
          <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
            No cultural content available for this category yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContent}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="px-4 py-4"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
