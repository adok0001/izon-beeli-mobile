/**
 * stub.ts — Template data generator for every unlaunched language.
 *
 * This is a developer artifact.  It seeds placeholder courses and lessons
 * for languages that do not yet have hand-crafted content so that educators
 * can immediately start filling in native-language phrases through the web
 * educator portal at /educator/lessons.
 *
 * HOW EDUCATORS FILL IN CONTENT
 * ──────────────────────────────
 * Every transcript segment has:
 *   text        — bracketed placeholder: "[Good morning!]"  ← educator fills this
 *   translation — the English reference phrase              ← already correct
 *
 * Educators log in to /educator, click a lesson, and replace each bracketed
 * placeholder with the real native-language phrase.  No files required.
 *
 * WHEN A LANGUAGE IS FULLY CURATED
 * ─────────────────────────────────
 * 1. Add the language to LAUNCHED_IDS in this file.
 * 2. Create a hand-crafted  lib/data/lessons/{lang-id}.ts  file.
 * 3. Import it in  lib/data/lessons/index.ts  alongside the other languages.
 * 4. Remove the language from LAUNCHED_IDS here — ACTIVE_LANGUAGES in
 *    lib/data/languages.ts already includes every language automatically.
 * The stub entry is then automatically removed (the language is no longer
 * generated here because it's in LAUNCHED_IDS).
 */

import type { CourseType } from "../../../types/index";
import { LANGUAGES } from "../languages";
import type { LessonData } from "./types";

// ─── Already-launched languages (excluded from stub generation) ───────────
export const LAUNCHED_IDS = new Set([
  "izon", "yoruba", "igbo", "hausa", "swahili", "amharic",
  "akan", "wolof", "arabic-egyptian", "somali", "bambara",
  "tamazight", "kinyarwanda", "ewe",
]);

// ─── Internal types ────────────────────────────────────────────────────────

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

// courseType, title suffix, description, level, order, lessons
type CourseDef = {
  type: CourseType;
  abbrev: string;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  level: "beginner" | "intermediate" | "advanced";
  order: number;
  lessons: LessonDef[];
};

// ─── Template content ──────────────────────────────────────────────────────
// Each phrase has:
//   text  — bracketed English placeholder (educator replaces with native language)
//   en    — English translation (already correct reference)
//   fr    — French translation (already correct reference)

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

// ─── Course definitions ────────────────────────────────────────────────────

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
];

// ─── Generators ────────────────────────────────────────────────────────────

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

function buildLessons(languageId: string, def: CourseDef): LessonData[] {
  const courseId = `course-${languageId}-${def.abbrev}`;
  const isSong = def.type === "songs";

  return def.lessons.map((lesson, li) => {
    const n = li + 1;
    return {
      id: `${languageId}-${def.abbrev}-${n}`,
      courseId,
      type: isSong ? ("song" as const) : ("lesson" as const),
      title: lesson.title,
      titleFr: lesson.titleFr,
      description: lesson.description,
      descriptionFr: lesson.descriptionFr,
      audioUrl: null,
      duration: null,
      order: n,
      ...(isSong ? { artist: "Traditional", genre: li === 0 ? "lullaby" : "praise" } : {}),
      transcript: lesson.phrases.map((p, pi) => ({
        id: `${languageId}-${def.abbrev}-${n}-${pi + 1}`,
        startTime: lesson.isOralOrSong ? 0 : pi * 4,
        endTime: lesson.isOralOrSong ? 0 : (pi + 1) * 4,
        text: p.text,
        translation: p.en,
        translationFr: p.fr,
      })),
    };
  });
}

// ─── Exports ───────────────────────────────────────────────────────────────

const stubLanguages = LANGUAGES.filter((l) => !LAUNCHED_IDS.has(l.id));

/** All stub CourseEntry objects — spread into COURSES in lib/data/courses.ts */
export const STUB_COURSES = stubLanguages.flatMap((lang) =>
  buildCourses(lang.id, lang.nativeName),
);

/** All stub LessonData — spread into ALL_LESSONS in lib/data/lessons/index.ts */
export const STUB_LESSONS: LessonData[] = stubLanguages.flatMap((lang) =>
  COURSE_DEFS.flatMap((def) => buildLessons(lang.id, def)),
);
