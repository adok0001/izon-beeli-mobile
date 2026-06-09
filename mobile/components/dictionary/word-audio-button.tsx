import { useState } from "react";
import { Pressable } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useWordAudio } from "@/lib/hooks/use-word-audio";
import type { AudioSource } from "@/types";

interface Props {
  /** Recorded audio — played when present; TTS used otherwise. */
  audioSource?: AudioSource;
  /** Spoken word for TTS fallback when no audioSource is provided. */
  word?: string;
  size?: number;
}

export function WordAudioButton({ audioSource, word, size = 20 }: Props) {
  const M = useMuseumTheme();
  const { play } = useWordAudio();
  const [playing, setPlaying] = useState(false);

  const handlePress = async () => {
    setPlaying(true);
    await play(audioSource, word);
    setTimeout(() => setPlaying(false), 1500);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8} className="p-1">
      <IconSymbol
        name={playing ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
        size={size}
        color={playing ? getAccent("blue").solid : audioSource ? M.sub : M.border}
      />
    </Pressable>
  );
}
