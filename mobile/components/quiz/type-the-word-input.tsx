import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useCallback, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface TypeTheWordInputProps {
  correctAnswer: string;
  onSubmit: (answer: string) => void;
  locked: boolean;
}

export function TypeTheWordInput({ correctAnswer, onSubmit, locked }: TypeTheWordInputProps) {
  const M = useMuseumTheme();
  const [value, setValue] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || locked) return;
    onSubmit(value.trim());
  }, [value, locked, onSubmit]);

  const isCorrect = !locked ? null : value.trim().toLowerCase() === correctAnswer.toLowerCase();

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: locked
          ? isCorrect ? M.success : M.error
          : M.accent,
        backgroundColor: M.card,
        paddingHorizontal: 14,
        marginBottom: 12,
      }}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSubmit}
          editable={!locked}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, paddingVertical: 14, fontSize: 18, color: M.text, fontWeight: "600" }}
          placeholder="Type your answer…"
          placeholderTextColor={M.muted}
          returnKeyType="done"
        />
        {locked && (
          <IconSymbol
            name={isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"}
            size={22}
            color={isCorrect ? M.success : M.error}
          />
        )}
      </View>

      {!locked && (
        <Pressable
          onPress={handleSubmit}
          disabled={!value.trim()}
          style={{
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: value.trim() ? M.accent : M.card,
            borderWidth: value.trim() ? 0 : 1,
            borderColor: M.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: value.trim() ? M.ink : M.muted }}>
            Check
          </Text>
        </Pressable>
      )}

      {locked && !isCorrect && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <IconSymbol name="checkmark" size={12} color={M.success} />
          <Text style={{ fontSize: 13, color: M.success, fontWeight: "600" }}>{correctAnswer}</Text>
        </View>
      )}
    </View>
  );
}
