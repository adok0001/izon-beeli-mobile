import type { StoryArc } from "@/types";
import { IZON_BASICS_STORY } from "./izon-basics";

const STORY_REGISTRY: Record<string, StoryArc> = {
  "course-izon-fw": IZON_BASICS_STORY,
};

export function getStoryForCourse(courseId: string): StoryArc | undefined {
  return STORY_REGISTRY[courseId];
}

export function getAllStoryArcs(): StoryArc[] {
  return Object.values(STORY_REGISTRY);
}
