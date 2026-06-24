import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Path, Rect } from "react-native-svg";
import { JOURNEY } from "@/lib/journey";
import { LessonSectionHeader } from "@/components/lesson/lesson-section-header";

type StepKey =
  | "stepListen"
  | "stepStory"
  | "stepFlashcards"
  | "stepQuiz"
  | "stepReview"
  | "stepWriteReflection";

export interface ProgramStep {
  key: StepKey;
  onPress?: () => void;
}

interface LessonProgramProps {
  steps: ProgramStep[];
  accentColor: string;
  /** Horizontal padding for the header + step rows. Defaults to 22 (full-page).
   *  Pass 0 when embedding inside an already-padded container (e.g. the sheet). */
  paddingHorizontal?: number;
}

// Render functions so the colour is resolved fresh each render (safe for future dynamic theming).
const STEP_ICONS: Record<StepKey, () => React.ReactNode> = {
  stepListen: () => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" />
      <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke={JOURNEY.bronze} strokeWidth={2} />
    </Svg>
  ),
  stepStory: () => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  stepFlashcards: () => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Rect x={2} y={5} width={20} height={14} rx={3} stroke={JOURNEY.bronze} strokeWidth={2} />
      <Path d="M8 12h8M12 8v8" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  ),
  stepQuiz: () => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path d="M8 21l8-18" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3 9h18M3 15h18" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  ),
  stepReview: () => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  stepWriteReflection: () => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" stroke={JOURNEY.bronze} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
};

export function LessonProgram({ steps, accentColor, paddingHorizontal = 22 }: LessonProgramProps) {
  const { t } = useTranslation();
  if (!steps.length) return null;

  const headerLabel = `${t("lesson.program", { defaultValue: "Programme" })} · ${t("lesson.stepsCount", { n: steps.length, defaultValue: `${steps.length} steps` })}`;

  return (
    <View style={{ paddingTop: 24 }}>
      <LessonSectionHeader label={headerLabel} accentColor={accentColor} paddingHorizontal={paddingHorizontal} />
      <View style={{ paddingHorizontal, gap: 2 }}>
        {steps.map((step, i) => {
          // Interactive on the lesson page (each step deep-links), but a static
          // preview when embedded in the course-review sheet (no onPress yet).
          const Row = step.onPress ? Pressable : View;
          return (
          <Row
            key={step.key}
            onPress={step.onPress}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: JOURNEY.pillBg,
              borderWidth: 1,
              borderColor: JOURNEY.hairline,
            }}
            className={step.onPress ? "active:opacity-70" : undefined}
            accessibilityRole={step.onPress ? "button" : undefined}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(196,134,42,0.10)",
              }}
            >
              {STEP_ICONS[step.key]()}
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: JOURNEY.sheetBody }}>
              {t(`lesson.${step.key}`, { defaultValue: step.key })}
            </Text>
            <Text style={{ fontSize: 11.5, fontWeight: "700", color: JOURNEY.capLocked }}>
              {String(i + 1).padStart(2, "0")}
            </Text>
          </Row>
          );
        })}
      </View>
    </View>
  );
}
