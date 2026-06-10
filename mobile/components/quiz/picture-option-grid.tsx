import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Image, Pressable, Text, View } from "react-native";
import type { OptionState } from "./option-card";

interface PictureOptionGridProps {
  options: string[];
  optionImages: Record<string, string>;
  state: Record<string, OptionState>;
  onPress: (option: string) => void;
}

export function PictureOptionGrid({ options, optionImages, state, onPress }: PictureOptionGridProps) {
  const M = useMuseumTheme();

  const borderColor = (s: OptionState) => ({
    default: M.border,
    correct: M.success,
    incorrect: M.error,
    dimmed: M.border,
  }[s]);

  const bgColor = (s: OptionState) => ({
    default: M.card,
    correct: M.successBg,
    incorrect: M.errorBg,
    dimmed: M.card,
  }[s]);

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
      {options.map((option) => {
        const s = state[option] ?? "default";
        const imgUrl = optionImages[option];
        return (
          <Pressable
            key={option}
            onPress={() => onPress(option)}
            disabled={s !== "default"}
            style={{
              width: "47%",
              borderRadius: 14,
              borderWidth: 2,
              borderColor: borderColor(s),
              backgroundColor: bgColor(s),
              overflow: "hidden",
              opacity: s === "dimmed" ? 0.5 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={option}
          >
            {imgUrl ? (
              <Image
                source={{ uri: imgUrl }}
                style={{ width: "100%", aspectRatio: 1 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: "100%", aspectRatio: 1, alignItems: "center", justifyContent: "center", backgroundColor: M.card }}>
                <Text style={{ fontSize: 32 }}>🖼️</Text>
              </View>
            )}
            <View style={{ padding: 8 }}>
              <Text style={{
                fontSize: 13, fontWeight: "600", textAlign: "center",
                color: s === "correct" ? M.success : s === "incorrect" ? M.error : M.text,
              }}>
                {option}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
