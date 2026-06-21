import { IconSymbol } from "@/components/ui/icon-symbol";
import { ACTIVE_LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import type { Language } from "@/types";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
  const M = useMuseumTheme();
  const [visible, setVisible] = useState(false);
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const selectedName = getLanguageName(selectedLanguageId);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={{ flexDirection: "row", alignItems: "center", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: M.accentBorder }}
        className="active:opacity-70"
      >
        <IconSymbol name="book.fill" size={16} color={M.accent} />
        <Text
          style={{ marginLeft: 6, fontSize: 13, fontWeight: "600", color: M.accent, flexShrink: 1 }}
          numberOfLines={1}
        >
          {selectedName}
        </Text>
        <IconSymbol name="chevron.right" size={14} color={M.accent} style={{ marginLeft: 2 }} />
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

// ─── EnrolledLanguageBar (used on Learn tab) ─────────────────────────────────

export function EnrolledLanguageBar() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { selectedLanguageId, enrolledLanguageIds, enrollLanguage, unenrollLanguage } =
    useLanguageStore();
  const [addVisible, setAddVisible] = useState(false);

  const handleUnenroll = (id: string) => {
    if (enrolledLanguageIds.length === 1) return;
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
    <View style={{ overflow: "hidden", paddingTop: 10 }}>
      {/* Section label — caps the selector so the two read as one unit */}
      <Text
        style={{
          paddingHorizontal: 16,
          marginBottom: 8,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: M.muted,
        }}
      >
        {t("learn.subtitle")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
      >
        {enrolledLanguageIds.map((id) => {
          const isActive = id === selectedLanguageId;
          return (
            <Pressable
              key={id}
              onPress={() => enrollLanguage(id)}
              onLongPress={() => handleUnenroll(id)}
              style={{
                flexDirection: "row", alignItems: "center", borderRadius: 999,
                paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1,
                backgroundColor: isActive ? M.accent : M.card,
                borderColor: isActive ? M.accent : M.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? M.ink : M.sub }}>
                {getLanguageName(id)}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setAddVisible(true)}
          style={{ flexDirection: "row", alignItems: "center", borderRadius: 999, borderWidth: 1, borderStyle: "dashed", borderColor: M.muted, paddingHorizontal: 14, paddingVertical: 6 }}
        >
          <IconSymbol name="plus" size={14} color={M.muted} />
          <Text style={{ marginLeft: 4, fontSize: 13, fontWeight: "500", color: M.muted }}>
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
}: Readonly<{
  visible: boolean;
  enrolledIds: string[];
  onAdd: (id: string) => void;
  onClose: () => void;
}>) {
  const M = useMuseumTheme();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>
              {t("languagePicker.addLanguage")}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <IconSymbol name="xmark" size={20} color={M.sub} />
            </Pressable>
          </View>

          <View style={{ borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: M.border }}>
              <IconSymbol name="magnifyingglass" size={18} color={M.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("languagePicker.searchPlaceholder")}
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
            renderSectionHeader={({ section }) => (
              <View style={{ backgroundColor: M.card, paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: M.border }}>
                <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
                  {REGION_KEY_MAP[section.title]
                    ? t(REGION_KEY_MAP[section.title] as any)
                    : section.title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onAdd(item.id)}
                style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 14 }}
                className="active:opacity-70"
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: M.text }}>{item.name}</Text>
                  <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>{item.nativeName}</Text>
                </View>
                <IconSymbol name="plus.circle" size={22} color={M.accent} />
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <IconSymbol name="checkmark.circle.fill" size={32} color={M.success} />
                <Text style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: M.muted }}>
                  {search ? t("languagePicker.noResults", { query: search }) : t("languagePicker.allEnrolled")}
                </Text>
              </View>
            }
            ListFooterComponent={
              search.trim().length > 0 ? (
                <Pressable
                  onPress={() => { onAdd(search.trim()); }}
                  style={{ flexDirection: "row", alignItems: "center", borderTopWidth: 2, borderStyle: "dashed", borderColor: M.accentBorder, paddingHorizontal: 20, paddingVertical: 16 }}
                  className="active:opacity-70"
                >
                  <View style={{ marginRight: 16, height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}>
                    <IconSymbol name="plus.circle" size={20} color={M.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: M.accent }}>
                      {t("languagePicker.useCustomLanguage", { name: search.trim() })}
                    </Text>
                  </View>
                </Pressable>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── LanguagePickerModal (kept for LanguagePickerButton) ─────────────────────

export function LanguagePickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
  allowedIds,
}: Readonly<{
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  allowedIds?: string[];
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base =
      allowedIds && allowedIds.length > 0
        ? ACTIVE_LANGUAGES.filter((l) => allowedIds.includes(l.id))
        : ACTIVE_LANGUAGES;
    const filtered = query
      ? base.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.nativeName.toLowerCase().includes(query) ||
            l.region.toLowerCase().includes(query)
        )
      : base;
    return groupByRegion(filtered);
  }, [search, allowedIds]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>
              {t("languagePicker.title")}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <IconSymbol name="xmark" size={20} color={M.sub} />
            </Pressable>
          </View>

          <View style={{ borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: M.border }}>
              <IconSymbol name="magnifyingglass" size={18} color={M.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("languagePicker.searchPlaceholder")}
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
            renderSectionHeader={({ section }) => (
              <View style={{ backgroundColor: M.card, paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: M.border }}>
                <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
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
                  style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: isSelected ? M.accentGlow : "transparent" }}
                  className="active:opacity-70"
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: isSelected ? "600" : "400", color: isSelected ? M.accent : M.text }}>
                      {item.name}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>
                      {item.nativeName}
                    </Text>
                  </View>
                  {isSelected && (
                    <IconSymbol name="checkmark.circle.fill" size={22} color={M.accent} />
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <IconSymbol name="magnifyingglass" size={32} color={M.border} />
                <Text style={{ marginTop: 12, fontSize: 13, color: M.muted }}>
                  {t("languagePicker.noResults", { query: search })}
                </Text>
              </View>
            }
            ListFooterComponent={
              search.trim().length > 0 && !allowedIds ? (
                <Pressable
                  onPress={() => { onSelect(search.trim()); }}
                  style={{
                    flexDirection: "row", alignItems: "center", borderTopWidth: 2, borderStyle: "dashed",
                    borderColor: selectedId === search.trim() ? M.accent : M.accentBorder,
                    paddingHorizontal: 20, paddingVertical: 16,
                    backgroundColor: selectedId === search.trim() ? M.accentGlow : "transparent",
                  }}
                  className="active:opacity-70"
                >
                  <View style={{ marginRight: 16, height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}>
                    <IconSymbol name="plus.circle" size={20} color={M.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: selectedId === search.trim() ? "600" : "400", color: M.accent }}>
                      {t("languagePicker.useCustomLanguage", { name: search.trim() })}
                    </Text>
                  </View>
                  {selectedId === search.trim() && (
                    <IconSymbol name="checkmark.circle.fill" size={22} color={M.accent} />
                  )}
                </Pressable>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
