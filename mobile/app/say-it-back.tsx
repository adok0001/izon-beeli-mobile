import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useLesson } from "@/lib/hooks/use-courses";
import { hapticHeavy, hapticSuccess, hapticTap } from "@/lib/haptics";
import { localize } from "@/lib/localize";
import { shuffle } from "@/lib/shuffle";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { DictionaryEntry } from "@/lib/dictionary";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SessionPhase = "listen" | "record" | "compare";

function WaveformDots({ active }: { active: boolean }) {
  const M = useMuseumTheme();
  const anims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(4))).current;

  useEffect(() => {
    if (!active) {
      anims.forEach((a) => a.setValue(4));
      return;
    }
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, { toValue: 22, duration: 300 + i * 60, useNativeDriver: false }),
          Animated.timing(a, { toValue: 4, duration: 300 + i * 60, useNativeDriver: false }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active]);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 28, gap: 5 }}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{ width: 5, borderRadius: 3, backgroundColor: M.error, height: a }}
        />
      ))}
    </View>
  );
}

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function SayItBackScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  // Launched from a lesson's "Prove it — say it back" card: drill that lesson's
  // own sentences instead of the shuffled dictionary. Same listen/record/
  // compare flow, just lesson-specific content.
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { uiLanguage } = useUiLanguageStore();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const { data: entries = [] } = useDictionary(selectedLanguageId);
  const { data: lesson } = useLesson(lessonId ?? "");

  // The lesson's spoken lines (target line + its translation), in order, as
  // say-it-back items. Empty until the lesson loads or when not lesson-seeded.
  const lessonSentences = useMemo<DictionaryEntry[]>(() => {
    if (!lesson?.transcript) return [];
    return lesson.transcript
      .filter((seg) => seg.text && seg.translation)
      .map((seg, i) => ({
        id: `${lesson.id}-line-${i}`,
        word: seg.text,
        english: localize(seg.translation ?? "", uiLanguage),
        category: "phrases",
        languageId: selectedLanguageId,
      }));
  }, [lesson, uiLanguage, selectedLanguageId]);

  const [words, setWords] = useState<DictionaryEntry[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("listen");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [gotIt, setGotIt] = useState(0);
  const [total, setTotal] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
  }, []);

  useEffect(() => {
    if (lessonId) {
      if (lessonSentences.length > 0) setWords(lessonSentences);
      return;
    }
    if (entries.length > 0) {
      const pool = shuffle(entries.filter((e) => e.word && e.english));
      setWords(pool);
    }
  }, [entries, lessonId, lessonSentences]);

  useEffect(() => () => { playbackSound?.unloadAsync(); }, [playbackSound]);

  const currentWord = words[wordIndex];

  const playNative = useCallback(async () => {
    if (!currentWord) return;
    hapticTap();
    setIsPlayingNative(true);
    if (currentWord.audioUrl && typeof currentWord.audioUrl === "string") {
      const { sound } = await Audio.Sound.createAsync({ uri: currentWord.audioUrl }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) { setIsPlayingNative(false); sound.unloadAsync(); }
      });
    } else {
      Speech.speak(currentWord.word, { language: selectedLanguageId, rate: 0.85, onDone: () => setIsPlayingNative(false) });
    }
  }, [currentWord, selectedLanguageId]);

  const startRecording = useCallback(async () => {
    if (!permissionGranted) return;
    hapticTap();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(rec);
    setRecordingUri(null);
    setSessionPhase("record");
  }, [permissionGranted]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    hapticHeavy();
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setRecordingUri(uri);
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    setSessionPhase("compare");
  }, [recording]);

  const playUserRecording = useCallback(async () => {
    if (!recordingUri) return;
    hapticTap();
    setIsPlayingUser(true);
    await playbackSound?.unloadAsync();
    const { sound } = await Audio.Sound.createAsync({ uri: recordingUri }, { shouldPlay: true });
    setPlaybackSound(sound);
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) { setIsPlayingUser(false); }
    });
  }, [recordingUri, playbackSound]);

  const handleResult = useCallback((result: "got-it" | "not-quite") => {
    if (result === "got-it") { hapticSuccess(); setGotIt((g) => g + 1); }
    else hapticTap();
    setTotal((t) => t + 1);

    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setWordIndex((i) => i + 1);
      setSessionPhase("listen");
      setRecordingUri(null);
      setIsPlayingNative(false);
      setIsPlayingUser(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  if (words.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
        <Stack.Screen options={{ title: "Say It Back", headerBackTitle: "Back" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 15, color: M.sub, textAlign: "center" }}>No words available yet. Keep learning!</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: M.accent }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentWord) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
        <Stack.Screen options={{ title: "Say It Back", headerBackTitle: "Back" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: M.accent, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 36, fontWeight: "900", color: M.accent }}>{total > 0 ? `${Math.round((gotIt / total) * 100)}%` : "—"}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: M.text, marginBottom: 8 }}>All done!</Text>
          <Text style={{ fontSize: 15, color: M.sub, textAlign: "center" }}>
            {gotIt} of {total} marked as &quot;Got it&quot;
          </Text>
          <View style={{ width: "100%", gap: 10, marginTop: 32 }}>
            <Pressable
              onPress={() => { setWordIndex(0); setGotIt(0); setTotal(0); setSessionPhase("listen"); setWords(lessonId ? lessonSentences : shuffle(entries.filter((e) => e.word && e.english))); }}
              style={{ borderRadius: 14, paddingVertical: 16, backgroundColor: M.accent, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>Try Again</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={{ borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: M.border, alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: M.text }}>Back to Discover</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Say It Back", headerBackTitle: "Back" }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ flex: 1, fontSize: 11, fontWeight: "800", letterSpacing: 1.8, color: M.muted }}>
            {lessonId ? "LINE" : "WORD"} {wordIndex + 1}
          </Text>
          {/* Honest framing: the app compares audio; the learner judges. No
              automated pronunciation scoring is implied. */}
          <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: M.pillBg, borderWidth: 1, borderColor: M.border }}>
            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 0.8, color: M.muted }}>SELF-GRADED · BETA</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          {/* Word card */}
          <View style={{ width: "100%", borderRadius: 20, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, padding: 28, alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 48, fontWeight: "900", color: M.text, textAlign: "center", letterSpacing: -1 }}>
              {currentWord.word}
            </Text>
            {currentWord.pronunciation && (
              <Text style={{ fontSize: 15, color: M.muted, marginTop: 6 }}>/{currentWord.pronunciation}/</Text>
            )}
            <View style={{ height: 1, width: "80%", backgroundColor: M.border, marginVertical: 14 }} />
            <Text style={{ fontSize: 16, color: M.sub }}>{currentWord.english}</Text>
          </View>

          {/* Phase 1: Listen */}
          {sessionPhase === "listen" && (
            <View style={{ width: "100%", alignItems: "center", gap: 16 }}>
              <Text style={{ fontSize: 14, color: M.sub, textAlign: "center" }}>Listen to the native pronunciation, then try it yourself</Text>
              <Pressable
                onPress={playNative}
                style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: `${M.accent}15`, borderWidth: 2, borderColor: M.accent }}
                className="active:opacity-80"
              >
                <IconSymbol name={isPlayingNative ? "speaker.wave.3.fill" : "speaker.wave.2.fill"} size={32} color={M.accent} />
              </Pressable>
              <Pressable
                onPress={startRecording}
                disabled={!permissionGranted}
                style={{ width: "100%", borderRadius: 14, paddingVertical: 15, backgroundColor: M.error, alignItems: "center" }}
                className="active:opacity-80"
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: M.parchment }}>Record My Pronunciation</Text>
              </Pressable>
              {permissionGranted === false && (
                <Text style={{ fontSize: 12, color: M.error, textAlign: "center" }}>Microphone permission required</Text>
              )}
            </View>
          )}

          {/* Phase 2: Recording */}
          {sessionPhase === "record" && (
            <View style={{ width: "100%", alignItems: "center", gap: 20 }}>
              <WaveformDots active={true} />
              <Text style={{ fontSize: 14, color: M.sub }}>Recording… say the word!</Text>
              <Pressable
                onPress={stopRecording}
                style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: M.error }}
                className="active:opacity-80"
              >
                <View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: M.parchment }} />
              </Pressable>
              <Text style={{ fontSize: 12, color: M.muted }}>Tap to stop</Text>
            </View>
          )}

          {/* Phase 3: Compare */}
          {sessionPhase === "compare" && (
            <View style={{ width: "100%", gap: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.text, textAlign: "center", marginBottom: 4 }}>Compare playback</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={playNative}
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13, backgroundColor: `${M.accent}15`, borderWidth: 1.5, borderColor: M.accent }}
                  className="active:opacity-70"
                >
                  <IconSymbol name="speaker.wave.2.fill" size={16} color={M.accent} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: M.accent }}>Native</Text>
                </Pressable>
                <Pressable
                  onPress={playUserRecording}
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13, backgroundColor: M.errorBg, borderWidth: 1.5, borderColor: M.errorBorder }}
                  className="active:opacity-70"
                >
                  <IconSymbol name="waveform" size={16} color={M.error} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: M.error }}>Mine</Text>
                </Pressable>
              </View>
              <Text style={{ fontSize: 13, color: M.muted, textAlign: "center", marginTop: 8 }}>How did you do?</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => handleResult("not-quite")}
                  style={{ flex: 1, borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: M.border, alignItems: "center" }}
                  className="active:opacity-70"
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: M.muted }}>Not quite</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleResult("got-it")}
                  style={{ flex: 1, borderRadius: 12, paddingVertical: 14, backgroundColor: M.success, alignItems: "center" }}
                  className="active:opacity-80"
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: M.ink }}>Got it!</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
