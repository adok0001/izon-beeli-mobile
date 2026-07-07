import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { SensesPlacard } from "@/components/dictionary/senses-placard";
import type { AudioAssetSaveInput } from "@/components/studio/replica/audio-asset-sheet";
import { ReplicaField } from "@/components/studio/replica/replica-field";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { toLocalizedText } from "@/components/ui/localized-text-input";
import { CATEGORY_ICONS, CATEGORY_LABELS, parseSenses, type DictionaryEntry, type Sense } from "@/lib/dictionary";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { type UiLanguage } from "@/store/ui-language-store";
import type { AudioSource, LocalizedText } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { Image, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

/** Wired up by the Studio live-replica editor only — the real learner screen
 * (app/word/[id].tsx) never passes this, so it renders exactly as before. */
export interface EntryDetailEditHandlers {
  onSaveWord: (word: string) => Promise<unknown>;
  onSavePronunciation: (pronunciation: string) => Promise<unknown>;
  onSaveTranslations: (translations: LocalizedText) => Promise<unknown>;
  onSaveExample: (example: string) => Promise<unknown>;
  onSaveExampleTranslations: (exampleTranslations: LocalizedText) => Promise<unknown>;
  onSaveAudio: (input: AudioAssetSaveInput) => Promise<unknown>;
  onSaveExampleAudio: (input: AudioAssetSaveInput) => Promise<unknown>;
  onError?: (error: Error) => void;
}

export interface EntryDisplayDerived {
  englishText: string;
  exampleTranslationText: string;
  senses: Sense[];
  hasMultipleSenses: boolean;
  categoryLabel: string;
  categoryIcon: string;
  displayPronunciation?: string;
  effectiveAudioUrl?: AudioSource;
}

/** Pure derivation shared by the live word screen and the Studio draft preview
 * — keeping it in one place means a preview and the real screen can never
 * disagree about what a learner would see. */
export function deriveEntryDisplay(entry: DictionaryEntry, uiLanguage: UiLanguage): EntryDisplayDerived {
  const englishText = localize(entry.translations ?? entry.english, uiLanguage);
  const exampleTranslationText = localize(entry.exampleTranslations ?? entry.exampleTranslation, uiLanguage);
  const senses = parseSenses(englishText);
  const pronunciationIsUrl = typeof entry.pronunciation === "string" && entry.pronunciation.startsWith("http");

  return {
    englishText,
    exampleTranslationText,
    senses,
    hasMultipleSenses: senses.length > 1,
    categoryLabel: CATEGORY_LABELS[entry.category],
    categoryIcon: CATEGORY_ICONS[entry.category],
    displayPronunciation: pronunciationIsUrl ? undefined : entry.pronunciation,
    effectiveAudioUrl: entry.audioUrl ?? (pronunciationIsUrl ? (entry.pronunciation as AudioSource) : undefined),
  };
}

function InlineAudioButton({ audioUrl }: { audioUrl: string }) {
  const M = useMuseumTheme();
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const handlePress = useCallback(async () => {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => { if (s.isLoaded && s.didJustFinish) setPlaying(false); });
      setPlaying(true);
      await sound.playAsync();
    } catch { setPlaying(false); }
  }, [audioUrl]);

  return (
    <Pressable onPress={handlePress} disabled={playing} hitSlop={8} style={{ marginLeft: 8, padding: 4 }}>
      <IconSymbol
        name={playing ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
        size={18}
        color={playing ? M.accent : M.muted}
      />
    </Pressable>
  );
}

/** Small uppercase section label used throughout the word-detail view. */
function Overline({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ marginBottom: 8, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color }}>
      {label}
    </Text>
  );
}

/** A labeled row of neutral badges (synonyms, antonyms). */
function BadgeRow({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <View>
      <Overline label={label} color={color} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {items.map((x) => <Badge key={x} label={x} tone="neutral" />)}
      </View>
    </View>
  );
}

/**
 * The learner-facing hero + example + lexical-detail sections of a dictionary
 * entry — everything that doesn't depend on live app state (save/practice
 * buttons, prev/next nav, contribution flows, related-words). Shared by the
 * real word screen (app/word/[id].tsx) and the Studio draft preview, so a
 * reviewer previewing an unpublished entry sees exactly what will ship.
 */
export function EntryDetailView({
  entry, derived, edit,
}: Readonly<{ entry: DictionaryEntry; derived: EntryDisplayDerived; edit?: EntryDetailEditHandlers }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { englishText, exampleTranslationText, senses, hasMultipleSenses, categoryLabel, categoryIcon, displayPronunciation, effectiveAudioUrl } = derived;
  const editableAudioUrl = typeof entry.audioUrl === "string" ? entry.audioUrl : undefined;

  return (
    <>
      {/* Hero section */}
      <View style={{ alignItems: "center", paddingHorizontal: 24, paddingBottom: 24, paddingTop: 40 }}>
        {entry.imageUrl && (
          <Image
            source={{ uri: entry.imageUrl }}
            style={{ marginBottom: 20, height: 192, width: "100%", borderRadius: 16 }}
            resizeMode="cover"
          />
        )}
        {edit ? (
          <ReplicaField variant="text" value={entry.word} onSave={edit.onSaveWord} onError={edit.onError} style={{ textAlign: "center", fontSize: 60, fontWeight: "700", color: M.text }}>
            <Text style={{ textAlign: "center", fontSize: 60, fontWeight: "700", color: M.text }}>{entry.word}</Text>
          </ReplicaField>
        ) : (
          <Text style={{ textAlign: "center", fontSize: 60, fontWeight: "700", color: M.text }}>
            {entry.word}
          </Text>
        )}

        {edit ? (
          <ReplicaField
            variant="text"
            value={entry.pronunciation ?? ""}
            onSave={edit.onSavePronunciation}
            onError={edit.onError}
            placeholder="Pronunciation"
            style={{ marginTop: 8, fontSize: 16, fontStyle: "italic", color: M.sub }}
          >
            <Text style={{ marginTop: 8, fontSize: 16, fontStyle: "italic", color: M.sub }}>
              {displayPronunciation ? `/${displayPronunciation}/` : "Add pronunciation"}
            </Text>
          </ReplicaField>
        ) : (
          displayPronunciation && (
            <Text style={{ marginTop: 8, fontSize: 16, fontStyle: "italic", color: M.sub }}>
              /{displayPronunciation}/
            </Text>
          )
        )}

        {hasMultipleSenses ? (
          <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ height: 1, width: 16, backgroundColor: M.accentBorder }} />
            <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.accent }}>
              {t("wordDetail.senseCount", { count: senses.length })}
            </Text>
            <View style={{ height: 1, width: 16, backgroundColor: M.accentBorder }} />
          </View>
        ) : edit ? (
          <ReplicaField
            variant="localized-text"
            value={toLocalizedText(entry.translations ?? entry.english, entry.french)}
            label={t("wordDetail.meaning", { defaultValue: "Meaning" })}
            onSave={edit.onSaveTranslations}
            onError={edit.onError}
          >
            <Text style={{ marginTop: 12, textAlign: "center", fontSize: 20, color: M.sub }}>
              {englishText}
            </Text>
          </ReplicaField>
        ) : (
          <Text style={{ marginTop: 12, textAlign: "center", fontSize: 20, color: M.sub }}>
            {englishText}
          </Text>
        )}

        {!!entry.french && (
          <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: M.accentBorder }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: M.accent }}>
                {t("wordDetail.french")}
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: M.sub }}>
              {entry.french}
            </Text>
          </View>
        )}

        {/* Audio button */}
        <View style={{ marginTop: 24, alignItems: "center" }}>
          {edit ? (
            <ReplicaField variant="audio-asset" value={editableAudioUrl} onSave={edit.onSaveAudio} onError={edit.onError}>
              <View style={{ height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: M.accent }}>
                <IconSymbol name="speaker.wave.2.fill" size={28} color={M.ink} />
              </View>
            </ReplicaField>
          ) : (
            <View style={{ height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: M.accent }}>
              <WordAudioButton audioSource={effectiveAudioUrl} word={entry.word} size={28} />
            </View>
          )}
          <Text style={{ marginTop: 8, fontSize: 11, fontWeight: "600", color: M.accent }}>
            {effectiveAudioUrl ? t("wordDetail.hearPronunciation") : t("wordDetail.textToSpeech")}
          </Text>
        </View>

        {/* Category badge */}
        <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: M.accentBorder }}>
          <IconSymbol name={categoryIcon as never} size={13} color={M.accent} />
          <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: M.accent }}>
            {categoryLabel}
          </Text>
        </View>
      </View>

      <View style={{ marginHorizontal: 20, height: 1, backgroundColor: M.border }} />

      {/* Senses — the lexicon plate (only when the word carries several readings) */}
      {hasMultipleSenses && <SensesPlacard senses={senses} />}

      {/* Example sentence */}
      {(entry.example || edit) && (
        <View style={{ marginHorizontal: 20, marginTop: 20, borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: M.border }}>
          <Text style={{ marginBottom: 6, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
            {t("wordDetail.example")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {edit ? (
              <ReplicaField
                variant="multiline"
                value={entry.example ?? ""}
                onSave={edit.onSaveExample}
                onError={edit.onError}
                placeholder="Add an example sentence"
                style={{ flex: 1, fontSize: 16, color: M.text }}
              >
                <Text style={{ flex: 1, fontSize: 16, color: M.text }}>{entry.example}</Text>
              </ReplicaField>
            ) : (
              <Text style={{ flex: 1, fontSize: 16, color: M.text }}>
                {entry.example}
              </Text>
            )}
            {edit ? (
              <ReplicaField variant="audio-asset" value={entry.exampleAudioUrl} onSave={edit.onSaveExampleAudio} onError={edit.onError}>
                <IconSymbol name="speaker.wave.2.fill" size={18} color={M.muted} />
              </ReplicaField>
            ) : (
              entry.exampleAudioUrl && <InlineAudioButton audioUrl={entry.exampleAudioUrl} />
            )}
          </View>
          {edit ? (
            <ReplicaField
              variant="localized-text"
              value={toLocalizedText(entry.exampleTranslations ?? entry.exampleTranslation, entry.exampleTranslationFr)}
              label={t("wordDetail.exampleTranslation", { defaultValue: "Example translation" })}
              onSave={edit.onSaveExampleTranslations}
              onError={edit.onError}
            >
              <Text style={{ marginTop: 6, fontSize: 13, color: M.sub }}>{exampleTranslationText}</Text>
            </ReplicaField>
          ) : (
            exampleTranslationText && (
              <Text style={{ marginTop: 6, fontSize: 13, color: M.sub }}>
                {exampleTranslationText}
              </Text>
            )
          )}
        </View>
      )}

      {/* Lexical detail — dialectal variants, synonyms, antonyms, semantic domain */}
      {(entry.dialectalVariants?.length || entry.synonyms?.length || entry.antonyms?.length || entry.semanticDomain) ? (
        <View style={{ marginHorizontal: 20, marginTop: 20, borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: M.border, gap: 16 }}>
          {entry.dialectalVariants?.length ? (
            <View>
              <Overline label={t("wordDetail.dialectalVariants")} color={M.muted} />
              <View style={{ gap: 6 }}>
                {entry.dialectalVariants.map((v, i) => (
                  <View key={`${v.dialect}-${i}`} style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: M.text }}>{v.form}</Text>
                    <Text style={{ marginLeft: 8, fontSize: 13, color: M.sub }}>
                      {v.region ? `${v.dialect} · ${v.region}` : v.dialect}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {entry.synonyms?.length ? <BadgeRow label={t("wordDetail.synonyms")} items={entry.synonyms} color={M.muted} /> : null}
          {entry.antonyms?.length ? <BadgeRow label={t("wordDetail.antonyms")} items={entry.antonyms} color={M.muted} /> : null}
          {entry.semanticDomain ? (
            <View>
              <Overline label={t("wordDetail.semanticDomain")} color={M.muted} />
              <Text style={{ fontSize: 14, color: M.sub }}>{entry.semanticDomain}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
