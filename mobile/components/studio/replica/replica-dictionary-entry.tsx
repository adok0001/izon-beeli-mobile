import { deriveEntryDisplay, EntryDetailView } from "@/components/dictionary/entry-detail";
import type { AudioAssetSaveInput } from "@/components/studio/replica/audio-asset-sheet";
import { ReplicaEditModeProvider } from "@/components/studio/replica/replica-edit-mode";
import type { WorkflowActor } from "@/lib/hooks/educator/use-content-workflow";
import { canEditContent } from "@/lib/hooks/educator/use-content-workflow";
import {
  toPreviewEntry,
  usePatchEducatorDictionaryAudio,
  usePatchEducatorDictionaryField,
  type EducatorDictionaryEntry,
} from "@/lib/hooks/educator/use-dictionary";
import { useUiLanguageStore } from "@/store/ui-language-store";

interface Props {
  entry: EducatorDictionaryEntry;
  actor: WorkflowActor;
  onError?: (error: Error) => void;
}

/** Wraps the real learner-facing `EntryDetailView` in edit affordances — the
 * first live-replica conversion. Publish/submit/delete stay in the screen
 * around this component; this only ever touches content fields. */
export function ReplicaDictionaryEntry({ entry, actor, onError }: Props) {
  const { uiLanguage } = useUiLanguageStore();
  const previewEntry = toPreviewEntry(entry);
  const derived = deriveEntryDisplay(previewEntry, uiLanguage);
  const patchField = usePatchEducatorDictionaryField();
  const patchAudio = usePatchEducatorDictionaryAudio();

  const saveAudio = async (input: AudioAssetSaveInput) => {
    if (input.kind === "file") {
      await patchAudio.mutateAsync({ id: entry.id, field: "audio", uri: input.uri });
    } else {
      await patchField.mutateAsync({ id: entry.id, audioUrl: input.url });
    }
  };

  const saveExampleAudio = async (input: AudioAssetSaveInput) => {
    if (input.kind === "file") {
      await patchAudio.mutateAsync({ id: entry.id, field: "exampleAudio", uri: input.uri });
    } else {
      await patchField.mutateAsync({ id: entry.id, exampleAudioUrl: input.url });
    }
  };

  return (
    <ReplicaEditModeProvider canEdit={canEditContent(actor)}>
      <EntryDetailView
        entry={previewEntry}
        derived={derived}
        edit={{
          onSaveWord: (word) => patchField.mutateAsync({ id: entry.id, word }),
          onSavePronunciation: (pronunciation) => patchField.mutateAsync({ id: entry.id, pronunciation }),
          onSaveTranslations: (translations) => patchField.mutateAsync({ id: entry.id, translations }),
          onSaveExample: (example) => patchField.mutateAsync({ id: entry.id, example }),
          onSaveExampleTranslations: (exampleTranslations) => patchField.mutateAsync({ id: entry.id, exampleTranslations }),
          onSaveAudio: saveAudio,
          onSaveExampleAudio: saveExampleAudio,
          onError,
        }}
      />
    </ReplicaEditModeProvider>
  );
}
