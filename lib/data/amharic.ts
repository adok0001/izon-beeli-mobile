import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-am-${id}`, word, english, category, languageId: "amharic", pronunciation, example, exampleTranslation };
}

export const AMHARIC_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "ሰላም", "Hello / Peace", "greetings", "se-lam", "ሰላም፣ ደህና ነህ?", "Hello, how are you?"),
  e(2, "ደህና ነህ?", "How are you? (to male)", "greetings", "deh-na neh", "ደህና ነህ፣ ወንድሜ?", "How are you, brother?"),
  e(3, "ደህና ነሽ?", "How are you? (to female)", "greetings", "deh-na nesh", "ደህና ነሽ፣ እህቴ?", "How are you, sister?"),
  e(4, "ደህና ነኝ", "I am fine", "greetings", "deh-na ne-gn", "ደህና ነኝ፣ አመሰግናለሁ።", "I am fine, thank you."),
  e(5, "አመሰግናለሁ", "Thank you", "greetings", "a-me-seg-na-le-hu", "አመሰግናለሁ ብዙ", "Thank you very much"),
  e(6, "እባክዎ", "Please (formal)", "greetings", "i-bak-wo", "እባክዎ ይቀመጡ።", "Please sit down."),
  e(7, "አዎ", "Yes", "greetings", "a-wo", "አዎ፣ እወቃለሁ።", "Yes, I know."),
  e(8, "አይ", "No", "greetings", "ay", "አይ፣ አልፈልግም።", "No, I don't want it."),
  e(9, "እንኳን ደህና መጡ", "Welcome (formal)", "greetings", "in-kwan deh-na met-u", "እንኳን ደህና መጡ ወደ ቤታችን።", "Welcome to our home."),
  e(10, "ይቅርታ", "Sorry / Excuse me", "greetings", "yiq-ir-ta", "ይቅርታ፣ ልጠይቅዎ?", "Excuse me, may I ask you?"),
  e(11, "ሰዓት ሸኝ", "Goodbye", "greetings", "se-at she-gn", "ሰዓት ሸኝ፣ ቸር ይቆዩ።", "Goodbye, take care."),
  e(12, "ደህና ሁን", "Stay well / Take care", "greetings", "deh-na hun", "ደህና ሁን፣ ወዳጄ።", "Stay well, my friend."),
  e(13, "እሺ", "OK / Alright", "greetings", "i-shi", "እሺ፣ እሄዳለሁ።", "OK, I will go."),
  e(14, "ቀና ቀና", "Just fine / Getting along", "greetings", "qe-na qe-na", "ቀና ቀና ነኝ፣ አንተስ?", "Getting along fine, and you?"),

  // --- Numbers ---
  e(15, "አንድ", "One", "numbers", "and", "አንድ ልጅ አለኝ።", "I have one child."),
  e(16, "ሁለት", "Two", "numbers", "hu-let", "ሁለት ቡና እፈልጋለሁ።", "I want two coffees."),
  e(17, "ሶስት", "Three", "numbers", "sost", "ሶስት ዳቦ ገዛሁ።", "I bought three breads."),
  e(18, "አራት", "Four", "numbers", "a-rat", "አራት ልጆች አሉ።", "There are four children."),
  e(19, "አምስት", "Five", "numbers", "a-mist", "አምስት ብር ስጠኝ።", "Give me five birr."),
  e(20, "ስድስት", "Six", "numbers", "si-dist", "ስድስት ቀናት ቆየሁ።", "I stayed six days."),
  e(21, "ሰባት", "Seven", "numbers", "se-bat", "ሳምንት ሰባት ቀናት አለው።", "A week has seven days."),
  e(22, "ስምንት", "Eight", "numbers", "si-mint", "ስምንት ሰዓት ነው።", "It is eight o'clock."),
  e(23, "ዘጠኝ", "Nine", "numbers", "ze-ten", "ዘጠኝ ብር ብቻ ነው።", "It is only nine birr."),
  e(24, "አስር", "Ten", "numbers", "a-sir", "አስር ዓመቴ ነው።", "I am ten years old."),
  e(25, "ሃያ", "Twenty", "numbers", "ha-ya", "ሃያ ብር ሰጠሁ።", "I gave twenty birr."),
  e(26, "መቶ", "One hundred", "numbers", "me-to", "መቶ ብር አለኝ።", "I have one hundred birr."),
  e(27, "አንድ ሺ", "One thousand", "numbers", "and shi", "አንድ ሺ ብር ወጣ።", "It cost one thousand birr."),

  // --- Family ---
  e(28, "አባት", "Father", "family", "a-bat", "አባቴ ዶክተር ነው", "My father is a doctor"),
  e(29, "እናት", "Mother", "family", "i-nat", "እናቴ ቤት ውስጥ ናት።", "My mother is at home."),
  e(30, "ልጅ", "Child", "family", "lij", "ልጄ ይጫወታል።", "My child is playing."),
  e(31, "ወንድ ልጅ", "Son / Boy", "family", "wend lij", "ወንድ ልጄ ይሮጣል።", "My son is running."),
  e(32, "ሴት ልጅ", "Daughter / Girl", "family", "set lij", "ሴት ልጄ ትዘምራለች።", "My daughter is singing."),
  e(33, "ባል", "Husband", "family", "bal", "ባሌ ይሰራል።", "My husband is working."),
  e(34, "ሚስት", "Wife", "family", "mist", "ሚስቴ ምግብ ትሠራለች።", "My wife is cooking food."),
  e(35, "ወንድም", "Brother", "family", "wen-dim", "ወንድሜ ይማራል።", "My brother is studying."),
  e(36, "እህት", "Sister", "family", "iht", "እህቴ ደግ ናት።", "My sister is kind."),
  e(37, "አያት", "Grandparent", "family", "a-yat", "አያቴ ቤት ነው።", "My grandparent is at home."),
  e(38, "አጎት", "Uncle (father's brother)", "family", "a-got", "አጎቴ ይጠብቀኛል።", "My uncle watches over me."),
  e(39, "ቤተሰብ", "Family", "family", "be-te-seb", "ቤተሰቤ ትልቅ ነው።", "My family is large."),

  // --- Pronouns ---
  e(40, "እኔ", "I / Me", "pronouns", "i-ne", "እኔ ትምህርት ቤት እሄዳለሁ።", "I go to school."),
  e(41, "አንተ", "You (male singular)", "pronouns", "an-te", "አንተ ቡና ትወዳለህ?", "Do you like coffee?"),
  e(42, "አንቺ", "You (female singular)", "pronouns", "an-chi", "አንቺ ደህና ነሽ?", "Are you well?"),
  e(43, "እሱ", "He / Him", "pronouns", "i-su", "እሱ ይበላል።", "He is eating."),
  e(44, "እሷ", "She / Her", "pronouns", "i-swa", "እሷ ትዘምራለች።", "She is singing."),
  e(45, "እኛ", "We / Us", "pronouns", "i-gna", "እኛ አብረን እንሄዳለን።", "We go together."),
  e(46, "እነሱ", "They / Them", "pronouns", "i-ne-su", "እነሱ ቤት ይጫወታሉ።", "They are playing at home."),

  // --- Time ---
  e(47, "ጠዋት", "Morning", "time", "te-wat", "ጠዋት ቡና እጠጣለሁ።", "I drink coffee in the morning."),
  e(48, "ቀን", "Day / Afternoon", "time", "qen", "ቀኑ ደህና ነው።", "The day is fine."),
  e(49, "ምሽት", "Evening", "time", "mi-shit", "ምሽት ቤት እቀምጣለሁ።", "In the evening I stay home."),
  e(50, "ሌሊት", "Night", "time", "le-lit", "ሌሊት እተኛለሁ።", "At night I sleep."),
  e(51, "ዛሬ", "Today", "time", "za-re", "ዛሬ ጥሩ ቀን ነው።", "Today is a good day."),
  e(52, "ነገ", "Tomorrow", "time", "ne-ge", "ነገ ወደ ገበያ እሄዳለሁ።", "Tomorrow I will go to the market."),
  e(53, "ትናንት", "Yesterday", "time", "ti-nant", "ትናንት ዶሮ ወጥ በላሁ።", "Yesterday I ate chicken stew."),
  e(54, "አሁን", "Now", "time", "a-hun", "አሁን እንሄዳለን።", "Now we are going."),
  e(55, "ሰዓት", "Hour / Time / Watch", "time", "se-at", "ስንት ሰዓት ነው?", "What time is it?"),
  e(56, "ሳምንት", "Week", "time", "sam-int", "የሚቀጥለው ሳምንት ይመጣል።", "He will come next week."),

  // --- Verbs ---
  e(57, "ና", "Come (command)", "verbs", "na", "ና ወደ ቤቱ", "Come to the house"),
  e(58, "ሂድ", "Go (command)", "verbs", "hid", "ሂድ ወደ ትምህርት ቤት።", "Go to school."),
  e(59, "ብላ", "Eat (command)", "verbs", "bi-la", "ብላ እንጀራ።", "Eat injera."),
  e(60, "ጠጣ", "Drink", "verbs", "te-ta", "ውሃ ጠጣ።", "Drink water."),
  e(61, "ተኛ", "Sleep", "verbs", "te-gna", "ልጁ ተኛ።", "The child slept."),
  e(62, "ናገረ", "Spoke / Said", "verbs", "na-ge-re", "አማርኛ ናገረ።", "He spoke Amharic."),
  e(63, "አደረገ", "Did / Made", "verbs", "a-de-re-ge", "ምግብ አደረገ።", "He/She made food."),
  e(64, "ሮጠ", "Ran", "verbs", "ro-te", "ልጁ ሮጠ።", "The boy ran."),
  e(65, "ሰማ", "Heard / Listened", "verbs", "se-ma", "ሙዚቃ ሰማ።", "He listened to music."),
  e(66, "አነበበ", "Read", "verbs", "a-ne-be-be", "መጽሐፍ አነበበ።", "He read a book."),

  // --- Food & Drink ---
  e(67, "እንጀራ", "Injera (sourdough flatbread)", "food", "in-je-ra", "እንጀራ ወጥ ጋር ይበላሉ", "Injera is eaten with stew"),
  e(68, "ወጥ", "Stew / Sauce", "food", "wet", "ወጥ ውስጥ ስጋ አለ።", "There is meat in the stew."),
  e(69, "ዶሮ ወጥ", "Chicken stew (national dish)", "food", "do-ro wet", "ዶሮ ወጥ እወዳለሁ።", "I love chicken stew."),
  e(70, "ቡና", "Coffee", "food", "bu-na", "ቡና እጠጣለሁ።", "I am drinking coffee."),
  e(71, "ሻይ", "Tea", "food", "shay", "ሻይ ጠጣሁ።", "I drank tea."),
  e(72, "ውሃ", "Water", "food", "wi-ha", "ንጹህ ውሃ ፈልጋለሁ።", "I want clean water."),
  e(73, "ዳቦ", "Bread", "food", "da-bo", "ዳቦ ገዛሁ።", "I bought bread."),
  e(74, "ስጋ", "Meat", "food", "si-ga", "ስጋ ወደ ገበያ ከፈልኩ።", "I found meat at the market."),
  e(75, "ዓሳ", "Fish", "food", "a-sa", "ዓሳ አበሉኝ።", "They fed me fish."),
  e(76, "ጥብስ", "Tibs (sautéed meat)", "food", "tibs", "ጥብስ ዛሬ በላሁ።", "I ate tibs today."),
  e(77, "ሽሮ", "Chickpea flour stew", "food", "shi-ro", "ሽሮ ወጥ ጥሩ ነው።", "Shiro stew is delicious."),
  e(78, "ቅቤ", "Butter / Ghee", "food", "qi-be", "ቅቤ ወደ እንጀራ ጨምር።", "Add butter to the injera."),
  e(79, "ወተት", "Milk", "food", "we-tet", "ወተት ጠጣሁ።", "I drank milk."),
  e(80, "ምስር ወጥ", "Red lentil stew", "food", "mi-sir wet", "ምስር ወጥ ጣፋጭ ነው።", "Red lentil stew is tasty."),

  // --- Body Parts ---
  e(81, "ራስ", "Head", "body", "ras", "ራሴ ይታመኛል።", "My head aches."),
  e(82, "ዓይን", "Eye", "body", "ayn", "ዓይኖቼ ደህና ናቸው።", "My eyes are fine."),
  e(83, "ጆሮ", "Ear", "body", "jo-ro", "ጆሮዬ ይሰማል።", "My ear can hear."),
  e(84, "አፍ", "Mouth", "body", "af", "አፌን ከፈተሁ።", "I opened my mouth."),
  e(85, "እጅ", "Hand / Arm", "body", "ij", "እጄ ይዘኛል።", "My hand holds things."),
  e(86, "እግር", "Foot / Leg", "body", "i-gir", "እግሬ ይቆጫኛል።", "My foot hurts."),
  e(87, "ልብ", "Heart", "body", "lib", "ልቤ ይመታል።", "My heart beats."),
  e(88, "ሆድ", "Stomach / Belly", "body", "hod", "ሆዴ ይቆጫኛል።", "My stomach hurts."),

  // --- Nouns & Objects ---
  e(89, "ቤት", "House / Home", "nouns", "bet", "ቤቴ ትልቅ ነው።", "My house is big."),
  e(90, "ገበያ", "Market", "nouns", "ge-be-ya", "ወደ ገበያ እሄዳለሁ።", "I am going to the market."),
  e(91, "ትምህርት ቤት", "School", "nouns", "ti-mi-hirt bet", "ልጆቼ ትምህርት ቤት ናቸው።", "My children are at school."),
  e(92, "ገንዘብ", "Money", "nouns", "gen-zeb", "ትንሽ ገንዘብ አለኝ።", "I have a little money."),
  e(93, "ጫካ", "Forest / Bush", "nouns", "cha-ka", "ጫካው ሩቅ ነው።", "The forest is far."),
  e(94, "ወንዝ", "River", "nouns", "wenz", "ወንዙ ሰፊ ነው።", "The river is wide."),
  e(95, "መንገድ", "Road / Way", "nouns", "men-ged", "መንገዱ ረጅም ነው።", "The road is long."),
  e(96, "ፀሐይ", "Sun", "nouns", "tse-hay", "ፀሐይ ዛሬ ሞቃት ነው።", "The sun is hot today."),
  e(97, "ጨረቃ", "Moon", "nouns", "che-re-qa", "ጨረቃ ሌሊት ታበራለች።", "The moon shines at night."),
];
