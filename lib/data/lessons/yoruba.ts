/**
 * Yoruba lessons — course-4 (First Words) · course-5 (Oral Tradition)
 */
import type { LessonData } from "./types";

export const YORUBA_LESSONS: LessonData[] = [
  // ── Yoruba Basics (course-4) ──────────────────────────────────────────
  {
    id: "lesson-9", courseId: "course-4", title: "Adé Goes to Market",
    description: "Follow young Adé as he greets neighbors on his way to Oja Oba, the king's market.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", duration: 30, order: 1,
    transcript: [
      { id: "ty1", startTime: 0, endTime: 3.5, text: "Ọmọ ọja kan jí ni kutukutu owurọ", translation: "A trader's son woke up early one morning" },
      { id: "ty2", startTime: 3.5, endTime: 7, text: "E kaaro o! ó kí iya rẹ", translation: "Good morning! he greeted his mother" },
      { id: "ty3", startTime: 7, endTime: 11, text: "Bawo ni, ọmọ mi? iya rẹ bi", translation: "How are you, my child? his mother asked" },
      { id: "ty4", startTime: 11, endTime: 15, text: "Mo wa daadaa. Mo fẹ lọ si ọja", translation: "I am fine. I want to go to the market" },
      { id: "ty5", startTime: 15, endTime: 19, text: "Oruko mi ni Adé, ó sọ fun alajapa kan", translation: "My name is Adé, he told a stranger" },
      { id: "ty6", startTime: 19, endTime: 23, text: "Nibo lo n lo? alajapa naa bi", translation: "Where are you going? the stranger asked" },
      { id: "ty7", startTime: 23, endTime: 27, text: "Mo n lo si ọja. E se pupo!", translation: "I am going to the market. Thank you very much!" },
      { id: "ty8", startTime: 27, endTime: 30, text: "O dabo! Adé yọ si ọja", translation: "Goodbye! Adé smiled as he reached the market" },
    ],
  },
  {
    id: "lesson-10", courseId: "course-4", title: "Counting Cowries",
    description: "Adé's mother teaches him to count cowrie shells at her market stall.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", duration: 30, order: 2,
    transcript: [
      { id: "ty10-1", startTime: 0,  endTime: 4,  text: "Ọmọ mi, wa wo cowries wọ̀nyí.",           translation: "My child, come look at these cowries." },
      { id: "ty10-2", startTime: 4,  endTime: 8,  text: "Ọkan, eji, ẹta, ẹrin, àrún...",           translation: "One, two, three, four, five..." },
      { id: "ty10-3", startTime: 8,  endTime: 12, text: "Ẹfà, èje, ẹjọ, ẹsàn, ẹwá.",             translation: "Six, seven, eight, nine, ten." },
      { id: "ty10-4", startTime: 12, endTime: 16, text: "Mélò ni nínú àpò yìí?",                   translation: "How many are in this bag?" },
      { id: "ty10-5", startTime: 16, endTime: 20, text: "Ogún cowries nínú àpò kọọkan.",           translation: "Twenty cowries in each bag." },
      { id: "ty10-6", startTime: 20, endTime: 24, text: "Ẹwa ni ọjà lónì, Adé. A ń tà daadaa.",   translation: "The market is beautiful today, Adé. We are selling well." },
      { id: "ty10-7", startTime: 24, endTime: 27, text: "Bẹẹni, ìyá! Mo ka wọn. Ogún gbẹdẹ.",    translation: "Yes, mother! I counted them. Exactly twenty." },
      { id: "ty10-8", startTime: 27, endTime: 30, text: "Daadaa pupọ! Ọmọ rere ni ọ.",             translation: "Very good! You are a good child." },
    ],
  },
  {
    id: "lesson-11", courseId: "course-4", title: "Adé Meets the Family",
    description: "Adé introduces a new friend to his large Yoruba family at a naming ceremony.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", duration: 30, order: 3,
    transcript: [
      { id: "ty11-1", startTime: 0,  endTime: 4,  text: "Kolade, ẹ káàbọ̀ sí ilé wa.",             translation: "Kolade, welcome to our home." },
      { id: "ty11-2", startTime: 4,  endTime: 8,  text: "Eléyìí ni bàbá mi, Àjànàkú.",             translation: "This is my father, Àjànàkú." },
      { id: "ty11-3", startTime: 8,  endTime: 12, text: "Eléyìí ni ìyá mi, Àbíkẹ́.",               translation: "This is my mother, Àbíkẹ́." },
      { id: "ty11-4", startTime: 12, endTime: 16, text: "Eléyìí ni àgbàgbà wa, ẹni ọgọ́ta ọdún.", translation: "This is our elder, a person of sixty years." },
      { id: "ty11-5", startTime: 16, endTime: 20, text: "Orúkọ rẹ ń jẹ́ Kọ́lá. Ó túmọ̀ sí ọrọ̀.", translation: "His name is Kọ́lá. It means wealth." },
      { id: "ty11-6", startTime: 20, endTime: 24, text: "A ń dárúkọ ọmọ tuntun lónìí. Inú dídùn.", translation: "We are naming a new baby today. It is joyful." },
      { id: "ty11-7", startTime: 24, endTime: 27, text: "Bàbá ẹni ń sọ orúkọ. Ìdílé gbádùn.",     translation: "One's father speaks the name. The family rejoices." },
      { id: "ty11-8", startTime: 27, endTime: 30, text: "Ẹ jẹ ká jẹun. Ẹ jẹ ká yọ̀!",             translation: "Let us eat. Let us rejoice!" },
    ],
  },

  // ── Yoruba Proverbs (course-5) ────────────────────────────────────────
  {
    id: "lesson-12", courseId: "course-5", title: "The Patient Farmer",
    description: "An elder teaches patience through Yoruba proverbs as a young farmer struggles with his harvest.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", duration: 30, order: 1,
    transcript: [
      { id: "ty12-1", startTime: 0,  endTime: 4,  text: "Ọmọ mi, igi tó bá pẹ̀ ni igi tó ga.",      translation: "My child, the tree that waits long is the tallest tree." },
      { id: "ty12-2", startTime: 4,  endTime: 8,  text: "Ẹni tó bá farajì, à á rí èso.",             translation: "One who is patient will see fruit." },
      { id: "ty12-3", startTime: 8,  endTime: 12, text: "Ọwọ́ tó bá fọ ẹni, ẹni á fọ ọ.",           translation: "The hand that washes you, you will wash it." },
      { id: "ty12-4", startTime: 12, endTime: 16, text: "Kò sí ọwọ́ kan tó ṣe ìgbẹ́ tán.",          translation: "There is no single hand that clears the bush alone." },
      { id: "ty12-5", startTime: 16, endTime: 20, text: "Ìbẹ̀rú olúwa ni ìbẹ̀rẹ̀ ọgbọ́n.",          translation: "Fear of God is the beginning of wisdom." },
      { id: "ty12-6", startTime: 20, endTime: 24, text: "Agbàdo tó tọ dàgbà ó dára jù gbogbo.",     translation: "Corn that has grown well is better than all." },
      { id: "ty12-7", startTime: 24, endTime: 27, text: "Asiko ni àṣà àgbẹ̀. Sùúrù ni ìdánilẹ̀kọ̀.", translation: "Timing is the farmer's custom. Patience is the lesson." },
      { id: "ty12-8", startTime: 27, endTime: 30, text: "O se, àgbà. Ẹ̀kọ́ yi yó wà lára mi.",      translation: "Thank you, elder. This lesson will stay with me." },
    ],
  },
  {
    id: "lesson-13", courseId: "course-5", title: "The Selfish Chief",
    description: "A village debates whether a chief who hoards grain deserves their loyalty — proverbs about community.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", duration: 30, order: 2,
    transcript: [
      { id: "ty13-1", startTime: 0,  endTime: 4,  text: "Ọ̀bá wa ti pa àgbò fún ìdílé rẹ̀ nìkan.",  translation: "Our chief slaughtered the ram for his family alone." },
      { id: "ty13-2", startTime: 4,  endTime: 8,  text: "Ìjọba tó ń ṣiṣẹ fún ẹni kan kò tọ́.",     translation: "A government that serves only one person is not right." },
      { id: "ty13-3", startTime: 8,  endTime: 12, text: "Ẹni tó bá jẹun nìkan, ó ń jẹun pẹ̀lú ẹ̀rí ọkàn.", translation: "One who eats alone, eats with their conscience." },
      { id: "ty13-4", startTime: 12, endTime: 16, text: "Ìgbà tí a bá pọ̀ ni a lè gbé àpáta.",      translation: "When we are together we can carry a rock." },
      { id: "ty13-5", startTime: 16, endTime: 20, text: "Ìlú kì í gbé aláìní sílẹ̀.",              translation: "A community does not abandon the needy." },
      { id: "ty13-6", startTime: 20, endTime: 24, text: "Ọ̀bá rere ń gbé nínú ọkàn ẹni aráàlú.",   translation: "A good chief lives in the heart of the citizens." },
      { id: "ty13-7", startTime: 24, endTime: 27, text: "Jẹ ká yàn olórí tuntun, ẹni tó ní ọkàn rere.", translation: "Let us choose a new leader who has a good heart." },
      { id: "ty13-8", startTime: 27, endTime: 30, text: "Àjọ ènìyàn ni ìdúróṣinṣin ìlú.",         translation: "The gathering of people is the strength of the town." },
    ],
  },
];
