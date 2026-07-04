import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";
import { getCourseTypeColors } from "@/constants/course-colors";
import { COURSE_EMOJI } from "@/lib/journey";
import { CourseScene } from "@/components/learn/journey-scenery";
import { MUSEUM } from "@/lib/use-museum-theme";
import type { Course } from "@/types";

const HERO_HEIGHT = 200;
const THUMB_SIZE = 72;

interface CourseArtworkProps {
  course: Course;
  size?: "hero" | "thumb";
  height?: number;
}

function accentFor(course: Course): string {
  const tick = getCourseTypeColors(course.courseType).tickActive;
  return tick && tick !== "#737373" ? tick : MUSEUM.accent;
}

function gradientColors(accent: string): [string, string] {
  return [`${accent}55`, `${accent}22`];
}

export function CourseArtwork({ course, size = "hero", height }: CourseArtworkProps) {
  const isHero = size === "hero";
  const resolvedHeight = height ?? (isHero ? HERO_HEIGHT : THUMB_SIZE);
  const accent = accentFor(course);
  const emoji = (course.courseType && COURSE_EMOJI[course.courseType]) || "📍";

  if (course.imageUrl) {
    return (
      <View
        style={{
          width: "100%",
          height: resolvedHeight,
          borderRadius: isHero ? 0 : 12,
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: course.imageUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)"]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" }}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors(accent)}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: "100%",
        height: resolvedHeight,
        borderRadius: isHero ? 0 : 12,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isHero ? (
        <CourseScene courseType={course.courseType} width={300} />
      ) : null}
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
          width: isHero ? 64 : 40,
          height: isHero ? 64 : 40,
          borderRadius: isHero ? 32 : 20,
          backgroundColor: `${accent}33`,
          borderWidth: 2,
          borderColor: `${accent}88`,
        }}
      >
        <Text style={{ fontSize: isHero ? 28 : 18 }}>{emoji}</Text>
      </View>
    </LinearGradient>
  );
}
