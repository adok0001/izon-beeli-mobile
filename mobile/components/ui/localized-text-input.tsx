import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { UiLanguage } from "@/store/ui-language-store";
import type { LocalizedText } from "@/types";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export const GLOSS_LANGUAGES: {
  key: UiLanguage;
  label: string;
  placeholder: string;
  name: string;
}[] = [
  { key: "en", label: "EN", placeholder: "English", name: "English" },
  { key: "fr", label: "FR", placeholder: "Français", name: "Français" },
  { key: "pcm", label: "PCM", placeholder: "Naija", name: "Naijá (Pidgin)" },
  { key: "ar", label: "AR", placeholder: "العربية", name: "العربية" },
  { key: "pt", label: "PT", placeholder: "Português", name: "Português" },
];

type Gloss = (typeof GLOSS_LANGUAGES)[number];

/** The base gloss that always stays visible — every entry is anchored to English. */
const ANCHOR_KEY: UiLanguage = "en";

/** Show an inline search box in the picker once the language list gets long. */
const SEARCH_THRESHOLD = 8;

interface Props {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
  required?: boolean;
}

/**
 * Localized gloss editor with progressive disclosure. Renders the anchor
 * language plus any already-translated languages, and hides the rest behind an
 * "Add translation" picker so the field scales to many languages without
 * stacking dozens of inputs at once.
 */
export function LocalizedTextInput({ label, value, onChange, multiline, required }: Props) {
  const M = useMuseumTheme();
  const [added, setAdded] = useState<UiLanguage[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const visible = useMemo(() => {
    const shown = new Set<UiLanguage>([ANCHOR_KEY, ...added]);
    GLOSS_LANGUAGES.forEach((l) => {
      if (value[l.key]?.trim()) shown.add(l.key);
    });
    return GLOSS_LANGUAGES.filter((l) => shown.has(l.key));
  }, [value, added]);

  const remaining = GLOSS_LANGUAGES.filter((l) => !visible.includes(l));
  const filledCount = GLOSS_LANGUAGES.filter((l) => value[l.key]?.trim()).length;

  const addLang = (key: UiLanguage) => {
    setAdded((a) => (a.includes(key) ? a : [...a, key]));
    if (remaining.length <= 1) setPickerOpen(false);
  };

  const removeLang = (key: UiLanguage) => {
    setAdded((a) => a.filter((k) => k !== key));
    if (value[key] !== undefined) {
      const next = { ...value };
      delete next[key];
      onChange(next);
    }
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted }}>
          {label}
          {required ? " *" : ""}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: "600", color: filledCount > 0 ? M.accent : M.muted }}>
          {filledCount}/{GLOSS_LANGUAGES.length}
        </Text>
      </View>

      {visible.map((lang) => (
        <LanguageRow
          key={lang.key}
          lang={lang}
          value={value[lang.key] ?? ""}
          onChange={(text) => onChange({ ...value, [lang.key]: text })}
          onRemove={lang.key === ANCHOR_KEY ? undefined : () => removeLang(lang.key)}
          multiline={multiline}
        />
      ))}

      {remaining.length > 0 && (
        <AddLanguagePicker
          remaining={remaining}
          open={pickerOpen}
          onToggle={() => setPickerOpen((o) => !o)}
          onPick={addLang}
        />
      )}
    </View>
  );
}

interface RowProps {
  lang: Gloss;
  value: string;
  onChange: (text: string) => void;
  onRemove?: () => void;
  multiline?: boolean;
}

function LanguageRow({ lang, value, onChange, onRemove, multiline }: RowProps) {
  const M = useMuseumTheme();
  const filled = !!value.trim();

  return (
    <View style={{ flexDirection: "row", alignItems: multiline ? "flex-start" : "center", marginBottom: 6, gap: 8 }}>
      <View
        style={{
          width: 32,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: filled ? `${M.accent}20` : M.card,
          borderWidth: 1,
          borderColor: filled ? M.accentBorder : M.border,
          marginTop: multiline ? 8 : 0,
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: "800", color: filled ? M.accent : M.muted }}>{lang.label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={lang.placeholder}
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
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8} style={{ marginTop: multiline ? 8 : 0 }}>
          <IconSymbol name="xmark.circle.fill" size={18} color={M.muted} />
        </Pressable>
      )}
    </View>
  );
}

interface PickerProps {
  remaining: Gloss[];
  open: boolean;
  onToggle: () => void;
  onPick: (key: UiLanguage) => void;
}

function AddLanguagePicker({ remaining, open, onToggle, onPick }: PickerProps) {
  const M = useMuseumTheme();
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = q
    ? remaining.filter((l) => l.name.toLowerCase().includes(q) || l.key.includes(q))
    : remaining;

  return (
    <View style={{ marginTop: 2 }}>
      <Pressable
        onPress={onToggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: M.accentBorder,
        }}
        className="active:opacity-70"
      >
        <IconSymbol name={open ? "chevron.up" : "plus"} size={12} color={M.accent} />
        <Text style={{ fontSize: 12, fontWeight: "600", color: M.accent }}>
          {open ? "Done" : `Add translation (${remaining.length})`}
        </Text>
      </Pressable>

      {open && (
        <View
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: M.border,
            backgroundColor: M.card,
          }}
        >
          {GLOSS_LANGUAGES.length >= SEARCH_THRESHOLD && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                paddingHorizontal: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: M.border,
                backgroundColor: M.bg,
              }}
            >
              <IconSymbol name="magnifyingglass" size={14} color={M.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search languages"
                placeholderTextColor={M.muted}
                autoCorrect={false}
                autoCapitalize="none"
                style={{ flex: 1, paddingVertical: 9, fontSize: 13, color: M.text }}
              />
            </View>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {filtered.map((l) => (
              <Pressable
                key={l.key}
                onPress={() => onPick(l.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 7,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: M.border,
                  backgroundColor: M.bg,
                }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 9, fontWeight: "800", color: M.muted }}>{l.label}</Text>
                <Text style={{ fontSize: 12, color: M.text }}>{l.name}</Text>
              </Pressable>
            ))}
            {filtered.length === 0 && (
              <Text style={{ fontSize: 12, color: M.muted, paddingVertical: 4 }}>No languages found</Text>
            )}
          </View>
        </View>
      )}
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
