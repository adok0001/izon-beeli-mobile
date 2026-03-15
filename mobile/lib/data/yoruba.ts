import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-yo-${id}`, word, english, category, languageId: "yoruba", pronunciation, example, exampleTranslation };
}

export const YORUBA_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "E kaaro", "Good morning", "greetings", "eh ka-ro", "E kaaro, bawo ni?", "Good morning, how are you?"),
  e(2, "E kaasan", "Good afternoon", "greetings", "eh ka-a-san", "E kaasan, e ku ise", "Good afternoon, well done"),
  e(3, "E kaale", "Good evening", "greetings", "eh ka-a-leh", "E kaale, bawo ni ile?", "Good evening, how is the family?"),
  e(4, "Bawo ni?", "How are you?", "greetings", "ba-wo ni", "Bawo ni, egbon mi?", "How are you, my older sibling?"),
  e(5, "Mo dupe", "Thank you", "greetings", "mo du-pe", "Mo dupe lọpọlọpọ", "Thank you very much"),
  e(6, "E jo", "Please", "greetings", "eh jo", "E jo, ran mi lọwọ", "Please, help me"),
  e(7, "Beeni", "Yes", "greetings", "be-e-ni", "Beeni, mo gba", "Yes, I agree"),
  e(8, "Rara", "No", "greetings", "ra-ra", "Rara, mi o fẹ", "No, I don't want it"),
  e(9, "E kaabo", "Welcome", "greetings", "eh ka-bo", "E kaabo si ile wa", "Welcome to our home"),
  e(10, "Mo wa dada", "I am fine", "greetings", "mo wa da-da", "Mo wa dada, o se", "I am fine, thank you"),
  e(11, "O dabo", "Goodbye", "greetings", "o da-bo", "O dabo, a o pade", "Goodbye, we will meet again"),
  e(12, "E ku ise", "Well done (to someone working)", "greetings", "eh ku i-se", "E ku ise, e ko rẹ", "Well done, don't get tired"),
  e(13, "E ku ile", "Hello at home", "greetings", "eh ku i-le", "E ku ile, gbogbo eniyan!", "Hello at home, everyone!"),
  e(14, "Jọwọ", "Please (polite)", "greetings", "jo-wo", "Jọwọ, fi mi silẹ", "Please, leave me"),
  e(15, "Pele", "Sorry / Get well soon", "greetings", "pe-le", "Pele, ma bẹru", "Sorry, don't be afraid"),
  e(16, "O se", "Thank you (informal)", "greetings", "o-se", "O se pupo", "Thank you so much"),

  // --- Numbers ---
  e(17, "Ọkan", "One", "numbers", "o-kan", "Mo ní ọmọ ọkan", "I have one child"),
  e(18, "Eji", "Two", "numbers", "e-ji", "Mo ra ẹja eji", "I bought two fish"),
  e(19, "Ẹta", "Three", "numbers", "e-ta", "Wa ẹta wa nibi", "There are three of us here"),
  e(20, "Ẹrin", "Four", "numbers", "e-rin", "Mo ni ẹgbẹ ẹrin", "I have four friends"),
  e(21, "Arun", "Five", "numbers", "a-run", "Arun ọjọ ni ose", "Five days in a week"),
  e(22, "Ẹfa", "Six", "numbers", "e-fa", "Mo ra ẹfa", "I bought six"),
  e(23, "Ẹjẹ", "Seven", "numbers", "e-je", "Ẹjẹ ọjọ ni ose", "Seven days in a week"),
  e(24, "Ẹjọ", "Eight", "numbers", "e-jo", "Ẹjọ ọmọ wa nibi", "Eight children are here"),
  e(25, "Ẹsan", "Nine", "numbers", "e-san", "Mo ni ẹsan naira", "I have nine naira"),
  e(26, "Ẹwa", "Ten", "numbers", "e-wa", "Mo ni ẹwa naira", "I have ten naira"),
  e(27, "Ogoji", "Forty", "numbers", "o-go-ji", "Ogoji eniyan wa", "Forty people are here"),
  e(28, "Ọgọrun", "One hundred", "numbers", "o-go-run", "Ọgọrun naira ni", "It is one hundred naira"),

  // --- Family ---
  e(29, "Baba", "Father", "family", "ba-ba", "Baba mi ni olukoni", "My father is a teacher"),
  e(30, "Iya", "Mother", "family", "i-ya", "Iya mi wa nile", "My mother is at home"),
  e(31, "Ọmọ", "Child", "family", "o-mo", "Ọmọ mi rẹrin", "My child is laughing"),
  e(32, "Ọkọ", "Husband", "family", "o-ko", "Ọkọ mi lọ ṣiṣẹ", "My husband went to work"),
  e(33, "Aya", "Wife", "family", "a-ya", "Aya mi jeun", "My wife is eating"),
  e(34, "Aburo", "Younger sibling", "family", "a-bu-ro", "Aburo mi wa nibi", "My younger sibling is here"),
  e(35, "Egbon", "Older sibling", "family", "eg-bon", "Egbon mi ṣe iranlọwọ", "My older sibling helped me"),
  e(36, "Ẹbí", "Family / Kin", "family", "e-bi", "Ẹbí mi tobi", "My family is large"),
  e(37, "Baba agba", "Grandfather", "family", "ba-ba ag-ba", "Baba agba mi ti dagba", "My grandfather is old"),
  e(38, "Iya agba", "Grandmother", "family", "i-ya ag-ba", "Iya agba mi sùn", "My grandmother is sleeping"),
  e(39, "Arakunrin", "Brother", "family", "a-ra-kun-rin", "Arakunrin mi giga ni", "My brother is tall"),
  e(40, "Arabinrin", "Sister", "family", "a-ra-bin-rin", "Arabinrin mi wa ile-ẹkọ", "My sister is at school"),

  // --- Pronouns ---
  e(41, "Mi / Mo", "I / Me", "pronouns", "mi", "Mo fẹ lọ ile", "I want to go home"),
  e(42, "Ẹ / Iwo", "You (singular)", "pronouns", "e", "Iwo ni ọrẹ mi", "You are my friend"),
  e(43, "Oun", "He / She / It", "pronouns", "oun", "Oun lọ ile", "He/She went home"),
  e(44, "Wa", "We / Us", "pronouns", "wa", "Wa jeun papọ", "We eat together"),
  e(45, "Awọn", "They / Them", "pronouns", "a-won", "Awọn wa nibi", "They are here"),

  // --- Time ---
  e(46, "Owuro", "Morning", "time", "o-wu-ro", "Mo ji ni owuro", "I wake up in the morning"),
  e(47, "Osan", "Afternoon / Midday", "time", "o-san", "Mo jeun ni osan", "I eat in the afternoon"),
  e(48, "Alẹ", "Evening", "time", "a-le", "Alẹ ni ẹbí pade", "The family meets in the evening"),
  e(49, "Oru", "Night", "time", "o-ru", "Mo sùn ni oru", "I sleep at night"),
  e(50, "Oni", "Today", "time", "o-ni", "Oni ni ojo ibi mi", "Today is my birthday"),
  e(51, "Ola", "Tomorrow", "time", "o-la", "Ola ni mo lọ", "I am going tomorrow"),
  e(52, "Ana", "Yesterday", "time", "a-na", "Ana mo ri rẹ", "Yesterday I saw you"),
  e(53, "Bayi", "Now", "time", "ba-yi", "Wá bayi!", "Come now!"),
  e(54, "Ọjọ", "Day", "time", "o-jo", "Ọjọ yi dara", "This day is fine"),
  e(55, "Osù", "Month", "time", "o-su", "Osù yi pọ iṣẹ", "This month has much work"),
  e(56, "Odún", "Year", "time", "o-dun", "Odún tuntun ni yi", "This is a new year"),

  // --- Verbs ---
  e(57, "Wá", "Come", "verbs", "wa", "Wá sí ibí!", "Come here!"),
  e(58, "Lọ", "Go", "verbs", "lo", "Mo fẹ lọ ile", "I want to go home"),
  e(59, "Jeun", "Eat", "verbs", "je-un", "Jeun daadaa", "Eat well"),
  e(60, "Mu", "Drink / Take", "verbs", "mu", "Mu omi yii", "Drink this water"),
  e(61, "Sùn", "Sleep", "verbs", "sun", "Mo fẹ sùn", "I want to sleep"),
  e(62, "Sọ", "Say / Speak", "verbs", "so", "Sọ Yoruba fun mi", "Speak Yoruba to me"),
  e(63, "Ṣe", "Do / Make", "verbs", "se", "Ṣe iṣẹ rẹ", "Do your work"),
  e(64, "Fẹ", "Want / Love", "verbs", "fe", "Mo fẹ ọ", "I love you"),
  e(65, "Rán", "Run / Send", "verbs", "ran", "Mo rán ọrọ si i", "I sent a message to him"),
  e(66, "Gbọ", "Hear / Listen", "verbs", "gbo", "Gbọ ohun mi", "Listen to my voice"),
  e(67, "Rí", "See", "verbs", "ri", "Mo rí rẹ lana", "I saw you yesterday"),

  // --- Food & Drink ---
  e(68, "Ẹba", "Cassava fufu", "food", "e-ba", "Ẹba pẹlu egusi jẹ dara", "Eba with egusi is delicious"),
  e(69, "Àmàlà", "Yam flour fufu", "food", "a-ma-la", "Mo fẹ àmàlà pẹlu ewedu", "I want amala with ewedu"),
  e(70, "Ẹwà", "Beans", "food", "e-wa", "Ẹwà ti jinna", "The beans are cooked"),
  e(71, "Mọín mọín", "Steamed bean pudding", "food", "mo-in mo-in", "Mo ra mọín mọín loja", "I bought moin moin at the market"),
  e(72, "Àkàrà", "Bean fritters", "food", "a-ka-ra", "Àkàrà gbona dun", "Hot bean fritters are tasty"),
  e(73, "Egúsí", "Melon seed soup", "food", "e-gu-si", "Egúsí mi dun gidigidi", "My egusi soup is very delicious"),
  e(74, "Ẹja", "Fish", "food", "e-ja", "Mo ra ẹja loja", "I bought fish at the market"),
  e(75, "Ẹran", "Meat", "food", "e-ran", "Ẹran yi dun", "This meat is tasty"),
  e(76, "Omi", "Water", "food", "o-mi", "Mo mu omi tutu", "I drank cold water"),
  e(77, "Oyin", "Honey", "food", "o-yin", "Oyin jẹ didun", "Honey is sweet"),
  e(78, "Epo pupa", "Palm oil", "food", "e-po pu-pa", "Epo pupa wa ninu onjẹ", "Palm oil is in the food"),
  e(79, "Iyán", "Pounded yam", "food", "i-yan", "Iyán pẹlu egúsí dára", "Pounded yam with egusi is good"),
  e(80, "Ẹwédú", "Jute leaf soup", "food", "e-we-du", "Àmàlà pẹlu ẹwédú dára", "Amala with ewedu is good"),

  // --- Body Parts ---
  e(81, "Orí", "Head", "body", "o-ri", "Orí mi nfarapa", "My head hurts"),
  e(82, "Ojú", "Eye / Face", "body", "o-ju", "Ojú mi n'wo rẹ", "My eyes are looking at you"),
  e(83, "Etí", "Ear", "body", "e-ti", "Etí mi gbọ rẹ", "My ears hear you"),
  e(84, "Ẹnu", "Mouth", "body", "e-nu", "Ẹnu mi n'dun", "My mouth hurts"),
  e(85, "Owó", "Hand", "body", "o-wo", "Owó mi kún", "My hands are full"),
  e(86, "Ẹsẹ", "Foot / Leg", "body", "e-se", "Ẹsẹ mi nfarapa", "My leg hurts"),
  e(87, "Ọkàn", "Heart", "body", "o-kan", "Ọkàn mi yọ", "My heart is glad"),

  // --- Nouns & Objects ---
  e(88, "Ilé", "House / Home", "nouns", "i-le", "Ilé mi tobi", "My house is big"),
  e(89, "Ọjà", "Market", "nouns", "o-ja", "Mo lọ si ọjà", "I went to the market"),
  e(90, "Ilé-ẹkọ", "School", "nouns", "i-le-e-ko", "Ọmọ mi wa ilé-ẹkọ", "My child is at school"),
  e(91, "Owó", "Money", "nouns", "o-wo", "Owó mi ti pari", "My money is finished"),
  e(92, "Igbó", "Forest / Bush", "nouns", "ig-bo", "Igbó wa jina", "The forest is far away"),
  e(93, "Omi", "Water / River", "nouns", "o-mi", "Omi n'ṣàn yara", "The river flows quickly"),
  e(94, "Ọ̀nà", "Road / Path", "nouns", "o-na", "Ọ̀nà yi gun", "This road is long"),
  e(95, "Funfun", "White / Clean", "nouns", "fun-fun", "Aṣọ mi funfun", "My clothes are white"),
  e(96, "Dúdú", "Black", "nouns", "du-du", "Irun rẹ dúdú", "His/her hair is black"),
];
