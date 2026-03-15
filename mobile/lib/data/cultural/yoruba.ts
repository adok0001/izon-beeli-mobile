import type { CulturalContent } from "@/types";

export const YORUBA_CULTURAL: CulturalContent[] = [
  {
    id: "cult-yo-1",
    languageId: "yoruba",
    category: "creation_myths",
    title: "Orishas: Yoruba Deities",
    description:
      "The Orishas are divine beings in Yoruba cosmology, each governing aspects of nature and human experience. Olodumare is the supreme creator who delegated earthly affairs to the Orishas. Obatala, the sculptor deity, molds human bodies from clay. Ogun rules iron, war, and technology. Yemoja is the mother of waters and protector of children. Shango commands thunder and lightning with fierce justice. Each Orisha has specific colors, foods, drum rhythms, and praise songs that devotees use in worship.",
    imageEmoji: "\u26A1",
    keyTerms: [
      { word: "Orisha", english: "deity / divine spirit" },
      { word: "Olodumare", english: "supreme God" },
      { word: "Obatala", english: "creator of human bodies" },
      { word: "Ogun", english: "god of iron and war" },
      { word: "Yemoja", english: "goddess of water and fertility" },
      { word: "Shango", english: "god of thunder" },
    ],
  },
  {
    id: "cult-yo-2",
    languageId: "yoruba",
    category: "naming_ceremonies",
    title: "Isomoloruko: Yoruba Naming Ceremony",
    description:
      "The Isomoloruko (naming ceremony) takes place on the seventh day after birth for girls and the ninth day for boys. Elders taste symbolic items and pray over the child: honey (oyin) for sweetness in life, kola nut (obi) for good fortune, palm oil (epo) for a smooth path, water (omi) for purity, and salt (iyo) for wisdom. The child receives multiple names including an oruko (birth-circumstance name), an amutorunwa (destiny name), and an abiso (names given by family and friends).",
    imageEmoji: "\uD83D\uDC76",
    keyTerms: [
      { word: "isomoloruko", english: "naming ceremony" },
      { word: "oruko", english: "name" },
      { word: "oyin", english: "honey" },
      { word: "obi", english: "kola nut" },
      { word: "omi", english: "water" },
      { word: "iyo", english: "salt" },
    ],
  },
  {
    id: "cult-yo-3",
    languageId: "yoruba",
    category: "festivals",
    title: "Ifa: Divination System",
    description:
      "Ifa is an ancient Yoruba divination system recognized by UNESCO as an Intangible Cultural Heritage of Humanity. The Babalawo (father of secrets) uses a set of sixteen palm nuts (ikin) or a divination chain (opele) to consult Orunmila, the Orisha of wisdom and destiny. Each cast produces one of 256 Odu (verses), each containing stories, proverbs, songs, and prescriptions. Ifa serves as an encyclopedia of Yoruba knowledge, preserving history, philosophy, medicine, and ethical teachings passed down orally for centuries.",
    imageEmoji: "\uD83D\uDD2E",
    keyTerms: [
      { word: "Ifa", english: "divination system" },
      { word: "Babalawo", english: "divination priest" },
      { word: "Odu", english: "divination verse" },
      { word: "opele", english: "divination chain" },
      { word: "ikin", english: "sacred palm nuts" },
      { word: "Orunmila", english: "deity of wisdom" },
    ],
  },
];
