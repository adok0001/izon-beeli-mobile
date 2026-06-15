# Beeli — Launch Marketing Campaigns (June 2026)

Aligned to the 90-day plan in `.claude/strategy/STRATEGY_BRIEF.md` §8 and the
content pillars in `docs/marketing-strategy.md` §9. Promotable languages for
this cycle (owner-set, June 2026): **Izon, Igbo, Swahili, Oromo, Amharic, Twi,
Hausa, Yoruba.** This extends the strategy brief's depth-cleared six by adding
**Izon** (Niger Delta flagship) and **Oromo** (East Africa) — promote a first
lesson before featuring; pull back if depth is thin.

Every campaign lists its **conversion job** first — the rule is no copy without
a named job.

> **Facts reconciled to the live codebase (2026-06-15):** app v2.3.0, 9 regions,
> app name "Beeli". The public web landing page is **shipped** (so Campaigns 1–3
> have a destination); the remaining launch blockers are the @beeliapp social
> handles, PostHog event verification in the prod build, and the outstanding
> creative assets — see *Blockers* below.

---

## Campaign 1 — "70 vs 4" (category flag-plant)

- **Conversion job:** install + press coverage. Plant the category before a
  funded incumbent does.
- **Segments:** Diaspora Reconnector (1), press.
- **Channels:** PR pitch (Days 15–30), Twitter/X, Product Hunt launch copy,
  App Store description lead.
- **Timing:** Days 15–30 (soft launch), refreshed monthly with each Deep Dive.

**Hook (use verbatim everywhere):**
> Duolingo covers 4 African languages. Beeli covers 70.

**Press subject line:**
> Duolingo covers 4 African languages. This app covers 70 — and pays native speakers to grow it.

**X thread opener:**
> Africa has 2,000+ living languages. The world's biggest language app teaches 4 of them.
> We built Beeli to teach 70 — Yoruba, Igbo, Swahili, Hausa, Amharic, Twi, Izon, Ge'ez… audio-first, free, built with native speakers. 🧵

**Product Hunt tagline:** "Your language, your roots. 70+ African languages, audio-first, free."

---

## Campaign 2 — "Your family will notice" (diaspora trigger moments)

- **Conversion job:** install → first lesson completed within 3 minutes (the
  Hook stage of the retention framework).
- **Segments:** Diaspora Reconnector. Speak to the trigger event — a child
  born, a parent aging, a trip home — never to "language learning."
- **Channels:** TikTok + IG Reels (primary), IG carousel.
- **Timing:** evergreen from Day 15; 3 Reels/week.

**Reel concepts (15–30s, phone-native):**
1. *"The call home."* POV: you finally answer your grandmother in Yoruba.
   On-screen: "Stop saying you'll learn later. Start today — your family will
   notice." CTA: "Your Yoruba is waiting. Link in bio."
2. *"Do you speak your language?"* challenge — stitch bait. Ask diaspora
   creators to say one sentence in their language. Caption names the language
   every time ("That's Igbo. Learn yours on Beeli.").
3. *"First word."* New parent learns the word for "my child" in Swahili —
   *mwanangu* — before the baby's first birthday.

**Caption library:**
- "The culture is deeper when you understand the language."
- "Not a hobby. A homecoming."
- "Ọmọ tí kò mọ ìtàn, yóò sọnù — a child who doesn't know their history will be lost. Start with the language. (Yoruba)"

---

## Campaign 3 — Language of the Week (content engine flagship)

- **Conversion job:** follower → install; also the weekly content backbone
  that everything else cross-posts from.
- **Segments:** Cultural Curious (3) + Diaspora (1).
- **Channels:** TikTok/IG/X, cross-posted; sourced from `mobile/lib/data/`.
- **Timing:** weekly from Day 15. **Week 1: Yoruba** (per the launch plan),
  then Igbo → Swahili → Twi → Hausa → Amharic, repeating.

**Format (fixed, per the §9 pillar):** 5 words + 1 proverb + 1 cultural fact +
CTA. Visuals use the Adinkra aesthetic, Ocean Blue/Ancestral Purple, Plus
Jakarta Sans 700. Pull cultural facts from `mobile/lib/data/cultural/` (e.g.
Ifa divination for Yoruba week, Kente *adwini* meanings for Twi/Akan week).

**Yoruba Week 1 sample:**
- Words: ẹ káàrọ̀ (good morning) · ẹ ṣé (thank you) · ìdílé (family) · ilé (home) · ìfẹ́ (love)
- Proverb: *Àgbà kì í wà lọ́jà kórí ọmọ tuntun wọ́* — an elder cannot be in the market and let a child's head hang wrong.
- Fact: Ifa divination, a UNESCO Intangible Cultural Heritage, preserves 256 Odu verses of Yoruba philosophy — orally.
- CTA: "Hear it spoken. Your Yoruba starts on Beeli — free."

---

## Campaign 4 — #BeeliChallenge + share cards (zero-CAC viral loop)

- **Conversion job:** existing learner → public share → friend install. This
  is priority 2 of the strategy: convert emotional peaks into UGC.
- **Segments:** all learners; Heritage Students (4) via multiplayer battles.
- **Channels:** in-app share cards (`mobile/components/share/`) → TikTok/IG;
  in-app push at level-up and streak milestones.
- **Timing:** Days 31–60.

**Mechanic:** post your level-title card ("I am a Guardian of Igbo") or a
7/30/100-day streak card with #BeeliChallenge and tag someone who *should*
speak their language. Identity statement, not a points score.

**Push copy (keys in `locales/`):**
- Level-up: "You're now an Elder of Swahili. Some titles are worth sharing."
- Streak at risk (Sunset Orange): "Your 12-day Hausa streak ends at midnight. Two minutes keeps it alive."
- Re-engagement: "Your Igbo didn't go anywhere. Pick up where you left off."

---

## Campaign 5 — Beeli Educator outreach (revenue path)

- **Conversion job:** educator demo booked → classroom activated. 90-day
  target: 5+ accounts, $500+ MRR.
- **Segments:** Educator/Preservationist (2). Heritage schools before
  universities.
- **Channels:** direct email (Appendix D templates), X educator amplification,
  educator one-pager (asset still to create — see Brand Asset Status).
- **Timing:** Days 15–30: contact 5 educators + 10 diaspora orgs (free
  classrooms for hosting events).

**Email subject:** "A ready-made classroom for teaching Yoruba — built with native speakers"

**Body frame:** lead with mission (preservation, oral-first pedagogy for tonal
languages), then mechanics (classroom portal, leaderboard, multiplayer quiz
battles your students will actually fight over), then the offer (free classroom
for community orgs / Starter $99/mo for schools). Functional positioning line:
"Learn African languages, interactively."

### 3-touch cold sequence — heritage schools & diaspora orgs

Extends Appendix D, Template 1. Send from a real founder address, one segment
at a time, max one classroom per reply. Personalize `[Language]` to the org's
actual language; never send "African language." Space touches ~4 business days.

**Touch 1 — the offer (Day 0)**
> **Subject:** A free [Language] classroom for your students — built with native speakers
>
> Hi [Name],
>
> I'm [Founder] from Beeli, a free, audio-first app for African languages. We
> cover [Language] alongside 70+ others — Duolingo covers 4 — with lessons and
> cultural content built *with* native speakers, not translated into them.
>
> I'd like to give [Org] a free classroom: your students join your class, you
> assign lessons and see who's actually practicing, and there are no ads and no
> cost. Setup takes about two minutes.
>
> Worth a 15-minute call this week, or shall I send a setup link?
>
> [Founder]

**Touch 2 — the proof (Day 4, if no reply)**
> **Subject:** Re: A free [Language] classroom for your students
>
> Hi [Name], quick follow-up. The part teachers tell us actually moves their
> students is the multiplayer quiz battles and the leaderboard — heritage
> learners who'd never do homework will fight to stay top of the class in
> [Language]. Audio-first matters too: [Language] is an oral tradition, and the
> lessons are listening-led, not tap-the-English-word.
>
> Happy to set the classroom up *for* you and hand it over ready to go. Want me
> to?
>
> [Founder]

**Touch 3 — the soft close (Day 8, if no reply)**
> **Subject:** Closing the loop on [Org]'s [Language] classroom
>
> Hi [Name], I'll stop here so I'm not crowding your inbox. The free classroom
> offer stays open whenever the timing's right — just reply and I'll have it
> live the same day. And if [Language] preservation is part of your mission, I'd
> genuinely love to feature your students' progress in our community spotlight.
>
> Either way, thank you for the work you're doing.
>
> [Founder]

**Sequence rules:** stop the sequence on any reply (route to a call or a setup
link). Diaspora community orgs always get the *free* classroom; schools hear
Starter $99/mo only after they've used the free tier and asked about scale. Lead
mission, close on mechanics — never open with pricing.

---

## Campaign 6 — Preservation advocacy: "Languages you can't learn anywhere else"

- **Conversion job:** editorial backlinks + brand authority (SEO/PR), feeding
  Campaign 1's press cycle. Not an install campaign.
- **Segments:** press, Educators, Cultural Curious.
- **Channels:** monthly Cultural Deep Dive blog post + 1 PR pitch; quarterly
  long-form advocacy piece.
- **Timing:** Days 31–60 first posts (Yoruba, Swahili, Amharic per launch
  plan); advocacy piece in Q3 on Niger Delta languages (Izon, Isoko, Urhobo,
  Nembe) and the contributor bounty model — "competitors pay editorial teams
  per language; Beeli's community compounds for free."

**Note:** advocacy pieces may *name* endangered languages (Ogoni/Khana,
Tamazight, Coptic, Margi) as preservation stories, but install CTAs route to
depth-cleared languages only.

---

## Cadence summary

| Rhythm | Asset | Campaign |
|---|---|---|
| Daily | Word of the Day / proverb post | 2, 3 |
| Weekly | Language of the Week | 3 |
| 3×/week | TikTok/IG Reels | 2 |
| Bi-weekly | Learner Story | 2 |
| Monthly | Cultural Deep Dive + PR pitch | 1, 6 |
| Quarterly | Preservation advocacy long-form | 6 |
| Event-driven | Share-card pushes, educator follow-ups | 4, 5 |

## Blockers to clear before launch (from the strategy brief)

1. **(Cleared)** Public landing page — **shipped** at the web root (`web/app/page.tsx`
   renders `<LandingPage />` with SEO metadata, `sitemap.ts`, `robots.ts`, OG image,
   and dedicated educator routes). Campaigns 1–3 now have a destination; remaining
   work is building out language-specific landing content for SEO.
2. @beeliapp social handles not yet created — and the web entity's `sameAs` is still
   empty (`web/app/layout.tsx` TODO), so search engines can't associate the profiles
   with the brand.
3. PostHog event verification — the client is gated on `EXPO_PUBLIC_POSTHOG_API_KEY`
   and silently no-ops if the key is unset, so confirm events fire in the prod build.
   Channel attribution gates the Day 61–90 double-down decision.
4. Assets still to create: social profile images, store screenshots, app
   preview video, educator one-pager, press kit.
