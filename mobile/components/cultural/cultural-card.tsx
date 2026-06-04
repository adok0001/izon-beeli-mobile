import { localizeField } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { CulturalContent } from "@/types";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface Props {
  item: CulturalContent;
  onPress?: () => void;
}

export function CulturalCard({ item, onPress }: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const categoryLabel = t(`cultural.categories.${item.category}` as any, { defaultValue: item.category });

  return (
    <Pressable
      onPress={onPress}
      style={{ marginRight: 12, width: 224, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}
      className="active:opacity-70"
    >
      <Text style={{ fontSize: 36 }}>{item.imageEmoji}</Text>

      <View style={{ marginTop: 8, alignSelf: "flex-start", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: M.accentBorder }}>
        <Text style={{ fontSize: 11, fontWeight: "500", color: M.accent }}>
          {categoryLabel}
        </Text>
      </View>

      <Text
        style={{ marginTop: 8, fontSize: 16, fontWeight: "700", color: M.text }}
        numberOfLines={1}
      >
        {localizeField(item.title, item.titleFr, uiLanguage)}
      </Text>
      <Text
        style={{ marginTop: 4, fontSize: 13, lineHeight: 18, color: M.sub }}
        numberOfLines={2}
      >
        {localizeField(item.description, item.descriptionFr, uiLanguage)}
      </Text>
    </Pressable>
  );
}
