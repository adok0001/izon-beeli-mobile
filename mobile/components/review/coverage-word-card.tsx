import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDictionaryCoverage } from "@/lib/hooks/use-contributions";
import { useLessonsForWord } from "@/lib/hooks/use-lessons-for-word";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export type CoverageMissingWord = NonNullable<
  ReturnType<typeof useDictionaryCoverage>["data"]
>["missing"][number];

/** Renders a transcript sentence with the target word emphasized. */
function HighlightedUsage({ text, word }: { text: string; word: string }) {
  const parts = useMemo(() => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.split(new RegExp(`(${escaped})`, "gi"));
  }, [text, word]);

  return (
    <Text className="mt-0.5 text-sm leading-5 text-neutral-700 dark:text-neutral-300">
      {parts.map((part, i) =>
        part.toLocaleLowerCase() === word.toLocaleLowerCase() ? (
          <Text key={i} className="font-bold text-neutral-900 dark:text-white">
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

export function CoverageWordCard({
  item,
  languageId,
  onContribute,
}: {
  item: CoverageMissingWord;
  languageId: string;
  onContribute: () => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const [expanded, setExpanded] = useState(false);
  // Resolve the real transcript lines locally (same source as the word screen),
  // so educators see how the word is actually used — not just lesson names.
  const matches = useLessonsForWord(item.word, languageId);
  const canOpen = matches.length > 0;

  return (
    <View className="mx-5 mb-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <Pressable
        onPress={() => canOpen && setExpanded((e) => !e)}
        className="flex-row items-center px-4 py-3 active:opacity-70"
      >
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {item.word}
            <Text className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
              {"  "}×{item.count}
            </Text>
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {item.lessons.map((l) => l.title).join(", ")}
          </Text>
        </View>
        {canOpen ? (
          <IconSymbol name={expanded ? "chevron.up" : "chevron.down"} size={16} color={M.muted} />
        ) : null}
        <Pressable onPress={onContribute} hitSlop={8} className="ml-3 active:opacity-70">
          <IconSymbol name="plus.circle" size={22} color={M.accent} />
        </Pressable>
      </Pressable>

      {expanded && canOpen ? (
        <View className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("review.coverageUsageTitle")}
          </Text>
          {matches.map(({ lesson, segment }, i) => {
            const translation = localize(segment.translation, uiLanguage);
            return (
              <View key={lesson.id} className={i > 0 ? "mt-3" : undefined}>
                <View className="flex-row items-center">
                  <IconSymbol
                    name={lesson.type === "song" ? "music.note" : "book.fill"}
                    size={13}
                    color={M.accent}
                  />
                  <Text
                    className="ml-1.5 flex-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400"
                    numberOfLines={1}
                  >
                    {localize(lesson.title, uiLanguage)}
                  </Text>
                </View>
                <HighlightedUsage text={segment.text} word={item.word} />
                {!!translation && (
                  <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {translation}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
