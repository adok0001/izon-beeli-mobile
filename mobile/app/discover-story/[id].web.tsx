import { useInteractiveStory } from "@/lib/hooks/use-discover";
import type { StoryScene, StoryChoice } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

function FilmstripProgress({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <View
      style={{
        position: "fixed" as never,
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        gap: 3,
        padding: 16,
        paddingTop: 20,
        zIndex: 100,
        pointerEvents: "none" as never,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)" as never,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor:
              i < current
                ? "#C4862A"
                : i === current
                ? "rgba(196, 134, 42, 0.7)"
                : "rgba(255, 255, 255, 0.2)",
            transition: "background-color 0.3s ease" as never,
          }}
        />
      ))}
    </View>
  );
}

function SceneText({ text, sceneKey }: { text: string; sceneKey: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 12, useNativeDriver: true }),
    ]).start();
  }, [sceneKey, fadeAnim, slideAnim]);

  return (
    <Animated.Text
      style={{
        fontSize: 20,
        fontWeight: "700",
        color: "#F7F2E8",
        lineHeight: 30,
        textAlign: "center" as const,
        maxWidth: 640,
        textShadow: "0 2px 16px rgba(0,0,0,0.7)" as never,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {text}
    </Animated.Text>
  );
}

function ChoiceOverlay({
  choices,
  onSelect,
}: {
  choices: StoryChoice[];
  onSelect: (nextId: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 12, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <Animated.View
      style={{
        position: "absolute" as never,
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 48,
        paddingTop: 32,
        backdropFilter: "blur(20px)" as never,
        background: "linear-gradient(to top, rgba(7,8,15,0.95) 0%, rgba(7,8,15,0.6) 100%)" as never,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 3,
          color: "rgba(196,134,42,0.8)",
          textAlign: "center" as const,
          marginBottom: 20,
          textTransform: "uppercase" as const,
        }}
      >
        — WHAT DO YOU DO? —
      </Text>
      <View style={{ gap: 10, maxWidth: 560, marginLeft: "auto" as never, marginRight: "auto" as never, width: "100%" }}>
        {choices.map((choice, i) => (
          <ChoiceButton key={choice.id} choice={choice} index={i} onSelect={onSelect} />
        ))}
      </View>
    </Animated.View>
  );
}

function ChoiceButton({
  choice,
  index,
  onSelect,
}: {
  choice: StoryChoice;
  index: number;
  onSelect: (nextId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const key = String(index + 1);

  return (
    <Pressable
      onPress={() => onSelect(choice.nextSceneId)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      style={{
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: hovered ? "rgba(196, 134, 42, 0.15)" : "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: hovered ? "rgba(196, 134, 42, 0.5)" : "rgba(255, 255, 255, 0.12)",
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 14,
        cursor: "pointer" as never,
        transition: "all 0.15s ease" as never,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hovered ? "rgba(196, 134, 42, 0.3)" : "rgba(255, 255, 255, 0.08)",
          borderWidth: 1,
          borderColor: hovered ? "rgba(196, 134, 42, 0.6)" : "rgba(255, 255, 255, 0.15)",
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "800", color: hovered ? "#C4862A" : "#9A9480" }}>
          {key}
        </Text>
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#F7F2E8", lineHeight: 20 }}>
        {choice.text}
      </Text>
    </Pressable>
  );
}

export default function InteractiveStoryWeb() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: story } = useInteractiveStory(id);

  const [history, setHistory] = useState<string[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [choiceVisible, setChoiceVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (story && !currentSceneId) {
      setCurrentSceneId(story.initialSceneId);
    }
  }, [story, currentSceneId]);

  useEffect(() => {
    if (!story || !currentSceneId) return;
    const scene = story.scenes[currentSceneId];
    if (scene?.type === "choice") {
      const t = setTimeout(() => setChoiceVisible(true), 600);
      return () => clearTimeout(t);
    } else {
      setChoiceVisible(false);
    }
  }, [currentSceneId, story]);

  const animateTransition = useCallback(
    (nextId: string, dir: "left" | "right") => {
      setDirection(dir);
      Animated.timing(slideAnim, {
        toValue: dir === "right" ? -60 : 60,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSceneId(nextId);
        slideAnim.setValue(dir === "right" ? 60 : -60);
        Animated.spring(slideAnim, { toValue: 0, tension: 120, friction: 14, useNativeDriver: true }).start();
      });
    },
    [slideAnim]
  );

  const goForward = useCallback(() => {
    if (!story || !currentSceneId) return;
    const scene = story.scenes[currentSceneId];
    if (scene?.type === "narrative" && scene.nextSceneId) {
      setHistory((h) => [...h, currentSceneId]);
      animateTransition(scene.nextSceneId, "right");
    }
  }, [story, currentSceneId, animateTransition]);

  const goBack = useCallback(() => {
    if (history.length === 0) {
      router.back();
      return;
    }
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    animateTransition(prev, "left");
  }, [history, router, animateTransition]);

  const handleChoice = useCallback(
    (nextId: string) => {
      if (!currentSceneId) return;
      setHistory((h) => [...h, currentSceneId]);
      setChoiceVisible(false);
      setTimeout(() => animateTransition(nextId, "right"), 200);
    },
    [currentSceneId, animateTransition]
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goForward();
      if (e.key === "ArrowLeft") goBack();
      if (e.key === "Escape") router.back();
      if (story && currentSceneId) {
        const scene = story.scenes[currentSceneId];
        if (scene?.type === "choice" && scene.choices) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx >= 0 && idx < scene.choices.length) {
            handleChoice(scene.choices[idx].nextSceneId);
          }
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goForward, goBack, router, story, currentSceneId, handleChoice]);

  if (!story || !currentSceneId) {
    return (
      <View style={{ flex: 1, backgroundColor: "#07080F", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#F7F2E8", fontSize: 14 }}>Loading story…</Text>
      </View>
    );
  }

  const scene = story.scenes[currentSceneId];
  if (!scene) return null;

  const sceneIndex = history.length;
  const estimatedTotal = Object.keys(story.scenes).length;

  return (
    <View style={{ flex: 1, backgroundColor: "#07080F" }}>
      {/* Filmstrip progress */}
      <FilmstripProgress total={estimatedTotal} current={sceneIndex} />

      {/* Full-screen scene */}
      <View
        style={{
          position: "fixed" as never,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: scene.gradient[0],
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.6s ease" as never,
        }}
      >
        {/* Gradient fade to dark at edges */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at center, transparent 30%, ${scene.gradient[1]} 100%)` as never,
          }}
        />

        {/* Film grain */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: GRAIN_URI as never,
            opacity: 0.05,
            pointerEvents: "none" as never,
          }}
        />

        {/* Background emoji */}
        <Text
          style={{
            fontSize: 160,
            position: "absolute",
            opacity: 0.06,
            userSelect: "none" as never,
            pointerEvents: "none" as never,
          }}
        >
          {scene.backgroundEmoji}
        </Text>

        {/* Scene counter top-right */}
        <View style={{ position: "absolute", top: 56, right: 20 }}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: "800",
              letterSpacing: 2,
              color: "rgba(247, 242, 232, 0.4)",
              textTransform: "uppercase" as const,
            }}
          >
            SCENE {sceneIndex + 1} / {estimatedTotal}
          </Text>
        </View>

        {/* Exit button top-left */}
        <Pressable
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: "rgba(13, 15, 26, 0.5)",
            backdropFilter: "blur(8px)" as never,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            cursor: "pointer" as never,
          }}
          accessibilityLabel="Exit story"
        >
          <Text style={{ fontSize: 12, color: "rgba(247, 242, 232, 0.7)", fontWeight: "600" }}>
            ← Exit
          </Text>
        </Pressable>

        {/* Central content */}
        <Animated.View
          style={{
            paddingHorizontal: 40,
            alignItems: "center",
            transform: [{ translateX: slideAnim }],
            opacity: slideAnim.interpolate({
              inputRange: [-60, 0, 60],
              outputRange: [0.2, 1, 0.2],
            }),
            maxWidth: 720,
            width: "100%",
          }}
        >
          {scene.title && (
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 3,
                color: "rgba(196, 134, 42, 0.8)",
                textTransform: "uppercase" as const,
                marginBottom: 20,
                textAlign: "center" as const,
              }}
            >
              {scene.title}
            </Text>
          )}
          <SceneText text={scene.text} sceneKey={currentSceneId} />
        </Animated.View>

        {/* Navigation tap zones (narrative scenes only) */}
        {scene.type === "narrative" && !choiceVisible && (
          <>
            {history.length > 0 && (
              <Pressable
                onPress={goBack}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 80,
                  bottom: 0,
                  width: "30%",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingLeft: 24,
                  cursor: "pointer" as never,
                }}
                accessibilityLabel="Previous scene"
              >
                <Text style={{ fontSize: 28, color: "rgba(255,255,255,0.2)" }}>‹</Text>
              </Pressable>
            )}
            {scene.nextSceneId && (
              <Pressable
                onPress={goForward}
                style={{
                  position: "absolute",
                  right: 0,
                  top: 80,
                  bottom: 0,
                  width: "30%",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingRight: 24,
                  cursor: "pointer" as never,
                }}
                accessibilityLabel="Next scene"
              >
                <Text style={{ fontSize: 28, color: "rgba(255,255,255,0.3)" }}>›</Text>
              </Pressable>
            )}
          </>
        )}

        {/* Conclusion CTA */}
        {scene.type === "conclusion" && (
          <Pressable
            onPress={() => router.back()}
            style={{
              position: "absolute",
              bottom: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 24,
              paddingVertical: 13,
              borderRadius: 999,
              backgroundColor: "rgba(196, 134, 42, 0.2)",
              borderWidth: 1,
              borderColor: "rgba(196, 134, 42, 0.5)",
              cursor: "pointer" as never,
            }}
            accessibilityRole="button"
            accessibilityLabel="Return to Culture"
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#C4862A" }}>
              Return to Culture
            </Text>
          </Pressable>
        )}

        {/* Choice overlay */}
        {choiceVisible && scene.type === "choice" && scene.choices && (
          <ChoiceOverlay choices={scene.choices} onSelect={handleChoice} />
        )}

        {/* Keyboard hint */}
        {scene.type !== "conclusion" && !choiceVisible && (
          <Text
            style={{
              position: "absolute",
              bottom: 24,
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 1.5,
              color: "rgba(247, 242, 232, 0.2)",
              textTransform: "uppercase" as const,
              pointerEvents: "none" as never,
            }}
          >
            {scene.type === "choice" ? "1 / 2 to choose · Esc to exit" : "→ to continue · Esc to exit"}
          </Text>
        )}
      </View>
    </View>
  );
}
