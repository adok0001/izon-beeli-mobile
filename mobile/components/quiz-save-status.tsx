import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { QuizResultStatus } from "@/lib/hooks/use-quiz-result";
import { Pressable, Text, View } from "react-native";

/**
 * Subtle, non-blocking notice shown on an activity's results screen when the
 * score save failed. Only renders on error — a successful/pending save stays
 * silent so it doesn't distract from the result itself.
 */
export function QuizSaveStatus({
  status,
  onRetry,
}: {
  status: QuizResultStatus;
  onRetry: () => void;
}) {
  const M = useMuseumTheme();
  if (status !== "error") return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
      <Text style={{ fontSize: 12, color: "#ef4444", textAlign: "center" }}>Couldn&apos;t save your score.</Text>
      <Pressable onPress={onRetry} hitSlop={8} className="active:opacity-60">
        <Text style={{ fontSize: 12, fontWeight: "800", color: M.accent }}>Retry</Text>
      </Pressable>
    </View>
  );
}
