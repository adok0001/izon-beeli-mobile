import { IconSymbol } from "@/components/ui/icon-symbol";
import type { LanguageEntry } from "@/lib/data/languages";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LanguagePickerProps {
  /** Currently selected language id (or a free-text custom name). */
  value: string;
  /** Fired when a language (or custom name) is chosen. */
  onSelect: (id: string) => void;
  /** The pool to choose from — e.g. ACTIVE_LANGUAGES for onboarding, the full
   *  LANGUAGES list for contribution flows. */
  languages: LanguageEntry[];
  /** Allow picking a name that isn't in the list. Default true. */
  allowCustom?: boolean;
  /** Optional heading shown above the (pinned) search field. */
  title?: string;
  subtitle?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * The single Museum-styled language picker shared across onboarding and every
 * contribution flow. The search field stays pinned above the scrolling list so
 * it never scrolls out of view.
 */
export function LanguagePicker({
  value,
  onSelect,
  languages,
  allowCustom = true,
  title,
  subtitle,
}: LanguagePickerProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? languages.filter(
            (l) =>
              l.name.toLowerCase().includes(q) ||
              l.nativeName?.toLowerCase().includes(q) ||
              l.region?.toLowerCase().includes(q),
          )
        : languages,
    [languages, q],
  );

  const custom = search.trim();
  const hasExactMatch = languages.some(
    (l) => l.name.toLowerCase() === custom.toLowerCase() || l.id.toLowerCase() === custom.toLowerCase(),
  );
  const showCustom = allowCustom && custom.length > 0 && !hasExactMatch;

  return (
    <View style={{ flex: 1 }}>
      {/* Pinned header: heading + search */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        {title ? (
          <Text style={{ marginBottom: 4, fontSize: 20, fontWeight: "700", color: M.text }}>{title}</Text>
        ) : null}
        {subtitle ? (
          <Text style={{ marginBottom: 16, fontSize: 13, color: M.sub }}>{subtitle}</Text>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: M.border,
            backgroundColor: M.card,
            paddingHorizontal: 12,
          }}
        >
          <IconSymbol name="magnifyingglass" size={16} color={M.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("contribute.searchLanguage")}
            placeholderTextColor={M.muted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={{ marginLeft: 8, flex: 1, paddingVertical: 12, fontSize: 14, color: M.text }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <IconSymbol name="xmark.circle.fill" size={16} color={M.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Scrolling list */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 && !showCustom && (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <IconSymbol name="magnifyingglass" size={32} color={M.border} />
            <Text style={{ marginTop: 8, fontSize: 13, color: M.muted }}>{t("contribute.noLanguageFound")}</Text>
          </View>
        )}

        {filtered.map((lang) => {
          const selected = value === lang.id;
          return (
            <Pressable
              key={lang.id}
              onPress={() => onSelect(lang.id)}
              style={{
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 12,
                borderWidth: 2,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: selected ? M.accentGlow : M.card,
                borderColor: selected ? M.accent : M.border,
              }}
              className="active:opacity-70"
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: selected ? M.accent : M.text }}>
                  {lang.name}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>
                  {lang.nativeName} · {lang.region}
                </Text>
              </View>
              {selected && <IconSymbol name="checkmark.circle.fill" size={22} color={M.accent} />}
            </Pressable>
          );
        })}

        {showCustom && (
          <Pressable
            onPress={() => onSelect(custom)}
            style={{
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 12,
              borderWidth: 2,
              borderStyle: "dashed",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderColor: value === custom ? M.accent : M.accentBorder,
              backgroundColor: value === custom ? M.accentGlow : "transparent",
            }}
            className="active:opacity-70"
          >
            <View
              style={{
                marginRight: 12,
                height: 36,
                width: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: M.accentGlow,
              }}
            >
              <IconSymbol name="plus.circle" size={20} color={M.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: M.accent }}>
                {t("contribute.useCustomLanguage", { name: custom })}
              </Text>
            </View>
            {value === custom && <IconSymbol name="checkmark.circle.fill" size={22} color={M.accent} />}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
