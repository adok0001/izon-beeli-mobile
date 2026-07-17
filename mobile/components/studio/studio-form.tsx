import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, TextInput, View } from "react-native";

/**
 * The standard Studio editor-form primitives: a labeled field wrapper, a
 * styled text input, and primary/ghost buttons. Every inline "New X / Edit X"
 * form (Content Partners, Daily Challenges, Bounties, ...) should compose
 * these instead of redefining its own Field/input/Button set.
 */
export function FormField({
  label,
  hint,
  required,
  children,
}: Readonly<{ label: string; hint?: string; required?: boolean; children: React.ReactNode }>) {
  const M = useMuseumTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>
        {label}
        {required ? " *" : ""}
        {hint ? <Text style={{ fontWeight: "400", color: M.muted }}> — {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export function FormInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
}: Readonly<{
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "number-pad" | "default";
  autoCapitalize?: "none" | "sentences";
}>) {
  const M = useMuseumTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={M.inputPlaceholder}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      style={{
        borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder,
        backgroundColor: M.inputBg, color: M.inputText,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
        minHeight: multiline ? 66 : undefined,
        textAlignVertical: multiline ? "top" : "center",
      }}
    />
  );
}

/** Field + input in one call, for the common single-line-labeled-text-input case. */
export function LabeledInput(
  props: Readonly<{
    label: string;
    hint?: string;
    required?: boolean;
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    keyboardType?: "number-pad" | "default";
  }>
) {
  return (
    <FormField label={props.label} hint={props.hint} required={props.required}>
      <FormInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.hint}
        multiline={props.multiline}
        keyboardType={props.keyboardType}
        autoCapitalize="none"
      />
    </FormField>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: Readonly<{ label: string; onPress: () => void; disabled?: boolean }>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11,
        backgroundColor: M.accent, opacity: disabled ? 0.5 : 1,
      }}
      className="active:opacity-80"
    >
      <Text style={{ fontWeight: "800", color: M.ink, fontSize: 14, textAlign: "center" }}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: Readonly<{ label: string; onPress: () => void }>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11,
        backgroundColor: M.bg, borderWidth: 1, borderColor: M.border,
      }}
      className="active:opacity-70"
    >
      <Text style={{ fontWeight: "700", color: M.sub, fontSize: 14, textAlign: "center" }}>{label}</Text>
    </Pressable>
  );
}
