export type DiscoverItem = {
  id: string;
  type: "film" | "podcast" | "blog";
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  duration: number;
  coverGradient: [string, string];
  coverEmoji: string;
  featured: boolean;
  storyId?: string;
  audioUrl?: string;
  contentUrl?: string;
};

export type DiscoverFilter = "all" | "blog" | "podcast" | "film";

export const ITEMS: DiscoverItem[] = [
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
    id: "blog-003",
    type: "blog",
    title: "5 Phrases Every Izon Learner Should Know First",
    description:
      "Greetings open doors. Before vocabulary lists, master these five phrases and watch how native speakers respond differently.",
    author: "Beeli Editorial",
    publishedAt: "2025-11-18T07:00:00Z",
    duration: 240,
    coverGradient: ["#0F2A4A", "#0D0F1A"],
    coverEmoji: "👋",
    featured: false,
    contentUrl: "https://beeli.app/blog/5-phrases",
  },
];
