# Beeli — On-Page SEO Specs

Copy these exactly when building or editing pages. The site uses Next.js 15
App Router — metadata is exported from each `page.tsx` or `layout.tsx` using
the `Metadata` type. Multi-language variants (fr, pcm) should be added to
`alternates.languages` and `openGraph.locale`.

---

## Homepage (`/`)

**Title tag (58 chars):**
`Learn African Languages | Beeli`

**Meta description (157 chars):**
`Learn Izon, Niger Delta languages, and more with Beeli — the only app with structured lessons, audio from native speakers, and tools built for the diaspora.`

**H1:** `Learn African Languages. Preserve Your Heritage.`

**H2 structure:**
1. `Start Learning Izon Today — No App Required`
2. `Audio Lessons from Native Speakers`
3. `Interactive Quizzes and Matching Games`
4. `A Dictionary Built by the Community`
5. `Tools for Educators and Classrooms`
6. `Join a Global Community of Heritage Learners`

**Schema markup (JSON-LD — add to layout.tsx):**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Beeli",
  "alternateName": "Aurufie",
  "description": "Beeli is the only platform for learning Izon and other Niger Delta languages. Structured lessons, native audio, interactive quizzes, and educator tools for the African diaspora.",
  "url": "https://izon-beeli.com",
  "applicationCategory": "EducationApplication",
  "operatingSystem": "iOS, Android, Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "inLanguage": ["en", "fr", "pcm"],
  "audience": {
    "@type": "Audience",
    "audienceType": "African diaspora, heritage language learners, educators"
  }
}
```

---

## Learn Hub (`/learn`)

**Title tag:** `Learn African Languages Online | Beeli`

**Meta description:**
`Choose your language and start learning with structured lessons, audio, quizzes, and journaling. Beeli teaches the languages no other platform covers.`

**H1:** `Choose a Language to Start Learning`

**H2 structure:**
1. `Izon — Niger Delta's Living Language`
2. `How Beeli Lessons Work`
3. `Track Your Progress`

---

## Izon Language Page (`/learn/izon`)

**Title tag:** `Learn Izon Language Online — Free Lessons | Beeli`

**Meta description:**
`Beeli is the only app with structured Izon lessons. Learn words, phrases, and grammar from native speakers. Free to start — no download required.`

**H1:** `Learn Izon — Lessons, Audio, and Dictionary`

**H2 structure:**
1. `Start with Izon Basics`
2. `Listen to Native Speakers`
3. `Practice with Quizzes`
4. `Izon Dictionary`
5. `About the Izon Language`
6. `Frequently Asked Questions`

**Key SEO copy (use near top of page):**
> "Beeli is the only language learning platform in the world with structured
> Izon lessons. Taught by native speakers, built for the diaspora — whether
> you grew up speaking it or are learning it for the first time."

**Schema — Course:**
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Izon Language Course",
  "description": "Structured Izon language lessons with audio from native speakers, interactive quizzes, and a community dictionary. The only Izon course available online.",
  "provider": {
    "@type": "Organization",
    "name": "Beeli",
    "url": "https://izon-beeli.com"
  },
  "inLanguage": "izon",
  "educationalLevel": "Beginner to Intermediate",
  "isAccessibleForFree": true
}
```

**FAQ Schema — add FAQPage markup:**
- "What is the Izon language?" → brief answer + link to `/blog/what-is-izon`
- "Is Izon the same as Ijaw?" → explain relationship
- "Can I learn Izon for free?" → yes, Beeli is free to start
- "How many lessons are in the Izon course?" → current count
- "Is Beeli available on iOS and Android?" → yes, plus web

---

## Dictionary Hub (`/dictionary`)

**Title tag:** `African Language Dictionary — Izon & More | Beeli`

**Meta description:**
`Look up words in Izon and other African languages. Community-built dictionary with audio pronunciation, example sentences, and cultural context.`

**H1:** `African Language Dictionary`

---

## Izon Dictionary (`/dictionary/izon`)

**Title tag:** `Izon Language Dictionary — Words & Meanings | Beeli`

**Meta description:**
`Search the Izon dictionary on Beeli. Community-verified words with English translations, pronunciation audio, and example usage. Free and growing daily.`

**H1:** `Izon–English Dictionary`

---

## Listen (`/listen`)

**Title tag:** `Izon Audio Lessons — Learn from Native Speakers | Beeli`

**Meta description:**
`Listen to Izon language lessons recorded by native speakers. Improve your pronunciation and understanding with Beeli's audio-first learning approach.`

**H1:** `Listen to Izon — Audio Lessons from Native Speakers`

---

## For Educators (`/for-educators`)

**Title tag:** `Teach Izon Language — Educator Tools | Beeli`

**Meta description:**
`Beeli gives teachers structured Izon lesson plans, classroom tools, student progress tracking, and a growing content library. Free for educators.`

**H1:** `Teach African Languages with Beeli`

**H2 structure:**
1. `Lesson Plans and Curriculum`
2. `Student Progress Dashboard`
3. `Community-Verified Content`
4. `Get Started — Free for Classrooms`
5. `Frequently Asked Questions`

**Schema — EducationalOrganization:**
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Beeli",
  "url": "https://izon-beeli.com",
  "description": "Beeli provides structured African language education tools for teachers and classrooms, specialising in Izon and Niger Delta languages.",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Educator Tools",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Classroom Dashboard",
          "description": "Student progress tracking and content management for Izon classrooms"
        }
      }
    ]
  }
}
```

---

## Contribute (`/contribute`)

**Title tag:** `Help Preserve the Izon Language | Beeli`

**Meta description:**
`Contribute words, phrases, and corrections to Beeli's Izon language corpus. Every submission helps preserve Niger Delta languages for future generations.`

**H1:** `Help Build the Izon Language Corpus`

---

## Support (`/support`)

**Title tag:** `Beeli Support — Help & FAQs`

**Meta description (120 chars):**
`Get help with Beeli — account, lessons, audio, and the Izon dictionary. Browse FAQs or contact our support team.`

---

## URL Structure Rules

```
/                        ← Homepage
/learn                   ← Learn hub
/learn/izon              ← Izon language course
/learn/[language]        ← Future languages (same pattern)
/dictionary              ← Dictionary hub
/dictionary/izon         ← Izon dictionary
/dictionary/[language]   ← Future languages
/listen                  ← Audio lessons
/leaderboard             ← Leaderboard
/bounties                ← Bounties / contributions
/contribute              ← Contribute
/for-educators           ← Educator landing page
/contact                 ← Contact
/privacy                 ← Privacy policy
/support                 ← Support / FAQs
/blog/                   ← Blog index (if created)
/blog/[slug]             ← Individual posts
```

**URL rules:**
- All lowercase, hyphens not underscores
- No trailing slashes (or consistent — pick one)
- No query parameters in indexable pages
- Language codes in path, not query string (`/learn/izon` not `/learn?lang=izon`)

---

## Image SEO Rules

**Filename:** `[subject]-beeli-[language].[ext]`
Examples:
- `izon-lesson-beeli-app.jpg`
- `izon-dictionary-beeli-mobile.jpg`
- `african-language-learning-beeli.jpg`

**Alt text format:** `[Descriptive phrase] — Beeli [language] app`
Examples:
- `alt="Student completing an Izon language quiz on the Beeli app"`
- `alt="Izon words and translations in the Beeli community dictionary"`

**Format:** WebP via `next/image`. Max 150KB for content images, 200KB for hero.

---

## Internal Linking Plan

Every public page links to at least 3 others using descriptive anchors:

| From Page | Link To | Anchor Text |
|---|---|---|
| Homepage | /learn/izon | "start learning Izon for free" |
| Homepage | /dictionary/izon | "Izon–English dictionary" |
| Homepage | /for-educators | "classroom tools for educators" |
| /learn/izon | /dictionary/izon | "look up Izon words" |
| /learn/izon | /listen | "audio lessons from native speakers" |
| /learn/izon | /for-educators | "teaching Izon in the classroom?" |
| /dictionary/izon | /learn/izon | "start an Izon lesson" |
| /for-educators | /learn/izon | "browse the Izon curriculum" |
| Every blog post | relevant page | contextual links to /learn, /dictionary, /for-educators |

Never use "click here", "read more", or "learn more" as anchor text.
