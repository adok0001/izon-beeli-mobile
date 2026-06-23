import { IconSymbol } from "@/components/ui/icon-symbol";
import { GameEyebrow, GameOption, GameProgress, GameResultView, tint } from "@/components/games/game-kit";
import { getAccent } from "@/constants/accent-colors";
import { getProverbsForLanguage } from "@/lib/data/proverbs";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { shuffle } from "@/lib/shuffle";
import { QuizSaveStatus } from "@/components/quiz-save-status";
import { useSubmitQuizResult } from "@/lib/hooks/use-quiz-result";
import { useStreakCelebration } from "@/lib/hooks/use-progress";
import { StreakCelebrationModal } from "@/components/streak-celebration-modal";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { playCorrectSound, playFinishSound, playIncorrectSound } from "@/lib/sounds";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import type { Proverb } from "@/types";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FEEDBACK_DELAY = 1100;
const SESSION_SIZE = 8;

// Fill the Proverb identity: purple "illuminated manuscript" — editorial, ornate.
const ACCENT = getAccent("purple");

interface ProverbPuzzle {
  proverb: Proverb;
  blankWord: string;
  displayText: string;
  options: string[];
  correctIndex: number;
}

// Strip leading/trailing punctuation so the answer tile matches the bare word.
function stripPunctuation(token: string): string {
  return token.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, "");
}

// Pick a word to blank, identified by its token position (not by string search,
// which would mis-match substrings or repeated words).
function pickBlankWord(text: string): { word: string; tokenIndex: number } | null {
  const tokens = text.split(/\s+/);
  const candidates = tokens
    .map((raw, i) => ({ raw, i }))
    .filter(({ raw }) => stripPunctuation(raw).length > 2);
  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
  return { word: stripPunctuation(pick.raw), tokenIndex: pick.i };
}

// Replace the token at the given position with a blank, leaving the rest intact.
function blankToken(text: string, tokenIndex: number): string {
  const tokens = text.split(/\s+/);
  tokens[tokenIndex] = "______";
  return tokens.join(" ");
}

function buildPuzzles(proverbs: Proverb[]): ProverbPuzzle[] {
  const shuffled = shuffle(proverbs).slice(0, SESSION_SIZE);
  const puzzles: ProverbPuzzle[] = [];

  for (const proverb of shuffled) {
    const blank = pickBlankWord(proverb.text);
    if (!blank) continue;
    const displayText = blankToken(proverb.text, blank.tokenIndex);
    const distractors = shuffled
      .filter((p) => p.id !== proverb.id)
      .map((p) => {
        const b = pickBlankWord(p.text);
        return b?.word ?? null;
      })
      .filter((w): w is string => !!w && w !== blank.word)
      .slice(0, 3);
    if (distractors.length < 3) continue;
    const allOptions = shuffle([blank.word, ...distractors]);
    puzzles.push({
      proverb,
      blankWord: blank.word,
      displayText,
      options: allOptions,
      correctIndex: allOptions.indexOf(blank.word),
    });
  }
  return puzzles;
}

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function FillTheProverbScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { onStreakUpdate, dismissCelebration, celebration, toast, dismissToast } = useStreakCelebration();
  const { submit: submitResult, retry: retryResult, status: saveStatus } = useSubmitQuizResult({ onStreakUpdate });
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);

  const puzzles = useMemo(() => {
    const proverbs = getProverbsForLanguage(selectedLanguageId);
    return buildPuzzles(proverbs);
  }, [selectedLanguageId]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"active" | "results">("active");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const correctRef = useRef(0);
  const [startTime] = useState(Date.now());
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const current = puzzles[index];

  // Gentle pulse on the empty inlay slot while the answer is still open.
  useEffect(() => {
    if (selectedOption !== null) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [selectedOption, index, pulseAnim]);

  const slotBg = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [tint(ACCENT.solid, 0.15), tint(ACCENT.solid, 0.34)] });

  const advance = useCallback(() => {
    if (index + 1 >= puzzles.length) {
      playFinishSound();
      setPhase("results");
      const duration = Math.round((Date.now() - startTime) / 1000);
      void submitResult({ languageId: selectedLanguageId, score: correctRef.current, accuracy: puzzles.length > 0 ? Math.round((correctRef.current / puzzles.length) * 100) : 0, durationMs: duration * 1000, questionCount: puzzles.length });
      return;
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setIndex((i) => i + 1);
      setSelectedOption(null);
      setLocked(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }, [index, puzzles.length, fadeAnim, startTime, submitResult, selectedLanguageId]);

  const handleOption = useCallback((optionIndex: number) => {
    if (locked || !current) return;
    setLocked(true);
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === current.correctIndex;
    if (isCorrect) {
      hapticSuccess();
      playCorrectSound();
      correctRef.current += 1;
      setCorrectCount((c) => c + 1);
    } else {
      hapticError();
      playIncorrectSound();
    }
    setTimeout(advance, FEEDBACK_DELAY);
  }, [locked, current, advance]);

  if (puzzles.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top"]}>
        <Stack.Screen options={{ title: "Fill the Proverb", headerBackTitle: "Back" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <IconSymbol name="text.quote" size={48} color={M.muted} />
          <Text style={{ marginTop: 16, textAlign: "center", fontSize: 15, color: M.sub }}>
            No proverbs available for this language yet.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: ACCENT.solid }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "results") {
    const accuracy = Math.round((correctCount / puzzles.length) * 100);
    return (
      <>
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
          <Stack.Screen options={{ title: "Fill the Proverb", headerBackTitle: "Back" }} />
          <GameResultView
            accent={ACCENT}
            stat={`${accuracy}%`}
            headline="Completed"
            subtitle={`${correctCount} of ${puzzles.length} proverbs completed correctly`}
            actions={[
              { label: "Play Again", kind: "primary", onPress: () => { setIndex(0); setCorrectCount(0); correctRef.current = 0; setSelectedOption(null); setLocked(false); setPhase("active"); } },
              { label: "Back to Discover", kind: "secondary", onPress: () => router.back() },
            ]}
          >
            <QuizSaveStatus status={saveStatus} onRetry={retryResult} />
          </GameResultView>
        </SafeAreaView>
        <NotificationBanner visible={toast.visible} title={toast.title} body={toast.body} type={toast.type} onDismiss={dismissToast} />
        <StreakCelebrationModal visible={!!celebration} streak={celebration?.streak ?? 0} isMilestone={celebration?.isMilestone} onDismiss={dismissCelebration} />
      </>
    );
  }

  if (!current) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Fill the Proverb", headerBackTitle: "Back" }} />
      <GameProgress current={index} total={puzzles.length} accent={ACCENT} variant="rule" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.8, color: M.muted, marginBottom: 6 }}>
          {index + 1} / {puzzles.length}
        </Text>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Illuminated proverb plaque — watermark quote glyph + purple rule */}
          <View style={{ borderRadius: 18, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, borderLeftWidth: 4, borderLeftColor: ACCENT.solid, padding: 22, paddingTop: 26, marginBottom: 22, overflow: "hidden" }}>
            <Text style={{ position: "absolute", top: -18, right: 6, fontSize: 110, fontWeight: "900", color: tint(ACCENT.solid, 0.1), lineHeight: 110 }}>
              &#8221;
            </Text>
            <GameEyebrow label="PROVERB" accent={ACCENT} icon="text.quote" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 19, fontWeight: "700", color: M.text, lineHeight: 30 }}>
              {current.displayText.split("______").map((part, i, arr) => (
                i < arr.length - 1
                  ? <Text key={i}>
                      {part}
                      <Text style={{ backgroundColor: tint(ACCENT.solid, 0.22), color: ACCENT.solid, fontWeight: "900", paddingHorizontal: 6 }}>
                        {"  ——  "}
                      </Text>
                    </Text>
                  : <Text key={i}>{part}</Text>
              ))}
            </Text>
            <View style={{ marginTop: 16, height: 1, backgroundColor: tint(ACCENT.solid, 0.2) }} />
            <Text style={{ marginTop: 12, fontSize: 13.5, fontStyle: "italic", color: M.sub, lineHeight: 20 }}>
              {current.proverb.translation}
            </Text>
          </View>

          {/* The missing-word inlay slot — pulses while the answer is open */}
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <Animated.View style={{ minWidth: 120, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignItems: "center", backgroundColor: selectedOption === null ? slotBg : tint(ACCENT.solid, 0.12), borderWidth: 1.5, borderColor: tint(ACCENT.solid, 0.4), borderStyle: "dashed" }}>
              <Text style={{ fontSize: 17, fontWeight: "900", letterSpacing: 4, color: ACCENT.solid }}>
                {selectedOption !== null ? current.options[selectedOption] : "?"}
              </Text>
            </Animated.View>
          </View>

          <GameEyebrow label="CHOOSE THE MISSING WORD" accent={ACCENT} style={{ marginBottom: 12 }} />

          {current.options.map((opt, i) => {
            let state: "default" | "correct" | "incorrect" | "dimmed" = "default";
            if (selectedOption !== null) {
              if (i === current.correctIndex) state = "correct";
              else if (i === selectedOption) state = "incorrect";
              else state = "dimmed";
            }
            return (
              <GameOption key={i} label={opt} state={state} accent={ACCENT} badge={String.fromCharCode(65 + i)} onPress={() => handleOption(i)} />
            );
          })}

          {selectedOption !== null && current.proverb.meaning && (
            <View style={{ marginTop: 8, borderRadius: 12, padding: 14, backgroundColor: tint(ACCENT.solid, 0.1), borderWidth: 1, borderColor: tint(ACCENT.solid, 0.25) }}>
              <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: ACCENT.solid, marginBottom: 4 }}>MEANING</Text>
              <Text style={{ fontSize: 13, color: M.sub, lineHeight: 18 }}>{current.proverb.meaning}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
