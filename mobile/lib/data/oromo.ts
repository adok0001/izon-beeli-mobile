import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-or-${id}`, word, english, category, languageId: "oromo", pronunciation, example, exampleTranslation };
}

export const OROMO_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Akkam?", "How are you?", "greetings", "ak-kam", "Akkam bulte?", "How did you wake up? (morning greeting)"),
  e(2, "Nageenyaan", "Fine / In peace", "greetings", "na-gen-yan"),
  e(3, "Galatoomi", "Thank you", "greetings", "ga-la-too-mi"),
  e(4, "Eeyyee", "Yes", "greetings", "ey-yee"),
  e(5, "Lakki", "No", "greetings", "lak-ki"),
  e(6, "Baga nagaan dhufte", "Welcome (to a newcomer)", "greetings", "ba-ga na-gan dhuf-te"),
  e(7, "Akkam bultee?", "Good morning (how did you wake up? - to female)", "greetings", "ak-kam bul-tee"),
  e(8, "Nagaa!", "Peace! / Goodbye!", "greetings", "na-gaa"),
  e(9, "Jiraa?", "Are you alive/well?", "greetings", "ji-raa"),
  e(10, "Waaqni si haa eeggatu", "May God protect you", "greetings", "waaq-ni si haa eeg-ga-tu"),
  e(11, "Dhiifama", "Excuse me / Forgive me", "greetings", "dhii-fa-ma"),
  e(12, "Maaf!", "Please / Forgive!", "greetings", "maaf"),

  // --- Numbers ---
  e(13, "Tokko", "One", "numbers", "tok-ko"),
  e(14, "Lama", "Two", "numbers", "la-ma"),
  e(15, "Sadii", "Three", "numbers", "sa-dii"),
  e(16, "Afur", "Four", "numbers", "a-fur"),
  e(17, "Shan", "Five", "numbers", "shan"),
  e(18, "Ja'a", "Six", "numbers", "ja-a"),
  e(19, "Torba", "Seven", "numbers", "tor-ba"),
  e(20, "Saddeet", "Eight", "numbers", "sad-det"),
  e(21, "Sagal", "Nine", "numbers", "sa-gal"),
  e(22, "Kudhan", "Ten", "numbers", "ku-dhan"),
  e(23, "Digdama", "Twenty", "numbers", "dig-da-ma"),
  e(24, "Dhibba", "One hundred", "numbers", "dhib-ba"),

  // --- Family ---
  e(25, "Abbaa", "Father", "family", "ab-baa", "Abbaan koo barsiisaa dha", "My father is a teacher"),
  e(26, "Haadha", "Mother", "family", "haad-ha"),
  e(27, "Ilma", "Son", "family", "il-ma"),
  e(28, "Intala", "Daughter", "family", "in-ta-la"),
  e(29, "Dhiira", "Husband / Man", "family", "dhii-ra"),
  e(30, "Dubartii", "Wife / Woman", "family", "du-bar-tii"),
  e(31, "Obbo", "Brother / Mr. (respectful)", "family", "ob-bo"),
  e(32, "Fiixee", "Sister", "family", "fiix-xe"),
  e(33, "Akaakayyuu", "Grandfather", "family", "a-kaa-kay-yuu"),
  e(34, "Awwoo", "Grandmother", "family", "aw-woo"),
  e(35, "Maatii", "Family", "family", "maa-tii"),

  // --- Pronouns ---
  e(36, "Ani", "I / Me", "pronouns", "a-ni"),
  e(37, "Ati", "You (singular)", "pronouns", "a-ti"),
  e(38, "Inni / Ishiin", "He / She", "pronouns", "in-ni"),
  e(39, "Nuyi", "We / Us", "pronouns", "nu-yi"),
  e(40, "Isaan", "They / Them", "pronouns", "i-saan"),

  // --- Time ---
  e(41, "Ganama", "Morning", "time", "ga-na-ma"),
  e(42, "Guyyaa", "Day / Daytime", "time", "guy-yaa"),
  e(43, "Galgala", "Evening", "time", "gal-ga-la"),
  e(44, "Halkan", "Night", "time", "hal-kan"),
  e(45, "Har'a", "Today", "time", "ha-ra"),
  e(46, "Boru", "Tomorrow", "time", "bo-ru"),
  e(47, "Kaleessa", "Yesterday", "time", "ka-les-sa"),
  e(48, "Amma", "Now", "time", "am-ma"),
  e(49, "Yeroo", "Time / Season", "time", "ye-roo"),

  // --- Verbs ---
  e(50, "Dhufuu", "To come", "verbs", "dhu-fuu", "Asitti dhufaa!", "Come here!"),
  e(51, "Deemuu", "To go", "verbs", "dee-muu"),
  e(52, "Nyaachuu", "To eat", "verbs", "nyaa-chuu"),
  e(53, "Dhuguu", "To drink", "verbs", "dhu-guu"),
  e(54, "Rafuu", "To sleep", "verbs", "ra-fuu"),
  e(55, "Dubbachuu", "To speak", "verbs", "dub-ba-chuu"),
  e(56, "Gochuu", "To do / make", "verbs", "go-chuu"),
  e(57, "Fiiguu", "To run", "verbs", "fii-guu"),
  e(58, "Dhageettuu", "To hear / listen", "verbs", "dha-get-tuu"),

  // --- Food & Drink ---
  e(59, "Injira", "Injera (sourdough flatbread)", "food", "in-ji-ra", "Injiraan nyaadhaa", "Eat injera"),
  e(60, "Marqaa", "Thin porridge", "food", "mar-qaa"),
  e(61, "Foon", "Meat", "food", "foon"),
  e(62, "Aannani", "Milk", "food", "aan-na-ni"),
  e(63, "Dhiyaa", "Butter / Ghee", "food", "dhi-yaa"),
  e(64, "Bishaanii", "Water", "food", "bi-sha-nii"),
  e(65, "Bunaa", "Coffee", "food", "bu-naa"),
  e(66, "Hoolaa", "Sheep (meat)", "food", "hoo-laa"),
  e(67, "Sa'a", "Cow (source of milk)", "food", "sa-a"),
  e(68, "Muuzii", "Banana", "food", "muu-zii"),

  // --- Body Parts ---
  e(69, "Mataa", "Head", "body", "ma-taa"),
  e(70, "Ija", "Eye", "body", "i-ja"),
  e(71, "Gurra", "Ear", "body", "gur-ra"),
  e(72, "Afaan", "Mouth / Language", "body", "a-faan"),
  e(73, "Harka", "Hand / Arm", "body", "har-ka"),
  e(74, "Miila", "Foot / Leg", "body", "mii-la"),
  e(75, "Onnee", "Heart", "body", "on-nee"),

  // --- Nouns & Objects ---
  e(76, "Mana", "House / Home", "nouns", "ma-na"),
  e(77, "Gabaa", "Market", "nouns", "ga-baa"),
  e(78, "Mana barumsaa", "School", "nouns", "ma-na ba-rum-saa"),
  e(79, "Qabeenyaa", "Money / Wealth", "nouns", "qa-ben-yaa"),
  e(80, "Bosona", "Forest", "nouns", "bo-so-na"),
  e(81, "Laga", "River", "nouns", "la-ga"),
  e(82, "Karaa", "Road / Path", "nouns", "ka-raa"),
  e(83, "Aduu", "Sun", "nouns", "a-duu"),
  e(84, "Ji'a", "Moon / Month", "nouns", "ji-a"),
  e(85, "Michuu", "Friend", "nouns", "mi-chuu"),
];
