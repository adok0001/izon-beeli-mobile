import { IconSymbol } from "@/components/ui/icon-symbol";
import { ShareModal } from "@/components/share/share-modal";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useProverbs } from "@/lib/hooks/use-proverbs";
import { getLanguageName } from "@/lib/mock-data";
import type { Proverb } from "@/types";
import { Audio } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "@/components/loading-screen";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ProverbCard({
  proverb,
  languageId,
}: {
  proverb: Proverb;
  languageId: string;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const handleAudio = useCallback(async () => {
    if (!proverb.audioUrl) return;
    try {
      if (playing) {
        await soundRef.current?.pauseAsync();
        setPlaying(false);
        return;
      }
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync({ uri: proverb.audioUrl });
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded && s.didJustFinish) {
            setPlaying(false);
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
        soundRef.current = sound;
      }
      await soundRef.current?.playAsync();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [proverb.audioUrl, playing]);

  return (
    <View
      style={{
        marginBottom: 12, borderRadius: 16, backgroundColor: M.card,
        borderWidth: 1, borderColor: M.border,
        borderLeftWidth: 4, borderLeftColor: M.accent,
        padding: 16,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600", fontStyle: "italic", color: M.text }}>
        &ldquo;{proverb.text}&rdquo;
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 18, color: M.sub }}>
        {proverb.translation}
      </Text>

      {expanded && (
        <View style={{ marginTop: 12, borderRadius: 8, backgroundColor: M.accentGlow, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: M.accentBorder }}>
          <Text style={{ fontSize: 12, lineHeight: 17, color: M.sub }}>
            {proverb.meaning}
          </Text>
          {proverb.literal && proverb.literal !== proverb.translation && (
            <Text style={{ marginTop: 4, fontSize: 11, fontStyle: "italic", color: M.muted }}>
              Literal: {proverb.literal}
            </Text>
          )}
        </View>
      )}

      {proverb.relatedLessonId && (
        <Pressable
          onPress={() => router.push(`/lesson/${proverb.relatedLessonId}` as any)}
          style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 }}
          className="active:opacity-70"
        >
          <IconSymbol name="book.fill" size={12} color={M.accent} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: M.accent }}>
            {t("proverbs.practiceInLesson")}
          </Text>
        </Pressable>
      )}

      <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <IconSymbol
            name={expanded ? "chevron.up" : "chevron.down"}
            size={12}
            color={M.accent}
          />
          <Text style={{ fontSize: 12, color: M.accent }}>
            {expanded ? t("proverbs.less") : t("proverbs.meaning")}
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {proverb.audioUrl && (
            <Pressable
              onPress={handleAudio}
              hitSlop={8}
              style={{
                width: 32, height: 32, borderRadius: 16,
                alignItems: "center", justifyContent: "center",
                backgroundColor: playing ? M.accent : M.accentGlow,
                borderWidth: 1, borderColor: playing ? M.accent : M.accentBorder,
              }}
            >
              <IconSymbol
                name={playing ? "pause.fill" : "play.fill"}
                size={14}
                color={playing ? M.ink : M.accent}
              />
            </Pressable>
          )}
          <Pressable
            onPress={() => setShareVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("share.shareButton")}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={M.sub} />
          </Pressable>
        </View>
      </View>

      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        data={{
          template: "proverb",
          languageId,
          text: proverb.text,
          translation: proverb.translation,
          language: languageId,
          audioUrl: proverb.audioUrl,
        }}
      />
    </View>
  );
}

export default function ProverbsScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { languageId } = useLocalSearchParams<{ languageId: string }>();
  const { data: proverbs = [], isLoading } = useProverbs(languageId ?? "");
  const languageName = getLanguageName(languageId ?? "");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: `${languageName} ${t("proverbs.titleSuffix")}`,
          headerBackTitle: "Back",
        }}
      />

      {isLoading ? (
        <LoadingScreen />
      ) : proverbs.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder, marginBottom: 16 }}>
            <IconSymbol name="text.quote" size={28} color={M.accent} />
          </View>
          <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "700", color: M.text }}>
            {t("proverbs.noProverbs")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={proverbs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProverbCard proverb={item} languageId={languageId ?? ""} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
