/**
 * Igbo lessons — course-6 (Basics)
 */
import type { LessonData } from "./types";

export const IGBO_LESSONS: LessonData[] = [
  {
    id: "lesson-14", courseId: "course-6", title: "Chidi's New Yam Festival",
    description: "Chidi arrives at his grandmother's village for Iri Ji — learning greetings along the way.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", duration: 30, order: 1,
    transcript: [
      { id: "ti1", startTime: 0, endTime: 3.5, text: "Ututu oma! Nne nne ya kpọrọ ya", translation: "Good morning! His grandmother called him" },
      { id: "ti2", startTime: 3.5, endTime: 7, text: "Aha m bu Chidi, ọ zara", translation: "My name is Chidi, he answered" },
      { id: "ti3", startTime: 7, endTime: 11, text: "Kedu ka i mere? Nne nne ya jụrụ", translation: "How are you? his grandmother asked" },
      { id: "ti4", startTime: 11, endTime: 15, text: "A di m mma! Taa bụ ụbọchị Iri Ji", translation: "I am fine! Today is the New Yam Festival" },
      { id: "ti5", startTime: 15, endTime: 19, text: "Dalu rinne, nne nne, maka nri a", translation: "Thank you very much, grandmother, for this food" },
      { id: "ti6", startTime: 19, endTime: 23, text: "Ebee ka i na aga? Nne nne ya jụrụ", translation: "Where are you going? his grandmother asked" },
      { id: "ti7", startTime: 23, endTime: 27, text: "Ana m aga n'ama — ebe ọgbakọ", translation: "I am going to the square — where the gathering is" },
      { id: "ti8", startTime: 27, endTime: 30, text: "Ka omesia! Jee nke oma!", translation: "See you later! Go well!" },
    ],
  },
  { id: "lesson-15", courseId: "course-6", title: "Sharing the Harvest", description: "Chidi helps count and divide yams for the feast — learning numbers through the harvest.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", duration: 185, order: 2, transcript: [] },
  { id: "lesson-16", courseId: "course-6", title: "The Family Gathering", description: "Chidi introduces visitors to his extended family at the Iri Ji feast.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", duration: 210, order: 3, transcript: [] },
];
