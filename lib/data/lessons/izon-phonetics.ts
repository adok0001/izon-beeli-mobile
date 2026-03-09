/**
 * Izon Sounds & Spelling — course-19
 * Phonetics: vowel harmony, consonants, nasalized vowels, vowel sequences.
 */
import type { LessonData } from "./types";

export const IZON_PHONETICS_LESSONS: LessonData[] = [
  {
    id: "lesson-45",
    courseId: "course-19",
    title: "Vowel Harmony",
    description: "A grandmother teaches her grandchild to read Izon by exploring how vowels work together in the Woyengi creation story.",
    audioUrl: null,
    duration: null,
    order: 1,
    transcript: [],
  },
  {
    id: "lesson-46",
    courseId: "course-19",
    title: "Consonants & Digraphs",
    description: "Grandmother and grandchild explore Izon consonants through a story about the Ekine masquerade preparations.",
    audioUrl: null,
    duration: null,
    order: 2,
    transcript: [],
  },
  {
    id: "lesson-47",
    courseId: "course-19",
    title: "Nasalized & Long Vowels",
    description: "By the river at dusk, grandmother teaches how nasal sounds and long vowels carry meaning in Izon songs and stories.",
    audioUrl: null,
    duration: null,
    order: 3,
    transcript: [
      { id: "t47-1", startTime: 0, endTime: 5, text: "bụmọụ", translation: "sand bank" },
      { id: "t47-2", startTime: 5, endTime: 10, text: "dụnọụ", translation: "lake" },
      { id: "t47-3", startTime: 10, endTime: 15, text: "bingha", translation: "not many; not plenty" },
      { id: "t47-4", startTime: 15, endTime: 20, text: "pingha", translation: "not congested" },
    ],
  },
  {
    id: "lesson-48",
    courseId: "course-19",
    title: "Vowel Sequences",
    description: "Grandmother and grandchild paddle their canoe while practicing the vowel pairs that make Izon unique.",
    audioUrl: null,
    duration: null,
    order: 4,
    transcript: [],
  },
];
