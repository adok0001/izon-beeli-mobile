import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { formatDuration } from "@/lib/mock-data";

interface LessonMetaPillsProps {
  level?: string | null;
  wordCount?: number;
  duration?: number;
  accentColor: string;
}

function Pill({ children }: { children: React.ReactNode }) {
  const M = useMuseumTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: M.pillBg,
        borderWidth: 1,
        borderColor: M.border,
      }}
    >
      {children}
    </View>
  );
}

export function LessonMetaPills({ level, wordCount, duration, accentColor }: LessonMetaPillsProps) {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 22, paddingTop: 16 }}>
      {level ? (
        <Pill>
          <Text style={{ fontSize: 11.5, fontWeight: "700", color: accentColor }}>★ </Text>
          <Text style={{ fontSize: 11.5, fontWeight: "700", color: M.sub }}>
            {t("lesson.niveau", { level: t(`levels.${level}`, { defaultValue: level }), defaultValue: `Level ${level}` })}
          </Text>
        </Pill>
      ) : null}
      {wordCount ? (
        <Pill>
          <Text style={{ fontSize: 11.5, fontWeight: "700", color: M.sub }}>
            {`📖 ${t("lesson.wordsCount", { n: wordCount, defaultValue: `${wordCount} words` })}`}
          </Text>
        </Pill>
      ) : null}
      {duration ? (
        <Pill>
          <Text style={{ fontSize: 11.5, fontWeight: "700", color: M.sub }}>
            {`⏱ ${formatDuration(duration)}`}
          </Text>
        </Pill>
      ) : null}
    </View>
  );
}
