/**
 * Egyptian Arabic lessons — course-13 (Basics)
 */
import type { LessonData } from "./types";

export const ARABIC_EGYPTIAN_LESSONS: LessonData[] = [
  {
    id: "lesson-32", courseId: "course-13", title: "Youssef in Old Cairo",
    description: "Youssef visits a cafe in Cairo's old quarter and chats with the owner — learning greetings.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", duration: 30, order: 1,
    transcript: [
      { id: "tae1", startTime: 0, endTime: 3, text: "صباح الخير! قال المسافر لصاحب القهوة", translation: "Good morning! the traveler said to the cafe owner" },
      { id: "tae2", startTime: 3, endTime: 6.5, text: "اسمي يوسف. أنا من الإسكندرية", translation: "My name is Youssef. I am from Alexandria" },
      { id: "tae3", startTime: 6.5, endTime: 10, text: "إزيك يا يوسف? صاحب القهوة سأل", translation: "How are you, Youssef? the cafe owner asked" },
      { id: "tae4", startTime: 10, endTime: 14, text: "أنا كويس! القاهرة جميلة", translation: "I am fine! Cairo is beautiful" },
      { id: "tae5", startTime: 14, endTime: 18, text: "شكراً جزيلاً على الشاي ده", translation: "Thank you very much for this tea" },
      { id: "tae6", startTime: 18, endTime: 22, text: "رايح فين دلوقتي? صاحب القهوة سأل", translation: "Where are you going now? the cafe owner asked" },
      { id: "tae7", startTime: 22, endTime: 26, text: "أنا رايح خان الخليلي — السوق القديم", translation: "I am going to Khan el-Khalili — the old market" },
      { id: "tae8", startTime: 26, endTime: 30, text: "مع السلامة! ارجع تاني!", translation: "Goodbye! Come back again!" },
    ],
  },
  { id: "lesson-33", courseId: "course-13", title: "Bargaining in Khan el-Khalili", description: "Youssef haggles for souvenirs in Cairo's oldest bazaar — counting and prices in Egyptian Arabic.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 195, order: 2, transcript: [] },
  { id: "lesson-34", courseId: "course-13", title: "Iftar with the Family", description: "Youssef joins an Egyptian family for iftar — learning family words during Ramadan.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: 210, order: 3, transcript: [] },
];
