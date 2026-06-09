import { TracingCanvas } from "@/components/geez/tracing-canvas";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FIDEL_CHART } from "@/lib/data/geez/fidel-chart";
import { NSIBIDI_CHARACTERS } from "@/lib/data/nsibidi";
import { ADINKRA_SYMBOLS } from "@/lib/data/adinkra";
import type { GeezCharacter } from "@/lib/data/geez/fidel-chart";
import type { NsibidiCharacter } from "@/lib/data/nsibidi";
import { hapticSuccess, hapticTap } from "@/lib/haptics";
import { useGeezStore } from "@/store/geez-store";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

type ScriptMode = "geez" | "nsibidi" | "adinkra";

const CANVAS_SIZE = 280;

function AdinkraCanvas({ symbol }: { symbol: { name: string; svgPath: string; svgViewBox: string } }) {
  const M = useMuseumTheme();
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        hapticTap();
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = `M${locationX},${locationY}`;
        setPaths((prev) => [...prev, currentPath.current]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current += ` L${locationX},${locationY}`;
        setPaths((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = currentPath.current;
          return updated;
        });
      },
      onPanResponderRelease: () => { currentPath.current = ""; },
    })
  ).current;

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 20, overflow: "hidden", borderWidth: 2, borderColor: `${M.accent}40`, backgroundColor: M.card }}
        {...panResponder.panHandlers}
      >
        <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
          {/* Guide: faded Adinkra SVG path */}
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} viewBox={symbol.svgViewBox} opacity={0.15}>
            <Path d={symbol.svgPath} fill="#a78bfa" />
          </Svg>
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke="#a78bfa" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      </View>
      <Pressable onPress={() => setPaths([])} style={{ marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: M.border, paddingHorizontal: 24, paddingVertical: 8 }} className="active:opacity-70">
        <Text style={{ fontSize: 13, fontWeight: "600", color: M.muted }}>Clear</Text>
      </Pressable>
    </View>
  );
}

function NsibidiCanvas({ char }: { char: NsibidiCharacter }) {
  const M = useMuseumTheme();
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        hapticTap();
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = `M${locationX},${locationY}`;
        setPaths((prev) => [...prev, currentPath.current]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current += ` L${locationX},${locationY}`;
        setPaths((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = currentPath.current;
          return updated;
        });
      },
      onPanResponderRelease: () => { currentPath.current = ""; },
    })
  ).current;

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 20, overflow: "hidden", borderWidth: 2, borderColor: "rgba(245,158,11,0.4)", backgroundColor: M.card }}
        {...panResponder.panHandlers}
      >
        <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
          <SvgText
            x={CANVAS_SIZE / 2} y={CANVAS_SIZE / 2 + 60}
            fontSize={200} textAnchor="middle"
            fill="#f59e0b" opacity={0.15}
            fontFamily="Akagu"
          >
            {char.character}
          </SvgText>
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke="#f59e0b" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      </View>
      <Text style={{ marginTop: 10, fontSize: 14, color: M.sub }}>{char.name}</Text>
      <Pressable onPress={() => setPaths([])} style={{ marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: M.border, paddingHorizontal: 24, paddingVertical: 8 }} className="active:opacity-70">
        <Text style={{ fontSize: 13, fontWeight: "600", color: M.muted }}>Clear</Text>
      </Pressable>
    </View>
  );
}

function ModeTab({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: active ? color : "transparent" }}
      className="active:opacity-70"
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: active ? color : M.muted }}>{label}</Text>
    </Pressable>
  );
}

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function TraceSymbolScreen() {
  const M = useMuseumTheme();
  const { learnedIds, markLearned, hydrate, _hydrated } = useGeezStore();

  useEffect(() => { if (!_hydrated) hydrate(); }, [_hydrated]);

  const [mode, setMode] = useState<ScriptMode>("geez");
  const [geezIndex, setGeezIndex] = useState(0);
  const [nsibidiIndex, setNsibidiIndex] = useState(0);
  const [adinkraIndex, setAdinkraIndex] = useState(0);

  const unlearnedGeez = useMemo(() => FIDEL_CHART.filter((c) => !learnedIds.has(c.id)), [learnedIds]);
  const currentGeez = unlearnedGeez[geezIndex] ?? FIDEL_CHART[0]!;
  const currentNsibidi = NSIBIDI_CHARACTERS[nsibidiIndex % NSIBIDI_CHARACTERS.length]!;
  const currentAdinkra = ADINKRA_SYMBOLS[adinkraIndex % ADINKRA_SYMBOLS.length]!;

  const modeColor = { geez: "#4ade80", nsibidi: "#f59e0b", adinkra: "#a78bfa" }[mode];

  const handleMarkLearned = useCallback(() => {
    hapticSuccess();
    if (mode === "geez") {
      markLearned(currentGeez.id);
      setGeezIndex((i) => Math.min(i + 1, unlearnedGeez.length - 1));
    } else if (mode === "nsibidi") {
      setNsibidiIndex((i) => i + 1);
    } else {
      setAdinkraIndex((i) => i + 1);
    }
  }, [mode, currentGeez, unlearnedGeez, markLearned]);

  const handleNext = useCallback(() => {
    hapticTap();
    if (mode === "geez") setGeezIndex((i) => (i + 1) % Math.max(unlearnedGeez.length, 1));
    else if (mode === "nsibidi") setNsibidiIndex((i) => i + 1);
    else setAdinkraIndex((i) => i + 1);
  }, [mode, unlearnedGeez.length]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Trace the Symbol", headerBackTitle: "Back" }} />

      {/* Mode tabs */}
      <View style={{ flexDirection: "row", backgroundColor: M.card, borderBottomWidth: 1, borderBottomColor: M.border }}>
        <ModeTab label="Ge'ez" active={mode === "geez"} color="#4ade80" onPress={() => setMode("geez")} />
        <ModeTab label="Nsịbịdị" active={mode === "nsibidi"} color="#f59e0b" onPress={() => setMode("nsibidi")} />
        <ModeTab label="Adinkra" active={mode === "adinkra"} color="#a78bfa" onPress={() => setMode("adinkra")} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", padding: 24 }} showsVerticalScrollIndicator={false}>
        {/* Context label */}
        <View style={{ alignSelf: "stretch", marginBottom: 20 }}>
          {mode === "geez" && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 2, color: "#4ade80", marginBottom: 2 }}>GE&apos;EZ · FIDEL</Text>
              <Text style={{ fontSize: 13, color: M.sub }}>
                Order {currentGeez.order} · {currentGeez.baseConsonant} · romanized: {currentGeez.romanization}
              </Text>
              <Text style={{ fontSize: 11, color: M.muted, marginTop: 4 }}>
                {learnedIds.size} / {FIDEL_CHART.length} characters learned
              </Text>
            </View>
          )}
          {mode === "nsibidi" && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 2, color: "#f59e0b", marginBottom: 2 }}>NSỊBỊDỊ</Text>
              <Text style={{ fontSize: 13, color: M.sub }}>{currentNsibidi.meaning}</Text>
              <Text style={{ fontSize: 11, color: M.muted, marginTop: 2 }}>{currentNsibidi.category}</Text>
            </View>
          )}
          {mode === "adinkra" && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 2, color: "#a78bfa", marginBottom: 2 }}>ADINKRA</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{currentAdinkra.name}</Text>
              <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }}>{currentAdinkra.meaning}</Text>
            </View>
          )}
        </View>

        {/* Canvas */}
        {mode === "geez" && <TracingCanvas character={currentGeez} />}
        {mode === "nsibidi" && <NsibidiCanvas char={currentNsibidi} />}
        {mode === "adinkra" && <AdinkraCanvas symbol={{ name: currentAdinkra.name, svgPath: currentAdinkra.svgPath, svgViewBox: currentAdinkra.svgViewBox }} />}

        {/* Actions */}
        <View style={{ width: "100%", gap: 10, marginTop: 28 }}>
          <Pressable
            onPress={handleMarkLearned}
            style={{ borderRadius: 14, paddingVertical: 15, backgroundColor: modeColor, alignItems: "center" }}
            className="active:opacity-80"
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>
              {mode === "geez" ? "Got it — mark as learned" : "Next symbol"}
            </Text>
          </Pressable>
          {mode === "geez" && (
            <Pressable
              onPress={handleNext}
              style={{ borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: M.border, alignItems: "center" }}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: M.muted }}>Skip</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
