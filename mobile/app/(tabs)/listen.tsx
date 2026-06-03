import { SymbolOfTheDay } from "@/components/adinkra/symbol-of-the-day";
import { CulturalSection } from "@/components/cultural/cultural-section";
import { DailyChallengeCards } from "@/components/daily-challenge-card";
import { LanguagePickerButton } from "@/components/language-picker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordOfTheDay } from "@/components/word-of-the-day";
import { ALL_LESSONS } from "@/lib/data/lessons";
import { useCourses } from "@/lib/hooks/use-courses";
import { useProverbOfTheMonth } from "@/lib/hooks/use-proverb-of-the-month";
import { useSongOfTheWeek } from "@/lib/hooks/use-song-of-the-week";
import { useProverbs } from "@/lib/hooks/use-proverbs";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { localizeField } from "@/lib/localize";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─── Exhibit section header ─── */

function ExhibitHeader({ label }: { label: string }) {
  return (
    <View className="mb-4 mt-6 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
      <Text className="text-[10px] font-bold uppercase tracking-[2.5px] text-neutral-400 dark:text-neutral-500">
        {label}
      </Text>
      <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
    </View>
  );
}

/* ─── Proverb of the Month ─── */

function ProverbOfTheMonthCard({ languageId }: { languageId: string }) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const router = useRouter();
  const proverb = useProverbOfTheMonth(languageId);

  // Fallback to first proverb from list if API returns nothing
  const { data: proverbs = [] } = useProverbs(languageId);
  const displayed = proverb ?? proverbs[0] ?? null;

  if (!displayed) return null;

  return (
    <View className="overflow-hidden rounded-2xl bg-amber-50 dark:bg-amber-950/40">
      {/* Exhibit label strip */}
      <View className="flex-row items-center justify-between bg-amber-800/10 px-4 py-2.5 dark:bg-amber-700/20">
        <View className="flex-row items-center gap-2">
          <IconSymbol name="text.quote" size={13} color="#92400e" />
          <Text className="text-[10px] font-bold uppercase tracking-[2px] text-amber-800 dark:text-amber-400">
            {t("practice.proverbOfTheMonth")}
          </Text>
        </View>
        <View className="rounded-full bg-amber-800/15 px-2 py-0.5 dark:bg-amber-600/20">
          <Text className="text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Featured
          </Text>
        </View>
      </View>

      {/* Quote body */}
      <View className="px-5 pb-5 pt-4">
        {/* Decorative opening mark */}
        <Text
          style={{ fontSize: 52, lineHeight: 40, marginBottom: 4 }}
          className="font-bold text-amber-300 dark:text-amber-800"
        >
          "
        </Text>
        <Text className="text-lg font-semibold italic leading-relaxed text-neutral-800 dark:text-amber-100">
          {displayed.text}
        </Text>
        <View className="mb-4 mt-3 h-px bg-amber-200 dark:bg-amber-800/40" />
        <Text className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {localizeField(displayed.translation, displayed.translationFr, uiLanguage)}
        </Text>
        {displayed.meaning ? (
          <View className="mt-3 rounded-xl bg-amber-100/70 px-4 py-3 dark:bg-amber-900/30">
            <Text className="text-xs font-medium leading-relaxed text-amber-900 dark:text-amber-300">
              {localizeField(displayed.meaning, displayed.meaningFr, uiLanguage)}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push(`/proverbs/${languageId}` as any)}
          className="mt-4 flex-row items-center gap-1.5 self-start active:opacity-60"
        >
          <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            Browse all proverbs
          </Text>
          <IconSymbol name="chevron.right" size={12} color="#b45309" />
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Song of the Week ─── */

function SongOfTheWeekCard({ languageId }: { languageId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const song = useSongOfTheWeek(languageId);
  const { uiLanguage } = useUiLanguageStore();

  // Fallback: show link to songs list if no song of the week
  const { data: courses = [] } = useCourses(languageId);
  const hasSongs = useMemo(
    () => courses.some((c) => c.courseType === "songs"),
    [courses]
  );

  if (!song && !hasSongs) return null;

  if (!song) {
    return (
      <Pressable
        onPress={() => router.push(`/songs/${languageId}` as any)}
        className="overflow-hidden rounded-2xl bg-rose-50 active:opacity-70 dark:bg-rose-950/40"
      >
        <View className="flex-row items-center justify-between bg-rose-800/10 px-4 py-2.5 dark:bg-rose-700/20">
          <View className="flex-row items-center gap-2">
            <IconSymbol name="music.note" size={13} color="#9f1239" />
            <Text className="text-[10px] font-bold uppercase tracking-[2px] text-rose-800 dark:text-rose-400">
              {t("practice.songOfTheWeek")}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("practice.noSongThisWeek")}
          </Text>
          <IconSymbol name="chevron.right" size={16} color="#9f1239" />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/lesson/${song.id}` as any)}
      className="overflow-hidden rounded-2xl bg-rose-50 active:opacity-70 dark:bg-rose-950/40"
    >
      {/* Exhibit label strip */}
      <View className="flex-row items-center justify-between bg-rose-800/10 px-4 py-2.5 dark:bg-rose-700/20">
        <View className="flex-row items-center gap-2">
          <IconSymbol name="music.note" size={13} color="#9f1239" />
          <Text className="text-[10px] font-bold uppercase tracking-[2px] text-rose-800 dark:text-rose-400">
            {t("practice.songOfTheWeek")}
          </Text>
        </View>
        <View className="rounded-full bg-rose-800/15 px-2 py-0.5 dark:bg-rose-600/20">
          <Text className="text-[9px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            {t("practice.thisWeeksSelection")}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 px-5 py-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/40">
          <IconSymbol name="music.note.list" size={26} color="#be185d" />
        </View>
        <View className="flex-1">
          <Text
            className="text-base font-bold text-neutral-900 dark:text-white"
            numberOfLines={1}
          >
            {localizeField(song.title, song.titleFr, uiLanguage)}
          </Text>
          {song.description ? (
            <Text
              className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              {localizeField(song.description, song.descriptionFr, uiLanguage)}
            </Text>
          ) : null}
        </View>
        <IconSymbol name="play.circle.fill" size={34} color="#be185d" />
      </View>
    </Pressable>
  );
}

/* ─── Songs collection card ─── */

function SongsCard({ languageId }: { languageId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: courses = [] } = useCourses(languageId);

  const songs = useMemo(() => {
    const songCourseIds = courses
      .filter((c) => c.courseType === "songs")
      .map((c) => c.id);
    if (songCourseIds.length === 0) return [];
    return ALL_LESSONS.filter(
      (l) => l.type === "song" && songCourseIds.includes(l.courseId)
    );
  }, [courses]);

  if (songs.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push(`/songs/${languageId}` as any)}
      className="flex-row items-center rounded-2xl border border-rose-100 bg-white px-4 py-3.5 active:opacity-70 dark:border-rose-900/30 dark:bg-neutral-800/60"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60">
        <IconSymbol name="music.note" size={20} color="#be185d" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("songs.title")}
        </Text>
        <Text className="text-xs text-neutral-400 dark:text-neutral-500">
          {songs.length} songs available
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={15} color="#be185d" />
    </Pressable>
  );
}

/* ─── Proverbs collection card ─── */

function ProverbsCollectionCard({ languageId }: { languageId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: proverbs = [] } = useProverbs(languageId);

  if (proverbs.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push(`/proverbs/${languageId}` as any)}
      className="flex-row items-center rounded-2xl border border-amber-100 bg-white px-4 py-3.5 active:opacity-70 dark:border-amber-900/30 dark:bg-neutral-800/60"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60">
        <IconSymbol name="text.quote" size={20} color="#b45309" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("practice.proverbs")}
        </Text>
        <Text className="text-xs text-neutral-400 dark:text-neutral-500">
          {proverbs.length} proverbs in collection
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={15} color="#b45309" />
    </Pressable>
  );
}

/* ─── Main screen ─── */

export default function DiscoverScreen() {
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();
  const { data: dueWords = [] } = useWordsDueForReview();

  const hasScriptPractice = ["amharic", "tigrinya", "oromo"].includes(selectedLanguageId);
  const hasAdinkra = ["ga", "ewe", "dagbani"].includes(selectedLanguageId);
  const hasAkan = selectedLanguageId === "akan";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
            {t("practice.title")}
          </Text>
          <Text className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">
            {t("practice.subtitle")}
          </Text>
        </View>
        <LanguagePickerButton />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-1"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Today's Gallery ── */}
        <ExhibitHeader label={t("practice.sectionToday")} />

        <View className="gap-3">
          <WordOfTheDay languageId={selectedLanguageId} />
          <ProverbOfTheMonthCard languageId={selectedLanguageId} />
          <SongOfTheWeekCard languageId={selectedLanguageId} />
          <DailyChallengeCards />
        </View>

        {/* ── The Workshop ── */}
        <ExhibitHeader label={t("practice.sectionActivities")} />

        <View className="gap-3">
          {/* Quick tools */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push("/word-review")}
              className="flex-1 items-center rounded-2xl border border-emerald-100 bg-white py-4 active:opacity-70 dark:border-emerald-900/30 dark:bg-neutral-800/60"
            >
              <View>
                <IconSymbol name="brain.head.profile" size={24} color="#10b981" />
                {dueWords.length > 0 && (
                  <View className="absolute -right-2 -top-1 min-w-[18px] items-center rounded-full bg-red-500 px-1">
                    <Text className="text-[10px] font-bold text-white">{dueWords.length}</Text>
                  </View>
                )}
              </View>
              <Text className="mt-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {t("practice.wordReview")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/quiz")}
              className="flex-1 items-center rounded-2xl border border-blue-100 bg-white py-4 active:opacity-70 dark:border-blue-900/30 dark:bg-neutral-800/60"
            >
              <IconSymbol name="trophy.fill" size={24} color="#3b82f6" />
              <Text className="mt-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                {t("practice.quiz")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/matching-game")}
              className="flex-1 items-center rounded-2xl border border-violet-100 bg-white py-4 active:opacity-70 dark:border-violet-900/30 dark:bg-neutral-800/60"
            >
              <IconSymbol name="rectangle.grid.2x2" size={24} color="#8b5cf6" />
              <Text className="mt-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                {t("practice.match")}
              </Text>
            </Pressable>
          </View>

          {/* Multiplayer */}
          <Pressable
            onPress={() => router.push("/multiplayer")}
            className="overflow-hidden rounded-2xl bg-[#0f2670] active:opacity-70"
          >
            <View className="flex-row items-center px-4 py-4">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/50">
                <IconSymbol name="trophy.fill" size={22} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-blue-300">
                  {t("practice.multiplayer")}
                </Text>
                <Text className="mt-0.5 text-base font-bold text-white">
                  {t("practice.multiplayerTitle")}
                </Text>
                <Text className="text-xs text-blue-300">
                  {t("practice.multiplayerSubtitle")}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#93c5fd" />
            </View>
          </Pressable>
        </View>

        {/* ── The Cultural Hall ── */}
        <ExhibitHeader label={t("practice.sectionCulture")} />

        <View className="gap-3">
          <SongsCard languageId={selectedLanguageId} />
          <ProverbsCollectionCard languageId={selectedLanguageId} />

          <CulturalSection
            languageId={selectedLanguageId}
            onViewAll={() => router.push(`/cultural/${selectedLanguageId}` as any)}
          />

          {hasAkan && <SymbolOfTheDay />}

          {hasScriptPractice && (
            <Pressable
              onPress={() => router.push("/geez-lesson")}
              className="flex-row items-center rounded-2xl border border-emerald-100 bg-white px-4 py-4 active:opacity-70 dark:border-emerald-900/30 dark:bg-neutral-800/60"
            >
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60">
                <Text className="text-2xl font-bold text-emerald-600">ሀ</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-emerald-600 dark:text-emerald-400">
                  {t("practice.scriptPractice")}
                </Text>
                <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t("practice.geezTitle")}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t("practice.geezSubtitle")}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#10b981" />
            </Pressable>
          )}

          {hasAdinkra && (
            <Pressable
              onPress={() => router.push("/adinkra")}
              className="flex-row items-center rounded-2xl border border-violet-100 bg-white px-4 py-4 active:opacity-70 dark:border-violet-900/30 dark:bg-neutral-800/60"
            >
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60">
                <IconSymbol name="sparkles" size={22} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-violet-600 dark:text-violet-400">
                  {t("practice.culturalSymbols")}
                </Text>
                <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t("practice.adinkraTitle")}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t("practice.adinkraSubtitle")}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#7c3aed" />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
