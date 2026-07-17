import { useStudioAccess } from "@/components/studio/studio-gate";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { deriveEntryDisplay, EntryDetailView } from "@/components/dictionary/entry-detail";
import { LessonHero } from "@/components/lesson/lesson-hero";
import { LessonMetaPills } from "@/components/lesson/lesson-meta-pills";
import { LessonWords } from "@/components/lesson/lesson-words";
import { LessonObjectives } from "@/components/lesson/lesson-objectives";
import { usePreviewStore } from "@/store/preview-store";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — draft device preview. Renders the same components a
 * learner would see, fed a not-yet-published draft passed in via
 * usePreviewStore instead of fetched by id — so an unpublished entry never
 * needs a bypass on the published-only content selectors.
 */
export default function PreviewScreen() {
  const M = useMuseumTheme();
  useStudioAccess();
  const { payload } = usePreviewStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <StudioScreenHeader title="Preview" subtitle="Draft — not yet published" />

      <View style={{ flex: 1, backgroundColor: M.bg }}>
        {!payload && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <Text style={{ color: M.muted, fontSize: 13, textAlign: "center" }}>
              Nothing to preview. Open Preview from a draft in the dictionary or lesson editor.
            </Text>
          </View>
        )}

        {payload?.kind === "dictionary" && (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <EntryDetailView entry={payload.entry} derived={deriveEntryDisplay(payload.entry, payload.uiLanguage)} />
          </ScrollView>
        )}

        {payload?.kind === "lesson" && (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <LessonHero title={payload.lesson.title} overline={payload.lesson.overline} accentColor={payload.lesson.accentColor} />
            <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
              <LessonMetaPills
                level={payload.lesson.level}
                wordCount={payload.lesson.wordCount}
                duration={payload.lesson.duration}
                accentColor={payload.lesson.accentColor}
              />
            </View>
            {payload.lesson.objectives.length > 0 && (
              <LessonObjectives
                objectives={payload.lesson.objectives}
                uiLanguage={payload.uiLanguage}
                accentColor={payload.lesson.accentColor}
              />
            )}
            {payload.lesson.vocab.length > 0 && (
              <LessonWords vocab={payload.lesson.vocab} uiLanguage={payload.uiLanguage} accentColor={payload.lesson.accentColor} />
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
