import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-yo-${id}`, word, english, category, languageId: "yoruba", pronunciation, example, exampleTranslation };
}

export const YORUBA_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "E kaaro", "Good morning", "greetings", "eh ka-ro", "E kaaro, bawo ni?", "Good morning, how are you?"),
  e(2, "E kaasan", "Good afternoon", "greetings", "eh ka-a-san"),
  e(3, "E kaale", "Good evening", "greetings", "eh ka-a-leh"),
  e(4, "Bawo ni?", "How are you?", "greetings", "ba-wo ni"),
  e(5, "Mo dupe", "Thank you", "greetings", "mo du-pe", "Mo dupe lọpọlọpọ", "Thank you very much"),
  e(6, "E jo", "Please", "greetings", "eh jo"),
  e(7, "Beeni", "Yes", "greetings", "be-e-ni"),
  e(8, "Rara", "No", "greetings", "ra-ra"),
  e(9, "E kaabo", "Welcome", "greetings", "eh ka-bo", "E kaabo si ile wa", "Welcome to our home"),
  e(10, "Mo wa dada", "I am fine", "greetings", "mo wa da-da"),
  e(11, "O dabo", "Goodbye", "greetings", "o da-bo"),
  e(12, "E ku ise", "Well done (to someone working)", "greetings", "eh ku i-se"),
  e(13, "E ku ile", "Hello at home", "greetings", "eh ku i-le"),
  e(14, "Jọwọ", "Please (polite)", "greetings", "jo-wo"),
  e(15, "Pele", "Sorry / Get well soon", "greetings", "pe-le"),
  e(16, "O se", "Thank you (informal)", "greetings", "o-se"),

  // --- Numbers ---
  e(17, "Ọkan", "One", "numbers", "o-kan"),
  e(18, "Eji", "Two", "numbers", "e-ji"),
  e(19, "Ẹta", "Three", "numbers", "e-ta"),
  e(20, "Ẹrin", "Four", "numbers", "e-rin"),
  e(21, "Arun", "Five", "numbers", "a-run"),
  e(22, "Ẹfa", "Six", "numbers", "e-fa"),
  e(23, "Ẹjẹ", "Seven", "numbers", "e-je"),
  e(24, "Ẹjọ", "Eight", "numbers", "e-jo"),
  e(25, "Ẹsan", "Nine", "numbers", "e-san"),
  e(26, "Ẹwa", "Ten", "numbers", "e-wa"),
  e(27, "Ogoji", "Forty", "numbers", "o-go-ji"),
  e(28, "Ọgọrun", "One hundred", "numbers", "o-go-run"),

  // --- Family ---
  e(29, "Baba", "Father", "family", "ba-ba", "Baba mi ni olukoni", "My father is a teacher"),
  e(30, "Iya", "Mother", "family", "i-ya"),
  e(31, "Ọmọ", "Child", "family", "o-mo"),
  e(32, "Ọkọ", "Husband", "family", "o-ko"),
  e(33, "Aya", "Wife", "family", "a-ya"),
  e(34, "Aburo", "Younger sibling", "family", "a-bu-ro"),
  e(35, "Egbon", "Older sibling", "family", "eg-bon"),
  e(36, "Ẹbí", "Family / Kin", "family", "e-bi"),
  e(37, "Baba agba", "Grandfather", "family", "ba-ba ag-ba"),
  e(38, "Iya agba", "Grandmother", "family", "i-ya ag-ba"),
  e(39, "Arakunrin", "Brother", "family", "a-ra-kun-rin"),
  e(40, "Arabinrin", "Sister", "family", "a-ra-bin-rin"),

  // --- Pronouns ---
  e(41, "Mi / Mo", "I / Me", "pronouns", "mi"),
  e(42, "Ẹ / Iwo", "You (singular)", "pronouns", "e"),
  e(43, "Oun", "He / She / It", "pronouns", "oun"),
  e(44, "Wa", "We / Us", "pronouns", "wa"),
  e(45, "Awọn", "They / Them", "pronouns", "a-won"),

  // --- Time ---
  e(46, "Owuro", "Morning", "time", "o-wu-ro"),
  e(47, "Osan", "Afternoon / Midday", "time", "o-san"),
  e(48, "Alẹ", "Evening", "time", "a-le"),
  e(49, "Oru", "Night", "time", "o-ru"),
  e(50, "Oni", "Today", "time", "o-ni"),
  e(51, "Ola", "Tomorrow", "time", "o-la"),
  e(52, "Ana", "Yesterday", "time", "a-na"),
  e(53, "Bayi", "Now", "time", "ba-yi"),
  e(54, "Ọjọ", "Day", "time", "o-jo"),
  e(55, "Osù", "Month", "time", "o-su"),
  e(56, "Odún", "Year", "time", "o-dun"),

  // --- Verbs ---
  e(57, "Wá", "Come", "verbs", "wa", "Wá sí ibí!", "Come here!"),
  e(58, "Lọ", "Go", "verbs", "lo"),
  e(59, "Jeun", "Eat", "verbs", "je-un", "Jeun daadaa", "Eat well"),
  e(60, "Mu", "Drink / Take", "verbs", "mu"),
  e(61, "Sùn", "Sleep", "verbs", "sun"),
  e(62, "Sọ", "Say / Speak", "verbs", "so"),
  e(63, "Ṣe", "Do / Make", "verbs", "se"),
  e(64, "Fẹ", "Want / Love", "verbs", "fe"),
  e(65, "Rán", "Run / Send", "verbs", "ran"),
  e(66, "Gbọ", "Hear / Listen", "verbs", "gbo"),
  e(67, "Rí", "See", "verbs", "ri"),

  // --- Food & Drink ---
  e(68, "Ẹba", "Cassava fufu", "food", "e-ba", "Ẹba pẹlu egusi jẹ dara", "Eba with egusi is delicious"),
  e(69, "Àmàlà", "Yam flour fufu", "food", "a-ma-la"),
  e(70, "Ẹwà", "Beans", "food", "e-wa"),
  e(71, "Mọín mọín", "Steamed bean pudding", "food", "mo-in mo-in"),
  e(72, "Àkàrà", "Bean fritters", "food", "a-ka-ra"),
  e(73, "Egúsí", "Melon seed soup", "food", "e-gu-si"),
  e(74, "Ẹja", "Fish", "food", "e-ja"),
  e(75, "Ẹran", "Meat", "food", "e-ran"),
  e(76, "Omi", "Water", "food", "o-mi"),
  e(77, "Oyin", "Honey", "food", "o-yin"),
  e(78, "Epo pupa", "Palm oil", "food", "e-po pu-pa"),
  e(79, "Iyán", "Pounded yam", "food", "i-yan"),
  e(80, "Ẹwédú", "Jute leaf soup", "food", "e-we-du"),

  // --- Body Parts ---
  e(81, "Orí", "Head", "body", "o-ri"),
  e(82, "Ojú", "Eye / Face", "body", "o-ju"),
  e(83, "Etí", "Ear", "body", "e-ti"),
  e(84, "Ẹnu", "Mouth", "body", "e-nu"),
  e(85, "Owó", "Hand", "body", "o-wo"),
  e(86, "Ẹsẹ", "Foot / Leg", "body", "e-se"),
  e(87, "Ọkàn", "Heart", "body", "o-kan"),

  // --- Nouns & Objects ---
  e(88, "Ilé", "House / Home", "nouns", "i-le"),
  e(89, "Ọjà", "Market", "nouns", "o-ja"),
  e(90, "Ilé-ẹkọ", "School", "nouns", "i-le-e-ko"),
  e(91, "Owó", "Money", "nouns", "o-wo"),
  e(92, "Igbó", "Forest / Bush", "nouns", "ig-bo"),
  e(93, "Omi", "Water / River", "nouns", "o-mi"),
  e(94, "Ọ̀nà", "Road / Path", "nouns", "o-na"),
  e(95, "Funfun", "White / Clean", "nouns", "fun-fun"),
  e(96, "Dúdú", "Black", "nouns", "du-du"),
];
