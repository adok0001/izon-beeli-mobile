import { useCallback, useRef } from "react";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import type { AudioSource } from "@/types";

export function useWordAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);

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
          const { sound } = await Audio.Sound.createAsync(src as any);
          soundRef.current = sound;
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
              soundRef.current = null;
            }
          });
        } else if (word) {
          // TTS fallback — speak the word at a slightly slower rate
          Speech.speak(word, { rate: 0.85 });
        }
      } catch {
        // Silently fail if audio can't play
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
  }, []);

  return { play, stop };
}
