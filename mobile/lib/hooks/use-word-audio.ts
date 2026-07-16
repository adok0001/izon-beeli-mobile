import { useCallback, useRef, useState } from "react";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import type { AudioSource } from "@/types";

export function useWordAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);
  // Whether a pronunciation is currently sounding — recorded clip or TTS — so
  // callers can show an active state on their play button.
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(
    async (source: AudioSource | undefined, word?: string) => {
      try {
        if (source) {
          // Play recorded audio
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
          const src =
            typeof source === "string" ? { uri: source } : source;
          const { sound } = await Audio.Sound.createAsync(src as any, { shouldPlay: true });
          soundRef.current = sound;
          setIsPlaying(true);
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
              sound.unloadAsync();
              soundRef.current = null;
            }
          });
        } else if (word) {
          // TTS fallback — speak the word at a slightly slower rate
          setIsPlaying(true);
          Speech.speak(word, {
            rate: 0.85,
            onDone: () => setIsPlaying(false),
            onStopped: () => setIsPlaying(false),
            onError: () => setIsPlaying(false),
          });
        }
      } catch {
        // Silently fail if audio can't play
        setIsPlaying(false);
      }
    },
    []
  );

  const stop = useCallback(async () => {
    Speech.stop();
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return { play, stop, isPlaying };
}
