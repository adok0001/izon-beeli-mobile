import { IconSymbol } from "@/components/ui/icon-symbol";
import { localizeField } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Proverb } from "@/types";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface Props {
  proverb: Proverb;
  compact?: boolean;
}

export function ProverbCard({ proverb, compact = false }: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();

  return (
    <View style={{ borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border, borderLeftWidth: 4, borderLeftColor: M.accent }}>
      <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
        <IconSymbol name="text.quote" size={14} color={M.accent} />
        <Text style={{ marginLeft: 6, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.accent }}>
          {t("proverbs.label")}
        </Text>
      </View>

      <Text style={{ fontSize: 16, fontWeight: "600", fontStyle: "italic", color: M.text }}>
        &ldquo;{proverb.text}&rdquo;
      </Text>

      <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 18, color: M.sub }}>
        {localizeField(proverb.translation, proverb.translationFr, uiLanguage)}
      </Text>

      {!compact && (
        <View style={{ marginTop: 12, borderRadius: 8, backgroundColor: M.accentGlow, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: M.accentBorder }}>
          <Text style={{ fontSize: 12, lineHeight: 17, color: M.sub }}>
            {localizeField(proverb.meaning, proverb.meaningFr, uiLanguage)}
          </Text>
        </View>
      )}
    </View>
  );
}
