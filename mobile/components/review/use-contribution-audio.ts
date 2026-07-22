import { Audio } from "expo-av";
import { useRef, useState } from "react";

/**
 * Shared play/pause state for a single contribution audio clip.
 *
 * `unloadOnFinish` mirrors the two call sites that existed before this hook:
 * the word card unloads the sound when playback completes, the lesson card
 * only drops its reference.
 */
export function useContributionAudio(
  uri: string | null | undefined,
  { unloadOnFinish = false }: { unloadOnFinish?: boolean } = {},
) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = async () => {
    if (!uri) return;
    try {
      if (isPlaying) {
        await soundRef.current?.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!soundRef.current) {
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
          sound.setOnPlaybackStatusUpdate((s) => {
            if (s.isLoaded && s.didJustFinish) {
              setIsPlaying(false);
              if (unloadOnFinish) sound.unloadAsync();
              soundRef.current = null;
            }
          });
          soundRef.current = sound;
        } else {
          await soundRef.current.playAsync();
        }
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  return { isPlaying, togglePlay };
}
