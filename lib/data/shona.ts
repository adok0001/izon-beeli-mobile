import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-sh-${id}`, word, english, category, languageId: "shona", pronunciation, example, exampleTranslation };
}

export const SHONA_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Mhoro", "Hello", "greetings", "m-ho-ro", "Mhoro, makadii?", "Hello, how are you?"),
  e(2, "Mangwanani", "Good morning", "greetings", "mang-wa-na-ni"),
  e(3, "Masikati", "Good afternoon", "greetings", "ma-si-ka-ti"),
  e(4, "Manheru", "Good evening", "greetings", "man-he-ru"),
  e(5, "Makadii?", "How are you? (to one elder or group)", "greetings", "ma-ka-dii"),
  e(6, "Ndiripamwe", "I am fine / I am together (reply)", "greetings", "ndi-ri-pa-mwe"),
  e(7, "Maita basa", "Thank you (for the work/effort)", "greetings", "ma-i-ta ba-sa"),
  e(8, "Ndatenda", "Thank you", "greetings", "n-da-ten-da"),
  e(9, "Hongu", "Yes", "greetings", "hon-gu"),
  e(10, "Kwete", "No", "greetings", "kwe-te"),
  e(11, "Mauya", "Welcome", "greetings", "ma-u-ya", "Mauya kumusha medu", "Welcome to our home"),
  e(12, "Ndine urombo", "I am sorry", "greetings", "ndi-ne u-rom-bo"),
  e(13, "Fambai zvakanaka", "Go well / Goodbye (to departing person)", "greetings", "fam-ba-i zva-ka-na-ka"),
  e(14, "Sarai zvakanaka", "Stay well (to person remaining)", "greetings", "sa-ra-i zva-ka-na-ka"),
  e(15, "Ndapota", "Please", "greetings", "n-da-po-ta"),

  // --- Numbers ---
  e(16, "Rimwe", "One", "numbers", "rim-we"),
  e(17, "Piri", "Two", "numbers", "pi-ri"),
  e(18, "Tatu", "Three", "numbers", "ta-tu"),
  e(19, "Ina", "Four", "numbers", "i-na"),
  e(20, "Shanu", "Five", "numbers", "sha-nu"),
  e(21, "Tanhatu", "Six", "numbers", "tan-ha-tu"),
  e(22, "Nomwe", "Seven", "numbers", "nom-we"),
  e(23, "Sere", "Eight", "numbers", "se-re"),
  e(24, "Pfumbamwe", "Nine", "numbers", "pfum-bam-we"),
  e(25, "Gumi", "Ten", "numbers", "gu-mi"),
  e(26, "Makumi maviri", "Twenty", "numbers", "ma-ku-mi ma-vi-ri"),
  e(27, "Zana", "One hundred", "numbers", "za-na"),

  // --- Family ---
  e(28, "Baba", "Father", "family", "ba-ba", "Baba vangu vari mudzidzisi", "My father is a teacher"),
  e(29, "Amai", "Mother", "family", "a-ma-i"),
  e(30, "Mwana", "Child", "family", "m-wa-na"),
  e(31, "Mwanakomana", "Son", "family", "m-wa-na-ko-ma-na"),
  e(32, "Mwanasikana", "Daughter", "family", "m-wa-na-si-ka-na"),
  e(33, "Murume", "Husband / Man", "family", "mu-ru-me"),
  e(34, "Mukadzi", "Wife / Woman", "family", "mu-ka-dzi"),
  e(35, "Hama", "Relative / Family member", "family", "ha-ma"),
  e(36, "Sekuru", "Grandfather / Uncle (maternal)", "family", "se-ku-ru"),
  e(37, "Mbuya", "Grandmother / Aunt (maternal)", "family", "m-bu-ya"),
  e(38, "Imba", "Family / Household", "family", "im-ba"),

  // --- Pronouns ---
  e(39, "Ndiri / Ini", "I / Me", "pronouns", "ini"),
  e(40, "Iwe", "You (singular)", "pronouns", "i-we"),
  e(41, "Iye", "He / She / It", "pronouns", "i-ye"),
  e(42, "Isu", "We / Us", "pronouns", "i-su"),
  e(43, "Imi", "You (plural)", "pronouns", "i-mi"),
  e(44, "Ivo", "They / Them", "pronouns", "i-vo"),

  // --- Time ---
  e(45, "Mangwanani", "Morning", "time", "mang-wa-na-ni"),
  e(46, "Masikati", "Afternoon / Midday", "time", "ma-si-ka-ti"),
  e(47, "Manheru", "Evening", "time", "man-he-ru"),
  e(48, "Usiku", "Night", "time", "u-si-ku"),
  e(49, "Nhasi", "Today", "time", "nha-si"),
  e(50, "Mangwana", "Tomorrow", "time", "mang-wa-na"),
  e(51, "Nezuro", "Yesterday", "time", "ne-zu-ro"),
  e(52, "Zvino", "Now", "time", "zvi-no"),
  e(53, "Nguva", "Time", "time", "n-gu-va"),
  e(54, "Svondo", "Week", "time", "svon-do"),

  // --- Verbs ---
  e(55, "Uya", "Come", "verbs", "u-ya", "Uya pano!", "Come here!"),
  e(56, "Enda", "Go", "verbs", "en-da"),
  e(57, "Dya", "Eat", "verbs", "dya", "Dya sadza", "Eat sadza"),
  e(58, "Nwa", "Drink", "verbs", "n-wa"),
  e(59, "Rara", "Sleep", "verbs", "ra-ra"),
  e(60, "Taura", "Speak / Talk", "verbs", "ta-u-ra"),
  e(61, "Ita", "Do / Make", "verbs", "i-ta"),
  e(62, "Mhanya", "Run", "verbs", "m-ha-nya"),
  e(63, "Terera", "Listen / Hear", "verbs", "te-re-ra"),
  e(64, "Ona", "See / Look", "verbs", "o-na"),

  // --- Food & Drink ---
  e(65, "Sadza", "Thick cornmeal porridge (national dish)", "food", "sad-za", "Sadza nenyama ndizvo chikafu chedu", "Sadza with meat is our food"),
  e(66, "Nyama", "Meat", "food", "nya-ma"),
  e(67, "Muriwo", "Vegetable relish", "food", "mu-ri-wo"),
  e(68, "Dovi", "Peanut butter relish", "food", "do-vi"),
  e(69, "Bota", "Thin porridge", "food", "bo-ta"),
  e(70, "Muto", "Soup / Broth", "food", "mu-to"),
  e(71, "Mvura", "Water", "food", "m-vu-ra"),
  e(72, "Tii", "Tea", "food", "tii"),
  e(73, "Mazai", "Eggs", "food", "ma-za-i"),
  e(74, "Huku", "Chicken", "food", "hu-ku"),
  e(75, "Nhopi", "Pumpkin (cooked)", "food", "n-ho-pi"),
  e(76, "Maputi", "Popcorn", "food", "ma-pu-ti"),
  e(77, "Madhumbe", "Cocoyam / Taro", "food", "ma-dhum-be"),

  // --- Body Parts ---
  e(78, "Musoro", "Head", "body", "mu-so-ro"),
  e(79, "Ziso", "Eye (sing.) / Meso (pl.)", "body", "zi-so"),
  e(80, "Nzeve", "Ear", "body", "n-ze-ve"),
  e(81, "Muromo", "Mouth", "body", "mu-ro-mo"),
  e(82, "Ruoko", "Hand / Arm", "body", "ru-o-ko"),
  e(83, "Gumbo", "Foot / Leg", "body", "gum-bo"),
  e(84, "Moyo", "Heart", "body", "mo-yo"),
  e(85, "Dumbu", "Stomach", "body", "dum-bu"),

  // --- Nouns & Objects ---
  e(86, "Imba", "House / Home", "nouns", "im-ba"),
  e(87, "Musika", "Market", "nouns", "mu-si-ka"),
  e(88, "Chikoro", "School", "nouns", "chi-ko-ro"),
  e(89, "Mari", "Money", "nouns", "ma-ri"),
  e(90, "Sango", "Forest / Wild bush", "nouns", "san-go"),
  e(91, "Rwizi", "River", "nouns", "r-wi-zi"),
  e(92, "Mugwagwa", "Road / Street", "nouns", "mu-gwa-gwa"),
  e(93, "Zuva", "Sun / Day", "nouns", "zu-va"),
  e(94, "Mwedzi", "Moon / Month", "nouns", "m-wed-zi"),
  e(95, "Shamwari", "Friend", "nouns", "sham-wa-ri"),
  e(96, "Musha", "Village / Rural home", "nouns", "mu-sha"),
];
