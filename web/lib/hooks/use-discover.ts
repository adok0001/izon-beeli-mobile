import { useQuery } from "@tanstack/react-query";
import type { DiscoverItem, InteractiveStory } from "@/types";

const MOCK_ITEMS: DiscoverItem[] = [
  {
    id: "film-001",
    type: "film",
    title: "The Griot's Path",
    description:
      "A living archive — follow an apprentice Griot across three countries as he memorises centuries of oral history in a single month.",
    author: "Sahel Stories",
    publishedAt: "2025-10-05T12:00:00Z",
    duration: 1740,
    coverGradient: ["#7C3A1A", "#0D0F1A"],
    coverEmoji: "🥁",
    featured: true,
    storyId: "griot-path",
  },
  {
    id: "podcast-001",
    type: "podcast",
    title: "Ep. 12 — Learning Izon as a Diaspora Kid",
    description:
      "Our guest grew up in London and reconnected with Izon at 28. She shares the emotional and linguistic journey of reclaiming a mother tongue.",
    author: "Beeli Conversations",
    publishedAt: "2025-11-01T06:00:00Z",
    duration: 2520,
    coverGradient: ["#3B1F6E", "#0D0F1A"],
    coverEmoji: "🎙️",
    featured: true,
    audioUrl: "https://cdn.beeli.app/podcast/ep-12.mp3",
    contentUrl: "https://beeli.app/podcast/ep-12",
  },
  {
    id: "blog-001",
    type: "blog",
    title: "Why Tonal Languages Are Easier Than You Think",
    description:
      "Most learners fear tones. A simple reframe turns them from obstacles into superpowers. We break down the logic with three Izon examples.",
    author: "Amara Nwosu",
    publishedAt: "2025-11-10T08:00:00Z",
    duration: 360,
    coverGradient: ["#0F2A4A", "#0D0F1A"],
    coverEmoji: "🗣️",
    featured: false,
    contentUrl: "https://beeli.app/blog/tonal-languages",
  },
  {
    id: "film-002",
    type: "film",
    title: "Writing Systems of Africa",
    description:
      "From Ge'ez to Nsibidi to N'Ko — Africa's indigenous scripts are among the world's most underappreciated achievements. A visual survey.",
    author: "Pan-African Media Lab",
    publishedAt: "2025-08-12T12:00:00Z",
    duration: 1980,
    coverGradient: ["#1A3A2E", "#0D0F1A"],
    coverEmoji: "✍️",
    featured: true,
    storyId: "naming-ceremony",
    contentUrl: "https://beeli.app/film/writing-systems",
  },
  {
    id: "podcast-002",
    type: "podcast",
    title: "Ep. 11 — The Science of Language Revival",
    description:
      "Linguist Dr. Ifunanya Obi explains why endangered language programmes succeed or fail, and what the data says about African language apps.",
    author: "Beeli Conversations",
    publishedAt: "2025-10-15T06:00:00Z",
    duration: 3060,
    coverGradient: ["#3B1F6E", "#0D0F1A"],
    coverEmoji: "🔬",
    featured: false,
    audioUrl: "https://cdn.beeli.app/podcast/ep-11.mp3",
    contentUrl: "https://beeli.app/podcast/ep-11",
  },
  {
    id: "blog-002",
    type: "blog",
    title: "The Oral Tradition: Why Stories Matter",
    description:
      "For millennia, African languages were transmitted orally. Here's how you can harness that same tradition to accelerate your fluency.",
    author: "Chibuike Eze",
    publishedAt: "2025-10-22T09:30:00Z",
    duration: 480,
    coverGradient: ["#2A1F0F", "#0D0F1A"],
    coverEmoji: "📖",
    featured: false,
    contentUrl: "https://beeli.app/blog/oral-tradition",
  },
  {
    id: "podcast-003",
    type: "podcast",
    title: "Ep. 10 — Twi in the Modern Workplace",
    description:
      "Three professionals share how speaking Twi transformed their careers and sense of identity inside corporate Accra.",
    author: "Beeli Conversations",
    publishedAt: "2025-09-28T06:00:00Z",
    duration: 2160,
    coverGradient: ["#3B1F6E", "#0D0F1A"],
    coverEmoji: "💼",
    featured: false,
    audioUrl: "https://cdn.beeli.app/podcast/ep-10.mp3",
    contentUrl: "https://beeli.app/podcast/ep-10",
  },
  {
    id: "film-003",
    type: "film",
    title: "Voices of the Delta",
    description:
      "How Izon-speaking communities in the Niger Delta are preserving their language through music, ceremony, and technology.",
    author: "Riverine Films",
    publishedAt: "2025-10-05T12:00:00Z",
    duration: 1680,
    coverGradient: ["#0C2340", "#0D0F1A"],
    coverEmoji: "🎬",
    featured: false,
    contentUrl: "https://beeli.app/film/voices-delta",
  },
];

const MOCK_STORIES: Record<string, InteractiveStory> = {
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
};

export type DiscoverFilter = "all" | "blog" | "podcast" | "film";

export function useDiscover(filter: DiscoverFilter = "all") {
  const query = useQuery<DiscoverItem[]>({
    queryKey: ["discover", filter],
    queryFn: async () => MOCK_ITEMS,
    placeholderData: MOCK_ITEMS,
    staleTime: 1000 * 60 * 10,
  });

  const all = query.data ?? MOCK_ITEMS;
  const filtered = filter === "all" ? all : all.filter((i) => i.type === filter);
  const featured = filtered.filter((i) => i.featured);
  const rest = filtered.filter((i) => !i.featured);

  return { ...query, featured, rest, all: filtered };
}

export function useInteractiveStory(id: string | undefined) {
  return useQuery<InteractiveStory | null>({
    queryKey: ["interactive-story", id],
    queryFn: async () => (id ? (MOCK_STORIES[id] ?? null) : null),
    placeholderData: id ? (MOCK_STORIES[id] ?? null) : null,
    staleTime: 1000 * 60 * 30,
    enabled: !!id,
  });
}
