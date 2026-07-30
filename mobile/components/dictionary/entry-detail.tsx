import type { IconSymbolName } from "@/components/ui/icon-symbol-mapping";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { SensesPlacard } from "@/components/dictionary/senses-placard";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GLOSS_LANGUAGES, toLocalizedText } from "@/components/ui/localized-text-input";
import type { AudioAssetSaveInput } from "@/components/studio/replica/audio-asset-sheet";
import { ReplicaField, ReplicaPlaceholder, type ReplicaChoice } from "@/components/studio/replica/replica-field";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  DICTIONARY_CATEGORY_VALUES,
  parseSenses,
  scopeToSense,
  type DictionaryEntry,
  type Sense,
} from "@/lib/dictionary";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { type UiLanguage } from "@/store/ui-language-store";
import type { AudioSource, LocalizedText } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { Image, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export interface EntryDisplayDerived {
  /** Which language `englishText` was resolved to — the other glosses list skips it. */
  uiLanguage: UiLanguage;
  englishText: string;
  exampleTranslationText: string;
  senses: Sense[];
  hasMultipleSenses: boolean;
  categoryLabel: string;
  categoryIcon: IconSymbolName;
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
    uiLanguage,
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
 * Save handlers that turn this view into a tap-to-edit replica for Studio.
 * Grouped into one object because they travel together — the view is either
 * editable or it isn't.
 */
export interface EntryDetailEdit {
  onSaveWord: (word: string) => Promise<unknown>;
  onSavePronunciation: (pronunciation: string) => Promise<unknown>;
  onSaveTranslations: (translations: LocalizedText) => Promise<unknown>;
  onSaveCategory: (category: string) => Promise<unknown>;
  onSaveExample: (example: string) => Promise<unknown>;
  onSaveExampleTranslations: (translations: LocalizedText) => Promise<unknown>;
  onSaveAudio: (input: AudioAssetSaveInput) => Promise<unknown>;
  onError?: (error: Error) => void;
}

/** The closed category set, in the canonical order, for the picker sheet. */
const CATEGORY_CHOICES: readonly ReplicaChoice[] = DICTIONARY_CATEGORY_VALUES.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
  icon: CATEGORY_ICONS[value],
}));

/**
 * The learner-facing hero + example + lexical-detail sections of a dictionary
 * entry — everything that doesn't depend on live app state (save/practice
 * buttons, prev/next nav, contribution flows, related-words). Shared by the
 * real word screen (app/word/[id].tsx) and the Studio draft preview, so a
 * reviewer previewing an unpublished entry sees exactly what will ship.
 *
 * Passing `edit` additionally makes the content fields tappable for Studio.
 * Without it — the learner path — nothing about the render changes, and the
 * `ReplicaField` wrappers below pass their children straight through.
 */
export function EntryDetailView({
  entry, derived, edit, selectedSense, onSelectSense,
}: Readonly<{
  entry: DictionaryEntry;
  derived: EntryDisplayDerived;
  edit?: EntryDetailEdit;
  /**
   * Which sense the page is showing. Set together with `onSelectSense` by the
   * live word screen; the Studio draft preview passes neither, so its senses stay
   * inert and its example stays whole-word — see the note on scoping below.
   */
  selectedSense?: number;
  onSelectSense?: (senseIndex: number) => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage, englishText, exampleTranslationText, senses, hasMultipleSenses, categoryLabel, categoryIcon, displayPronunciation, effectiveAudioUrl } = derived;

  /**
   * Scope the example to the selected sense — but never while editing.
   *
   * The editable column is whole-word, so a scoped editor would let someone read
   * "no example" under sense 3, type one, and silently overwrite sense 1's. Until
   * `dictionary_examples` gives each sense its own row to write to, the Studio
   * preview edits the entry as a whole.
   */
  const scope = edit ? scopeToSense(entry) : scopeToSense(entry, selectedSense);
  const scopedExampleTranslation = edit
    ? exampleTranslationText
    : localize(scope.exampleTranslations ?? scope.exampleTranslation, uiLanguage);

  // In edit mode an absent optional field still needs somewhere to tap, so it
  // renders a muted stand-in where the real value will appear.
  const meaningNode = hasMultipleSenses ? (
    <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ height: 1, width: 16, backgroundColor: M.accentBorder }} />
      <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.accent }}>
        {t("wordDetail.senseCount", { count: senses.length })}
      </Text>
      <View style={{ height: 1, width: 16, backgroundColor: M.accentBorder }} />
    </View>
  ) : (
    <Text style={{ marginTop: 12, textAlign: "center", fontSize: 20, color: M.sub }}>
      {englishText}
    </Text>
  );

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
        <ReplicaField
          variant="text"
          label="Word"
          value={entry.word}
          disabled={!edit}
          onSave={edit?.onSaveWord ?? (async () => {})}
          onError={edit?.onError}
        >
          <Text style={{ textAlign: "center", fontSize: 60, fontWeight: "700", color: M.text }}>
            {entry.word}
          </Text>
        </ReplicaField>

        {(displayPronunciation || edit) && (
          <ReplicaField
            variant="text"
            label="Pronunciation"
            value={displayPronunciation ?? ""}
            placeholder="e.g. tam-a-ra"
            disabled={!edit}
            onSave={edit?.onSavePronunciation ?? (async () => {})}
            onError={edit?.onError}
          >
            {displayPronunciation ? (
              <Text style={{ marginTop: 8, fontSize: 16, fontStyle: "italic", color: M.sub }}>
                /{displayPronunciation}/
              </Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                <ReplicaPlaceholder text="Add pronunciation" />
              </View>
            )}
          </ReplicaField>
        )}

        <ReplicaField
          variant="localized-text"
          label="Meaning"
          value={toLocalizedText(entry.translations, entry.english)}
          disabled={!edit}
          onSave={edit?.onSaveTranslations ?? (async () => {})}
          onError={edit?.onError}
        >
          {meaningNode}
        </ReplicaField>

        {/* Every other gloss the entry carries, each tagged with its language. */}
        {GLOSS_LANGUAGES.filter((l) => l.key !== uiLanguage && !!entry.translations?.[l.key]).map((l) => (
          <View key={l.key} style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: M.accentBorder }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: M.accent }}>
                {l.label}
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: M.sub }}>
              {entry.translations?.[l.key]}
            </Text>
          </View>
        ))}

        {/* Audio button */}
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <View style={{ height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: M.accent }}>
            <WordAudioButton audioSource={effectiveAudioUrl} word={entry.word} size={28} />
          </View>
          {/* The caption carries the edit affordance, not the button — nesting a
              Pressable inside the play button would swallow the play tap. */}
          <ReplicaField
            variant="audio-asset"
            label="Pronunciation audio"
            /* AudioSource also covers bundled require() ids, which have no URL
               for the sheet to play back — only pass a real remote URI. */
            value={typeof effectiveAudioUrl === "string" ? effectiveAudioUrl : undefined}
            disabled={!edit}
            onSave={edit?.onSaveAudio ?? (async () => {})}
            onError={edit?.onError}
          >
            <Text style={{ marginTop: 8, fontSize: 11, fontWeight: "600", color: M.accent }}>
              {effectiveAudioUrl ? t("wordDetail.hearPronunciation") : t("wordDetail.textToSpeech")}
            </Text>
          </ReplicaField>
        </View>

        {/* Category badge */}
        <View style={{ marginTop: 16 }}>
          <ReplicaField
            variant="choice"
            label="Category"
            value={entry.category}
            options={CATEGORY_CHOICES}
            disabled={!edit}
            onSave={edit?.onSaveCategory ?? (async () => {})}
            onError={edit?.onError}
          >
            <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: M.accentBorder }}>
              <IconSymbol name={categoryIcon} size={13} color={M.accent} />
              <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: M.accent }}>
                {categoryLabel}
              </Text>
            </View>
          </ReplicaField>
        </View>
      </View>

      <View style={{ marginHorizontal: 20, height: 1, backgroundColor: M.border }} />

      {/* Senses — the lexicon plate (only when the word carries several readings) */}
      {hasMultipleSenses && (
        <SensesPlacard senses={senses} selectedIndex={selectedSense} onSelect={onSelectSense} />
      )}

      {/* Example sentence — scoped to the selected sense (see `scope` above) */}
      {(scope.example || edit || (hasMultipleSenses && selectedSense !== undefined)) && (
        <View style={{ marginHorizontal: 20, marginTop: 20, borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: M.border }}>
          <Text style={{ marginBottom: 6, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
            {hasMultipleSenses && selectedSense !== undefined && !edit
              ? t("wordDetail.exampleForSense", { n: String(selectedSense + 1) })
              : t("wordDetail.example")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <ReplicaField
                variant="multiline"
                label="Example sentence"
                value={scope.example ?? ""}
                placeholder="A sentence using this word"
                disabled={!edit}
                onSave={edit?.onSaveExample ?? (async () => {})}
                onError={edit?.onError}
              >
                {scope.example ? (
                  <Text style={{ fontSize: 16, color: M.text }}>
                    {scope.example}
                  </Text>
                ) : edit ? (
                  <ReplicaPlaceholder text="Add an example sentence" />
                ) : (
                  <Text style={{ fontSize: 14, fontStyle: "italic", color: M.muted }}>
                    {t("wordDetail.noExampleForSense")}
                  </Text>
                )}
              </ReplicaField>
            </View>
            {scope.exampleAudioUrl && (
              <InlineAudioButton audioUrl={scope.exampleAudioUrl} />
            )}
          </View>
          {(scopedExampleTranslation || edit) && (
            <View style={{ marginTop: 6 }}>
              <ReplicaField
                variant="localized-text"
                label="Example translation"
                multiline
                value={toLocalizedText(scope.exampleTranslations, scope.exampleTranslation)}
                disabled={!edit}
                onSave={edit?.onSaveExampleTranslations ?? (async () => {})}
                onError={edit?.onError}
              >
                {scopedExampleTranslation ? (
                  <Text style={{ fontSize: 13, color: M.sub }}>
                    {scopedExampleTranslation}
                  </Text>
                ) : (
                  <ReplicaPlaceholder text="Add a translation" />
                )}
              </ReplicaField>
            </View>
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
