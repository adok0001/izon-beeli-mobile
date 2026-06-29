import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View, type LayoutChangeEvent } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import { fonts } from "@/constants/typography";
import { localize } from "@/lib/localize";
import { useAudioStore } from "@/store/audio-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { hapticTap } from "@/lib/haptics";
import type { TranscriptSegment } from "@/types";

interface Props {
  segments: TranscriptSegment[];
  /** Overline shown above the lines, e.g. "TRANSCRIPT" or "LYRICS". */
  label?: string;
  /** Bounds the inner scroll so auto-follow stays inside the transcript card. */
  maxHeight?: number;
}

/**
 * Transcript tightly synced to playback. The currently-spoken line lifts into an
 * accented card and, within it, the current word is highlighted in bronze as the
 * audio advances (word timing is interpolated across each segment's span, since
 * the data is line-timed rather than word-timed). Tapping a line seeks to it; the
 * auto-follow toggle keeps the active line scrolled into view.
 */
export function SyncedTranscript({ segments, label = "TRANSCRIPT", maxHeight = 380 }: Props) {
  const M = useMuseumTheme();
  const { progress, seekTo, currentTrackId } = useAudioStore();
  const { uiLanguage } = useUiLanguageStore();
  const scrollRef = useRef<ScrollView>(null);
  const lineY = useRef<Record<number, number>>({});
  const [autoFollow, setAutoFollow] = useState(true);

  const activeIndex = useMemo(
    () => segments.findIndex((s) => progress >= s.startTime && progress < s.endTime),
    [segments, progress]
  );

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
          const translation = localize(seg.translation, uiLanguage);
          const tokens = seg.text.split(/(\s+)/);
          let wordOrdinal = -1;

          return (
            <Pressable
              key={seg.id}
              onPress={() => handleLinePress(seg)}
              onLayout={(e: LayoutChangeEvent) => {
                lineY.current[index] = e.nativeEvent.layout.y;
              }}
              style={{
                marginBottom: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: isActive ? M.accentGlow : "transparent",
                borderWidth: 1,
                borderColor: isActive ? M.accentBorder : "transparent",
                borderLeftWidth: isActive ? 3 : 1,
                borderLeftColor: isActive ? M.accent : "transparent",
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
                      key={i}
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
              {translation ? (
                <Text style={{ marginTop: 4, fontSize: 13, color: isActive ? M.accent : M.muted }}>
                  {translation}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}
