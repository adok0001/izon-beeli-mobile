import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWordLookupCard } from "@/lib/hooks/use-word-lookup-card";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

interface Props {
  word: string | null;
  languageId: string;
  onClose: () => void;
}

/**
 * Mid-playback dictionary popover. Hold a transcript word to open it — look up
 * the word without leaving the player, hear it, and save it. This is the
 * audio-first take on inline lookup (cleaner than LingQ's tap-the-translation).
 */
export function WordLookupSheet({ word, languageId, onClose }: Props) {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { entry, isLoading, gloss, isSaved, save, playAudio } = useWordLookupCard(word ?? "", languageId);

  const visible = word != null;
  const example = entry?.example ?? "";
  const exampleGloss = entry ? localize(entry.exampleTranslations ?? entry.exampleTranslation, uiLanguage) : "";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: M.card,
            borderWidth: 1,
            borderColor: M.border,
            paddingHorizontal: 22,
            paddingTop: 14,
            paddingBottom: 34,
          }}
        >
          {/* Grabber */}
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: M.border, marginBottom: 16 }} />

          {isLoading ? (
            <View style={{ paddingVertical: 26, alignItems: "center" }}>
              <ActivityIndicator color={M.accent} />
            </View>
          ) : (
            <>
              {/* Headword row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ flex: 1, fontSize: 26, fontWeight: "900", color: M.text, letterSpacing: -0.3 }}>
                  {entry?.word ?? word}
                </Text>
                {entry?.audioUrl ? (
                  <Pressable
                    onPress={playAudio}
                    hitSlop={8}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}
                    accessibilityRole="button"
                    accessibilityLabel="Play pronunciation"
                  >
                    <IconSymbol name="speaker.wave.2.fill" size={16} color={M.accent} />
                  </Pressable>
                ) : null}
              </View>

              {entry?.pronunciation ? (
                <Text style={{ marginTop: 2, fontSize: 14, fontStyle: "italic", color: M.muted }}>{entry.pronunciation}</Text>
              ) : null}

              {entry ? (
                <>
                  <Text style={{ marginTop: 12, fontSize: 17, color: M.text }}>{gloss}</Text>
                  {example ? (
                    <View style={{ marginTop: 14, borderRadius: 12, backgroundColor: M.pillBg, padding: 12 }}>
                      <Text style={{ fontSize: 15, color: M.text }}>{example}</Text>
                      {exampleGloss ? <Text style={{ marginTop: 3, fontSize: 13, color: M.muted }}>{exampleGloss}</Text> : null}
                    </View>
                  ) : null}

                  <Pressable
                    onPress={save}
                    disabled={isSaved}
                    style={{
                      marginTop: 18,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      borderRadius: 12,
                      paddingVertical: 14,
                      backgroundColor: isSaved ? M.successBg : M.accent,
                      borderWidth: 1,
                      borderColor: isSaved ? M.successBorder : M.accent,
                    }}
                    accessibilityRole="button"
                  >
                    <IconSymbol name={isSaved ? "checkmark" : "plus"} size={15} color={isSaved ? M.success : M.ink} />
                    <Text style={{ fontSize: 15, fontWeight: "700", color: isSaved ? M.success : M.ink }}>
                      {isSaved ? localize({ en: "Saved", fr: "Enregistré" }, uiLanguage) : localize({ en: "Save word", fr: "Enregistrer" }, uiLanguage)}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text style={{ marginTop: 12, fontSize: 15, color: M.muted }}>
                  {localize({ en: "Not in the dictionary yet.", fr: "Pas encore dans le dictionnaire." }, uiLanguage)}
                </Text>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
