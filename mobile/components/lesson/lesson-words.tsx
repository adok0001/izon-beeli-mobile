import { ScrollView, View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import { localize } from "@/lib/localize";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import { LessonSectionHeader } from "@/components/lesson/lesson-section-header";
import { useAudioStore } from "@/store/audio-store";
import type { LessonWord, WordTone } from "@/types";
import type { UiLanguage } from "@/store/ui-language-store";

interface LessonWordsProps {
  vocab: LessonWord[];
  uiLanguage: UiLanguage;
  accentColor: string;
}

const TONE_LABELS: Record<WordTone, string> = {
  high: "tone_high",
  rising: "tone_rising",
  level: "tone_level",
  falling: "tone_falling",
};

function PlayButton({ onPress, playing }: { onPress: () => void; playing: boolean }) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: M.pillBg,
        borderWidth: 1,
        borderColor: M.border,
      }}
      accessibilityRole="button"
    >
      <Svg viewBox="0 0 24 24" width={13} height={13}>
        {playing
          ? <Path d="M6 5h3v14H6zm9 0h3v14h-3z" fill={MUSEUM.accentDark} />
          : <Path d="M8 5v14l11-7z" fill={MUSEUM.accentDark} />
        }
      </Svg>
    </Pressable>
  );
}

function WordCard({ word, uiLanguage, accentColor }: { word: LessonWord; uiLanguage: UiLanguage; accentColor: string }) {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const loadAndPlay = useAudioStore((s) => s.loadAndPlay);
  const togglePlayback = useAudioStore((s) => s.togglePlayback);
  const currentTrackId = useAudioStore((s) => s.currentTrackId);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const trackId = `vocab-${word.text}`;
  const isCurrentTrack = currentTrackId === trackId;

  const handlePlay = () => {
    if (!word.audioUrl) return;
    if (isCurrentTrack) {
      togglePlayback();
    } else {
      loadAndPlay(trackId, word.audioUrl, word.text, "");
    }
  };

  return (
    <View
      style={{
        width: 120,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: M.pillBg,
        borderWidth: 1,
        borderColor: M.border,
        gap: 6,
      }}
    >
      {word.tone ? (
        <Text
          style={{
            fontSize: 8,
            fontWeight: "800",
            letterSpacing: 1.6,
            color: accentColor,
          }}
        >
          {t(`lesson.${TONE_LABELS[word.tone]}`, { defaultValue: word.tone }).toUpperCase()}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>
          {word.text}
        </Text>
        {word.audioUrl ? (
          <PlayButton onPress={handlePlay} playing={isCurrentTrack && isPlaying} />
        ) : null}
      </View>
      <Text style={{ fontSize: 11, color: M.sub, lineHeight: 14 }} numberOfLines={2}>
        {localize(word.translation, uiLanguage)}
      </Text>
    </View>
  );
}

export function LessonWords({ vocab, uiLanguage, accentColor }: LessonWordsProps) {
  const { t } = useTranslation();
  if (!vocab.length) return null;

  return (
    <View style={{ paddingTop: 24 }}>
      <LessonSectionHeader label={t("lesson.newWords", { defaultValue: "New words" })} accentColor={accentColor} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, gap: 10 }}
      >
        {vocab.map((word, i) => (
          <WordCard key={i} word={word} uiLanguage={uiLanguage} accentColor={accentColor} />
        ))}
      </ScrollView>
    </View>
  );
}
