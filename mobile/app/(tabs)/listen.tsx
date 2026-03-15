import { SymbolOfTheDay } from "@/components/adinkra/symbol-of-the-day";
import { CulturalSection } from "@/components/cultural/cultural-section";
import { DailyChallengeCard } from "@/components/daily-challenge-card";
import { LanguagePickerButton } from "@/components/language-picker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordOfTheDay } from "@/components/word-of-the-day";
import { useProverbs } from "@/lib/hooks/use-proverbs";
import { useLanguageStore } from "@/store/language-store";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { SafeAreaView } from "react-native-safe-area-context";

function ProverbsCard({ languageId }: { languageId: string }) {
  const router = useRouter();
  const { data: proverbs = [] } = useProverbs(languageId);
  const { t } = useTranslation();

  if (proverbs.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push(`/proverbs/${languageId}` as any)}
      className="rounded-2xl bg-amber-50 p-4 active:opacity-70 dark:bg-amber-900/20"
    >
      <View className="flex-row items-center">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
          <IconSymbol name="text.quote" size={22} color="#d97706" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            {t("practice.proverbs")}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            &ldquo;{proverbs[0].text}&rdquo;
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#d97706" />
      </View>
    </Pressable>
  );
}

export default function PracticeScreen() {
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            {t("practice.title")}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t("practice.subtitle")}
          </Text>
        </View>
        <LanguagePickerButton />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-2 gap-3"
        showsVerticalScrollIndicator={false}
      >
        <DailyChallengeCard />

        {/* Quick-access practice */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/word-review")}
            className="flex-1 items-center rounded-2xl bg-emerald-50 py-4 active:opacity-70 dark:bg-emerald-950"
          >
            <IconSymbol name="brain.head.profile" size={24} color="#10b981" />
            <Text className="mt-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {t("practice.wordReview")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/quiz")}
            className="flex-1 items-center rounded-2xl bg-blue-50 py-4 active:opacity-70 dark:bg-blue-950"
          >
            <IconSymbol name="trophy.fill" size={24} color="#3b82f6" />
            <Text className="mt-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
              {t("practice.quiz")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/matching-game")}
            className="flex-1 items-center rounded-2xl bg-violet-50 py-4 active:opacity-70 dark:bg-violet-950"
          >
            <IconSymbol name="rectangle.grid.2x2" size={24} color="#8b5cf6" />
            <Text className="mt-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300">
              {t("practice.match")}
            </Text>
          </Pressable>
        </View>

        {/* Multiplayer */}
        <Pressable
          onPress={() => router.push("/multiplayer")}
          className="rounded-2xl bg-[#123499] p-4 active:opacity-70 dark:bg-[#0f2670]"
        >
          <View className="flex-row items-center">
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
              <IconSymbol name="trophy.fill" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                {t("practice.multiplayer")}
              </Text>
              <Text className="text-base font-bold text-white">
                {t("practice.multiplayerTitle")}
              </Text>
              <Text className="text-sm text-blue-200">
                {t("practice.multiplayerSubtitle")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#93c5fd" />
          </View>
        </Pressable>

        <WordOfTheDay languageId={selectedLanguageId} />
        <ProverbsCard languageId={selectedLanguageId} />
        <CulturalSection
          languageId={selectedLanguageId}
          onViewAll={() => router.push(`/cultural/${selectedLanguageId}` as any)}
        />

        {selectedLanguageId === "akan" && <SymbolOfTheDay />}

        {["amharic", "tigrinya", "oromo"].includes(selectedLanguageId) && (
          <Pressable
            onPress={() => router.push("/geez-lesson")}
            className="rounded-2xl bg-emerald-50 p-4 active:opacity-70 dark:bg-emerald-950"
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-neutral-800">
                <Text className="text-2xl font-bold text-emerald-600">ሀ</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  {t("practice.scriptPractice")}
                </Text>
                <Text className="text-base font-bold text-neutral-900 dark:text-white">
                  {t("practice.geezTitle")}
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t("practice.geezSubtitle")}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#10b981" />
            </View>
          </Pressable>
        )}

        {["ga", "ewe", "dagbani"].includes(selectedLanguageId) && (
          <Pressable
            onPress={() => router.push("/adinkra")}
            className="rounded-2xl bg-violet-50 p-4 active:opacity-70 dark:bg-violet-950"
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-neutral-800">
                <IconSymbol name="sparkles" size={24} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  {t("practice.culturalSymbols")}
                </Text>
                <Text className="text-base font-bold text-neutral-900 dark:text-white">
                  {t("practice.adinkraTitle")}
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t("practice.adinkraSubtitle")}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#7c3aed" />
            </View>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
