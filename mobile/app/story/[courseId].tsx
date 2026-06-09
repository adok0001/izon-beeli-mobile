import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StoryProgressBar } from "@/components/story/story-progress-bar";
import { ChapterIntro } from "@/components/story/chapter-intro";
import { useStoryArc } from "@/lib/hooks/use-story-arc";
import { useStoryStore } from "@/store/story-store";
import type { StoryChapter } from "@/types";
import { useTranslation } from "react-i18next";

export default function StoryScreen() {
  const M = useMuseumTheme();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: story, isLoading } = useStoryArc(courseId ?? "");

  const hydrate = useStoryStore((s) => s.hydrate);
  const hydrated = useStoryStore((s) => s._hydrated);
  const completedChapters = useStoryStore((s) => s.completedChapters);
  const completeChapter = useStoryStore((s) => s.completeChapter);
  const isChapterUnlocked = useStoryStore((s) => s.isChapterUnlocked);

  const [selectedChapter, setSelectedChapter] = useState<StoryChapter | null>(
    null
  );
  const [outroChapter, setOutroChapter] = useState<StoryChapter | null>(null);

  useEffect(() => {
    hydrate();
  }, []);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: t("educator.story.screenTitle") }} />
        <LoadingScreen color="#f59e0b" />
      </>
    );
  }

  if (!story) {
    return (
      <>
        <Stack.Screen options={{ title: t("educator.story.screenTitle") }} />
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: M.bg }}>
          <IconSymbol name="book.fill" size={48} color={M.muted} />
          <Text style={{ marginTop: 16, fontSize: 16, color: M.sub }}>{t("educator.story.noStoryAvailable")}</Text>
        </SafeAreaView>
      </>
    );
  }

  const completedIds = completedChapters[story.id] ?? [];
  const sorted = [...story.chapters].sort((a, b) => a.order - b.order);

  // Determine the current chapter: first uncompleted and unlocked chapter
  const currentChapter = sorted.find(
    (ch) =>
      !completedIds.includes(ch.id) &&
      isChapterUnlocked(story.id, ch.id, story.chapters)
  );

  const handleChapterPress = (chapter: StoryChapter) => {
    if (!isChapterUnlocked(story.id, chapter.id, story.chapters)) return;

    if (completedIds.includes(chapter.id)) {
      // Already completed -- go directly to lesson
      router.push(`/lesson/${chapter.lessonId}`);
    } else {
      // Show intro modal
      setSelectedChapter(chapter);
    }
  };

  const handleStartLesson = () => {
    if (!selectedChapter) return;
    const chapterToComplete = selectedChapter;
    setSelectedChapter(null);

    // Mark chapter complete and show outro when they come back
    completeChapter(story.id, chapterToComplete.id);
    setOutroChapter(chapterToComplete);

    router.push(`/lesson/${chapterToComplete.lessonId}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: story.title }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Text style={{ fontSize: 16, lineHeight: 24, color: M.sub }}>{story.description}</Text>
          </View>

          <StoryProgressBar
            chapters={story.chapters}
            completedIds={completedIds}
            currentChapterId={currentChapter?.id}
          />

          <View style={{ marginTop: 8, paddingHorizontal: 20 }}>
            {sorted.map((chapter) => {
              const unlocked = isChapterUnlocked(story.id, chapter.id, story.chapters);
              const completed = completedIds.includes(chapter.id);
              const isCurrent = currentChapter?.id === chapter.id;

              const borderColor = isCurrent ? M.accentBorder : completed ? M.successBorder : unlocked ? M.border : M.border;
              const bgColor = isCurrent ? M.accentGlow : completed ? M.successBg : M.card;

              return (
                <Pressable
                  key={chapter.id}
                  onPress={() => handleChapterPress(chapter)}
                  disabled={!unlocked}
                  style={{ marginBottom: 12, borderRadius: 16, borderWidth: 1, padding: 16, borderColor, backgroundColor: bgColor, opacity: unlocked ? 1 : 0.4 }}
                  className={unlocked ? "active:opacity-80" : ""}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ marginRight: 12 }}>
                      {completed ? (
                        <IconSymbol name="checkmark.circle.fill" size={24} color={M.success} />
                      ) : unlocked ? (
                        <IconSymbol name="play.fill" size={24} color={isCurrent ? M.accent : M.muted} />
                      ) : (
                        <IconSymbol name="circle" size={24} color={M.border} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: M.muted }}>
                        {t("educator.story.chapterLabel", { number: chapter.order })}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: unlocked ? M.text : M.muted }}>
                        {chapter.title}
                      </Text>
                    </View>

                    {unlocked && <IconSymbol name="chevron.right" size={16} color={M.muted} />}
                  </View>

                  {unlocked && !completed && (
                    <Text style={{ marginTop: 8, fontSize: 13, color: M.sub }} numberOfLines={2}>
                      {chapter.narrativeIntro}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Chapter intro modal */}
        {selectedChapter && (
          <ChapterIntro
            visible={!!selectedChapter}
            chapter={selectedChapter}
            onStart={handleStartLesson}
            onClose={() => setSelectedChapter(null)}
          />
        )}

        {/* Chapter outro modal */}
        {outroChapter && (
          <Modal
            visible={!!outroChapter}
            animationType="slide"
            transparent
            onRequestClose={() => setOutroChapter(null)}
          >
            <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
              <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: M.card, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24, borderWidth: 1, borderColor: M.border }}>
                <Text style={{ marginBottom: 4, fontSize: 13, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: M.success }}>
                  {t("educator.story.chapterComplete", { number: outroChapter.order })}
                </Text>
                <Text style={{ marginBottom: 16, fontSize: 24, fontWeight: "700", color: M.text }}>
                  {outroChapter.title}
                </Text>
                <View style={{ marginBottom: 24, borderRadius: 16, backgroundColor: M.successBg, padding: 16, borderWidth: 1, borderColor: M.successBorder }}>
                  <Text style={{ fontSize: 16, lineHeight: 24, color: M.sub }}>
                    {outroChapter.narrativeOutro}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setOutroChapter(null)}
                  style={{ alignItems: "center", borderRadius: 12, backgroundColor: M.accent, paddingVertical: 16 }}
                  className="active:opacity-80"
                >
                  <Text style={{ fontSize: 16, fontWeight: "700", color: M.ink }}>
                    {t("educator.story.continueButton")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </>
  );
}
