import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCourseCanDos, useRateCanDo } from "@/lib/hooks/use-phrase-bank";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Pressable, Text, View } from "react-native";

const RATINGS = [
  { key: "yes" as const, label: "Yes" },
  { key: "mostly" as const, label: "Mostly" },
  { key: "not_yet" as const, label: "Not yet" },
];

/**
 * The reflective Movement-completion moment. When a learner has finished a
 * Movement's lessons, its can-do statements appear as "Can you now …?" with an
 * honest three-way self-rating. Never a gate — the next Unit stays open — but
 * the moment marks real competence, not just consumption. Renders nothing when
 * the course has no authored can-dos.
 */
export function CanDoCheck({ courseId, visible }: Readonly<{ courseId: string; visible: boolean }>) {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { data } = useCourseCanDos(courseId, visible);
  const rate = useRateCanDo();

  if (!visible) return null;
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  const allRated = items.every((it) => it.rating !== null);

  return (
    <View style={{ marginHorizontal: 20, marginTop: 20, borderRadius: 20, borderWidth: 1, borderColor: M.accentBorder, backgroundColor: M.card, padding: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <IconSymbol name={allRated ? "checkmark.seal.fill" : "flag.fill"} size={18} color={M.accent} />
        <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>
          {allRated ? "You crossed this threshold" : "Can you now…?"}
        </Text>
      </View>
      <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 17, color: M.muted }}>
        Be honest — this is for you, and nothing locks either way. &ldquo;Not yet&rdquo; just means the review queue keeps helping.
      </Text>

      <View style={{ marginTop: 12, gap: 12 }}>
        {items.map((it) => {
          const statement = uiLanguage === "fr" && it.canDoFr ? it.canDoFr : it.canDo;
          return (
            <View key={it.lessonId}>
              <Text style={{ fontSize: 14, fontWeight: "600", lineHeight: 20, color: M.text }}>{statement}</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                {RATINGS.map((r) => {
                  const active = it.rating === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => rate.mutate({ lessonId: it.lessonId, rating: r.key })}
                      disabled={rate.isPending}
                      style={{
                        borderRadius: 999,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderColor: active ? M.accent : M.border,
                        backgroundColor: active ? M.accentGlow : M.bg,
                      }}
                      className="active:opacity-70"
                    >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? M.accent : M.sub }}>{r.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
