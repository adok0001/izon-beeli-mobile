import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCultural } from "@/lib/hooks/use-cultural";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

/**
 * Inline cultural beat inside the lesson flow. Beeli's wedge is language AND
 * culture together, so culture shouldn't live only behind a side route — a
 * relevant cultural note surfaces here and opens the full reader. Renders
 * nothing when the language has no cultural content.
 */
export function LessonCultureNote({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data } = useCultural(languageId);

  if (!data || data.length === 0) return null;
  const item = data.find((c) => c.featured) ?? data[0];

  const title = localize(item.title, uiLanguage);
  const description = localize(item.description, uiLanguage);
  const category = item.category.replace(/_/g, " ");

  return (
    <Pressable
      onPress={() => router.push(`/cultural/${languageId}` as never)}
      className="active:opacity-80"
      style={{
        marginTop: 20,
        borderRadius: 16,
        padding: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        borderLeftWidth: 3,
        borderLeftColor: M.accent,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Cultural note: ${title}`}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <IconSymbol name="sparkles" size={13} color={M.accent} />
        <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", color: M.accent }}>
          {localize({ en: "Culture", fr: "Culture" }, uiLanguage)}
          <Text style={{ color: M.muted }}>{`  ·  ${category}`}</Text>
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ fontSize: 30 }}>{item.imageEmoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }} numberOfLines={1}>{title}</Text>
          {description ? (
            <Text style={{ marginTop: 2, fontSize: 13, lineHeight: 18, color: M.sub }} numberOfLines={2}>{description}</Text>
          ) : null}
        </View>
        <IconSymbol name="chevron.right" size={15} color={M.muted} />
      </View>
    </Pressable>
  );
}
