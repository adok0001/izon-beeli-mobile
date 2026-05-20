/**
 * Swahili lessons — course-swahili-fw (First Words) · course-swahili-ot (Oral Tradition)
 */
import type { LessonData } from "./types";

export const SWAHILI_LESSONS: LessonData[] = [
  // ── Swahili Basics (course-8) ─────────────────────────────────────────
  {
    id: "swahili-fw-1", courseId: "course-swahili-fw", title: "Captain Baraka's Journey",
    description: "Follow Captain Baraka as he sails from Zanzibar and greets the fishermen of the coast.",
    audioUrl: null, duration: null, order: 1,
    transcript: [
      { id: "swahili-fw-1-1", startTime: 0, endTime: 3, text: "Habari za asubuhi! nahodha alisema", translation: "Good morning! the captain said" },
      { id: "swahili-fw-1-2", startTime: 3, endTime: 6.5, text: "Jina langu ni Baraka, kutoka Zanzibar", translation: "My name is Baraka, from Zanzibar" },
      { id: "swahili-fw-1-3", startTime: 6.5, endTime: 10, text: "Habari yako? mvuvi alimwuliza", translation: "How are you? a fisherman asked him" },
      { id: "swahili-fw-1-4", startTime: 10, endTime: 14, text: "Nzuri sana! Bahari ni shwari leo", translation: "Very well! The sea is calm today" },
      { id: "swahili-fw-1-5", startTime: 14, endTime: 18, text: "Asante sana kwa ukarimu wako", translation: "Thank you very much for your hospitality" },
      { id: "swahili-fw-1-6", startTime: 18, endTime: 22, text: "Unakwenda wapi na jahazi yako?", translation: "Where are you going with your dhow?" },
      { id: "swahili-fw-1-7", startTime: 22, endTime: 26, text: "Ninakwenda Lamu, kisha nyumbani", translation: "I am going to Lamu, then home" },
      { id: "swahili-fw-1-8", startTime: 26, endTime: 30, text: "Kwaheri! Safari njema!", translation: "Goodbye! Safe journey!" },
    ],
  },
  {
    id: "swahili-fw-2", courseId: "course-swahili-fw", title: "Counting the Catch",
    description: "Baraka helps fishermen count their catch and divide it for the village.",
    audioUrl: null, duration: null, order: 2,
    transcript: [
      { id: "swahili-fw-2-1", startTime: 0,  endTime: 4,  text: "Samaki wangapi leo?",                        translation: "How many fish today?" },
      { id: "swahili-fw-2-2", startTime: 4,  endTime: 8,  text: "Hamsini na tano! Siku njema sana.",           translation: "Fifty-five! A very good day." },
      { id: "swahili-fw-2-3", startTime: 8,  endTime: 12, text: "Moja, mbili, tatu, nne, tano...",             translation: "One, two, three, four, five..." },
      { id: "swahili-fw-2-4", startTime: 12, endTime: 16, text: "Kumi, ishirini, thelathini — tunahesabu.",    translation: "Ten, twenty, thirty — we count." },
      { id: "swahili-fw-2-5", startTime: 16, endTime: 20, text: "Tunagawanya sawa sawa.",                      translation: "We divide equally." },
      { id: "swahili-fw-2-6", startTime: 20, endTime: 24, text: "Kila familia itapata kumi.",                  translation: "Each family will get ten." },
      { id: "swahili-fw-2-7", startTime: 24, endTime: 27, text: "Asante, nahodha! Wewe ni mwema.",              translation: "Thank you, captain! You are good." },
      { id: "swahili-fw-2-8", startTime: 27, endTime: 30, text: "Pamoja tunafanikiwa. Kesho tutavua tena.",    translation: "Together we succeed. Tomorrow we fish again." },
    ],
  },
  {
    id: "swahili-fw-3", courseId: "course-swahili-fw", title: "The Fisherman's Family",
    description: "Baraka joins a fisherman's family for dinner and learns how they address each other.",
    audioUrl: null, duration: null, order: 3,
    transcript: [
      { id: "swahili-fw-3-1", startTime: 0,  endTime: 4,  text: "Karibu nyumbani! Hii ni mke wangu.",          translation: "Welcome home! This is my wife." },
      { id: "swahili-fw-3-2", startTime: 4,  endTime: 8,  text: "Habari yako? Nina furaha kukuona.",            translation: "How are you? I am happy to see you." },
      { id: "swahili-fw-3-3", startTime: 8,  endTime: 12, text: "Hawa ni watoto wangu — Amani na Fadhila.",    translation: "These are my children — Amani and Fadhila." },
      { id: "swahili-fw-3-4", startTime: 12, endTime: 16, text: "Jina lako ni nani, mgeni wetu?",               translation: "What is your name, our guest?" },
      { id: "swahili-fw-3-5", startTime: 16, endTime: 20, text: "Jina langu ni Baraka. Nina watoto wawili pia.", translation: "My name is Baraka. I also have two children." },
      { id: "swahili-fw-3-6", startTime: 20, endTime: 24, text: "Karibu kula! Ugali na samaki wa nazi.",        translation: "Come eat! Ugali and coconut fish." },
      { id: "swahili-fw-3-7", startTime: 24, endTime: 27, text: "Chakula ni kitamu sana! Asante sana.",         translation: "The food is very delicious! Thank you so much." },
      { id: "swahili-fw-3-8", startTime: 27, endTime: 30, text: "Pumzika vizuri, rafiki. Usiku mwema.",         translation: "Rest well, friend. Good night." },
    ],
  },

  // ── Swahili Proverbs (course-9) ───────────────────────────────────────
  {
    id: "swahili-ot-1", courseId: "course-swahili-ot", title: "The Teacher and the Student",
    description: "A Swahili teacher shares proverbs about wisdom with a struggling student.",
    audioUrl: null, duration: null, order: 1,
    transcript: [
      { id: "swahili-ot-1-1", startTime: 0,  endTime: 4,  text: "Mwalimu, sijui nini cha kufanya.",            translation: "Teacher, I don't know what to do." },
      { id: "swahili-ot-1-2", startTime: 4,  endTime: 8,  text: "Subira huvuta heri.",                          translation: "Patience brings good fortune." },
      { id: "swahili-ot-1-3", startTime: 8,  endTime: 12, text: "Elimu ni nuru, ujinga ni giza.",               translation: "Education is light, ignorance is darkness." },
      { id: "swahili-ot-1-4", startTime: 12, endTime: 16, text: "Haraka haraka haina baraka.",                  translation: "Rushing rushing has no blessing. (haste makes waste)" },
      { id: "swahili-ot-1-5", startTime: 16, endTime: 20, text: "Umejaribu? Jaribu tena bila kuchoka.",         translation: "Have you tried? Try again without tiring." },
      { id: "swahili-ot-1-6", startTime: 20, endTime: 24, text: "Mtoto wa nyoka ni nyoka.",                     translation: "The child of a snake is a snake. (like begets like)" },
      { id: "swahili-ot-1-7", startTime: 24, endTime: 27, text: "Asante, mwalimu. Nitajitahidi.",               translation: "Thank you, teacher. I will try hard." },
      { id: "swahili-ot-1-8", startTime: 27, endTime: 30, text: "Nenda, ujifunze. Ujuzi ni utajiri.",           translation: "Go, learn. Knowledge is wealth." },
    ],
  },
  {
    id: "swahili-ot-2", courseId: "course-swahili-ot", title: "The Two Neighbors",
    description: "Two neighbors argue and reconcile — learning Swahili proverbs about unity.",
    audioUrl: null, duration: null, order: 2,
    transcript: [
      { id: "swahili-ot-2-1", startTime: 0,  endTime: 4,  text: "Jirani wangu, tuna tatizo kati yetu.",         translation: "My neighbor, we have a problem between us." },
      { id: "swahili-ot-2-2", startTime: 4,  endTime: 8,  text: "Useme. Masikio yangu yako wazi.",              translation: "Speak. My ears are open." },
      { id: "swahili-ot-2-3", startTime: 8,  endTime: 12, text: "Umoja ni nguvu, utengano ni udhaifu.",         translation: "Unity is strength, division is weakness." },
      { id: "swahili-ot-2-4", startTime: 12, endTime: 16, text: "Mkono mmoja haulei mwana.",                    translation: "One hand cannot raise a child." },
      { id: "swahili-ot-2-5", startTime: 16, endTime: 20, text: "Naomba msamaha kwa makosa yangu.",             translation: "I apologize for my mistakes." },
      { id: "swahili-ot-2-6", startTime: 20, endTime: 24, text: "Msamaha unapoombwa, toa bila kusita.",         translation: "When forgiveness is asked, give it without hesitation." },
      { id: "swahili-ot-2-7", startTime: 24, endTime: 27, text: "Tushirikiane kwa manufaa ya kijiji chetu.",   translation: "Let us cooperate for the benefit of our village." },
      { id: "swahili-ot-2-8", startTime: 27, endTime: 30, text: "Majirani wazuri ni baraka. Asante.",           translation: "Good neighbors are a blessing. Thank you." },
    ],
  },
];
