/**
 * Akan (Twi) lessons — course-11 (Basics)
 */
import type { LessonData } from "./types";

export const AKAN_LESSONS: LessonData[] = [
  {
    id: "lesson-27", courseId: "course-11", title: "Ananse Visits Grandmother",
    description: "The trickster Ananse visits his grandmother — learn greetings through an Akan folktale.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", duration: 30, order: 1,
    transcript: [
      { id: "tk1", startTime: 0, endTime: 3, text: "Maakye, Nana! Ananse kae", translation: "Good morning, Grandmother! Ananse said" },
      { id: "tk2", startTime: 3, endTime: 6.5, text: "Me din de Ananse, kwaku ananse", translation: "My name is Ananse, the clever spider" },
      { id: "tk3", startTime: 6.5, endTime: 10, text: "Wo ho te sɛn? Nana bisaa", translation: "How are you? Grandmother asked" },
      { id: "tk4", startTime: 10, endTime: 14, text: "Me ho yɛ! Nanso ɔkɔm de me", translation: "I am fine! But I am hungry" },
      { id: "tk5", startTime: 14, endTime: 18, text: "Medaase paa, Nana, sɛ wode aduane maa me", translation: "Thank you very much, Grandmother, for giving me food" },
      { id: "tk6", startTime: 18, endTime: 22, text: "Wo rekɔ he? Nana bisaa no", translation: "Where are you going? Grandmother asked him" },
      { id: "tk7", startTime: 22, endTime: 26, text: "Merekɔ fie, na ade resa", translation: "I am going home, it is getting dark" },
      { id: "tk8", startTime: 26, endTime: 30, text: "Nante yie, Ananse! Nana kae", translation: "Safe journey, Ananse! Grandmother said" },
    ],
  },
  { id: "lesson-28", courseId: "course-11", title: "Ananse Counts His Treasures", description: "Ananse tries to count his treasures but keeps losing track — learning numbers in Twi.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", duration: 190, order: 2, transcript: [] },
  { id: "lesson-29", courseId: "course-11", title: "Ananse and the Abusua", description: "Ananse discovers the meaning of abusua — family — when he needs help carrying food home.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", duration: 215, order: 3, transcript: [] },
];
