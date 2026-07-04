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
  /** Content rendered below the map inside the ScrollView (e.g. UP NEXT teaser). */
  footer?: ReactNode;
  /** Animate fireflies and the active node (off honours reduced motion). */
  lively?: boolean;
  /** The in-path "défi du jour" coin, pinned beside the active node. */
  challenge?: { word: string; done: boolean; onPress: () => void };
  /** Show a "Start" pill anchored above the active node — use on per-course screens. */
  showStartBubble?: boolean;
}

/**
 * Chapter cartouche — a dark left-floating pill marking "you've entered a new
 * gallery": an emoji medallion, the (educator-authored) chapter name, and a
 * short English category gloss ("· Community", "· Kitchen") echoing the scenery.
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
        left: 16,
        maxWidth: width - 32,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 7,
        paddingLeft: 7,
        paddingRight: 15,
        borderRadius: 999,
        backgroundColor: "rgba(8,9,15,0.86)",
        borderWidth: 1,
        borderColor: `${area.color}99`,
        shadowColor: MUSEUM.ink,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${area.color}24`,
          borderWidth: 1.5,
          borderColor: `${area.color}`,
        }}
      >
        <Text style={{ fontSize: 15 }}>{area.emoji}</Text>
      </View>
      <Text
        numberOfLines={1}
        style={{ fontSize: 13, fontWeight: "800", letterSpacing: 0.2, color: MUSEUM.parchment }}
      >
        {localize(area.title, uiLanguage)}
      </Text>
      {area.gloss ? (
        <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.4, color: area.color }}>
          · {area.gloss}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * "Défi du jour" coin — a bronze medallion pinned just beside the active node,
 * embedding the day's Izon word directly in the path. Tapping it opens the
 * word-of-the-day challenge flow.
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
  footer,
  lively = true,
  challenge,
  showStartBubble = false,
}: JourneyMapProps) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
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
  const selectedAudioUrl = selected
    ? lessons.find((l) => l.id === selected.lessonId)?.audioUrl
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

          {/* On per-course screens the header already shows the unit title, so the
              floating cartouche would be redundant — and would sit right where the
              "Commencer" start bubble is anchored above the active node. */}
          {!showStartBubble &&
            journey.areas.map((area) => <AreaLabel key={area.courseId} area={area} width={width} />)}

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

          {showStartBubble && journey.activeIndex >= 0 && (() => {
            const n = journey.nodes[journey.activeIndex];
            return (
              <Pressable
                onPress={() => setSelected(n)}
                style={{
                  position: "absolute",
                  left: n.x - 36,
                  top: n.y - 80,
                  zIndex: 6,
                  backgroundColor: MUSEUM.accent,
                  borderRadius: 999,
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  shadowColor: MUSEUM.accent,
                  shadowOpacity: 0.55,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                }}
                accessibilityRole="button"
                accessibilityLabel={t("learn.startShort", { defaultValue: "Start" })}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.3 }}>
                  {t("learn.startShort", { defaultValue: "Start" })}
                </Text>
              </Pressable>
            );
          })()}
        </View>

        {footer ? <View style={{ paddingBottom: 16 }}>{footer}</View> : null}
      </ScrollView>

      <JourneySheet
        node={selected}
        areaName={selectedArea ? localize(selectedArea.title, uiLanguage) : ""}
        audioUrl={selectedAudioUrl}
        uiLanguage={uiLanguage}
        onClose={() => setSelected(null)}
        onStart={handleStart}
      />
    </>
  );
}
