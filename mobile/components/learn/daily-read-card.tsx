import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Eyebrow } from "@/components/ui/section-header";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { DictionaryEntry } from "@/lib/dictionary";

interface DailyReadCardProps {
  entry: DictionaryEntry | null;
}

export function DailyReadCard({ entry }: DailyReadCardProps) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();

  if (!entry) return null;

  const gloss = entry.translations ? localize(entry.translations, uiLanguage) : (typeof entry.english === "string" ? entry.english : localize(entry.english, uiLanguage));

  return (
    <Pressable
      onPress={() => router.push("/word-challenge")}
      style={{
        marginHorizontal: 20,
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`${t("learn.dailyRead", { defaultValue: "Daily Read" })}: ${entry.word}`}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          backgroundColor: M.accentGlow,
          borderWidth: 1.5,
          borderColor: M.accentBorder,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconSymbol name="book.fill" size={22} color={M.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Eyebrow
          label={t("learn.dailyRead", { defaultValue: "Daily Read" })}
          tone="accent"
          style={{ marginBottom: 2 }}
        />
        <Text style={{ fontSize: 16, fontWeight: "800", color: M.text }} numberOfLines={1}>
          {entry.word}
        </Text>
        {gloss ? (
          <Text style={{ fontSize: 13, color: M.sub }} numberOfLines={1}>
            {gloss}
          </Text>
        ) : null}
      </View>
      <IconSymbol name="chevron.right" size={16} color={M.muted} />
    </Pressable>
  );
}
