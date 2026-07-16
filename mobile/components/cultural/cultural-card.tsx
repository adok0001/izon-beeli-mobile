import { IconSymbol } from "@/components/ui/icon-symbol";
import { CULTURE_CATEGORY_ICON } from "@/constants/cultural-categories";
import { ShareModal } from "@/components/share/share-modal";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { CulturalContent } from "@/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TouchableOpacity, View } from "react-native";

interface Props {
  item: CulturalContent;
  onPress?: () => void;
}

export function CulturalCard({ item, onPress }: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const [shareVisible, setShareVisible] = useState(false);
  const categoryLabel = t(`cultural.categories.${item.category}` as any, { defaultValue: item.category });

  return (
    <>
      <Pressable
        onPress={onPress}
        style={{ marginRight: 12, width: 224, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}
        className="active:opacity-70"
      >
        <IconSymbol name={CULTURE_CATEGORY_ICON[item.category]} size={30} color={M.accent} />

        <View style={{ marginTop: 8, alignSelf: "flex-start", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: M.accentBorder }}>
          <Text style={{ fontSize: 11, fontWeight: "500", color: M.accent }}>
            {categoryLabel}
          </Text>
        </View>

        <Text
          style={{ marginTop: 8, fontSize: 16, fontWeight: "700", color: M.text }}
          numberOfLines={1}
        >
          {localize(item.title, uiLanguage)}
        </Text>
        <Text
          style={{ marginTop: 4, fontSize: 13, lineHeight: 18, color: M.sub }}
          numberOfLines={2}
        >
          {localize(item.description, uiLanguage)}
        </Text>

        <TouchableOpacity
          onPress={() => setShareVisible(true)}
          style={{ position: "absolute", top: 10, right: 12 }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityLabel="Share content"
        >
          <IconSymbol name="square.and.arrow.up" size={15} color={M.muted} />
        </TouchableOpacity>
      </Pressable>

      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        data={{
          template: "cultural",
          languageId: item.languageId,
          title: localize(item.title, uiLanguage),
          description: localize(item.description, uiLanguage),
          category: categoryLabel,
          icon: CULTURE_CATEGORY_ICON[item.category],
          language: item.languageId,
        }}
      />
    </>
  );
}
