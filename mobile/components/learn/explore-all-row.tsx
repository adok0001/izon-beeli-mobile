import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { CourseArtwork } from "@/components/learn/course-artwork";
import { SectionHeader } from "@/components/ui/section-header";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";

interface ExploreAllRowProps {
  courses: Course[];
}

export function ExploreAllRow({ courses }: ExploreAllRowProps) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();

  if (courses.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <SectionHeader title={t("learn.exploreAllCourses", { defaultValue: "Explore All Courses" })} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {courses.map((course) => (
          <Pressable
            key={course.id}
            onPress={() => router.push({ pathname: "/learn/course/[courseId]", params: { courseId: course.id } })}
            style={{ alignItems: "center", gap: 6, width: 72 }}
            accessibilityRole="button"
            accessibilityLabel={localize(course.title, uiLanguage)}
          >
            <View style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden" }}>
              <CourseArtwork course={course} size="thumb" />
            </View>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 10,
                fontWeight: "700",
                textAlign: "center",
                color: M.sub,
                lineHeight: 13,
              }}
            >
              {localize(course.title, uiLanguage)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
