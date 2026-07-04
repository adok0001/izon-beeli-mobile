import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWordLookupCard } from "@/lib/hooks/use-word-lookup-card";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { useUiLanguageStore } from "@/store/ui-language-store";

interface Props {
  word: string;
  languageId: string;
  onClose: () => void;
}

/**
 * Tap-to-look-up card for the line currently being read — appears in the flow
 * right under that line (not a separate sheet) so looking a word up doesn't
 * interrupt playback or cover the transcript. Long-press on any other line
 * still opens the full-screen WordLookupSheet.
 */
export function InlineWordPopover({ word, languageId, onClose }: Props) {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { entry, isLoading, gloss, isSaved, save, playAudio, stop } = useWordLookupCard(word, languageId);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  // Unlike WordLookupSheet (mounted for the transcript's lifetime, so its
  // sound naturally unloads on the next play()), this popover mounts/unmounts
  // per tap — stop() releases the native audio session instead of leaking it.
  useEffect(() => () => { stop(); }, [stop]);

  return (
    <View
      style={{
        marginTop: 10,
        borderRadius: 14,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.accentBorder,
        padding: 13,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={M.accent} />
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: M.text }}>{entry?.word ?? word}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {entry?.audioUrl ? (
                <Pressable
                  onPress={playAudio}
                  hitSlop={8}
                  style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}
                  accessibilityRole="button"
                  accessibilityLabel="Play pronunciation"
                >
                  <IconSymbol name="speaker.wave.2.fill" size={12} color={M.accent} />
                </Pressable>
              ) : null}
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
                <IconSymbol name="xmark" size={16} color={M.muted} />
              </Pressable>
            </View>
          </View>

          {entry?.pronunciation ? (
            <Text style={{ marginTop: 2, fontSize: 12, fontStyle: "italic", color: M.muted }}>{entry.pronunciation}</Text>
          ) : null}

          {entry ? (
            <>
              <Text style={{ marginTop: 6, fontSize: 14, color: M.text }}>{gloss}</Text>
              <View style={{ flexDirection: "row", gap: 7, marginTop: 10 }}>
                <Pressable
                  onPress={save}
                  disabled={isSaved}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    borderRadius: 9,
                    paddingVertical: 8,
                    backgroundColor: isSaved ? M.successBg : M.accent,
                    borderWidth: 1,
                    borderColor: isSaved ? M.successBorder : M.accent,
                  }}
                  accessibilityRole="button"
                >
                  <IconSymbol name={isSaved ? "checkmark" : "plus"} size={12} color={isSaved ? M.success : M.ink} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: isSaved ? M.success : M.ink }}>
                    {isSaved
                      ? localize({ en: "Saved", fr: "Enregistré" }, uiLanguage)
                      : localize({ en: "Save word", fr: "Enregistrer" }, uiLanguage)}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={{ marginTop: 6, fontSize: 13, color: M.muted }}>
              {localize({ en: "Not in the dictionary yet.", fr: "Pas encore dans le dictionnaire." }, uiLanguage)}
            </Text>
          )}

          {isPlaying ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 9 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: M.success }} />
              <Text style={{ fontSize: 10.5, color: M.success }}>
                {localize({ en: "Audio still playing", fr: "L'audio continue" }, uiLanguage)}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
