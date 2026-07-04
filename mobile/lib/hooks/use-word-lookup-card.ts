import { useWordLookup } from "@/lib/hooks/use-dictionary";
import { useSaveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { useWordAudio } from "@/lib/hooks/use-word-audio";
import { hapticTap } from "@/lib/haptics";
import { localize } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";

/**
 * Shared word-lookup state for both the modal WordLookupSheet and the inline
 * InlineWordPopover — same entry/gloss/save-state/audio wiring, different
 * chrome (each renders its own layout on top of this).
 */
export function useWordLookupCard(word: string, languageId: string) {
  const { uiLanguage } = useUiLanguageStore();
  const { data: entry, isLoading } = useWordLookup(languageId, word);
  const { data: savedIds } = useWordBank();
  const saveWord = useSaveWord();
  const { play, stop } = useWordAudio();

  const gloss = entry ? localize(entry.translations ?? entry.english, uiLanguage) : "";
  const isSaved = !!entry && (savedIds?.includes(entry.id) ?? false);

  const save = () => {
    if (entry && !isSaved) {
      hapticTap();
      saveWord.mutate(entry.id);
    }
  };

  const playAudio = () => {
    if (entry?.audioUrl) {
      hapticTap();
      play(entry.audioUrl);
    }
  };

  return { entry, isLoading, gloss, isSaved, save, playAudio, stop };
}
