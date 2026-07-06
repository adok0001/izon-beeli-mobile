import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";

/**
 * Shared input/button primitives for the Studio Mobile editors (proverbs,
 * scenarios, quiz bank, etymology). Keeping one implementation ensures every
 * editor's inputs, buttons, and "New" affordance look and behave the same.
 */

type M = ReturnType<typeof useMuseumTheme>;

export function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
}>) {
  const M = useMuseumTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={M.inputPlaceholder}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          borderRadius: 10,
          borderWidth: 1,
          borderColor: M.inputBorder,
          backgroundColor: M.inputBg,
          color: M.inputText,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? "top" : undefined,
        }}
      />
    </View>
  );
}

export function PrimaryButton({ label, onPress, M, disabled }: Readonly<{ label: string; onPress: () => void; M: M; disabled?: boolean }>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: M.accent, opacity: disabled ? 0.5 : 1 }}
      className="active:opacity-80"
    >
      <Text style={{ fontWeight: "800", color: M.ink, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, M }: Readonly<{ label: string; onPress: () => void; M: M }>) {
  return (
    <Pressable
      onPress={onPress}
      style={{ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: M.bg, borderWidth: 1, borderColor: M.border }}
      className="active:opacity-70"
    >
      <Text style={{ fontWeight: "700", color: M.sub, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function SmallButton({
  label,
  onPress,
  tone,
  M,
}: Readonly<{ label: string; onPress: () => void; tone?: "publish" | "danger"; M: M }>) {
  const color = tone === "publish" ? M.success : tone === "danger" ? M.error : M.sub;
  return (
    <Pressable
      onPress={onPress}
      style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}
      className="active:opacity-70"
    >
      <Text style={{ fontWeight: "700", color, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

export function NewButton({ label, onPress, M }: Readonly<{ label: string; onPress: () => void; M: M }>) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: M.accent,
        marginBottom: 20,
      }}
      className="active:opacity-80"
    >
      <IconSymbol name="plus.circle" size={16} color={M.ink} />
      <Text style={{ fontWeight: "800", color: M.ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
