import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-am-${id}`, word, english, category, languageId: "amharic", pronunciation, example, exampleTranslation };
}

export const AMHARIC_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "ሰላም", "Hello / Peace", "greetings", "se-lam", "ሰላም፣ ደህና ነህ?", "Hello, how are you?"),
  e(2, "ደህና ነህ?", "How are you? (to male)", "greetings", "deh-na neh"),
  e(3, "ደህና ነሽ?", "How are you? (to female)", "greetings", "deh-na nesh"),
  e(4, "ደህና ነኝ", "I am fine", "greetings", "deh-na ne-gn"),
  e(5, "አመሰግናለሁ", "Thank you", "greetings", "a-me-seg-na-le-hu", "አመሰግናለሁ ብዙ", "Thank you very much"),
  e(6, "እባክዎ", "Please (formal)", "greetings", "i-bak-wo"),
  e(7, "አዎ", "Yes", "greetings", "a-wo"),
  e(8, "አይ", "No", "greetings", "ay"),
  e(9, "እንኳን ደህና መጡ", "Welcome (formal)", "greetings", "in-kwan deh-na met-u"),
  e(10, "ይቅርታ", "Sorry / Excuse me", "greetings", "yiq-ir-ta"),
  e(11, "ሰዓት ሸኝ", "Goodbye", "greetings", "se-at she-gn"),
  e(12, "ደህና ሁን", "Stay well / Take care", "greetings", "deh-na hun"),
  e(13, "እሺ", "OK / Alright", "greetings", "i-shi"),
  e(14, "ቀና ቀና", "Just fine / Getting along", "greetings", "qe-na qe-na"),

  // --- Numbers ---
  e(15, "አንድ", "One", "numbers", "and"),
  e(16, "ሁለት", "Two", "numbers", "hu-let"),
  e(17, "ሶስት", "Three", "numbers", "sost"),
  e(18, "አራት", "Four", "numbers", "a-rat"),
  e(19, "አምስት", "Five", "numbers", "a-mist"),
  e(20, "ስድስት", "Six", "numbers", "si-dist"),
  e(21, "ሰባት", "Seven", "numbers", "se-bat"),
  e(22, "ስምንት", "Eight", "numbers", "si-mint"),
  e(23, "ዘጠኝ", "Nine", "numbers", "ze-ten"),
  e(24, "አስር", "Ten", "numbers", "a-sir"),
  e(25, "ሃያ", "Twenty", "numbers", "ha-ya"),
  e(26, "መቶ", "One hundred", "numbers", "me-to"),
  e(27, "አንድ ሺ", "One thousand", "numbers", "and shi"),

  // --- Family ---
  e(28, "አባት", "Father", "family", "a-bat", "አባቴ ዶክተር ነው", "My father is a doctor"),
  e(29, "እናት", "Mother", "family", "i-nat"),
  e(30, "ልጅ", "Child", "family", "lij"),
  e(31, "ወንድ ልጅ", "Son / Boy", "family", "wend lij"),
  e(32, "ሴት ልጅ", "Daughter / Girl", "family", "set lij"),
  e(33, "ባል", "Husband", "family", "bal"),
  e(34, "ሚስት", "Wife", "family", "mist"),
  e(35, "ወንድም", "Brother", "family", "wen-dim"),
  e(36, "እህት", "Sister", "family", "iht"),
  e(37, "አያት", "Grandparent", "family", "a-yat"),
  e(38, "አጎት", "Uncle (father's brother)", "family", "a-got"),
  e(39, "ቤተሰብ", "Family", "family", "be-te-seb"),

  // --- Pronouns ---
  e(40, "እኔ", "I / Me", "pronouns", "i-ne"),
  e(41, "አንተ", "You (male singular)", "pronouns", "an-te"),
  e(42, "አንቺ", "You (female singular)", "pronouns", "an-chi"),
  e(43, "እሱ", "He / Him", "pronouns", "i-su"),
  e(44, "እሷ", "She / Her", "pronouns", "i-swa"),
  e(45, "እኛ", "We / Us", "pronouns", "i-gna"),
  e(46, "እነሱ", "They / Them", "pronouns", "i-ne-su"),

  // --- Time ---
  e(47, "ጠዋት", "Morning", "time", "te-wat"),
  e(48, "ቀን", "Day / Afternoon", "time", "qen"),
  e(49, "ምሽት", "Evening", "time", "mi-shit"),
  e(50, "ሌሊት", "Night", "time", "le-lit"),
  e(51, "ዛሬ", "Today", "time", "za-re"),
  e(52, "ነገ", "Tomorrow", "time", "ne-ge"),
  e(53, "ትናንት", "Yesterday", "time", "ti-nant"),
  e(54, "አሁን", "Now", "time", "a-hun"),
  e(55, "ሰዓት", "Hour / Time / Watch", "time", "se-at"),
  e(56, "ሳምንት", "Week", "time", "sam-int"),

  // --- Verbs ---
  e(57, "ና", "Come (command)", "verbs", "na", "ና ወደ ቤቱ", "Come to the house"),
  e(58, "ሂድ", "Go (command)", "verbs", "hid"),
  e(59, "ብላ", "Eat (command)", "verbs", "bi-la"),
  e(60, "ጠጣ", "Drink", "verbs", "te-ta"),
  e(61, "ተኛ", "Sleep", "verbs", "te-gna"),
  e(62, "ናገረ", "Spoke / Said", "verbs", "na-ge-re"),
  e(63, "አደረገ", "Did / Made", "verbs", "a-de-re-ge"),
  e(64, "ሮጠ", "Ran", "verbs", "ro-te"),
  e(65, "ሰማ", "Heard / Listened", "verbs", "se-ma"),
  e(66, "አነበበ", "Read", "verbs", "a-ne-be-be"),

  // --- Food & Drink ---
  e(67, "እንጀራ", "Injera (sourdough flatbread)", "food", "in-je-ra", "እንጀራ ወጥ ጋር ይበላሉ", "Injera is eaten with stew"),
  e(68, "ወጥ", "Stew / Sauce", "food", "wet"),
  e(69, "ዶሮ ወጥ", "Chicken stew (national dish)", "food", "do-ro wet"),
  e(70, "ቡና", "Coffee", "food", "bu-na"),
  e(71, "ሻይ", "Tea", "food", "shay"),
  e(72, "ውሃ", "Water", "food", "wi-ha"),
  e(73, "ዳቦ", "Bread", "food", "da-bo"),
  e(74, "ስጋ", "Meat", "food", "si-ga"),
  e(75, "ዓሳ", "Fish", "food", "a-sa"),
  e(76, "ጥብስ", "Tibs (sautéed meat)", "food", "tibs"),
  e(77, "ሽሮ", "Chickpea flour stew", "food", "shi-ro"),
  e(78, "ቅቤ", "Butter / Ghee", "food", "qi-be"),
  e(79, "ወተት", "Milk", "food", "we-tet"),
  e(80, "ምስር ወጥ", "Red lentil stew", "food", "mi-sir wet"),

  // --- Body Parts ---
  e(81, "ራስ", "Head", "body", "ras"),
  e(82, "ዓይን", "Eye", "body", "ayn"),
  e(83, "ጆሮ", "Ear", "body", "jo-ro"),
  e(84, "አፍ", "Mouth", "body", "af"),
  e(85, "እጅ", "Hand / Arm", "body", "ij"),
  e(86, "እግር", "Foot / Leg", "body", "i-gir"),
  e(87, "ልብ", "Heart", "body", "lib"),
  e(88, "ሆድ", "Stomach / Belly", "body", "hod"),

  // --- Nouns & Objects ---
  e(89, "ቤት", "House / Home", "nouns", "bet"),
  e(90, "ገበያ", "Market", "nouns", "ge-be-ya"),
  e(91, "ትምህርት ቤት", "School", "nouns", "ti-mi-hirt bet"),
  e(92, "ገንዘብ", "Money", "nouns", "gen-zeb"),
  e(93, "ጫካ", "Forest / Bush", "nouns", "cha-ka"),
  e(94, "ወንዝ", "River", "nouns", "wenz"),
  e(95, "መንገድ", "Road / Way", "nouns", "men-ged"),
  e(96, "ፀሐይ", "Sun", "nouns", "tse-hay"),
  e(97, "ጨረቃ", "Moon", "nouns", "che-re-qa"),
];
