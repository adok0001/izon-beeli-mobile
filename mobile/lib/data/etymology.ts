export interface EtymologyNode {
  era: string;
  form: string;
  language: string;
  note: string;
}

export interface EtymologyEntry {
  id: string;
  word: string;
  english: string;
  languageId: string;
  trail: EtymologyNode[];
}

export const ETYMOLOGY_DATA: EtymologyEntry[] = [
  {
    id: "ety-yo-1",
    word: "Ìmọ̀",
    english: "Knowledge / Wisdom",
    languageId: "yoruba",
    trail: [
      { era: "Proto-Yoruboid (~1000 BCE)", form: "*imo", language: "Proto-Yoruboid", note: "Root meaning 'to know' found across Yoruba, Igala, and Itsekiri branches." },
      { era: "Classical Yoruba (~800 CE)", form: "imọ", language: "Old Yoruba", note: "Used in Ifá divination corpus to mean deep esoteric knowledge." },
      { era: "19th Century", form: "ìmọ̀", language: "Yoruba", note: "Standardised spelling during the Lagos literacy movement led by Samuel Crowther." },
      { era: "Modern Yoruba", form: "Ìmọ̀", language: "Yoruba", note: "Now covers both practical skill and intellectual knowledge; used in school curricula across Nigeria, Benin, and Togo." },
    ],
  },
  {
    id: "ety-yo-2",
    word: "Ilẹ̀",
    english: "Earth / Land",
    languageId: "yoruba",
    trail: [
      { era: "Proto-Niger-Congo", form: "*ile", language: "Proto-Niger-Congo", note: "Reconstructed root for 'ground' shared across many branches of the Niger-Congo family." },
      { era: "Proto-Yoruboid", form: "*ile", language: "Proto-Yoruboid", note: "Retained the ground/land meaning in all daughter languages." },
      { era: "Classical Yoruba", form: "ilẹ̀", language: "Old Yoruba", note: "Featured in Ifá as Ilẹ̀ Àárọ̀ — the primordial earth formed at Ile-Ife." },
      { era: "Modern Yoruba", form: "Ilẹ̀", language: "Yoruba", note: "Extends to 'floor', 'country', and 'home base'; e.g. Ilẹ̀ Yorùbá = Yorubaland." },
    ],
  },
  {
    id: "ety-ig-1",
    word: "Ọchịchọ",
    english: "Desire / Wish",
    languageId: "igbo",
    trail: [
      { era: "Proto-Igboid (~800 BCE)", form: "*ochi-cho", language: "Proto-Igboid", note: "Reduplicative root expressing intensity of longing, shared with Ekpeye and Oguta dialects." },
      { era: "Old Igbo (~1200 CE)", form: "ọchị ọchị", language: "Old Igbo", note: "Reduplication used to intensify meaning — 'longing upon longing'." },
      { era: "Colonial period", form: "ọchịchọ", language: "Igbo", note: "Merged into single lexeme in the Union Igbo orthographic standard." },
      { era: "Modern Igbo", form: "Ọchịchọ", language: "Igbo", note: "Used in everyday speech and literary Igbo for heartfelt longing or ambition." },
    ],
  },
  {
    id: "ety-sw-1",
    word: "Upendo",
    english: "Love",
    languageId: "swahili",
    trail: [
      { era: "Proto-Bantu (~2000 BCE)", form: "*-pend-", language: "Proto-Bantu", note: "Verb root 'to love / to like' reconstructed across hundreds of Bantu languages from Cameroon to South Africa." },
      { era: "Early Swahili (~900 CE)", form: "kupenda", language: "Old Swahili", note: "Coastal Swahili merchants used it in poetry (tendi) to describe loyalty and longing." },
      { era: "Classical KiUnguja (17th C)", form: "upendo", language: "Classical Swahili", note: "Nominalised with Bantu noun-class prefix u- conveying abstract concepts." },
      { era: "Modern Swahili", form: "Upendo", language: "Swahili", note: "Official Swahili (Tanzania/Kenya). Also a common given name meaning 'Love'." },
    ],
  },
  {
    id: "ety-sw-2",
    word: "Ujasiri",
    english: "Courage / Bravery",
    languageId: "swahili",
    trail: [
      { era: "Arabic influence (~1000 CE)", form: "jasara / jasur", language: "Arabic (جسور)", note: "Swahili coastal towns absorbed many Arabic loanwords during Indian Ocean trade." },
      { era: "Early Swahili", form: "jasiri", language: "Swahili coast", note: "Adapted to Bantu phonology and used in warrior praise poetry." },
      { era: "Classical Swahili", form: "ujasiri", language: "Classical Swahili", note: "Noun class u- applied; became abstract noun for the quality of bravery." },
      { era: "Modern Swahili", form: "Ujasiri", language: "Swahili", note: "Used in national anthems, school texts, and military contexts across East Africa." },
    ],
  },
  {
    id: "ety-ha-1",
    word: "Ilimi",
    english: "Knowledge / Education",
    languageId: "hausa",
    trail: [
      { era: "Arabic source (~1000 CE)", form: "ʿilm (علم)", language: "Classical Arabic", note: "Entered Hausa through Islamic scholarship via trans-Saharan trade routes." },
      { era: "Hausa adaptation (~1400 CE)", form: "ilimi", language: "Hausa", note: "Phonetically adapted; long Arabic ī became short i, final m retained." },
      { era: "Fulani Jihad era (1804–1830)", form: "ilimi", language: "Hausa/Fulfulde", note: "Proliferated as Usman dan Fodio's caliphate emphasised literacy and Islamic education." },
      { era: "Modern Hausa", form: "Ilimi", language: "Hausa", note: "Means both religious learning and secular education in contemporary usage." },
    ],
  },
  {
    id: "ety-am-1",
    word: "ፍቅር",
    english: "Love",
    languageId: "amharic",
    trail: [
      { era: "Proto-Semitic (~3000 BCE)", form: "*fkr", language: "Proto-Semitic", note: "Triliteral root shared across Semitic family (Arabic فكر 'thought/care', Hebrew פֶּקֶר cognate)." },
      { era: "Ge'ez / Classical Ethiopic (~400 CE)", form: "ፍቅር (fǝqr)", language: "Ge'ez", note: "Used extensively in the Kebra Nagast and other sacred texts to mean divine love." },
      { era: "Medieval Amharic (~1400 CE)", form: "ፍቅር", language: "Old Amharic", note: "Carried into Amharic as the spoken language developed from Ge'ez." },
      { era: "Modern Amharic", form: "ፍቅር (fǝqǝr)", language: "Amharic", note: "Most common word for romantic and familial love in modern Ethiopia." },
    ],
  },
  {
    id: "ety-ak-1",
    word: "Ɔdɔ",
    english: "Love",
    languageId: "akan",
    trail: [
      { era: "Proto-Kwa (~1500 BCE)", form: "*odo", language: "Proto-Kwa", note: "Root for affection shared across Kwa subfamily including Akan, Fante, and Baule." },
      { era: "Old Akan (~1000 CE)", form: "ɔdɔ", language: "Old Akan", note: "Recorded in oral histories of Asante and Fante as central to family and political bonds." },
      { era: "Asante Twi (18th C)", form: "ɔdɔ", language: "Asante Twi", note: "Featured in proverbs of the Asante Confederacy: 'Ɔdɔ na ɛhyɛ yɛn den' — 'Love is our strength'." },
      { era: "Modern Akan", form: "Ɔdɔ", language: "Akan/Twi", note: "Used across Twi, Fante, and Akuapem dialects. Also a popular given name." },
    ],
  },
  {
    id: "ety-iz-1",
    word: "Ere",
    english: "Person / Human being",
    languageId: "izon",
    trail: [
      { era: "Proto-Ijoid (~2000 BCE)", form: "*ere", language: "Proto-Ijoid", note: "The word for 'person' is among the most ancient reconstructible roots in the Ijoid family." },
      { era: "Old Izon (~500 CE)", form: "ere", language: "Old Izon", note: "Central to kinship terms and social organisation of Niger Delta communities." },
      { era: "Colonial contact (19th C)", form: "ere", language: "Izon", note: "Retained unchanged despite pressure from English and Pidgin Nigerian contact." },
      { era: "Modern Izon", form: "Ere", language: "Izon", note: "Still the primary word for 'person'; Ijaw Nation uses it in cultural revitalisation programmes." },
    ],
  },
];

export function getEtymologyForLanguage(languageId: string): EtymologyEntry[] {
  return ETYMOLOGY_DATA.filter((e) => e.languageId === languageId);
}

export function getAllEtymology(): EtymologyEntry[] {
  return ETYMOLOGY_DATA;
}
