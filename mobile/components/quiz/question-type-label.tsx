import { View, Text } from "react-native";
import type { QuizQuestion } from "@/types";

const labels: Record<string, string> = {
  "word-to-english": "Translate to English",
  "english-to-word": "Translate from English",
  "fill-in-the-blank": "Fill in the Blank",
  listening: "Listening Comprehension",
};

export function QuestionTypeLabel({ type }: { type: QuizQuestion["type"] }) {
  return (
    <View className="mb-2 self-start rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900">
      <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
        {labels[type] ?? type}
      </Text>
    </View>
  );
}
