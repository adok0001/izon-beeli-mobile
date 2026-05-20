/**
 * Egyptian Arabic lessons — course-arabic-egyptian-fw (First Words)
 */
import type { LessonData } from "./types";

export const ARABIC_EGYPTIAN_LESSONS: LessonData[] = [
  {
    id: "arabic-egyptian-fw-1", courseId: "course-arabic-egyptian-fw", title: "Youssef in Old Cairo",
    description: "Youssef visits a cafe in Cairo's old quarter and chats with the owner — learning greetings.",
    audioUrl: null, duration: null, order: 1,
    transcript: [
      { id: "arabic-egyptian-fw-1-1", startTime: 0, endTime: 3, text: "صباح الخير! قال المسافر لصاحب القهوة", translation: "Good morning! the traveler said to the cafe owner" },
      { id: "arabic-egyptian-fw-1-2", startTime: 3, endTime: 6.5, text: "اسمي يوسف. أنا من الإسكندرية", translation: "My name is Youssef. I am from Alexandria" },
      { id: "arabic-egyptian-fw-1-3", startTime: 6.5, endTime: 10, text: "إزيك يا يوسف? صاحب القهوة سأل", translation: "How are you, Youssef? the cafe owner asked" },
      { id: "arabic-egyptian-fw-1-4", startTime: 10, endTime: 14, text: "أنا كويس! القاهرة جميلة", translation: "I am fine! Cairo is beautiful" },
      { id: "arabic-egyptian-fw-1-5", startTime: 14, endTime: 18, text: "شكراً جزيلاً على الشاي ده", translation: "Thank you very much for this tea" },
      { id: "arabic-egyptian-fw-1-6", startTime: 18, endTime: 22, text: "رايح فين دلوقتي? صاحب القهوة سأل", translation: "Where are you going now? the cafe owner asked" },
      { id: "arabic-egyptian-fw-1-7", startTime: 22, endTime: 26, text: "أنا رايح خان الخليلي — السوق القديم", translation: "I am going to Khan el-Khalili — the old market" },
      { id: "arabic-egyptian-fw-1-8", startTime: 26, endTime: 30, text: "مع السلامة! ارجع تاني!", translation: "Goodbye! Come back again!" },
    ],
  },
  { id: "arabic-egyptian-fw-2", courseId: "course-arabic-egyptian-fw", title: "Bargaining in Khan el-Khalili", description: "Youssef haggles for souvenirs in Cairo's oldest bazaar — counting and prices in Egyptian Arabic.", audioUrl: null, duration: null, order: 2, transcript: [] },
  { id: "arabic-egyptian-fw-3", courseId: "course-arabic-egyptian-fw", title: "Iftar with the Family", description: "Youssef joins an Egyptian family for iftar — learning family words during Ramadan.", audioUrl: null, duration: null, order: 3, transcript: [] },
];
