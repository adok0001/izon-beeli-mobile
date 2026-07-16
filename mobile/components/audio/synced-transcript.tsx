import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordLookupSheet } from "@/components/audio/word-lookup-sheet";
import { InlineWordPopover } from "@/components/audio/inline-word-popover";
import { CulturalNoteCards } from "@/components/lesson/lesson-culture-note";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import { getAccent } from "@/constants/accent-colors";
import { castAvatarFor } from "@/lib/series-presentation";
import type { SeasonCastMember } from "@/lib/hooks/use-story-arc";
import { LessonCheckCards } from "@/components/lesson/lesson-check-card";
import { groupByAnchor, groupCulturalNotesByAnchor } from "@/lib/lesson-culture-anchor";
import { useSavePhrase } from "@/lib/hooks/use-phrase-bank";
import { fonts } from "@/constants/typography";
import { localize } from "@/lib/localize";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { hapticTap } from "@/lib/haptics";
import type { CulturalNote, LessonCheck, TranscriptSegment } from "@/types";

/** Turn a cast id ("izon-cast-mama-seibi" | "SPEAKER_A") into a display name. */
function speakerLabel(id?: string | null): string | null {
  if (!id) return null;
  const name = id.replace(/^[a-z]{2,3}-cast-/i, "").replace(/[_-]/g, " ").trim();
  if (!name) return null;
  return name.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

interface Props {
  segments: TranscriptSegment[];
  /** Overline shown above the lines, e.g. "TRANSCRIPT" or "LYRICS". */
  label?: string;
  /** Bounds the inner scroll so auto-follow stays inside the transcript card. */
  maxHeight?: number;
  /** Lesson-specific culture beats, surfaced inline at the segment they explain. */
  culturalNotes?: CulturalNote[];
  /** In-lesson checks, surfaced inline at the segment they fire after. */
  checks?: LessonCheck[];
  /** Enables the per-line bookmark that saves a sentence into review. */
  lessonId?: string;
  /**
   * The season's cast (from `GET /story-arcs/arc/:id`), used to give each
   * speaker their avatar + accent. Speakers outside the cast — and callers with
   * no season context — fall back to a neutral avatar.
   */
  cast?: SeasonCastMember[];
}

/**
 * Transcript tightly synced to playback. The currently-spoken line lifts into an
 * accented card and, within it, the current word is highlighted in bronze as the
 * audio advances (word timing is interpolated across each segment's span, since
 * the data is line-timed rather than word-timed). Tapping a line seeks to it; the
 * auto-follow toggle keeps the active line scrolled into view.
 */
export function SyncedTranscript({ segments, label = "TRANSCRIPT", maxHeight = 380, culturalNotes, checks, lessonId, cast }: Props) {
  const M = useMuseumTheme();
  const { progress, seekTo, currentTrackId, shadowSegment, setShadowLoop } = useAudioStore();
  const { uiLanguage } = useUiLanguageStore();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const amber = getAccent("amber").solid;
  const scrollRef = useRef<ScrollView>(null);
  const lineY = useRef<Record<number, number>>({});
  const [autoFollow, setAutoFollow] = useState(true);
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const savePhrase = useSavePhrase();
  const [savedLines, setSavedLines] = useState<Set<number>>(new Set());
  // Word tapped on the ACTIVE line — opens inline, in-flow, so looking a word
  // up doesn't cover the transcript or pause playback (see InlineWordPopover).
  const [activeLookupWord, setActiveLookupWord] = useState<string | null>(null);

  const activeIndex = useMemo(
    () => segments.findIndex((s) => progress >= s.startTime && progress < s.endTime),
    [segments, progress]
  );

  const notesByAnchor = useMemo(
    () => groupCulturalNotesByAnchor(culturalNotes, segments.length - 1),
    [culturalNotes, segments.length]
  );
  const checksByAnchor = useMemo(
    () => groupByAnchor(checks, segments.length - 1),
    [checks, segments.length]
  );

  // The active line changed — drop any open inline popover so it doesn't
  // linger under a line that's no longer being read.
  useEffect(() => {
    setActiveLookupWord(null);
  }, [activeIndex]);

  // The active word's ordinal within the active line, by interpolated position.
  const activeWordOrdinal = useMemo(() => {
    if (activeIndex < 0) return -1;
    const seg = segments[activeIndex];
    const span = Math.max(0.001, seg.endTime - seg.startTime);
    const frac = Math.max(0, Math.min(0.999, (progress - seg.startTime) / span));
    const wordCount = seg.text.trim().split(/\s+/).filter(Boolean).length;
    return Math.min(wordCount - 1, Math.floor(frac * wordCount));
  }, [activeIndex, segments, progress]);

  // Keep the active line in view while auto-follow is on.
  useEffect(() => {
    if (!autoFollow || activeIndex < 0) return;
    const y = lineY.current[activeIndex];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 88), animated: true });
  }, [activeIndex, autoFollow]);

  const handleLinePress = (seg: TranscriptSegment) => {
    hapticTap();
    if (currentTrackId) seekTo(seg.startTime);
  };

  // Toggle a per-line repeat loop: the store seeks back to startTime whenever
  // playback crosses endTime, so the phrase repeats until looping is turned off.
  const handleLoopPress = (seg: TranscriptSegment, e: GestureResponderEvent) => {
    e.stopPropagation();
    hapticTap();
    const isLooping = shadowSegment?.startTime === seg.startTime;
    if (isLooping) {
      setShadowLoop(null);
    } else {
      setShadowLoop({ startTime: seg.startTime, endTime: seg.endTime });
      if (currentTrackId) seekTo(seg.startTime);
    }
  };

  return (
    <View>
      {/* Section header with auto-follow toggle */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View style={{ width: 16, height: 1, backgroundColor: M.border }} />
        <Text
          style={{
            marginLeft: 8,
            fontFamily: fonts.headingMedium,
            fontSize: 9,
            letterSpacing: 1.8,
            color: M.accent,
          }}
        >
          {label}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => {
            hapticTap();
            setAutoFollow((v) => !v);
          }}
          hitSlop={8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            borderRadius: 999,
            paddingHorizontal: 11,
            paddingVertical: 5,
            backgroundColor: autoFollow ? M.accent : "transparent",
            borderWidth: 1,
            borderColor: autoFollow ? M.accent : M.border,
          }}
          accessibilityRole="switch"
          accessibilityState={{ checked: autoFollow }}
          accessibilityLabel="Auto-follow transcript"
        >
          <IconSymbol name="arrow.down" size={12} color={autoFollow ? MUSEUM.parchment : M.muted} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: autoFollow ? MUSEUM.parchment : M.muted }}>
            Auto-follow
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ maxHeight }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {segments.map((seg, index) => {
          const isActive = index === activeIndex;
          const isLooping = shadowSegment?.startTime === seg.startTime;
          const translation = localize(seg.translation, uiLanguage);
          const tokens = seg.text.split(/(\s+)/);
          let wordOrdinal = -1;
          // Show a speaker label when it changes from the previous line (groups
          // consecutive same-speaker lines into a readable audio-drama script).
          const speaker = speakerLabel(seg.speaker);
          const showSpeaker = !!speaker && seg.speaker !== segments[index - 1]?.speaker;
          const castAvatar = castAvatarFor(cast, seg.speaker);
          const castAccent = getAccent(castAvatar.hue);
          const notesHere = notesByAnchor[index];
          const checksHere = checksByAnchor[index];

          return (
            <View key={seg.id}>
              {showSpeaker ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: index === 0 ? 0 : 8, marginBottom: 4, marginLeft: 2 }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: castAccent.bg,
                      borderWidth: 1,
                      borderColor: castAccent.border,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "800", color: castAccent.solid }}>{castAvatar.initial}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase", color: M.accent }}>
                    {speaker}
                  </Text>
                </View>
              ) : null}
            <Pressable
              onPress={() => handleLinePress(seg)}
              onLayout={(e: LayoutChangeEvent) => {
                lineY.current[index] = e.nativeEvent.layout.y;
              }}
              style={{
                marginBottom: 8,
                paddingLeft: 14,
                paddingRight: currentTrackId ? 40 : 14,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: isLooping
                  ? `${amber}22`
                  : isActive
                  ? M.accentGlow
                  : "transparent",
                borderWidth: 1,
                borderColor: isLooping ? amber : isActive ? M.accentBorder : "transparent",
                borderLeftWidth: isLooping || isActive ? 3 : 1,
                borderLeftColor: isLooping ? amber : isActive ? M.accent : "transparent",
              }}
              accessibilityRole="button"
              accessibilityLabel={`Jump to: ${seg.text}`}
            >
              <Text style={{ fontSize: 17, lineHeight: 26, color: isActive ? M.text : M.sub }}>
                {tokens.map((tok, i) => {
                  if (/^\s*$/.test(tok)) return tok || null;
                  wordOrdinal += 1;
                  const isWordActive = isActive && wordOrdinal === activeWordOrdinal;
                  return (
                    <Text
                      key={`${seg.startTime}-${i}`}
                      // The active line is being read right now — a single tap opens
                      // the inline popover without interrupting playback. Other
                      // lines keep long-press, since they're not mid-utterance.
                      onPress={isActive ? () => {
                        hapticTap();
                        setLookupWord(null);
                        setActiveLookupWord((w) => (w === tok ? null : tok));
                      } : undefined}
                      onLongPress={!isActive ? () => {
                        hapticTap();
                        setActiveLookupWord(null);
                        setLookupWord(tok);
                      } : undefined}
                      suppressHighlighting
                      style={{
                        color: isWordActive ? M.accent : undefined,
                        fontWeight: isWordActive ? "800" : isActive ? "600" : "400",
                      }}
                    >
                      {tok}
                    </Text>
                  );
                })}
              </Text>
              {seg.roman ? (
                <Text style={{ marginTop: 3, fontSize: 12, fontStyle: "italic", color: isActive ? M.sub : M.muted }}>
                  {seg.roman}
                </Text>
              ) : null}
              {translation ? (
                <Text style={{ marginTop: 4, fontSize: 13, color: isActive ? M.accent : M.muted }}>
                  {translation}
                </Text>
              ) : null}
              {isActive && activeLookupWord ? (
                <InlineWordPopover
                  word={activeLookupWord}
                  languageId={selectedLanguageId}
                  onClose={() => setActiveLookupWord(null)}
                />
              ) : null}
              {currentTrackId ? (
                <Pressable
                  onPress={(e) => handleLoopPress(seg, e)}
                  hitSlop={10}
                  style={{ position: "absolute", right: 12, top: 12 }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isLooping }}
                  accessibilityLabel={isLooping ? "Stop repeating this line" : "Repeat this line"}
                >
                  <IconSymbol name="repeat.1" size={16} color={isLooping ? amber : M.muted} />
                </Pressable>
              ) : null}
              {lessonId ? (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    if (savedLines.has(index)) return;
                    setSavedLines((prev) => new Set(prev).add(index));
                    savePhrase.mutate({
                      languageId: selectedLanguageId,
                      lessonId,
                      text: seg.text,
                      translation: localize(seg.translation, uiLanguage) || null,
                    });
                  }}
                  hitSlop={10}
                  style={{ position: "absolute", right: currentTrackId ? 36 : 12, top: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={savedLines.has(index) ? "Saved to review" : "Save this line to review"}
                >
                  <IconSymbol name={savedLines.has(index) ? "bookmark.fill" : "bookmark"} size={15} color={savedLines.has(index) ? M.accent : M.muted} />
                </Pressable>
              ) : null}
            </Pressable>
              {checksHere ? <LessonCheckCards checks={checksHere} /> : null}
              {notesHere ? <CulturalNoteCards languageId={selectedLanguageId} notes={notesHere} /> : null}
            </View>
          );
        })}
        <View style={{ height: 12 }} />
      </ScrollView>

      <Text style={{ marginTop: 6, fontSize: 11, color: M.muted, textAlign: "center" }}>
        Tap the current word, or hold any other, to look it up
      </Text>

      <WordLookupSheet
        word={lookupWord}
        languageId={selectedLanguageId}
        onClose={() => setLookupWord(null)}
      />
    </View>
  );
}
