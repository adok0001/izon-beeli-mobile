/**
 * Yoruba lessons — course-yoruba-fw (First Words) · course-yoruba-ot (Oral Tradition)
 */
import type { LessonData } from "./types";

export const YORUBA_LESSONS: LessonData[] = [
  // ── Yoruba Basics (course-4) ──────────────────────────────────────────
  {
    id: "yoruba-fw-1", courseId: "course-yoruba-fw", title: "Adé Goes to Market",
    description: "Follow young Adé as he greets neighbors on his way to Oja Oba, the king's market.",
    audioUrl: null, duration: null, order: 1,
    transcript: [
      { id: "yoruba-fw-1-1", startTime: 0, endTime: 3.5, text: "Ọmọ ọja kan jí ni kutukutu owurọ", translation: "A trader's son woke up early one morning" },
      { id: "yoruba-fw-1-2", startTime: 3.5, endTime: 7, text: "E kaaro o! ó kí iya rẹ", translation: "Good morning! he greeted his mother" },
      { id: "yoruba-fw-1-3", startTime: 7, endTime: 11, text: "Bawo ni, ọmọ mi? iya rẹ bi", translation: "How are you, my child? his mother asked" },
      { id: "yoruba-fw-1-4", startTime: 11, endTime: 15, text: "Mo wa daadaa. Mo fẹ lọ si ọja", translation: "I am fine. I want to go to the market" },
      { id: "yoruba-fw-1-5", startTime: 15, endTime: 19, text: "Oruko mi ni Adé, ó sọ fun alajapa kan", translation: "My name is Adé, he told a stranger" },
      { id: "yoruba-fw-1-6", startTime: 19, endTime: 23, text: "Nibo lo n lo? alajapa naa bi", translation: "Where are you going? the stranger asked" },
      { id: "yoruba-fw-1-7", startTime: 23, endTime: 27, text: "Mo n lo si ọja. E se pupo!", translation: "I am going to the market. Thank you very much!" },
      { id: "yoruba-fw-1-8", startTime: 27, endTime: 30, text: "O dabo! Adé yọ si ọja", translation: "Goodbye! Adé smiled as he reached the market" },
    ],
  },
  {
    id: "yoruba-fw-2", courseId: "course-yoruba-fw", title: "Counting Cowries",
    description: "Adé's mother teaches him to count cowrie shells at her market stall.",
    audioUrl: null, duration: null, order: 2,
    transcript: [
      { id: "yoruba-fw-2-1", startTime: 0,  endTime: 4,  text: "Ọmọ mi, wa wo cowries wọ̀nyí.",           translation: "My child, come look at these cowries." },
      { id: "yoruba-fw-2-2", startTime: 4,  endTime: 8,  text: "Ọkan, eji, ẹta, ẹrin, àrún...",           translation: "One, two, three, four, five..." },
      { id: "yoruba-fw-2-3", startTime: 8,  endTime: 12, text: "Ẹfà, èje, ẹjọ, ẹsàn, ẹwá.",             translation: "Six, seven, eight, nine, ten." },
      { id: "yoruba-fw-2-4", startTime: 12, endTime: 16, text: "Mélò ni nínú àpò yìí?",                   translation: "How many are in this bag?" },
      { id: "yoruba-fw-2-5", startTime: 16, endTime: 20, text: "Ogún cowries nínú àpò kọọkan.",           translation: "Twenty cowries in each bag." },
      { id: "yoruba-fw-2-6", startTime: 20, endTime: 24, text: "Ẹwa ni ọjà lónì, Adé. A ń tà daadaa.",   translation: "The market is beautiful today, Adé. We are selling well." },
      { id: "yoruba-fw-2-7", startTime: 24, endTime: 27, text: "Bẹẹni, ìyá! Mo ka wọn. Ogún gbẹdẹ.",    translation: "Yes, mother! I counted them. Exactly twenty." },
      { id: "yoruba-fw-2-8", startTime: 27, endTime: 30, text: "Daadaa pupọ! Ọmọ rere ni ọ.",             translation: "Very good! You are a good child." },
    ],
  },
  {
    id: "yoruba-fw-3", courseId: "course-yoruba-fw", title: "Adé Meets the Family",
    description: "Adé introduces a new friend to his large Yoruba family at a naming ceremony.",
    audioUrl: null, duration: null, order: 3,
    transcript: [
      { id: "yoruba-fw-3-1", startTime: 0,  endTime: 4,  text: "Kolade, ẹ káàbọ̀ sí ilé wa.",             translation: "Kolade, welcome to our home." },
      { id: "yoruba-fw-3-2", startTime: 4,  endTime: 8,  text: "Eléyìí ni bàbá mi, Àjànàkú.",             translation: "This is my father, Àjànàkú." },
      { id: "yoruba-fw-3-3", startTime: 8,  endTime: 12, text: "Eléyìí ni ìyá mi, Àbíkẹ́.",               translation: "This is my mother, Àbíkẹ́." },
      { id: "yoruba-fw-3-4", startTime: 12, endTime: 16, text: "Eléyìí ni àgbàgbà wa, ẹni ọgọ́ta ọdún.", translation: "This is our elder, a person of sixty years." },
      { id: "yoruba-fw-3-5", startTime: 16, endTime: 20, text: "Orúkọ rẹ ń jẹ́ Kọ́lá. Ó túmọ̀ sí ọrọ̀.", translation: "His name is Kọ́lá. It means wealth." },
      { id: "yoruba-fw-3-6", startTime: 20, endTime: 24, text: "A ń dárúkọ ọmọ tuntun lónìí. Inú dídùn.", translation: "We are naming a new baby today. It is joyful." },
      { id: "yoruba-fw-3-7", startTime: 24, endTime: 27, text: "Bàbá ẹni ń sọ orúkọ. Ìdílé gbádùn.",     translation: "One's father speaks the name. The family rejoices." },
      { id: "yoruba-fw-3-8", startTime: 27, endTime: 30, text: "Ẹ jẹ ká jẹun. Ẹ jẹ ká yọ̀!",             translation: "Let us eat. Let us rejoice!" },
    ],
  },

  // ── Yoruba Proverbs (course-5) ────────────────────────────────────────
  {
    id: "yoruba-ot-1", courseId: "course-yoruba-ot", title: "The Patient Farmer",
    description: "An elder teaches patience through Yoruba proverbs as a young farmer struggles with his harvest.",
    audioUrl: null, duration: null, order: 1,
    transcript: [
      { id: "yoruba-ot-1-1", startTime: 0,  endTime: 4,  text: "Ọmọ mi, igi tó bá pẹ̀ ni igi tó ga.",      translation: "My child, the tree that waits long is the tallest tree." },
      { id: "yoruba-ot-1-2", startTime: 4,  endTime: 8,  text: "Ẹni tó bá farajì, à á rí èso.",             translation: "One who is patient will see fruit." },
      { id: "yoruba-ot-1-3", startTime: 8,  endTime: 12, text: "Ọwọ́ tó bá fọ ẹni, ẹni á fọ ọ.",           translation: "The hand that washes you, you will wash it." },
      { id: "yoruba-ot-1-4", startTime: 12, endTime: 16, text: "Kò sí ọwọ́ kan tó ṣe ìgbẹ́ tán.",          translation: "There is no single hand that clears the bush alone." },
      { id: "yoruba-ot-1-5", startTime: 16, endTime: 20, text: "Ìbẹ̀rú olúwa ni ìbẹ̀rẹ̀ ọgbọ́n.",          translation: "Fear of God is the beginning of wisdom." },
      { id: "yoruba-ot-1-6", startTime: 20, endTime: 24, text: "Agbàdo tó tọ dàgbà ó dára jù gbogbo.",     translation: "Corn that has grown well is better than all." },
      { id: "yoruba-ot-1-7", startTime: 24, endTime: 27, text: "Asiko ni àṣà àgbẹ̀. Sùúrù ni ìdánilẹ̀kọ̀.", translation: "Timing is the farmer's custom. Patience is the lesson." },
      { id: "yoruba-ot-1-8", startTime: 27, endTime: 30, text: "O se, àgbà. Ẹ̀kọ́ yi yó wà lára mi.",      translation: "Thank you, elder. This lesson will stay with me." },
    ],
  },
  {
    id: "yoruba-ot-2", courseId: "course-yoruba-ot", title: "The Selfish Chief",
    description: "A village debates whether a chief who hoards grain deserves their loyalty — proverbs about community.",
    audioUrl: null, duration: null, order: 2,
    transcript: [
      { id: "yoruba-ot-2-1", startTime: 0,  endTime: 4,  text: "Ọ̀bá wa ti pa àgbò fún ìdílé rẹ̀ nìkan.",  translation: "Our chief slaughtered the ram for his family alone." },
      { id: "yoruba-ot-2-2", startTime: 4,  endTime: 8,  text: "Ìjọba tó ń ṣiṣẹ fún ẹni kan kò tọ́.",     translation: "A government that serves only one person is not right." },
      { id: "yoruba-ot-2-3", startTime: 8,  endTime: 12, text: "Ẹni tó bá jẹun nìkan, ó ń jẹun pẹ̀lú ẹ̀rí ọkàn.", translation: "One who eats alone, eats with their conscience." },
      { id: "yoruba-ot-2-4", startTime: 12, endTime: 16, text: "Ìgbà tí a bá pọ̀ ni a lè gbé àpáta.",      translation: "When we are together we can carry a rock." },
      { id: "yoruba-ot-2-5", startTime: 16, endTime: 20, text: "Ìlú kì í gbé aláìní sílẹ̀.",              translation: "A community does not abandon the needy." },
      { id: "yoruba-ot-2-6", startTime: 20, endTime: 24, text: "Ọ̀bá rere ń gbé nínú ọkàn ẹni aráàlú.",   translation: "A good chief lives in the heart of the citizens." },
      { id: "yoruba-ot-2-7", startTime: 24, endTime: 27, text: "Jẹ ká yàn olórí tuntun, ẹni tó ní ọkàn rere.", translation: "Let us choose a new leader who has a good heart." },
      { id: "yoruba-ot-2-8", startTime: 27, endTime: 30, text: "Àjọ ènìyàn ni ìdúróṣinṣin ìlú.",         translation: "The gathering of people is the strength of the town." },
    ],
  },
];
