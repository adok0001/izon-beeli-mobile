/**
 * Yoruba lessons — course-4 (First Words) · course-5 (Oral Tradition)
 */
import type { LessonData } from "./types";

export const YORUBA_LESSONS: LessonData[] = [
  // ── Yoruba Basics (course-4) ──────────────────────────────────────────
  {
    id: "lesson-9", courseId: "course-4", title: "Adé Goes to Market",
    description: "Follow young Adé as he greets neighbors on his way to Oja Oba, the king's market.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", duration: 30, order: 1,
    transcript: [
      { id: "ty1", startTime: 0, endTime: 3.5, text: "Ọmọ ọja kan jí ni kutukutu owurọ", translation: "A trader's son woke up early one morning" },
      { id: "ty2", startTime: 3.5, endTime: 7, text: "E kaaro o! ó kí iya rẹ", translation: "Good morning! he greeted his mother" },
      { id: "ty3", startTime: 7, endTime: 11, text: "Bawo ni, ọmọ mi? iya rẹ bi", translation: "How are you, my child? his mother asked" },
      { id: "ty4", startTime: 11, endTime: 15, text: "Mo wa daadaa. Mo fẹ lọ si ọja", translation: "I am fine. I want to go to the market" },
      { id: "ty5", startTime: 15, endTime: 19, text: "Oruko mi ni Adé, ó sọ fun alajapa kan", translation: "My name is Adé, he told a stranger" },
      { id: "ty6", startTime: 19, endTime: 23, text: "Nibo lo n lo? alajapa naa bi", translation: "Where are you going? the stranger asked" },
      { id: "ty7", startTime: 23, endTime: 27, text: "Mo n lo si ọja. E se pupo!", translation: "I am going to the market. Thank you very much!" },
      { id: "ty8", startTime: 27, endTime: 30, text: "O dabo! Adé yọ si ọja", translation: "Goodbye! Adé smiled as he reached the market" },
    ],
  },
  { id: "lesson-10", courseId: "course-4", title: "Counting Cowries", description: "Adé's mother teaches him to count cowrie shells at her market stall.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", duration: 195, order: 2, transcript: [] },
  { id: "lesson-11", courseId: "course-4", title: "Adé Meets the Family", description: "Adé introduces a new friend to his large Yoruba family at a naming ceremony.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", duration: 220, order: 3, transcript: [] },

  // ── Yoruba Proverbs (course-5) ────────────────────────────────────────
  { id: "lesson-12", courseId: "course-5", title: "The Patient Farmer", description: "An elder teaches patience through Yoruba proverbs as a young farmer struggles with his harvest.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", duration: 260, order: 1, transcript: [] },
  { id: "lesson-13", courseId: "course-5", title: "The Selfish Chief", description: "A village debates whether a chief who hoards grain deserves their loyalty — proverbs about community.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", duration: 240, order: 2, transcript: [] },
];
