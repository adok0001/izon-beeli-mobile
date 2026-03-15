import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-sw-${id}`, word, english, category, languageId: "swahili", pronunciation, example, exampleTranslation };
}

export const SWAHILI_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Hujambo", "How are you? (singular)", "greetings", "hu-jam-bo", "Hujambo rafiki!", "How are you, friend!"),
  e(2, "Sijambo", "I am fine (reply to hujambo)", "greetings", "si-jam-bo", "Sijambo, asante.", "I am fine, thank you."),
  e(3, "Habari?", "What's the news? / How are you?", "greetings", "ha-ba-ri", "Habari za asubuhi?", "How is the morning?"),
  e(4, "Nzuri", "Good / Fine", "greetings", "n-zu-ri", "Nzuri sana!", "Very good!"),
  e(5, "Asante", "Thank you", "greetings", "a-san-te", "Asante sana", "Thank you very much"),
  e(6, "Tafadhali", "Please", "greetings", "ta-fa-dha-li", "Tafadhali kaa.", "Please sit down."),
  e(7, "Ndiyo", "Yes", "greetings", "n-di-yo", "Ndiyo, nakuja.", "Yes, I am coming."),
  e(8, "Hapana", "No", "greetings", "ha-pa-na", "Hapana, asante.", "No, thank you."),
  e(9, "Karibu", "Welcome / You're welcome", "greetings", "ka-ri-bu", "Karibu nyumbani", "Welcome home"),
  e(10, "Samahani", "Sorry / Excuse me", "greetings", "sa-ma-ha-ni", "Samahani, nisaidie.", "Excuse me, help me."),
  e(11, "Kwaheri", "Goodbye", "greetings", "kwa-he-ri", "Kwaheri, tutaonana.", "Goodbye, we will meet again."),
  e(12, "Mambo?", "What's up? (informal)", "greetings", "mam-bo", "Mambo, rafiki?", "What's up, friend?"),
  e(13, "Poa", "Cool / Fine (informal reply)", "greetings", "po-a", "Poa kabisa!", "Totally cool!"),
  e(14, "Shikamoo", "Respectful greeting (to elder)", "greetings", "shi-ka-moo", "Shikamoo, bibi.", "Respectful greetings, grandmother."),
  e(15, "Marahaba", "Reply to shikamoo (from elder)", "greetings", "ma-ra-ha-ba", "Marahaba, mtoto.", "I acknowledge you, child."),

  // --- Numbers ---
  e(16, "Moja", "One", "numbers", "mo-ja", "Nina mtoto mmoja.", "I have one child."),
  e(17, "Mbili", "Two", "numbers", "m-bi-li", "Nina watoto wawili.", "I have two children."),
  e(18, "Tatu", "Three", "numbers", "ta-tu", "Ninataka vitabu vitatu.", "I want three books."),
  e(19, "Nne", "Four", "numbers", "n-ne", "Nyumba ina vyumba vinne.", "The house has four rooms."),
  e(20, "Tano", "Five", "numbers", "ta-no", "Nina ndizi tano.", "I have five bananas."),
  e(21, "Sita", "Six", "numbers", "si-ta", "Tumekaa siku sita.", "We stayed six days."),
  e(22, "Saba", "Seven", "numbers", "sa-ba", "Wiki ina siku saba.", "A week has seven days."),
  e(23, "Nane", "Eight", "numbers", "na-ne", "Darasa lina wanafunzi nane.", "The class has eight students."),
  e(24, "Tisa", "Nine", "numbers", "ti-sa", "Ninalipa shilingi tisa.", "I pay nine shillings."),
  e(25, "Kumi", "Ten", "numbers", "ku-mi", "Nina miaka kumi.", "I am ten years old."),
  e(26, "Ishirini", "Twenty", "numbers", "i-shi-ri-ni", "Ninanunua ndizi ishirini.", "I am buying twenty bananas."),
  e(27, "Mia", "One hundred", "numbers", "mi-a", "Ninahitaji shilingi mia.", "I need one hundred shillings."),
  e(28, "Elfu", "One thousand", "numbers", "el-fu", "Gari linagharimu elfu kumi.", "The car costs ten thousand."),

  // --- Family ---
  e(29, "Baba", "Father", "family", "ba-ba", "Baba yangu ni daktari", "My father is a doctor"),
  e(30, "Mama", "Mother", "family", "ma-ma", "Mama yangu yuko nyumbani.", "My mother is at home."),
  e(31, "Mtoto", "Child", "family", "m-to-to", "Mtoto wangu anacheza.", "My child is playing."),
  e(32, "Mwana", "Son / Offspring", "family", "m-wa-na", "Mwana wangu ni hodari.", "My son is clever."),
  e(33, "Mume", "Husband", "family", "mu-me", "Mume wangu anafanya kazi.", "My husband is working."),
  e(34, "Mke", "Wife", "family", "m-ke", "Mke wangu anapika chakula.", "My wife is cooking food."),
  e(35, "Ndugu", "Sibling / Relative / Fellow", "family", "n-du-gu", "Ndugu yangu yupo hapa.", "My sibling is here."),
  e(36, "Dada", "Sister", "family", "da-da", "Dada yangu ni mzuri.", "My sister is kind."),
  e(37, "Kaka", "Brother (informal)", "family", "ka-ka", "Kaka yangu anasoma.", "My brother is studying."),
  e(38, "Babu", "Grandfather", "family", "ba-bu", "Babu yangu ni mzee.", "My grandfather is old."),
  e(39, "Bibi", "Grandmother / Mrs / Lady", "family", "bi-bi", "Bibi yangu anapenda chai.", "My grandmother loves tea."),
  e(40, "Familia", "Family", "family", "fa-mi-li-a", "Familia yangu ni kubwa.", "My family is large."),

  // --- Pronouns ---
  e(41, "Mimi", "I / Me", "pronouns", "mi-mi", "Mimi ninaenda shule.", "I am going to school."),
  e(42, "Wewe", "You (singular)", "pronouns", "we-we", "Wewe unajua Kiswahili.", "You know Swahili."),
  e(43, "Yeye", "He / She / It", "pronouns", "ye-ye", "Yeye anakula chakula.", "He/She is eating food."),
  e(44, "Sisi", "We / Us", "pronouns", "si-si", "Sisi tunakwenda pamoja.", "We are going together."),
  e(45, "Ninyi", "You (plural)", "pronouns", "ni-nyi", "Ninyi mnaimba vizuri.", "You all sing well."),
  e(46, "Wao", "They / Them", "pronouns", "wa-o", "Wao wanacheza nyumbani.", "They are playing at home."),

  // --- Time ---
  e(47, "Asubuhi", "Morning", "time", "a-su-bu-hi", "Asubuhi ninaamka mapema.", "In the morning I wake up early."),
  e(48, "Mchana", "Midday / Afternoon", "time", "m-cha-na", "Mchana tunakula pamoja.", "At midday we eat together."),
  e(49, "Jioni", "Evening", "time", "ji-o-ni", "Jioni ninakaa nyumbani.", "In the evening I stay home."),
  e(50, "Usiku", "Night", "time", "u-si-ku", "Usiku ninasoma vitabu.", "At night I read books."),
  e(51, "Leo", "Today", "time", "le-o", "Leo ni siku nzuri.", "Today is a good day."),
  e(52, "Kesho", "Tomorrow", "time", "ke-sho", "Kesho nitakwenda sokoni.", "Tomorrow I will go to the market."),
  e(53, "Jana", "Yesterday", "time", "ja-na", "Jana nilikula pilau.", "Yesterday I ate pilau."),
  e(54, "Sasa", "Now", "time", "sa-sa", "Sasa tunaenda.", "Now we are going."),
  e(55, "Wakati", "Time", "time", "wa-ka-ti", "Wakati ni pesa.", "Time is money."),
  e(56, "Wiki", "Week", "time", "wi-ki", "Wiki ijayo nitarudi.", "Next week I will return."),
  e(57, "Mwaka", "Year", "time", "m-wa-ka", "Mwaka huu ni mzuri.", "This year is good."),

  // --- Verbs ---
  e(58, "Kuja", "To come", "verbs", "ku-ja", "Kuja hapa", "Come here"),
  e(59, "Kwenda", "To go", "verbs", "kwen-da", "Ninataka kwenda sokoni.", "I want to go to the market."),
  e(60, "Kula", "To eat", "verbs", "ku-la", "Ninakula ugali.", "I am eating ugali."),
  e(61, "Kunywa", "To drink", "verbs", "ku-nywa", "Ninakunywa maji.", "I am drinking water."),
  e(62, "Kulala", "To sleep", "verbs", "ku-la-la", "Mtoto analala sasa.", "The child is sleeping now."),
  e(63, "Kusema", "To speak / say", "verbs", "ku-se-ma", "Anasema Kiswahili.", "He speaks Swahili."),
  e(64, "Kufanya", "To do / make", "verbs", "ku-fa-nya", "Ninafanya kazi.", "I am doing work."),
  e(65, "Kuandika", "To write", "verbs", "ku-an-di-ka", "Ninaandika barua.", "I am writing a letter."),
  e(66, "Kusikia", "To hear / listen", "verbs", "ku-si-ki-a", "Ninasikia muziki.", "I am hearing music."),
  e(67, "Kuona", "To see", "verbs", "ku-o-na", "Ninaona nyumba kubwa.", "I see a big house."),
  e(68, "Kukimbia", "To run", "verbs", "ku-kim-bi-a", "Anakimbia haraka.", "He is running fast."),

  // --- Food & Drink ---
  e(69, "Ugali", "Maize porridge (staple)", "food", "u-ga-li", "Ugali na sukuma wiki", "Ugali with kale"),
  e(70, "Wali", "Cooked rice", "food", "wa-li", "Ninapenda wali na nyama.", "I like rice with meat."),
  e(71, "Maharagwe", "Beans", "food", "ma-ha-rag-we", "Ninakula maharagwe leo.", "I am eating beans today."),
  e(72, "Nyama", "Meat", "food", "nya-ma", "Ninanunua nyama sokoni.", "I am buying meat at the market."),
  e(73, "Samaki", "Fish", "food", "sa-ma-ki", "Samaki wa leo ni safi.", "Today's fish is fresh."),
  e(74, "Mboga", "Vegetables / Relish", "food", "m-bo-ga", "Ninapika mboga za kuchemsha.", "I am cooking boiled vegetables."),
  e(75, "Chakula", "Food / Meal", "food", "cha-ku-la", "Chakula kiko tayari.", "The food is ready."),
  e(76, "Chai", "Tea", "food", "cha-i", "Ninakunywa chai asubuhi.", "I drink tea in the morning."),
  e(77, "Maji", "Water", "food", "ma-ji", "Ninahitaji maji safi.", "I need clean water."),
  e(78, "Pilau", "Spiced rice", "food", "pi-lau", "Ninapenda pilau ya nyama.", "I love meat pilau."),
  e(79, "Chapati", "Flatbread", "food", "cha-pa-ti", "Ninanunua chapati mbili.", "I am buying two chapatis."),
  e(80, "Mandazi", "Fried dough", "food", "man-da-zi", "Mandazi ni tamu asubuhi.", "Mandazi are sweet in the morning."),
  e(81, "Nazi", "Coconut", "food", "na-zi", "Ninakunywa maji ya nazi.", "I am drinking coconut water."),

  // --- Body Parts ---
  e(82, "Kichwa", "Head", "body", "ki-chwa", "Kichwa changu kinauma.", "My head hurts."),
  e(83, "Jicho", "Eye (sing.) / Macho (pl.)", "body", "ji-cho", "Macho yake ni mazuri.", "His/Her eyes are beautiful."),
  e(84, "Sikio", "Ear", "body", "si-ki-o", "Masikio yangu yanasikia.", "My ears can hear."),
  e(85, "Mdomo", "Mouth", "body", "m-do-mo", "Mdomo wake ni mkubwa.", "His/Her mouth is big."),
  e(86, "Mkono", "Hand / Arm", "body", "m-ko-no", "Mkono wangu unaumia.", "My hand is hurting."),
  e(87, "Mguu", "Foot / Leg", "body", "m-guu", "Mguu wangu unachoka.", "My leg is tired."),
  e(88, "Moyo", "Heart", "body", "mo-yo", "Moyo wangu unapiga.", "My heart is beating."),
  e(89, "Tumbo", "Stomach / Belly", "body", "tum-bo", "Tumbo langu linauma.", "My stomach hurts."),

  // --- Nouns & Objects ---
  e(90, "Nyumba", "House / Home", "nouns", "nyu-m-ba", "Nyumba yangu ni kubwa.", "My house is big."),
  e(91, "Soko", "Market", "nouns", "so-ko", "Ninakwenda sokoni leo.", "I am going to the market today."),
  e(92, "Shule", "School", "nouns", "shu-le", "Watoto wanakwenda shule.", "The children go to school."),
  e(93, "Pesa", "Money", "nouns", "pe-sa", "Nina pesa kidogo.", "I have a little money."),
  e(94, "Msitu", "Forest", "nouns", "m-si-tu", "Msitu uko mbali.", "The forest is far away."),
  e(95, "Mto", "River", "nouns", "m-to", "Mto huu una maji mengi.", "This river has a lot of water."),
  e(96, "Barabara", "Road / Street", "nouns", "ba-ra-ba-ra", "Barabara hii ni ndefu.", "This road is long."),
  e(97, "Jua", "Sun", "nouns", "ju-a", "Jua linachomeka leo.", "The sun is hot today."),
  e(98, "Mwezi", "Moon / Month", "nouns", "m-we-zi", "Mwezi unang'aa usiku.", "The moon shines at night."),
  e(99, "Rafiki", "Friend", "nouns", "ra-fi-ki", "Rafiki yangu anakuja.", "My friend is coming."),
];
