/**
 * Wolof lessons — course-wolof-fw (First Words)
 */
import type { LessonData } from "./types";

export const WOLOF_LESSONS: LessonData[] = [
  {
    id: "wolof-fw-1", courseId: "course-wolof-fw", title: "The Griot's Welcome",
    description: "A griot welcomes travelers to a teranga feast — learn Wolof greetings through Senegalese hospitality.",
    audioUrl: null, duration: null, order: 1,
    transcript: [
      { id: "wolof-fw-1-1", startTime: 0, endTime: 3.5, text: "Nanga def? Gewel bi ne", translation: "How are you? the griot said" },
      { id: "wolof-fw-1-2", startTime: 3.5, endTime: 7, text: "Maa ngi fi rekk. Teranga la", translation: "I am fine. This is hospitality" },
      { id: "wolof-fw-1-3", startTime: 7, endTime: 11, text: "Naka nga tudd? Li ci nekkoon bi", translation: "What is your name? the host asked" },
      { id: "wolof-fw-1-4", startTime: 11, endTime: 15, text: "Maa ngi tudd Ousmane. Sama kër Dakar la", translation: "My name is Ousmane. My home is Dakar" },
      { id: "wolof-fw-1-5", startTime: 15, endTime: 19, text: "Jërëjëf ci teranga bi!", translation: "Thank you for this hospitality!" },
      { id: "wolof-fw-1-6", startTime: 19, endTime: 23, text: "Fan nga dem? Gewel bi laaj", translation: "Where are you going? the griot asked" },
      { id: "wolof-fw-1-7", startTime: 23, endTime: 27, text: "Damay dem kër, wànte dinaa dellu", translation: "I am going home, but I will return" },
      { id: "wolof-fw-1-8", startTime: 27, endTime: 30, text: "Ba beneen, saai! the griot sang", translation: "See you again, friend! the griot sang" },
    ],
  },
  { id: "wolof-fw-2", courseId: "course-wolof-fw", title: "Haggling in Sandaga", description: "A visitor learns to count and bargain at Dakar's famous Sandaga market.", audioUrl: null, duration: null, order: 2, transcript: [] },
];
