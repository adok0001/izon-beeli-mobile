import { View, Text } from "react-native";
import type { QuizQuestion } from "@/types";
import { useMuseumTheme } from "@/lib/use-museum-theme";

const labels: Record<string, string> = {
  "word-to-english": "Translate to English",
  "english-to-word": "Translate from English",
  "fill-in-the-blank": "Fill in the Blank",
  listening: "Listening Comprehension",
};

export function QuestionTypeLabel({ type }: { type: QuizQuestion["type"] }) {
  const M = useMuseumTheme();
  return (
    <View style={{ marginBottom: 8, alignSelf: "flex-start", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: M.accentBorder }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.accent }}>
        {labels[type] ?? type}
      </Text>
    </View>
  );
}
