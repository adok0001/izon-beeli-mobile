import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable } from "react-native";

/**
 * The gold circular "hear this word" button shared by the word-lookup surfaces
 * (the modal sheet and the inline popover). Fills with accent and swaps to the
 * wave-3 glyph while its pronunciation is sounding, so playback is visible.
 */
export function WordPronounceButton({
  onPress,
  isPlaying,
  size = 40,
}: {
  onPress: () => void;
  isPlaying: boolean;
  size?: number;
}) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isPlaying ? M.accent : M.accentGlow,
        borderWidth: 1,
        borderColor: isPlaying ? M.accent : M.accentBorder,
      }}
      accessibilityRole="button"
      accessibilityLabel="Play pronunciation"
      accessibilityState={{ busy: isPlaying }}
    >
      <IconSymbol
        name={isPlaying ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
        size={Math.round(size * 0.4)}
        color={isPlaying ? M.ink : M.accent}
      />
    </Pressable>
  );
}
