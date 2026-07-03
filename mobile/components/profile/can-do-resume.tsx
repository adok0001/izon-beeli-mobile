import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCanDoStatements } from "@/lib/hooks/use-progress";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Text, View } from "react-native";

/**
 * "What you can do" — the honest competence résumé. A growing list of real-world
 * abilities the learner has unlocked (from completed lessons' `canDo`), shown as
 * the counterweight to XP/streak vanity metrics. Renders nothing until the
 * learner has completed at least one lesson that declares a competence line.
 */
export function CanDoResume() {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { data } = useCanDoStatements();

  if (!data || data.length === 0) return null;

  const label = localize({ en: "What you can do", fr: "Ce que vous savez faire" }, uiLanguage);
  const prefix = localize({ en: "You can ", fr: "Vous savez " }, uiLanguage);

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
      <View
        style={{
          borderRadius: 16,
          padding: 16,
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <IconSymbol name="checkmark.seal.fill" size={15} color={M.accent} />
          <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: M.accent }}>
            {label}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: M.muted }}>{`  ${data.length}`}</Text>
        </View>

        {data.map((s) => {
          const text = localize(
            typeof s.canDo === "string" ? { en: s.canDo, fr: s.canDoFr ?? undefined } : s.canDo,
            uiLanguage,
          );
          if (!text) return null;
          return (
            <View key={s.lessonId} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <View style={{ marginTop: 2 }}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={M.success} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: M.text }}>
                <Text style={{ color: M.muted }}>{prefix}</Text>
                {text}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
