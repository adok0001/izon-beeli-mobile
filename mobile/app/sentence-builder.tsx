import { IconSymbol } from "@/components/ui/icon-symbol";
import { QuizSaveStatus } from "@/components/quiz-save-status";
import { GameEyebrow, GameProgress, GameResultView, tint } from "@/components/games/game-kit";
import { getAccent } from "@/constants/accent-colors";
import { useSubmitQuizResult } from "@/lib/hooks/use-quiz-result";
import { useStreakCelebration } from "@/lib/hooks/use-progress";
import { StreakCelebrationModal } from "@/components/streak-celebration-modal";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { getSentencesForLanguage } from "@/lib/data/sentences";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { shuffle } from "@/lib/shuffle";
import { playCorrectSound, playFinishSound, playIncorrectSound } from "@/lib/sounds";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import type { SentenceTemplate } from "@/types";
import { Stack, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";

const SESSION_SIZE = 8;

// Sentence Builder identity: orange "building blocks" — tactile tiles that snap
// into a slotted construction tray.
const ACCENT = getAccent("orange");

interface WordTile {
  id: string;
  text: string;
}

function buildTiles(sentence: SentenceTemplate): WordTile[] {
  return shuffle(
    sentence.sentence
      .split(/\s+/)
      .filter(Boolean)
      .map((w, i) => ({ id: `${i}-${w}`, text: w }))
  );
}

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function SentenceBuilderScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { onStreakUpdate, dismissCelebration, celebration, toast, dismissToast } = useStreakCelebration();
  const { submit: submitResult, retry: retryResult, status: saveStatus } = useSubmitQuizResult({ onStreakUpdate });
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);

  // Mutable queue: wrongly-answered sentences are appended to the back (until
  // correct), so `sentences.length` grows past the original session size.
  const [sentences, setSentences] = useState<SentenceTemplate[]>(() =>
    shuffle(getSentencesForLanguage(selectedLanguageId)).slice(0, SESSION_SIZE)
  );
  // Original session size — the score denominator, unaffected by re-queuing.
  const [originalCount] = useState(() => sentences.length);
  // Sentence ids already scored, so a re-queued sentence is counted only once.
  const scoredIds = useRef<Set<string>>(new Set());

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"active" | "results">("active");
  const [bank, setBank] = useState<WordTile[]>(() => buildTiles(sentences[0] ?? { id: "", languageId: "", sentence: "", answer: "", englishSentence: "" }));
  const [placed, setPlaced] = useState<WordTile[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const correctRef = useRef(0);
  const [startTime] = useState(Date.now());
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const current = sentences[index];
  const totalWords = bank.length + placed.length;

  const doCheck = useCallback(() => {
    if (!current || placed.length === 0) return;
    const userSentence = placed.map((t) => t.text).join(" ");
    const isCorrect = userSentence === current.sentence;
    // Score only the first encounter; re-queued retries don't change the tally.
    const firstAttempt = !scoredIds.current.has(current.id);
    scoredIds.current.add(current.id);
    setChecked(true);
    setCorrect(isCorrect);
    if (isCorrect) {
      hapticSuccess();
      playCorrectSound();
      if (firstAttempt) {
        correctRef.current += 1;
        setCorrectCount((c) => c + 1);
      }
    } else {
      hapticError();
      playIncorrectSound();
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    }
  }, [current, placed, shakeAnim]);

  const advance = useCallback(() => {
    // Move a wrongly-built sentence to the back of the queue (re-asked until correct).
    const queue = checked && !correct ? [...sentences, current!] : sentences;
    if (queue !== sentences) setSentences(queue);

    if (index + 1 >= queue.length) {
      playFinishSound();
      setPhase("results");
      const duration = Math.round((Date.now() - startTime) / 1000);
      void submitResult({ languageId: selectedLanguageId, score: correctRef.current, accuracy: originalCount > 0 ? Math.round((correctRef.current / originalCount) * 100) : 0, durationMs: duration * 1000, questionCount: originalCount });
      return;
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      const next = index + 1;
      setIndex(next);
      setBank(buildTiles(queue[next]!));
      setPlaced([]);
      setChecked(false);
      setCorrect(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }, [index, sentences, current, checked, correct, originalCount, fadeAnim, startTime, submitResult, selectedLanguageId]);

  const tapBank = useCallback((tile: WordTile) => {
    hapticTap();
    setBank((b) => b.filter((t) => t.id !== tile.id));
    setPlaced((p) => [...p, tile]);
  }, []);

  const tapPlaced = useCallback((tile: WordTile) => {
    if (checked) return;
    hapticTap();
    setPlaced((p) => p.filter((t) => t.id !== tile.id));
    setBank((b) => [...b, tile]);
  }, [checked]);

  const reset = useCallback(() => {
    if (!current) return;
    setBank(buildTiles(current));
    setPlaced([]);
    setChecked(false);
    setCorrect(false);
    hapticTap();
  }, [current]);

  if (sentences.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: M.bg, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Stack.Screen options={{ title: "Build a Sentence", headerBackTitle: "Back" }} />
        <Text style={{ fontSize: 15, color: M.sub, textAlign: "center" }}>No sentences available for this language yet.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: ACCENT.solid }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "results") {
    const accuracy = originalCount > 0 ? Math.round((correctCount / originalCount) * 100) : 0;
    return (
      <>
        <View style={{ flex: 1, backgroundColor: M.bg }}>
          <Stack.Screen options={{ title: "Build a Sentence", headerBackTitle: "Back" }} />
          <GameResultView
            accent={ACCENT}
            stat={`${accuracy}%`}
            headline="Done!"
            subtitle={`${correctCount} of ${originalCount} sentences built correctly`}
            actions={[
              { label: "Play Again", kind: "primary", onPress: () => { dismissCelebration(); const fresh = shuffle(getSentencesForLanguage(selectedLanguageId)).slice(0, SESSION_SIZE); scoredIds.current = new Set(); setSentences(fresh); setIndex(0); setCorrectCount(0); correctRef.current = 0; setBank(buildTiles(fresh[0]!)); setPlaced([]); setChecked(false); setCorrect(false); setPhase("active"); } },
              { label: "Back to Discover", kind: "secondary", onPress: () => router.back() },
            ]}
          >
            <QuizSaveStatus status={saveStatus} onRetry={retryResult} />
          </GameResultView>
        </View>
        <NotificationBanner visible={toast.visible} title={toast.title} body={toast.body} type={toast.type} onDismiss={dismissToast} />
        <StreakCelebrationModal visible={!!celebration} streak={celebration?.streak ?? 0} isMilestone={celebration?.isMilestone} onDismiss={dismissCelebration} />
      </>
    );
  }

  if (!current) return null;

  const trayBorderColor = checked ? (correct ? M.success : M.error) : tint(ACCENT.solid, 0.4);

  return (
    <View style={{ flex: 1, backgroundColor: M.bg }}>
      <Stack.Screen options={{ title: "Build a Sentence", headerBackTitle: "Back" }} />
      <GameProgress current={index} total={originalCount} accent={ACCENT} variant="bar" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.8, color: M.muted }}>
            {index + 1} / {sentences.length}
          </Text>
          {/* Block counter — how many slots are filled */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: tint(ACCENT.solid, 0.12), borderWidth: 1, borderColor: tint(ACCENT.solid, 0.3) }}>
            <IconSymbol name="text.quote" size={11} color={ACCENT.solid} />
            <Text style={{ fontSize: 11, fontWeight: "900", color: ACCENT.solid }}>{placed.length} / {totalWords}</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* English translation hint */}
          <View style={{ borderRadius: 14, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, padding: 14, marginBottom: 20 }}>
            <GameEyebrow label={`TRANSLATE INTO ${selectedLanguageId.toUpperCase()}`} accent={ACCENT} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: M.text }}>{current.englishSentence}</Text>
          </View>

          {/* Build tray — the slotted construction area */}
          <Animated.View
            style={{
              transform: [{ translateX: shakeAnim }],
              borderRadius: 14,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: trayBorderColor,
              backgroundColor: checked ? (correct ? M.successBg : M.errorBg) : tint(ACCENT.solid, 0.05),
              minHeight: 60,
              padding: 12,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {placed.length === 0 && (
              <Text style={{ color: M.muted, fontSize: 13, alignSelf: "center" }}>Tap blocks below to stack them here</Text>
            )}
            {placed.map((tile) => {
              const blockBg = checked ? (correct ? M.successBg : M.errorBg) : tint(ACCENT.solid, 0.16);
              const blockEdge = checked ? (correct ? M.successBorder : M.errorBorder) : tint(ACCENT.solid, 0.5);
              const blockText = checked ? (correct ? M.success : M.error) : ACCENT.solid;
              return (
                <Pressable
                  key={tile.id}
                  onPress={() => tapPlaced(tile)}
                  style={{ borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: blockBg, borderWidth: 1, borderColor: blockEdge, borderBottomWidth: 3 }}
                  className="active:opacity-60"
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: blockText }}>{tile.text}</Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Reveal answer on incorrect */}
          {checked && !correct && (
            <View style={{ borderRadius: 12, backgroundColor: M.successBg, borderWidth: 1, borderColor: M.successBorder, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.5, color: M.success, marginBottom: 4 }}>CORRECT ANSWER</Text>
              <Text style={{ fontSize: 14, color: M.success, fontWeight: "600" }}>{current.sentence}</Text>
            </View>
          )}

          {/* Word bank — loose blocks waiting to be stacked */}
          <GameEyebrow label="BLOCKS" accent={ACCENT} style={{ marginBottom: 10 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {bank.map((tile) => (
              <Pressable
                key={tile.id}
                onPress={() => tapBank(tile)}
                style={{ borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: M.card, borderWidth: 1.5, borderColor: M.border, borderBottomWidth: 3, borderBottomColor: tint(ACCENT.solid, 0.35) }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>{tile.text}</Text>
              </Pressable>
            ))}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={reset}
              style={{ flex: 1, borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: M.border, alignItems: "center" }}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: M.muted }}>Reset</Text>
            </Pressable>
            {!checked ? (
              <Pressable
                onPress={doCheck}
                disabled={placed.length === 0}
                style={{ flex: 2, borderRadius: 12, paddingVertical: 14, backgroundColor: placed.length > 0 ? ACCENT.solid : M.border, alignItems: "center" }}
                className="active:opacity-80"
              >
                <Text style={{ fontSize: 14, fontWeight: "800", color: M.ink }}>Check</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={advance}
                style={{ flex: 2, borderRadius: 12, paddingVertical: 14, backgroundColor: ACCENT.solid, alignItems: "center" }}
                className="active:opacity-80"
              >
                <Text style={{ fontSize: 14, fontWeight: "800", color: M.ink }}>
                  {correct && index + 1 >= sentences.length ? "Finish" : "Next →"}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
