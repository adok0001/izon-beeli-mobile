import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ContentTeaserCard } from "@/components/ui/section-header";
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
    <ContentTeaserCard
      eyebrow={t("learn.dailyRead", { defaultValue: "Daily Read" })}
      eyebrowTone="accent"
      icon="book.fill"
      iconColor={M.accent}
      iconBackground={M.accentGlow}
      iconBorderColor={M.accentBorder}
      accentColor={M.accent}
      title={entry.word}
      subtitle={gloss || undefined}
      onPress={() => router.push("/word-challenge")}
      accessibilityLabel={`${t("learn.dailyRead", { defaultValue: "Daily Read" })}: ${entry.word}`}
    />
  );
}
