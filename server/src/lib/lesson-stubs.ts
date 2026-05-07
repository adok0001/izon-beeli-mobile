/**
 * Server-side lesson stub generator.
 * Mirrors the template data from mobile/lib/data/lessons/stub.ts but lives
 * inside server/src so it can be compiled and imported from route handlers.
 *
 * When the template content changes, keep both files in sync.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type Phrase = { text: string; en: string; fr: string };

type LessonDef = {
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  duration: number;
  isOralOrSong?: true;
  phrases: Phrase[];
};

type CourseDef = {
  type: string;
  abbrev: string;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  level: "beginner" | "intermediate" | "advanced";
  order: number;
  lessons: LessonDef[];
};

// ─── Template content ─────────────────────────────────────────────────────────

const FIRST_WORDS: LessonDef[] = [
  {
    title: "Greetings & Salutations",
    titleFr: "Salutations",
    description: "The first words every speaker knows — greetings across morning, afternoon, and evening, and how to respond with warmth.",
    descriptionFr: "Les premiers mots que tout locuteur connaît — les salutations du matin, de l'après-midi et du soir, et comment y répondre avec chaleur.",
    duration: 4,
    phrases: [
      { text: "[Good morning!]",                      en: "Good morning!",                        fr: "Bonjour !" },
      { text: "[How are you?]",                       en: "How are you?",                         fr: "Comment vas-tu ?" },
      { text: "[I am fine! I am well.]",              en: "I am fine! I am well.",                fr: "Je vais bien ! Je suis en bonne santé." },
      { text: "[What is your name?]",                 en: "What is your name?",                   fr: "Comment t'appelles-tu ?" },
      { text: "[My name is …]",                       en: "My name is …",                         fr: "Je m'appelle …" },
      { text: "[Good afternoon!]",                    en: "Good afternoon!",                      fr: "Bon après-midi !" },
      { text: "[Good evening!]",                      en: "Good evening!",                        fr: "Bonsoir !" },
      { text: "[Welcome!]",                           en: "Welcome!",                             fr: "Bienvenue !" },
      { text: "[Thank you! / Thank you very much!]",  en: "Thank you! / Thank you very much!",    fr: "Merci ! / Merci beaucoup !" },
      { text: "[Sleep well. / Goodbye!]",             en: "Sleep well. / Goodbye!",               fr: "Dors bien. / Au revoir !" },
    ],
  },
  {
    title: "Names & Identity",
    titleFr: "Noms et Identité",
    description: "Introduce yourself, say where you're from, and declare your ethnic identity — the words that make you part of the community.",
    descriptionFr: "Présentez-vous, dites d'où vous venez et affirmez votre identité ethnique — les mots qui font de vous un membre de la communauté.",
    duration: 5,
    phrases: [
      { text: "[Good morning! What is your name?]",          en: "Good morning! What is your name?",          fr: "Bonjour ! Comment t'appelles-tu ?" },
      { text: "[My name is …]",                              en: "My name is …",                              fr: "Je m'appelle …" },
      { text: "[Where are you from?]",                       en: "Where are you from?",                       fr: "D'où viens-tu ?" },
      { text: "[I am [ethnicity]. I am from [place].]",      en: "I am [ethnicity]. I am from [place].",      fr: "Je suis [ethnie]. Je viens de [lieu]." },
      { text: "[Really! I am also [ethnicity].]",            en: "Really! I am also [ethnicity].",            fr: "Vraiment ! Moi aussi je suis [ethnie]." },
      { text: "[Which village are you from?]",               en: "Which village are you from?",               fr: "De quel village es-tu ?" },
      { text: "[I am from [city / village].]",               en: "I am from [city / village].",               fr: "Je viens de [ville / village]." },
      { text: "[Thank you! Me too.]",                        en: "Thank you! Me too.",                        fr: "Merci ! Moi aussi." },
      { text: "[I am [ethnicity], from [country].]",         en: "I am [ethnicity], from [country].",         fr: "Je suis [ethnie], de [pays]." },
      { text: "[[Ethnic pride phrase]! Welcome!]",           en: "[Ethnic pride phrase]! Welcome!",           fr: "[Phrase de fierté ethnique] ! Bienvenue !" },
    ],
  },
  {
    title: "Yes, No & the Words Between",
    titleFr: "Oui, Non et les Mots Entre les Deux",
    description: "Essential response words for agreement, refusal, gratitude, apology, and respect — the social glue of any conversation.",
    descriptionFr: "Les mots de réponse essentiels pour approuver, refuser, remercier, s'excuser et montrer du respect — le ciment social de toute conversation.",
    duration: 5,
    phrases: [
      { text: "[Yes.]",                                   en: "Yes.",                                        fr: "Oui." },
      { text: "[No.]",                                    en: "No.",                                         fr: "Non." },
      { text: "[Thank you!]",                             en: "Thank you!",                                  fr: "Merci !" },
      { text: "[Thank you very much!]",                   en: "Thank you very much!",                        fr: "Merci beaucoup !" },
      { text: "[No problem. / Don't worry.]",             en: "No problem. / Don't worry.",                  fr: "Pas de problème. / Ne t'inquiète pas." },
      { text: "[Welcome! You are welcome!]",              en: "Welcome! You are welcome!",                   fr: "Bienvenue ! Tu es le bienvenu !" },
      { text: "[Wait a moment. / Hold on.]",              en: "Wait a moment. / Hold on.",                   fr: "Un instant. / Attends." },
      { text: "[It's alright. / Never mind.]",            en: "It's alright. / Never mind.",                 fr: "C'est bon. / Ce n'est rien." },
      { text: "[Really? / Is that so?]",                  en: "Really? / Is that so?",                       fr: "Vraiment ? / C'est ça ?" },
      { text: "[Congratulations!]",                       en: "Congratulations!",                            fr: "Félicitations !" },
    ],
  },
  {
    title: "Family Members",
    titleFr: "Les Membres de la Famille",
    description: "Learn words for family members and relationships — father, mother, siblings, children, grandparents — through a natural conversation.",
    descriptionFr: "Apprenez les mots pour les membres de la famille — père, mère, frères et sœurs, enfants, grands-parents — à travers une conversation naturelle.",
    duration: 5,
    phrases: [
      { text: "[Are your father and mother at home?]",                            en: "Are your father and mother at home?",                             fr: "Ton père et ta mère sont-ils à la maison ?" },
      { text: "[Yes. My father is home. My mother is cooking.]",                  en: "Yes. My father is home. My mother is cooking.",                   fr: "Oui. Mon père est à la maison. Ma mère fait la cuisine." },
      { text: "[How many siblings do you have?]",                                 en: "How many siblings do you have?",                                  fr: "Combien de frères et sœurs as-tu ?" },
      { text: "[I have [N] siblings — [X] brothers and [Y] sisters.]",           en: "I have [N] siblings — [X] brothers and [Y] sisters.",            fr: "J'ai [N] frères et sœurs — [X] frères et [Y] sœurs." },
      { text: "[Are your grandparents also in the village?]",                     en: "Are your grandparents also in the village?",                      fr: "Tes grands-parents sont-ils aussi au village ?" },
      { text: "[Yes. My grandparents live in the village.]",                      en: "Yes. My grandparents live in the village.",                       fr: "Oui. Mes grands-parents vivent au village." },
      { text: "[Do you have children? Sons and daughters?]",                      en: "Do you have children? Sons and daughters?",                       fr: "As-tu des enfants ? Des fils et des filles ?" },
      { text: "[I have [N] children.]",                                           en: "I have [N] children.",                                            fr: "J'ai [N] enfants." },
      { text: "[Family is our strength.]",                                        en: "Family is our strength.",                                         fr: "La famille est notre force." },
      { text: "[We take care of one another.]",                                   en: "We take care of one another.",                                    fr: "Nous prenons soin les uns des autres." },
    ],
  },
  {
    title: "A Day in the Life",
    titleFr: "Un Jour dans la Vie",
    description: "Follow a typical day — waking, greeting, eating, working, and resting — the rhythms that shape everyday speech.",
    descriptionFr: "Suivez une journée typique — se lever, saluer, manger, travailler et se reposer — les rythmes qui façonnent le discours quotidien.",
    duration: 5,
    phrases: [
      { text: "[I wake up early in the morning.]",     en: "I wake up early in the morning.",     fr: "Je me réveille tôt le matin." },
      { text: "[I greet my family.]",                  en: "I greet my family.",                  fr: "Je salue ma famille." },
      { text: "[We eat breakfast together.]",          en: "We eat breakfast together.",          fr: "Nous prenons le petit-déjeuner ensemble." },
      { text: "[I go to [work / school / farm].]",     en: "I go to [work / school / farm].",     fr: "Je vais à [travail / école / ferme]." },
      { text: "[At midday I rest a little.]",          en: "At midday I rest a little.",          fr: "À midi je me repose un peu." },
      { text: "[In the evening we gather together.]",  en: "In the evening we gather together.",  fr: "Le soir nous nous rassemblons." },
      { text: "[We share a meal and stories.]",        en: "We share a meal and stories.",        fr: "Nous partageons un repas et des histoires." },
      { text: "[I sleep when the night comes.]",       en: "I sleep when the night comes.",       fr: "Je dors quand la nuit arrive." },
      { text: "[Tomorrow will be another good day.]",  en: "Tomorrow will be another good day.",  fr: "Demain sera encore un bon jour." },
      { text: "[This is our way of life.]",            en: "This is our way of life.",            fr: "C'est notre mode de vie." },
    ],
  },
];

const SOUND_SCRIPT: LessonDef[] = [
  {
    title: "The Vowel Sounds",
    titleFr: "Les Sons Vocaliques",
    description: "Master the vowel sounds — how to shape each one clearly and recognise them in words.",
    descriptionFr: "Maîtrisez les sons vocaliques — comment former chacun clairement et les reconnaître dans les mots.",
    duration: 5,
    phrases: [
      { text: "[[Vowel A] — as in [example word]]",                         en: "[Vowel A] — as in [example word]",                         fr: "[Voyelle A] — comme dans [exemple]" },
      { text: "[[Vowel E] — as in [example word]]",                         en: "[Vowel E] — as in [example word]",                         fr: "[Voyelle E] — comme dans [exemple]" },
      { text: "[[Vowel I] — as in [example word]]",                         en: "[Vowel I] — as in [example word]",                         fr: "[Voyelle I] — comme dans [exemple]" },
      { text: "[[Vowel O] — as in [example word]]",                         en: "[Vowel O] — as in [example word]",                         fr: "[Voyelle O] — comme dans [exemple]" },
      { text: "[[Vowel U] — as in [example word]]",                         en: "[Vowel U] — as in [example word]",                         fr: "[Voyelle U] — comme dans [exemple]" },
      { text: "[Listen and repeat: [word with A]]",                          en: "Listen and repeat: [word with A]",                          fr: "Écoutez et répétez : [mot avec A]" },
      { text: "[Listen and repeat: [word with E]]",                          en: "Listen and repeat: [word with E]",                          fr: "Écoutez et répétez : [mot avec E]" },
      { text: "[Short vowels vs. long vowels — how this language marks them]", en: "Short vowels vs. long vowels — how this language marks them", fr: "Voyelles courtes vs. longues — comment cette langue les marque" },
    ],
  },
  {
    title: "Consonants & Special Sounds",
    titleFr: "Consonnes et Sons Spéciaux",
    description: "Learn the consonant inventory — including sounds unique to this language — and how they combine in syllables.",
    descriptionFr: "Apprenez l'inventaire consonantique — y compris les sons propres à cette langue — et comment ils se combinent en syllabes.",
    duration: 5,
    phrases: [
      { text: "[[Consonant set 1] — practice]",                                     en: "[Consonant set 1] — practice",                                     fr: "[Ensemble de consonnes 1] — pratiquer" },
      { text: "[[Consonant set 2] — practice]",                                     en: "[Consonant set 2] — practice",                                     fr: "[Ensemble de consonnes 2] — pratiquer" },
      { text: "[[Sounds unique to this language, e.g. nasals, clicks, labials]]",   en: "[Sounds unique to this language, e.g. nasals, clicks, labials]",   fr: "[Sons propres à cette langue, ex. nasales, clics, labiales]" },
      { text: "[Syllable structure: [example]]",                                     en: "Syllable structure: [example]",                                     fr: "Structure syllabique : [exemple]" },
      { text: "[Listen and repeat: [word 1]]",                                       en: "Listen and repeat: [word 1]",                                       fr: "Écoutez et répétez : [mot 1]" },
      { text: "[Listen and repeat: [word 2]]",                                       en: "Listen and repeat: [word 2]",                                       fr: "Écoutez et répétez : [mot 2]" },
      { text: "[Minimal pair: [word A] vs. [word B]]",                               en: "Minimal pair: [word A] vs. [word B]",                               fr: "Paire minimale : [mot A] vs. [mot B]" },
      { text: "[These sounds are the foundation of every word.]",                    en: "These sounds are the foundation of every word.",                    fr: "Ces sons sont le fondement de chaque mot." },
    ],
  },
  {
    title: "Tones & Stress",
    titleFr: "Tons et Accent",
    description: "Understand how tone and stress carry meaning — the musical layer that distinguishes words and signals emotion.",
    descriptionFr: "Comprenez comment le ton et l'accent portent le sens — la couche musicale qui distingue les mots et exprime les émotions.",
    duration: 5,
    phrases: [
      { text: "[High tone — [example word]]",                     en: "High tone — [example word]",                     fr: "Ton haut — [exemple]" },
      { text: "[Low tone — [example word]]",                      en: "Low tone — [example word]",                      fr: "Ton bas — [exemple]" },
      { text: "[Rising tone — [example word]]",                   en: "Rising tone — [example word]",                   fr: "Ton montant — [exemple]" },
      { text: "[Falling tone — [example word]]",                  en: "Falling tone — [example word]",                  fr: "Ton descendant — [exemple]" },
      { text: "[Same word, different tone, different meaning]",   en: "Same word, different tone, different meaning",   fr: "Même mot, ton différent, sens différent" },
      { text: "[Tonal pair 1: [word A (high)] / [word B (low)]]", en: "Tonal pair 1: [word A (high)] / [word B (low)]", fr: "Paire tonale 1 : [mot A (haut)] / [mot B (bas)]" },
      { text: "[Tonal pair 2: [word C] / [word D]]",              en: "Tonal pair 2: [word C] / [word D]",              fr: "Paire tonale 2 : [mot C] / [mot D]" },
      { text: "[Listen and repeat until the pitch feels natural.]", en: "Listen and repeat until the pitch feels natural.", fr: "Écoutez et répétez jusqu'à ce que la hauteur soit naturelle." },
    ],
  },
];

const NUMBERS_TRADE: LessonDef[] = [
  {
    title: "Numbers 1 to 10",
    titleFr: "Les Chiffres 1 à 10",
    description: "Count from one to ten — the foundation of every number system and the first step to trading.",
    descriptionFr: "Comptez de un à dix — la base de tout système numérique et le premier pas vers le commerce.",
    duration: 4,
    phrases: [
      { text: "[One]",   en: "One",   fr: "Un" },
      { text: "[Two]",   en: "Two",   fr: "Deux" },
      { text: "[Three]", en: "Three", fr: "Trois" },
      { text: "[Four]",  en: "Four",  fr: "Quatre" },
      { text: "[Five]",  en: "Five",  fr: "Cinq" },
      { text: "[Six]",   en: "Six",   fr: "Six" },
      { text: "[Seven]", en: "Seven", fr: "Sept" },
      { text: "[Eight]", en: "Eight", fr: "Huit" },
      { text: "[Nine]",  en: "Nine",  fr: "Neuf" },
      { text: "[Ten]",   en: "Ten",   fr: "Dix" },
    ],
  },
  {
    title: "The Counting System",
    titleFr: "Le Système de Numération",
    description: "Explore the language's own counting logic — whether it groups by fives, tens, twenties, or follows another pattern.",
    descriptionFr: "Explorez la logique de numération propre à la langue — qu'elle regroupe par cinq, dix, vingt ou suive un autre modèle.",
    duration: 5,
    phrases: [
      { text: "[[Number base / grouping principle of this language]]", en: "[Number base / grouping principle of this language]", fr: "[Base numérique / principe de regroupement de cette langue]" },
      { text: "[Eleven — [pattern / construction]]",                    en: "Eleven — [pattern / construction]",                    fr: "Onze — [modèle / construction]" },
      { text: "[Twenty — [word or construction]]",                      en: "Twenty — [word or construction]",                      fr: "Vingt — [mot ou construction]" },
      { text: "[Fifty — [word or construction]]",                       en: "Fifty — [word or construction]",                       fr: "Cinquante — [mot ou construction]" },
      { text: "[One hundred — [word]]",                                  en: "One hundred — [word]",                                  fr: "Cent — [mot]" },
      { text: "[Counting practice: [sequence in this language]]",       en: "Counting practice: [sequence in this language]",       fr: "Pratique de comptage : [séquence dans cette langue]" },
      { text: "[How many? — [word for asking quantity]]",                en: "How many? — [word for asking quantity]",                fr: "Combien ? — [mot pour demander la quantité]" },
      { text: "[I have [N]. I need [N].]",                               en: "I have [N]. I need [N].",                               fr: "J'ai [N]. J'ai besoin de [N]." },
    ],
  },
  {
    title: "Money & the Market",
    titleFr: "L'Argent et le Marché",
    description: "The language of buying and selling — essential phrases for any market, whether traditional or modern.",
    descriptionFr: "Le langage de l'achat et de la vente — les formules essentielles pour tout marché, qu'il soit traditionnel ou moderne.",
    duration: 5,
    phrases: [
      { text: "[How much does it cost?]",              en: "How much does it cost?",              fr: "Combien ça coûte ?" },
      { text: "[It costs [price].]",                   en: "It costs [price].",                   fr: "Cela coûte [prix]." },
      { text: "[That is too expensive!]",              en: "That is too expensive!",              fr: "C'est trop cher !" },
      { text: "[Can you lower the price?]",            en: "Can you lower the price?",            fr: "Pouvez-vous baisser le prix ?" },
      { text: "[I will buy it.]",                      en: "I will buy it.",                      fr: "Je vais l'acheter." },
      { text: "[I will not buy it — too expensive.]",  en: "I will not buy it — too expensive.",  fr: "Je ne vais pas l'acheter — trop cher." },
      { text: "[Here is your money. Keep the change.]", en: "Here is your money. Keep the change.", fr: "Voici votre argent. Gardez la monnaie." },
      { text: "[Thank you, come again!]",              en: "Thank you, come again!",              fr: "Merci, revenez !" },
    ],
  },
  {
    title: "At the Market",
    titleFr: "Au Marché",
    description: "Navigate the bustling market — asking for goods, checking stock, and negotiating with vendors.",
    descriptionFr: "Naviguez au marché animé — demandez des marchandises, vérifiez le stock et négociez avec les vendeurs.",
    duration: 5,
    phrases: [
      { text: "[I want to buy [item].]",               en: "I want to buy [item].",               fr: "Je veux acheter [article]." },
      { text: "[Do you have [item]?]",                 en: "Do you have [item]?",                 fr: "Avez-vous [article] ?" },
      { text: "[Yes, I have it — fresh today.]",       en: "Yes, I have it — fresh today.",       fr: "Oui, je l'ai — frais aujourd'hui." },
      { text: "[No, it is finished. Come tomorrow.]",  en: "No, it is finished. Come tomorrow.",  fr: "Non, c'est fini. Revenez demain." },
      { text: "[Give me [quantity] of [item].]",       en: "Give me [quantity] of [item].",       fr: "Donnez-moi [quantité] de [article]." },
      { text: "[The market is busy today!]",           en: "The market is busy today!",           fr: "Le marché est animé aujourd'hui !" },
      { text: "[Let us go to the market together.]",   en: "Let us go to the market together.",   fr: "Allons au marché ensemble." },
      { text: "[Good trade today — we did well!]",     en: "Good trade today — we did well!",     fr: "Bonne affaire aujourd'hui — nous avons bien fait !" },
    ],
  },
];

const COMMUNICATIVE: LessonDef[] = [
  {
    title: "Welcoming a Guest",
    titleFr: "Accueillir un Invité",
    description: "The language of hospitality — welcoming, offering food and water, and the rituals that turn a visitor into a friend.",
    descriptionFr: "Le langage de l'hospitalité — accueillir, offrir nourriture et eau, et les rituels qui transforment un visiteur en ami.",
    duration: 5,
    phrases: [
      { text: "[Welcome! Come in, please.]",                           en: "Welcome! Come in, please.",                           fr: "Bienvenue ! Entrez, s'il vous plaît." },
      { text: "[Please sit down and be comfortable.]",                 en: "Please sit down and be comfortable.",                 fr: "Asseyez-vous et mettez-vous à l'aise." },
      { text: "[Would you like water? Food?]",                         en: "Would you like water? Food?",                         fr: "Voulez-vous de l'eau ? De la nourriture ?" },
      { text: "[Yes please — I am hungry and thirsty.]",               en: "Yes please — I am hungry and thirsty.",               fr: "Oui s'il vous plaît — j'ai faim et soif." },
      { text: "[How is your family? Are they well?]",                  en: "How is your family? Are they well?",                  fr: "Comment va votre famille ? Vont-ils bien ?" },
      { text: "[Everyone is well, thank you for asking.]",             en: "Everyone is well, thank you for asking.",             fr: "Tout le monde va bien, merci de demander." },
      { text: "[How long will you stay with us?]",                     en: "How long will you stay with us?",                     fr: "Combien de temps resterez-vous avec nous ?" },
      { text: "[We are glad you have come. Stay as long as you like.]", en: "We are glad you have come. Stay as long as you like.", fr: "Nous sommes heureux que vous soyez venu. Restez aussi longtemps que vous le souhaitez." },
    ],
  },
  {
    title: "Asking for Help & Directions",
    titleFr: "Demander de l'Aide et un Chemin",
    description: "Find your way and ask for help — the navigational and social phrases that get you where you need to go.",
    descriptionFr: "Trouvez votre chemin et demandez de l'aide — les formules de navigation qui vous mènent où vous devez aller.",
    duration: 5,
    phrases: [
      { text: "[Excuse me — can you help me?]",      en: "Excuse me — can you help me?",      fr: "Excusez-moi — pouvez-vous m'aider ?" },
      { text: "[I am looking for [place].]",          en: "I am looking for [place].",          fr: "Je cherche [lieu]." },
      { text: "[Turn left at the [landmark].]",       en: "Turn left at the [landmark].",       fr: "Tournez à gauche au [point de repère]." },
      { text: "[Turn right and go straight ahead.]",  en: "Turn right and go straight ahead.",  fr: "Tournez à droite et allez tout droit." },
      { text: "[It is near — just five minutes.]",    en: "It is near — just five minutes.",    fr: "C'est proche — juste cinq minutes." },
      { text: "[It is far — you should take a car.]", en: "It is far — you should take a car.", fr: "C'est loin — vous devriez prendre une voiture." },
      { text: "[I understand — thank you very much!]", en: "I understand — thank you very much!", fr: "Je comprends — merci beaucoup !" },
      { text: "[You are welcome. Safe travels!]",     en: "You are welcome. Safe travels!",     fr: "De rien. Bon voyage !" },
    ],
  },
  {
    title: "Talking About Yourself",
    titleFr: "Parler de Soi",
    description: "Share who you are, what you do, and what you love — the conversations that build genuine friendships.",
    descriptionFr: "Partagez qui vous êtes, ce que vous faites et ce que vous aimez — les conversations qui créent de vraies amitiés.",
    duration: 5,
    phrases: [
      { text: "[What is your job / occupation?]",                  en: "What is your job / occupation?",                  fr: "Quel est votre travail / votre métier ?" },
      { text: "[I am a [profession] — I work at [place].]",        en: "I am a [profession] — I work at [place].",        fr: "Je suis [profession] — je travaille à [lieu]." },
      { text: "[Are you married? Do you have children?]",          en: "Are you married? Do you have children?",          fr: "Êtes-vous marié(e) ? Avez-vous des enfants ?" },
      { text: "[Yes, I have a wife / husband and [N] children.]",  en: "Yes, I have a wife / husband and [N] children.",  fr: "Oui, j'ai une femme / un mari et [N] enfants." },
      { text: "[What do you like to do in your free time?]",       en: "What do you like to do in your free time?",       fr: "Qu'aimez-vous faire pendant votre temps libre ?" },
      { text: "[I like to [activity] — it brings me joy.]",        en: "I like to [activity] — it brings me joy.",        fr: "J'aime [activité] — cela me procure de la joie." },
      { text: "[What do you love most about your language?]",      en: "What do you love most about your language?",      fr: "Qu'est-ce que vous aimez le plus dans votre langue ?" },
      { text: "[Our language carries our whole history inside it.]", en: "Our language carries our whole history inside it.", fr: "Notre langue porte toute notre histoire en elle." },
    ],
  },
];

const ORAL_TRADITION: LessonDef[] = [
  {
    title: "A Sacred Place",
    titleFr: "Un Endroit Sacré",
    description: "A narrative about a sacred grove, hill, or river — the place that holds the community's memory and spiritual life.",
    descriptionFr: "Un récit sur un bosquet, une colline ou une rivière sacrés — l'endroit qui porte la mémoire et la vie spirituelle de la communauté.",
    duration: 5,
    isOralOrSong: true,
    phrases: [
      { text: "[[Opening: the narrator names the sacred place and its importance]]",         en: "Deep in the forest there is a place our ancestors have kept sacred for generations.",         fr: "Au fond de la forêt se trouve un endroit que nos ancêtres ont gardé sacré depuis des générations." },
      { text: "[[Description of landscape: trees, water, sounds, the feeling of the place]]", en: "Tall trees rise to the sky, their roots drinking from a quiet stream.",                       fr: "De grands arbres s'élèvent vers le ciel, leurs racines puisant dans un ruisseau silencieux." },
      { text: "[[Who guards this place — a spirit, ancestor, or community vow]]",            en: "The elders say a spirit has watched over this grove since the world was young.",               fr: "Les anciens disent qu'un esprit veille sur ce bosquet depuis que le monde était jeune." },
      { text: "[[The founding legend in one or two sentences]]",                              en: "Long ago, a hunter fleeing enemies prayed here and was hidden by the trees themselves.",       fr: "Il y a longtemps, un chasseur fuyant des ennemis pria ici et fut caché par les arbres eux-mêmes." },
      { text: "[[The taboos — what one must not do in this place]]",                          en: "No one may cut wood here, raise a loud voice, or enter without asking permission.",           fr: "Personne ne peut couper du bois ici, élever la voix, ni entrer sans demander la permission." },
      { text: "[[What the community receives in return for honouring the place]]",            en: "In return the forest gives clean water, healing plants, and shelter from storms.",           fr: "En retour, la forêt donne une eau propre, des plantes médicinales et un abri contre les tempêtes." },
      { text: "[[Closing: past tied to present — why we still remember this place]]",         en: "We carry this place in our hearts so that our children will also know where they come from.", fr: "Nous portons cet endroit dans notre cœur pour que nos enfants sachent aussi d'où ils viennent." },
    ],
  },
  {
    title: "A Cautionary Tale",
    titleFr: "Un Conte Édifiant",
    description: "A traditional story that teaches through consequence — greed, pride, or disobedience meeting their natural correction.",
    descriptionFr: "Un conte traditionnel qui enseigne par la conséquence — la cupidité, l'orgueil ou la désobéissance rencontrant leur correction naturelle.",
    duration: 5,
    isOralOrSong: true,
    phrases: [
      { text: "[[Narrator introduces the central character and their flaw]]",                      en: "There was once a man who was never satisfied — no matter how much he had, he always wanted more.", fr: "Il était une fois un homme qui n'était jamais satisfait — peu importe ce qu'il avait, il en voulait toujours plus." },
      { text: "[[The first act of greed / pride / disobedience]]",                                  en: "When the harvest was shared among the village he crept back at night and took the portions of three neighbours.", fr: "Quand la récolte fut partagée entre le village, il revint en rampant la nuit et prit les parts de trois voisins." },
      { text: "[[A warning the character ignores — from an elder, a dream, or a sign]]",            en: "An elder woman saw him and said: 'The one who takes without asking will one day find nothing left.'", fr: "Une vieille femme le vit et dit : 'Celui qui prend sans demander trouvera un jour qu'il ne reste plus rien.'." },
      { text: "[[The climax — how the flaw leads directly to disaster or loss]]",                   en: "He reached for the most prized thing in the forest and fell into a pit he had not seen in his haste.", fr: "Il tendit la main vers la chose la plus précieuse de la forêt et tomba dans une fosse qu'il n'avait pas vue dans sa hâte." },
      { text: "[[The community's response and what they decide to do]]",                             en: "The villagers found him and debated: some wanted to leave him, others insisted on pulling him out.", fr: "Les villageois le trouvèrent et débattirent : certains voulaient le laisser, d'autres insistèrent pour le sortir." },
      { text: "[[Resolution — what the character must give back or do to restore balance]]",         en: "They rescued him but he had to return everything he had stolen and work in others' fields for a full season.", fr: "Ils le sauvèrent mais il dut tout rendre et travailler dans les champs des autres pendant toute une saison." },
      { text: "[[The moral — the lesson the community carries from this story]]",                    en: "A full hand that shares is lighter than an empty hand that kept everything — remember this.", fr: "Une main pleine qui partage est plus légère qu'une main vide qui a tout gardé — souvenez-vous-en." },
    ],
  },
  {
    title: "Proverbs & Wisdom",
    titleFr: "Proverbes et Sagesse",
    description: "The proverbs that encode the community's values, ethics, and vision of the good life — short sentences that carry generations of thought.",
    descriptionFr: "Les proverbes qui encodent les valeurs, l'éthique et la vision de la vie bonne de la communauté — de courtes phrases qui portent des générations de pensée.",
    duration: 6,
    isOralOrSong: true,
    phrases: [
      { text: "[[Proverb 1] — meaning: [teaching about community or solidarity]]",      en: "[Proverb 1] — meaning: [teaching about community or solidarity]",      fr: "[Proverbe 1] — sens : [enseignement sur la communauté ou la solidarité]" },
      { text: "[[Proverb 2] — meaning: [teaching about patience or hard work]]",        en: "[Proverb 2] — meaning: [teaching about patience or hard work]",        fr: "[Proverbe 2] — sens : [enseignement sur la patience ou le travail]" },
      { text: "[[Proverb 3] — meaning: [teaching about wisdom or humility]]",           en: "[Proverb 3] — meaning: [teaching about wisdom or humility]",           fr: "[Proverbe 3] — sens : [enseignement sur la sagesse ou l'humilité]" },
      { text: "[[Proverb 4] — meaning: [teaching about family or belonging]]",          en: "[Proverb 4] — meaning: [teaching about family or belonging]",          fr: "[Proverbe 4] — sens : [enseignement sur la famille ou l'appartenance]" },
      { text: "[The elders say: [a piece of wisdom about living well].]",               en: "The elders say: [a piece of wisdom about living well].",               fr: "Les anciens disent : [un conseil de sagesse sur la manière de bien vivre]." },
      { text: "[This is what our ancestors handed down to us.]",                         en: "This is what our ancestors handed down to us.",                         fr: "C'est ce que nos ancêtres nous ont transmis." },
      { text: "[Wisdom does not belong to one person — it belongs to us all.]",         en: "Wisdom does not belong to one person — it belongs to us all.",         fr: "La sagesse n'appartient pas à une seule personne — elle nous appartient à tous." },
    ],
  },
];

const SONGS_DEF: LessonDef[] = [
  {
    title: "[Lullaby title in target language]",
    titleFr: "[French title or transliteration]",
    description: "[A lullaby sung to infants at night — tender imagery of protection, the natural world at rest, and the child's safe place in the community.]",
    descriptionFr: "[Une berceuse chantée aux nourrissons la nuit — images tendres de protection, du monde naturel au repos, et de la place sûre de l'enfant dans la communauté.]",
    duration: 3,
    isOralOrSong: true,
    phrases: [
      { text: "[[Opening verse: gentle address to the child, asking them to close their eyes]]", en: "Sleep, little one, the night is kind and the water is still.",                                       fr: "Dors, petit, la nuit est douce et l'eau est calme." },
      { text: "[[Verse: who is watching — ancestor, spirit, or parent described poetically]]",   en: "Your grandmother's hands are folded over you like wings you cannot see.",                           fr: "Les mains de ta grand-mère sont repliées sur toi comme des ailes que tu ne peux pas voir." },
      { text: "[[Chorus / repeated refrain — a short phrase sung between verses]]",              en: "Sleep, sleep, the river remembers your name.",                                                       fr: "Dors, dors, le fleuve se souvient de ton nom." },
      { text: "[[Verse: a nature image — moon, stars, or animals that are also at rest]]",      en: "The fish have gone deep, the birds have folded their wings, the fire has become a soft glow.",     fr: "Les poissons sont allés profond, les oiseaux ont replié leurs ailes, le feu est devenu une lueur douce." },
      { text: "[[Verse: a wish or blessing for the child's future]]",                            en: "May you grow straight as the silk-cotton tree and generous as the river in the wet season.",       fr: "Puisses-tu grandir droit comme le fromager et généreux comme le fleuve en saison des pluies." },
      { text: "[[Closing verse — the child is fully asleep, all is well]]",                      en: "Sleep now. Tomorrow will come with its own light. Tonight you are safe.",                          fr: "Dors maintenant. Demain viendra avec sa propre lumière. Cette nuit tu es en sécurité." },
    ],
  },
  {
    title: "[Praise song / work song title]",
    titleFr: "[French title]",
    description: "[A praise song or work song — call-and-response, performed at ceremonies or during communal labour, celebrating an ancestor, leader, or collective effort.]",
    descriptionFr: "[Un chant de louange ou de travail — appel-réponse, exécuté lors de cérémonies ou du travail communal, célébrant un ancêtre, un chef ou un effort collectif.]",
    duration: 4,
    isOralOrSong: true,
    phrases: [
      { text: "[[Opening call: the lead singer names the subject of the praise]]",              en: "We call the name of the one who stood when others sat down.",                                       fr: "Nous appelons le nom de celui qui s'est levé quand les autres se sont assis." },
      { text: "[[Response: the chorus affirms with a short refrain]]",                          en: "We have heard! The name travels on the wind!",                                                       fr: "Nous avons entendu ! Le nom voyage sur le vent !" },
      { text: "[[Verse: the first praise epithet — a deed or quality in vivid imagery]]",      en: "You whose hands fed forty mouths in the year the rains forgot to come.",                           fr: "Toi dont les mains ont nourri quarante bouches l'année où les pluies ont oublié de venir." },
      { text: "[[Response refrain repeated]]",                                                  en: "We have heard! The name travels on the wind!",                                                       fr: "Nous avons entendu ! Le nom voyage sur le vent !" },
      { text: "[[Verse: a character trait compared to nature — patience, strength, depth]]",   en: "You who are patient as the baobab and deep as the water that has no bottom.",                       fr: "Toi qui es patient comme le baobab et profond comme l'eau qui n'a pas de fond." },
      { text: "[[Closing: the community joins in a final call of the name and a blessing]]",   en: "Live in us! Walk beside us! Your work did not end — it became us.",                                 fr: "Vis en nous ! Marche à côté de nous ! Ton travail ne s'est pas terminé — il nous est devenu." },
    ],
  },
];

const EVERYDAY_LIFE: LessonDef[] = [
  {
    title: "At the Clinic",
    titleFr: "À la Clinique",
    description: "Describe symptoms, ask about treatments, and navigate a medical appointment — vocabulary every speaker needs when health matters.",
    descriptionFr: "Décrivez des symptômes, renseignez-vous sur les traitements et gérez une consultation médicale — le vocabulaire indispensable en cas de problème de santé.",
    duration: 6,
    phrases: [
      { text: "[I am not feeling well. I have been sick since [yesterday / two days ago].]",          en: "I am not feeling well. I have been sick since yesterday.",                         fr: "Je ne me sens pas bien. Je suis malade depuis hier." },
      { text: "[I have a fever / a headache / a stomachache / a sore throat.]",                       en: "I have a fever / a headache / a stomachache / a sore throat.",                    fr: "J'ai de la fièvre / mal à la tête / mal au ventre / mal à la gorge." },
      { text: "[The pain is here — it started [when / after].]",                                      en: "The pain is here — it started when I woke up this morning.",                       fr: "La douleur est ici — elle a commencé quand je me suis réveillé ce matin." },
      { text: "[Doctor, what do you think is wrong with me?]",                                        en: "Doctor, what do you think is wrong with me?",                                      fr: "Docteur, qu'est-ce que vous pensez que j'ai ?" },
      { text: "[You have [illness]. You need to rest and take this medicine.]",                        en: "You have a mild infection. You need to rest and take this medicine twice a day.",   fr: "Vous avez une légère infection. Vous devez vous reposer et prendre ce médicament deux fois par jour." },
      { text: "[How many times a day should I take it? For how many days?]",                          en: "How many times a day should I take it? For how many days?",                        fr: "Combien de fois par jour dois-je le prendre ? Pendant combien de jours ?" },
      { text: "[Take it [once / twice / three times] a day, [before / after] meals, for [N] days.]", en: "Take it twice a day, after meals, for five days.",                                  fr: "Prenez-le deux fois par jour, après les repas, pendant cinq jours." },
      { text: "[Is this serious? Should I come back?]",                                               en: "Is this serious? Should I come back to see you?",                                  fr: "C'est grave ? Est-ce que je dois revenir vous voir ?" },
      { text: "[If you do not feel better in [N] days, come back immediately.]",                      en: "If you do not feel better in three days, come back immediately.",                   fr: "Si vous ne vous sentez pas mieux dans trois jours, revenez immédiatement." },
      { text: "[Thank you, doctor. I will follow your advice.]",                                      en: "Thank you, doctor. I will follow your advice and rest well.",                       fr: "Merci, docteur. Je vais suivre vos conseils et bien me reposer." },
    ],
  },
  {
    title: "Getting Around",
    titleFr: "Se Déplacer",
    description: "Ask for and give directions, use public transport, and describe where things are — the language of navigating the city and the road.",
    descriptionFr: "Demandez et donnez des directions, utilisez les transports en commun et décrivez l'emplacement des choses — le langage pour se repérer en ville et sur la route.",
    duration: 6,
    phrases: [
      { text: "[Excuse me, I am looking for [the bus station / the hospital / the market]. Can you help me?]", en: "Excuse me, I am looking for the bus station. Can you help me?",                                fr: "Excusez-moi, je cherche la gare routière. Pouvez-vous m'aider ?" },
      { text: "[Go straight ahead until you reach [the junction / the big tree / the school].]",               en: "Go straight ahead until you reach the junction with the school on your left.",             fr: "Allez tout droit jusqu'à ce que vous atteigniez le carrefour avec l'école sur votre gauche." },
      { text: "[Turn [left / right] at the [roundabout / traffic lights / corner].]",                          en: "Turn left at the roundabout, then right at the traffic lights.",                           fr: "Tournez à gauche au rond-point, puis à droite aux feux de circulation." },
      { text: "[It is about [ten minutes / two kilometres] from here — you can walk or take a [bus / taxi].]", en: "It is about ten minutes from here — you can walk or take a taxi.",                          fr: "C'est à environ dix minutes d'ici — vous pouvez marcher ou prendre un taxi." },
      { text: "[Which bus goes to [destination]? Where do I board?]",                                          en: "Which bus goes to the city centre? Where do I board?",                                    fr: "Quel bus va au centre-ville ? Où est-ce que je monte ?" },
      { text: "[Take [bus number / the yellow bus] and get off at [stop name].]",                              en: "Take the number 12 bus and get off at the market stop.",                                   fr: "Prenez le bus numéro 12 et descendez à l'arrêt du marché." },
      { text: "[How long does the journey take? Is it direct or do I need to change?]",                        en: "How long does the journey take? Is it direct or do I need to change?",                     fr: "Combien de temps dure le trajet ? C'est direct ou je dois changer ?" },
      { text: "[It takes about [thirty minutes] and you need to change at [place].]",                          en: "It takes about thirty minutes and you need to change at the central terminal.",            fr: "Cela prend environ trente minutes et vous devez changer au terminal central." },
      { text: "[I think I am lost. Could you show me on this map where we are?]",                              en: "I think I am lost. Could you show me on this map where we are?",                          fr: "Je crois que je me suis perdu. Pourriez-vous me montrer sur cette carte où nous sommes ?" },
      { text: "[You are here. Go back to [landmark] and start again — it is not far.]",                        en: "You are here, near the big roundabout. Go back and start again — it is not far at all.",   fr: "Vous êtes ici, près du grand rond-point. Rebroussez chemin — ce n'est vraiment pas loin." },
    ],
  },
  {
    title: "Food & Cooking",
    titleFr: "Nourriture et Cuisine",
    description: "Talk about ingredients, cooking methods, and the meals that define community — from the kitchen to the table.",
    descriptionFr: "Parlez des ingrédients, des méthodes de cuisson et des repas qui définissent la communauté — de la cuisine à la table.",
    duration: 6,
    phrases: [
      { text: "[What are you cooking? It smells wonderful!]",                                                    en: "What are you cooking? It smells wonderful!",                                              fr: "Qu'est-ce que vous cuisinez ? Ça sent merveilleusement bon !" },
      { text: "[I am making [dish name] — a traditional dish made with [main ingredients].]",                   en: "I am making a traditional dish made with yam, palm oil, and fresh pepper.",                fr: "Je prépare un plat traditionnel fait avec de l'igname, de l'huile de palme et du piment frais." },
      { text: "[First you [boil / fry / grind] the [ingredient], then you add the [spices / sauce].]",          en: "First you boil the yam until soft, then you pound it and add the soup.",                   fr: "D'abord vous faites bouillir l'igname jusqu'à ce qu'elle soit tendre, puis vous la pilez et ajoutez la sauce." },
      { text: "[You need to stir it constantly so it does not burn at the bottom.]",                             en: "You need to stir it constantly so it does not burn at the bottom of the pot.",            fr: "Vous devez remuer constamment pour qu'il ne brûle pas au fond de la marmite." },
      { text: "[How long does it take to cook? What is the right moment to add the [ingredient]?]",             en: "How long does it take to cook? When is the right moment to add the seasoning?",           fr: "Combien de temps faut-il pour cuire ? Quel est le bon moment pour ajouter l'assaisonnement ?" },
      { text: "[It cooks for about [forty-five minutes] on a medium flame / fire.]",                            en: "It cooks for about forty-five minutes on a medium flame.",                                 fr: "Cela cuit environ quarante-cinq minutes à feu moyen." },
      { text: "[What is your favourite food? Which dish do you cook when guests come?]",                         en: "What is your favourite food? Which dish do you always cook when guests arrive?",           fr: "Quel est votre plat préféré ? Quel plat cuisinez-vous toujours quand des invités arrivent ?" },
      { text: "[When guests come, I always make [dish] because it is [filling / festive / beloved by all].]",   en: "When guests come, I always make the groundnut stew because everyone loves it.",             fr: "Quand des invités arrivent, je fais toujours le ragoût d'arachides parce que tout le monde l'adore." },
      { text: "[This dish is eaten during [festival / ceremony / harvest season] — it has a special meaning.]", en: "This dish is eaten during the harvest festival — it has a deep meaning for our people.",  fr: "Ce plat est consommé pendant le festival des récoltes — il a une signification profonde pour notre peuple." },
      { text: "[Food is more than nourishment — it is how we remember who we are.]",                            en: "Food is more than nourishment — it is how we remember who we are and where we come from.", fr: "La nourriture est plus que de la subsistance — c'est ainsi que nous nous souvenons de qui nous sommes et d'où nous venons." },
    ],
  },
  {
    title: "Weather & the Seasons",
    titleFr: "Le Temps et les Saisons",
    description: "Describe the weather, talk about the rainy and dry seasons, and discuss how climate shapes daily life and the farming calendar.",
    descriptionFr: "Décrivez le temps, parlez des saisons des pluies et sèches, et discutez de la façon dont le climat façonne la vie quotidienne et le calendrier agricole.",
    duration: 5,
    phrases: [
      { text: "[How is the weather today? It looks like it might rain.]",                                    en: "How is the weather today? It looks like it might rain this afternoon.",                   fr: "Quel temps fait-il aujourd'hui ? On dirait qu'il pourrait pleuvoir cet après-midi." },
      { text: "[Yes, the sky is very dark. The rainy season is coming early this year.]",                    en: "Yes, the sky is very dark. The rainy season seems to be coming early this year.",          fr: "Oui, le ciel est très sombre. La saison des pluies semble arriver tôt cette année." },
      { text: "[During the rainy season, [the river rises / the farms are green / the roads flood].]",      en: "During the rainy season, the river rises and the roads sometimes flood completely.",       fr: "Pendant la saison des pluies, le fleuve monte et les routes s'inondent parfois complètement." },
      { text: "[During the dry season, [the heat is intense / we fetch water from far / the dust comes].]", en: "During the dry season, the heat is intense and we have to fetch water from further away.", fr: "Pendant la saison sèche, la chaleur est intense et nous devons aller chercher l'eau de plus loin." },
      { text: "[What season is best for planting? When does the harvest happen?]",                           en: "What season is best for planting? And when does the main harvest usually happen?",         fr: "Quelle saison est la meilleure pour planter ? Et quand a lieu la récolte principale habituellement ?" },
      { text: "[We plant at the beginning of the rains and harvest at the end — around [month].]",          en: "We plant at the beginning of the rains in April and harvest around October.",              fr: "Nous plantons au début des pluies en avril et récoltons vers octobre." },
      { text: "[This year the rains were [late / too heavy / not enough]. The harvest will be [good / difficult].]", en: "This year the rains were late and too heavy at once. The harvest will be difficult.", fr: "Cette année les pluies ont été tardives et trop abondantes à la fois. La récolte sera difficile." },
      { text: "[Our elders say they can read the weather by [observing animals / wind direction / cloud shape].]", en: "Our elders say they can read the coming weather by observing the behaviour of birds and ants.", fr: "Nos anciens disent qu'ils peuvent lire le temps à venir en observant le comportement des oiseaux et des fourmis." },
      { text: "[The weather affects everything — the crops, the festivals, the mood of the whole community.]", en: "The weather affects everything — the crops, the festivals, even the mood of the whole community.", fr: "Le temps affecte tout — les cultures, les fêtes, même l'humeur de toute la communauté." },
    ],
  },
  {
    title: "Making Plans",
    titleFr: "Faire des Projets",
    description: "Suggest activities, agree on times and places, make and change plans — the social language of coordinating with others.",
    descriptionFr: "Proposez des activités, convenez d'heures et de lieux, faites et modifiez des plans — le langage social pour se coordonner avec les autres.",
    duration: 5,
    phrases: [
      { text: "[Are you free [this weekend / tomorrow evening / next Friday]? I would like to invite you to [event].]", en: "Are you free this Saturday? I would like to invite you to a gathering at my place.",       fr: "Êtes-vous libre ce samedi ? J'aimerais vous inviter à une réunion chez moi." },
      { text: "[That sounds wonderful! What time should I come? What should I bring?]",                                 en: "That sounds wonderful! What time should I come? Should I bring anything?",               fr: "Ça semble merveilleux ! À quelle heure dois-je venir ? Est-ce que je dois apporter quelque chose ?" },
      { text: "[Come at [time]. You do not need to bring anything — just yourself and your good mood.]",                en: "Come at six in the evening. You don't need to bring anything — just yourself.",          fr: "Venez à dix-huit heures. Vous n'avez rien à apporter — juste vous-même." },
      { text: "[I am afraid I cannot make it on that day. I already have [commitment]. Can we change it to [day]?]",   en: "I'm afraid I can't make it that day. I already have a prior commitment. Can we change it to Sunday?", fr: "J'ai peur de ne pas pouvoir ce jour-là. J'ai déjà un engagement. Peut-on le changer à dimanche ?" },
      { text: "[Of course! Sunday works perfectly. Let us say [time] at [place].]",                                    en: "Of course! Sunday works perfectly. Let's say four o'clock at the community hall.",     fr: "Bien sûr ! Dimanche est parfait. Disons seize heures à la salle communautaire." },
      { text: "[Do not forget — [the event / the meeting] is [tomorrow / in two days]. I am looking forward to it.]",  en: "Don't forget — the gathering is tomorrow. I'm really looking forward to seeing everyone.", fr: "N'oubliez pas — la réunion est demain. J'attends avec impatience de voir tout le monde." },
      { text: "[Something has come up — I may be a little late. Please start without me.]",                             en: "Something has come up and I may be a little late. Please start without me.",            fr: "Quelque chose s'est passé et je risque d'être un peu en retard. Commencez sans moi." },
      { text: "[No problem — we will wait for you. The evening would not be the same without you.]",                   en: "No problem at all — we will wait a bit. The evening would not be the same without you.", fr: "Aucun problème — nous attendrons un peu. La soirée ne serait pas pareille sans vous." },
      { text: "[That was a wonderful evening. Let us do this again soon!]",                                             en: "That was a truly wonderful evening. Let us definitely do this again very soon!",       fr: "C'était une vraie soirée merveilleuse. Faisons certainement cela de nouveau très bientôt !" },
    ],
  },
];

const CONTEMPORARY: LessonDef[] = [
  {
    title: "Technology & Connection",
    titleFr: "Technologie et Connexion",
    description: "Talk about phones, the internet, and social media — how technology is changing the way we communicate, learn, and stay connected.",
    descriptionFr: "Parlez des téléphones, d'internet et des réseaux sociaux — comment la technologie change la façon dont nous communiquons, apprenons et restons connectés.",
    duration: 6,
    phrases: [
      { text: "[Do you use a smartphone? Which apps do you use most often and for what?]",                                         en: "Do you use a smartphone? Which apps do you use most often and why?",                                              fr: "Utilisez-vous un smartphone ? Quelles applications utilisez-vous le plus souvent et pourquoi ?" },
      { text: "[I use my phone mainly for [communicating with family / finding information / listening to music / working].]",     en: "I use my phone mainly for communicating with family abroad and finding information quickly.",                        fr: "J'utilise mon téléphone principalement pour communiquer avec ma famille à l'étranger et trouver des informations rapidement." },
      { text: "[The internet has changed [how we learn / how we do business / how we stay in touch with our culture].]",          en: "The internet has changed how we learn — now I can find resources in our language online.",                          fr: "Internet a changé la façon dont nous apprenons — maintenant je peux trouver des ressources dans notre langue en ligne." },
      { text: "[Some people say technology is [bringing us closer / pulling us apart / changing our values]. What do you think?]", en: "Some people say technology is pulling families apart. Do you think that is true for your community?",              fr: "Certains disent que la technologie éloigne les familles. Pensez-vous que c'est vrai dans votre communauté ?" },
      { text: "[I think technology can bring us closer if we use it to [share our language / keep traditions alive / connect the diaspora].]", en: "I think technology can bring us closer if we use it intentionally to keep our traditions alive.",          fr: "Je pense que la technologie peut nous rapprocher si nous l'utilisons intentionnellement pour maintenir nos traditions vivantes." },
      { text: "[In our community, [elders / young people / teachers] are using technology to [record stories / teach language / sell goods].]", en: "In our community, the elders are now recording their stories using voice apps so they are not lost.", fr: "Dans notre communauté, les anciens enregistrent maintenant leurs histoires avec des applications vocales pour qu'elles ne soient pas perdues." },
      { text: "[What do you think we might lose if everything moves online? What could we gain?]",                                  en: "What do you think we might lose if everything moves online? And what could we genuinely gain?",                   fr: "Que pensez-vous que nous pourrions perdre si tout se passe en ligne ? Et que pourrions-nous réellement gagner ?" },
      { text: "[We might lose the [face-to-face connection / the ritual / the silence between words] that technology cannot replicate.]", en: "We might lose the face-to-face connection — the warmth that technology simply cannot replicate.",          fr: "Nous pourrions perdre le lien en face à face — la chaleur que la technologie ne peut tout simplement pas reproduire." },
      { text: "[Technology is a tool. Like any tool, it is only as good as the hands and intentions behind it.]",                  en: "Technology is a tool. Like any tool, it is only as good as the hands and intentions behind it.",                   fr: "La technologie est un outil. Comme tout outil, elle vaut autant que les mains et les intentions qui la manient." },
    ],
  },
  {
    title: "Environment & Our Responsibility",
    titleFr: "L'Environnement et Notre Responsabilité",
    description: "Discuss environmental change, how it affects communities, and what traditional knowledge offers as a response — a B2-level conversation about the world we share.",
    descriptionFr: "Discutez du changement environnemental, de son impact sur les communautés et de ce que le savoir traditionnel peut apporter en réponse — une conversation de niveau B2 sur le monde que nous partageons.",
    duration: 6,
    phrases: [
      { text: "[Have you noticed changes in the environment around you over the past [ten / twenty] years?]",                      en: "Have you noticed changes in the environment around your community over the past twenty years?",                     fr: "Avez-vous remarqué des changements dans l'environnement autour de votre communauté au cours des vingt dernières années ?" },
      { text: "[Yes — the [forest / river / rainfall / dry season] has changed significantly. [The trees are fewer / The river is lower / The rains come later].]", en: "Yes — the forest around us has shrunk significantly and the river is shallower than it used to be.",   fr: "Oui — la forêt autour de nous a considérablement réduit et la rivière est moins profonde qu'elle ne l'était." },
      { text: "[Our elders say that in their time, [the forest extended / the rains were predictable / the animals were abundant].]", en: "Our elders say that in their time, the rains were completely predictable — they knew the seasons by heart.", fr: "Nos anciens disent qu'à leur époque, les pluies étaient totalement prévisibles — ils connaissaient les saisons par cœur." },
      { text: "[What do you think is causing these changes? What are the effects on [farming / food / community life]?]",           en: "What do you think is causing these changes, and what are the effects on farming and daily life here?",              fr: "Qu'est-ce qui cause ces changements selon vous, et quels sont les effets sur l'agriculture et la vie quotidienne ici ?" },
      { text: "[Traditional knowledge teaches us [to plant by the moon / to read the land / to take only what we need].]",        en: "Traditional knowledge teaches us to read the land and take only what we need from it — a form of wisdom we are rediscovering.", fr: "Le savoir traditionnel nous apprend à lire la terre et à ne prendre que ce dont nous avons besoin — une sagesse que nous redécouvrons." },
      { text: "[Some young people are combining [traditional knowledge] with [modern science] to find new solutions.]",            en: "Some young people in our community are now combining traditional knowledge with modern science to restore degraded farmland.", fr: "Certains jeunes de notre communauté combinent maintenant le savoir traditionnel avec la science moderne pour restaurer les terres agricoles dégradées." },
      { text: "[What responsibility do individuals have? What must governments and businesses do?]",                                en: "What responsibility do individuals have, and what must governments and large businesses do differently?",             fr: "Quelle est la responsabilité des individus, et que doivent faire différemment les gouvernements et les grandes entreprises ?" },
      { text: "[We cannot solve this alone — it requires [international cooperation / policy change / community action] at every level.]", en: "We cannot solve this alone — it requires genuine cooperation between communities, governments, and the international community.", fr: "Nous ne pouvons pas résoudre cela seuls — cela nécessite une véritable coopération entre les communautés, les gouvernements et la communauté internationale." },
      { text: "[If we do not act now, what world do we leave for those who come after us?]",                                       en: "If we do not act now with courage and urgency, what world are we leaving for those who come after us?",               fr: "Si nous n'agissons pas maintenant avec courage et urgence, quel monde laissons-nous à ceux qui viennent après nous ?" },
    ],
  },
  {
    title: "Identity & Belonging",
    titleFr: "Identité et Appartenance",
    description: "Explore questions of who you are, where you belong, and how language and culture shape identity — a rich B2-level conversation.",
    descriptionFr: "Explorez les questions de qui vous êtes, où vous appartenez et comment la langue et la culture façonnent l'identité — une riche conversation de niveau B2.",
    duration: 6,
    phrases: [
      { text: "[How would you describe your identity? What are the different parts that make up who you are?]",                    en: "How would you describe your own identity? What are the different parts that make up who you are?",               fr: "Comment décririez-vous votre propre identité ? Quelles sont les différentes parties qui constituent ce que vous êtes ?" },
      { text: "[I am [ethnicity / religion / profession / parent / child of this land] — these things together make me who I am.]", en: "I am Yoruba, Muslim, a teacher, and a son of this land — these things together make me who I am.",          fr: "Je suis Yoruba, musulman, enseignant et fils de cette terre — ces choses ensemble font ce que je suis." },
      { text: "[Do you feel torn between [tradition and modernity / your heritage and the wider world]? How do you navigate that?]", en: "Do you ever feel torn between your traditions and the demands of the modern world? How do you navigate that?", fr: "Vous sentez-vous parfois tiraillé entre vos traditions et les exigences du monde moderne ? Comment naviguez-vous cela ?" },
      { text: "[I have learned that [tradition and modernity / being rooted and being open] do not have to be opposites.]",       en: "I have learned over time that being rooted in tradition and being open to the world are not opposites.",           fr: "J'ai appris avec le temps qu'être ancré dans la tradition et être ouvert sur le monde ne sont pas des opposés." },
      { text: "[What does it mean to you to speak your mother tongue? What do you express in it that you cannot express in other languages?]", en: "What does it truly mean to you to speak your mother tongue? Is there something you can only say in it?", fr: "Que signifie vraiment pour vous de parler votre langue maternelle ? Y a-t-il quelque chose que vous ne pouvez exprimer que dans celle-ci ?" },
      { text: "[In my language there are words and expressions for [feelings / relationships / states of being] that have no equivalent elsewhere.]", en: "In my language there are words for certain feelings and states of belonging that simply have no equivalent in any other language I know.", fr: "Dans ma langue il y a des mots pour certains sentiments et états d'appartenance qui n'ont tout simplement pas d'équivalent dans aucune autre langue que je connais." },
      { text: "[For people in the diaspora, language becomes [a thread to home / a way to pass culture to children / a form of resistance].]", en: "For our people in the diaspora, the language often becomes the last thread connecting them to home.", fr: "Pour notre peuple de la diaspora, la langue devient souvent le dernier fil qui les relie à la maison." },
      { text: "[Belonging is not just about [where you were born / what passport you hold] — it is about [what you carry inside you].]", en: "Belonging is not just about where you were born — it is about what you carry inside you and choose to pass on.", fr: "L'appartenance ne concerne pas seulement l'endroit où vous êtes né — c'est ce que vous portez en vous et choisissez de transmettre." },
      { text: "[Our language is not just a means of communication — it is the house in which our whole way of seeing the world lives.]", en: "Our language is not just a means of communication — it is the house in which our entire way of seeing the world lives.", fr: "Notre langue n'est pas seulement un moyen de communication — c'est la maison dans laquelle vit toute notre façon de voir le monde." },
    ],
  },
  {
    title: "Work, Ambition & the Future",
    titleFr: "Travail, Ambition et Avenir",
    description: "Discuss careers, dreams, and the balance between personal ambition and community responsibility — a B2-level exploration of purpose and the future.",
    descriptionFr: "Discutez de carrières, de rêves et de l'équilibre entre ambition personnelle et responsabilité communautaire — une exploration de niveau B2 du but et de l'avenir.",
    duration: 6,
    phrases: [
      { text: "[What do you do for work? How did you come to choose that path?]",                                                  en: "What do you do for work? And how did you come to choose that particular path in life?",                          fr: "Que faites-vous comme travail ? Et comment en êtes-vous venu à choisir ce chemin particulier dans la vie ?" },
      { text: "[I work as a [profession]. I chose this because [reason — passion / necessity / family / opportunity].]",          en: "I work as a nurse. I chose this because I watched my mother care for our community and wanted to do the same.",  fr: "Je travaille comme infirmière. J'ai choisi cela parce que j'ai vu ma mère s'occuper de notre communauté et j'ai voulu faire de même." },
      { text: "[What are the biggest challenges in your work? What gives you the most satisfaction?]",                             en: "What are the biggest challenges in your work day to day? And what gives you the most satisfaction?",             fr: "Quels sont les plus grands défis dans votre travail au quotidien ? Et qu'est-ce qui vous procure le plus de satisfaction ?" },
      { text: "[The challenge is [long hours / limited resources / lack of recognition]. The reward is [the impact / the relationships / seeing people grow].]", en: "The challenge is the long hours with limited resources, but the reward is seeing real impact in people's lives.", fr: "Le défi ce sont les longues heures avec des ressources limitées, mais la récompense est de voir un impact réel dans la vie des gens." },
      { text: "[If you could change one thing about how work is organised in your community, what would it be?]",                  en: "If you could change one thing about how work and opportunity are organised in your community, what would it be?", fr: "Si vous pouviez changer une chose sur la façon dont le travail et les opportunités sont organisés dans votre communauté, quelle serait-elle ?" },
      { text: "[I would want [young people / women / people from rural areas] to have [better access / more opportunities / fairer conditions].]", en: "I would want young people from rural areas to have the same access to opportunity as those in the city.", fr: "Je voudrais que les jeunes des zones rurales aient le même accès aux opportunités que ceux de la ville." },
      { text: "[What are your ambitions for the next [five / ten] years? What does success look like to you?]",                   en: "What are your personal ambitions for the next ten years? What does success genuinely look like to you?",        fr: "Quelles sont vos ambitions personnelles pour les dix prochaines années ? À quoi ressemble vraiment le succès pour vous ?" },
      { text: "[Success for me is not only [money / status] — it is [being useful / raising my children well / contributing to my community].]", en: "Success for me is not primarily about money — it is about being genuinely useful and leaving things better than I found them.", fr: "Le succès pour moi ne concerne pas principalement l'argent — c'est d'être vraiment utile et de laisser les choses meilleures que je ne les ai trouvées." },
      { text: "[The future belongs to those who [prepare for it / refuse to give up / build it together with their community].]", en: "The future belongs to those who prepare for it with both knowledge and humility — and who build it together.", fr: "L'avenir appartient à ceux qui s'y préparent avec à la fois savoir et humilité — et qui le construisent ensemble." },
    ],
  },
  {
    title: "Ceremony, Celebration & Ritual",
    titleFr: "Cérémonie, Célébration et Rituel",
    description: "Describe rites of passage, celebrations, and ceremonies — the formal language of community milestones and cultural continuity.",
    descriptionFr: "Décrivez les rites de passage, les célébrations et les cérémonies — le langage formel des étapes communautaires et de la continuité culturelle.",
    duration: 7,
    isOralOrSong: true,
    phrases: [
      { text: "[[Opening of a ceremony: the elder calls the community together and names the occasion]]",                         en: "We are gathered here today to mark a moment that our community has honoured for as long as memory reaches.",        fr: "Nous sommes réunis ici aujourd'hui pour marquer un moment que notre communauté honore depuis aussi loin que la mémoire peut porter." },
      { text: "[[The reason for the ceremony — what is being celebrated or marked]]",                                             en: "Today we celebrate the passing of our son / daughter into adulthood — a threshold that changes everything.",       fr: "Aujourd'hui nous célébrons le passage de notre fils / fille à l'âge adulte — un seuil qui change tout." },
      { text: "[[The role of the elders — what authority and wisdom they bring to this moment]]",                                 en: "The elders are here not only to witness but to bind this moment to all the moments that came before.",             fr: "Les anciens sont là non seulement pour témoigner, mais pour relier ce moment à tous les moments qui l'ont précédé." },
      { text: "[[The words spoken to the person being honoured — a blessing, a charge, an expectation]]",                        en: "We say to you: carry our name with dignity, speak our language with pride, and never forget from whose hands you were formed.", fr: "Nous vous disons : portez notre nom avec dignité, parlez notre langue avec fierté, et n'oubliez jamais de quelles mains vous avez été formé." },
      { text: "[[The role of the family — what they offer and what they ask in return]]",                                         en: "Your family stands behind you as a forest stands behind a lone tree — offering shelter and asking only that you grow straight.", fr: "Votre famille se tient derrière vous comme une forêt se tient derrière un arbre solitaire — offrant un abri et demandant seulement que vous grandissiez droit." },
      { text: "[[A symbolic act — the sharing of food, the pouring of libation, or the giving of a gift]]",                      en: "We pour libation now — water and palm wine — to call the ancestors to witness and to thank them for what they have passed on.", fr: "Nous faisons une libation maintenant — eau et vin de palme — pour appeler les ancêtres à témoigner et pour les remercier de ce qu'ils ont transmis." },
      { text: "[[The communal response — how the crowd affirms, chants, or answers the elder's words]]",                         en: "The community answers: We have heard! We remember! We will carry this forward!",                                    fr: "La communauté répond : Nous avons entendu ! Nous nous souvenons ! Nous porterons cela en avant !" },
      { text: "[[The closing — how the ceremony ends and what it leaves behind]]",                                                en: "The ceremony closes as it always has — with a meal shared, with music, with laughter, and with the knowledge that we are still here.", fr: "La cérémonie se clôt comme elle l'a toujours fait — avec un repas partagé, de la musique, des rires, et la certitude que nous sommes toujours là." },
    ],
  },
];

const COURSE_DEFS: CourseDef[] = [
  {
    type: "first_words", abbrev: "fw", order: 1, level: "beginner",
    titleEn: "First Words", titleFr: "Premiers Mots",
    descriptionEn: "Begin with greetings, names, and introductions — the words that open doors and build belonging.",
    descriptionFr: "Commencez par les salutations, les noms et les présentations — les mots qui ouvrent les portes et créent un sentiment d'appartenance.",
    lessons: FIRST_WORDS,
  },
  {
    type: "sound_script", abbrev: "ss", order: 2, level: "beginner",
    titleEn: "Sounds & Script", titleFr: "Sons et Écriture",
    descriptionEn: "Master the sound system and writing conventions — vowels, consonants, tones, and the orthography of the language.",
    descriptionFr: "Maîtrisez le système phonétique et les conventions d'écriture — voyelles, consonnes, tons et l'orthographe de la langue.",
    lessons: SOUND_SCRIPT,
  },
  {
    type: "numbers_trade", abbrev: "nt", order: 3, level: "beginner",
    titleEn: "Counting & Trade", titleFr: "Chiffres et Commerce",
    descriptionEn: "Learn to count, handle money, and navigate the market — the practical vocabulary of everyday life.",
    descriptionFr: "Apprenez à compter, à gérer l'argent et à naviguer au marché — le vocabulaire pratique de la vie quotidienne.",
    lessons: NUMBERS_TRADE,
  },
  {
    type: "communicative", abbrev: "cm", order: 4, level: "beginner",
    titleEn: "Speaking Well", titleFr: "Bien Parler",
    descriptionEn: "Practise extended conversations — hospitality, asking for help, and sharing who you are.",
    descriptionFr: "Pratiquez des conversations étendues — hospitalité, demande d'aide et partage de qui vous êtes.",
    lessons: COMMUNICATIVE,
  },
  {
    type: "oral_tradition", abbrev: "ot", order: 5, level: "intermediate",
    titleEn: "Oral Tradition", titleFr: "Tradition Orale",
    descriptionEn: "Listen to traditional stories, proverbs, and communal wisdom rooted in centuries of shared memory.",
    descriptionFr: "Écoutez des contes traditionnels, des proverbes et de la sagesse communautaire enracinés dans des siècles de mémoire partagée.",
    lessons: ORAL_TRADITION,
  },
  {
    type: "songs", abbrev: "sg", order: 6, level: "beginner",
    titleEn: "Songs & Sing-Along", titleFr: "Chansons et Karaoké",
    descriptionEn: "Learn through traditional and community songs — lullabies and praise songs with sing-along lyrics.",
    descriptionFr: "Apprenez à travers des chansons traditionnelles et communautaires — berceuses et chants de louange avec paroles à chanter.",
    lessons: SONGS_DEF,
  },
  {
    type: "everyday_life", abbrev: "el", order: 7, level: "beginner",
    titleEn: "Everyday Life", titleFr: "La Vie Quotidienne",
    descriptionEn: "Navigate real-life situations — health, travel, food, weather, and plans — with the confidence of an A2 speaker.",
    descriptionFr: "Naviguez dans des situations de la vie réelle — santé, voyages, nourriture, météo et projets — avec la confiance d'un locuteur A2.",
    lessons: EVERYDAY_LIFE,
  },
  {
    type: "contemporary", abbrev: "ct", order: 8, level: "intermediate",
    titleEn: "Contemporary World", titleFr: "Le Monde Contemporain",
    descriptionEn: "Engage with complex modern topics — technology, environment, identity, work, and ceremony — at B2 level.",
    descriptionFr: "Abordez des sujets modernes complexes — technologie, environnement, identité, travail et cérémonie — au niveau B2.",
    lessons: CONTEMPORARY,
  },
];

// ─── Builders ─────────────────────────────────────────────────────────────────

function buildCourses(languageId: string, nativeName: string) {
  return COURSE_DEFS.map((def) => ({
    id: `course-${languageId}-${def.abbrev}`,
    languageId,
    title: `${nativeName} — ${def.titleEn}`,
    titleFr: `${nativeName} — ${def.titleFr}`,
    description: def.descriptionEn,
    descriptionFr: def.descriptionFr,
    level: def.level,
    lessonsCount: def.lessons.length,
    order: def.order,
    courseType: def.type,
  }));
}

type SegmentRow = {
  lessonId: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string | null;
  translationFr: string | null;
  order: number;
};

type LessonRow = {
  id: string;
  courseId: string;
  type: string;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  audioUrl: null;
  duration: null;
  order: number;
  artist: string | null;
  genre: string | null;
  isActive: false;
  segments: SegmentRow[];
};

function buildLessons(languageId: string, def: CourseDef): LessonRow[] {
  const courseId = `course-${languageId}-${def.abbrev}`;
  const isSong = def.type === "songs";

  return def.lessons.map((lesson, li) => {
    const n = li + 1;
    const lessonId = `${languageId}-${def.abbrev}-${n}`;
    return {
      id: lessonId,
      courseId,
      type: isSong ? "song" : "lesson",
      title: lesson.title,
      titleFr: lesson.titleFr,
      description: lesson.description,
      descriptionFr: lesson.descriptionFr,
      audioUrl: null,
      duration: null,
      order: n,
      artist: isSong ? "Traditional" : null,
      genre: isSong ? (li === 0 ? "lullaby" : "praise") : null,
      isActive: false as const,
      segments: lesson.phrases.map((p, pi) => ({
        lessonId,
        startTime: lesson.isOralOrSong ? 0 : pi * 4,
        endTime: lesson.isOralOrSong ? 0 : (pi + 1) * 4,
        text: p.text,
        translation: p.en,
        translationFr: p.fr,
        order: pi,
      })),
    };
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const STUB_COURSE_TYPES = COURSE_DEFS.map((d) => ({
  type: d.type,
  abbrev: d.abbrev,
  titleEn: d.titleEn,
  order: d.order,
}));

export function stubForLanguage(lang: { id: string; nativeName: string }) {
  return {
    courses: buildCourses(lang.id, lang.nativeName),
    lessons: COURSE_DEFS.flatMap((def) => buildLessons(lang.id, def)),
  };
}

export function stubForCourse(lang: { id: string; nativeName: string }, courseType: string) {
  const def = COURSE_DEFS.find((d) => d.type === courseType);
  if (!def) return null;
  const [course] = buildCourses(lang.id, lang.nativeName).filter((c) => c.courseType === courseType);
  return { course, lessons: buildLessons(lang.id, def) };
}
