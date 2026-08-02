/**
 * Server-side lesson stub generator.
 * Mirrors the template data from mobile/lib/data/lessons/stub.ts but lives
 * inside server/src so it can be compiled and imported from route handlers.
 *
 * When the template content changes, keep both files in sync.
 */

import type { TranslationMap } from "./translations.js";

// The template literals below stay in an `x` / `xFr` authoring shape — these are
// placeholder stubs an educator overwrites in Studio. The builders serialize
// them into `<field>Translations` maps, which is what the DB and API speak.

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

const MV_ARRIVAL: LessonDef[] = [
  {
    title: "Greetings & Welcome",
    titleFr: "Salutations et Accueil",
    description: "The reciprocal greeting a stranger receives at the edge of the community — and how to answer it.",
    descriptionFr: "La salutation réciproque qu'un étranger reçoit aux abords de la communauté — et comment y répondre.",
    duration: 4,
    phrases: [
      { text: "[Welcome! You have come.]",           en: "Welcome! You have come.",           fr: "Bienvenue ! Te voilà arrivé." },
      { text: "[I have come. Good morning.]",        en: "I have come. Good morning.",        fr: "Me voilà. Bonjour." },
      { text: "[Good afternoon.]",                   en: "Good afternoon.",                   fr: "Bon après-midi." },
      { text: "[Good evening.]",                     en: "Good evening.",                     fr: "Bonsoir." },
      { text: "[How are you?]",                      en: "How are you?",                      fr: "Comment allez-vous ?" },
      { text: "[I am well.]",                        en: "I am well.",                        fr: "Je vais bien." },
      { text: "[Thank you.]",                        en: "Thank you.",                        fr: "Merci." },
      { text: "[Goodbye — until we meet again.]",    en: "Goodbye — until we meet again.",    fr: "Au revoir — à la prochaine fois." },
    ],
  },
  {
    title: "Names & Where You Are From",
    titleFr: "Noms et Origines",
    description: "Give your name, ask for someone else's, and say where you have travelled from.",
    descriptionFr: "Donnez votre nom, demandez celui d'autrui et dites d'où vous venez.",
    duration: 5,
    phrases: [
      { text: "[What is your name?]",                en: "What is your name?",                fr: "Comment vous appelez-vous ?" },
      { text: "[My name is …]",                      en: "My name is …",                      fr: "Je m'appelle …" },
      { text: "[Where are you from?]",               en: "Where are you from?",               fr: "D'où venez-vous ?" },
      { text: "[I am from far away.]",               en: "I am from far away.",               fr: "Je viens de loin." },
      { text: "[I am from [village].]",              en: "I am from [village].",              fr: "Je viens de [village]." },
      { text: "[Who is this?]",                      en: "Who is this?",                      fr: "Qui est-ce ?" },
      { text: "[This is my friend.]",                en: "This is my friend.",                fr: "C'est mon ami." },
      { text: "[I am pleased to meet you.]",         en: "I am pleased to meet you.",         fr: "Je suis ravi de vous rencontrer." },
    ],
  },
  {
    title: "Entering the Compound",
    titleFr: "Entrer dans la Concession",
    description: "The hospitality exchange — being invited in, offered a seat, and given water after a journey.",
    descriptionFr: "L'échange d'hospitalité — être invité à entrer, se voir offrir un siège et de l'eau après le voyage.",
    duration: 5,
    phrases: [
      { text: "[Come in.]",                          en: "Come in.",                          fr: "Entrez." },
      { text: "[Sit down, please.]",                 en: "Sit down, please.",                 fr: "Asseyez-vous, je vous en prie." },
      { text: "[Are you tired?]",                    en: "Are you tired?",                    fr: "Êtes-vous fatigué ?" },
      { text: "[Yes, I am tired.]",                  en: "Yes, I am tired.",                  fr: "Oui, je suis fatigué." },
      { text: "[Drink some water.]",                 en: "Drink some water.",                 fr: "Buvez un peu d'eau." },
      { text: "[This is my house.]",                 en: "This is my house.",                 fr: "Voici ma maison." },
      { text: "[You are welcome here.]",             en: "You are welcome here.",             fr: "Vous êtes le bienvenu ici." },
      { text: "[Thank you very much.]",              en: "Thank you very much.",              fr: "Merci beaucoup." },
    ],
  },
];

const MV_HOUSEHOLD: LessonDef[] = [
  {
    title: "The Family",
    titleFr: "La Famille",
    description: "The people of the compound — parents, children, siblings, and the elders who live among them.",
    descriptionFr: "Les habitants de la concession — parents, enfants, frères et sœurs, et les anciens qui vivent parmi eux.",
    duration: 5,
    phrases: [
      { text: "[This is my mother.]",                en: "This is my mother.",                fr: "Voici ma mère." },
      { text: "[This is my father.]",                en: "This is my father.",                fr: "Voici mon père." },
      { text: "[This is my child.]",                 en: "This is my child.",                 fr: "Voici mon enfant." },
      { text: "[My brother / my sister]",            en: "My brother / my sister",            fr: "Mon frère / ma sœur" },
      { text: "[Grandmother / grandfather]",         en: "Grandmother / grandfather",         fr: "Grand-mère / grand-père" },
      { text: "[How many children do you have?]",    en: "How many children do you have?",    fr: "Combien d'enfants avez-vous ?" },
      { text: "[I have three children.]",            en: "I have three children.",            fr: "J'ai trois enfants." },
      { text: "[We live here together.]",            en: "We live here together.",            fr: "Nous vivons ici ensemble." },
    ],
  },
  {
    title: "Food & the Hearth",
    titleFr: "La Nourriture et le Foyer",
    description: "Eating with the household — hunger, the cooking fire, and the words said over a shared meal.",
    descriptionFr: "Manger avec la maisonnée — la faim, le feu de cuisson et les mots prononcés autour d'un repas partagé.",
    duration: 5,
    phrases: [
      { text: "[Are you hungry?]",                   en: "Are you hungry?",                   fr: "Avez-vous faim ?" },
      { text: "[Yes, I am hungry.]",                 en: "Yes, I am hungry.",                 fr: "Oui, j'ai faim." },
      { text: "[There is food.]",                    en: "There is food.",                    fr: "Il y a à manger." },
      { text: "[There is no meat today.]",           en: "There is no meat today.",           fr: "Il n'y a pas de viande aujourd'hui." },
      { text: "[The food is good.]",                 en: "The food is good.",                 fr: "La nourriture est bonne." },
      { text: "[Eat a little more.]",                en: "Eat a little more.",                fr: "Reprenez-en un peu." },
      { text: "[I have eaten well.]",                en: "I have eaten well.",                fr: "J'ai bien mangé." },
      { text: "[Water, please.]",                    en: "Water, please.",                    fr: "De l'eau, s'il vous plaît." },
    ],
  },
  {
    title: "This Is Mine",
    titleFr: "Ceci Est à Moi",
    description: "Possession and belonging — whose things are whose, and how to ask.",
    descriptionFr: "La possession et l'appartenance — à qui sont les choses, et comment le demander.",
    duration: 4,
    phrases: [
      { text: "[Whose is this?]",                    en: "Whose is this?",                    fr: "À qui est ceci ?" },
      { text: "[It is mine.]",                       en: "It is mine.",                       fr: "C'est à moi." },
      { text: "[It is yours.]",                      en: "It is yours.",                      fr: "C'est à vous." },
      { text: "[It is his / it is hers.]",           en: "It is his / it is hers.",           fr: "C'est à lui / c'est à elle." },
      { text: "[This is my bag.]",                   en: "This is my bag.",                   fr: "Voici mon sac." },
      { text: "[That is our house.]",                en: "That is our house.",                fr: "Voilà notre maison." },
      { text: "[Is this your cloth?]",               en: "Is this your cloth?",               fr: "Est-ce votre pagne ?" },
      { text: "[No, it is not mine.]",               en: "No, it is not mine.",               fr: "Non, ce n'est pas à moi." },
    ],
  },
];

const MV_VILLAGE: LessonDef[] = [
  {
    title: "Around the Village",
    titleFr: "Autour du Village",
    description: "The places beyond the compound — the path, the water, the meeting ground — and how to ask the way.",
    descriptionFr: "Les lieux au-delà de la concession — le chemin, l'eau, la place de rassemblement — et comment demander son chemin.",
    duration: 5,
    phrases: [
      { text: "[Where is the market?]",              en: "Where is the market?",              fr: "Où est le marché ?" },
      { text: "[It is over there.]",                 en: "It is over there.",                 fr: "C'est par là." },
      { text: "[Is it far?]",                        en: "Is it far?",                        fr: "Est-ce loin ?" },
      { text: "[It is not far.]",                    en: "It is not far.",                    fr: "Ce n'est pas loin." },
      { text: "[Where is the water?]",               en: "Where is the water?",               fr: "Où est l'eau ?" },
      { text: "[Behind the houses.]",                en: "Behind the houses.",                fr: "Derrière les maisons." },
      { text: "[Let us go together.]",               en: "Let us go together.",               fr: "Allons-y ensemble." },
      { text: "[We will go tomorrow.]",              en: "We will go tomorrow.",              fr: "Nous irons demain." },
    ],
  },
  {
    title: "At the Market",
    titleFr: "Au Marché",
    description: "Buying and bargaining — asking a price, counting money, and settling on a number.",
    descriptionFr: "Acheter et marchander — demander un prix, compter l'argent et se mettre d'accord sur un montant.",
    duration: 6,
    phrases: [
      { text: "[How much is this?]",                 en: "How much is this?",                 fr: "Combien coûte ceci ?" },
      { text: "[It is [amount].]",                   en: "It is [amount].",                   fr: "Cela fait [montant]." },
      { text: "[That is too much.]",                 en: "That is too much.",                 fr: "C'est trop cher." },
      { text: "[Reduce it a little.]",               en: "Reduce it a little.",               fr: "Baissez un peu le prix." },
      { text: "[I will take two.]",                  en: "I will take two.",                  fr: "J'en prendrai deux." },
      { text: "[Do you have fish?]",                 en: "Do you have fish?",                 fr: "Avez-vous du poisson ?" },
      { text: "[I am only looking.]",                en: "I am only looking.",                fr: "Je regarde seulement." },
      { text: "[Here is your money.]",               en: "Here is your money.",               fr: "Voici votre argent." },
    ],
  },
  {
    title: "What People Do",
    titleFr: "Les Métiers",
    description: "The work of the community — who fishes, who farms, who trades, who teaches.",
    descriptionFr: "Le travail de la communauté — qui pêche, qui cultive, qui commerce, qui enseigne.",
    duration: 5,
    phrases: [
      { text: "[What work do you do?]",              en: "What work do you do?",              fr: "Quel travail faites-vous ?" },
      { text: "[I am a trader.]",                    en: "I am a trader.",                    fr: "Je suis commerçant." },
      { text: "[She is a teacher.]",                 en: "She is a teacher.",                 fr: "Elle est enseignante." },
      { text: "[He is a fisherman.]",                en: "He is a fisherman.",                fr: "Il est pêcheur." },
      { text: "[They are farmers.]",                 en: "They are farmers.",                 fr: "Ils sont cultivateurs." },
      { text: "[Where do you work?]",                en: "Where do you work?",                fr: "Où travaillez-vous ?" },
      { text: "[I work at the market.]",             en: "I work at the market.",             fr: "Je travaille au marché." },
      { text: "[It is hard work.]",                  en: "It is hard work.",                  fr: "C'est un travail pénible." },
    ],
  },
];

const MV_GROWING_UP: LessonDef[] = [
  {
    title: "At the Water",
    titleFr: "Au Bord de l'Eau",
    description: "Going out with the children to fish or fetch water — the first real work a newcomer is given.",
    descriptionFr: "Sortir avec les enfants pour pêcher ou puiser de l'eau — le premier vrai travail confié au nouveau venu.",
    duration: 5,
    phrases: [
      { text: "[Come with us.]",                     en: "Come with us.",                     fr: "Viens avec nous." },
      { text: "[Hold it like this.]",                en: "Hold it like this.",                fr: "Tiens-le comme ceci." },
      { text: "[Not like that.]",                    en: "Not like that.",                    fr: "Pas comme cela." },
      { text: "[It is difficult.]",                  en: "It is difficult.",                  fr: "C'est difficile." },
      { text: "[It was difficult for me too.]",      en: "It was difficult for me too.",      fr: "C'était difficile pour moi aussi." },
      { text: "[Try again.]",                        en: "Try again.",                        fr: "Essaie encore." },
      { text: "[We caught three fish.]",             en: "We caught three fish.",             fr: "Nous avons pris trois poissons." },
      { text: "[Now it is easy.]",                   en: "Now it is easy.",                   fr: "Maintenant c'est facile." },
    ],
  },
  {
    title: "Yesterday & Today",
    titleFr: "Hier et Aujourd'hui",
    description: "Telling what happened — yesterday, this morning, a long time ago.",
    descriptionFr: "Raconter ce qui s'est passé — hier, ce matin, il y a longtemps.",
    duration: 5,
    phrases: [
      { text: "[Yesterday we went to the water.]",   en: "Yesterday we went to the water.",   fr: "Hier, nous sommes allés à la rivière." },
      { text: "[This morning I woke early.]",        en: "This morning I woke early.",        fr: "Ce matin, je me suis levé tôt." },
      { text: "[What did you do?]",                  en: "What did you do?",                  fr: "Qu'as-tu fait ?" },
      { text: "[I worked all day.]",                 en: "I worked all day.",                 fr: "J'ai travaillé toute la journée." },
      { text: "[Then we ate together.]",             en: "Then we ate together.",             fr: "Ensuite, nous avons mangé ensemble." },
      { text: "[After that, we slept.]",             en: "After that, we slept.",             fr: "Après cela, nous avons dormi." },
      { text: "[It was a long time ago.]",           en: "It was a long time ago.",           fr: "C'était il y a longtemps." },
      { text: "[I did not go.]",                     en: "I did not go.",                     fr: "Je n'y suis pas allé." },
    ],
  },
  {
    title: "The First Proverb",
    titleFr: "Le Premier Proverbe",
    description: "A saying heard from an elder, and the question every learner asks: what does it mean?",
    descriptionFr: "Un dicton entendu d'un ancien, et la question que pose tout apprenant : qu'est-ce que cela veut dire ?",
    duration: 6,
    isOralOrSong: true,
    phrases: [
      { text: "[[A real proverb from this community — must be supplied by a speaker, with attribution]]", en: "A proverb the elders say.", fr: "Un proverbe que disent les anciens." },
      { text: "[What does it mean?]",                en: "What does it mean?",                fr: "Qu'est-ce que cela signifie ?" },
      { text: "[It means: the one who waits, eats.]", en: "It means: the one who waits, eats.", fr: "Cela signifie : qui sait attendre finit par manger." },
      { text: "[Who taught you that?]",              en: "Who taught you that?",              fr: "Qui t'a appris cela ?" },
      { text: "[My grandmother taught me.]",         en: "My grandmother taught me.",         fr: "C'est ma grand-mère qui me l'a appris." },
      { text: "[Say it again, slowly.]",             en: "Say it again, slowly.",             fr: "Répétez-le, lentement." },
      { text: "[[A second proverb — supplied by a speaker]]", en: "A second saying.", fr: "Un deuxième dicton." },
      { text: "[Now I understand.]",                 en: "Now I understand.",                 fr: "Maintenant je comprends." },
    ],
  },
];

const MV_THRESHOLD: LessonDef[] = [
  {
    title: "The Summons",
    titleFr: "La Convocation",
    description: "Being called to a ceremony — the formal invitation and the correct way to accept it.",
    descriptionFr: "Être convoqué à une cérémonie — l'invitation formelle et la manière correcte de l'accepter.",
    duration: 5,
    phrases: [
      { text: "[The elder is calling you.]",         en: "The elder is calling you.",         fr: "L'ancien vous appelle." },
      { text: "[I am coming.]",                      en: "I am coming.",                      fr: "J'arrive." },
      { text: "[Today the community gathers.]",      en: "Today the community gathers.",      fr: "Aujourd'hui, la communauté se rassemble." },
      { text: "[Why have you called me?]",           en: "Why have you called me?",           fr: "Pourquoi m'avez-vous appelé ?" },
      { text: "[Come and stand here.]",              en: "Come and stand here.",              fr: "Venez vous tenir ici." },
      { text: "[I am listening.]",                   en: "I am listening.",                   fr: "Je vous écoute." },
      { text: "[It is an honour.]",                  en: "It is an honour.",                  fr: "C'est un honneur." },
      { text: "[I will do as you say.]",             en: "I will do as you say.",             fr: "Je ferai comme vous dites." },
    ],
  },
  {
    title: "You Must, You May",
    titleFr: "Il Faut, Il Est Permis",
    description: "Obligation and permission — what is required, what is allowed, and what is forbidden.",
    descriptionFr: "L'obligation et la permission — ce qui est exigé, ce qui est permis et ce qui est interdit.",
    duration: 5,
    phrases: [
      { text: "[You must not speak now.]",           en: "You must not speak now.",           fr: "Vous ne devez pas parler maintenant." },
      { text: "[May I watch?]",                      en: "May I watch?",                      fr: "Puis-je regarder ?" },
      { text: "[You may watch.]",                    en: "You may watch.",                    fr: "Vous pouvez regarder." },
      { text: "[You must wait outside.]",            en: "You must wait outside.",            fr: "Vous devez attendre dehors." },
      { text: "[It is not permitted.]",              en: "It is not permitted.",              fr: "Ce n'est pas permis." },
      { text: "[Only the elders may enter.]",        en: "Only the elders may enter.",        fr: "Seuls les anciens peuvent entrer." },
      { text: "[I understand.]",                     en: "I understand.",                     fr: "Je comprends." },
      { text: "[Carry this for me.]",                en: "Carry this for me.",                fr: "Portez ceci pour moi." },
    ],
  },
  {
    title: "Speaking to an Elder",
    titleFr: "S'adresser à un Ancien",
    description: "The respectful register — how address changes when the person before you holds authority.",
    descriptionFr: "Le registre respectueux — comment l'adresse change lorsque la personne devant vous détient l'autorité.",
    duration: 5,
    phrases: [
      { text: "[[The respectful form of address for an elder — supplied by a speaker]]", en: "Greeting an elder respectfully.", fr: "Saluer un ancien avec respect." },
      { text: "[I greet you, father.]",              en: "I greet you, father.",              fr: "Je vous salue, mon père." },
      { text: "[I greet you, mother.]",              en: "I greet you, mother.",              fr: "Je vous salue, ma mère." },
      { text: "[Forgive me.]",                       en: "Forgive me.",                       fr: "Pardonnez-moi." },
      { text: "[May I ask a question?]",             en: "May I ask a question?",             fr: "Puis-je poser une question ?" },
      { text: "[Thank you for your words.]",         en: "Thank you for your words.",         fr: "Merci pour vos paroles." },
      { text: "[I will remember.]",                  en: "I will remember.",                  fr: "Je m'en souviendrai." },
      { text: "[Go well.]",                          en: "Go well.",                          fr: "Allez en paix." },
    ],
  },
];

const MV_WORKING_YEAR: LessonDef[] = [
  {
    title: "The Seasons Turn",
    titleFr: "Le Tour des Saisons",
    description: "The year's cycle — rain and dry, planting and harvest, high water and low.",
    descriptionFr: "Le cycle de l'année — pluie et sécheresse, semailles et récolte, hautes et basses eaux.",
    duration: 5,
    phrases: [
      { text: "[The rains have come.]",              en: "The rains have come.",              fr: "Les pluies sont arrivées." },
      { text: "[The water is rising.]",              en: "The water is rising.",              fr: "L'eau monte." },
      { text: "[It is the dry season now.]",         en: "It is the dry season now.",         fr: "C'est maintenant la saison sèche." },
      { text: "[We plant at this time.]",            en: "We plant at this time.",            fr: "C'est le moment où nous semons." },
      { text: "[The harvest is near.]",              en: "The harvest is near.",              fr: "La récolte approche." },
      { text: "[Last year was better.]",             en: "Last year was better.",             fr: "L'année dernière était meilleure." },
      { text: "[Every year it is the same.]",        en: "Every year it is the same.",        fr: "Chaque année, c'est pareil." },
      { text: "[We must wait.]",                     en: "We must wait.",                     fr: "Il faut attendre." },
    ],
  },
  {
    title: "A Good Year, A Bad Year",
    titleFr: "Bonne Année, Mauvaise Année",
    description: "Conditions and consequences — what happens if the rain is heavy, and what happens if it stops.",
    descriptionFr: "Conditions et conséquences — ce qui arrive si la pluie est forte, et ce qui arrive si elle cesse.",
    duration: 6,
    phrases: [
      { text: "[If the rain is heavy, the fish will be many.]", en: "If the rain is heavy, the fish will be many.", fr: "Si la pluie est abondante, le poisson sera nombreux." },
      { text: "[If it stops early, we will suffer.]", en: "If it stops early, we will suffer.", fr: "Si elle cesse trop tôt, nous en souffrirons." },
      { text: "[The work was good this year.]",      en: "The work was good this year.",      fr: "Le travail a bien marché cette année." },
      { text: "[We sold everything.]",               en: "We sold everything.",               fr: "Nous avons tout vendu." },
      { text: "[There was nothing left.]",           en: "There was nothing left.",           fr: "Il ne restait rien." },
      { text: "[What will we do?]",                  en: "What will we do?",                  fr: "Qu'allons-nous faire ?" },
      { text: "[It was worse two years ago.]",       en: "It was worse two years ago.",       fr: "C'était pire il y a deux ans." },
      { text: "[I am not afraid now.]",              en: "I am not afraid now.",              fr: "Je n'ai plus peur maintenant." },
    ],
  },
  {
    title: "Buying & Selling",
    titleFr: "Acheter et Vendre",
    description: "Trade across the year — what a season's work is worth and what it buys.",
    descriptionFr: "Le commerce au fil de l'année — ce que vaut le travail d'une saison et ce qu'il permet d'acheter.",
    duration: 5,
    phrases: [
      { text: "[We took it to the market.]",         en: "We took it to the market.",         fr: "Nous l'avons apporté au marché." },
      { text: "[The price was good.]",               en: "The price was good.",               fr: "Le prix était bon." },
      { text: "[The price has fallen.]",             en: "The price has fallen.",             fr: "Le prix a baissé." },
      { text: "[We bought cloth.]",                  en: "We bought cloth.",                  fr: "Nous avons acheté du tissu." },
      { text: "[There is no money this month.]",     en: "There is no money this month.",     fr: "Il n'y a pas d'argent ce mois-ci." },
      { text: "[I will pay you later.]",             en: "I will pay you later.",             fr: "Je vous paierai plus tard." },
      { text: "[We share what we have.]",            en: "We share what we have.",            fr: "Nous partageons ce que nous avons." },
      { text: "[It is enough.]",                     en: "It is enough.",                     fr: "C'est suffisant." },
    ],
  },
];

const MV_UNION: LessonDef[] = [
  {
    title: "The Family Comes to Ask",
    titleFr: "La Famille Vient Demander",
    description: "The approach — one family arriving at another's compound with a proposal.",
    descriptionFr: "La démarche — une famille se présentant chez une autre avec une demande.",
    duration: 6,
    phrases: [
      { text: "[We have come to ask for your daughter.]", en: "We have come to ask for your daughter.", fr: "Nous sommes venus demander la main de votre fille." },
      { text: "[You are welcome. Sit.]",             en: "You are welcome. Sit.",             fr: "Soyez les bienvenus. Asseyez-vous." },
      { text: "[We have heard good things of your family.]", en: "We have heard good things of your family.", fr: "Nous avons entendu du bien de votre famille." },
      { text: "[Who is your father?]",               en: "Who is your father?",               fr: "Qui est votre père ?" },
      { text: "[We are of [clan].]",                 en: "We are of [clan].",                 fr: "Nous sommes de [clan]." },
      { text: "[Let us speak slowly about this.]",   en: "Let us speak slowly about this.",   fr: "Parlons-en posément." },
      { text: "[We will answer you tomorrow.]",      en: "We will answer you tomorrow.",      fr: "Nous vous répondrons demain." },
      { text: "[[The customary opening words of a marriage approach — supplied by a speaker]]", en: "The customary opening of the request.", fr: "L'ouverture coutumière de la demande." },
    ],
  },
  {
    title: "Saying It Indirectly",
    titleFr: "Dire les Choses à Mots Couverts",
    description: "Negotiation without naming the thing — the indirect register these conversations require.",
    descriptionFr: "Négocier sans nommer la chose — le registre indirect qu'exigent ces conversations.",
    duration: 6,
    phrases: [
      { text: "[They say the girl is hardworking.]", en: "They say the girl is hardworking.", fr: "On dit que la jeune fille est travailleuse." },
      { text: "[She said she knows your family.]",   en: "She said she knows your family.",   fr: "Elle a dit qu'elle connaît votre famille." },
      { text: "[Perhaps we can find a way.]",        en: "Perhaps we can find a way.",        fr: "Peut-être trouverons-nous un arrangement." },
      { text: "[That is a heavy request.]",          en: "That is a heavy request.",          fr: "C'est une demande considérable." },
      { text: "[We hear you.]",                      en: "We hear you.",                      fr: "Nous vous entendons." },
      { text: "[It is not for me to say.]",          en: "It is not for me to say.",          fr: "Ce n'est pas à moi de le dire." },
      { text: "[Why does nobody say it directly?]",  en: "Why does nobody say it directly?",  fr: "Pourquoi personne ne le dit-il franchement ?" },
      { text: "[Because saying it directly would end it.]", en: "Because saying it directly would end it.", fr: "Parce que le dire franchement y mettrait fin." },
    ],
  },
  {
    title: "The Celebration",
    titleFr: "La Fête",
    description: "The agreement reached, and the feast that follows — congratulation, music, and blessing.",
    descriptionFr: "L'accord conclu et la fête qui suit — félicitations, musique et bénédiction.",
    duration: 5,
    isOralOrSong: true,
    phrases: [
      { text: "[The families have agreed.]",         en: "The families have agreed.",         fr: "Les familles se sont mises d'accord." },
      { text: "[Congratulations!]",                  en: "Congratulations!",                  fr: "Félicitations !" },
      { text: "[We are one family now.]",            en: "We are one family now.",            fr: "Nous ne formons plus qu'une famille." },
      { text: "[Let us eat and be glad.]",           en: "Let us eat and be glad.",           fr: "Mangeons et réjouissons-nous." },
      { text: "[[A song sung at a wedding — supplied by a speaker, with attribution]]", en: "A wedding song.", fr: "Un chant de mariage." },
      { text: "[May you have long life.]",           en: "May you have long life.",           fr: "Longue vie à vous." },
      { text: "[May your house be full.]",           en: "May your house be full.",           fr: "Que votre maison soit prospère." },
      { text: "[Now you have two families.]",        en: "Now you have two families.",        fr: "Vous avez désormais deux familles." },
    ],
  },
];

const MV_ASSEMBLY: LessonDef[] = [
  {
    title: "The Dispute",
    titleFr: "Le Différend",
    description: "A disagreement brought before the community — each side stating its claim.",
    descriptionFr: "Un désaccord porté devant la communauté — chaque partie exposant sa revendication.",
    duration: 6,
    phrases: [
      { text: "[The land is mine.]",                 en: "The land is mine.",                 fr: "Cette terre est à moi." },
      { text: "[My father farmed it.]",              en: "My father farmed it.",              fr: "Mon père la cultivait." },
      { text: "[That is not true.]",                 en: "That is not true.",                 fr: "Ce n'est pas vrai." },
      { text: "[Let him speak first.]",              en: "Let him speak first.",              fr: "Qu'il parle en premier." },
      { text: "[We have heard this before.]",        en: "We have heard this before.",        fr: "Nous avons déjà entendu cela." },
      { text: "[Both of you, be quiet.]",            en: "Both of you, be quiet.",            fr: "Taisez-vous tous les deux." },
      { text: "[Bring the one who saw it.]",         en: "Bring the one who saw it.",         fr: "Amenez celui qui a vu." },
      { text: "[This matter is old.]",               en: "This matter is old.",               fr: "Cette affaire est ancienne." },
    ],
  },
  {
    title: "What I Saw",
    titleFr: "Ce Que J'ai Vu",
    description: "Giving testimony — reporting what happened, and admitting what you do not know.",
    descriptionFr: "Témoigner — rapporter ce qui s'est passé et admettre ce que l'on ignore.",
    duration: 6,
    phrases: [
      { text: "[You were there. What did you see?]", en: "You were there. What did you see?", fr: "Vous y étiez. Qu'avez-vous vu ?" },
      { text: "[I saw them both working.]",          en: "I saw them both working.",          fr: "Je les ai vus travailler tous les deux." },
      { text: "[I do not know who is right.]",       en: "I do not know who is right.",       fr: "Je ne sais pas qui a raison." },
      { text: "[I only know what I saw.]",           en: "I only know what I saw.",           fr: "Je ne sais que ce que j'ai vu." },
      { text: "[He told me afterwards.]",            en: "He told me afterwards.",            fr: "Il me l'a dit après coup." },
      { text: "[Perhaps I am mistaken.]",            en: "Perhaps I am mistaken.",            fr: "Je me trompe peut-être." },
      { text: "[That is an honest answer.]",         en: "That is an honest answer.",         fr: "Voilà une réponse honnête." },
      { text: "[Say it again for everyone.]",        en: "Say it again for everyone.",        fr: "Répétez-le pour tout le monde." },
    ],
  },
  {
    title: "The Judgment",
    titleFr: "Le Jugement",
    description: "How the elders decide, and what a fair outcome sounds like when nobody is satisfied.",
    descriptionFr: "Comment les anciens tranchent, et à quoi ressemble une décision juste quand personne n'est satisfait.",
    duration: 6,
    phrases: [
      { text: "[We have heard both of you.]",        en: "We have heard both of you.",        fr: "Nous vous avons entendus tous les deux." },
      { text: "[The land will be divided.]",         en: "The land will be divided.",         fr: "La terre sera partagée." },
      { text: "[Neither of you will be satisfied.]", en: "Neither of you will be satisfied.", fr: "Aucun de vous ne sera satisfait." },
      { text: "[That is how you know it was fair.]", en: "That is how you know it was fair.", fr: "C'est ainsi qu'on sait que c'était équitable." },
      { text: "[The matter is finished.]",           en: "The matter is finished.",           fr: "L'affaire est close." },
      { text: "[Shake hands.]",                      en: "Shake hands.",                      fr: "Serrez-vous la main." },
      { text: "[We will not speak of it again.]",    en: "We will not speak of it again.",    fr: "Nous n'en reparlerons plus." },
      { text: "[Go in peace.]",                      en: "Go in peace.",                      fr: "Allez en paix." },
    ],
  },
];

const MV_ELDERS_VOICE: LessonDef[] = [
  {
    title: "Asked to Speak",
    titleFr: "Invité à Prendre la Parole",
    description: "Being called on publicly for the first time — the formal opening and the modest refusal that precedes it.",
    descriptionFr: "Être appelé à parler en public pour la première fois — l'ouverture formelle et le refus modeste qui la précède.",
    duration: 6,
    phrases: [
      { text: "[[The formal opening formula for public speech — supplied by a speaker]]", en: "The formal opening of a speech.", fr: "L'ouverture formelle d'un discours." },
      { text: "[The one who came to us will speak.]", en: "The one who came to us will speak.", fr: "Celui qui est venu parmi nous va parler." },
      { text: "[I am not from here.]",               en: "I am not from here.",               fr: "Je ne suis pas d'ici." },
      { text: "[I do not speak well.]",              en: "I do not speak well.",              fr: "Je ne parle pas bien." },
      { text: "[Speak anyway.]",                     en: "Speak anyway.",                     fr: "Parlez tout de même." },
      { text: "[I thank you for listening.]",        en: "I thank you for listening.",        fr: "Je vous remercie de m'écouter." },
      { text: "[When I came, I knew nothing.]",      en: "When I came, I knew nothing.",      fr: "Quand je suis arrivé, je ne savais rien." },
      { text: "[You fed me before you knew my name.]", en: "You fed me before you knew my name.", fr: "Vous m'avez nourri avant même de connaître mon nom." },
    ],
  },
  {
    title: "Deploying a Proverb",
    titleFr: "Placer un Proverbe",
    description: "Using a saying as argument — the moment a proverb lands and the audience answers.",
    descriptionFr: "Utiliser un dicton comme argument — le moment où le proverbe porte et où l'auditoire répond.",
    duration: 6,
    isOralOrSong: true,
    phrases: [
      { text: "[[A proverb about hospitality or belonging — supplied by a speaker, with attribution]]", en: "A proverb about belonging.", fr: "Un proverbe sur l'appartenance." },
      { text: "[[The audience's fixed response — supplied by a speaker]]", en: "The audience answers.", fr: "L'auditoire répond." },
      { text: "[As our elders say …]",               en: "As our elders say …",               fr: "Comme le disent nos anciens …" },
      { text: "[That is why I say this.]",           en: "That is why I say this.",           fr: "Voilà pourquoi je dis ceci." },
      { text: "[Who taught you that?]",              en: "Who taught you that?",              fr: "Qui vous a appris cela ?" },
      { text: "[A child taught me.]",                en: "A child taught me.",                fr: "C'est un enfant qui me l'a appris." },
      { text: "[[A second proverb — supplied by a speaker]]", en: "A second proverb.", fr: "Un deuxième proverbe." },
      { text: "[I have finished.]",                  en: "I have finished.",                  fr: "J'ai terminé." },
    ],
  },
  {
    title: "Praise & Blessing",
    titleFr: "Éloge et Bénédiction",
    description: "The language of praise — honouring a person publicly and wishing them well.",
    descriptionFr: "Le langage de l'éloge — honorer publiquement une personne et lui souhaiter du bien.",
    duration: 6,
    isOralOrSong: true,
    phrases: [
      { text: "[[A praise formula for an elder or host — supplied by a speaker]]", en: "A formula of praise.", fr: "Une formule d'éloge." },
      { text: "[You have done well.]",               en: "You have done well.",               fr: "Vous avez bien fait." },
      { text: "[Your name will be remembered.]",     en: "Your name will be remembered.",     fr: "Votre nom restera dans les mémoires." },
      { text: "[May you live long.]",                en: "May you live long.",                fr: "Puissiez-vous vivre longtemps." },
      { text: "[May your children prosper.]",        en: "May your children prosper.",        fr: "Que vos enfants prospèrent." },
      { text: "[We are grateful.]",                  en: "We are grateful.",                  fr: "Nous vous sommes reconnaissants." },
      { text: "[[The communal response to a blessing — supplied by a speaker]]", en: "The community answers.", fr: "La communauté répond." },
      { text: "[Let it be so.]",                     en: "Let it be so.",                     fr: "Qu'il en soit ainsi." },
    ],
  },
];

const MV_KEEPER: LessonDef[] = [
  {
    title: "Pouring Libation",
    titleFr: "La Libation",
    description: "The words said when calling the ancestors to witness. Heritage content — nothing here is invented.",
    descriptionFr: "Les paroles prononcées pour appeler les ancêtres à témoigner. Contenu patrimonial — rien ici n'est inventé.",
    duration: 7,
    isOralOrSong: true,
    phrases: [
      { text: "[[The libation formula — MUST be supplied by a keeper or ritual authority, never composed]]", en: "The libation is poured.", fr: "La libation est versée." },
      { text: "[[The naming of the ancestors called — supplied by a keeper]]", en: "The ancestors are named.", fr: "Les ancêtres sont nommés." },
      { text: "[[The communal response — supplied by a keeper]]", en: "The community answers.", fr: "La communauté répond." },
      { text: "[We call those who came before us.]", en: "We call those who came before us.", fr: "Nous appelons ceux qui nous ont précédés." },
      { text: "[Hear us.]",                          en: "Hear us.",                          fr: "Écoutez-nous." },
      { text: "[We thank you for what you left us.]", en: "We thank you for what you left us.", fr: "Nous vous remercions de ce que vous nous avez laissé." },
      { text: "[Stand with us today.]",              en: "Stand with us today.",              fr: "Soyez avec nous aujourd'hui." },
      { text: "[Let it be so.]",                     en: "Let it be so.",                     fr: "Qu'il en soit ainsi." },
    ],
  },
  {
    title: "The Ancestors",
    titleFr: "Les Ancêtres",
    description: "Lineage and memory — who came before, and how a community keeps track of itself.",
    descriptionFr: "Lignage et mémoire — qui nous a précédés, et comment une communauté garde la trace d'elle-même.",
    duration: 6,
    phrases: [
      { text: "[Who was your father's father?]",     en: "Who was your father's father?",     fr: "Qui était le père de votre père ?" },
      { text: "[He came from [place].]",             en: "He came from [place].",             fr: "Il venait de [lieu]." },
      { text: "[Our people have always lived here.]", en: "Our people have always lived here.", fr: "Notre peuple a toujours vécu ici." },
      { text: "[That was before I was born.]",       en: "That was before I was born.",       fr: "C'était avant ma naissance." },
      { text: "[The old people remember.]",          en: "The old people remember.",          fr: "Les anciens s'en souviennent." },
      { text: "[[The account of the community's founding — supplied by a keeper]]", en: "How the community began.", fr: "Comment la communauté a commencé." },
      { text: "[We must not forget it.]",            en: "We must not forget it.",            fr: "Nous ne devons pas l'oublier." },
      { text: "[Tell it to the children.]",          en: "Tell it to the children.",          fr: "Racontez-le aux enfants." },
    ],
  },
  {
    title: "Passing It On",
    titleFr: "Transmettre",
    description: "The circle closing — teaching what you were taught, and greeting the next stranger on the path.",
    descriptionFr: "Le cercle se referme — enseigner ce qu'on vous a enseigné et saluer le prochain étranger sur le chemin.",
    duration: 6,
    phrases: [
      { text: "[I will teach you what I know.]",     en: "I will teach you what I know.",     fr: "Je vous enseignerai ce que je sais." },
      { text: "[Listen carefully.]",                 en: "Listen carefully.",                 fr: "Écoutez attentivement." },
      { text: "[This is how it was taught to me.]",  en: "This is how it was taught to me.",  fr: "C'est ainsi qu'on me l'a enseigné." },
      { text: "[Do not let it die with you.]",       en: "Do not let it die with you.",       fr: "Ne le laissez pas mourir avec vous." },
      { text: "[You have been here a long time.]",   en: "You have been here a long time.",   fr: "Vous êtes ici depuis longtemps." },
      { text: "[This is my home now.]",              en: "This is my home now.",              fr: "C'est ma maison désormais." },
      { text: "[Welcome! You have come.]",           en: "Welcome! You have come.",           fr: "Bienvenue ! Te voilà arrivé." },
      { text: "[What is your name?]",                en: "What is your name?",                fr: "Comment vous appelez-vous ?" },
    ],
  },
];

const COURSE_DEFS: CourseDef[] = [
  {
    type: "mv_arrival", abbrev: "mv-arrival", order: 1, level: "beginner",
    titleEn: "Arrival", titleFr: "L'Arrivée",
    descriptionEn: "You arrive a stranger and are welcomed — greetings, names, and the hospitality that opens a door.",
    descriptionFr: "Vous arrivez en étranger et êtes accueilli — salutations, noms et l'hospitalité qui ouvre une porte.",
    lessons: MV_ARRIVAL,
  },
  {
    type: "mv_household", abbrev: "mv-household", order: 2, level: "beginner",
    titleEn: "The Household", titleFr: "La Maisonnée",
    descriptionEn: "Settling into the compound — family, food, the daily rhythm, and whose things are whose.",
    descriptionFr: "S'installer dans la concession — la famille, la nourriture, le rythme quotidien et à qui appartient quoi.",
    lessons: MV_HOUSEHOLD,
  },
  {
    type: "mv_village", abbrev: "mv-village", order: 3, level: "beginner",
    titleEn: "The Village", titleFr: "Le Village",
    descriptionEn: "Beyond the compound — the market, the paths, the trades, and the people who make up a community.",
    descriptionFr: "Au-delà de la concession — le marché, les chemins, les métiers et les gens qui composent une communauté.",
    lessons: MV_VILLAGE,
  },
  {
    type: "mv_growing_up", abbrev: "mv-growing-up", order: 4, level: "beginner",
    titleEn: "Growing Up", titleFr: "Grandir",
    descriptionEn: "Childhood around you — the water, learning a skill badly, and the first proverb you hear.",
    descriptionFr: "L'enfance autour de vous — l'eau, l'apprentissage maladroit d'un savoir-faire et le premier proverbe entendu.",
    lessons: MV_GROWING_UP,
  },
  {
    type: "mv_threshold", abbrev: "mv-threshold", order: 5, level: "intermediate",
    titleEn: "The Threshold", titleFr: "Le Seuil",
    descriptionEn: "A coming-of-age in the community — obligation, permission, and how one speaks to an elder.",
    descriptionFr: "Un passage à l'âge adulte dans la communauté — l'obligation, la permission et la manière de s'adresser à un ancien.",
    lessons: MV_THRESHOLD,
  },
  {
    type: "mv_working_year", abbrev: "mv-working-year", order: 6, level: "intermediate",
    titleEn: "The Working Year", titleFr: "L'Année de Travail",
    descriptionEn: "Livelihood across the seasons — what a good year brings, what a bad one takes, and what is sold.",
    descriptionFr: "Les moyens de subsistance au fil des saisons — ce qu'apporte une bonne année, ce qu'emporte une mauvaise, et ce qui se vend.",
    lessons: MV_WORKING_YEAR,
  },
  {
    type: "mv_union", abbrev: "mv-union", order: 7, level: "intermediate",
    titleEn: "The Union", titleFr: "L'Union",
    descriptionEn: "Two families join — the approach, the indirect language of negotiation, and the celebration.",
    descriptionFr: "Deux familles s'unissent — la démarche, le langage indirect de la négociation et la fête.",
    lessons: MV_UNION,
  },
  {
    type: "mv_assembly", abbrev: "mv-assembly", order: 8, level: "intermediate",
    titleEn: "The Assembly", titleFr: "L'Assemblée",
    descriptionEn: "Community life and governance — a dispute, the testimony it needs, and how elders decide.",
    descriptionFr: "La vie communautaire et la gouvernance — un litige, les témoignages qu'il exige et la décision des anciens.",
    lessons: MV_ASSEMBLY,
  },
  {
    type: "mv_elders_voice", abbrev: "mv-elders-voice", order: 9, level: "advanced",
    titleEn: "The Elder's Voice", titleFr: "La Voix de l'Ancien",
    descriptionEn: "You can speak now — public address, deploying a proverb at the right moment, praise and blessing.",
    descriptionFr: "Vous savez parler maintenant — la prise de parole publique, le proverbe placé au bon moment, l'éloge et la bénédiction.",
    lessons: MV_ELDERS_VOICE,
  },
  {
    type: "mv_keeper", abbrev: "mv-keeper", order: 10, level: "advanced",
    titleEn: "The Keeper", titleFr: "Le Gardien",
    descriptionEn: "You pass it on — libation, ancestry, and the moment you welcome the next stranger yourself.",
    descriptionFr: "Vous transmettez — la libation, le lignage et le moment où vous accueillez vous-même le prochain étranger.",
    lessons: MV_KEEPER,
  },
];

// ─── Builders ─────────────────────────────────────────────────────────────────

function buildCourses(languageId: string, nativeName: string) {
  return COURSE_DEFS.map((def) => ({
    id: `course-${languageId}-${def.abbrev}`,
    languageId,
    title: `${nativeName} — ${def.titleEn}`,
    titleTranslations: {
      en: `${nativeName} — ${def.titleEn}`,
      fr: `${nativeName} — ${def.titleFr}`,
    },
    description: def.descriptionEn,
    descriptionTranslations: { en: def.descriptionEn, fr: def.descriptionFr },
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
  translations: TranslationMap;
  order: number;
};

type LessonRow = {
  id: string;
  courseId: string;
  type: string;
  title: string;
  titleTranslations: TranslationMap;
  description: string;
  descriptionTranslations: TranslationMap;
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
      titleTranslations: { en: lesson.title, fr: lesson.titleFr },
      description: lesson.description,
      descriptionTranslations: { en: lesson.description, fr: lesson.descriptionFr },
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
        translations: { en: p.en, fr: p.fr },
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
