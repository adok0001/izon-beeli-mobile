import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {
  return { id: `d-ak-${id}`, word, english, category, languageId: "akan", pronunciation, example, exampleTranslation };
}

export const AKAN_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Maakye", "Good morning", "greetings", "maa-che", "Maakye, wo ho te sɛn?", "Good morning, how are you?"),
  e(2, "Maaha", "Good afternoon", "greetings", "maa-ha", "Maaha, agya.", "Good afternoon, father."),
  e(3, "Maadwo", "Good evening", "greetings", "maa-jwo", "Maadwo, maame.", "Good evening, mother."),
  e(4, "Ete sɛn?", "How are you?", "greetings", "e-te-sɛn", "Wo ho ete sɛn?", "How is your health?"),
  e(5, "Me ho yɛ", "I am fine", "greetings", "me-ho-yɛ", "Me ho yɛ, meda ase.", "I am fine, thank you."),
  e(6, "Meda ase", "Thank you", "greetings", "me-da-a-se", "Meda ase pii", "Thank you very much"),
  e(7, "Yoo", "Yes / OK", "greetings", "yoo", "Yoo, mekɔ.", "OK, I will go."),
  e(8, "Daabi", "No", "greetings", "daa-bi", "Daabi, meda ase.", "No, thank you."),
  e(9, "Akwaaba", "Welcome", "greetings", "a-kwa-ba", "Akwaaba Kumasi mu", "Welcome to Kumasi"),
  e(10, "Yɛfrɛ wo sɛn?", "What is your name?", "greetings", "ye-fre-wo-sɛn", "Yɛfrɛ wo sɛn, ɔbarima?", "What is your name, young man?"),
  e(11, "Yaa", "Hello / Greeting (informal)", "greetings", "ya-a", "Yaa, wo ho te sɛn?", "Hello, how are you?"),
  e(12, "Boa me", "Help me / Please help", "greetings", "bo-a-me", "Boa me, mepawokyɛw.", "Please help me."),
  e(13, "Nante yie", "Walk well / Goodbye", "greetings", "nan-te-yie", "Nante yie, ɔdɔfo.", "Walk well, dear one."),
  e(14, "Hwɛ yie", "Take care / Be careful", "greetings", "hwɛ-yie", "Hwɛ yie wɔ ɛkwan so.", "Take care on the road."),
  e(15, "Ɛyɛ", "It is good / Fine", "greetings", "ɛ-yɛ", "Ɛyɛ, meda ase.", "It is fine, thank you."),

  // --- Numbers ---
  e(16, "Baako", "One", "numbers", "baa-ko", "Mewɔ ɔba baako.", "I have one child."),
  e(17, "Mmienu", "Two", "numbers", "mmie-nu", "Menim kɔffii mmienu.", "I want two coffees."),
  e(18, "Mmiɛnsa", "Three", "numbers", "mmien-sa", "Me to kyɛnkyɛn mmiɛnsa.", "I bought three breads."),
  e(19, "Ɛnan", "Four", "numbers", "ɛ-nan", "Nnipa ɛnan wɔ hɔ.", "There are four people there."),
  e(20, "Enum", "Five", "numbers", "e-num", "Ma me sika enum.", "Give me five coins."),
  e(21, "Nsia", "Six", "numbers", "n-sia", "Mekaa nsia nna.", "I stayed six days."),
  e(22, "Nson", "Seven", "numbers", "n-son", "Nnawotwe wɔ nna nson.", "A week has seven days."),
  e(23, "Nwɔtwe", "Eight", "numbers", "nwɔ-twe", "Mpɔn nwɔtwe.", "Eight o'clock."),
  e(24, "Nkron", "Nine", "numbers", "n-kron", "Sika nkron nko ara.", "Only nine coins."),
  e(25, "Edu", "Ten", "numbers", "e-du", "Mewɔ mfe edu.", "I am ten years old."),
  e(26, "Aduonu", "Twenty", "numbers", "a-du-o-nu", "Mekyɛɛ sika aduonu.", "I gave twenty coins."),
  e(27, "Ɔha", "One hundred", "numbers", "ɔ-ha", "Mewɔ sika ɔha.", "I have one hundred."),

  // --- Family ---
  e(28, "Agya / Papa", "Father", "family", "a-gya", "Agya m yɛ okuani", "My father is a farmer"),
  e(29, "Maame / Ɛna", "Mother", "family", "maa-me", "Maame me wɔ efie.", "My mother is at home."),
  e(30, "Ɔba", "Child / Son or daughter", "family", "ɔ-ba", "Me ba kɔ sukuu.", "My child goes to school."),
  e(31, "Ɔkunu", "Husband", "family", "ɔ-ku-nu", "Me kunu yɛ adwuma.", "My husband is working."),
  e(32, "Ɔyere", "Wife", "family", "ɔ-ye-re", "Me yere tɔ aduan.", "My wife is buying food."),
  e(33, "Nuabarima", "Brother", "family", "nua-ba-ri-ma", "Me nuabarima kɔ sukuu.", "My brother goes to school."),
  e(34, "Nuabaa", "Sister", "family", "nua-baa", "Me nuabaa yɛ dɛ.", "My sister is kind."),
  e(35, "Nana", "Grandparent / Elder (respected title)", "family", "na-na", "Nana me wɔ efie.", "My grandparent is at home."),
  e(36, "Wofa", "Uncle (mother's brother)", "family", "wo-fa", "Me wofa bɛba ɛnnɛ.", "My uncle will come today."),
  e(37, "Ɔbaa", "Woman / Girl", "family", "ɔ-baa", "Ɔbaa no yɛ fɛ.", "The woman is beautiful."),
  e(38, "Ɔbarima", "Man / Boy", "family", "ɔ-ba-ri-ma", "Ɔbarima no tumi.", "The man is strong."),
  e(39, "Abusua", "Clan / Family group", "family", "a-bu-sua", "Me abusua yɛ kɛse.", "My family group is large."),

  // --- Pronouns ---
  e(40, "Me", "I / Me / My", "pronouns", "me", "Me kɔ sukuu.", "I go to school."),
  e(41, "Wo", "You / Your", "pronouns", "wo", "Wo ho te sɛn?", "How are you?"),
  e(42, "Ɔno", "He / She / It", "pronouns", "ɔ-no", "Ɔno di aduan.", "He/She is eating food."),
  e(43, "Yɛn", "We / Us / Our", "pronouns", "yɛn", "Yɛn kɔ efie.", "We are going home."),
  e(44, "Wɔn", "They / Them / Their", "pronouns", "wɔn", "Wɔn kɔ dwa.", "They are going to the market."),

  // --- Time ---
  e(45, "Anopa", "Morning", "time", "a-no-pa", "Anopa me nom kɔffii.", "In the morning I drink coffee."),
  e(46, "Awia", "Midday / Afternoon", "time", "a-wi-a", "Awia yɛn di aduan.", "At midday we eat food."),
  e(47, "Anwummere", "Evening", "time", "an-wum-me-re", "Anwummere me wɔ efie.", "In the evening I am at home."),
  e(48, "Anadwo", "Night", "time", "a-na-jwo", "Anadwo me da.", "At night I sleep."),
  e(49, "Ɛnnɛ", "Today", "time", "ɛn-nɛ", "Ɛnnɛ yɛ ɛda pa.", "Today is a good day."),
  e(50, "Ɔkyena", "Tomorrow", "time", "ɔ-chye-na", "Ɔkyena mekɔ dwa.", "Tomorrow I will go to the market."),
  e(51, "Ɛnnɛ twirampɔn", "Yesterday", "time", "ɛn-nɛ twi-ram-pɔn", "Ɛnnɛ twirampɔn me di fufu.", "Yesterday I ate fufu."),
  e(52, "Seesei", "Now", "time", "see-sei", "Seesei yɛn kɔ.", "Now we are going."),
  e(53, "Ɛda", "Day", "time", "ɛ-da", "Ɛda no yɛ pa.", "The day is good."),
  e(54, "Ɔbosome", "Month", "time", "ɔ-bo-so-me", "Ɔbosome a edi hɔ.", "The month that follows."),

  // --- Verbs ---
  e(55, "Ba", "Come", "verbs", "ba", "Ba ha!", "Come here!"),
  e(56, "Kɔ", "Go", "verbs", "kɔ", "Kɔ sukuu.", "Go to school."),
  e(57, "Di", "Eat", "verbs", "di", "Di aduan pa", "Eat good food"),
  e(58, "Nom", "Drink", "verbs", "nom", "Nom nsuo.", "Drink water."),
  e(59, "Da", "Sleep / Lie down", "verbs", "da", "Ɔba no da seesei.", "The child is sleeping now."),
  e(60, "Kasa", "Speak / Talk", "verbs", "ka-sa", "Ɔkasa Twi.", "He/She speaks Twi."),
  e(61, "Yɛ", "Do / Make / Be", "verbs", "yɛ", "Yɛ adwuma pa.", "Do good work."),
  e(62, "Hwɛ", "Look / Watch", "verbs", "hwɛ", "Hwɛ ɔbaa no.", "Look at the woman."),
  e(63, "Tia", "Run / Step", "verbs", "ti-a", "Ɔbarima no tia ntɛm.", "The man runs fast."),
  e(64, "Tie", "Listen / Hear", "verbs", "tie", "Tie me asɛm.", "Listen to my words."),

  // --- Food & Drink ---
  e(65, "Fufu", "Pounded yam/cassava", "food", "fu-fu", "Fufu ne abɛnkwan yɛ dɛ", "Fufu with palm soup is delicious"),
  e(66, "Abɛnkwan", "Palm nut soup", "food", "a-bɛn-kwan", "Abɛnkwan no yɛ dɛ paa.", "The palm soup is very tasty."),
  e(67, "Kontomire", "Cocoyam leaf stew", "food", "kon-to-mi-re", "Kontomire ne fufu yɛ pa.", "Kontomire with fufu is good."),
  e(68, "Kelewele", "Spiced fried plantain", "food", "ke-le-we-le", "Kelewele yɛ dɛ.", "Kelewele is delicious."),
  e(69, "Ɔtɔ", "Mashed yam (ceremonial)", "food", "ɔ-tɔ", "Yɛdi ɔtɔ ɔhyia mu.", "We eat ɔtɔ at celebrations."),
  e(70, "Nsuo", "Water", "food", "n-suo", "Me nom nsuo.", "I am drinking water."),
  e(71, "Aduan", "Food", "food", "a-duan", "Aduan no yɛ dɛ.", "The food is tasty."),
  e(72, "Nam", "Meat", "food", "nam", "Me tɔ nam dwa mu.", "I buy meat at the market."),
  e(73, "Ekɔ", "Fish (cooked)", "food", "e-kɔ", "Ekɔ no yɛ foforo.", "The fish is fresh."),
  e(74, "Ɛkwan", "Soup", "food", "ɛ-kwan", "Ɛkwan no yɛ dɛ.", "The soup is tasty."),
  e(75, "Mankani", "Cassava / Tapioca", "food", "man-ka-ni", "Yɛtumi yɛ fufu fi mankani.", "We can make fufu from cassava."),
  e(76, "Bɔfroto", "Fried dough / Puff puff", "food", "bɔf-ro-to", "Bɔfroto yɛ dɛ anopa.", "Puff puff is sweet in the morning."),

  // --- Body Parts ---
  e(77, "Etire", "Head", "body", "e-ti-re", "Me etire yɛ me ya.", "My head aches."),
  e(78, "Aniwa", "Eye", "body", "a-ni-wa", "Me aniwa yɛ fɛ.", "My eyes are fine."),
  e(79, "Aso", "Ear", "body", "a-so", "Me aso tia asɛm.", "My ear hears words."),
  e(80, "Anom", "Mouth", "body", "a-nom", "Me anom te.", "My mouth is clean."),
  e(81, "Nsa", "Hand", "body", "n-sa", "Me nsa yɛ me ya.", "My hand hurts."),
  e(82, "Nan", "Foot / Leg", "body", "nan", "Me nan yɛ me ya.", "My leg hurts."),
  e(83, "Akoma", "Heart", "body", "a-ko-ma", "Me akoma bo.", "My heart beats."),

  // --- Nouns & Objects ---
  e(84, "Odan / Efie", "House / Home", "nouns", "e-fie", "Me efie yɛ kɛse.", "My house is big."),
  e(85, "Dwa", "Market", "nouns", "dwa", "Me kɔ dwa ɛnnɛ.", "I am going to the market today."),
  e(86, "Sukuu", "School", "nouns", "su-kuu", "Me ba kɔ sukuu.", "My child goes to school."),
  e(87, "Sika", "Money / Gold", "nouns", "si-ka", "Me wɔ sika kakra.", "I have a little money."),
  e(88, "Kwae", "Forest", "nouns", "kwae", "Kwae no wɔ akyire.", "The forest is far behind."),
  e(89, "Ɛpo", "Sea / Large water", "nouns", "ɛ-po", "Ɛpo no yɛ kɛse.", "The sea is vast."),
  e(90, "Kwan", "Road / Path", "nouns", "kwan", "Kwan no tɛ.", "The road is long."),
  e(91, "Owia", "Sun", "nouns", "o-wia", "Owia hyehyɛ ɛnnɛ.", "The sun is hot today."),
  e(92, "Osrane", "Moon", "nouns", "o-sra-ne", "Osrane hyerɛn anadwo.", "The moon shines at night."),
  e(93, "Ɔkwan pa", "Good path / The right way", "nouns", "ɔ-kwan-pa", "Kɔ ɔkwan pa so.", "Go on the right path."),
];
