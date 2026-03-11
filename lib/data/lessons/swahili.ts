/**
 * Swahili lessons — course-8 (First Words) · course-9 (Oral Tradition)
 */
import type { LessonData } from "./types";

export const SWAHILI_LESSONS: LessonData[] = [
  // ── Swahili Basics (course-8) ─────────────────────────────────────────
  {
    id: "lesson-19", courseId: "course-8", title: "Captain Baraka's Journey",
    description: "Follow Captain Baraka as he sails from Zanzibar and greets the fishermen of the coast.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", duration: 30, order: 1,
    transcript: [
      { id: "ts1", startTime: 0, endTime: 3, text: "Habari za asubuhi! nahodha alisema", translation: "Good morning! the captain said" },
      { id: "ts2", startTime: 3, endTime: 6.5, text: "Jina langu ni Baraka, kutoka Zanzibar", translation: "My name is Baraka, from Zanzibar" },
      { id: "ts3", startTime: 6.5, endTime: 10, text: "Habari yako? mvuvi alimwuliza", translation: "How are you? a fisherman asked him" },
      { id: "ts4", startTime: 10, endTime: 14, text: "Nzuri sana! Bahari ni shwari leo", translation: "Very well! The sea is calm today" },
      { id: "ts5", startTime: 14, endTime: 18, text: "Asante sana kwa ukarimu wako", translation: "Thank you very much for your hospitality" },
      { id: "ts6", startTime: 18, endTime: 22, text: "Unakwenda wapi na jahazi yako?", translation: "Where are you going with your dhow?" },
      { id: "ts7", startTime: 22, endTime: 26, text: "Ninakwenda Lamu, kisha nyumbani", translation: "I am going to Lamu, then home" },
      { id: "ts8", startTime: 26, endTime: 30, text: "Kwaheri! Safari njema!", translation: "Goodbye! Safe journey!" },
    ],
  },
  { id: "lesson-20", courseId: "course-8", title: "Counting the Catch", description: "Baraka helps fishermen count their catch and divide it for the village.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", duration: 200, order: 2, transcript: [] },
  { id: "lesson-21", courseId: "course-8", title: "The Fisherman's Family", description: "Baraka joins a fisherman's family for dinner and learns how they address each other.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", duration: 210, order: 3, transcript: [] },

  // ── Swahili Proverbs (course-9) ───────────────────────────────────────
  { id: "lesson-22", courseId: "course-9", title: "The Teacher and the Student", description: "A Swahili teacher shares proverbs about wisdom with a struggling student.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", duration: 250, order: 1, transcript: [] },
  { id: "lesson-23", courseId: "course-9", title: "The Two Neighbors", description: "Two neighbors argue and reconcile — learning Swahili proverbs about unity.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", duration: 240, order: 2, transcript: [] },
];
