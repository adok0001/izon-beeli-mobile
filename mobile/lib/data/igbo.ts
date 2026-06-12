import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-ig-${id}`, word, english, category, languageId: "igbo", pronunciation, example, exampleTranslation };
}

export const IGBO_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Ụtụtụ ọma", "Good morning", "greetings", "u-tu-tu o-ma", "Ụtụtụ ọma, kedụ ka ị mere?", "Good morning, how are you?"),
  e(2, "Ehihie ọma", "Good afternoon", "greetings", "e-hi-hie o-ma", "Ehihie ọma, ị nọ mma?", "Good afternoon, are you well?"),
  e(3, "Anyasị ọma", "Good evening", "greetings", "a-nya-si o-ma", "Anyasị ọma, nna m", "Good evening, sir"),
  e(4, "Ndewo", "Hello / Greetings (to elder)", "greetings", "n-de-wo", "Ndewo, nna m!", "Greetings, sir!"),
  e(5, "Daalu", "Thank you", "greetings", "da-a-lu", "Daalu nke ukwuu!", "Thank you very much!"),
  e(6, "Biko", "Please", "greetings", "bi-ko", "Biko, nyere m aka", "Please, help me"),
  e(7, "Ee", "Yes", "greetings", "ee", "Ee, adị m mma", "Yes, I am fine"),
  e(8, "Mba", "No", "greetings", "m-ba", "Mba, achọghị m", "No, I don't want it"),
  e(9, "Nnọọ", "Welcome", "greetings", "n-no-o", "Nnọọ n'ụlọ anyị", "Welcome to our home"),
  e(10, "Kedụ", "How are you?", "greetings", "ke-du", "Kedụ, nwanne m?", "How are you, my sibling?"),
  e(11, "Adị m mma", "I am fine", "greetings", "a-di m m-ma", "Adị m mma, daalu", "I am fine, thank you"),
  e(12, "Ọ dị mma", "It is fine / OK", "greetings", "o di m-ma", "Ọ dị mma, anọ m ebe a", "It is fine, I am here"),
  e(13, "Nna m", "My father / Sir (respectful)", "greetings", "n-na m", "Nna m, daalu!", "Sir, thank you!"),
  e(14, "Nne m", "My mother / Ma'am (respectful)", "greetings", "n-ne m", "Nne m, ị nọ mma?", "Ma'am, are you well?"),
  e(15, "Gaa ọcha", "Goodbye", "greetings", "ga-a o-cha", "Gaa ọcha, ka anyị hụ ọzọ", "Goodbye, may we see again"),
  e(16, "Ka ọ dị", "Goodbye / Until later", "greetings", "ka o di", "Ka ọ dị, nwanne m", "Until later, my sibling"),
  e(17, "Pyụta", "I'm sorry / Excuse me", "greetings", "pyu-ta", "Pyụta, ị nọ mma?", "I'm sorry, are you alright?"),

  // --- Numbers ---
  e(18, "Otu", "One", "numbers", "o-tu", "Nwa m nwere otu akwụkwọ", "My child has one book"),
  e(19, "Abụọ", "Two", "numbers", "a-buo", "Anyị abụọ nọ ebe a", "The two of us are here"),
  e(20, "Atọ", "Three", "numbers", "a-to", "Atọ anyị nọ ebe a", "Three of us are here"),
  e(21, "Anọ", "Four", "numbers", "a-no", "M zụtara ji anọ", "I bought four yams"),
  e(22, "Ise", "Five", "numbers", "i-se", "Ise ụbọchị n'izu", "Five days in a week"),
  e(23, "Isii", "Six", "numbers", "i-si-i", "M nwere ọrụ isii", "I have six tasks"),
  e(24, "Asaa", "Seven", "numbers", "a-sa-a", "Asaa ụbọchị n'izu", "Seven days in a week"),
  e(25, "Asatọ", "Eight", "numbers", "a-sa-to", "M zụtara asatọ", "I bought eight"),
  e(26, "Itoolu", "Nine", "numbers", "i-too-lu", "Itoolu mmadụ nọ ebe a", "Nine people are here"),
  e(27, "Iri", "Ten", "numbers", "i-ri", "M nwere ego iri", "I have ten naira"),
  e(28, "Iri na otu", "Eleven", "numbers", "i-ri na o-tu", "Iri na otu ụbọchị gachara", "Eleven days have passed"),
  e(29, "Iri abụọ", "Twenty", "numbers", "i-ri a-buo", "Iri abụọ mmadụ bịara", "Twenty people came"),
  e(30, "Nari", "One hundred", "numbers", "na-ri", "Nari naira ka o na-eto", "It costs one hundred naira"),

  // --- Family ---
  e(31, "Nna", "Father", "family", "n-na", "Nna m bụ onye ọrụ", "My father is a worker"),
  e(32, "Nne", "Mother", "family", "n-ne", "Nne m nọ n'ụlọ", "My mother is at home"),
  e(33, "Nwa", "Child", "family", "n-wa", "Nwa m na-eri nri", "My child is eating food"),
  e(34, "Nwanne", "Sibling / Brother or sister", "family", "nwan-ne", "Nwanne m nọ ebe a", "My sibling is here"),
  e(35, "Ọkpara", "First son / Heir", "family", "ok-pa-ra", "Ọkpara m toro eto", "My first son has grown"),
  e(36, "Ada", "First daughter", "family", "a-da", "Ada m na-agụ akwụkwọ", "My first daughter is reading"),
  e(37, "Di", "Husband", "family", "di", "Di m gara ọrụ", "My husband went to work"),
  e(38, "Nwunye", "Wife", "family", "nwu-nye", "Nwunye m na-esi nri", "My wife is cooking food"),
  e(39, "Nna ochie", "Grandfather", "family", "n-na o-chie", "Nna ochie m agadi", "My grandfather is old"),
  e(40, "Nne ochie", "Grandmother", "family", "n-ne o-chie", "Nne ochie m nọ ụlọ", "My grandmother is at home"),
  e(41, "Ụmụnna", "Extended family / Kinsmen", "family", "u-mu-n-na", "Ụmụnna m bịara", "My kinsmen have come"),
  e(42, "Ọbịa", "Visitor / Guest", "family", "o-bi-a", "Ọbịa nọ n'ụlọ anyị", "A visitor is in our home"),

  // --- Pronouns ---
  e(43, "Mụ / M", "I / Me", "pronouns", "mu", "M chọọ ije", "I want to go"),
  e(44, "Gị / I", "You (singular)", "pronouns", "gi", "Gị bụ enyi m", "You are my friend"),
  e(45, "Ya", "He / She / It", "pronouns", "ya", "Ya gara ụlọ", "He/She went home"),
  e(46, "Anyị", "We (inclusive)", "pronouns", "a-nyi", "Anyị na-eri nri", "We are eating food"),
  e(47, "Ha", "They / Them", "pronouns", "ha", "Ha nọ ebe a", "They are here"),

  // --- Time ---
  e(48, "Ụtụtụ", "Morning", "time", "u-tu-tu", "M na-esite nri n'ụtụtụ", "I cook in the morning"),
  e(49, "Ehihie", "Afternoon / Midday", "time", "e-hi-hie", "Anyị na-eri nri n'ehihie", "We eat at midday"),
  e(50, "Anyasị", "Evening", "time", "a-nya-si", "Ụmụ anọ n'anyasị", "The children are home in the evening"),
  e(51, "Abali", "Night", "time", "a-ba-li", "M na-ehi ụra n'abali", "I sleep at night"),
  e(52, "Taa", "Today", "time", "ta-a", "Taa bụ ụbọchị ọma", "Today is a good day"),
  e(53, "Echi", "Tomorrow", "time", "e-chi", "Echi m ga-aga ahịa", "Tomorrow I will go to the market"),
  e(54, "Ụnyaahụ", "Yesterday", "time", "u-nya-a-hu", "Ụnyaahụ m hụrụ gị", "Yesterday I saw you"),
  e(55, "Ugbu a", "Now", "time", "ug-bu a", "Bia ugbu a!", "Come now!"),
  e(56, "Oge", "Time / Season", "time", "o-ge", "Oge ọma bụ ugbu a", "Now is a good time"),

  // --- Verbs ---
  e(57, "Bia", "Come", "verbs", "bi-a", "Bia ebe a!", "Come here!"),
  e(58, "Gaa", "Go", "verbs", "ga-a", "M chọọ igaa ụlọ", "I want to go home"),
  e(59, "Rie", "Eat", "verbs", "ri-e", "Bie nri", "Eat food"),
  e(60, "Ṅụọ", "Drink", "verbs", "nuo", "Ṅụọ mmiri a", "Drink this water"),
  e(61, "Nọ", "Stay / Be (somewhere)", "verbs", "no", "Nọ ebe a", "Stay here"),
  e(62, "Lie", "Sleep", "verbs", "li-e", "M chọọ ilie ụra", "I want to sleep"),
  e(63, "Kwuo", "Say / Speak", "verbs", "kwu-o", "Kwuo Igbo", "Speak Igbo"),
  e(64, "Mee", "Do / Make", "verbs", "me-e", "Mee ọrụ gị", "Do your work"),
  e(65, "Suọ", "Run", "verbs", "suo", "Ya na-asụọ ọsọ", "He/She is running"),
  e(66, "Kọọ", "Tell / Narrate", "verbs", "koo", "Kọọ m akụkọ", "Tell me a story"),
  e(67, "Gụọ", "Read / Count", "verbs", "guo", "Gụọ akwụkwọ gị", "Read your book"),

  // --- Food & Drink ---
  e(68, "Ji", "Yam (king of crops)", "food", "ji", "Ji bụ eze ihe oriri Igbo", "Yam is the king of Igbo crops"),
  e(69, "Ede", "Cocoyam / Taro", "food", "e-de", "M na-esi ede", "I am cooking cocoyam"),
  e(70, "Ọjị", "Kola nut (sacred)", "food", "o-ji", "Ọjị bụ eze mkpụrụ osisi", "Kola nut is the king of fruits"),
  e(71, "Ofe onugbu", "Bitter leaf soup", "food", "o-fe o-nu-gbu", "Ofe onugbu na-adị ụtọ", "Bitter leaf soup is delicious"),
  e(72, "Ofe egusi", "Melon seed soup", "food", "o-fe e-gu-si", "M na-eri ofe egusi", "I am eating melon seed soup"),
  e(73, "Nri", "Food / Meal", "food", "n-ri", "Nri dị ebe a", "Food is here"),
  e(74, "Mmanya", "Drink / Palm wine", "food", "mma-nya", "Mmanya ọcha dị mma", "Palm wine is good"),
  e(75, "Mmiri", "Water", "food", "mmi-ri", "M na-ṅụọ mmiri", "I am drinking water"),
  e(76, "Abacha", "African salad (cassava strips)", "food", "a-ba-cha", "Abacha na-adị ụtọ", "African salad is delicious"),
  e(77, "Akpu / Fufu", "Cassava fufu", "food", "a-kpu", "M na-eri akpu na ofe", "I am eating fufu with soup"),
  e(78, "Ụbọchị", "Day / Daytime", "time", "u-bo-chi", "Ụbọchị a dị mma", "This day is fine"),

  // --- Body Parts ---
  e(79, "Isi", "Head", "body", "i-si", "Isi m na-awa m ọwụ", "My head is aching"),
  e(80, "Anya", "Eye", "body", "a-nya", "Anya m na-ele gị", "My eyes are looking at you"),
  e(81, "Ntị", "Ear", "body", "n-ti", "Ntị m nụrụ gị", "My ears heard you"),
  e(82, "Ọnụ", "Mouth", "body", "o-nu", "Ọnụ m na-eju", "My mouth is full"),
  e(83, "Aka", "Hand", "body", "a-ka", "Aka m dị ọcha", "My hands are clean"),
  e(84, "Ụkwụ", "Foot / Leg", "body", "u-kwu", "Ụkwụ m na-erite m ọwụ", "My leg hurts me"),
  e(85, "Obi", "Heart / Chest", "body", "o-bi", "Obi m na-atọ m ụtọ", "My heart is glad"),

  // --- Nouns & Objects ---
  e(86, "Ụlọ", "House / Home", "nouns", "u-lo", "Ụlọ m dị nnọọ", "My house is big"),
  e(87, "Ahịa", "Market", "nouns", "a-hia", "M gara ahịa", "I went to the market"),
  e(88, "Ụlọ akwụkwọ", "School", "nouns", "u-lo a-kwu-kwo", "Nwa m nọ ụlọ akwụkwọ", "My child is at school"),
  e(89, "Akwụkwọ", "Book / Paper / Leaf", "nouns", "a-kwu-kwo", "Akwụkwọ m dị ebe a", "My book is here"),
  e(90, "Ego", "Money", "nouns", "e-go", "Ego m fochie", "My money is finished"),
  e(91, "Ọhịa", "Forest / Bush", "nouns", "o-hia", "Ọhịa dị anya", "The forest is far away"),
  e(92, "Mmiri", "Water / River", "nouns", "mmi-ri", "Mmiri na-agba ọsọ", "The river flows fast"),
  e(93, "Ụzọ", "Road / Path / Way", "nouns", "u-zo", "Ụzọ a dị ogologo", "This road is long"),
  e(94, "Ọcha", "White / Clean", "nouns", "o-cha", "Uwe m dị ọcha", "My clothes are white/clean"),
  e(95, "Oji oji", "Black / Dark", "nouns", "o-ji o-ji", "Oji oji ka isi m dị", "My hair is black"),

  // --- Igbo_lessons.txt: Family (extended terms) ---
  e(96, "Nwoke", "Man / Male", "family", "nwo-ke", "Nwoke ahụ bụ nna m", "That man is my father"),
  e(97, "Nwanyị", "Woman / Female", "family", "nwa-nyi", "Nwanyị ahụ bụ nne m", "That woman is my mother"),
  e(98, "Nwanne nwoke", "Brother (lit. male sibling)", "family", "nwan-ne nwo-ke", "Ọ bụ nwanne m nwoke", "He is my brother"),
  e(99, "Nwanne nwanyị", "Sister (lit. female sibling)", "family", "nwan-ne nwa-nyi", "Ọ bụ nwanne m nwanyị", "She is my sister"),
  e(100, "Ụmụaka", "Children", "family", "u-mu-a-ka", "Ụmụaka na-agụ akwụkwọ", "The children are reading"),
  e(101, "Ezinaụlọ", "Household / Family unit", "family", "e-zi-na-u-lo", "Ezinaụlọ m bụ nnọọ", "My household is big"),

  // --- Igbo_lessons.txt: Occupations ---
  e(102, "Onye ahịa", "Trader (person of the market)", "occupations", "o-nye a-hia", "Onye ahịa na-ere ihe n'ahịa", "The trader is selling things at the market"),
  e(103, "Onye nkuzi", "Teacher", "occupations", "o-nye n-ku-zi", "Onye nkuzi m dị mma", "My teacher is good"),
  e(104, "Dibịa bekee", "Doctor (Western medicine)", "occupations", "di-bia be-kee", "Dibịa bekee dị n'ụlọ ọgwụ", "The doctor is at the hospital"),
  e(105, "Onye nta akụkọ", "Journalist / Reporter", "occupations", "o-nye n-ta a-ku-ko", "Onye nta akụkọ na-ede akụkọ", "The journalist is writing a report"),
  e(106, "Onye ọrụ ugbo", "Farmer", "occupations", "o-nye o-ru ug-bo", "Nna m bụ onye ọrụ ugbo", "My father is a farmer"),
  e(107, "Ọrụ", "Work / Occupation", "nouns", "o-ru", "Gịnị bụ ọrụ gị?", "What is your occupation?"),
  e(108, "Ugbo", "Farm / Boat", "nouns", "ug-bo", "M na-aga ugbo", "I am going to the farm"),

  // --- Igbo_lessons.txt: Hobbies & Activities (verbal nouns) ---
  e(109, "Ịgụ akwụkwọ", "Reading (as an activity)", "verbs", "i-gu a-kwu-kwo", "Ọ hụrụ ịgụ akwụkwọ n'anya", "He loves reading"),
  e(110, "Ịgba egwu", "Dancing", "verbs", "i-gba e-gwu", "A na m agba egwu mgbe nile", "I always dance"),
  e(111, "Ịgụ egwú", "Singing", "verbs", "i-gu e-gwu", "Ịgụ egwú na-atọ m ụtọ", "Singing makes me happy"),
  e(112, "Ịgba ekere ụkwụ", "Playing football", "verbs", "i-gba e-ke-re u-kwu", "Anyị na-agba ekere ụkwụ n'ụlọ akwụkwọ", "We play football at school"),
  e(113, "Ịrụ ọrụ aka", "Crafting / Handwork", "verbs", "i-ru o-ru a-ka", "Ọ hụrụ ịrụ ọrụ aka n'anya", "She loves crafting"),
  e(114, "Ịmụ asụsụ", "Learning a language", "verbs", "i-mu a-su-su", "A hụrụ m ịmụ asụsụ ọhụrụ n'anya", "I love learning new languages"),
  e(115, "Ịjegharị", "Walking / Travelling", "verbs", "i-je-gha-ri", "Ịjegharị na-atọ m ụtọ", "Walking pleases me"),

  // --- Igbo_lessons.txt: Verb infinitives ---
  e(116, "Ịbịa", "To come (infinitive)", "verbs", "i-bia", "Ịbịa n'ụlọ anyị dị mma", "Coming to our home is good"),
  e(117, "Ịkụ", "To plant / strike / play (instrument)", "verbs", "i-ku", "Ụmụaka na-akụ egwu", "The children are playing music"),
  e(118, "Ịkpọ", "To call / to name", "verbs", "i-kpo", "Kpọọ aha m", "Call my name"),
  e(119, "Ịse", "To paint / draw", "verbs", "i-se", "Ọ na-ese ihe mara mma", "She is drawing something beautiful"),
  e(120, "Bi", "To live / reside (at a place)", "verbs", "bi", "Nne gị bi na Enugu", "Your mother lives in Enugu"),

  // --- Igbo_lessons.txt: Adjectives ---
  e(121, "Ọhụrụ", "New", "adjectives", "o-hu-ru", "Ụgbọ ọhụrụ dị ebe a", "A new vehicle is here"),
  e(122, "Oyi", "Cold", "adjectives", "o-yi", "Mmiri oyi dị mma n'oge ọkụ", "Cold water is good in the heat"),
  e(123, "Ogologo", "Long / Tall", "adjectives", "o-go-lo-go", "Osisi ogologo dị n'ọhịa", "A tall tree is in the forest"),
  e(124, "Ọma", "Good / Fine / Well", "adjectives", "o-ma", "Ụbọchị ọma bụ ụbọchị dị ụtọ", "A good day is a sweet day"),
  e(125, "Ọjụọ", "Bad / Ugly", "adjectives", "o-juo", "Ọ bụ ihe ọjụọ ime ya", "It is a bad thing to do"),
  e(126, "Nnukwu", "Big / Large", "adjectives", "n-nu-kwu", "Nnukwu ụlọ dị ebe ahụ", "A big house is there"),
  e(127, "Mara mma", "Beautiful (lit. knows beauty)", "adjectives", "ma-ra m-ma", "Nwanyị ahụ mara mma", "That woman is beautiful"),
  e(128, "Nso", "Near / Close", "adjectives", "n-so", "Ụlọ m dị nso", "My house is nearby"),
  e(129, "Ọkụ", "Hot / Fire", "adjectives", "o-ku", "Nri a dị ọkụ", "This food is hot"),
  e(130, "Agadị", "Old (of a person)", "adjectives", "a-ga-di", "Nna ochie m agadị", "My grandfather is old"),
  e(131, "Ọsịsọ", "Quick / Fast", "adjectives", "o-si-so", "Ya na-asụọ ọsọ ọsịsọ", "He runs fast"),
  e(132, "Nwayọ", "Slow / Gentle / Quietly", "adjectives", "nwa-yo", "Bịa nwayọ nwayọ", "Come slowly and gently"),
  e(133, "Mkpụmkpụ", "Short (in height or length)", "adjectives", "m-kpu-m-kpu", "Osisi mkpụmkpụ dị ebe a", "A short tree is here"),
  e(134, "Ihere", "Shyness / Shame", "adjectives", "i-he-re", "Ihere na-atọ ya", "He feels shy / ashamed"),
  e(135, "Iwe", "Anger", "adjectives", "i-we", "Iwe na-atọ ya", "He is angry"),
  e(136, "Mfe", "Easy / Simple", "adjectives", "m-fe", "Ọrụ a dị mfe", "This work is easy"),
  e(137, "Siri ike", "Difficult / Hard", "adjectives", "si-ri i-ke", "Ọrụ a siri ike", "This work is hard"),
  e(138, "Elu / Enu", "High / Above / Up", "adjectives", "e-lu", "Elu igwe dị ọcha", "The sky above is clear"),
  e(139, "Aṅụrị", "Joy / Happiness", "adjectives", "a-ngu-ri", "Aṅụrị dị n'obi m", "Joy is in my heart"),
  e(140, "Onye", "Person / Who", "pronouns", "o-nye", "Kedu onye bụ gị?", "Who are you?"),
  e(141, "Asụsụ", "Language", "nouns", "a-su-su", "Asụsụ Igbo dị mma", "The Igbo language is good"),
];
