import { IconSymbol } from "@/components/ui/icon-symbol";
import { LEVEL_CEFR } from "@/lib/series-presentation";
import { useCanDoStatements } from "@/lib/hooks/use-progress";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { getSnapshotCourseLevel, useContentStore } from "@/store/content-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";

// Each ability shows the real level it was earned at, resolved from whichever
// language snapshot has hydrated for that lesson (see content-store.ts); a
// lesson whose snapshot hasn't loaded yet simply renders without a badge.
function cefrForLesson(lessonId: string): string | null {
  const level = getSnapshotCourseLevel(lessonId);
  return level ? (LEVEL_CEFR[level] ?? null) : null;
}

/**
 * "What you can do" — the honest competence résumé. A growing list of real-world
 * abilities the learner has unlocked (from completed lessons' `canDo`), shown as
 * the counterweight to XP/streak vanity metrics. Renders nothing until the
 * learner has completed at least one lesson that declares a competence line.
 */
export function CanDoResume() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data } = useCanDoStatements();
  const [expanded, setExpanded] = useState(true);
  // Subscribe to snapshots so CEFR badges appear once content hydrates —
  // cefrForLesson() reads the store non-reactively, so without this the badges
  // stay missing until an unrelated re-render (see skills-practiced.tsx).
  useContentStore((s) => s.snapshots);

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
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: expanded ? 12 : 0 }}
        >
          <IconSymbol name="checkmark.seal.fill" size={15} color={M.accent} />
          <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: M.accent }}>
            {label}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: M.muted }}>{`  ${data.length}`}</Text>
          <View style={{ flex: 1 }} />
          <IconSymbol name={expanded ? "chevron.up" : "chevron.down"} size={14} color={M.muted} />
        </Pressable>

        {expanded && data.map((s, i) => {
          const text = localize({ en: s.canDo ?? "", fr: s.canDoFr ?? undefined }, uiLanguage);
          if (!text) return null;
          const sourceTitle = localize(s.title, uiLanguage);
          const cefr = cefrForLesson(s.lessonId);
          return (
            <Animated.View
              key={s.lessonId}
              entering={FadeInDown.duration(360)
                .delay(80 * i)
                .reduceMotion(ReduceMotion.System)}
            >
              <Pressable
                onPress={() => router.push(`/lesson/${s.lessonId}`)}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  paddingBottom: 10,
                  marginBottom: 10,
                  borderBottomWidth: i === data.length - 1 ? 0 : 1,
                  borderBottomColor: M.border,
                }}
              >
                <View style={{ marginTop: 2 }}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={M.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, lineHeight: 20, color: M.text }}>
                    <Text style={{ color: M.muted }}>{prefix}</Text>
                    {text}
                  </Text>
                  {sourceTitle ? (
                    <Text style={{ marginTop: 3, fontSize: 11, color: M.muted }} numberOfLines={1}>
                      {sourceTitle}
                    </Text>
                  ) : null}
                </View>
                {cefr ? (
                  <View
                    style={{
                      marginTop: 2,
                      borderRadius: 6,
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      backgroundColor: M.accentGlow,
                      borderWidth: 1,
                      borderColor: M.accentBorder,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "800", color: M.accent }}>{cefr}</Text>
                  </View>
                ) : null}
                <View style={{ marginTop: 3 }}>
                  <IconSymbol name="chevron.right" size={12} color={M.muted} />
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
