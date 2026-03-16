import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProverbs } from "@/lib/hooks/use-proverbs";
import type { Proverb } from "@/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ProverbCard({ proverb }: { proverb: Proverb }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className="mb-3 rounded-2xl bg-amber-50 p-4 active:opacity-70 dark:bg-amber-900/20"
    >
      <Text className="text-base font-semibold italic text-neutral-900 dark:text-white">
        &ldquo;{proverb.text}&rdquo;
      </Text>
      <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {proverb.translation}
      </Text>
      {expanded && (
        <View className="mt-3 rounded-lg bg-amber-100/60 px-3 py-2 dark:bg-amber-900/30">
          <Text className="text-xs font-medium text-amber-800 dark:text-amber-300">
            {proverb.meaning}
          </Text>
          {proverb.literal && proverb.literal !== proverb.translation && (
            <Text className="mt-1 text-xs italic text-neutral-500 dark:text-neutral-400">
              Literal: {proverb.literal}
            </Text>
          )}
        </View>
      )}
      <View className="mt-2 flex-row items-center justify-end">
        <IconSymbol
          name={expanded ? "chevron.up" : "chevron.down"}
          size={12}
          color="#d97706"
        />
      </View>
    </Pressable>
  );
}

export default function ProverbsScreen() {
  const { t } = useTranslation();
  const { languageId } = useLocalSearchParams<{ languageId: string }>();
  const { data: proverbs = [], isLoading } = useProverbs(languageId ?? "");

  const languageTitle =
    (languageId ?? "").charAt(0).toUpperCase() + (languageId ?? "").slice(1);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: `${languageTitle} ${t("proverbs.titleSuffix")}`,
          headerBackTitle: "Back",
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#d97706" />
        </View>
      ) : proverbs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="text.quote" size={48} color="#d1d5db" />
          <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
            {t("proverbs.noProverbs")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={proverbs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProverbCard proverb={item} />}
          contentContainerClassName="px-4 py-4"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
