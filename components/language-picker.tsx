import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  SectionList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import type { Language } from "@/types";

interface Section {
  title: string;
  data: Language[];
}

function groupByRegion(languages: Language[]): Section[] {
  const map = new Map<string, Language[]>();
  for (const lang of languages) {
    const existing = map.get(lang.region) ?? [];
    existing.push(lang);
    map.set(lang.region, existing);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export function LanguagePickerButton() {
  const [visible, setVisible] = useState(false);
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const selectedName = getLanguageName(selectedLanguageId);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="flex-row items-center rounded-full bg-blue-50 px-3.5 py-2 active:opacity-70 dark:bg-blue-950"
      >
        <IconSymbol name="book.fill" size={16} color="#3b82f6" />
        <Text className="ml-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
          {selectedName}
        </Text>
        <IconSymbol name="chevron.right" size={14} color="#3b82f6" style={{ marginLeft: 2 }} />
      </Pressable>

      <LanguagePickerModal
        visible={visible}
        selectedId={selectedLanguageId}
        onSelect={(id) => {
          setLanguage(id);
          setVisible(false);
        }}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

function LanguagePickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? LANGUAGES.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.nativeName.toLowerCase().includes(query) ||
            l.region.toLowerCase().includes(query)
        )
      : LANGUAGES;
    return groupByRegion(filtered);
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white">
            Choose Language
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <IconSymbol name="xmark" size={20} color="#6b7280" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <View className="flex-row items-center rounded-xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <IconSymbol name="magnifyingglass" size={18} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search languages..."
              placeholderTextColor="#9ca3af"
              autoCorrect={false}
              className="ml-2 flex-1 text-base text-neutral-900 dark:text-white"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <IconSymbol name="xmark" size={16} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Language list */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }) => (
            <View className="bg-neutral-50 px-5 py-2 dark:bg-neutral-800/80">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            return (
              <Pressable
                onPress={() => onSelect(item.id)}
                className={`flex-row items-center border-b border-neutral-100 px-5 py-3.5 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800 ${
                  isSelected ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <View className="flex-1">
                  <Text
                    className={`text-base ${
                      isSelected
                        ? "font-semibold text-blue-600 dark:text-blue-400"
                        : "text-neutral-900 dark:text-white"
                    }`}
                  >
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                    {item.nativeName}
                  </Text>
                </View>
                {isSelected && (
                  <IconSymbol name="checkmark.circle.fill" size={22} color="#3b82f6" />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <IconSymbol name="magnifyingglass" size={32} color="#d1d5db" />
              <Text className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
                No languages found for &ldquo;{search}&rdquo;
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
