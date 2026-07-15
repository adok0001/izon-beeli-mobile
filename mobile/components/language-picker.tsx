import { IconSymbol } from "@/components/ui/icon-symbol";
import { fonts } from "@/constants/typography";
import { ACTIVE_LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { getLanguageRegionKey, REGION_KEY_MAP, type LanguageEntry } from "@/lib/data/languages";
import { MUSEUM, bronze, useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SectionList,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Section {
  title: string;
  data: LanguageEntry[];
}

function groupByRegion(languages: LanguageEntry[]): Section[] {
  const map = new Map<string, LanguageEntry[]>();
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
  const { t } = useTranslation();
  const { selectedLanguageId, enrollLanguage } = useLanguageStore();
  const [pickerVisible, setPickerVisible] = useState(false);

  const regionKey = getLanguageRegionKey(selectedLanguageId);
  const region = regionKey ? t(regionKey as never) : "";

  return (
    <View style={{ paddingTop: 14 }}>
      <Pressable
        onPress={() => setPickerVisible(true)}
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 9,
          backgroundColor: bronze(0.12),
          borderWidth: 1,
          borderColor: bronze(0.5),
        }}
        accessibilityRole="button"
        accessibilityLabel={t("languagePicker.title")}
      >
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: MUSEUM.accentLight }} />
        <Text style={{ fontSize: 14, fontWeight: "700", color: MUSEUM.accentLight }}>
          {getLanguageName(selectedLanguageId)}
          {region ? ` · ${region}` : ""}
        </Text>
        <IconSymbol name="chevron.down" size={13} color={MUSEUM.accentLight} />
      </Pressable>

      {/* Full picker — shows every active language (enrolled marked) so you can
          switch back to one you've already started, not only add new ones. */}
      <LanguagePickerModal
        visible={pickerVisible}
        selectedId={selectedLanguageId}
        onSelect={(id) => {
          enrollLanguage(id);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

// ─── LanguageExhibitCard (used on Learn/Home header) ─────────────────────────

export function LanguageExhibitCard() {
  const M = useMuseumTheme();
  const [visible, setVisible] = useState(false);
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const lang = ACTIVE_LANGUAGES.find((l) => l.id === selectedLanguageId);
  const displayName = lang?.name ?? selectedLanguageId;
  const detail = [lang?.nativeName, lang?.region].filter(Boolean).join(" · ");

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Switch language"
        className="active:opacity-75"
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: bronze(0.07),
          borderWidth: 1,
          borderColor: bronze(0.25),
        }}
      >
        {/* Left accent stripe */}
        <View style={{ width: 3, backgroundColor: MUSEUM.accent }} />

        {/* Label block */}
        <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2.5, color: M.textDimDark, textTransform: "uppercase" }}>
            Now Studying
          </Text>
          <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: M.parchment, marginTop: 2 }}>
            {displayName}
          </Text>
          {!!detail && (
            <Text style={{ fontSize: 11, color: M.textDim, marginTop: 2 }}>
              {detail}
            </Text>
          )}
        </View>

        {/* Switch affordance */}
        <View style={{ justifyContent: "center", paddingHorizontal: 14 }}>
          <IconSymbol name="arrow.left.arrow.right" size={14} color={M.accent} />
        </View>
      </Pressable>

      <LanguagePickerModal
        visible={visible}
        selectedId={selectedLanguageId}
        onSelect={(id) => { setLanguage(id); setVisible(false); }}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

// ─── LanguagePickerModal (kept for LanguagePickerButton) ─────────────────────

export function LanguagePickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
  allowedIds,
  pool = ACTIVE_LANGUAGES,
}: Readonly<{
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  allowedIds?: string[];
  /** Languages to choose from. Learning UI keeps the default (languages with
      real content); Studio passes the full authoring set. */
  pool?: LanguageEntry[];
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base =
      allowedIds && allowedIds.length > 0
        ? pool.filter((l) => allowedIds.includes(l.id))
        : pool;
    const filtered = query
      ? base.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.nativeName.toLowerCase().includes(query) ||
            l.region.toLowerCase().includes(query)
        )
      : base;
    return groupByRegion(filtered);
  }, [search, allowedIds, pool]);

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
