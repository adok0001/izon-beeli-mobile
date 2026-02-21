import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-ak-${id}`, word, english, category, languageId: "akan", pronunciation, example, exampleTranslation };
}

export const AKAN_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Maakye", "Good morning", "greetings", "maa-che", "Maakye, wo ho te sɛn?", "Good morning, how are you?"),
  e(2, "Maaha", "Good afternoon", "greetings", "maa-ha"),
  e(3, "Maadwo", "Good evening", "greetings", "maa-jwo"),
  e(4, "Ete sɛn?", "How are you?", "greetings", "e-te-sɛn"),
  e(5, "Me ho yɛ", "I am fine", "greetings", "me-ho-yɛ"),
  e(6, "Meda ase", "Thank you", "greetings", "me-da-a-se", "Meda ase pii", "Thank you very much"),
  e(7, "Yoo", "Yes / OK", "greetings", "yoo"),
  e(8, "Daabi", "No", "greetings", "daa-bi"),
  e(9, "Akwaaba", "Welcome", "greetings", "a-kwa-ba", "Akwaaba Kumasi mu", "Welcome to Kumasi"),
  e(10, "Yɛfrɛ wo sɛn?", "What is your name?", "greetings", "ye-fre-wo-sɛn"),
  e(11, "Yaa", "Hello / Greeting (informal)", "greetings", "ya-a"),
  e(12, "Boa me", "Help me / Please help", "greetings", "bo-a-me"),
  e(13, "Nante yie", "Walk well / Goodbye", "greetings", "nan-te-yie"),
  e(14, "Hwɛ yie", "Take care / Be careful", "greetings", "hwɛ-yie"),
  e(15, "Ɛyɛ", "It is good / Fine", "greetings", "ɛ-yɛ"),

  // --- Numbers ---
  e(16, "Baako", "One", "numbers", "baa-ko"),
  e(17, "Mmienu", "Two", "numbers", "mmie-nu"),
  e(18, "Mmiɛnsa", "Three", "numbers", "mmien-sa"),
  e(19, "Ɛnan", "Four", "numbers", "ɛ-nan"),
  e(20, "Enum", "Five", "numbers", "e-num"),
  e(21, "Nsia", "Six", "numbers", "n-sia"),
  e(22, "Nson", "Seven", "numbers", "n-son"),
  e(23, "Nwɔtwe", "Eight", "numbers", "nwɔ-twe"),
  e(24, "Nkron", "Nine", "numbers", "n-kron"),
  e(25, "Edu", "Ten", "numbers", "e-du"),
  e(26, "Aduonu", "Twenty", "numbers", "a-du-o-nu"),
  e(27, "Ɔha", "One hundred", "numbers", "ɔ-ha"),

  // --- Family ---
  e(28, "Agya / Papa", "Father", "family", "a-gya", "Agya m yɛ okuani", "My father is a farmer"),
  e(29, "Maame / Ɛna", "Mother", "family", "maa-me"),
  e(30, "Ɔba", "Child / Son or daughter", "family", "ɔ-ba"),
  e(31, "Ɔkunu", "Husband", "family", "ɔ-ku-nu"),
  e(32, "Ɔyere", "Wife", "family", "ɔ-ye-re"),
  e(33, "Nuabarima", "Brother", "family", "nua-ba-ri-ma"),
  e(34, "Nuabaa", "Sister", "family", "nua-baa"),
  e(35, "Nana", "Grandparent / Elder (respected title)", "family", "na-na"),
  e(36, "Wofa", "Uncle (mother's brother)", "family", "wo-fa"),
  e(37, "Ɔbaa", "Woman / Girl", "family", "ɔ-baa"),
  e(38, "Ɔbarima", "Man / Boy", "family", "ɔ-ba-ri-ma"),
  e(39, "Abusua", "Clan / Family group", "family", "a-bu-sua"),

  // --- Pronouns ---
  e(40, "Me", "I / Me / My", "pronouns", "me"),
  e(41, "Wo", "You / Your", "pronouns", "wo"),
  e(42, "Ɔno", "He / She / It", "pronouns", "ɔ-no"),
  e(43, "Yɛn", "We / Us / Our", "pronouns", "yɛn"),
  e(44, "Wɔn", "They / Them / Their", "pronouns", "wɔn"),

  // --- Time ---
  e(45, "Anopa", "Morning", "time", "a-no-pa"),
  e(46, "Awia", "Midday / Afternoon", "time", "a-wi-a"),
  e(47, "Anwummere", "Evening", "time", "an-wum-me-re"),
  e(48, "Anadwo", "Night", "time", "a-na-jwo"),
  e(49, "Ɛnnɛ", "Today", "time", "ɛn-nɛ"),
  e(50, "Ɔkyena", "Tomorrow", "time", "ɔ-chye-na"),
  e(51, "Ɛnnɛ twirampɔn", "Yesterday", "time", "ɛn-nɛ twi-ram-pɔn"),
  e(52, "Seesei", "Now", "time", "see-sei"),
  e(53, "Ɛda", "Day", "time", "ɛ-da"),
  e(54, "Ɔbosome", "Month", "time", "ɔ-bo-so-me"),

  // --- Verbs ---
  e(55, "Ba", "Come", "verbs", "ba", "Ba ha!", "Come here!"),
  e(56, "Kɔ", "Go", "verbs", "kɔ"),
  e(57, "Di", "Eat", "verbs", "di", "Di aduan pa", "Eat good food"),
  e(58, "Nom", "Drink", "verbs", "nom"),
  e(59, "Da", "Sleep / Lie down", "verbs", "da"),
  e(60, "Kasa", "Speak / Talk", "verbs", "ka-sa"),
  e(61, "Yɛ", "Do / Make / Be", "verbs", "yɛ"),
  e(62, "Hwɛ", "Look / Watch", "verbs", "hwɛ"),
  e(63, "Tia", "Run / Step", "verbs", "ti-a"),
  e(64, "Tie", "Listen / Hear", "verbs", "tie"),

  // --- Food & Drink ---
  e(65, "Fufu", "Pounded yam/cassava", "food", "fu-fu", "Fufu ne abɛnkwan yɛ dɛ", "Fufu with palm soup is delicious"),
  e(66, "Abɛnkwan", "Palm nut soup", "food", "a-bɛn-kwan"),
  e(67, "Kontomire", "Cocoyam leaf stew", "food", "kon-to-mi-re"),
  e(68, "Kelewele", "Spiced fried plantain", "food", "ke-le-we-le"),
  e(69, "Ɔtɔ", "Mashed yam (ceremonial)", "food", "ɔ-tɔ"),
  e(70, "Nsuo", "Water", "food", "n-suo"),
  e(71, "Aduan", "Food", "food", "a-duan"),
  e(72, "Nam", "Meat", "food", "nam"),
  e(73, "Ekɔ", "Fish (cooked)", "food", "e-kɔ"),
  e(74, "Ɛkwan", "Soup", "food", "ɛ-kwan"),
  e(75, "Mankani", "Cassava / Tapioca", "food", "man-ka-ni"),
  e(76, "Bɔfroto", "Fried dough / Puff puff", "food", "bɔf-ro-to"),

  // --- Body Parts ---
  e(77, "Etire", "Head", "body", "e-ti-re"),
  e(78, "Aniwa", "Eye", "body", "a-ni-wa"),
  e(79, "Aso", "Ear", "body", "a-so"),
  e(80, "Anom", "Mouth", "body", "a-nom"),
  e(81, "Nsa", "Hand", "body", "n-sa"),
  e(82, "Nan", "Foot / Leg", "body", "nan"),
  e(83, "Akoma", "Heart", "body", "a-ko-ma"),

  // --- Nouns & Objects ---
  e(84, "Odan / Efie", "House / Home", "nouns", "e-fie"),
  e(85, "Dwa", "Market", "nouns", "dwa"),
  e(86, "Sukuu", "School", "nouns", "su-kuu"),
  e(87, "Sika", "Money / Gold", "nouns", "si-ka"),
  e(88, "Kwae", "Forest", "nouns", "kwae"),
  e(89, "Ɛpo", "Sea / Large water", "nouns", "ɛ-po"),
  e(90, "Kwan", "Road / Path", "nouns", "kwan"),
  e(91, "Owia", "Sun", "nouns", "o-wia"),
  e(92, "Osrane", "Moon", "nouns", "o-sra-ne"),
  e(93, "Ɔkwan pa", "Good path / The right way", "nouns", "ɔ-kwan-pa"),
];
