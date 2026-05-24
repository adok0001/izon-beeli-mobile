import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/loading-screen";
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

export default function StoryScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
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
        <Stack.Screen options={{ title: "Story Mode" }} />
        <LoadingScreen color="#f59e0b" />
      </>
    );
  }

  if (!story) {
    return (
      <>
        <Stack.Screen options={{ title: "Story Mode" }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <IconSymbol name="book.fill" size={48} color="#d1d5db" />
          <Text className="mt-4 text-base text-neutral-400 dark:text-neutral-500">
            No story available for this course.
          </Text>
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
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={["bottom"]}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <View className="px-5 pt-4">
            <Text className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
              {story.description}
            </Text>
          </View>

          {/* Progress bar */}
          <StoryProgressBar
            chapters={story.chapters}
            completedIds={completedIds}
            currentChapterId={currentChapter?.id}
          />

          {/* Chapter list */}
          <View className="mt-2 px-5">
            {sorted.map((chapter) => {
              const unlocked = isChapterUnlocked(
                story.id,
                chapter.id,
                story.chapters
              );
              const completed = completedIds.includes(chapter.id);
              const isCurrent = currentChapter?.id === chapter.id;

              return (
                <Pressable
                  key={chapter.id}
                  onPress={() => handleChapterPress(chapter)}
                  disabled={!unlocked}
                  className={`mb-3 rounded-2xl border p-4 active:opacity-80 ${
                    isCurrent
                      ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
                      : completed
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                      : unlocked
                      ? "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                      : "border-neutral-100 bg-neutral-100 opacity-50 dark:border-neutral-800 dark:bg-neutral-850"
                  }`}
                >
                  <View className="flex-row items-center">
                    {/* Status icon */}
                    <View className="mr-3">
                      {completed ? (
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={24}
                          color="#22c55e"
                        />
                      ) : unlocked ? (
                        <IconSymbol
                          name="play.fill"
                          size={24}
                          color={isCurrent ? "#f59e0b" : "#9ca3af"}
                        />
                      ) : (
                        <IconSymbol name="circle" size={24} color="#d1d5db" />
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                        Chapter {chapter.order}
                      </Text>
                      <Text
                        className={`text-base font-bold ${
                          unlocked
                            ? "text-neutral-900 dark:text-white"
                            : "text-neutral-400 dark:text-neutral-600"
                        }`}
                      >
                        {chapter.title}
                      </Text>
                    </View>

                    {unlocked && (
                      <IconSymbol
                        name="chevron.right"
                        size={16}
                        color="#9ca3af"
                      />
                    )}
                  </View>

                  {/* Show a preview of the narrative for unlocked, uncompleted chapters */}
                  {unlocked && !completed && (
                    <Text
                      className="mt-2 text-sm text-neutral-500 dark:text-neutral-400"
                      numberOfLines={2}
                    >
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
            <View className="flex-1 justify-end bg-black/50">
              <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-neutral-900">
                <Text className="mb-1 text-sm font-semibold uppercase tracking-wide text-green-500 dark:text-green-400">
                  Chapter {outroChapter.order} Complete
                </Text>
                <Text className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
                  {outroChapter.title}
                </Text>
                <View className="mb-6 rounded-2xl bg-green-50 p-4 dark:bg-green-950/30">
                  <Text className="text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {outroChapter.narrativeOutro}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setOutroChapter(null)}
                  className="items-center rounded-xl bg-amber-500 py-4 active:opacity-80 dark:bg-amber-600"
                >
                  <Text className="text-base font-bold text-white">
                    Continue
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
