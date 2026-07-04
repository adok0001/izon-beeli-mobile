import { localize } from "@/lib/localize";
import { useResumeLesson } from "@/lib/hooks/use-resume-lesson";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Pressable, Text, View } from "react-native";

/**
 * Explore-tab "Continue listening" rail card — same resume mechanics as the
 * Learn tab's `ContinueCard`, in the rail-card shape the mockup calls for
 * (glyph tile + progress bar) rather than a full-width banner.
 */
export function ContinueListeningCard() {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { resumeState, lesson, resume } = useResumeLesson();

  if (!resumeState || !lesson) return null;

  const pct = lesson.duration
    ? Math.min(100, Math.round((resumeState.positionSeconds / lesson.duration) * 100))
    : 0;
  const remainingMin = lesson.duration
    ? Math.max(0, Math.round((lesson.duration - resumeState.positionSeconds) / 60))
    : null;

  return (
    <Pressable
      onPress={resume}
      className="active:opacity-80"
      style={{ width: 250, borderRadius: 14, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, padding: 12 }}
      accessibilityRole="button"
      accessibilityLabel={`Continue listening: ${localize(lesson.title, uiLanguage)}`}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 20 }}>🎧</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>
            {localize(lesson.title, uiLanguage)}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 11, color: M.muted }} numberOfLines={1}>
            {remainingMin !== null ? `${remainingMin} min left` : "In progress"}
          </Text>
          <View style={{ marginTop: 8, height: 4, borderRadius: 2, backgroundColor: M.pillBg, overflow: "hidden" }}>
            <View style={{ width: `${pct}%`, height: "100%", borderRadius: 2, backgroundColor: M.accent }} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
