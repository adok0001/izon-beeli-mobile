import { GameEyebrow, GameOption, tint } from "@/components/games/game-kit";
import { ListeningQuestion } from "@/components/quiz/listening-question";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { AccentColor } from "@/constants/accent-colors";
import type { CheckpointQuestion } from "@/lib/checkpoint-rounds";
import { tWithVars } from "@/lib/i18n-dynamic";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

const BADGES = ["A", "B", "C", "D"];

/**
 * Renders one checkpoint question and reports the learner's answer.
 *
 * Both question kinds live here so the checkpoint screen stays a controller:
 * it owns scoring and progression, this owns presentation. Locked-in feedback
 * (`answered`) is shown with the Museum semantic success/error tokens, matching
 * every other game — only the identity chrome takes the round's accent.
 */
export function CheckpointQuestionView({
  question,
  accent,
  answer,
  answered,
  onAnswer,
}: {
  question: CheckpointQuestion;
  accent: AccentColor;
  /** The learner's current answer: the chosen option, or the tokens placed so far. */
  answer: string | string[] | null;
  /** Once locked in, the view shows correctness and stops accepting input. */
  answered: boolean;
  onAnswer: (answer: string | string[]) => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  if (question.kind === "choice") {
    const chosen = typeof answer === "string" ? answer : null;
    return (
      <View style={{ paddingHorizontal: 20 }}>
        <GameEyebrow
          label={t(`checkpoint.format.${question.format}`).toUpperCase()}
          accent={accent}
          align="center"
          style={{ marginBottom: 14 }}
        />

        {question.audio ? (
          <ListeningQuestion
            audioSource={question.audio.source}
            startTime={question.audio.startTime}
            endTime={question.audio.endTime}
          />
        ) : (
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: M.text,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {question.prompt}
          </Text>
        )}

        {question.options.map((option, i) => (
          <GameOption
            key={option}
            label={option}
            badge={BADGES[i]}
            accent={accent}
            state={
              !answered
                ? "default"
                : option === question.correct
                  ? "correct"
                  : option === chosen
                    ? "incorrect"
                    : "dimmed"
            }
            onPress={() => onAnswer(option)}
          />
        ))}
      </View>
    );
  }

  // ── Order (build the sentence) ─────────────────────────────────────────────
  const placed = Array.isArray(answer) ? answer : [];
  const isRight = placed.join(" ") === question.correct.join(" ");
  // Each tray token is consumed by position, so a sentence that repeats a word
  // ("mi ... mi") still offers both copies.
  const consumed = new Map<string, number>();
  for (const tok of placed) consumed.set(tok, (consumed.get(tok) ?? 0) + 1);

  const remaining: { token: string; key: string }[] = [];
  const used = new Map<string, number>();
  question.tokens.forEach((token, i) => {
    const seen = used.get(token) ?? 0;
    if (seen < (consumed.get(token) ?? 0)) {
      used.set(token, seen + 1);
      return;
    }
    used.set(token, seen + 1);
    remaining.push({ token, key: `${token}-${i}` });
  });

  const answerBorder = answered ? (isRight ? M.success : M.error) : accent.border;
  const answerBg = answered ? (isRight ? M.successBg : M.errorBg) : tint(accent.solid, 0.06);

  return (
    <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <GameEyebrow
        label={t("checkpoint.format.build").toUpperCase()}
        accent={accent}
        align="center"
        style={{ marginBottom: 14 }}
      />

      <Text style={{ fontSize: 20, fontWeight: "700", color: M.text, textAlign: "center", marginBottom: 20 }}>
        {question.prompt}
      </Text>

      {/* Where the sentence is assembled — tap a placed token to take it back. */}
      <View
        style={{
          minHeight: 78,
          borderRadius: 14,
          borderWidth: 2,
          borderStyle: answered ? "solid" : "dashed",
          borderColor: answerBorder,
          backgroundColor: answerBg,
          padding: 12,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          alignContent: "flex-start",
          marginBottom: 20,
        }}
        accessibilityLabel={t("checkpoint.yourSentence")}
      >
        {placed.length === 0 ? (
          <Text style={{ fontSize: 13, color: M.muted, alignSelf: "center" }}>
            {t("checkpoint.tapWordsHint")}
          </Text>
        ) : (
          placed.map((token, i) => (
            <Pressable
              key={`${token}-${i}`}
              disabled={answered}
              onPress={() => onAnswer(placed.filter((_, j) => j !== i))}
              style={{
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: M.card,
                borderWidth: 1,
                borderColor: M.border,
              }}
              className="active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={tWithVars(t, "checkpoint.removeWord", { word: token })}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{token}</Text>
            </Pressable>
          ))
        )}
      </View>

      {answered && !isRight ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <IconSymbol name="checkmark.circle.fill" size={14} color={M.success} />
          <Text style={{ fontSize: 14, color: M.sub, flex: 1 }}>{question.correct.join(" ")}</Text>
        </View>
      ) : null}

      {/* The token tray */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {remaining.map(({ token, key }) => (
          <Pressable
            key={key}
            disabled={answered}
            onPress={() => onAnswer([...placed, token])}
            style={{
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: tint(accent.solid, 0.12),
              borderWidth: 1.5,
              borderColor: tint(accent.solid, 0.35),
              opacity: answered ? 0.4 : 1,
            }}
            className="active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={tWithVars(t, "checkpoint.addWord", { word: token })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: accent.solid }}>{token}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
