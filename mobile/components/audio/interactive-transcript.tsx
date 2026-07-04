import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, type GestureResponderEvent } from "react-native";
import { getAccent } from "@/constants/accent-colors";
import { localize } from "@/lib/localize";
import { useAudioStore } from "@/store/audio-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useLanguageStore } from "@/store/language-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordLookupSheet } from "@/components/audio/word-lookup-sheet";
import { CulturalNoteCards } from "@/components/lesson/lesson-culture-note";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { groupCulturalNotesByAnchor } from "@/lib/lesson-culture-anchor";
import type { TranscriptSegment } from "@/types";
import type { CulturalNote } from "@/lib/data/podcasts/podcast-types";

interface Props {
  segments: TranscriptSegment[];
  onSegmentPress?: (segment: TranscriptSegment) => void;
  /** Lesson-specific culture beats, surfaced inline at the segment they explain. */
  culturalNotes?: CulturalNote[];
}

/**
 * Plain (non-audio) transcript reader for episodes with no recording yet
 * (`audioUrl: null`). No player, no auto-follow — just the target-language
 * lines with translations and tap-to-look-up words, in Museum styling so it
 * doesn't read as a different, older product from the synced player below.
 */
export function InteractiveTranscript({ segments, onSegmentPress, culturalNotes }: Props) {
  const M = useMuseumTheme();
  const { progress, seekTo, currentTrackId, shadowSegment, setShadowLoop } = useAudioStore();
  const { uiLanguage } = useUiLanguageStore();
  const { selectedLanguageId } = useLanguageStore();
  const { data: dictEntries = [] } = useDictionary(selectedLanguageId);
  const scrollRef = useRef<ScrollView>(null);
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  // Flag to suppress parent segment-seek when a word was tapped
  const wordTappedRef = useRef(false);
  const amber = getAccent("amber").solid;

  // O(1) dictionary lookup set instead of O(n) .some() per word
  const dictWordSet = useMemo(
    () => new Set(dictEntries.map((e) => e.word.toLowerCase())),
    [dictEntries]
  );

  const notesByAnchor = useMemo(
    () => groupCulturalNotesByAnchor(culturalNotes, segments.length - 1),
    [culturalNotes, segments.length]
  );

  const activeIndex = segments.findIndex(
    (seg) => progress >= seg.startTime && progress < seg.endTime
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeIndex >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        y: Math.max(0, activeIndex * 80 - 100),
        animated: true,
      });
    }
  }, [activeIndex]);

  const handleWordPress = useCallback((word: string) => {
    wordTappedRef.current = true;
    setLookupWord(word);
  }, []);

  const handleSegmentPress = useCallback(
    (segment: TranscriptSegment) => {
      // Skip segment seek if a word was just tapped
      if (wordTappedRef.current) {
        wordTappedRef.current = false;
        return;
      }
      if (currentTrackId) {
        seekTo(segment.startTime);
      }
      onSegmentPress?.(segment);
    },
    [currentTrackId, seekTo, onSegmentPress]
  );

  const handleShadowLoop = useCallback(
    (segment: TranscriptSegment, e: GestureResponderEvent) => {
      e.stopPropagation();
      const isLooping = shadowSegment?.startTime === segment.startTime;
      if (isLooping) {
        setShadowLoop(null);
      } else {
        setShadowLoop({ startTime: segment.startTime, endTime: segment.endTime });
        if (currentTrackId) seekTo(segment.startTime);
      }
    },
    [shadowSegment, setShadowLoop, currentTrackId, seekTo]
  );

  if (segments.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 32 }}>
        <Text style={{ fontSize: 14, color: M.muted }}>No transcript available</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {segments.map((segment, index) => {
          const isActive = index === activeIndex;
          const words = segment.text.split(/(\s+)/);
          const isLoopingThisSegment = shadowSegment?.startTime === segment.startTime;
          const notesHere = notesByAnchor[index];

          return (
            <View key={segment.id}>
              <Pressable
                onPress={() => handleSegmentPress(segment)}
                style={{
                  position: "relative",
                  borderLeftWidth: 2,
                  borderLeftColor: isLoopingThisSegment ? amber : isActive ? M.accent : "transparent",
                  backgroundColor: isLoopingThisSegment ? `${amber}1F` : isActive ? M.accentGlow : "transparent",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    lineHeight: 24,
                    fontWeight: isLoopingThisSegment || isActive ? "700" : "400",
                    color: isLoopingThisSegment ? amber : isActive ? M.text : M.sub,
                  }}
                >
                  {words.map((w, i) => {
                    // Whitespace — render as-is
                    if (/^\s+$/.test(w)) return w;
                    const cleaned = w.toLowerCase().replace(/[.,!?;:'"]/g, "");
                    const inDict = dictWordSet.has(cleaned);
                    // All words are tappable; dictionary words get dotted underline
                    return (
                      <Text
                        key={i}
                        onPress={() => handleWordPress(w)}
                        suppressHighlighting
                        style={inDict ? { textDecorationLine: "underline", textDecorationStyle: "dotted" } : undefined}
                      >
                        {w}
                      </Text>
                    );
                  })}
                </Text>
                {localize(segment.translation, uiLanguage) ? (
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color: isLoopingThisSegment ? amber : isActive ? M.accent : M.muted,
                    }}
                  >
                    {localize(segment.translation, uiLanguage)}
                  </Text>
                ) : null}
                {segment.colorHex && (
                  <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }} accessible={false}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: M.border, backgroundColor: segment.colorHex }} />
                    <View style={{ height: 6, flex: 1, borderRadius: 3, borderWidth: 1, borderColor: M.border, backgroundColor: segment.colorHex, opacity: 0.3 }} />
                  </View>
                )}
                {currentTrackId && (
                  <Pressable
                    onPress={(e) => handleShadowLoop(segment, e)}
                    hitSlop={8}
                    style={{ position: "absolute", right: 12, top: 12 }}
                    accessibilityLabel={isLoopingThisSegment ? "Stop looping phrase" : "Loop this phrase"}
                  >
                    <IconSymbol name="repeat.1" size={16} color={isLoopingThisSegment ? amber : M.muted} />
                  </Pressable>
                )}
              </Pressable>

              {notesHere ? (
                <View style={{ paddingHorizontal: 4 }}>
                  <CulturalNoteCards languageId={selectedLanguageId} notes={notesHere} />
                </View>
              ) : null}
            </View>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>

      <WordLookupSheet word={lookupWord} languageId={selectedLanguageId} onClose={() => setLookupWord(null)} />
    </>
  );
}
