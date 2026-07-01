import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { LessonSectionHeader } from "@/components/lesson/lesson-section-header";
import type { LocalizedText } from "@/types";
import type { UiLanguage } from "@/store/ui-language-store";

interface LessonObjectivesProps {
  objectives: (string | LocalizedText)[];
  uiLanguage: UiLanguage;
  accentColor: string;
}

function CheckIcon() {
  return (
    <Svg viewBox="0 0 20 20" width={18} height={18}>
      <Path
        d="M4 10l4 4 8-8"
        stroke="#C4862A"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function LessonObjectives({ objectives, uiLanguage, accentColor }: LessonObjectivesProps) {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  if (!objectives.length) return null;

  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
      <LessonSectionHeader label={t("lesson.whatYouWillLearn", { defaultValue: "What you'll learn" })} accentColor={accentColor} paddingHorizontal={0} />
      <View style={{ gap: 10 }}>
        {objectives.map((obj, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(196,134,42,0.12)",
                borderWidth: 1,
                borderColor: "rgba(196,134,42,0.35)",
                marginTop: 1,
              }}
            >
              <CheckIcon />
            </View>
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: M.sub }}>
              {localize(obj, uiLanguage)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
