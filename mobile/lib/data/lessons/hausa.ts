/**
 * Hausa lessons — course-hausa-fw (First Words)
 */
import type { LessonData } from "./types";

export const HAUSA_LESSONS: LessonData[] = [
  {
    id: "hausa-fw-1",
    courseId: "course-hausa-fw",
    title: "The Scholar's Arrival",
    description: "A young scholar arrives in Kano and must greet the emir's court with proper respect.",
    audioUrl: null,
    duration: null,
    order: 1,
    transcript: [
      { id: "hausa-fw-1-1", startTime: 0,   endTime: 3.5, text: "Sannu da zuwa, malami!",                   translation: "Welcome, scholar!" },
      { id: "hausa-fw-1-2", startTime: 3.5, endTime: 7,   text: "Ina kwana? Lafiya lau!",                   translation: "How was the night? Very well!" },
      { id: "hausa-fw-1-3", startTime: 7,   endTime: 11,  text: "Sunana Musa. Na fito daga Sokoto.",         translation: "My name is Musa. I come from Sokoto." },
      { id: "hausa-fw-1-4", startTime: 11,  endTime: 15,  text: "Ka yi nisa? Ee, na yi tafiya mai tsawo.",  translation: "Did you travel far? Yes, I made a long journey." },
      { id: "hausa-fw-1-5", startTime: 15,  endTime: 19,  text: "Ka san Hausa sosai? Ina koyo.",            translation: "Do you know Hausa well? I am learning." },
      { id: "hausa-fw-1-6", startTime: 19,  endTime: 23,  text: "Madalla! Makaranta tana kusa da nan.",      translation: "Excellent! The school is nearby." },
      { id: "hausa-fw-1-7", startTime: 23,  endTime: 27,  text: "Na gode da maraba da ni.",                 translation: "Thank you for welcoming me." },
      { id: "hausa-fw-1-8", startTime: 27,  endTime: 30,  text: "Allah ya kiyaye! Sai an jima.",            translation: "May God protect! See you later." },
    ],
  },
  {
    id: "hausa-fw-2",
    courseId: "course-hausa-fw",
    title: "Trading at Kurmi Market",
    description: "Musa learns to count and bargain at Kano's ancient Kurmi market.",
    audioUrl: null,
    duration: null,
    order: 2,
    transcript: [
      { id: "hausa-fw-2-1", startTime: 0,   endTime: 4,  text: "Ina kwana? Lafiya sosai! Kasuwa tana da rai yau.", translation: "How was the night? Very well! The market is lively today." },
      { id: "hausa-fw-2-2", startTime: 4,   endTime: 8,  text: "Nawa ne wannan kifi?",                             translation: "How much is this fish?" },
      { id: "hausa-fw-2-3", startTime: 8,   endTime: 12, text: "Naira ɗari biyu.",                                 translation: "Two hundred naira." },
      { id: "hausa-fw-2-4", startTime: 12,  endTime: 16, text: "Yana da tsada! Na biya ɗari ɗaya.",                translation: "That's expensive! I'll pay one hundred." },
      { id: "hausa-fw-2-5", startTime: 16,  endTime: 20, text: "To, ɗari da hamsin. Mun yanke.",                   translation: "OK, one hundred and fifty. We agree." },
      { id: "hausa-fw-2-6", startTime: 20,  endTime: 24, text: "Na saya kifi guda uku da nama guda biyu.",         translation: "I bought three fish and two pieces of meat." },
      { id: "hausa-fw-2-7", startTime: 24,  endTime: 27, text: "Nawa suke jimilar?",                               translation: "How much is the total?" },
      { id: "hausa-fw-2-8", startTime: 27,  endTime: 30, text: "Naira ɗari biyar. Na gode, Allah ya kiyaye!",      translation: "Five hundred naira. Thank you, may God protect!" },
    ],
  },
];
