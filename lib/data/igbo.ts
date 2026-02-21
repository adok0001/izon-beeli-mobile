import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-ig-${id}`, word, english, category, languageId: "igbo", pronunciation, example, exampleTranslation };
}

export const IGBO_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Ụtụtụ ọma", "Good morning", "greetings", "u-tu-tu o-ma", "Ụtụtụ ọma, kedụ ka ị mere?", "Good morning, how are you?"),
  e(2, "Ehihie ọma", "Good afternoon", "greetings", "e-hi-hie o-ma"),
  e(3, "Anyasị ọma", "Good evening", "greetings", "a-nya-si o-ma"),
  e(4, "Ndewo", "Hello / Greetings (to elder)", "greetings", "n-de-wo"),
  e(5, "Daalu", "Thank you", "greetings", "da-a-lu", "Daalu nke ukwuu!", "Thank you very much!"),
  e(6, "Biko", "Please", "greetings", "bi-ko"),
  e(7, "Ee", "Yes", "greetings", "ee"),
  e(8, "Mba", "No", "greetings", "m-ba"),
  e(9, "Nnọọ", "Welcome", "greetings", "n-no-o", "Nnọọ n'ụlọ anyị", "Welcome to our home"),
  e(10, "Kedụ", "How are you?", "greetings", "ke-du"),
  e(11, "Adị m mma", "I am fine", "greetings", "a-di m m-ma"),
  e(12, "Ọ dị mma", "It is fine / OK", "greetings", "o di m-ma"),
  e(13, "Nna m", "My father / Sir (respectful)", "greetings", "n-na m"),
  e(14, "Nne m", "My mother / Ma'am (respectful)", "greetings", "n-ne m"),
  e(15, "Gaa ọcha", "Goodbye", "greetings", "ga-a o-cha"),
  e(16, "Ka ọ dị", "Goodbye / Until later", "greetings", "ka o di"),
  e(17, "Pyụta", "I'm sorry / Excuse me", "greetings", "pyu-ta"),

  // --- Numbers ---
  e(18, "Otu", "One", "numbers", "o-tu"),
  e(19, "Abụọ", "Two", "numbers", "a-buo"),
  e(20, "Atọ", "Three", "numbers", "a-to"),
  e(21, "Anọ", "Four", "numbers", "a-no"),
  e(22, "Ise", "Five", "numbers", "i-se"),
  e(23, "Isii", "Six", "numbers", "i-si-i"),
  e(24, "Asaa", "Seven", "numbers", "a-sa-a"),
  e(25, "Asatọ", "Eight", "numbers", "a-sa-to"),
  e(26, "Itoolu", "Nine", "numbers", "i-too-lu"),
  e(27, "Iri", "Ten", "numbers", "i-ri"),
  e(28, "Iri na otu", "Eleven", "numbers", "i-ri na o-tu"),
  e(29, "Iri abụọ", "Twenty", "numbers", "i-ri a-buo"),
  e(30, "Nari", "One hundred", "numbers", "na-ri"),

  // --- Family ---
  e(31, "Nna", "Father", "family", "n-na", "Nna m bụ onye ọrụ", "My father is a worker"),
  e(32, "Nne", "Mother", "family", "n-ne"),
  e(33, "Nwa", "Child", "family", "n-wa"),
  e(34, "Nwanne", "Sibling / Brother or sister", "family", "nwan-ne"),
  e(35, "Ọkpara", "First son / Heir", "family", "ok-pa-ra"),
  e(36, "Ada", "First daughter", "family", "a-da"),
  e(37, "Di", "Husband", "family", "di"),
  e(38, "Nwunye", "Wife", "family", "nwu-nye"),
  e(39, "Nna ochie", "Grandfather", "family", "n-na o-chie"),
  e(40, "Nne ochie", "Grandmother", "family", "n-ne o-chie"),
  e(41, "Ụmụnna", "Extended family / Kinsmen", "family", "u-mu-n-na"),
  e(42, "Ọbịa", "Visitor / Guest", "family", "o-bi-a"),

  // --- Pronouns ---
  e(43, "Mụ / M", "I / Me", "pronouns", "mu"),
  e(44, "Gị / I", "You (singular)", "pronouns", "gi"),
  e(45, "Ya", "He / She / It", "pronouns", "ya"),
  e(46, "Anyị", "We (inclusive)", "pronouns", "a-nyi"),
  e(47, "Ha", "They / Them", "pronouns", "ha"),

  // --- Time ---
  e(48, "Ụtụtụ", "Morning", "time", "u-tu-tu"),
  e(49, "Ehihie", "Afternoon / Midday", "time", "e-hi-hie"),
  e(50, "Anyasị", "Evening", "time", "a-nya-si"),
  e(51, "Abali", "Night", "time", "a-ba-li"),
  e(52, "Taa", "Today", "time", "ta-a"),
  e(53, "Echi", "Tomorrow", "time", "e-chi"),
  e(54, "Ụnyaahụ", "Yesterday", "time", "u-nya-a-hu"),
  e(55, "Ugbu a", "Now", "time", "ug-bu a"),
  e(56, "Oge", "Time / Season", "time", "o-ge"),

  // --- Verbs ---
  e(57, "Bia", "Come", "verbs", "bi-a", "Bia ebe a!", "Come here!"),
  e(58, "Gaa", "Go", "verbs", "ga-a"),
  e(59, "Rie", "Eat", "verbs", "ri-e", "Bie nri", "Eat food"),
  e(60, "Ṅụọ", "Drink", "verbs", "nuo"),
  e(61, "Nọ", "Stay / Be (somewhere)", "verbs", "no"),
  e(62, "Lie", "Sleep", "verbs", "li-e"),
  e(63, "Kwuo", "Say / Speak", "verbs", "kwu-o"),
  e(64, "Mee", "Do / Make", "verbs", "me-e"),
  e(65, "Suọ", "Run", "verbs", "suo"),
  e(66, "Kọọ", "Tell / Narrate", "verbs", "koo"),
  e(67, "Gụọ", "Read / Count", "verbs", "guo"),

  // --- Food & Drink ---
  e(68, "Ji", "Yam (king of crops)", "food", "ji", "Ji bụ eze ihe oriri Igbo", "Yam is the king of Igbo crops"),
  e(69, "Ede", "Cocoyam / Taro", "food", "e-de"),
  e(70, "Ọjị", "Kola nut (sacred)", "food", "o-ji"),
  e(71, "Ofe onugbu", "Bitter leaf soup", "food", "o-fe o-nu-gbu"),
  e(72, "Ofe egusi", "Melon seed soup", "food", "o-fe e-gu-si"),
  e(73, "Nri", "Food / Meal", "food", "n-ri"),
  e(74, "Mmanya", "Drink / Palm wine", "food", "mma-nya"),
  e(75, "Mmiri", "Water", "food", "mmi-ri"),
  e(76, "Abacha", "African salad (cassava strips)", "food", "a-ba-cha"),
  e(77, "Akpu / Fufu", "Cassava fufu", "food", "a-kpu"),
  e(78, "Ụbọchị", "Day / Daytime", "time", "u-bo-chi"),

  // --- Body Parts ---
  e(79, "Isi", "Head", "body", "i-si"),
  e(80, "Anya", "Eye", "body", "a-nya"),
  e(81, "Ntị", "Ear", "body", "n-ti"),
  e(82, "Ọnụ", "Mouth", "body", "o-nu"),
  e(83, "Aka", "Hand", "body", "a-ka"),
  e(84, "Ụkwụ", "Foot / Leg", "body", "u-kwu"),
  e(85, "Obi", "Heart / Chest", "body", "o-bi"),

  // --- Nouns & Objects ---
  e(86, "Ụlọ", "House / Home", "nouns", "u-lo"),
  e(87, "Ahịa", "Market", "nouns", "a-hia"),
  e(88, "Ụlọ akwụkwọ", "School", "nouns", "u-lo a-kwu-kwo"),
  e(89, "Akwụkwọ", "Book / Paper / Leaf", "nouns", "a-kwu-kwo"),
  e(90, "Ego", "Money", "nouns", "e-go"),
  e(91, "Ọhịa", "Forest / Bush", "nouns", "o-hia"),
  e(92, "Mmiri", "Water / River", "nouns", "mmi-ri"),
  e(93, "Ụzọ", "Road / Path / Way", "nouns", "u-zo"),
  e(94, "Ọcha", "White / Clean", "nouns", "o-cha"),
  e(95, "Oji oji", "Black / Dark", "nouns", "o-ji o-ji"),
];
