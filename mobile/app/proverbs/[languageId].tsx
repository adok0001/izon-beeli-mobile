import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProverbs } from "@/lib/hooks/use-proverbs";
import { getLanguageName } from "@/lib/mock-data";
import type { Proverb } from "@/types";
import { Audio } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "@/components/loading-screen";
import { FlatList, Pressable, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ProverbCard({
  proverb,
  languageId,
}: {
  proverb: Proverb;
  languageId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const handleAudio = useCallback(async () => {
    if (!proverb.audioUrl) return;
    try {
      if (playing) {
        await soundRef.current?.pauseAsync();
        setPlaying(false);
        return;
      }
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync({ uri: proverb.audioUrl });
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded && s.didJustFinish) {
            setPlaying(false);
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
        soundRef.current = sound;
      }
      await soundRef.current?.playAsync();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [proverb.audioUrl, playing]);

  const handleShare = useCallback(async () => {
    const languageName = getLanguageName(languageId);
    const title = t("proverbs.shareTitle", { language: languageName });
    await Share.share({
      message: `${title}\n\n"${proverb.text}"\n\n${proverb.translation}\n\n${proverb.meaning}`,
      title,
    });
  }, [proverb, languageId, t]);

  return (
    <View className="mb-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
      {/* Proverb text */}
      <Text className="text-base font-semibold italic text-neutral-900 dark:text-white">
        &ldquo;{proverb.text}&rdquo;
      </Text>
      <Text className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
        {proverb.translation}
      </Text>

      {/* Expandable meaning */}
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

      {/* Related lesson link */}
      {proverb.relatedLessonId && (
        <Pressable
          onPress={() => router.push(`/lesson/${proverb.relatedLessonId}` as any)}
          className="mt-3 flex-row items-center gap-1.5 active:opacity-70"
        >
          <IconSymbol name="book.fill" size={12} color="#d97706" />
          <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {t("proverbs.practiceInLesson")}
          </Text>
        </Pressable>
      )}

      {/* Bottom action row */}
      <View className="mt-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          className="flex-row items-center gap-1"
        >
          <IconSymbol
            name={expanded ? "chevron.up" : "chevron.down"}
            size={12}
            color="#d97706"
          />
          <Text className="text-xs text-amber-600 dark:text-amber-400">
            {expanded ? t("proverbs.less") : t("proverbs.meaning")}
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-4">
          {proverb.audioUrl && (
            <Pressable onPress={handleAudio} hitSlop={8}>
              <IconSymbol
                name={playing ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
                size={20}
                color={playing ? "#3b82f6" : "#d97706"}
              />
            </Pressable>
          )}
          <Pressable onPress={handleShare} hitSlop={8}>
            <IconSymbol name="square.and.arrow.up" size={20} color="#d97706" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ProverbsScreen() {
  const { t } = useTranslation();
  const { languageId } = useLocalSearchParams<{ languageId: string }>();
  const { data: proverbs = [], isLoading } = useProverbs(languageId ?? "");

  const languageName = getLanguageName(languageId ?? "");

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: `${languageName} ${t("proverbs.titleSuffix")}`,
          headerBackTitle: "Back",
        }}
      />

      {isLoading ? (
        <LoadingScreen color="#d97706" />
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
          renderItem={({ item }) => (
            <ProverbCard proverb={item} languageId={languageId ?? ""} />
          )}
          contentContainerClassName="px-4 py-4"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
