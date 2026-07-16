import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, SectionList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type PickerItem = Readonly<{
  id: string;
  label: string;
  sublabel?: string;
  /** Optional group heading; items sharing a section are listed together. */
  section?: string;
  /** Muted note shown on the right, e.g. "already in Ch. 2". Non-blocking. */
  annotation?: string;
}>;

/**
 * A generic searchable picker sheet for Studio editors — the reusable shape of
 * `LanguagePickerModal`, over any `{id, label, section, annotation}` list.
 *
 * Used to link a quiz question to a lesson/scene, move a lesson between scenes,
 * or pick any entity from a large set. The `annotation` (e.g. "already used")
 * only *warns* — selecting an annotated item is allowed; blocking is the
 * caller's choice, not this modal's.
 */
export function EntityPickerModal({
  visible,
  title,
  items,
  selectedId,
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
  onSelect,
  onClose,
}: Readonly<{
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedId?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}>) {
  const M = useMuseumTheme();
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? items.filter(
          (it) =>
            it.label.toLowerCase().includes(query) ||
            it.sublabel?.toLowerCase().includes(query) ||
            it.section?.toLowerCase().includes(query),
        )
      : items;
    const groups = new Map<string, PickerItem[]>();
    for (const it of filtered) {
      const key = it.section ?? "";
      const bucket = groups.get(key);
      if (bucket) bucket.push(it);
      else groups.set(key, [it]);
    }
    return Array.from(groups, ([sectionTitle, data]) => ({ title: sectionTitle, data }));
  }, [items, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>{title}</Text>
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
                placeholder={searchPlaceholder}
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

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            keyboardShouldPersistTaps="handled"
            renderSectionHeader={({ section }) =>
              section.title ? (
                <View style={{ backgroundColor: M.card, paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: M.border }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
                    {section.title}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => onSelect(item.id)}
                  style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: isSelected ? M.accentGlow : "transparent" }}
                  className="active:opacity-70"
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: isSelected ? "600" : "400", color: isSelected ? M.accent : M.text }}>
                      {item.label}
                    </Text>
                    {item.sublabel ? (
                      <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>{item.sublabel}</Text>
                    ) : null}
                  </View>
                  {item.annotation ? (
                    <Text style={{ marginLeft: 8, fontSize: 11, color: M.muted }}>{item.annotation}</Text>
                  ) : null}
                  {isSelected && <IconSymbol name="checkmark.circle.fill" size={22} color={M.accent} />}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <IconSymbol name="magnifyingglass" size={32} color={M.border} />
                <Text style={{ marginTop: 12, fontSize: 13, color: M.muted }}>{emptyLabel}</Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
