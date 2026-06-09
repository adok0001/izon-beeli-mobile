import { IconSymbol } from "@/components/ui/icon-symbol";
import { FIDEL_CHART } from "@/lib/data/geez/fidel-chart";
import { NSIBIDI_CHARACTERS } from "@/lib/data/nsibidi";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { shuffle } from "@/lib/shuffle";
import { QuizSaveStatus } from "@/components/quiz-save-status";
import { useSubmitQuizResult } from "@/lib/hooks/use-quiz-result";
import { playCorrectSound, playFinishSound, playIncorrectSound } from "@/lib/sounds";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScriptEntry = {
  id: string;
  languageId: string;
  name: string;
  description: string | null;
  iconCharacter: string | null;
  accentColor: string | null;
};

type ScriptCharacter = {
  id: string;
  scriptId: string;
  character: string;
  answer: string;
  hint: string | null;
  category: string | null;
  displayOrder: number;
};

interface DecodeQuestion {
  character: string;
  correctAnswer: string;
  options: string[];
  correctIndex: number;
  hint?: string;
}

const SESSION_SIZE = 10;
const FEEDBACK_DELAY = 1000;

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
const FALLBACK_SCRIPTS: ScriptEntry[] = [
  { id: "geez-amharic",  languageId: "amharic", name: "Ge'ez / Fidel", description: "Ethiopic alphabet · Amharic & Tigrinya", iconCharacter: "ሀ", accentColor: "#4ade80" },
  { id: "nsibidi-igbo",  languageId: "igbo",    name: "Nsọbịdị",      description: "Indigenous Igbo script",                  iconCharacter: "",  accentColor: "#f59e0b" },
];

function buildLocalFallbackChars(scriptId: string): ScriptCharacter[] {
  if (scriptId.startsWith("geez")) {
    return FIDEL_CHART.map((c, i) => ({
      id: `geez-${c.id}`, scriptId, character: c.character, answer: c.romanization,
      hint: `Order ${c.order}`, category: c.baseConsonant, displayOrder: i,
    }));
  }
  if (scriptId.startsWith("nsibidi")) {
    return NSIBIDI_CHARACTERS.map((c, i) => ({
      id: `nsibidi-${c.id}`, scriptId, character: c.character, answer: c.meaning,
      hint: c.name, category: c.category, displayOrder: i,
    }));
  }
  return [];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestionsFromChars(chars: ScriptCharacter[]): DecodeQuestion[] {
  const pool = shuffle(chars);
  const session = pool.slice(0, SESSION_SIZE);
  const answerPool = pool.slice(0, SESSION_SIZE + 12);
  return session.map((char) => {
    const distractors = shuffle(answerPool.filter((c) => c.id !== char.id))
      .slice(0, 3)
      .map((c) => c.answer);
    const options = shuffle([char.answer, ...distractors]);
    return {
      character: char.character,
      correctAnswer: char.answer,
      options,
      correctIndex: options.indexOf(char.answer),
      hint: char.hint ?? undefined,
    };
  });
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const M = useMuseumTheme();
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <View style={{ marginHorizontal: 20, marginTop: 8, height: 6, borderRadius: 999, backgroundColor: M.border }}>
      <View style={{ height: 6, borderRadius: 999, backgroundColor: M.accent, width: `${pct}%` }} />
    </View>
  );
}

function OptionTile({
  label,
  state,
  onPress,
}: {
  label: string;
  state: "default" | "correct" | "incorrect" | "dimmed";
  onPress: () => void;
}) {
  const M = useMuseumTheme();
  const bg = { default: M.card, correct: "#22c55e20", incorrect: "#ef444420", dimmed: M.card }[state];
  const border = { default: M.border, correct: "#22c55e", incorrect: "#ef4444", dimmed: M.border }[state];
  const color = { default: M.text, correct: "#22c55e", incorrect: "#ef4444", dimmed: M.muted }[state];
  return (
    <Pressable
      onPress={onPress}
      disabled={state !== "default"}
      style={{
        marginBottom: 10, borderRadius: 12, borderWidth: 2,
        paddingHorizontal: 20, paddingVertical: 15,
        backgroundColor: bg, borderColor: border,
        opacity: state === "dimmed" ? 0.45 : 1,
      }}
      className="active:opacity-70"
    >
      <Text style={{ fontSize: 14, fontWeight: "600", color, textAlign: "center" }}>{label}</Text>
    </Pressable>
  );
}

function ConfigScreen({
  scripts,
  loading,
  onStart,
}: {
  scripts: ScriptEntry[];
  loading: boolean;
  onStart: (script: ScriptEntry) => void;
}) {
  const M = useMuseumTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Script Decode", headerBackTitle: "Back" }} />
      <View style={{ flex: 1, justifyContent: "center", padding: 28 }}>
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View style={{ width: 80, height: 80, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: `${M.accent}15`, marginBottom: 16 }}>
            <Text style={{ fontSize: 40, color: M.accent }}>ሀ</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: "900", color: M.text, textAlign: "center" }}>Script Decode</Text>
          <Text style={{ fontSize: 14, color: M.sub, textAlign: "center", marginTop: 6 }}>
            Read a symbol and identify its meaning or romanization
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color={M.accent} style={{ marginTop: 20 }} />
        ) : (
          <>
            <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 2, color: M.muted, marginBottom: 14, textAlign: "center" }}>
              CHOOSE A SCRIPT
            </Text>
            {scripts.map((script) => {
              const color = script.accentColor ?? M.accent;
              return (
                <Pressable
                  key={script.id}
                  onPress={() => onStart(script)}
                  style={{ borderRadius: 16, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, borderLeftWidth: 4, borderLeftColor: color, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 }}
                  className="active:opacity-70"
                >
                  <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: `${color}1A` }}>
                    <Text style={{ fontSize: 26, color }}>{script.iconCharacter ?? "?"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{script.name}</Text>
                    {script.description ? (
                      <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }}>{script.description}</Text>
                    ) : null}
                  </View>
                  <IconSymbol name="chevron.right" size={14} color={color} />
                </Pressable>
              );
            })}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function ScriptDecodeScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { submit: submitResult, retry: retryResult, status: saveStatus } = useSubmitQuizResult();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);

  const [selectedScript, setSelectedScript] = useState<ScriptEntry | null>(null);
  const [phase, setPhase] = useState<"config" | "loading" | "active" | "results">("config");
  const [questions, setQuestions] = useState<DecodeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const correctRef = useRef(0);
  const [startTime, setStartTime] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { data: fetchedScripts, isLoading: scriptsLoading } = useQuery({
    queryKey: ["scripts"],
    queryFn: () => apiFetch<ScriptEntry[]>("/scripts"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: fetchedChars, error: charsError } = useQuery({
    queryKey: ["script-characters", selectedScript?.id],
    queryFn: () => apiFetch<ScriptCharacter[]>(`/scripts/${selectedScript!.id}/characters`),
    enabled: !!selectedScript,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (phase !== "loading" || !selectedScript) return;
    if (fetchedChars === undefined && !charsError) return;

    const chars =
      fetchedChars && fetchedChars.length > 0
        ? fetchedChars
        : buildLocalFallbackChars(selectedScript.id);

    const qs = buildQuestionsFromChars(chars);
    setQuestions(qs);
    setIndex(0);
    setCorrectCount(0);
    correctRef.current = 0;
    setSelected(null);
    setLocked(false);
    setStartTime(Date.now());
    setPhase("active");
  }, [phase, selectedScript, fetchedChars, charsError]);

  const accentColor = selectedScript?.accentColor ?? M.accent;

  const displayScripts = useMemo(
    () => (fetchedScripts && fetchedScripts.length > 0 ? fetchedScripts : FALLBACK_SCRIPTS),
    [fetchedScripts]
  );

  const handleStart = useCallback((script: ScriptEntry) => {
    setSelectedScript(script);
    setPhase("loading");
  }, []);

  const advance = useCallback(() => {
    if (index + 1 >= questions.length) {
      playFinishSound();
      setPhase("results");
      const duration = Math.round((Date.now() - startTime) / 1000);
      void submitResult({ languageId: selectedLanguageId, score: correctRef.current, accuracy: questions.length > 0 ? Math.round((correctRef.current / questions.length) * 100) : 0, durationMs: duration * 1000, questionCount: questions.length });
      getToken().then((token) => {
        if (!token) return;
        apiFetch("/quiz-results", {
          method: "POST",
          token,
          body: JSON.stringify({
            languageId: selectedScript?.languageId,
            score: correctCount,
            accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
            durationMs: duration * 1000,
            questionCount: questions.length,
          }),
        }).catch(() => {});
      });
      return;
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setIndex((i) => i + 1);
      setSelected(null);
      setLocked(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [index, questions.length, correctCount, fadeAnim, startTime, getToken, selectedScript, submitResult, selectedLanguageId]);

  const handleOption = useCallback((optIdx: number) => {
    if (locked) return;
    const current = questions[index];
    if (!current) return;
    setLocked(true);
    setSelected(optIdx);
    const isCorrect = optIdx === current.correctIndex;
    if (isCorrect) { hapticSuccess(); playCorrectSound(); correctRef.current += 1; setCorrectCount((c) => c + 1); }
    else { hapticError(); playIncorrectSound(); }
    setTimeout(advance, FEEDBACK_DELAY);
  }, [locked, questions, index, advance]);

  if (phase === "config" || phase === "loading") {
    return (
      <ConfigScreen
        scripts={displayScripts}
        loading={scriptsLoading || phase === "loading"}
        onStart={handleStart}
      />
    );
  }

  if (phase === "results") {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
        <Stack.Screen options={{ title: "Script Decode", headerBackTitle: "Back" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: accentColor, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 36, fontWeight: "900", color: accentColor }}>{accuracy}%</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: M.text, marginBottom: 8 }}>Session Complete</Text>
          <Text style={{ fontSize: 15, color: M.sub, textAlign: "center" }}>
            {correctCount} of {questions.length} characters decoded correctly
          </Text>
          <QuizSaveStatus status={saveStatus} onRetry={retryResult} />
          <View style={{ width: "100%", gap: 10, marginTop: 32 }}>
            <Pressable
              onPress={() => selectedScript && handleStart(selectedScript)}
              style={{ borderRadius: 14, paddingVertical: 16, backgroundColor: accentColor, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>Play Again</Text>
            </Pressable>
            <Pressable
              onPress={() => setPhase("config")}
              style={{ borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: M.border, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: M.text }}>Switch Script</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={{ borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, color: M.muted }}>Back to Discover</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const current = questions[index];
  if (!current) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Script Decode", headerBackTitle: "Back" }} />
      <ProgressBar current={index} total={questions.length} />

      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.8, color: M.muted, marginBottom: 16 }}>
          {index + 1} / {questions.length}
        </Text>

        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 32, flex: 1, maxHeight: 180 }}>
            <View style={{ width: 140, height: 140, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: `${accentColor}12`, borderWidth: 2, borderColor: `${accentColor}30` }}>
              <Text style={{ fontSize: 72, color: accentColor, lineHeight: 84 }}>{current.character}</Text>
            </View>
            {current.hint ? (
              <Text style={{ marginTop: 10, fontSize: 11, color: M.muted, letterSpacing: 0.5 }}>{current.hint}</Text>
            ) : null}
          </View>

          <Text style={{ fontSize: 12, fontWeight: "700", color: M.muted, marginBottom: 12, letterSpacing: 0.5 }}>
            What does this character represent?
          </Text>

          {current.options.map((opt, i) => {
            let state: "default" | "correct" | "incorrect" | "dimmed" = "default";
            if (selected !== null) {
              if (i === current.correctIndex) state = "correct";
              else if (i === selected) state = "incorrect";
              else state = "dimmed";
            }
            return <OptionTile key={i} label={opt} state={state} onPress={() => handleOption(i)} />;
          })}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
