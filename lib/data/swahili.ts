import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-sw-${id}`, word, english, category, languageId: "swahili", pronunciation, example, exampleTranslation };
}

export const SWAHILI_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Hujambo", "How are you? (singular)", "greetings", "hu-jam-bo", "Hujambo rafiki!", "How are you, friend!"),
  e(2, "Sijambo", "I am fine (reply to hujambo)", "greetings", "si-jam-bo"),
  e(3, "Habari?", "What's the news? / How are you?", "greetings", "ha-ba-ri"),
  e(4, "Nzuri", "Good / Fine", "greetings", "n-zu-ri"),
  e(5, "Asante", "Thank you", "greetings", "a-san-te", "Asante sana", "Thank you very much"),
  e(6, "Tafadhali", "Please", "greetings", "ta-fa-dha-li"),
  e(7, "Ndiyo", "Yes", "greetings", "n-di-yo"),
  e(8, "Hapana", "No", "greetings", "ha-pa-na"),
  e(9, "Karibu", "Welcome / You're welcome", "greetings", "ka-ri-bu", "Karibu nyumbani", "Welcome home"),
  e(10, "Samahani", "Sorry / Excuse me", "greetings", "sa-ma-ha-ni"),
  e(11, "Kwaheri", "Goodbye", "greetings", "kwa-he-ri"),
  e(12, "Mambo?", "What's up? (informal)", "greetings", "mam-bo"),
  e(13, "Poa", "Cool / Fine (informal reply)", "greetings", "po-a"),
  e(14, "Shikamoo", "Respectful greeting (to elder)", "greetings", "shi-ka-moo"),
  e(15, "Marahaba", "Reply to shikamoo (from elder)", "greetings", "ma-ra-ha-ba"),

  // --- Numbers ---
  e(16, "Moja", "One", "numbers", "mo-ja"),
  e(17, "Mbili", "Two", "numbers", "m-bi-li"),
  e(18, "Tatu", "Three", "numbers", "ta-tu"),
  e(19, "Nne", "Four", "numbers", "n-ne"),
  e(20, "Tano", "Five", "numbers", "ta-no"),
  e(21, "Sita", "Six", "numbers", "si-ta"),
  e(22, "Saba", "Seven", "numbers", "sa-ba"),
  e(23, "Nane", "Eight", "numbers", "na-ne"),
  e(24, "Tisa", "Nine", "numbers", "ti-sa"),
  e(25, "Kumi", "Ten", "numbers", "ku-mi"),
  e(26, "Ishirini", "Twenty", "numbers", "i-shi-ri-ni"),
  e(27, "Mia", "One hundred", "numbers", "mi-a"),
  e(28, "Elfu", "One thousand", "numbers", "el-fu"),

  // --- Family ---
  e(29, "Baba", "Father", "family", "ba-ba", "Baba yangu ni daktari", "My father is a doctor"),
  e(30, "Mama", "Mother", "family", "ma-ma"),
  e(31, "Mtoto", "Child", "family", "m-to-to"),
  e(32, "Mwana", "Son / Offspring", "family", "m-wa-na"),
  e(33, "Mume", "Husband", "family", "mu-me"),
  e(34, "Mke", "Wife", "family", "m-ke"),
  e(35, "Ndugu", "Sibling / Relative / Fellow", "family", "n-du-gu"),
  e(36, "Dada", "Sister", "family", "da-da"),
  e(37, "Kaka", "Brother (informal)", "family", "ka-ka"),
  e(38, "Babu", "Grandfather", "family", "ba-bu"),
  e(39, "Bibi", "Grandmother / Mrs / Lady", "family", "bi-bi"),
  e(40, "Familia", "Family", "family", "fa-mi-li-a"),

  // --- Pronouns ---
  e(41, "Mimi", "I / Me", "pronouns", "mi-mi"),
  e(42, "Wewe", "You (singular)", "pronouns", "we-we"),
  e(43, "Yeye", "He / She / It", "pronouns", "ye-ye"),
  e(44, "Sisi", "We / Us", "pronouns", "si-si"),
  e(45, "Ninyi", "You (plural)", "pronouns", "ni-nyi"),
  e(46, "Wao", "They / Them", "pronouns", "wa-o"),

  // --- Time ---
  e(47, "Asubuhi", "Morning", "time", "a-su-bu-hi"),
  e(48, "Mchana", "Midday / Afternoon", "time", "m-cha-na"),
  e(49, "Jioni", "Evening", "time", "ji-o-ni"),
  e(50, "Usiku", "Night", "time", "u-si-ku"),
  e(51, "Leo", "Today", "time", "le-o"),
  e(52, "Kesho", "Tomorrow", "time", "ke-sho"),
  e(53, "Jana", "Yesterday", "time", "ja-na"),
  e(54, "Sasa", "Now", "time", "sa-sa"),
  e(55, "Wakati", "Time", "time", "wa-ka-ti"),
  e(56, "Wiki", "Week", "time", "wi-ki"),
  e(57, "Mwaka", "Year", "time", "m-wa-ka"),

  // --- Verbs ---
  e(58, "Kuja", "To come", "verbs", "ku-ja", "Kuja hapa", "Come here"),
  e(59, "Kwenda", "To go", "verbs", "kwen-da"),
  e(60, "Kula", "To eat", "verbs", "ku-la"),
  e(61, "Kunywa", "To drink", "verbs", "ku-nywa"),
  e(62, "Kulala", "To sleep", "verbs", "ku-la-la"),
  e(63, "Kusema", "To speak / say", "verbs", "ku-se-ma"),
  e(64, "Kufanya", "To do / make", "verbs", "ku-fa-nya"),
  e(65, "Kuandika", "To write", "verbs", "ku-an-di-ka"),
  e(66, "Kusikia", "To hear / listen", "verbs", "ku-si-ki-a"),
  e(67, "Kuona", "To see", "verbs", "ku-o-na"),
  e(68, "Kukimbia", "To run", "verbs", "ku-kim-bi-a"),

  // --- Food & Drink ---
  e(69, "Ugali", "Maize porridge (staple)", "food", "u-ga-li", "Ugali na sukuma wiki", "Ugali with kale"),
  e(70, "Wali", "Cooked rice", "food", "wa-li"),
  e(71, "Maharagwe", "Beans", "food", "ma-ha-rag-we"),
  e(72, "Nyama", "Meat", "food", "nya-ma"),
  e(73, "Samaki", "Fish", "food", "sa-ma-ki"),
  e(74, "Mboga", "Vegetables / Relish", "food", "m-bo-ga"),
  e(75, "Chakula", "Food / Meal", "food", "cha-ku-la"),
  e(76, "Chai", "Tea", "food", "cha-i"),
  e(77, "Maji", "Water", "food", "ma-ji"),
  e(78, "Pilau", "Spiced rice", "food", "pi-lau"),
  e(79, "Chapati", "Flatbread", "food", "cha-pa-ti"),
  e(80, "Mandazi", "Fried dough", "food", "man-da-zi"),
  e(81, "Nazi", "Coconut", "food", "na-zi"),

  // --- Body Parts ---
  e(82, "Kichwa", "Head", "body", "ki-chwa"),
  e(83, "Jicho", "Eye (sing.) / Macho (pl.)", "body", "ji-cho"),
  e(84, "Sikio", "Ear", "body", "si-ki-o"),
  e(85, "Mdomo", "Mouth", "body", "m-do-mo"),
  e(86, "Mkono", "Hand / Arm", "body", "m-ko-no"),
  e(87, "Mguu", "Foot / Leg", "body", "m-guu"),
  e(88, "Moyo", "Heart", "body", "mo-yo"),
  e(89, "Tumbo", "Stomach / Belly", "body", "tum-bo"),

  // --- Nouns & Objects ---
  e(90, "Nyumba", "House / Home", "nouns", "nyu-m-ba"),
  e(91, "Soko", "Market", "nouns", "so-ko"),
  e(92, "Shule", "School", "nouns", "shu-le"),
  e(93, "Pesa", "Money", "nouns", "pe-sa"),
  e(94, "Msitu", "Forest", "nouns", "m-si-tu"),
  e(95, "Mto", "River", "nouns", "m-to"),
  e(96, "Barabara", "Road / Street", "nouns", "ba-ra-ba-ra"),
  e(97, "Jua", "Sun", "nouns", "ju-a"),
  e(98, "Mwezi", "Moon / Month", "nouns", "m-we-zi"),
  e(99, "Rafiki", "Friend", "nouns", "ra-fi-ki"),
];
