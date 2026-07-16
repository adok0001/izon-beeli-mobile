import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { formatDuration } from "@/lib/mock-data";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import type { Lesson } from "@/types";

/** The "you can now …" competence claim, plus the skills it exercised. */
export interface LessonCanDo {
  text: string;
  label: string;
  skills: { icon: IconSymbolName | null; label: string }[];
  addToAbilitiesLabel: string;
}

/** The production prompt echoed back at the learner ("say it back"). */
export interface LessonProveIt {
  /** The translation shown as the prompt (what the learner must produce). */
  text: string;
  label: string;
  /** The target-language line to say back — seeds the Say It Back screen. */
  native: string;
}

interface Props {
  lesson: Lesson;
  /** Distinct words in the lesson, when known. */
  wordCount?: number;
  accentColor: string;
  headerHeight: number;
  canDo: LessonCanDo;
  proveIt: LessonProveIt;
  /** Next lesson in the course/season, if there is one that isn't this lesson. */
  nextLessonId?: string;
  /** Extra route params to carry into the next lesson (e.g. season origin). */
  nextLessonParams?: Record<string, string>;
  /** Leave the summary and return to the transcript. */
  onDismiss: () => void;
}

/**
 * The post-completion screen: what you learned, what you can now do, what's next.
 * Shown in place of the lesson body once the learner marks it complete.
 */
export function LessonSummary({
  lesson,
  wordCount,
  accentColor,
  headerHeight,
  canDo,
  proveIt,
  nextLessonId,
  nextLessonParams,
  onDismiss,
}: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const isSong = lesson.type === "song";
  const quizTarget = { pathname: "/quiz" as const, params: { courseId: lesson.courseId, lessonId: lesson.id } };
  // "Prove it — say it back" is a speaking prompt, so it opens the record-and-
  // compare screen seeded with this lesson's line (not the multiple-choice quiz).
  const proveItTarget = {
    pathname: "/say-it-back" as const,
    params: { phrase: proveIt.native, gloss: proveIt.text },
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: M.bg }}
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: headerHeight + 16, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: M.successBg,
            borderWidth: 1.5,
            borderColor: M.successBorder,
          }}
        >
          <IconSymbol name="checkmark.circle.fill" size={38} color={M.success} />
        </View>
        <Text style={{ marginTop: 14, fontSize: 22, fontWeight: "900", color: M.text, letterSpacing: -0.3 }}>
          {t("lesson.summary")}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
        {wordCount ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: M.accentGlow,
              borderWidth: 1,
              borderColor: M.accentBorder,
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "900", color: M.accent }}>{wordCount}</Text>
            <Text
              style={{ marginTop: 4, fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: M.muted }}
            >
              {t("lesson.wordsLearned")}
            </Text>
          </View>
        ) : null}
        {lesson.duration ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: M.successBg,
              borderWidth: 1,
              borderColor: M.successBorder,
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "900", color: M.success }}>
              {formatDuration(lesson.duration)}
            </Text>
            <Text
              style={{ marginTop: 4, fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: M.muted }}
            >
              {t("lesson.timeSpent")}
            </Text>
          </View>
        ) : null}
      </View>

      {canDo.text ? (
        <View
          style={{
            marginBottom: 12,
            borderRadius: 16,
            padding: 18,
            backgroundColor: M.accentGlow,
            borderWidth: 1,
            borderColor: M.accentBorder,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <IconSymbol name="checkmark.seal.fill" size={14} color={M.accent} />
            <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: M.accent }}>
              {canDo.label}
            </Text>
          </View>
          <Text style={{ fontSize: 16, lineHeight: 23, fontWeight: "600", color: M.text }}>{canDo.text}</Text>

          {canDo.skills.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                gap: 14,
                marginTop: 16,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: M.border,
              }}
            >
              {canDo.skills.map((skill, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  {skill.icon ? <IconSymbol name={skill.icon} size={20} color={M.accent} /> : null}
                  <Text style={{ marginTop: 4, fontSize: 11, color: M.sub }}>{skill.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {proveIt.text && proveIt.native ? (
            <Pressable
              onPress={() => router.push(proveItTarget)}
              style={{
                marginTop: 14,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: M.pillBg,
                borderWidth: 1,
                borderColor: M.border,
                borderRadius: 12,
                padding: 12,
              }}
              className="active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={`${proveIt.label}: ${proveIt.text}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", color: M.muted }}>
                  {proveIt.label}
                </Text>
                <Text style={{ marginTop: 5, fontSize: 15, fontWeight: "700", color: M.text }}>{proveIt.text}</Text>
              </View>
              <IconSymbol name="mic.fill" size={16} color={M.accent} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {canDo.text ? (
        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          style={{
            marginBottom: 28,
            backgroundColor: M.accent,
            alignItems: "center",
            paddingVertical: 15,
            borderRadius: 14,
          }}
          className="active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={canDo.addToAbilitiesLabel}
        >
          <Text style={{ fontSize: 15, fontWeight: "800", color: M.parchment }}>{canDo.addToAbilitiesLabel} →</Text>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <View style={{ width: 16, height: 1, backgroundColor: `${accentColor}60` }} />
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase", color: M.muted }}>
          {t("lesson.whatsNext")}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
      </View>

      <View style={{ gap: 10 }}>
        {nextLessonId ? (
          <Pressable
            onPress={() => {
              onDismiss();
              router.replace({ pathname: "/lesson/[id]", params: { id: nextLessonId, ...(nextLessonParams ?? {}) } });
            }}
            style={{ borderRadius: 16, overflow: "hidden" }}
            className="active:opacity-75"
            accessibilityRole="button"
            accessibilityLabel={t("lesson.continueToNext")}
          >
            <LinearGradient
              colors={[MUSEUM.accentLight, MUSEUM.accentDark]}
              style={{ paddingVertical: 16, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.parchment }}>
                {t("lesson.continueToNext")} ›
              </Text>
            </LinearGradient>
          </Pressable>
        ) : null}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.push(quizTarget)}
            style={{
              flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16,
              borderWidth: 1, borderColor: `${accentColor}35`, backgroundColor: `${accentColor}08`,
            }}
            className="active:opacity-70"
            accessibilityRole="button"
          >
            <IconSymbol name="trophy.fill" size={18} color={accentColor} />
            <Text style={{ marginTop: 5, fontSize: 12, fontWeight: "700", color: accentColor }}>{t("lesson.takeQuiz")}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: "/word-review", params: { lessonId: lesson.id } })}
            style={{
              flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16,
              borderWidth: 1, borderColor: M.successBorder, backgroundColor: M.successBg,
            }}
            className="active:opacity-70"
            accessibilityRole="button"
          >
            <IconSymbol name="brain.head.profile" size={18} color={M.success} />
            <Text style={{ marginTop: 5, fontSize: 12, fontWeight: "700", color: M.success }}>{t("lesson.reviewWords")}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/journal")}
          style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
            borderWidth: 1, borderColor: M.border, backgroundColor: M.card,
          }}
          className="active:opacity-70"
          accessibilityRole="button"
        >
          <IconSymbol name="pencil.and.list.clipboard" size={16} color={M.muted} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: M.sub }}>{t("lesson.writeReflection")}</Text>
        </Pressable>

        <Pressable
          onPress={onDismiss}
          style={{ alignItems: "center", paddingVertical: 12 }}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 13, color: M.muted }}>
            {isSong ? t("songs.lyrics") : t("lesson.transcript")}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
