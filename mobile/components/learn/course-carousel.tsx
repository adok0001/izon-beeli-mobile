import { useWindowDimensions, Pressable, ScrollView, Text, View } from "react-native";
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
      accessibilityLabel={
        completed > 0
          ? `${localize(course.title, uiLanguage)}, ${percent}% complete. Continue.`
          : `${localize(course.title, uiLanguage)}. Start.`
      }
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
          label={
            completed > 0
              ? t("learn.continueCta", { defaultValue: "Continue" })
              : t("learn.startShort", { defaultValue: "Start" })
          }
          onPress={onContinue}
          variant="primary"
          size="md"
          fullWidth
        />
      </View>
    </Pressable>
  );
}

const MAX_FEATURED = 5;

/**
 * Picks the courses to feature: the user's active in-progress courses first
 * (by course order), then recommended courses filling the remaining slots.
 * Recommendation prefers `userLevel` (from first-run onboarding, wired once
 * that signal lands) and falls back to beginner courses — the flagship Izon
 * spine for a brand-new user, since courses are already scoped to the user's
 * selected language.
 */
function pickFeaturedCourses(
  courses: Course[],
  lessons: Lesson[],
  completedIds: Set<string>,
  userLevel?: Course["level"]
) {
  const withProgress = courses.map((course) => ({
    course,
    prog: courseProgress(lessons, completedIds, course.id),
  }));
  const byOrder = (a: { course: Course }, b: { course: Course }) =>
    (a.course.order ?? 0) - (b.course.order ?? 0);

  const inProgress = withProgress
    .filter(({ prog }) => prog.completed > 0 && prog.completed < prog.total)
    .sort(byOrder);

  const leveled = userLevel
    ? withProgress.filter(({ course }) => course.level === userLevel)
    : withProgress.filter(({ course }) => course.level === "beginner");
  const recommendedPool = [...(leveled.length > 0 ? leveled : withProgress)].sort(byOrder);

  const seenIds = new Set<string>();
  return [...inProgress, ...recommendedPool]
    .filter(({ course }) => !seenIds.has(course.id) && seenIds.add(course.id))
    .slice(0, MAX_FEATURED);
}

interface CourseCarouselProps {
  courses: Course[];
  lessons: Lesson[];
  completedIds: Set<string>;
  /** User's chosen proficiency level from first-run onboarding. Optional until that flow lands. */
  userLevel?: Course["level"];
}

export function CourseCarousel({ courses, lessons, completedIds, userLevel }: CourseCarouselProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const nextCardPeek = CARD_GUTTER / 2;
  const cardWidth = screenWidth - CARD_GUTTER * 2 - nextCardPeek;

  if (courses.length === 0) return null;

  const featured = pickFeaturedCourses(courses, lessons, completedIds, userLevel);
  if (featured.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + nextCardPeek}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: CARD_GUTTER, gap: CARD_GUTTER / 2 }}
    >
      {featured.map(({ course, prog }) => (
        <CourseHeroCard
          key={course.id}
          course={course}
          completed={prog.completed}
          total={prog.total}
          onContinue={() =>
            router.push({ pathname: "/learn/course/[courseId]", params: { courseId: course.id } })
          }
          width={cardWidth}
        />
      ))}
    </ScrollView>
  );
}
