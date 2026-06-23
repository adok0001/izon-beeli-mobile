import { IconSymbol } from "@/components/ui/icon-symbol";
import { QuizSaveStatus } from "@/components/quiz-save-status";
import { GameEyebrow, GameOption, GameResultView, GameStatChip, tint } from "@/components/games/game-kit";
import { getAccent } from "@/constants/accent-colors";
import { useSubmitQuizResult } from "@/lib/hooks/use-quiz-result";
import { useStreakCelebration } from "@/lib/hooks/use-progress";
import { StreakCelebrationModal } from "@/components/streak-celebration-modal";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { Circle, Svg } from "react-native-svg";
import { hapticError, hapticHeavy, hapticSuccess } from "@/lib/haptics";
import { shuffle } from "@/lib/shuffle";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { playCorrectSound, playFinishSound, playIncorrectSound } from "@/lib/sounds";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import type { DictionaryEntry } from "@/lib/dictionary";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TOTAL_SECONDS = 60;
const FEEDBACK_DELAY = 600;

// Speed Round identity: amber "arcade" — energetic, timer-driven, combo streaks.
const ACCENT = getAccent("amber");

interface SpeedQuestion {
  word: string;
  correct: string;
  options: string[];
  correctIndex: number;
}

function buildQuestions(entries: DictionaryEntry[]): SpeedQuestion[] {
  if (entries.length < 4) return [];
  const pool = shuffle(entries);
  return pool.map((entry) => {
    const distractors = shuffle(pool.filter((e) => e.id !== entry.id))
      .slice(0, 3)
      .map((e) => e.english);
    const options = shuffle([entry.english, ...distractors]);
    return {
      word: entry.word,
      correct: entry.english,
      options,
      correctIndex: options.indexOf(entry.english),
    };
  });
}

function TimerArc({ timeLeft }: { timeLeft: number }) {
  const M = useMuseumTheme();
  const pct = timeLeft / TOTAL_SECONDS;
  const color = pct > 0.5 ? ACCENT.solid : pct > 0.25 ? M.warning : M.error;
  const size = 72;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={tint(color, 0.12)} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 20, fontWeight: "900", color }}>{timeLeft}</Text>
    </View>
  );
}

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function SpeedRoundScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { onStreakUpdate, dismissCelebration, celebration, toast, dismissToast } = useStreakCelebration();
  const { submit: submitResult, retry: retryResult, status: saveStatus } = useSubmitQuizResult({ onStreakUpdate });
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const { data: entries = [] } = useDictionary(selectedLanguageId);

  const [phase, setPhase] = useState<"idle" | "active" | "results">("idle");
  const [questions, setQuestions] = useState<SpeedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);
  const indexRef = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const popAnim = useRef(new Animated.Value(1)).current;

  const endGame = useCallback((finalScore: number, total: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    playFinishSound();
    hapticHeavy();
    setScore(finalScore);
    setPhase("results");
    void submitResult({ languageId: selectedLanguageId, score: finalScore, accuracy: total > 0 ? Math.round((finalScore / total) * 100) : 0, durationMs: TOTAL_SECONDS * 1000, questionCount: total });
  }, [submitResult, selectedLanguageId]);

  const startGame = useCallback(() => {
    const qs = buildQuestions(entries);
    if (qs.length === 0) return;
    setQuestions(qs);
    setIndex(0);
    indexRef.current = 0;
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setSelected(null);
    setLocked(false);
    setTimeLeft(TOTAL_SECONDS);
    setPhase("active");
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          endGame(scoreRef.current, indexRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [entries, endGame]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
  }, []);

  const advance = useCallback((qs: SpeedQuestion[]) => {
    const nextIndex = indexRef.current + 1;
    if (nextIndex >= qs.length) {
      endGame(scoreRef.current, qs.length);
      return;
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      setSelected(null);
      setLocked(false);
      popAnim.setValue(0.92);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(popAnim, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, popAnim, endGame]);

  const handleOption = useCallback((optIdx: number) => {
    if (locked || phase !== "active") return;
    const current = questions[index];
    if (!current) return;
    setLocked(true);
    setSelected(optIdx);
    const isCorrect = optIdx === current.correctIndex;
    if (isCorrect) {
      hapticSuccess();
      playCorrectSound();
      scoreRef.current += 1;
      setScore((s) => s + 1);
      setCombo((c) => c + 1);
    } else {
      hapticError();
      playIncorrectSound();
      setCombo(0);
    }
    feedbackRef.current = setTimeout(() => advance(questions), FEEDBACK_DELAY);
  }, [locked, phase, questions, index, advance]);

  const current = questions[index];

  if (phase === "idle") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
        <Stack.Screen options={{ title: "Speed Round", headerBackTitle: "Back" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 84, height: 84, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: tint(ACCENT.solid, 0.14), borderWidth: 1, borderColor: tint(ACCENT.solid, 0.3), marginBottom: 20 }}>
            <IconSymbol name="bolt.fill" size={40} color={ACCENT.solid} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: "900", color: M.text, textAlign: "center" }}>Speed Round</Text>
          <Text style={{ fontSize: 15, color: M.sub, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            Answer as many word-to-English questions as you can in 60 seconds
          </Text>
          <View style={{ marginTop: 32, flexDirection: "row", gap: 24, marginBottom: 40 }}>
            {[{ icon: "clock.fill" as const, label: "60 sec", color: ACCENT.solid }, { icon: "flame.fill" as const, label: "Combos", color: M.warning }, { icon: "trophy.fill" as const, label: "+XP", color: getAccent("purple").solid }].map((item) => (
              <View key={item.label} style={{ alignItems: "center" }}>
                <IconSymbol name={item.icon} size={22} color={item.color} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: item.color, marginTop: 4 }}>{item.label}</Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={startGame}
            disabled={entries.length < 4}
            style={{ borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48, backgroundColor: ACCENT.solid }}
            className="active:opacity-80"
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: M.ink }}>Start</Text>
          </Pressable>
          {entries.length < 4 && (
            <Text style={{ marginTop: 12, fontSize: 12, color: M.muted, textAlign: "center" }}>
              Not enough words in dictionary for this language yet.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "results") {
    return (
      <>
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
          <Stack.Screen options={{ title: "Speed Round", headerBackTitle: "Back" }} />
          <GameResultView
            accent={ACCENT}
            stat={String(score)}
            statLabel="CORRECT"
            headline="Time's Up!"
            subtitle={`You answered ${score} ${score === 1 ? "word" : "words"} correctly`}
            actions={[
              { label: "Play Again", kind: "primary", onPress: () => { dismissCelebration(); startGame(); } },
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
      <Stack.Screen options={{ title: "Speed Round", headerBackTitle: "Back" }} />

      {/* Top bar — amber score, central timer, word counter */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <GameStatChip value={score} label="SCORE" accent={ACCENT} />
        <TimerArc timeLeft={timeLeft} />
        <GameStatChip value={index + 1} label="WORD" />
      </View>

      <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: popAnim }] }}>
          {/* Combo streak pill */}
          <View style={{ alignItems: "center", height: 26, marginBottom: 6 }}>
            {combo >= 2 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: tint(M.warning, 0.14), borderWidth: 1, borderColor: tint(M.warning, 0.3) }}>
                <IconSymbol name="flame.fill" size={12} color={M.warning} />
                <Text style={{ fontSize: 12, fontWeight: "900", color: M.warning }}>{combo} streak</Text>
              </View>
            )}
          </View>

          {/* Word display */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <Text style={{ fontSize: 44, fontWeight: "900", color: M.text, textAlign: "center", letterSpacing: -1 }}>
              {current.word}
            </Text>
          </View>

          <GameEyebrow label="WHAT DOES THIS MEAN?" accent={ACCENT} icon="bolt.fill" align="center" style={{ marginBottom: 14 }} />

          {current.options.map((opt, i) => {
            let state: "default" | "correct" | "incorrect" | "dimmed" = "default";
            if (selected !== null) {
              if (i === current.correctIndex) state = "correct";
              else if (i === selected) state = "incorrect";
              else state = "dimmed";
            }
            return <GameOption key={i} label={opt} state={state} accent={ACCENT} badge={String(i + 1)} onPress={() => handleOption(i)} />;
          })}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
