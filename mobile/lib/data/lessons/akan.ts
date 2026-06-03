/**
 * Akan (Twi) lessons — course-akan-fw (First Words)
 */
import type { LessonData } from "./types";

export const AKAN_LESSONS: LessonData[] = [
  {
    id: "akan-fw-1", courseId: "course-akan-fw", title: "Ananse Visits Grandmother",
    description: "The trickster Ananse visits his grandmother — learn greetings through an Akan folktale.",
    audioUrl: null, duration: null, order: 1,
    transcript: [
      { id: "akan-fw-1-1", startTime: 0, endTime: 3, text: "Maakye, Nana! Ananse kae", translation: "Good morning, Grandmother! Ananse said" },
      { id: "akan-fw-1-2", startTime: 3, endTime: 6.5, text: "Me din de Ananse, kwaku ananse", translation: "My name is Ananse, the clever spider" },
      { id: "akan-fw-1-3", startTime: 6.5, endTime: 10, text: "Wo ho te sɛn? Nana bisaa", translation: "How are you? Grandmother asked" },
      { id: "akan-fw-1-4", startTime: 10, endTime: 14, text: "Me ho yɛ! Nanso ɔkɔm de me", translation: "I am fine! But I am hungry" },
      { id: "akan-fw-1-5", startTime: 14, endTime: 18, text: "Medaase paa, Nana, sɛ wode aduane maa me", translation: "Thank you very much, Grandmother, for giving me food" },
      { id: "akan-fw-1-6", startTime: 18, endTime: 22, text: "Wo rekɔ he? Nana bisaa no", translation: "Where are you going? Grandmother asked him" },
      { id: "akan-fw-1-7", startTime: 22, endTime: 26, text: "Merekɔ fie, na ade resa", translation: "I am going home, it is getting dark" },
      { id: "akan-fw-1-8", startTime: 26, endTime: 30, text: "Nante yie, Ananse! Nana kae", translation: "Safe journey, Ananse! Grandmother said" },
    ],
  },
  { id: "akan-fw-2", courseId: "course-akan-fw", title: "Ananse Counts His Treasures", description: "Ananse tries to count his treasures but keeps losing track — learning numbers in Twi.", audioUrl: null, duration: null, order: 2, transcript: [] },
  { id: "akan-fw-3", courseId: "course-akan-fw", title: "Ananse and the Abusua", description: "Ananse discovers the meaning of abusua — family — when he needs help carrying food home.", audioUrl: null, duration: null, order: 3, transcript: [] },
];
