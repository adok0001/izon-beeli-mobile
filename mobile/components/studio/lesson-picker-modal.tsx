import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type LessonOption = { id: string; title: string };

/**
 * Searchable lesson picker — mirrors `LanguagePickerModal` (search + tap-to-
 * select list) for a season chapter's lesson. Annotates a lesson already used by
 * another chapter and warns on reuse, but never blocks it (a lesson can legitimately
 * recur across a season).
 */
export function LessonPickerModal({
  visible,
  selectedId,
  lessons,
  annotationFor,
  onSelect,
  onClose,
}: Readonly<{
  visible: boolean;
  selectedId: string;
  lessons: LessonOption[];
  /** e.g. "Already in Ch. 2" for a lesson used by another chapter, else undefined. */
  annotationFor: (lessonId: string) => string | undefined;
  onSelect: (id: string) => void;
  onClose: () => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? lessons.filter((l) => l.title.toLowerCase().includes(q)) : lessons;
  }, [search, lessons]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>
              {t("educator.story.lessonPickerTitle", { defaultValue: "Choose lesson" })}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
              <IconSymbol name="xmark" size={20} color={M.sub} />
            </Pressable>
          </View>

          <View style={{ borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: M.border }}>
              <IconSymbol name="magnifyingglass" size={18} color={M.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("educator.story.lessonPickerSearch", { defaultValue: "Search lessons" })}
                placeholderTextColor={M.muted}
                autoCorrect={false}
                style={{ marginLeft: 8, flex: 1, fontSize: 15, color: M.text }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <IconSymbol name="xmark" size={16} color={M.muted} />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              const annotation = annotationFor(item.id);
              return (
                <Pressable
                  onPress={() => onSelect(item.id)}
                  style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: isSelected ? M.accentGlow : "transparent" }}
                  className="active:opacity-70"
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: isSelected ? "600" : "400", color: isSelected ? M.accent : M.text }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {annotation ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <IconSymbol name="exclamationmark.triangle.fill" size={11} color={M.warning} />
                        <Text style={{ fontSize: 12, color: M.warning }}>{annotation}</Text>
                      </View>
                    ) : null}
                  </View>
                  {isSelected && <IconSymbol name="checkmark.circle.fill" size={22} color={M.accent} />}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <IconSymbol name="magnifyingglass" size={32} color={M.border} />
                <Text style={{ marginTop: 12, fontSize: 13, color: M.muted }}>
                  {t("educator.story.lessonPickerNoResults", { defaultValue: "No lessons match your search." })}
                </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
