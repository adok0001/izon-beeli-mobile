import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Modal, type GestureResponderEvent } from "react-native";
import { getAccent } from "@/constants/accent-colors";
import { localize } from "@/lib/localize";
import { useAudioStore } from "@/store/audio-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useLanguageStore } from "@/store/language-store";
import { useSaveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { JOURNEY } from "@/lib/journey";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { TranscriptSegment } from "@/types";
import type { DictionaryEntry } from "@/lib/dictionary";

interface Props {
  segments: TranscriptSegment[];
  onSegmentPress?: (segment: TranscriptSegment) => void;
}

function WordLookupSheet({
  word,
  entry,
  onClose,
  onSave,
  saved,
}: {
  word: string;
  entry: DictionaryEntry | null;
  onClose: () => void;
  onSave: () => void;
  saved: boolean;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-neutral-800">
        {entry ? (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                {entry.word}
              </Text>
              <View className="flex-row items-center gap-2">
                <WordAudioButton audioSource={entry.audioUrl} word={entry.word} />
                <Pressable onPress={onClose} hitSlop={8}>
                  <IconSymbol name="xmark" size={20} color={M.muted} />
                </Pressable>
              </View>
            </View>
            {entry.pronunciation && (
              <Text className="mb-2 text-sm italic text-neutral-500 dark:text-neutral-400">
                /{entry.pronunciation}/
              </Text>
            )}
            <Text className="mb-4 text-base text-neutral-600 dark:text-neutral-300">
              {entry.english}
            </Text>
            {entry.example && (
              <View className="mb-4 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-700">
                <Text className="text-sm text-neutral-800 dark:text-neutral-200">
                  {entry.example}
                </Text>
                {entry.exampleTranslation && (
                  <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {entry.exampleTranslation}
                  </Text>
                )}
              </View>
            )}
            <View className="flex-row gap-3">
              <Pressable
                onPress={onSave}
                className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
                  saved
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : "bg-neutral-100 dark:bg-neutral-700"
                }`}
              >
                <IconSymbol
                  name={saved ? "star.fill" : "star"}
                  size={16}
                  color={saved ? getAccent("amber").solid : M.muted}
                />
                <Text className={`ml-1.5 text-sm font-semibold ${
                  saved
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-neutral-600 dark:text-neutral-300"
                }`}>
                  {saved ? t("wordDetail.savedToWordBank") : t("wordDetail.saveToWordBank")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: "/word/[id]",
                    params: { id: entry.id, languageId: entry.languageId },
                  });
                }}
                className="flex-1 items-center justify-center rounded-xl bg-blue-500 py-3"
              >
                <Text className="text-sm font-semibold text-white">
                  {t("common.more")}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                &ldquo;{word.replace(/[.,!?;:'"]/g, "")}&rdquo;
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <IconSymbol name="xmark" size={20} color={M.muted} />
              </Pressable>
            </View>
            <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              {t("lesson.wordNotFound")}
            </Text>
            <Pressable
              onPress={() => {
                onClose();
                router.push("/dictionary");
              }}
              className="flex-row items-center justify-center rounded-xl bg-blue-500 py-3"
            >
              <IconSymbol name="character.book.closed" size={16} color={M.parchment} />
              <Text className="ml-2 text-sm font-semibold text-white">
                {t("dictionaryPage.title")}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

export function InteractiveTranscript({ segments, onSegmentPress }: Props) {
  const { progress, seekTo, currentTrackId, shadowSegment, setShadowLoop } = useAudioStore();
  const { uiLanguage } = useUiLanguageStore();
  const { selectedLanguageId } = useLanguageStore();
  const { data: dictEntries = [] } = useDictionary(selectedLanguageId);
  const { data: savedIds } = useWordBank();
  const saveWord = useSaveWord();
  const scrollRef = useRef<ScrollView>(null);
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  // Flag to suppress parent segment-seek when a word was tapped
  const wordTappedRef = useRef(false);

  // O(1) dictionary lookup set instead of O(n) .some() per word
  const dictWordSet = useMemo(
    () => new Set(dictEntries.map((e) => e.word.toLowerCase())),
    [dictEntries]
  );

  const savedSet = useMemo(
    () => new Set(savedIds ?? []),
    [savedIds]
  );

  const activeIndex = segments.findIndex(
    (seg) => progress >= seg.startTime && progress < seg.endTime
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeIndex >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        y: Math.max(0, activeIndex * 80 - 100),
        animated: true,
      });
    }
  }, [activeIndex]);

  const findEntry = useCallback(
    (word: string) => {
      const normalized = word.toLowerCase().replace(/[.,!?;:'"]/g, "");
      if (!normalized) return null;
      // Exact match
      const exact = dictEntries.find(
        (e) => e.word.toLowerCase() === normalized
      );
      if (exact) return exact;
      // Prefix match (e.g. "Baidẹ" matches "baidẹ-o")
      const prefix = dictEntries.find(
        (e) => e.word.toLowerCase().startsWith(normalized) || normalized.startsWith(e.word.toLowerCase())
      );
      if (prefix) return prefix;
      return null;
    },
    [dictEntries]
  );

  const matchedEntry = lookupWord ? findEntry(lookupWord) : null;

  const handleWordPress = useCallback((word: string) => {
    wordTappedRef.current = true;
    setLookupWord(word);
  }, []);

  const handleSegmentPress = useCallback(
    (segment: TranscriptSegment) => {
      // Skip segment seek if a word was just tapped
      if (wordTappedRef.current) {
        wordTappedRef.current = false;
        return;
      }
      if (currentTrackId) {
        seekTo(segment.startTime);
      }
      onSegmentPress?.(segment);
    },
    [currentTrackId, seekTo, onSegmentPress]
  );

  const handleShadowLoop = useCallback(
    (segment: TranscriptSegment, e: GestureResponderEvent) => {
      e.stopPropagation();
      const isLooping = shadowSegment?.startTime === segment.startTime;
      if (isLooping) {
        setShadowLoop(null);
      } else {
        setShadowLoop({ startTime: segment.startTime, endTime: segment.endTime });
        if (currentTrackId) seekTo(segment.startTime);
      }
    },
    [shadowSegment, setShadowLoop, currentTrackId, seekTo]
  );

  if (segments.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-sm text-neutral-400">
          No transcript available
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
        {segments.map((segment, index) => {
          const isActive = index === activeIndex;
          const words = segment.text.split(/(\s+)/);

          const isLoopingThisSegment = shadowSegment?.startTime === segment.startTime;

          return (
            <Pressable
              key={segment.id}
              onPress={() => handleSegmentPress(segment)}
              className={`relative border-l-2 px-4 py-3 ${
                isLoopingThisSegment
                  ? "border-l-amber-400 bg-amber-50"
                  : isActive
                  ? "border-l-blue-500 bg-blue-50"
                  : "border-l-transparent"
              }`}
            >
              <Text
                className={`text-base leading-6 ${
                  isLoopingThisSegment
                    ? "font-semibold text-amber-700"
                    : isActive
                    ? "font-semibold text-blue-700"
                    : "text-neutral-800"
                }`}
              >
                {words.map((w, i) => {
                  // Whitespace — render as-is
                  if (/^\s+$/.test(w)) return w;
                  const cleaned = w.toLowerCase().replace(/[.,!?;:'"]/g, "");
                  const inDict = dictWordSet.has(cleaned);
                  // All words are tappable; dictionary words get dotted underline
                  return (
                    <Text
                      key={i}
                      onPress={() => handleWordPress(w)}
                      style={inDict ? { textDecorationLine: "underline", textDecorationStyle: "dotted" } : undefined}
                    >
                      {w}
                    </Text>
                  );
                })}
              </Text>
              {localize(segment.translation, uiLanguage) ? (
                <Text
                  className={`mt-1 text-sm ${
                    isLoopingThisSegment
                      ? "text-amber-500"
                      : isActive
                      ? "text-blue-500"
                      : "text-neutral-500"
                  }`}
                >
                  {localize(segment.translation, uiLanguage)}
                </Text>
              ) : null}
              {segment.colorHex && (
                <View
                  className="mt-1.5 flex-row items-center gap-1.5"
                  accessible={false}
                >
                  <View
                    className="h-4 w-4 rounded-full border border-neutral-200"
                    style={{ backgroundColor: segment.colorHex }}
                  />
                  <View
                    className="h-1.5 flex-1 rounded-full border border-neutral-200"
                    style={{ backgroundColor: segment.colorHex, opacity: 0.3 }}
                  />
                </View>
              )}
              {currentTrackId && (
                <Pressable
                  onPress={(e) => handleShadowLoop(segment, e)}
                  hitSlop={8}
                  className="absolute right-3 top-3"
                  accessibilityLabel={isLoopingThisSegment ? "Stop looping phrase" : "Loop this phrase"}
                >
                  <IconSymbol
                    name="repeat.1"
                    size={16}
                    color={isLoopingThisSegment ? getAccent("amber").solid : JOURNEY.capLocked}
                  />
                </Pressable>
              )}
            </Pressable>
          );
        })}
        <View className="h-20" />
      </ScrollView>

      {lookupWord && (
        <WordLookupSheet
          word={lookupWord}
          entry={matchedEntry}
          saved={matchedEntry ? savedSet.has(matchedEntry.id) : false}
          onSave={() => {
            if (matchedEntry) saveWord.mutate(matchedEntry.id);
          }}
          onClose={() => setLookupWord(null)}
        />
      )}
    </>
  );
}
