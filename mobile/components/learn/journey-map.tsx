import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { JourneyNodeView } from "@/components/learn/journey-node";
import { JourneySheet } from "@/components/learn/journey-sheet";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import { buildJourney, type JourneyNode, smoothPath } from "@/lib/journey";
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

export function JourneyMap({
  courses,
  lessons,
  completedIds,
  refreshing,
  onRefresh,
  accent,
  header,
  lively = true,
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
