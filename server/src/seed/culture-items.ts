import "dotenv/config";
import { db } from "../db/index.js";
import { cultureItems } from "../db/schema.js";

const ITEMS = [
  {
    id: "film-001",
    type: "film" as const,
    title: "The Griot's Path",
    description: "A living archive — follow an apprentice Griot across three countries as he memorises centuries of oral history in a single month.",
    author: "Sahel Stories",
    publishedAt: new Date("2025-10-05T12:00:00Z"),
    duration: 1740,
    coverGradientFrom: "#7C3A1A",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "🥁",
    featured: true,
    storyId: "griot-path",
    audioUrl: null, contentUrl: null, body: null, showNotes: null,
  },
  {
    id: "podcast-001",
    type: "podcast" as const,
    title: "Ep. 12 — Learning Izon as a Diaspora Kid",
    description: "Our guest grew up in London and reconnected with Izon at 28. She shares the emotional and linguistic journey of reclaiming a mother tongue.",
    author: "Beeli Conversations",
    publishedAt: new Date("2025-11-01T06:00:00Z"),
    duration: 2520,
    coverGradientFrom: "#3B1F6E",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "🎙️",
    featured: true,
    storyId: null,
    audioUrl: "https://cdn.beeli.app/podcast/ep-12.mp3",
    contentUrl: "https://beeli.app/podcast/ep-12",
    body: null,
    showNotes: `Our guest this episode is Adaeze Pepple, a 31-year-old UX designer based in London who grew up speaking English exclusively at home — despite both parents being fluent Izon speakers. At 28, after her grandmother's passing, she made a decision to reclaim the language she had been raised without.

Topics covered: the emotional weight of heritage language loss; what it felt like to be a complete beginner in a language that should have been native; the specific challenges of learning a language with almost no digital learning resources; how she found an online tutor in Port Harcourt; the moment she realised she was dreaming in Izon for the first time.

Adaeze also reflects on identity — how speaking Izon changed the way she was perceived on trips to Nigeria, and how it changed the way she perceived herself. She is candid about the frustration of slow progress and the unexpected joy of small breakthroughs.

Recommended for: diaspora learners, anyone who has experienced heritage language grief, and learners at the beginner-to-intermediate transition.`,
  },
  {
    id: "film-002",
    type: "film" as const,
    title: "Writing Systems of Africa",
    description: "From Ge'ez to Nsibidi to N'Ko — Africa's indigenous scripts are among the world's most underappreciated achievements. A visual survey.",
    author: "Pan-African Media Lab",
    publishedAt: new Date("2025-08-12T12:00:00Z"),
    duration: 1980,
    coverGradientFrom: "#1A3A2E",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "✍️",
    featured: true,
    storyId: "writing-systems",
    audioUrl: null,
    contentUrl: "https://beeli.app/film/writing-systems",
    body: null, showNotes: null,
  },
  {
    id: "blog-001",
    type: "blog" as const,
    title: "Why Tonal Languages Are Easier Than You Think",
    description: "Most learners fear tones. A simple reframe turns them from obstacles into superpowers. We break down the logic with three Izon examples.",
    author: "Amara Nwosu",
    publishedAt: new Date("2025-11-10T08:00:00Z"),
    duration: 360,
    coverGradientFrom: "#0F2A4A",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "🗣️",
    featured: false,
    storyId: null, audioUrl: null,
    contentUrl: "https://beeli.app/blog/tonal-languages",
    showNotes: null,
    body: `Every language learner has heard it: "Tonal languages are impossibly hard." Mandarin. Yoruba. Izon. The mere mention triggers a kind of learned helplessness. But this fear rests on a misunderstanding — and once you correct it, tones become one of the most logical features a language can have.

In Izon, for instance, the same syllable *be* can mean "to come," "to go," or "a place," depending on pitch contour. To a speaker of English, this feels arbitrary. But consider what we do with intonation: "You're coming?" versus "You're coming." The pitch tells you everything about the speaker's intent. Tonal languages simply grammaticalise this same phenomenon at the word level.

The practical reframe is this: instead of treating tone as an additional burden layered on top of a word, treat it as inseparable from the word itself. When you learn the Izon word for "fire," you do not learn a sound and then learn a tone. You learn a single unit — a tonal syllable — the same way English speakers learn that "though," "through," and "tough" are all spelled differently despite sounding nothing alike. You do not question the spelling; you simply learn the word.

Three Izon examples make this concrete. *Ọkọ* with a high–low contour means "husband." *Ọkọ* with a low–high contour means "canoe." A learner who treats these as one word plus a diacritical footnote will confuse them forever. A learner who treats them as two entirely distinct vocabulary items — which they are — will never make that error. The tone is not decoration. It is half the word. Once you accept that, the difficulty largely dissolves.`,
  },
  {
    id: "podcast-002",
    type: "podcast" as const,
    title: "Ep. 11 — The Science of Language Revival",
    description: "Linguist Dr. Ifunanya Obi explains why endangered language programmes succeed or fail, and what the data says about African language apps.",
    author: "Beeli Conversations",
    publishedAt: new Date("2025-10-15T06:00:00Z"),
    duration: 3060,
    coverGradientFrom: "#3B1F6E",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "🔬",
    featured: false,
    storyId: null,
    audioUrl: "https://cdn.beeli.app/podcast/ep-11.mp3",
    contentUrl: "https://beeli.app/podcast/ep-11",
    body: null,
    showNotes: `Dr. Ifunanya Obi is a sociolinguist at the University of Lagos whose research focuses on language endangerment and digital revitalisation strategies for West African languages. She has advised UNESCO on three language documentation projects and is the author of "Tongue and Territory: Language Policy in Post-Colonial Nigeria."

In this conversation, she explains the difference between language documentation (recording a dying language) and language revitalisation (actually reversing decline) — and why the two are often confused in funding conversations. She walks through the case studies that inform her optimism: Welsh, Māori, and — closer to home — Nupe, which has seen a measurable uptick in child speakers in two northern Nigerian communities over the last decade.

On apps specifically: Dr. Obi is measured rather than dismissive. The evidence for vocabulary acquisition via spaced repetition is solid; the evidence for conversational fluency through apps alone is weak. The missing ingredient is consistent social pressure — reasons to speak the language that exist outside the screen. She argues that apps are most effective when they function as a bridge to community, not a substitute for it.

Timestamps: 00:00 Intro · 08:14 What revitalisation actually means · 22:40 The Welsh model · 34:10 African language apps — what works · 48:30 Policy recommendations · 57:00 Where to start if you want to help.`,
  },
  {
    id: "blog-002",
    type: "blog" as const,
    title: "The Oral Tradition: Why Stories Matter",
    description: "For millennia, African languages were transmitted orally. Here's how you can harness that same tradition to accelerate your fluency.",
    author: "Chibuike Eze",
    publishedAt: new Date("2025-10-22T09:30:00Z"),
    duration: 480,
    coverGradientFrom: "#2A1F0F",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "📖",
    featured: false,
    storyId: null, audioUrl: null,
    contentUrl: "https://beeli.app/blog/oral-tradition",
    showNotes: null,
    body: `Before writing systems, there was the voice. Across the African continent, entire libraries of knowledge — genealogies, legal codes, cosmologies, agricultural calendars — were held in the memories of specialist speakers: griots, elders, praise-singers. The oral tradition was not a primitive precursor to literacy. It was a fully realised technology for preserving and transmitting culture across generations.

For modern language learners, this history carries a practical lesson. The brain did not evolve to acquire language by reading grammar tables. It evolved to acquire language through stories told by people in real social contexts. When researchers study how children become fluent, the consistent finding is that rich, repetitive, emotionally engaging oral input — not drills — is the engine of acquisition. The oral tradition knew this long before cognitive science did.

Harnessing this for your own learning is straightforward in principle: prioritise listening over reading, and narrative over vocabulary lists. Find audio content in your target language — radio programmes, podcasts, folktales, interviews — and immerse yourself in it before you feel "ready." The comprehension will come. Anxiety about not understanding every word is the single greatest enemy of oral acquisition. Griots did not learn their craft by first mastering a syllabary. They listened, shadowed, and gradually produced.

For Izon, Twi, Yoruba, or any African language with a living spoken tradition, this means seeking out native speakers and recorded material aggressively. A fifteen-minute folktale repeated until you can follow the emotional arc — even before you parse every word — will do more for your fluency than an hour of conjugation practice. The oral tradition is not nostalgia. It is method.`,
  },
  {
    id: "podcast-003",
    type: "podcast" as const,
    title: "Ep. 10 — Twi in the Modern Workplace",
    description: "Three professionals share how speaking Twi transformed their careers and sense of identity inside corporate Accra.",
    author: "Beeli Conversations",
    publishedAt: new Date("2025-09-28T06:00:00Z"),
    duration: 2160,
    coverGradientFrom: "#3B1F6E",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "💼",
    featured: false,
    storyId: null,
    audioUrl: "https://cdn.beeli.app/podcast/ep-10.mp3",
    contentUrl: "https://beeli.app/podcast/ep-10",
    body: null,
    showNotes: `A roundtable with three professionals working in corporate Accra — a management consultant, a marketing director at a pan-African FMCG brand, and a software engineer at a fintech startup — about the practical and symbolic role of Twi in their working lives.

All three grew up speaking Twi at home but spent formative years in English-medium education. All three describe a similar arc: arriving in the professional world with Twi they considered "casual," then gradually realising it was a professional asset they had been undervaluing.

Key discussion points: codeswitching norms in Accra boardrooms and what triggers a shift from English to Twi mid-meeting; how Twi fluency affects client trust in sectors where relationships are paramount; the experience of being a non-Ghanaian African speaker of Twi and how that is received; whether the growth of pan-African remote work is increasing or decreasing pressure to speak English exclusively.

The conversation also touches on the politics of language in the workplace — when insisting on Twi is read as a cultural statement, and when it is simply practical. An honest, unscripted exchange with no settled conclusions.`,
  },
  {
    id: "film-003",
    type: "film" as const,
    title: "Voices of the Delta",
    description: "Three generations of Izon speakers — a grandmother, her son, and her granddaughter — navigate the distance between the language they share and the world pulling them apart.",
    author: "Niger Delta Films",
    publishedAt: new Date("2025-07-20T12:00:00Z"),
    duration: 2700,
    coverGradientFrom: "#1A3A1A",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "🌿",
    featured: false,
    storyId: null, audioUrl: null, contentUrl: null, body: null,
    showNotes: `Voices of the Delta follows one family across three generations in the Niger Delta region. Mama Ebiotu, 74, speaks only Izon. Her son Doubiye, 48, moves fluidly between Izon, Pidgin, and English depending on context. His daughter Tari, 19, studying engineering in Lagos, understands Izon but rarely speaks it by choice.

The film is structured around three conversations: Mama Ebiotu telling a folktale to Tari, with Doubiye translating in real time; a family meal where the three negotiate which language to use; and a final sequence where Tari attempts to tell her grandmother, in Izon, why she left home.

Director Amaka Ossai spent eight months with the family before shooting. The result is intimate rather than polemical — the film does not argue that Tari should speak Izon more. It simply shows what is lost and what is gained at each generational remove, and lets the viewer sit with the discomfort of that calculation.

Voices of the Delta premiered at the Pan-African Film Festival and won the Jury Special Mention for documentary short. Full film coming to Beeli in early 2026.`,
  },
  {
    id: "blog-003",
    type: "blog" as const,
    title: "5 Phrases Every Izon Learner Should Know First",
    description: "Greetings open doors. Before vocabulary lists, master these five phrases and watch how native speakers respond differently.",
    author: "Beeli Editorial",
    publishedAt: new Date("2025-11-18T07:00:00Z"),
    duration: 240,
    coverGradientFrom: "#0F2A4A",
    coverGradientTo: "#0D0F1A",
    coverEmoji: "👋",
    featured: false,
    storyId: null, audioUrl: null,
    contentUrl: "https://beeli.app/blog/5-phrases",
    body: null, showNotes: null,
  },
];

async function seed() {
  console.log("Seeding culture items...");
  for (const item of ITEMS) {
    await db.insert(cultureItems).values(item).onConflictDoNothing();
  }
  console.log(`Seeded ${ITEMS.length} culture items.`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
