import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-ha-${id}`, word, english, category, languageId: "hausa", pronunciation, example, exampleTranslation };
}

export const HAUSA_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1,  "Sannu",           "Hello / Greetings",                        "greetings", "san-nu",          "Sannu, yaya gajiya?",          "Hello, how are you?"),
  e(2,  "Ina kwana?",      "How was the night? (morning greeting)",    "greetings", "i-na kwa-na",     "Ina kwana, ɗan'uwa?",          "How was the night, brother?"),
  e(3,  "Lafiya lau",      "Very well (response to greeting)",         "greetings", "la-fi-ya lau",    "Lafiya lau, na gode.",         "Very well, thank you."),
  e(4,  "Yaya aiki?",      "How is work?",                             "greetings", "ya-ya ai-ki",     "Yaya aiki? Lafiya.",           "How is work? Fine."),
  e(5,  "Na gode",         "Thank you",                                "greetings", "na go-de",        "Na gode ɗin yawa.",            "Thank you very much."),
  e(6,  "Barka da zuwa",   "Welcome (lit. blessing on arrival)",       "greetings", "bar-ka da zu-wa", "Barka da zuwa gidanmu.",       "Welcome to our home."),
  e(7,  "Allah ya kiyaye", "May God protect (farewell blessing)",      "greetings", "al-lah ya ki-ya-ye", "Allah ya kiyaye! Sai an jima.", "May God protect! See you later."),
  e(8,  "Sai an jima",     "See you later / Goodbye",                  "greetings", "sai an ji-ma",    "Sai an jima, aboki.",          "See you later, friend."),
  e(9,  "Madalla",         "Well done / Excellent",                    "greetings", "ma-dal-la",       "Madalla da aikin ka!",         "Well done with your work!"),
  e(10, "Yauwa",           "OK / Yes / Agreed",                        "greetings", "yau-wa",          "Yauwa, mun yarda.",            "OK, we agree."),
  e(11, "A'a",             "No",                                       "greetings", "a-a",             "A'a, ban san ba.",             "No, I don't know."),
  e(12, "Yi haƙuri",       "Be patient / Sorry",                       "greetings", "yi ha-ku-ri",     "Yi haƙuri, zan dawo.",         "Be patient, I will return."),
  e(13, "Ina gajiya?",     "How are you? (lit. how is tiredness?)",    "greetings", "i-na ga-ji-ya",   "Ina gajiya? Babu gajiya!",     "How are you? No tiredness (I'm fine)!"),
  e(14, "Barka",           "Blessing / Congratulations",               "greetings", "bar-ka",          "Barka da sallah!",             "Blessed Eid!"),
  e(15, "Sai gobe",        "See you tomorrow",                         "greetings", "sai go-be",       "Sai gobe, Allah ya kiyaye.",   "See you tomorrow, may God protect."),

  // --- Numbers ---
  e(16, "ɗaya",    "One",          "numbers", "ɗa-ya",     "Ina ɗa ɗaya.",           "I have one child."),
  e(17, "biyu",    "Two",          "numbers", "bi-yu",     "Sai biyu.",              "Just two."),
  e(18, "uku",     "Three",        "numbers", "u-ku",      "Kifi uku.",              "Three fish."),
  e(19, "huɗu",    "Four",         "numbers", "hu-ɗu",     "Kwanaki huɗu.",          "Four days."),
  e(20, "biyar",   "Five",         "numbers", "bi-yar",    "Naira biyar.",           "Five naira."),
  e(21, "shida",   "Six",          "numbers", "shi-da",    "Kwanaki shida.",         "Six days."),
  e(22, "bakwai",  "Seven",        "numbers", "bak-wai",   "Mako bakwai.",           "Seven weeks."),
  e(23, "takwas",  "Eight",        "numbers", "tak-was",   "Takwas kaɗai.",          "Only eight."),
  e(24, "tara",    "Nine",         "numbers", "ta-ra",     "Sa'a tara.",             "Nine hours."),
  e(25, "goma",    "Ten",          "numbers", "go-ma",     "Naira goma.",            "Ten naira."),
  e(26, "ashirin", "Twenty",       "numbers", "a-shi-rin", "Shekara ashirin.",       "Twenty years."),
  e(27, "talatin", "Thirty",       "numbers", "ta-la-tin", "Naira talatin.",         "Thirty naira."),
  e(28, "hamsin",  "Fifty",        "numbers", "ham-sin",   "Hamsin da biyar.",       "Fifty-five."),
  e(29, "ɗari",    "One hundred",  "numbers", "ɗa-ri",     "Naira ɗari.",            "One hundred naira."),
  e(30, "dubu",    "One thousand", "numbers", "du-bu",     "Naira dubu ɗaya.",       "One thousand naira."),

  // --- Family ---
  e(31, "uba",      "Father",                "family", "u-ba",      "Uban gida yana aiki.",   "The father of the house is working."),
  e(32, "uwa",      "Mother",                "family", "u-wa",      "Uwar gida tana girki.",  "The mother of the house is cooking."),
  e(33, "yaro",     "Boy / Child (male)",    "family", "ya-ro",     "Yaro yana wasa.",        "The boy is playing."),
  e(34, "yarinya",  "Girl / Child (female)", "family", "ya-rin-ya", "Yarinya tana karatu.",   "The girl is studying."),
  e(35, "ɗan'uwa",  "Brother",              "family", "ɗan-u-wa",  "Ɗan'uwana ya dawo.",    "My brother has returned."),
  e(36, "'yar'uwa", "Sister",               "family", "'yar-u-wa", "'Yar'uwata tana gida.", "My sister is at home."),
  e(37, "kaka",     "Grandfather / Grandmother", "family", "ka-ka", "Kaka na da shekara tamanin.", "My grandparent is eighty years old."),
  e(38, "jika",     "Grandchild",           "family", "ji-ka",     "Jikana ya zo ziyara.",   "My grandchild came to visit."),
  e(39, "miji",     "Husband",              "family", "mi-ji",     "Mijinta likita ne.",     "Her husband is a doctor."),
  e(40, "mata",     "Wife",                 "family", "ma-ta",     "Matata tana kasuwa.",    "My wife is at the market."),
  e(41, "ƙanwa",    "Younger sibling",      "family", "ƙan-wa",    "Ƙanwata ƙarama ce.",    "My younger sibling is small."),
  e(42, "yaya",     "Older sibling",        "family", "ya-ya",     "Yayana ya bar gida.",    "My older sibling left home."),

  // --- Pronouns & People ---
  e(43, "ni",  "I / Me",           "pronouns", "ni",  "Ni ne Musa.",          "I am Musa."),
  e(44, "kai", "You (male)",       "pronouns", "kai", "Kai ma za ka tafi?",   "Will you also go?"),
  e(45, "ke",  "You (female)",     "pronouns", "ke",  "Ke ce ta zo.",         "You are the one who came."),
  e(46, "shi", "He / Him",         "pronouns", "shi", "Shi yana nan.",        "He is here."),
  e(47, "ita", "She / Her",        "pronouns", "i-ta","Ita ce malamar.",      "She is the teacher."),
  e(48, "mu",  "We / Us",          "pronouns", "mu",  "Mu tafi tare.",        "Let us go together."),
  e(49, "ku",  "You (plural)",     "pronouns", "ku",  "Ku zo nan!",           "Come here (plural)!"),
  e(50, "su",  "They / Them",      "pronouns", "su",  "Su suna gida.",        "They are at home."),

  // --- Time ---
  e(51, "yau",     "Today",         "time", "yau",       "Yau muka hadu.",           "We met today."),
  e(52, "jiya",    "Yesterday",     "time", "ji-ya",     "Jiya na tafi kasuwa.",     "Yesterday I went to the market."),
  e(53, "gobe",    "Tomorrow",      "time", "go-be",     "Gobe zan dawo.",           "Tomorrow I will return."),
  e(54, "safiya",  "Morning",       "time", "sa-fi-ya",  "Safiya yana da sanyi.",    "The morning is cold."),
  e(55, "rana",    "Daytime / Sun", "time", "ra-na",     "Rana tana tsami yau.",     "The sun is very hot today."),
  e(56, "dare",    "Night",         "time", "da-re",     "Dare ya yi, zan kwanta.",  "Night has come, I will sleep."),
  e(57, "mako",    "Week",          "time", "ma-ko",     "Mako ɗaya ya wuce.",       "One week has passed."),
  e(58, "wata",    "Month / Moon",  "time", "wa-ta",     "Wata biyu ya wuce.",       "Two months have passed."),
  e(59, "shekara", "Year",          "time", "she-ka-ra", "Shekara ta wuce da sauri.","The year passed quickly."),

  // --- Verbs ---
  e(60, "zo",     "Come",          "verbs", "zo",      "Zo nan!",                  "Come here!"),
  e(61, "je",     "Go",            "verbs", "je",      "Je kasuwa.",               "Go to the market."),
  e(62, "ci",     "Eat",           "verbs", "ci",      "Ci abincin ka.",           "Eat your food."),
  e(63, "sha",    "Drink",         "verbs", "sha",     "Sha ruwa.",                "Drink water."),
  e(64, "kwanta", "Sleep / Lie down", "verbs", "kwan-ta", "Zan kwanta yanzu.",     "I will sleep now."),
  e(65, "yi",     "Do / Make",     "verbs", "yi",      "Yi aikin ka da kyau.",     "Do your work well."),
  e(66, "ga",     "See",           "verbs", "ga",      "Ka ga gobe.",              "You will see tomorrow."),
  e(67, "sani",   "Know",          "verbs", "sa-ni",   "Ban san ba.",              "I don't know."),
  e(68, "son",    "Love / Like",   "verbs", "son",     "Ina son kasuwa.",          "I love the market."),
  e(69, "tafi",   "Leave / Go away", "verbs", "ta-fi", "Ya tafi tuni.",            "He left early."),

  // --- Body ---
  e(70, "kai",    "Head",        "body", "kai",     "Kaina yana ciwo.",      "My head is hurting."),
  e(71, "ido",    "Eye",         "body", "i-do",    "Idona biyu.",           "I have two eyes."),
  e(72, "kunnen", "Ear",         "body", "kun-nen", "Kunnena suna da kyau.", "My ears are good."),
  e(73, "baki",   "Mouth",       "body", "ba-ki",   "Bakina yana raɗaɗi.",  "My mouth is sore."),
  e(74, "hanci",  "Nose",        "body", "han-ci",  "Hancina yana guɗewa.", "My nose is running."),
  e(75, "hannu",  "Hand / Arm",  "body", "han-nu",  "Hannuna yana ciwo.",   "My hand is hurting."),
  e(76, "ƙafa",   "Foot / Leg",  "body", "ƙa-fa",   "Ƙafata ta ji rauni.", "My leg is injured."),
  e(77, "zuciya", "Heart",       "body", "zu-ci-ya","Zuciyata tana farin ciki.", "My heart is happy."),

  // --- Food ---
  e(78, "abinci", "Food",                    "food", "a-bin-ci", "Abinci yana da kyau.",    "The food is good."),
  e(79, "ruwa",   "Water",                   "food", "ru-wa",    "Ina buƙatar ruwa.",       "I need water."),
  e(80, "nama",   "Meat",                    "food", "na-ma",    "Nama ya yi kyau yau.",    "The meat turned out well today."),
  e(81, "kifi",   "Fish",                    "food", "ki-fi",    "Kifi daga tafki.",        "Fish from the lake."),
  e(82, "hatsi",  "Grain / Cereal",          "food", "hat-si",   "Hatsi yana da arha.",     "Grain is cheap."),
  e(83, "madara", "Milk",                    "food", "ma-da-ra", "Madara na shanu.",        "Cow's milk."),
  e(84, "tuwo",   "Pounded grain porridge",  "food", "tu-wo",    "Tuwo da miyan kuka.",     "Tuwo with baobab leaf soup."),
  e(85, "fura",   "Millet gruel balls",      "food", "fu-ra",    "Fura da nono.",           "Fura with fermented milk."),

  // --- Market ---
  e(86, "kasuwa",  "Market",            "market", "ka-su-wa",  "Kasuwa tana da rai.",   "The market is lively."),
  e(87, "saya",    "Buy",               "market", "sa-ya",     "Zan saya kifi yau.",    "I will buy fish today."),
  e(88, "sayarwa", "Sell",              "market", "sa-yar-wa", "Yana sayar da kaya.",   "He is selling goods."),
  e(89, "farashi", "Price",             "market", "fa-ra-shi", "Nawa ne farashi?",      "What is the price?"),
  e(90, "arha",    "Cheap",             "market", "ar-ha",     "Wannan ya yi arha.",    "This is cheap."),
  e(91, "tsada",   "Expensive",         "market", "tsa-da",    "Yana da tsada sosai.",  "It is very expensive."),
  e(92, "kaya",    "Goods / Load",      "market", "ka-ya",     "Kayansa sun yi yawa.",  "His goods are many."),
  e(93, "naira",   "Nigerian currency", "market", "nai-ra",    "Naira ɗari.",           "One hundred naira."),

  // --- Phrases ---
  e(94,  "Ina so",      "I want / I love",       "phrases", "i-na so",      "Ina so in koyi Hausa.",   "I want to learn Hausa."),
  e(95,  "Ba ni da",    "I don't have",           "phrases", "ba ni da",     "Ba ni da kuɗi.",          "I don't have money."),
  e(96,  "Ina ina?",    "Where is it?",           "phrases", "i-na i-na",    "Kasuwa ina ina?",         "Where is the market?"),
  e(97,  "Kana nan?",   "Are you there? (phone)", "phrases", "ka-na nan",    "Kana nan, aboki?",        "Are you there, friend?"),
  e(98,  "Zan dawo",    "I will return",          "phrases", "zan da-wo",    "Zan dawo da safe.",       "I will return in the morning."),
  e(99,  "Ban sani ba", "I don't know",           "phrases", "ban sa-ni ba", "Ban sani ba, yi haƙuri.", "I don't know, be patient."),
  e(100, "Allah ya yi", "God willing",            "phrases", "al-lah ya yi", "Zan zo Allah ya yi.",     "I will come, God willing."),
];
