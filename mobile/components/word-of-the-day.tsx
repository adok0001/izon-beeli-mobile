import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWordOfTheDay } from "@/lib/hooks/use-word-of-the-day";
import { useSaveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { localizeField } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface Props {
  languageId: string;
}

export function WordOfTheDay({ languageId }: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const word = useWordOfTheDay(languageId);
  const { data: savedIds } = useWordBank();
  const saveWord = useSaveWord();
  const router = useRouter();

  if (!word) return null;

  const isSaved = savedIds?.includes(word.id) ?? false;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/word/[id]", params: { id: word.id, languageId: word.languageId } })}
      className="active:opacity-70"
    >
      <View style={{ borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}>
        <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <IconSymbol name="star.fill" size={16} color={M.accent} />
            <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.accent }}>
              {t("wordOfTheDay.title")}
            </Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              if (!isSaved) saveWord.mutate(word.id);
            }}
            hitSlop={8}
          >
            <IconSymbol
              name={isSaved ? "bookmark.fill" : "bookmark"}
              size={18}
              color={isSaved ? M.accent : M.muted}
            />
          </Pressable>
        </View>

        <Text style={{ fontSize: 24, fontWeight: "700", color: M.text }}>{word.word}</Text>

        {word.pronunciation && (
          <Text style={{ marginTop: 2, fontSize: 13, fontStyle: "italic", color: M.sub }}>
            /{word.pronunciation}/
          </Text>
        )}

        <Text style={{ marginTop: 4, fontSize: 15, color: M.text }}>
          {localizeField(word.english, word.french, uiLanguage)}
        </Text>

        {word.example && (
          <View style={{ marginTop: 12, borderRadius: 8, backgroundColor: M.accentGlow, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: M.accentBorder }}>
            <Text style={{ fontSize: 13, color: M.text }}>{word.example}</Text>
            {word.exampleTranslation && (
              <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>
                {localizeField(word.exampleTranslation, word.exampleTranslationFr, uiLanguage)}
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
