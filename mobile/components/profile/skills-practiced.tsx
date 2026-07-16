import { EASE_OUT } from "@/constants/motion";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SKILL_META } from "@/constants/course-colors";
import { useCompletedLessons } from "@/lib/hooks/use-progress";
import { localize } from "@/lib/localize";
import { type MuseumTheme, useMuseumTheme } from "@/lib/use-museum-theme";
import { getSnapshotLessonSkills, useContentStore } from "@/store/content-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Line, Polygon } from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);

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

/** A single competency bar that fills to its share as the card reveals. */
function SkillBar({ grow, ratio, M }: Readonly<{ grow: SharedValue<number>; ratio: number; M: MuseumTheme }>) {
  const fillStyle = useAnimatedStyle(() => ({ width: `${Math.round(ratio * grow.value * 100)}%` }));
  return (
    <View style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: M.pillBg, overflow: "hidden" }}>
      <Animated.View style={[{ height: "100%", borderRadius: 2, backgroundColor: M.accent }, fillStyle]} />
    </View>
  );
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
  // Subscribe to snapshots so the radar recomputes once content hydrates —
  // getSnapshotLessonSkills() reads the store non-reactively, so without this
  // dependency the memo runs while snapshots are still empty (cold start) and
  // never re-runs, leaving the radar permanently hidden (total === 0).
  const snapshots = useContentStore((s) => s.snapshots);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const id of completed ?? []) {
      for (const skill of getSnapshotLessonSkills(id)) {
        c[skill] = (c[skill] ?? 0) + 1;
      }
    }
    return c;
  }, [completed, snapshots]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(1, ...Object.values(counts));
  const values = SKILL_ORDER.map((skill) => (counts[skill] ?? 0) / maxCount);

  // Reveal choreography: the data web unfolds from the center (a scale+fade of
  // the whole group about RADAR_CENTER) while the competency bars fill in step.
  // Scaling a centered group is the reliable way to animate SVG here — animating
  // Polygon `points` directly is flaky in react-native-svg.
  const reduceMotion = useReducedMotion();
  const grow = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      grow.value = 1;
      return;
    }
    grow.value = 0;
    grow.value = withTiming(1, { duration: 760, easing: EASE_OUT });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, reduceMotion]);

  const webProps = useAnimatedProps(() => ({
    scale: reduceMotion ? 1 : grow.value,
    opacity: grow.value,
  }));

  if (total === 0) return null;

  const label = localize({ en: "Your six skills", fr: "Vos six compétences" }, uiLanguage);

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
            <AnimatedG animatedProps={webProps} originX={RADAR_CENTER} originY={RADAR_CENTER}>
              <Polygon points={polygonPoints(values)} fill={M.accentGlow} stroke={M.accent} strokeWidth={2} />
              {values.map((v, i) => {
                const [x, y] = radarPoint(i, v);
                return <Circle key={i} cx={x} cy={y} r={3} fill={M.accent} />;
              })}
            </AnimatedG>
          </Svg>
          <View style={{ flex: 1, gap: 9 }}>
            {SKILL_ORDER.map((skill, i) => {
              const meta = SKILL_META[skill];
              return (
                <View key={skill} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {meta.icon ? <IconSymbol name={meta.icon} size={14} color={M.sub} /> : null}
                  <Text style={{ fontSize: 12, color: M.sub, flex: 1 }}>{meta.label}</Text>
                  <SkillBar grow={grow} ratio={values[i]} M={M} />
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
