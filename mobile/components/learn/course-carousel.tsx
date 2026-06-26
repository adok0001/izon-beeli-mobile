import { useRef, useState } from "react";
import { useWindowDimensions, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CourseArtwork } from "@/components/learn/course-artwork";
import { courseProgress } from "@/lib/journey";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, Lesson } from "@/types";

const CARD_GUTTER = 20;

interface CourseHeroCardProps {
  course: Course;
  completed: number;
  total: number;
  onContinue: () => void;
  width: number;
}

function CourseHeroCard({ course, completed, total, onContinue, width }: CourseHeroCardProps) {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { t } = useTranslation();
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Pressable
      onPress={onContinue}
      style={{
        width,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${localize(course.title, uiLanguage)}, ${percent}% complete. Continue.`}
    >
      <CourseArtwork course={course} size="hero" />

      <View style={{ padding: 16, gap: 10 }}>
        <Text
          numberOfLines={2}
          style={{ fontSize: 17, fontWeight: "800", color: M.text, letterSpacing: -0.2, lineHeight: 22 }}
        >
          {localize(course.title, uiLanguage)}
        </Text>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, color: M.sub, fontWeight: "600" }}>
            {t("learn.percentComplete", { percent, defaultValue: "{{percent}}% Complete" })}
          </Text>
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: M.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${percent}%`,
                borderRadius: 2,
                backgroundColor: M.accent,
              }}
            />
          </View>
        </View>

        <Button
          label={t("learn.continueCta", { defaultValue: "Continue" })}
          onPress={onContinue}
          variant="primary"
          size="md"
          fullWidth
        />
      </View>
    </Pressable>
  );
}

interface CourseCarouselProps {
  courses: Course[];
  lessons: Lesson[];
  completedIds: Set<string>;
}

export function CourseCarousel({ courses, lessons, completedIds }: CourseCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Course>>(null);
  const M = useMuseumTheme();

  const cardWidth = screenWidth - CARD_GUTTER * 2;

  const handleContinue = (courseId: string) => {
    router.push({ pathname: "/learn/course/[courseId]", params: { courseId } });
  };

  const onScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 16));
    setActiveIndex(Math.max(0, Math.min(idx, courses.length - 1)));
  };

  if (courses.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      <FlatList
        ref={flatListRef}
        data={courses}
        horizontal
        pagingEnabled={false}
        snapToInterval={cardWidth + 16}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: CARD_GUTTER, gap: 16 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(c) => c.id}
        renderItem={({ item: course }) => {
          const prog = courseProgress(lessons, completedIds, course.id);
          return (
            <CourseHeroCard
              course={course}
              completed={prog.completed}
              total={prog.total}
              onContinue={() => handleContinue(course.id)}
              width={cardWidth}
            />
          );
        }}
      />
      {courses.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
          {courses.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeIndex ? M.accent : M.border,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
