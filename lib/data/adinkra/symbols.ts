export interface AdinkraSymbol {
  id: string;
  name: string;
  akanName: string;
  meaning: string;
  proverb: string;
  svgPath: string;
  svgViewBox: string;
  category:
    | "leadership"
    | "wisdom"
    | "perseverance"
    | "unity"
    | "spirituality"
    | "love";
}

export const ADINKRA_SYMBOLS: AdinkraSymbol[] = [
  {
    id: "gye-nyame",
    name: "Gye Nyame",
    akanName: "Gye Nyame",
    meaning: "Except God",
    proverb:
      "No one lives who saw the beginning of all things, and no one will live to see the end, except God.",
    svgPath:
      "M15 50 Q25 20 50 25 Q75 30 80 50 Q85 70 65 75 Q45 80 40 65 Q35 50 50 45 Q65 40 70 55 Q75 70 55 70 Q35 70 45 55",
    svgViewBox: "0 0 100 100",
    category: "spirituality",
  },
  {
    id: "sankofa",
    name: "Sankofa",
    akanName: "Sankofa",
    meaning: "Go back and get it",
    proverb:
      "It is not wrong to go back for that which you have forgotten.",
    svgPath:
      "M60 15 Q80 15 80 35 Q80 50 65 50 L65 70 Q65 85 50 85 Q35 85 35 70 L35 50 Q20 50 20 35 Q20 15 40 15 Z M45 35 A8 8 0 1 0 55 35 A8 8 0 1 0 45 35",
    svgViewBox: "0 0 100 100",
    category: "wisdom",
  },
  {
    id: "adinkrahene",
    name: "Adinkrahene",
    akanName: "Adinkrahene",
    meaning: "Chief of Adinkra symbols",
    proverb:
      "Greatness, charisma, and leadership come from within.",
    svgPath:
      "M50 10 A40 40 0 1 0 50 90 A40 40 0 1 0 50 10 M50 22 A28 28 0 1 0 50 78 A28 28 0 1 0 50 22 M50 34 A16 16 0 1 0 50 66 A16 16 0 1 0 50 34",
    svgViewBox: "0 0 100 100",
    category: "leadership",
  },
  {
    id: "dwennimmen",
    name: "Dwennimmen",
    akanName: "Dwennimmen",
    meaning: "Ram's horns",
    proverb:
      "It is the heart and not the horns that leads a ram to bully.",
    svgPath:
      "M50 50 Q30 50 20 35 Q10 20 25 15 Q40 10 45 30 M50 50 Q70 50 80 35 Q90 20 75 15 Q60 10 55 30 M50 50 Q30 50 20 65 Q10 80 25 85 Q40 90 45 70 M50 50 Q70 50 80 65 Q90 80 75 85 Q60 90 55 70",
    svgViewBox: "0 0 100 100",
    category: "perseverance",
  },
  {
    id: "aya",
    name: "Aya",
    akanName: "Aya",
    meaning: "Fern",
    proverb:
      "I am not afraid of difficulties; I have endured many.",
    svgPath:
      "M50 10 L70 30 L50 50 L30 30 Z M50 30 L70 50 L50 70 L30 50 Z M50 50 L70 70 L50 90 L30 70 Z",
    svgViewBox: "0 0 100 100",
    category: "perseverance",
  },
  {
    id: "akoma",
    name: "Akoma",
    akanName: "Akoma",
    meaning: "The heart",
    proverb:
      "Have patience; patience is the pillar of the heart.",
    svgPath:
      "M50 85 L15 50 Q5 35 15 25 Q25 15 37 25 Q45 32 50 40 Q55 32 63 25 Q75 15 85 25 Q95 35 85 50 Z",
    svgViewBox: "0 0 100 100",
    category: "love",
  },
  {
    id: "nkyinkyim",
    name: "Nkyinkyim",
    akanName: "Nkyinkyim",
    meaning: "Twistings",
    proverb:
      "Life's path is full of twists and turns; initiative and versatility are needed.",
    svgPath:
      "M15 20 L35 20 L35 40 L65 40 L65 20 L85 20 L85 50 L65 50 L65 70 L35 70 L35 50 L15 50 Z",
    svgViewBox: "0 0 100 100",
    category: "perseverance",
  },
  {
    id: "ese-ne-tekrema",
    name: "Ese Ne Tekrema",
    akanName: "Ese Ne Tekrema",
    meaning: "The teeth and the tongue",
    proverb:
      "The teeth and the tongue play interdependent roles; they may come into conflict but work together.",
    svgPath:
      "M50 15 Q80 15 80 50 Q80 85 50 85 Q20 85 20 50 Q20 15 50 15 Z M25 50 L75 50",
    svgViewBox: "0 0 100 100",
    category: "unity",
  },
  {
    id: "funtunfunefu",
    name: "Funtunfunefu",
    akanName: "Funtunfunefu Denkyemfunefu",
    meaning: "Siamese crocodiles",
    proverb:
      "They share one stomach, yet they fight over food; a symbol of democracy and unity in diversity.",
    svgPath:
      "M20 35 Q10 35 10 45 Q10 55 20 55 L45 55 L45 35 Z M80 35 Q90 35 90 45 Q90 55 80 55 L55 55 L55 35 Z M45 40 L55 40 M45 50 L55 50 M15 42 A2 2 0 1 0 19 42 M81 42 A2 2 0 1 0 85 42",
    svgViewBox: "0 0 100 100",
    category: "unity",
  },
  {
    id: "nsoromma",
    name: "Nsoromma",
    akanName: "Nsoromma",
    meaning: "Child of the heavens (star)",
    proverb:
      "A child of the Supreme Being; I do not depend on myself; my illumination is only a reflection of God.",
    svgPath:
      "M50 10 L58 38 L88 38 L64 56 L72 84 L50 68 L28 84 L36 56 L12 38 L42 38 Z",
    svgViewBox: "0 0 100 100",
    category: "spirituality",
  },
  {
    id: "nyame-dua",
    name: "Nyame Dua",
    akanName: "Nyame Dua",
    meaning: "Tree of God",
    proverb:
      "The altar of God; a place of worship and spiritual strength.",
    svgPath:
      "M42 10 L42 42 L10 42 L10 58 L42 58 L42 90 L58 90 L58 58 L90 58 L90 42 L58 42 L58 10 Z",
    svgViewBox: "0 0 100 100",
    category: "spirituality",
  },
  {
    id: "wawa-aba",
    name: "Wawa Aba",
    akanName: "Wawa Aba",
    meaning: "Seed of the wawa tree",
    proverb:
      "The seed of the wawa tree is hard, but it softens with time; a symbol of hardiness and perseverance.",
    svgPath:
      "M50 10 Q70 25 70 50 Q70 75 50 90 Q30 75 30 50 Q30 25 50 10 Z M50 25 Q60 35 60 50 Q60 65 50 75 Q40 65 40 50 Q40 35 50 25 Z",
    svgViewBox: "0 0 100 100",
    category: "perseverance",
  },
];
