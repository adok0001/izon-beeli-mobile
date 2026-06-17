import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { UiLanguage } from "@/store/ui-language-store";
import type { LocalizedText } from "@/types";
import { Text, TextInput, View } from "react-native";

export const GLOSS_LANGUAGES: { key: UiLanguage; label: string; placeholder: string }[] = [
  { key: "en", label: "EN", placeholder: "English" },
  { key: "fr", label: "FR", placeholder: "Français" },
  { key: "pcm", label: "PCM", placeholder: "Naija" },
  { key: "ar", label: "AR", placeholder: "العربية" },
  { key: "pt", label: "PT", placeholder: "Português" },
];

interface Props {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
  required?: boolean;
}

/** One labeled TextInput per gloss language, replacing hardcoded "(French)" sibling fields. */
export function LocalizedTextInput({ label, value, onChange, multiline, required }: Props) {
  const M = useMuseumTheme();

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 6 }}>
        {label}{required ? " *" : ""}
      </Text>
      {GLOSS_LANGUAGES.map(({ key, label: langLabel, placeholder }) => (
        <View key={key} style={{ flexDirection: "row", alignItems: multiline ? "flex-start" : "center", marginBottom: 6, gap: 8 }}>
          <View
            style={{
              width: 32,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: value[key] ? `${M.accent}20` : M.card,
              borderWidth: 1,
              borderColor: value[key] ? M.accentBorder : M.border,
              marginTop: multiline ? 8 : 0,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "800", color: value[key] ? M.accent : M.muted }}>
              {langLabel}
            </Text>
          </View>
          <TextInput
            value={value[key] ?? ""}
            onChangeText={(text) => onChange({ ...value, [key]: text })}
            placeholder={placeholder}
            placeholderTextColor={M.muted}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: M.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 9,
              color: M.text,
              backgroundColor: M.card,
              fontSize: 14,
              ...(multiline ? { textAlignVertical: "top", minHeight: 66 } : {}),
            }}
          />
        </View>
      ))}
    </View>
  );
}

/** Convert a plain string + optional frString into LocalizedText for initialising form state. */
export function toLocalizedText(
  en: string | LocalizedText | null | undefined,
  fr?: string | null,
): LocalizedText {
  if (en && typeof en === "object") return en;
  const result: LocalizedText = {};
  if (en) result.en = en as string;
  if (fr) result.fr = fr;
  return result;
}
