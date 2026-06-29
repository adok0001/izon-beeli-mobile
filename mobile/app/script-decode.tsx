import { IconSymbol } from "@/components/ui/icon-symbol";
import { GameEyebrow, GameOption, GameProgress, GameResultView, tint } from "@/components/games/game-kit";
import { getAccent } from "@/constants/accent-colors";
import type { AccentColor } from "@/constants/accent-colors";
import { FIDEL_CHART } from "@/lib/data/geez/fidel-chart";
import { ALL_NSIBIDI_CHARACTERS } from "@/lib/data/nsibidi";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { apiFetch } from "@/lib/api";
import { playCorrectSound, playFinishSound, playIncorrectSound } from "@/lib/sounds";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter } from "expo-router";
import { useStreakCelebration } from "@/lib/hooks/use-progress";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useCallback, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScriptMode = "geez" | "nsibidi";

// Script Decode identity: "carved stone tablet" — the glyph sits in an
// inscription frame, tinted with the per-script accent (teal Ge'ez / amber Nsibidi).
const GEEZ_ACCENT = getAccent("teal");
const NSIBIDI_ACCENT = getAccent("amber");

interface DecodeQuestion {
  character: string;
  correctAnswer: string;
  options: string[];
  correctIndex: number;
  hint?: string;
}

const SESSION_SIZE = 10;
const FEEDBACK_DELAY = 1000;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildGeezQuestions(): DecodeQuestion[] {
  const pool = shuffle(FIDEL_CHART).slice(0, SESSION_SIZE + 12);
  return pool.slice(0, SESSION_SIZE).map((char) => {
    const distractors = shuffle(pool.filter((c) => c.id !== char.id))
      .slice(0, 3)
      .map((c) => c.romanization);
    const options = shuffle([char.romanization, ...distractors]);
    return {
      character: char.character,
      correctAnswer: char.romanization,
      options,
      correctIndex: options.indexOf(char.romanization),
      hint: `Order ${char.order} (${["e","u","i","a","ē","ə","o"][char.order - 1] ?? ""})`,
    };
  });
}

function buildNsibidiQuestions(): DecodeQuestion[] {
  const pool = shuffle(ALL_NSIBIDI_CHARACTERS).slice(0, SESSION_SIZE + 12);
  return pool.slice(0, SESSION_SIZE).map((char) => {
    const distractors = shuffle(pool.filter((c) => c.id !== char.id))
      .slice(0, 3)
      .map((c) => c.meaning);
    const options = shuffle([char.meaning, ...distractors]);
    return {
      character: char.character,
      correctAnswer: char.meaning,
      options,
      correctIndex: options.indexOf(char.meaning),
      hint: char.name,
    };
  });
}

// One L-shaped tick in a tablet corner.
function CornerTick({ accent, corner }: { accent: AccentColor; corner: "tl" | "tr" | "bl" | "br" }) {
  const v = corner[0] === "t" ? { top: 10 } : { bottom: 10 };
  const h = corner[1] === "l" ? { left: 10 } : { right: 10 };
  return (
    <>
      <View style={{ position: "absolute", ...v, ...h, width: 14, height: 2, borderRadius: 1, backgroundColor: tint(accent.solid, 0.5) }} />
      <View style={{ position: "absolute", ...v, ...h, width: 2, height: 14, borderRadius: 1, backgroundColor: tint(accent.solid, 0.5) }} />
    </>
  );
}

function ConfigScreen({ onStart }: { onStart: (mode: ScriptMode) => void }) {
  const M = useMuseumTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Script Decode", headerBackTitle: "Back" }} />
      <View style={{ flex: 1, justifyContent: "center", padding: 28 }}>
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View style={{ width: 84, height: 84, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: tint(GEEZ_ACCENT.solid, 0.14), borderWidth: 1, borderColor: tint(GEEZ_ACCENT.solid, 0.3), marginBottom: 16 }}>
            <Text style={{ fontSize: 42, color: GEEZ_ACCENT.solid }}>ሀ</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: "900", color: M.text, textAlign: "center" }}>Script Decode</Text>
          <Text style={{ fontSize: 14, color: M.sub, textAlign: "center", marginTop: 6 }}>
            Read a symbol and identify its meaning or romanization
          </Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 2, color: M.muted, marginBottom: 14, textAlign: "center" }}>
          CHOOSE A SCRIPT
        </Text>
        <Pressable
          onPress={() => onStart("geez")}
          style={{ borderRadius: 16, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, borderLeftWidth: 4, borderLeftColor: GEEZ_ACCENT.solid, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 }}
          className="active:opacity-70"
        >
          <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: GEEZ_ACCENT.bg }}>
            <Text style={{ fontSize: 26, color: GEEZ_ACCENT.solid }}>ሀ</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>Ge&apos;ez / Fidel</Text>
            <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }}>Ethiopic alphabet · Amharic & Tigrinya</Text>
          </View>
          <IconSymbol name="chevron.right" size={14} color={GEEZ_ACCENT.solid} />
        </Pressable>
        <Pressable
          onPress={() => onStart("nsibidi")}
          style={{ borderRadius: 16, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, borderLeftWidth: 4, borderLeftColor: NSIBIDI_ACCENT.solid, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}
          className="active:opacity-70"
        >
          <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: NSIBIDI_ACCENT.bg }}>
            <Text style={{ fontSize: 26, color: NSIBIDI_ACCENT.solid }}>𐘕</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>Nsịbịdị</Text>
            <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }}>Indigenous Igbo script</Text>
          </View>
          <IconSymbol name="chevron.right" size={14} color={NSIBIDI_ACCENT.solid} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function ScriptDecodeScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();

  const { onStreakUpdate, dismissCelebration, toast, dismissToast } = useStreakCelebration();
  const [mode, setMode] = useState<ScriptMode | null>(null);
  const [phase, setPhase] = useState<"config" | "active" | "results">("config");
  const [questions, setQuestions] = useState<DecodeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const popAnim = useRef(new Animated.Value(1)).current;

  const accent: AccentColor = mode === "geez" ? GEEZ_ACCENT : NSIBIDI_ACCENT;

  const handleStart = useCallback((selectedMode: ScriptMode) => {
    const qs = selectedMode === "geez" ? buildGeezQuestions() : buildNsibidiQuestions();
    setMode(selectedMode);
    setQuestions(qs);
    setIndex(0);
    setCorrectCount(0);
    setSelected(null);
    setLocked(false);
    setStartTime(Date.now());
    setPhase("active");
  }, []);

  const advance = useCallback(() => {
    if (index + 1 >= questions.length) {
      playFinishSound();
      setPhase("results");
      const duration = Math.round((Date.now() - startTime) / 1000);
      (async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const res = await apiFetch<{ streak?: number; streakIncremented?: boolean; streakMilestone?: number | null }>("/quiz-results", {
            method: "POST",
            token,
            body: JSON.stringify({ languageId: selectedLanguageId, score: correctCount, accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0, durationMs: duration * 1000, questionCount: questions.length }),
          });
          if (res.streakIncremented && res.streak) {
            onStreakUpdate(res.streak, !!res.streakMilestone);
          }
        } catch {
          // non-blocking
        }
      })();
      return;
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setIndex((i) => i + 1);
      setSelected(null);
      setLocked(false);
      popAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(popAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]).start();
    });
  }, [index, questions.length, correctCount, fadeAnim, popAnim, startTime, getToken, onStreakUpdate, selectedLanguageId]);

  const handleOption = useCallback((optIdx: number) => {
    if (locked) return;
    const current = questions[index];
    if (!current) return;
    setLocked(true);
    setSelected(optIdx);
    const isCorrect = optIdx === current.correctIndex;
    if (isCorrect) { hapticSuccess(); playCorrectSound(); setCorrectCount((c) => c + 1); }
    else { hapticError(); playIncorrectSound(); }
    setTimeout(advance, FEEDBACK_DELAY);
  }, [locked, questions, index, advance]);

  if (phase === "config") return <ConfigScreen onStart={handleStart} />;

  if (phase === "results") {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <>
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
          <Stack.Screen options={{ title: "Script Decode", headerBackTitle: "Back" }} />
          <GameResultView
            accent={accent}
            stat={`${accuracy}%`}
            headline="Session Complete"
            subtitle={`${correctCount} of ${questions.length} characters decoded correctly`}
            actions={[
              { label: "Play Again", kind: "primary", onPress: () => { dismissCelebration(); mode && handleStart(mode); } },
              { label: "Switch Script", kind: "secondary", onPress: () => { dismissCelebration(); setPhase("config"); } },
              { label: "Back to Discover", kind: "ghost", onPress: () => router.back() },
            ]}
          />
        </SafeAreaView>
        <NotificationBanner visible={toast.visible} title={toast.title} body={toast.body} type={toast.type} onDismiss={dismissToast} />
      </>
    );
  }

  const current = questions[index];
  if (!current) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Script Decode", headerBackTitle: "Back" }} />
      <GameProgress current={index} total={questions.length} accent={accent} variant="segments" />

      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.8, color: M.muted, marginBottom: 16, marginTop: 8 }}>
          {index + 1} / {questions.length}
        </Text>

        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          {/* Carved inscription tablet */}
          <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 32, flex: 1, maxHeight: 200 }}>
            <Animated.View style={{ width: 168, height: 168, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: tint(accent.solid, 0.1), borderWidth: 2, borderColor: tint(accent.solid, 0.3), transform: [{ scale: popAnim }] }}>
              <CornerTick accent={accent} corner="tl" />
              <CornerTick accent={accent} corner="tr" />
              <CornerTick accent={accent} corner="bl" />
              <CornerTick accent={accent} corner="br" />
              <Text style={{ fontSize: 84, color: accent.solid, lineHeight: 96 }}>{current.character}</Text>
            </Animated.View>
            {current.hint && (
              <Text style={{ marginTop: 12, fontSize: 11, color: M.muted, letterSpacing: 0.5 }}>{current.hint}</Text>
            )}
          </View>

          <GameEyebrow
            label={mode === "geez" ? "DECODE THE CHARACTER" : "DECODE THE SYMBOL"}
            accent={accent}
            icon="character.book.closed"
            style={{ marginBottom: 12 }}
          />

          {current.options.map((opt, i) => {
            let state: "default" | "correct" | "incorrect" | "dimmed" = "default";
            if (selected !== null) {
              if (i === current.correctIndex) state = "correct";
              else if (i === selected) state = "incorrect";
              else state = "dimmed";
            }
            return <GameOption key={i} label={opt} state={state} accent={accent} marker onPress={() => handleOption(i)} />;
          })}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
