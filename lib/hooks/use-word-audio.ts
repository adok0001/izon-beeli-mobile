import { useCallback, useRef } from "react";
import { Audio } from "expo-av";
import type { AudioSource } from "@/types";

export function useWordAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);

  const play = useCallback(async (source: AudioSource) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const src =
        typeof source === "string" ? { uri: source } : source;
      const { sound } = await Audio.Sound.createAsync(src as any);
      soundRef.current = sound;
      await sound.playAsync();

      // Auto-cleanup when finished
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      // Silently fail if audio can't play
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  return { play, stop };
}
