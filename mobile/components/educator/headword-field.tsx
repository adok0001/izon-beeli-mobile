import { LocalizedTextInput } from "@/components/ui/localized-text-input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  EducatorDictionaryEntry,
  useEducatorDictionary,
} from "@/lib/hooks/use-educator-panel";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { LocalizedText } from "@/types";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface HeadwordValue {
  word: string;
  gloss: LocalizedText;
  audioUrl: string;
}

export interface HeadwordLabels {
  word: string;
  gloss: string;
  audio: string;
  pick: string;
  search: string;
  noEntries: string;
  createHint: string;
}

interface Props {
  value: HeadwordValue;
  languageId: string;
  labels: HeadwordLabels;
  onChange: (patch: Partial<HeadwordValue>) => void;
}

/** Derive an editable gloss map from a dictionary entry, preferring the full
 *  translations map and falling back to the flat english/french projection. */
function glossFromEntry(entry: EducatorDictionaryEntry): LocalizedText {
  const map = entry.translations ?? undefined;
  if (map && Object.values(map).some((v) => v?.trim())) return { ...map };
  const out: LocalizedText = {};
  if (entry.english) out.en = entry.english;
  if (entry.french) out.fr = entry.french;
  return out;
}

const inputStyle = {
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 10,
  fontSize: 14,
} as const;

/** Headword editor: type a new word freely, or pick an existing dictionary
 *  entry to auto-fill the word, gloss, and audio in one tap. */
export function HeadwordField({ value, languageId, labels, onChange }: Props) {
  const M = useMuseumTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  const choose = (entry: EducatorDictionaryEntry) => {
    onChange({
      word: entry.word,
      gloss: glossFromEntry(entry),
      audioUrl: entry.audioUrl ?? "",
    });
    setPickerOpen(false);
  };

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TextInput
          value={value.word}
          onChangeText={(word) => onChange({ word })}
          placeholder={labels.word}
          placeholderTextColor={M.muted}
          style={{ ...inputStyle, flex: 1, color: M.text, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}
        />
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 11,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: M.accentBorder,
            backgroundColor: M.accentGlow,
          }}
          className="active:opacity-70"
        >
          <IconSymbol name="book.fill" size={14} color={M.accent} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: M.accent }}>{labels.pick}</Text>
        </Pressable>
      </View>
      <Text style={{ fontSize: 11, color: M.muted, marginTop: 5 }}>{labels.createHint}</Text>

      <View style={{ marginTop: 10 }}>
        <LocalizedTextInput
          label={labels.gloss}
          value={value.gloss}
          onChange={(gloss) => onChange({ gloss })}
        />
      </View>
      <TextInput
        value={value.audioUrl}
        onChangeText={(audioUrl) => onChange({ audioUrl })}
        placeholder={labels.audio}
        placeholderTextColor={M.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ ...inputStyle, color: M.text, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}
      />

      <DictionaryPickerModal
        visible={pickerOpen}
        languageId={languageId}
        labels={labels}
        onClose={() => setPickerOpen(false)}
        onChoose={choose}
      />
    </View>
  );
}

interface ModalProps {
  visible: boolean;
  languageId: string;
  labels: HeadwordLabels;
  onClose: () => void;
  onChoose: (entry: EducatorDictionaryEntry) => void;
}

function DictionaryPickerModal({ visible, languageId, labels, onClose, onChoose }: ModalProps) {
  const M = useMuseumTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { data: entries = [], isLoading } = useEducatorDictionary(languageId, undefined, visible);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? entries.filter(
            (e) => e.word.toLowerCase().includes(q) || e.english.toLowerCase().includes(q),
          )
        : entries,
    [entries, q],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: M.bg, paddingTop: insets.top }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 12 }}>
            <IconSymbol name="magnifyingglass" size={15} color={M.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={labels.search}
              placeholderTextColor={M.muted}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: M.text }}
            />
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <IconSymbol name="xmark.circle.fill" size={24} color={M.muted} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator color={M.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <Text style={{ textAlign: "center", paddingTop: 40, fontSize: 13, color: M.muted }}>
            {labels.noEntries}
          </Text>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
            {filtered.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() => onChoose(entry)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 12, marginBottom: 8 }}
                className="active:opacity-70"
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{entry.word}</Text>
                  <Text style={{ marginTop: 1, fontSize: 12, color: M.sub }} numberOfLines={1}>
                    {localize(glossFromEntry(entry), "en") || entry.english}
                  </Text>
                </View>
                {entry.audioUrl ? <IconSymbol name="speaker.wave.2.fill" size={15} color={M.accent} /> : null}
                <IconSymbol name="chevron.right" size={16} color={M.muted} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
