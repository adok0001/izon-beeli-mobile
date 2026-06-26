import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CourseArtwork } from "@/components/learn/course-artwork";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";

interface UpNextTeaserProps {
  nextCourse: Course | null;
  onPress: () => void;
}

export function UpNextTeaser({ nextCourse, onPress }: UpNextTeaserProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();

  if (!nextCourse) return null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        overflow: "hidden",
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`${t("learn.upNext", { defaultValue: "Up Next" })}: ${localize(nextCourse.title, uiLanguage)}`}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 72, height: 72 }}>
          <CourseArtwork course={nextCourse} size="thumb" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 14 }}>
          <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.2, color: M.accent, marginBottom: 2 }}>
            {t("learn.upNext", { defaultValue: "UP NEXT" }).toUpperCase()}
          </Text>
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: M.text, lineHeight: 18 }}
            numberOfLines={2}
          >
            {localize(nextCourse.title, uiLanguage)}
          </Text>
        </View>
        <View style={{ paddingRight: 16 }}>
          <Text style={{ fontSize: 18, color: M.muted }}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}
