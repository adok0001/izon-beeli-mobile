import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { LessonCheck } from "@/types";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

const CHECK_TYPE_LABEL: Record<string, string> = {
  "predict-next": "What comes next?",
  meaning: "What does it mean?",
  "who-said": "Who said it?",
  cloze: "Fill the gap",
  "pick-reply": "How do you reply?",
};

/**
 * One in-lesson check, rendered inline in the transcript at its anchor — the
 * interactive sibling of the cultural-note card. Low-stakes by design: answer
 * (or reveal), read the explanation, keep listening. Wrong answers show the
 * correct one; nothing blocks, nothing is scored.
 */
function CheckCard({ check }: Readonly<{ check: LessonCheck }>) {
  const M = useMuseumTheme();
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const answered = picked !== null || revealed;
  const hasOptions = check.options.length > 0;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: M.accentBorder,
        backgroundColor: M.accentGlow,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <IconSymbol name="questionmark.circle.fill" size={14} color={M.accent} />
        <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", color: M.accent }}>
          {CHECK_TYPE_LABEL[check.type] ?? "Quick check"}
        </Text>
      </View>

      <Text style={{ fontSize: 15, fontWeight: "600", lineHeight: 21, color: M.text }}>{check.prompt}</Text>

      {hasOptions ? (
        <View style={{ marginTop: 10, gap: 6 }}>
          {check.options.map((opt) => {
            const isCorrect = opt === check.answer;
            const isPicked = picked === opt;
            // Pre-answer: neutral. Post-answer: correct option always shows
            // green; a wrong pick shows red; the rest dim.
            const bg = !answered ? M.card : isCorrect ? M.successBg : isPicked ? M.errorBg : M.card;
            const border = !answered ? M.border : isCorrect ? M.success : isPicked ? M.error : M.border;
            const color = !answered ? M.text : isCorrect ? M.success : isPicked ? M.error : M.muted;
            return (
              <Pressable
                key={opt}
                disabled={answered}
                onPress={() => setPicked(opt)}
                style={{ borderRadius: 10, borderWidth: 1, borderColor: border, backgroundColor: bg, paddingHorizontal: 12, paddingVertical: 9 }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 14, fontWeight: answered && isCorrect ? "700" : "500", color }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ marginTop: 10 }}>
          {revealed ? (
            <View style={{ borderRadius: 10, borderWidth: 1, borderColor: M.success, backgroundColor: M.successBg, paddingHorizontal: 12, paddingVertical: 9 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.success }}>{check.answer}</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => setRevealed(true)}
              style={{ alignSelf: "flex-start", borderRadius: 999, backgroundColor: M.accent, paddingHorizontal: 14, paddingVertical: 8 }}
              className="active:opacity-80"
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: M.ink }}>Think, then reveal</Text>
            </Pressable>
          )}
        </View>
      )}

      {answered && check.explanation ? (
        <Text style={{ marginTop: 10, fontSize: 13, lineHeight: 19, color: M.sub }}>{check.explanation}</Text>
      ) : null}
    </View>
  );
}

/** The checks anchored to one transcript position, in authored order. */
export function LessonCheckCards({ checks }: Readonly<{ checks: LessonCheck[] }>) {
  if (checks.length === 0) return null;
  return (
    <>
      {checks.map((check) => (
        <CheckCard key={check.id} check={check} />
      ))}
    </>
  );
}
