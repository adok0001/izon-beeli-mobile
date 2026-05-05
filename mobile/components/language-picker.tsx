import { IconSymbol } from "@/components/ui/icon-symbol";
import { ACTIVE_LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import type { Language } from "@/types";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    SectionList,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Section {
  title: string;
  data: Language[];
}

const REGION_KEY_MAP: Record<string, string> = {
  "Niger Delta": "regions.nigerDelta",
  "Southwest": "regions.southwest",
  "Southeast": "regions.southeast",
  "North Central": "regions.northCentral",
  "North": "regions.north",
  "West Africa": "regions.westAfrica",
  "East Africa": "regions.eastAfrica",
  "North Africa": "regions.northAfrica",
  "Southern Africa": "regions.southernAfrica",
};

function groupByRegion(languages: Language[]): Section[] {
  const map = new Map<string, Language[]>();
  for (const lang of languages) {
    const existing = map.get(lang.region) ?? [];
    existing.push(lang);
    map.set(lang.region, existing);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

// ─── LanguagePickerButton (used on Listen tab and elsewhere) ─────────────────

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
          setLanguage(id); // auto-enrolls
          setVisible(false);
        }}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

// ─── EnrolledLanguageBar (used on Learn tab) ─────────────────────────────────

export function EnrolledLanguageBar() {
  const { t } = useTranslation();
  const { selectedLanguageId, enrolledLanguageIds, enrollLanguage, unenrollLanguage } =
    useLanguageStore();
  const [addVisible, setAddVisible] = useState(false);

  const handleUnenroll = (id: string) => {
    if (enrolledLanguageIds.length === 1) return; // keep at least one
    Alert.alert(
      t("languagePicker.removeTitle"),
      t("languagePicker.removeDesc", { name: getLanguageName(id) }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("languagePicker.remove"), style: "destructive", onPress: () => unenrollLanguage(id) },
      ]
    );
  };

  return (
    <View className="border-b border-neutral-100 dark:border-neutral-800">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {enrolledLanguageIds.map((id) => {
          const isActive = id === selectedLanguageId;
          return (
            <Pressable
              key={id}
              onPress={() => enrollLanguage(id)}
              onLongPress={() => handleUnenroll(id)}
              className={`flex-row items-center rounded-full px-3.5 py-1.5 ${
                isActive
                  ? "bg-blue-500"
                  : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? "text-white" : "text-neutral-600 dark:text-neutral-300"
                }`}
              >
                {getLanguageName(id)}
              </Text>
            </Pressable>
          );
        })}

        {/* Add button */}
        <Pressable
          onPress={() => setAddVisible(true)}
          className="flex-row items-center rounded-full border border-dashed border-neutral-300 px-3.5 py-1.5 dark:border-neutral-600"
        >
          <IconSymbol name="plus" size={14} color="#9ca3af" />
          <Text className="ml-1 text-sm font-medium text-neutral-400 dark:text-neutral-500">
            {t("languagePicker.addLanguage")}
          </Text>
        </Pressable>
      </ScrollView>

      <AddLanguageModal
        visible={addVisible}
        enrolledIds={enrolledLanguageIds}
        onAdd={(id) => {
          enrollLanguage(id);
          setAddVisible(false);
        }}
        onClose={() => setAddVisible(false)}
      />
    </View>
  );
}

// ─── AddLanguageModal (shows only unenrolled languages) ──────────────────────

function AddLanguageModal({
  visible,
  enrolledIds,
  onAdd,
  onClose,
}: {
  visible: boolean;
  enrolledIds: string[];
  onAdd: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const unenrolled = ACTIVE_LANGUAGES.filter((l) => !enrolledIds.includes(l.id));
    const filtered = query
      ? unenrolled.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.nativeName.toLowerCase().includes(query) ||
            l.region.toLowerCase().includes(query)
        )
      : unenrolled;
    return groupByRegion(filtered);
  }, [search, enrolledIds]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white">
            {t("languagePicker.addLanguage")}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <IconSymbol name="xmark" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <View className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <View className="flex-row items-center rounded-xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <IconSymbol name="magnifyingglass" size={18} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("languagePicker.searchPlaceholder")}
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

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }) => (
            <View className="bg-neutral-50 px-5 py-2 dark:bg-neutral-800/80">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {REGION_KEY_MAP[section.title]
                  ? t(REGION_KEY_MAP[section.title] as any)
                  : section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onAdd(item.id)}
              className="flex-row items-center border-b border-neutral-100 px-5 py-3.5 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800"
            >
              <View className="flex-1">
                <Text className="text-base text-neutral-900 dark:text-white">{item.name}</Text>
                <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {item.nativeName}
                </Text>
              </View>
              <IconSymbol name="plus.circle" size={22} color="#3b82f6" />
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <IconSymbol name="checkmark.circle.fill" size={32} color="#22c55e" />
              <Text className="mt-3 text-center text-sm text-neutral-400 dark:text-neutral-500">
                {search ? t("languagePicker.noResults", { query: search }) : t("languagePicker.allEnrolled")}
              </Text>
            </View>
          }
          ListFooterComponent={
            search.trim().length > 0 ? (
              <Pressable
                onPress={() => { onAdd(search.trim()); }}
                className="flex-row items-center border-t-2 border-dashed border-violet-200 px-5 py-4 active:opacity-70 dark:border-violet-800"
              >
                <View className="mr-4 h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
                  <IconSymbol name="plus.circle" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base text-violet-700 dark:text-violet-300">
                    {t("languagePicker.useCustomLanguage", { name: search.trim() })}
                  </Text>
                </View>
              </Pressable>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

// ─── LanguagePickerModal (kept for LanguagePickerButton) ─────────────────────

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
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? ACTIVE_LANGUAGES.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.nativeName.toLowerCase().includes(query) ||
            l.region.toLowerCase().includes(query)
        )
      : ACTIVE_LANGUAGES;
    return groupByRegion(filtered);
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white">
            {t("languagePicker.title")}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <IconSymbol name="xmark" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <View className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <View className="flex-row items-center rounded-xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <IconSymbol name="magnifyingglass" size={18} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("languagePicker.searchPlaceholder")}
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

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }) => (
            <View className="bg-neutral-50 px-5 py-2 dark:bg-neutral-800/80">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {REGION_KEY_MAP[section.title]
                  ? t(REGION_KEY_MAP[section.title] as any)
                  : section.title}
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
                {t("languagePicker.noResults", { query: search })}
              </Text>
            </View>
          }
          ListFooterComponent={
            search.trim().length > 0 ? (
              <Pressable
                onPress={() => { onSelect(search.trim()); }}
                className={`flex-row items-center border-t-2 border-dashed px-5 py-4 active:opacity-70 ${
                  selectedId === search.trim()
                    ? "border-violet-400 bg-violet-50 dark:bg-violet-950"
                    : "border-violet-200 dark:border-violet-800"
                }`}
              >
                <View className="mr-4 h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
                  <IconSymbol name="plus.circle" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className={`text-base ${
                    selectedId === search.trim()
                      ? "font-semibold text-violet-700 dark:text-violet-300"
                      : "text-violet-700 dark:text-violet-300"
                  }`}>
                    {t("languagePicker.useCustomLanguage", { name: search.trim() })}
                  </Text>
                </View>
                {selectedId === search.trim() && (
                  <IconSymbol name="checkmark.circle.fill" size={22} color="#8b5cf6" />
                )}
              </Pressable>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
