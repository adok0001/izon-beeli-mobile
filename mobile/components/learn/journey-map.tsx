import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { JourneyNodeView } from "@/components/learn/journey-node";
import { JourneyScenery } from "@/components/learn/journey-scenery";
import { JourneySheet } from "@/components/learn/journey-sheet";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import { buildJourney, JOURNEY, type JourneyNode, smoothPath } from "@/lib/journey";
import { localize } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, Lesson } from "@/types";

interface JourneyMapProps {
  courses: Course[];
  lessons: Lesson[];
  completedIds: Set<string>;
  refreshing: boolean;
  onRefresh: () => void;
  accent: string;
  /** Content rendered above the map (e.g. the daily-challenge chip). */
  header?: ReactNode;
  /** Animate fireflies and the active node (off honours reduced motion). */
  lively?: boolean;
  /** The in-path "défi du jour" coin, pinned beside the active node. */
  challenge?: { word: string; done: boolean; onPress: () => void };
}

/**
 * Chapter cartouche — an engraved museum placard flanked by hairline rules.
 * The medallion + bronze plaque is the map's signature "you've entered a new
 * gallery" marker, echoing the foyer placard language of the Museum system.
 */
function AreaLabel({
  area,
  width,
}: {
  area: ReturnType<typeof buildJourney>["areas"][number];
  width: number;
}) {
  const { uiLanguage } = useUiLanguageStore();
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: area.y,
        left: 0,
        width,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        gap: 12,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: `${area.color}55` }} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 7,
          paddingLeft: 7,
          paddingRight: 15,
          borderRadius: 14,
          backgroundColor: "rgba(8,9,15,0.94)",
          borderWidth: 1,
          borderColor: `${area.color}99`,
          shadowColor: area.color,
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${area.color}24`,
            borderWidth: 1.5,
            borderColor: `${area.color}`,
          }}
        >
          <Text style={{ fontSize: 16 }}>{area.emoji}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 13.5, fontWeight: "800", color: MUSEUM.parchment }}>
            {localize(area.title, uiLanguage)}
          </Text>
          {area.level ? (
            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.6, color: area.color }}>
              {area.level.toUpperCase()}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: `${area.color}55` }} />
    </View>
  );
}

/**
 * "Défi du jour" coin — a bronze medallion pinned just beside the active node,
 * embedding the daily challenge directly in the path. Tapping it opens the same
 * challenge flow as the header's Objectif stat.
 */
function DefiNode({
  x,
  y,
  word,
  done,
  onPress,
}: {
  x: number;
  y: number;
  word: string;
  done: boolean;
  onPress: () => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const badge = done ? M.success : M.error;
  return (
    <Pressable
      onPress={onPress}
      style={{ position: "absolute", left: Math.max(8, x - 96), top: y - 28, zIndex: 5 }}
      accessibilityRole="button"
      accessibilityLabel={t("journey.dailyChallenge", { defaultValue: "Daily challenge" })}
    >
      <LinearGradient
        colors={[MUSEUM.parchment, "#F3D9A6", MUSEUM.accent]}
        start={{ x: 0.35, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: JOURNEY.bronze,
          shadowColor: JOURNEY.bronze,
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "800", color: JOURNEY.bronze, letterSpacing: 0.3 }}>
          {word}
        </Text>
      </LinearGradient>
      <View
        style={{
          position: "absolute",
          top: -10,
          right: -12,
          backgroundColor: badge,
          borderRadius: 999,
          paddingHorizontal: 7,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 8.5, fontWeight: "800", color: "#fff", letterSpacing: 0.4 }}>
          {done ? "✓ DÉFI" : "DÉFI"}
        </Text>
      </View>
    </Pressable>
  );
}

export function JourneyMap({
  courses,
  lessons,
  completedIds,
  refreshing,
  onRefresh,
  accent,
  header,
  lively = true,
  challenge,
}: JourneyMapProps) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const didCenter = useRef(false);
  const [selected, setSelected] = useState<JourneyNode | null>(null);

  const journey = useMemo(
    () => buildJourney(courses, lessons, completedIds, width),
    [courses, lessons, completedIds, width]
  );

  const { fullPath, donePath } = useMemo(() => {
    const pts = journey.nodes.map((n) => ({ x: n.x, y: n.y }));
    const doneCount = journey.activeIndex >= 0 ? journey.activeIndex + 1 : pts.length;
    return { fullPath: smoothPath(pts), donePath: smoothPath(pts.slice(0, doneCount)) };
  }, [journey]);

  // Center the active lesson on first paint so learners land where they left off.
  useEffect(() => {
    if (didCenter.current || journey.activeIndex < 0) return;
    didCenter.current = true;
    const y = journey.nodes[journey.activeIndex].y - 220;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: false }));
  }, [journey]);

  const selectedArea = selected
    ? journey.areas.find((a) => a.courseId === selected.courseId)
    : undefined;

  const handleStart = (node: JourneyNode) => {
    setSelected(null);
    router.push(`/lesson/${node.lessonId}`);
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: M.bg }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accent}
            colors={[accent]}
          />
        }
      >
        {header ? <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>{header}</View> : null}

        <View style={{ height: journey.height, width }}>
          {/* Themed world the path winds through — drawn behind path + nodes */}
          <JourneyScenery areas={journey.areas} width={width} height={journey.height} />

          {/* Daytime sun glow over the parchment gallery floor */}
          <Svg width={width} height={300} style={{ position: "absolute", top: 0 }}>
            <Defs>
              <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFD678" stopOpacity={0.5} />
                <Stop offset="1" stopColor="#FFD678" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={width * 0.78} cy={150} r={120} fill="url(#sun)" />
          </Svg>

          <Svg width={width} height={journey.height} style={{ position: "absolute" }}>
            {/* faint dashed guide for the road not yet travelled */}
            <Path
              d={fullPath}
              fill="none"
              stroke="rgba(166,110,28,0.30)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="2 22"
            />
            {/* soft glow under the completed trail, then the solid bronze line */}
            <Path
              d={donePath}
              fill="none"
              stroke={MUSEUM.accent}
              strokeOpacity={0.22}
              strokeWidth={16}
              strokeLinecap="round"
            />
            <Path
              d={donePath}
              fill="none"
              stroke={MUSEUM.accentLight}
              strokeWidth={6}
              strokeLinecap="round"
            />
          </Svg>

          {journey.areas.map((area) => (
            <AreaLabel key={area.courseId} area={area} width={width} />
          ))}

          {journey.nodes.map((node) => (
            <JourneyNodeView
              key={node.lessonId}
              node={node}
              uiLanguage={uiLanguage}
              lively={lively}
              onPress={setSelected}
            />
          ))}

          {challenge && journey.activeIndex >= 0 && (
            <DefiNode
              x={journey.nodes[journey.activeIndex].x}
              y={journey.nodes[journey.activeIndex].y}
              word={challenge.word}
              done={challenge.done}
              onPress={challenge.onPress}
            />
          )}
        </View>
      </ScrollView>

      <JourneySheet
        node={selected}
        areaName={selectedArea ? localize(selectedArea.title, uiLanguage) : ""}
        uiLanguage={uiLanguage}
        onClose={() => setSelected(null)}
        onStart={handleStart}
      />
    </>
  );
}
