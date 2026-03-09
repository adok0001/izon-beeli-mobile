/**
 * Izon Stories — course-2
 * Traditional folktales and cultural narratives for listening comprehension.
 */
import type { LessonData } from "./types";

export const IZON_STORIES_LESSONS: LessonData[] = [
  {
    id: "lesson-6",
    courseId: "course-2",
    title: "The Akasa Forest",
    description: "A grandfather tells his grandchild about the sacred Akasa forest and the ancestors who dwell within.",
    audioUrl: null,
    duration: 5,
    order: 1,
    transcript: [
      { id: "t6-1", startTime: 0, endTime: 3, text: "Kosu dada, Akasa ye denghi?", translation: "Grandpa, where is Akasa?" },
      { id: "t6-2", startTime: 3, endTime: 7, text: "Akasa ye bou tibi kpo. Tẹmẹ bou ye bei.", translation: "Akasa is deep in the forest. It is a spirit place." },
      { id: "t6-3", startTime: 7, endTime: 11, text: "Arị mu digha-a? Arị di mi!", translation: "Can I go there? I want to see it!" },
      { id: "t6-4", startTime: 11, endTime: 15, text: "Ọdudu ẹrẹ kịịrịị ye-a? Tẹmẹbọ bi mene.", translation: "Is your heart pure? The spirits will test you." },
      { id: "t6-5", startTime: 15, endTime: 19, text: "Tịn kẹnị seri mene bei kpo — Ịzọn tịn.", translation: "A great tree stands there — the Ijaw Tree." },
      { id: "t6-6", startTime: 19, endTime: 23, text: "Kosu daubọ bei kpo gba mene wuni kpo.", translation: "Our ancestors speak to us through that tree." },
      { id: "t6-7", startTime: 23, endTime: 27, text: "Arị dila! Arị bẹẹlị mi.", translation: "I understand! I want to learn more." },
      { id: "t6-8", startTime: 27, endTime: 31, text: "Doo, tubou ẹrẹ. Torụ angọ kụlụ bogha.", translation: "Good, my child. The river does not forget its source." },
    ],
  },
  {
    id: "lesson-7",
    courseId: "course-2",
    title: "The Water Spirit Festival",
    description: "A boy and his father prepare for the Owuamapu festival — learning about masks, colors, and dance.",
    audioUrl: null,
    duration: 5,
    order: 2,
    transcript: [
      { id: "t7-1", startTime: 0, endTime: 3.5, text: "Dada, beingbai Owuamapu uge ye?", translation: "Dad, is today the Water Spirit festival?" },
      { id: "t7-2", startTime: 3.5, endTime: 7, text: "Heén! Bo, wuni mu.", translation: "Yes! Come, let us go." },
      { id: "t7-3", startTime: 7, endTime: 11, text: "Dada, ịndị anyẹn bei ye denghi kpọ?", translation: "Dad, why are they wearing fish masks?" },
      { id: "t7-4", startTime: 11, endTime: 15, text: "Owuamapu beni kpo timi. Ịndị ye woi leleị.", translation: "Water spirits live in the river. Fish are their sign." },
      { id: "t7-5", startTime: 15, endTime: 19, text: "Kwa-kwa aru bei — denghi kpọ kwa-kwa?", translation: "That red cloth — why is it red?" },
      { id: "t7-6", startTime: 19, endTime: 23, text: "Kwa-kwa ye gbasi. Pena-pena ye ọdudu kịịrịị.", translation: "Red means strength. White means a pure heart." },
      { id: "t7-7", startTime: 23, endTime: 27, text: "Dirimo-a? Dirimo ye dein mọ tẹmẹ.", translation: "And black? Black means night and spirits." },
      { id: "t7-8", startTime: 27, endTime: 31, text: "Arị sẹị mi! Arị Ịzọn ye!", translation: "I want to dance! I am Izon!" },
    ],
  },
];
