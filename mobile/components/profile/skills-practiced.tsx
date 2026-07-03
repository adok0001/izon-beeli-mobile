import { SKILL_META } from "@/constants/course-colors";
import { ALL_LESSONS } from "@/lib/data/lessons";
import { useCompletedLessons } from "@/lib/hooks/use-progress";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useMemo } from "react";
import { Text, View } from "react-native";

// Lesson id -> skills, built once from bundled data.
const SKILLS_BY_LESSON = new Map<string, string[]>(
  ALL_LESSONS.map((l) => [l.id, l.skills ?? []]),
);

const SKILL_ORDER = Object.keys(SKILL_META) as (keyof typeof SKILL_META)[];

/**
 * "Skills practiced" — surfaces the six-competency framework (Listening,
 * Speaking, Reading, Writing, Vocabulary, Grammar) with how many completed
 * lessons developed each. Turns the hidden skill tags into an honest, at-a-glance
 * picture of what the learner has actually worked — not just XP.
 */
export function SkillsPracticed() {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { data: completed } = useCompletedLessons();

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const id of completed ?? []) {
      for (const skill of SKILLS_BY_LESSON.get(id) ?? []) {
        c[skill] = (c[skill] ?? 0) + 1;
      }
    }
    return c;
  }, [completed]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const label = localize({ en: "Skills practiced", fr: "Compétences pratiquées" }, uiLanguage);

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ borderRadius: 16, padding: 16, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}>
        <Text style={{ marginBottom: 12, fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: M.muted }}>
          {label}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SKILL_ORDER.map((skill) => {
            const meta = SKILL_META[skill];
            const n = counts[skill] ?? 0;
            const active = n > 0;
            return (
              <View
                key={skill}
                className={active ? meta.badgeBg : ""}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: active ? "transparent" : M.border,
                  backgroundColor: active ? undefined : M.pillBg,
                  opacity: active ? 1 : 0.5,
                }}
              >
                <Text style={{ fontSize: 13 }}>{meta.icon}</Text>
                <Text className={active ? meta.badgeText : ""} style={{ fontSize: 12, fontWeight: "700", color: active ? undefined : M.muted }}>
                  {meta.label}
                </Text>
                {active ? (
                  <Text className={meta.badgeText} style={{ fontSize: 11, fontWeight: "800", opacity: 0.8 }}>
                    {n}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
