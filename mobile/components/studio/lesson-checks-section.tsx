import { LabeledInput, SmallButton } from "@/components/studio/editor-form";
import { AnchorPicker } from "@/components/studio/lesson-cultural-section";
import type { SegmentEditor } from "@/components/studio/lesson-segment-editor";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, View } from "react-native";

export const CHECK_TYPES = ["predict-next", "meaning", "who-said", "cloze", "pick-reply"] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

const CHECK_TYPE_LABEL: Record<CheckType, string> = {
  "predict-next": "Predict next",
  meaning: "What does it mean?",
  "who-said": "Who said it?",
  cloze: "Fill the gap",
  "pick-reply": "Pick the reply",
};

/** Editor draft of one in-lesson check. Options as CSV for editing ease. */
export type CheckEditor = {
  uid: string;
  type: CheckType;
  prompt: string;
  answer: string;
  options: string;
  explanation: string;
  afterSegmentIndex: number | null;
};

let checkCounter = 0;
export function emptyCheck(): CheckEditor {
  checkCounter += 1;
  return {
    uid: `check-draft-${checkCounter}`,
    type: "meaning",
    prompt: "",
    answer: "",
    options: "",
    explanation: "",
    afterSegmentIndex: null,
  };
}

/** Wire format for the transactional lesson save. */
export function toChecksPayload(checks: CheckEditor[]) {
  return checks
    .filter((ch) => ch.prompt.trim() && ch.answer.trim())
    .map((ch) => ({
      type: ch.type,
      prompt: ch.prompt.trim(),
      answer: ch.answer.trim(),
      options: ch.options.split(",").map((o) => o.trim()).filter(Boolean),
      explanation: ch.explanation.trim() || null,
      afterSegmentIndex: ch.afterSegmentIndex,
    }));
}

/** Clamp anchors when the transcript shrinks — mirror of clampAttachments. */
export function clampChecks(checks: CheckEditor[], segments: SegmentEditor[]): CheckEditor[] {
  const max = segments.length - 1;
  return checks.map((ch) =>
    ch.afterSegmentIndex != null && ch.afterSegmentIndex > max ? { ...ch, afterSegmentIndex: null } : ch,
  );
}

/**
 * In-lesson checks — formative questions that pause the story at a transcript
 * line (predict-next / meaning / who-said / cloze / pick-reply). They ride the
 * same afterSegmentIndex rail as cultural notes and save atomically with the
 * lesson.
 */
export function LessonChecksSection({
  checks,
  segments,
  onChange,
}: Readonly<{
  checks: CheckEditor[];
  segments: SegmentEditor[];
  onChange: (next: CheckEditor[]) => void;
}>) {
  const M = useMuseumTheme();

  const update = (uid: string, patch: Partial<CheckEditor>) =>
    onChange(checks.map((ch) => (ch.uid === uid ? { ...ch, ...patch } : ch)));
  const remove = (uid: string) => onChange(checks.filter((ch) => ch.uid !== uid));

  return (
    <View>
      <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
        In-lesson checks ({checks.length})
      </Text>
      <Text className="mb-3 text-[11px]" style={{ color: M.muted }}>
        Low-stakes questions that fire between transcript lines — keep the learner
        predicting and processing, not just listening.
      </Text>

      {checks.map((ch, i) => (
        <View
          key={ch.uid}
          className="mb-3 rounded-xl border p-3"
          style={{ backgroundColor: M.inputBg, borderColor: M.border }}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold" style={{ color: M.sub }}>Check {i + 1}</Text>
            <Pressable onPress={() => remove(ch.uid)} hitSlop={8} className="active:opacity-60">
              <IconSymbol name="trash.fill" size={14} color={M.error} />
            </Pressable>
          </View>

          {/* Type chips */}
          <View className="mb-2 flex-row flex-wrap gap-1.5">
            {CHECK_TYPES.map((tpe) => {
              const active = ch.type === tpe;
              return (
                <Pressable
                  key={tpe}
                  onPress={() => update(ch.uid, { type: tpe })}
                  className="rounded-full border px-2.5 py-1"
                  style={active
                    ? { backgroundColor: M.accentGlow, borderColor: M.accentBorder }
                    : { backgroundColor: M.card, borderColor: M.border }}
                >
                  <Text className="text-[11px] font-semibold" style={{ color: active ? M.accent : M.sub }}>
                    {CHECK_TYPE_LABEL[tpe]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: 8 }}>
            <LabeledInput label="Prompt" value={ch.prompt} onChange={(v) => update(ch.uid, { prompt: v })} multiline />
            <LabeledInput label="Answer" value={ch.answer} onChange={(v) => update(ch.uid, { answer: v })} />
            <LabeledInput
              label="Options (comma-separated, include the answer; empty = tap-to-reveal)"
              value={ch.options}
              onChange={(v) => update(ch.uid, { options: v })}
            />
            <LabeledInput label="Explanation (shown after answering)" value={ch.explanation} onChange={(v) => update(ch.uid, { explanation: v })} />
          </View>

          <Text className="mt-2 text-[11px] font-semibold" style={{ color: M.sub }}>Fires after</Text>
          <AnchorPicker
            value={ch.afterSegmentIndex}
            segments={segments}
            onChange={(index) => update(ch.uid, { afterSegmentIndex: index })}
          />
        </View>
      ))}

      <SmallButton label="+ Add check" onPress={() => onChange([...checks, emptyCheck()])} M={M} />
    </View>
  );
}
