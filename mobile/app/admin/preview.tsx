import { useStudioAccess } from "@/components/studio/studio-gate";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { deriveEntryDisplay, EntryDetailView, type EntryDetailEdit } from "@/components/dictionary/entry-detail";
import { ReplicaEditModeProvider } from "@/components/studio/replica/replica-edit-mode";
import type { AudioAssetSaveInput } from "@/components/studio/replica/audio-asset-sheet";
import { LessonHero } from "@/components/lesson/lesson-hero";
import { LessonMetaPills } from "@/components/lesson/lesson-meta-pills";
import { LessonWords } from "@/components/lesson/lesson-words";
import { LessonObjectives } from "@/components/lesson/lesson-objectives";
import { usePreviewStore } from "@/store/preview-store";
import { friendlyError } from "@/lib/api";
import {
  toPreviewEntry,
  usePatchEducatorDictionaryAudio,
  usePatchEducatorDictionaryField,
  type PatchEducatorDictionaryFields,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useCallback, useMemo } from "react";
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
  const { payload, updateDictionaryEntry } = usePreviewStore();
  const { error: toastError } = useToast();
  const patchField = usePatchEducatorDictionaryField();
  const patchAudio = usePatchEducatorDictionaryAudio();

  const entryId = payload?.kind === "dictionary" ? payload.entry.id : null;
  const canEditEntry = payload?.kind === "dictionary" && !!payload.editable;

  /** One PATCH, then swap the returned row into the preview so the replica
   * reflects the save without refetching (and re-mounting) underneath it. */
  const saveFields = useCallback(
    async (fields: PatchEducatorDictionaryFields) => {
      if (!entryId) return;
      const updated = await patchField.mutateAsync({ id: entryId, ...fields });
      updateDictionaryEntry(toPreviewEntry(updated));
    },
    [entryId, patchField, updateDictionaryEntry]
  );

  const saveAudio = useCallback(
    async (input: AudioAssetSaveInput) => {
      if (!entryId) return;
      if (input.kind === "url") {
        await saveFields({ audioUrl: input.url });
        return;
      }
      const updated = await patchAudio.mutateAsync({ id: entryId, field: "audio", uri: input.uri });
      updateDictionaryEntry(toPreviewEntry(updated));
    },
    [entryId, patchAudio, saveFields, updateDictionaryEntry]
  );

  const edit: EntryDetailEdit | undefined = useMemo(
    () =>
      canEditEntry
        ? {
            onSaveWord: (word) => saveFields({ word }),
            onSavePronunciation: (pronunciation) => saveFields({ pronunciation }),
            onSaveTranslations: (translations) => saveFields({ translations }),
            onSaveCategory: (category) => saveFields({ category }),
            onSaveExample: (example) => saveFields({ example }),
            onSaveExampleTranslations: (exampleTranslations) => saveFields({ exampleTranslations }),
            onSaveAudio: saveAudio,
            onError: (err) => toastError("Save failed", friendlyError(err)),
          }
        : undefined,
    [canEditEntry, saveFields, saveAudio, toastError]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <StudioScreenHeader
        title="Preview"
        subtitle={canEditEntry ? "Draft — tap any field to edit" : "Draft — not yet published"}
      />

      <View style={{ flex: 1, backgroundColor: M.bg }}>
        {!payload && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <Text style={{ color: M.muted, fontSize: 13, textAlign: "center" }}>
              Nothing to preview. Open Preview from a draft in the dictionary or lesson editor.
            </Text>
          </View>
        )}

        {payload?.kind === "dictionary" && (
          <ReplicaEditModeProvider canEdit={canEditEntry}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <EntryDetailView
                entry={payload.entry}
                derived={deriveEntryDisplay(payload.entry, payload.uiLanguage)}
                edit={edit}
              />
            </ScrollView>
          </ReplicaEditModeProvider>
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
