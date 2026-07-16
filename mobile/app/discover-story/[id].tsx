import { useInteractiveStory } from "@/lib/hooks/use-discover";
import { bronze, glass, MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import type { StoryChoice } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
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

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

function ChoiceTablet({
  choice,
  index,
  onSelect,
}: {
  choice: StoryChoice;
  index: number;
  onSelect: (nextId: string) => void;
}) {
  const M = useMuseumTheme();
  const reveal = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 420,
      delay: 150 + index * 100,
      useNativeDriver: true,
    }).start();
  }, [reveal, index]);

  return (
    <Animated.View
      style={{
        opacity: reveal,
        transform: [
          { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { scale: press },
        ],
      }}
    >
      <Pressable
        onPressIn={() =>
          Animated.spring(press, { toValue: 0.97, speed: 40, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(press, { toValue: 1, speed: 40, useNativeDriver: true }).start()
        }
        onPress={() => onSelect(choice.nextSceneId)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginBottom: 10,
          backgroundColor: pressed ? bronze(0.16) : glass(0.05),
          borderWidth: 1,
          borderColor: pressed ? bronze(0.55) : glass(0.12),
        })}
        accessibilityRole="button"
        accessibilityLabel={choice.text}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bronze(0.16),
            borderWidth: 1,
            borderColor: bronze(0.4),
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: M.accentLight, letterSpacing: 0.5 }}>
            {ROMAN_NUMERALS[index] ?? `${index + 1}`}
          </Text>
        </View>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: M.parchment, lineHeight: 20 }}>
          {choice.text}
        </Text>
        <Text style={{ fontSize: 15, color: bronze(0.55) }}>→</Text>
      </Pressable>
    </Animated.View>
  );
}

function ChoiceOverlay({
  choices,
  onSelect,
}: {
  choices: StoryChoice[];
  onSelect: (nextId: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(60)).current;
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
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <LinearGradient
        colors={["rgba(7,8,15,0)", "rgba(7,8,15,0.88)", MUSEUM.inkDeep]}
        locations={[0, 0.32, 1]}
        style={{ paddingHorizontal: 20, paddingTop: 50, paddingBottom: 40 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            marginBottom: 18,
          }}
        >
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: bronze(0.55) }} />
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 3, color: bronze(0.8) }}>
            WHAT DO YOU DO?
          </Text>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: bronze(0.55) }} />
        </View>
        {choices.map((choice, i) => (
          <ChoiceTablet key={choice.id} choice={choice} index={i} onSelect={onSelect} />
        ))}
      </LinearGradient>
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

  const goBack = useCallback(() => {
    if (currentPath.length <= 1) return;
    const next = currentPath.slice(0, -1);
    setCurrentPath(next);
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: next.length - 1, animated: true });
    }, 50);
  }, [currentPath]);

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

                {/* Tap zone for back */}
                {currentPath.length > 1 && isActive && (
                  <Pressable
                    onPress={goBack}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 80,
                      bottom: 0,
                      width: "35%",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      paddingLeft: 20,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Previous scene"
                  >
                    <Text style={{ fontSize: 32, color: "rgba(255,255,255,0.25)" }}>‹</Text>
                  </Pressable>
                )}

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
