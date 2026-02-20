import { useState } from "react";
import { Pressable } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWordAudio } from "@/lib/hooks/use-word-audio";
import type { AudioSource } from "@/types";

interface Props {
  audioSource: AudioSource;
  size?: number;
}

export function WordAudioButton({ audioSource, size = 20 }: Props) {
  const { play } = useWordAudio();
  const [playing, setPlaying] = useState(false);

  const handlePress = async () => {
    setPlaying(true);
    await play(audioSource);
    // Reset after a short delay (audio is typically short)
    setTimeout(() => setPlaying(false), 1500);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8} className="p-1">
      <IconSymbol
        name={playing ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
        size={size}
        color={playing ? "#3b82f6" : "#9ca3af"}
      />
    </Pressable>
  );
}
