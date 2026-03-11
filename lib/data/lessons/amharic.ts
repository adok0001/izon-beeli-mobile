/**
 * Amharic lessons — course-10 (First Words)
 */
import type { LessonData } from "./types";

export const AMHARIC_LESSONS: LessonData[] = [
  {
    id: "lesson-24", courseId: "course-10", title: "Maryam's Coffee Ceremony",
    description: "Maryam invites her neighbor for a traditional Ethiopian coffee ceremony — buna.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", duration: 30, order: 1,
    transcript: [
      { id: "ta1", startTime: 0, endTime: 3, text: "እንደምን አደርክ! ጎረቤት ጠራ", translation: "Good morning! a neighbor called out" },
      { id: "ta2", startTime: 3, endTime: 6.5, text: "ስሜ ማርያም ነው። ቡና ፈልተሽ?", translation: "My name is Maryam. Would you like coffee?" },
      { id: "ta3", startTime: 6.5, endTime: 10, text: "እንዴት ነህ? ጎረቤት ጠየቀ", translation: "How are you? the neighbor asked" },
      { id: "ta4", startTime: 10, endTime: 14, text: "ደህና ነኝ! ቡና ሲፈላ ጥሩ ሽታ አለው", translation: "I am fine! The coffee smells wonderful as it brews" },
      { id: "ta5", startTime: 14, endTime: 18, text: "አመሰግናለሁ! ይህ የቡና ሥርዓት ቆንጆ ነው", translation: "Thank you! This coffee ceremony is beautiful" },
      { id: "ta6", startTime: 18, endTime: 22, text: "ወዴት ነው የምትሄደው? ከቡና በኋላ?", translation: "Where are you going after coffee?" },
      { id: "ta7", startTime: 22, endTime: 26, text: "ወደ ገበያ እየሄድኩ ነው — ቅመማ ቅመም ለመግዛት", translation: "I am going to the market — to buy spices" },
      { id: "ta8", startTime: 26, endTime: 30, text: "ደህና ሁን! ቡና ደግሞ ጠብቂኝ!", translation: "Goodbye! Save me coffee again!" },
    ],
  },
  { id: "lesson-25", courseId: "course-10", title: "The Spice Market", description: "Maryam bargains for spices at the merkato — learning to count in Amharic.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", duration: 195, order: 2, transcript: [] },
  { id: "lesson-26", courseId: "course-10", title: "Gathering for Timkat", description: "Maryam's family gathers for the Timkat festival — introducing family members.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", duration: 205, order: 3, transcript: [] },
];
