import { useMuseumTheme } from "@/lib/use-museum-theme";
import { TextInput } from "react-native";

/** The standard Studio search box — matches every list screen's filter bar. */
export function StudioSearchInput({
  value,
  onChangeText,
  placeholder,
}: Readonly<{ value: string; onChangeText: (v: string) => void; placeholder: string }>) {
  const M = useMuseumTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={M.inputPlaceholder}
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: M.inputBorder,
        backgroundColor: M.inputBg,
        color: M.inputText,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
      }}
    />
  );
}
