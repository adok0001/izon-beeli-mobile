/**
 * Hausa lessons — course-7 (First Words)
 */
import type { LessonData } from "./types";

export const HAUSA_LESSONS: LessonData[] = [
  {
    id: "lesson-17",
    courseId: "course-7",
    title: "The Scholar's Arrival",
    description: "A young scholar arrives in Kano and must greet the emir's court with proper respect.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 30,
    order: 1,
    transcript: [
      { id: "th1-1", startTime: 0,   endTime: 3.5, text: "Sannu da zuwa, malami!",                   translation: "Welcome, scholar!" },
      { id: "th1-2", startTime: 3.5, endTime: 7,   text: "Ina kwana? Lafiya lau!",                   translation: "How was the night? Very well!" },
      { id: "th1-3", startTime: 7,   endTime: 11,  text: "Sunana Musa. Na fito daga Sokoto.",         translation: "My name is Musa. I come from Sokoto." },
      { id: "th1-4", startTime: 11,  endTime: 15,  text: "Ka yi nisa? Ee, na yi tafiya mai tsawo.",  translation: "Did you travel far? Yes, I made a long journey." },
      { id: "th1-5", startTime: 15,  endTime: 19,  text: "Ka san Hausa sosai? Ina koyo.",            translation: "Do you know Hausa well? I am learning." },
      { id: "th1-6", startTime: 19,  endTime: 23,  text: "Madalla! Makaranta tana kusa da nan.",      translation: "Excellent! The school is nearby." },
      { id: "th1-7", startTime: 23,  endTime: 27,  text: "Na gode da maraba da ni.",                 translation: "Thank you for welcoming me." },
      { id: "th1-8", startTime: 27,  endTime: 30,  text: "Allah ya kiyaye! Sai an jima.",            translation: "May God protect! See you later." },
    ],
  },
  {
    id: "lesson-18",
    courseId: "course-7",
    title: "Trading at Kurmi Market",
    description: "Musa learns to count and bargain at Kano's ancient Kurmi market.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 30,
    order: 2,
    transcript: [
      { id: "th2-1", startTime: 0,   endTime: 4,  text: "Ina kwana? Lafiya sosai! Kasuwa tana da rai yau.", translation: "How was the night? Very well! The market is lively today." },
      { id: "th2-2", startTime: 4,   endTime: 8,  text: "Nawa ne wannan kifi?",                             translation: "How much is this fish?" },
      { id: "th2-3", startTime: 8,   endTime: 12, text: "Naira ɗari biyu.",                                 translation: "Two hundred naira." },
      { id: "th2-4", startTime: 12,  endTime: 16, text: "Yana da tsada! Na biya ɗari ɗaya.",                translation: "That's expensive! I'll pay one hundred." },
      { id: "th2-5", startTime: 16,  endTime: 20, text: "To, ɗari da hamsin. Mun yanke.",                   translation: "OK, one hundred and fifty. We agree." },
      { id: "th2-6", startTime: 20,  endTime: 24, text: "Na saya kifi guda uku da nama guda biyu.",         translation: "I bought three fish and two pieces of meat." },
      { id: "th2-7", startTime: 24,  endTime: 27, text: "Nawa suke jimilar?",                               translation: "How much is the total?" },
      { id: "th2-8", startTime: 27,  endTime: 30, text: "Naira ɗari biyar. Na gode, Allah ya kiyaye!",      translation: "Five hundred naira. Thank you, may God protect!" },
    ],
  },
];
