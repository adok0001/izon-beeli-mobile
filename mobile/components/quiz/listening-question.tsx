import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Audio } from "expo-av";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { AudioSource } from "@/types";

interface Props {
  audioSource: AudioSource;
  /** Seek to this position (seconds) before playing — for lesson segment clips */
  startTime?: number;
  /** Stop playback at this position (seconds) — for lesson segment clips */
  endTime?: number;
  /** Fallback text shown when no audio is available */
  fallbackText?: string;
}

export function ListeningQuestion({ audioSource, startTime, endTime, fallbackText }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const playAudio = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const source =
        typeof audioSource === "string" ? { uri: audioSource } : audioSource;
      const { sound } = await Audio.Sound.createAsync(source as any);
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (endTime !== undefined && status.positionMillis >= endTime * 1000) {
          sound.stopAsync();
          setIsPlaying(false);
          return;
        }
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      if (startTime !== undefined) {
        await sound.setPositionAsync(startTime * 1000);
      }

      setIsPlaying(true);
      await sound.playAsync();
    } catch {
      setIsPlaying(false);
    }
  }, [audioSource, startTime, endTime]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  if (!audioSource && fallbackText) {
    return (
      <View className="mb-4 items-center rounded-xl bg-blue-50 px-6 py-6 dark:bg-blue-900/30">
        <IconSymbol name="speaker.wave.2.fill" size={28} color="#3b82f6" />
        <Text className="mt-3 text-center text-lg font-semibold text-neutral-900 dark:text-white">
          Listen: {fallbackText}
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4 items-center">
      <Pressable
        onPress={playAudio}
        className={`h-20 w-20 items-center justify-center rounded-full ${
          isPlaying ? "bg-blue-600" : "bg-blue-500"
        } active:opacity-80`}
      >
        <IconSymbol
          name={isPlaying ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
          size={36}
          color="#ffffff"
        />
      </Pressable>
      <Text className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        {isPlaying ? "Playing..." : "Tap to listen"}
      </Text>
    </View>
  );
}
