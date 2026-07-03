/**
 * Interactive (branching) stories — bundled, curated content.
 *
 * These are choose-your-path narrative experiences surfaced in Discover. They
 * are authored curated content (there is no CMS for the branching graph yet),
 * so they live here as real bundled data rather than as a "mock" inside a hook.
 *
 * A Discover `film` card routes to the interactive-story player ONLY when an
 * entry exists here for its `storyId` (see `hasInteractiveStory`). A film with no
 * entry here falls through to its detail screen instead of a dead route.
 *
 * The three Bou Mie films each carry their own `storyId` and a playable story
 * below (izon-creeks / izon-empty-net / izon-woyengi), so they open the story
 * player like any curated film. Scene text weaves the film's real Izon
 * narration/dialogue with its English meaning; sacred/heritage content is told
 * in descriptive prose only (never a fabricated verbatim rite).
 */
import type { InteractiveStory } from "@/types";

export const INTERACTIVE_STORIES: Record<string, InteractiveStory> = {
  "griot-path": {
    id: "griot-path",
    title: "The Griot's Path",
    description: "Follow an apprentice Griot and learn through his eyes.",
    coverGradient: ["#7C3A1A", "#0D0F1A"],
    coverEmoji: "🥁",
    estimatedMinutes: 8,
    author: "Sahel Stories",
    language: "Izon",
    initialSceneId: "s1",
    scenes: {
      s1: {
        id: "s1",
        type: "narrative",
        gradient: ["#4A2010", "#0D0F1A"],
        backgroundEmoji: "🌅",
        title: "The Village at Dusk",
        text: "The harmattan carries the smell of red earth and wood smoke. In the compound, a single drum speaks — not music, but language. You have come a long way to learn.",
        nextSceneId: "s2",
      },
      s2: {
        id: "s2",
        type: "narrative",
        gradient: ["#2A1A0D", "#0D0F1A"],
        backgroundEmoji: "🥁",
        title: "The Griot Speaks",
        text: "He is older than you expected. His voice is low, deliberate. \"A language lives in the body before it lives in the mouth,\" he says. \"Sit.\"",
        nextSceneId: "s3",
      },
      s3: {
        id: "s3",
        type: "choice",
        gradient: ["#1A2A10", "#0D0F1A"],
        backgroundEmoji: "🤝",
        title: "The First Test",
        text: "He gestures for you to introduce yourself. The compound falls quiet. Every elder is watching. How do you greet him?",
        choices: [
          { id: "c1", text: "Use the formal elder greeting — hands clasped, head bowed", nextSceneId: "s4a" },
          { id: "c2", text: "Extend your hand confidently and state your name", nextSceneId: "s4b" },
        ],
      },
      s4a: {
        id: "s4a",
        type: "narrative",
        gradient: ["#102A1A", "#0D0F1A"],
        backgroundEmoji: "✨",
        title: "Earned Respect",
        text: "A smile breaks across his face — rare, unhurried. The elders nod. He says your name in Izon, giving it a music it never had in English. The lesson has already begun.",
        nextSceneId: "s5",
      },
      s4b: {
        id: "s4b",
        type: "narrative",
        gradient: ["#2A1A10", "#0D0F1A"],
        backgroundEmoji: "📖",
        title: "A Gentle Correction",
        text: "He takes your hand, then gently repositions it — wrists down, fingers together. \"In our language,\" he says, \"the body speaks before the words do. Let me show you again.\"",
        nextSceneId: "s5",
      },
      s5: {
        id: "s5",
        type: "narrative",
        gradient: ["#1A1A2A", "#0D0F1A"],
        backgroundEmoji: "🌙",
        title: "The First Word",
        text: "He teaches you one word before sunset. Just one. \"Ẹni\" — person, human being, the one who belongs. He says it three times. You repeat it until it feels like yours.",
        nextSceneId: "s6",
      },
      s6: {
        id: "s6",
        type: "conclusion",
        gradient: ["#0A0A1A", "#07080F"],
        backgroundEmoji: "⭐",
        title: "What You Carry",
        text: "Language is not vocabulary. It is not grammar. It is a way of seeing. Tonight you learned one word, one gesture, and one truth: the door to a language opens inward.",
      },
    },
  },
  "naming-ceremony": {
    id: "naming-ceremony",
    title: "The Naming",
    description: "A child is named. A community remembers who it is.",
    coverGradient: ["#1A3A2E", "#0D0F1A"],
    coverEmoji: "🪬",
    estimatedMinutes: 6,
    author: "Beeli Originals",
    initialSceneId: "n1",
    scenes: {
      n1: {
        id: "n1",
        type: "narrative",
        gradient: ["#0E2A1A", "#0D0F1A"],
        backgroundEmoji: "🌿",
        title: "Before Dawn",
        text: "The ceremony begins before the sun rises. A child is eight days old today, and has not yet been named. Until named, they exist between worlds.",
        nextSceneId: "n2",
      },
      n2: {
        id: "n2",
        type: "narrative",
        gradient: ["#1A2E1A", "#0D0F1A"],
        backgroundEmoji: "🪬",
        title: "The Weight of Names",
        text: "In Izon tradition, a name is not decoration — it is declaration. It tells the child who they are, who came before them, and what the community asks of them.",
        nextSceneId: "n3",
      },
      n3: {
        id: "n3",
        type: "choice",
        gradient: ["#2A1E0A", "#0D0F1A"],
        backgroundEmoji: "🌞",
        title: "The Elder Asks",
        text: "The eldest woman turns to you. She is holding the child. \"Stranger,\" she says in Izon, \"what do you know of names?\" You must answer honestly.",
        choices: [
          { id: "nc1", text: "\"I know my name was chosen before I was born\"", nextSceneId: "n4a" },
          { id: "nc2", text: "\"I know only my name — I have not thought beyond it\"", nextSceneId: "n4b" },
        ],
      },
      n4a: {
        id: "n4a",
        type: "narrative",
        gradient: ["#1A2A10", "#0D0F1A"],
        backgroundEmoji: "🌱",
        title: "A Name Before You",
        text: "She nods slowly. \"Then you understand. A name is a promise the living make to the unborn.\" She whispers the child's name — soft as river breath — and the compound breathes together.",
        nextSceneId: "n5",
      },
      n4b: {
        id: "n4b",
        type: "narrative",
        gradient: ["#2A1010", "#0D0F1A"],
        backgroundEmoji: "💧",
        title: "Honest Ignorance",
        text: "She laughs — warm, not unkind. \"Good. An honest mouth learns faster than a proud one.\" She says the child's name aloud, then says yours back to you — and you hear it differently.",
        nextSceneId: "n5",
      },
      n5: {
        id: "n5",
        type: "conclusion",
        gradient: ["#07080F", "#0D0F1A"],
        backgroundEmoji: "🌅",
        title: "The Named World",
        text: "To name something is to bring it fully into existence. Languages do not just describe the world — they create it. The child is crying now. Alive. Named. Known.",
      },
    },
  },

  // ── Bou Mie film: "The Creeks Remember" (documentary) ────────────────────
  "izon-creeks": {
    id: "izon-creeks",
    title: "The Creeks Remember",
    description: "A fishing dawn, and an elder reading a changing river.",
    coverGradient: ["#0E3A46", "#0D0F1A"],
    coverEmoji: "🌊",
    estimatedMinutes: 8,
    author: "Beeli · community documentary",
    language: "Izon",
    initialSceneId: "cr1",
    scenes: {
      cr1: {
        id: "cr1",
        type: "narrative",
        gradient: ["#0E3A46", "#0D0F1A"],
        backgroundEmoji: "🌅",
        title: "First Light",
        text: "Black water, first grey light, one bird. Uncle Ere dips his paddle and speaks to the creek the way you speak to family. \"Toru. Owo fiye\" — the river, our life — \"owo daubọ fiye kpo\" — the life of our ancestors too.",
        nextSceneId: "cr2",
      },
      cr2: {
        id: "cr2",
        type: "narrative",
        gradient: ["#123B2E", "#0D0F1A"],
        backgroundEmoji: "🎣",
        title: "The Morning",
        text: "The net goes out with a soft splash. A long wait. When it comes up there are two small fish. \"Beke ye, endi opu emi,\" Ere says — in the old days, there were big fish. \"Tọdẹ… endi pẹrị pẹrị\" — today, only little ones.",
        nextSceneId: "cr3",
      },
      cr3: {
        id: "cr3",
        type: "choice",
        gradient: ["#0E2A33", "#0D0F1A"],
        backgroundEmoji: "🌫️",
        title: "The Dark Water",
        text: "\"Beni dirimo,\" he murmurs — the water is dark. \"Endi mu\" — the fish have gone. He looks at you, waiting to see whether you will ask the real question.",
        choices: [
          { id: "crc1", text: "\"Why has the water gone dark?\"", nextSceneId: "cr4" },
          { id: "crc2", text: "\"Where did the fish go?\"", nextSceneId: "cr4" },
        ],
      },
      cr4: {
        id: "cr4",
        type: "narrative",
        gradient: ["#1A2E33", "#0D0F1A"],
        backgroundEmoji: "🌊",
        title: "The Spirits of the Water",
        text: "The elders tell it this way: the owuamapu, the water spirits, once lived close and taught the people to fish and read the creeks. When the water was fouled and thanks forgotten, they drew back into the deep. (The full telling belongs to a community keeper.)",
        nextSceneId: "cr5",
      },
      cr5: {
        id: "cr5",
        type: "conclusion",
        gradient: ["#0A1A20", "#07080F"],
        backgroundEmoji: "💧",
        title: "The River's Memory",
        text: "Ere holds the two small fish and says the old proverb like a verdict: \"Toru angọ kụlụ bogha\" — the river does not forget its source. The water, he means, keeps account of how it is treated. So must we.",
      },
    },
  },

  // ── Bou Mie film: "The Empty Net" (narrative short) ──────────────────────
  "izon-empty-net": {
    id: "izon-empty-net",
    title: "The Empty Net",
    description: "A boasted catch, a warning ignored, and what a family does next.",
    coverGradient: ["#123B2E", "#0D0F1A"],
    coverEmoji: "🎣",
    estimatedMinutes: 12,
    author: "Beeli · community narrative",
    language: "Izon",
    initialSceneId: "en1",
    scenes: {
      en1: {
        id: "en1",
        type: "narrative",
        gradient: ["#123B2E", "#0D0F1A"],
        backgroundEmoji: "🛶",
        title: "Before Dawn",
        text: "Timi loads the canoe in the dark, grinning. \"Tọdẹ, endi opu!\" he tells you — today, big fish! \"Emịnị nimi\" — I know it. He has promised a catch that will feed the whole compound.",
        nextSceneId: "en2",
      },
      en2: {
        id: "en2",
        type: "choice",
        gradient: ["#0E2A24", "#0D0F1A"],
        backgroundEmoji: "🌫️",
        title: "Uncle Ere's Warning",
        text: "Old Ere blocks the jetty. \"Bou anị mu-daị,\" he says — don't go to that creek. \"Beni dirimo. Endi faa\" — the water is dark, no fish there. Timi is already paddling. What do you do?",
        choices: [
          { id: "enc1", text: "Heed the elder — call Timi back", nextSceneId: "en3" },
          { id: "enc2", text: "Trust your cousin — go with him", nextSceneId: "en3" },
        ],
      },
      en3: {
        id: "en3",
        type: "narrative",
        gradient: ["#0B2620", "#0D0F1A"],
        backgroundEmoji: "🕸️",
        title: "The Dark Creek",
        text: "Either way, the canoe slides into still, oily water. The birds go quiet. Timi throws the net. \"Kọn! Kọn!\" — pull, pull. It comes up heavy with nothing. \"Neti yefaa,\" he says at last — the net is empty. \"Endi faa. Kẹnị kpo faa\" — no fish. Not even one.",
        nextSceneId: "en4",
      },
      en4: {
        id: "en4",
        type: "narrative",
        gradient: ["#1E2A14", "#0D0F1A"],
        backgroundEmoji: "🏠",
        title: "Home",
        text: "You return with an empty canoe. Grandmother Ebiere does not scold. \"Endi faa,\" she agrees — no fish — \"duọ owo mamụ emi\" — but the two of you came back together. Then the proverb: \"Ọkọ kẹnị bẹ ama toru firigha-amị\" — one canoe cannot cross the river alone.",
        nextSceneId: "en5",
      },
      en5: {
        id: "en5",
        type: "conclusion",
        gradient: ["#141A0A", "#07080F"],
        backgroundEmoji: "🪢",
        title: "What the Net Held",
        text: "The catch failed; the family held. In the creeks, the elders say, that is the harder and better haul. The empty net dries on the line, and no one goes hungry for company.",
      },
    },
  },

  // ── Bou Mie film: "Woyengi — The Mother of Choosing" (heritage) ──────────
  "izon-woyengi": {
    id: "izon-woyengi",
    title: "Woyengi — The Mother of Choosing",
    description: "The Izon creation story: the Mother, the clay, and the choosing.",
    coverGradient: ["#2A2531", "#0D0F1A"],
    coverEmoji: "🌟",
    estimatedMinutes: 10,
    author: "Beeli · with a community keeper",
    language: "Izon",
    initialSceneId: "wy1",
    scenes: {
      wy1: {
        id: "wy1",
        type: "narrative",
        gradient: ["#2A2531", "#0D0F1A"],
        backgroundEmoji: "🔥",
        title: "Night, and the Telling",
        text: "A single lamp, and the dark all around. \"Agụra gba,\" Grandmother Ebiere begins — tales are told at night, never by day. \"Beke ye…\" — long ago. She waits until you answer that you are listening. Only then does she go on.",
        nextSceneId: "wy2",
      },
      wy2: {
        id: "wy2",
        type: "narrative",
        gradient: ["#241F2E", "#0D0F1A"],
        backgroundEmoji: "⚡",
        title: "The Descent",
        text: "In the beginning there was only Woyengi — Our Mother. She came down on the lightning to Oporoma and set up her creation chair, the ereibi. (This is the publicly-told shape of the story; the sacred telling belongs to a keeper.)",
        nextSceneId: "wy3",
      },
      wy3: {
        id: "wy3",
        type: "narrative",
        gradient: ["#1E1A28", "#0D0F1A"],
        backgroundEmoji: "🫱",
        title: "The Clay",
        text: "She took the earth — \"ebi\" — into her hands and moulded the human beings, one by one, and breathed life — \"fiyowei\" — into each. And then she did the thing no other creator is said to do: she let each person choose.",
        nextSceneId: "wy4",
      },
      wy4: {
        id: "wy4",
        type: "choice",
        gradient: ["#231B1A", "#0D0F1A"],
        backgroundEmoji: "🌠",
        title: "The Choosing",
        text: "Woyengi asks each soul to choose its own gender, its gifts, the manner of its life and its death — its \"ogbo,\" its destiny. She turns, in the telling, to you. What do you reach for first?",
        choices: [
          { id: "wyc1", text: "A long life, quiet and full", nextSceneId: "wy5" },
          { id: "wyc2", text: "A great gift, whatever it costs", nextSceneId: "wy5" },
        ],
      },
      wy5: {
        id: "wy5",
        type: "conclusion",
        gradient: ["#141019", "#07080F"],
        backgroundEmoji: "🌌",
        title: "The Mother of Choosing",
        text: "Whatever you chose at her knee, Ebiere says, became your life. \"Enị ogbo, ị pẹrịmị\" — your destiny, you yourself chose it. In the Izon world, fate and freedom are the same thread. The lamp lowers. You carry the ancestors' words now.",
      },
    },
  },

  // ── Film: "Writing Systems of Africa" (visual survey) ────────────────────
  "writing-systems": {
    id: "writing-systems",
    title: "Writing Systems of Africa",
    description: "From Ge'ez to Nsibidi to N'Ko — a journey through the continent's scripts.",
    coverGradient: ["#1A3A2E", "#0D0F1A"],
    coverEmoji: "✍️",
    estimatedMinutes: 9,
    author: "Pan-African Media Lab",
    initialSceneId: "ws1",
    scenes: {
      ws1: {
        id: "ws1",
        type: "narrative",
        gradient: ["#14261F", "#0D0F1A"],
        backgroundEmoji: "📜",
        title: "The Myth of the Silent Continent",
        text: "You were taught, perhaps, that Africa had no writing — that its knowledge lived only in the voice. It is one of history's most durable lies. The continent wrote in stone and cloth, in metal and skin, in symbols older than most alphabets. Come and read.",
        nextSceneId: "ws2",
      },
      ws2: {
        id: "ws2",
        type: "narrative",
        gradient: ["#2A1E0A", "#0D0F1A"],
        backgroundEmoji: "🇪🇹",
        title: "Ge'ez — the Fidel",
        text: "Begin in the highlands of Ethiopia and Eritrea. Ge'ez gave rise to the Fidel — an abugida where each of hundreds of characters is a consonant married to a vowel. Carved on ancient Aksumite stelae, it still writes Amharic and Tigrinya today, an unbroken line across nearly two thousand years.",
        nextSceneId: "ws3",
      },
      ws3: {
        id: "ws3",
        type: "choice",
        gradient: ["#101E2A", "#0D0F1A"],
        backgroundEmoji: "🧭",
        title: "Two Roads",
        text: "The continent's scripts run in two great families: the symbol systems, drawn and danced for centuries, and the alphabets that named inventors gave their people. Which road first?",
        choices: [
          { id: "wsc1", text: "The old symbol systems — Nsibidi", nextSceneId: "ws4a" },
          { id: "wsc2", text: "The invented scripts — N'Ko and Vai", nextSceneId: "ws4b" },
        ],
      },
      ws4a: {
        id: "ws4a",
        type: "narrative",
        gradient: ["#1A140A", "#0D0F1A"],
        backgroundEmoji: "🪶",
        title: "Nsibidi — the Hidden Sign",
        text: "In the Cross River forests, the Ekpe society kept Nsibidi: ideograms that could be inked on skin, painted on walls, traced on the ground, or shaped by the hand in the air. Some signs spoke openly of love and journey; the deepest were secret, readable only to the initiated.",
        nextSceneId: "ws5",
      },
      ws4b: {
        id: "ws4b",
        type: "narrative",
        gradient: ["#0A1A1E", "#0D0F1A"],
        backgroundEmoji: "🖋️",
        title: "N'Ko and Vai — Made by Hand",
        text: "Some scripts have a birthday. In 1949 Solomana Kanté designed N'Ko — \"I say\" in Manding — writing right to left to carry his mother tongue with pride. A century earlier in Liberia, Momolu Duwalu Bukele dreamt the Vai syllabary into being — one of the few writing systems whose inventor we can name.",
        nextSceneId: "ws5",
      },
      ws5: {
        id: "ws5",
        type: "narrative",
        gradient: ["#231A10", "#0D0F1A"],
        backgroundEmoji: "🔶",
        title: "Adinkra and Tifinagh",
        text: "In Ghana, the Akan stamped Adinkra symbols into cloth — Sankofa, the bird that turns to fetch what was left behind; Gye Nyame, \"except God.\" Across the Sahara, the Amazigh kept Tifinagh, a geometry of dots and lines carved on rock for millennia and revived today to write Tamazight.",
        nextSceneId: "ws6",
      },
      ws6: {
        id: "ws6",
        type: "conclusion",
        gradient: ["#0A140F", "#07080F"],
        backgroundEmoji: "⭐",
        title: "A Continent That Wrote",
        text: "Writing is memory made visible. Africa made it visible in a hundred ways — abugida and syllabary, ideogram and stamped cloth — long before anyone told it to be silent. Learn a language here, and you inherit a way of seeing that was always written down.",
      },
    },
  },
};

/** True when a branching interactive story exists for the given id/storyId. */
export function hasInteractiveStory(id: string | null | undefined): boolean {
  return !!id && id in INTERACTIVE_STORIES;
}

export function getInteractiveStory(id: string): InteractiveStory | null {
  return INTERACTIVE_STORIES[id] ?? null;
}
