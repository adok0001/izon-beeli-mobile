import { useInteractiveStory } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { StoryChoice } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function FilmstripProgress({
  total,
  current,
  topInset,
}: {
  total: number;
  current: number;
  topInset: number;
}) {
  const M = useMuseumTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 4,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 10,
        position: "absolute",
        top: topInset,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <Animated.View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor:
              i < current ? M.accent : i === current ? `${M.accent}8C` : "rgba(255,255,255,0.18)",
          }}
        />
      ))}
    </View>
  );
}

function ChoiceOverlay({
  choices,
  onSelect,
}: {
  choices: StoryChoice[];
  onSelect: (nextId: string) => void;
}) {
  const M = useMuseumTheme();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 13, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 28,
        backgroundColor: "rgba(7, 8, 15, 0.9)",
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: "800",
          letterSpacing: 2.5,
          color: "rgba(196,134,42,0.75)",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        — WHAT DO YOU DO? —
      </Text>
      {choices.map((choice) => (
        <Pressable
          key={choice.id}
          onPress={() => onSelect(choice.nextSceneId)}
          style={({ pressed }) => ({
            borderRadius: 12,
            paddingHorizontal: 18,
            paddingVertical: 14,
            marginBottom: 10,
            backgroundColor: pressed ? "rgba(196, 134, 42, 0.18)" : "rgba(255, 255, 255, 0.06)",
            borderWidth: 1,
            borderColor: pressed ? "rgba(196, 134, 42, 0.5)" : "rgba(255, 255, 255, 0.14)",
          })}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: M.parchment, lineHeight: 20 }}>
            {choice.text}
          </Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function InteractiveStoryNative() {
  const M = useMuseumTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: story } = useInteractiveStory(id);

  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [choiceVisible, setChoiceVisible] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (story && currentPath.length === 0) {
      setCurrentPath([story.initialSceneId]);
    }
  }, [story, currentPath]);

  useEffect(() => {
    if (!story || currentPath.length === 0) return;
    const sceneId = currentPath[currentPath.length - 1];
    const scene = story.scenes[sceneId];
    if (scene?.type === "choice") {
      const t = setTimeout(() => setChoiceVisible(true), 700);
      return () => clearTimeout(t);
    } else {
      setChoiceVisible(false);
    }
  }, [currentPath, story]);

  const goForward = useCallback(() => {
    if (!story || currentPath.length === 0) return;
    const sceneId = currentPath[currentPath.length - 1];
    const scene = story.scenes[sceneId];
    if (scene?.type === "narrative" && scene.nextSceneId) {
      const next = [...currentPath, scene.nextSceneId];
      setCurrentPath(next);
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: next.length - 1, animated: true });
      }, 50);
    }
  }, [story, currentPath]);

  const handleChoice = useCallback(
    (nextId: string) => {
      setChoiceVisible(false);
      setTimeout(() => {
        const next = [...currentPath, nextId];
        setCurrentPath(next);
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index: next.length - 1, animated: true });
        }, 50);
      }, 250);
    },
    [currentPath]
  );

  if (!story || currentPath.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: M.inkDeep, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: M.parchment, fontSize: 14 }}>Loading story…</Text>
      </View>
    );
  }

  const totalScenes = Object.keys(story.scenes).length;
  const currentIndex = currentPath.length - 1;
  const currentSceneId = currentPath[currentPath.length - 1];
  const currentScene = story.scenes[currentSceneId];

  return (
    <View style={{ flex: 1, backgroundColor: M.inkDeep }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Filmstrip */}
        <FilmstripProgress total={totalScenes} current={currentIndex} topInset={insets.top} />

        {/* Exit button */}
        <View style={{ position: "absolute", top: insets.top + 8, right: 16, zIndex: 20 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "rgba(13, 15, 26, 0.6)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
            accessibilityLabel="Exit story"
          >
            <Text style={{ fontSize: 12, color: "rgba(247, 242, 232, 0.7)", fontWeight: "600" }}>
              Exit
            </Text>
          </Pressable>
        </View>

        {/* Horizontal scene list */}
        <FlatList
          ref={listRef}
          data={currentPath}
          keyExtractor={(item) => item}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item: sceneId }) => {
            const scene = story.scenes[sceneId];
            if (!scene) return null;
            const isActive = sceneId === currentSceneId;

            return (
              <View
                style={{
                  width: SCREEN_WIDTH,
                  flex: 1,
                  backgroundColor: scene.gradient[0],
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 32,
                }}
              >
                {/* Background emoji */}
                <Text
                  style={{
                    fontSize: 140,
                    position: "absolute",
                    opacity: 0.06,
                  }}
                  accessibilityElementsHidden
                >
                  {scene.backgroundEmoji}
                </Text>

                {/* Scene counter */}
                <Text
                  style={{
                    position: "absolute",
                    top: 60,
                    right: 20,
                    fontSize: 9,
                    fontWeight: "800",
                    letterSpacing: 2,
                    color: "rgba(247,242,232,0.35)",
                  }}
                >
                  {currentPath.indexOf(sceneId) + 1} / {totalScenes}
                </Text>

                {/* Title */}
                {scene.title && (
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      letterSpacing: 2.5,
                      color: `${M.accent}BF`,
                      textAlign: "center",
                      marginBottom: 18,
                      textTransform: "uppercase",
                    }}
                  >
                    {scene.title}
                  </Text>
                )}

                {/* Narrative text */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: M.parchment,
                    textAlign: "center",
                    lineHeight: 28,
                    maxWidth: 320,
                  }}
                >
                  {scene.text}
                </Text>

                {/* Tap zone for forward (narrative) */}
                {scene.type === "narrative" && scene.nextSceneId && isActive && (
                  <Pressable
                    onPress={goForward}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 80,
                      bottom: 0,
                      width: "35%",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      paddingRight: 20,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Next scene"
                  >
                    <Text style={{ fontSize: 32, color: "rgba(255,255,255,0.25)" }}>›</Text>
                  </Pressable>
                )}

                {/* Conclusion CTA */}
                {scene.type === "conclusion" && isActive && (
                  <Pressable
                    onPress={() => router.back()}
                    style={{
                      position: "absolute",
                      bottom: 48,
                      paddingHorizontal: 24,
                      paddingVertical: 13,
                      borderRadius: 999,
                      backgroundColor: "rgba(196, 134, 42, 0.18)",
                      borderWidth: 1,
                      borderColor: "rgba(196, 134, 42, 0.45)",
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: M.accent }}>
                      Return to Culture
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }}
        />

        {/* Choice overlay */}
        {choiceVisible && currentScene?.type === "choice" && currentScene.choices && (
          <ChoiceOverlay choices={currentScene.choices} onSelect={handleChoice} />
        )}
      </SafeAreaView>
    </View>
  );
}
