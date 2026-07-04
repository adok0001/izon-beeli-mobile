import { SKILL_META } from "@/constants/course-colors";
import { ALL_LESSONS } from "@/lib/data/lessons";
import { useCompletedLessons } from "@/lib/hooks/use-progress";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Polygon } from "react-native-svg";

// Lesson id -> skills, built once from bundled data.
const SKILLS_BY_LESSON = new Map<string, string[]>(
  ALL_LESSONS.map((l) => [l.id, l.skills ?? []]),
);

const SKILL_ORDER = Object.keys(SKILL_META) as (keyof typeof SKILL_META)[];
const N = SKILL_ORDER.length;
const RADAR_CENTER = 100;
const RADAR_RADIUS = 80;

/** Vertex of a regular N-gon, clockwise from the top, scaled by `value` (0-1). */
function radarPoint(index: number, value: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / N;
  const r = RADAR_RADIUS * value;
  return [RADAR_CENTER + r * Math.cos(angle), RADAR_CENTER + r * Math.sin(angle)];
}

function polygonPoints(values: number[]): string {
  return values.map((v, i) => radarPoint(i, v).join(",")).join(" ");
}

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

  const label = localize({ en: "Your six skills", fr: "Vos six compétences" }, uiLanguage);
  const maxCount = Math.max(1, ...Object.values(counts));
  const values = SKILL_ORDER.map((skill) => (counts[skill] ?? 0) / maxCount);

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ borderRadius: 16, padding: 16, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}>
        <Text style={{ marginBottom: 14, fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: M.muted }}>
          {label}
        </Text>
        <View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
          <Svg width={112} height={112} viewBox="0 0 200 200">
            {[0.333, 0.667, 1].map((ring) => (
              <Polygon key={ring} points={polygonPoints(SKILL_ORDER.map(() => ring))} fill="none" stroke={M.border} strokeWidth={1} />
            ))}
            {SKILL_ORDER.map((_, i) => {
              const [x, y] = radarPoint(i, 1);
              return <Line key={i} x1={RADAR_CENTER} y1={RADAR_CENTER} x2={x} y2={y} stroke={M.border} strokeWidth={1} />;
            })}
            <Polygon points={polygonPoints(values)} fill={M.accentGlow} stroke={M.accent} strokeWidth={2} />
            {values.map((v, i) => {
              const [x, y] = radarPoint(i, v);
              return <Circle key={i} cx={x} cy={y} r={3} fill={M.accent} />;
            })}
          </Svg>
          <View style={{ flex: 1, gap: 9 }}>
            {SKILL_ORDER.map((skill, i) => {
              const meta = SKILL_META[skill];
              return (
                <View key={skill} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
                  <Text style={{ fontSize: 12, color: M.sub, flex: 1 }}>{meta.label}</Text>
                  <View style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: M.pillBg, overflow: "hidden" }}>
                    <View style={{ width: `${Math.round(values[i] * 100)}%`, height: "100%", borderRadius: 2, backgroundColor: M.accent }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
