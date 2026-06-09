# Beeli — Strategy Brief (June 2026)

*Distilled from `docs/marketing-strategy.md` (v1.0, May 2026), the `docs/` strategy assets in this folder, and the codebase.
Beeli is an audio-first African language learning platform on iOS, Android, and
Web. App v1.42.0. Owner: Tamara Adokeme.*

## 1. Strategic situation

Beeli is the first audio-first platform built exclusively for the breadth and
depth of African language learning — not a Duolingo clone with African skins, but
a purpose-built cultural learning engine. It is **live and quietly shipping** with
no public marketing presence yet.

The opportunity is a category nobody owns. Africa has 2,000+ living languages and
700M+ speakers, plus tens of millions of diaspora. The category leader, Duolingo
(500M+ users), covers exactly **4** African languages. Beeli covers **70+** across
9 regions (Niger Delta, Southwest/Southeast/North-Central/North Nigeria, West,
East, North, and Southern Africa). The threat is not a rival — it's a funded
incumbent diluting the category before Beeli plants its flag.

**The core insight:** diaspora users are not language hobbyists. They are
reconnecting with culture, family, and self. A child born, a parent aging, a
return trip home — these trigger events produce intense, emotionally motivated
learning that generic apps fail to serve. Marketing must speak to that motivation
first, mechanics second.

## 2. The three strategic priorities

1. **Own the category** — establish Beeli as *the* African language platform via
   SEO, PR, and community partnerships before a funded competitor moves in.
2. **Convert diaspora motivation into viral behavior** — turn emotional moments
   (level-ups, streaks, proverbs) into share-card posts that acquire at zero CAC.
3. **Unlock institutional revenue** — activate the already-built educator portal
   as a paid tier without compromising the free community.

## 3. The product (the moat is the product)

Three differentiators a funded competitor cannot replicate quickly:

- **Audio-first architecture.** African languages are oral traditions first.
  Segment-synced transcripts, tap-word lookup mid-playback, 0.5×–2× speed, ±15s
  skip, persistent audio bar. Duolingo's tap-the-translation model was built for
  Latin-script European languages; Beeli was built for tonal, oral languages.
- **Breadth without sacrificing depth.** Niger Delta languages (Izon, Isoko,
  Urhobo, Itsekiri, Nembe), endangered languages (Ogoni/Khana, Tamazight, Coptic,
  Margi), and East African scripts (Ge'ez/Fidel) alongside Yoruba, Igbo, Hausa,
  Swahili. No competitor touches this range.
- **Community contributor flywheel.** The bounty system pays native speakers in
  XP to submit vocabulary and audio. More community per language → richer content
  → more learners. This is both the content-cost moat and the media story —
  competitors pay editorial teams per language; Beeli's content compounds for free.

Built and live: audio lessons + interactive transcripts, dictionary, quiz engine
(4 types, 5 hearts), daily challenges, streaks + freeze, XP + level titles
(Newcomer → Listener → Scholar → Elder → Guardian → Legend), leaderboard,
multiplayer quiz battles (PartyKit), feed, contributions/bounties, journal,
classroom/educator portal, English/French i18n, share cards, PostHog analytics.

## 4. Target segments

1. **Diaspora Reconnector (primary)** — 25–45, abroad, trigger-event driven.
   Discovers via TikTok/IG proverbs and share cards.
2. **Educator / Preservationist** — mission-driven; the B2B2C door and revenue path.
3. **Cultural Curious** — 18–30, enters via Adinkra/proverbs/Word of the Day.
4. **Heritage Language Student (B2B2C)** — 8–22, arrives via a teacher; hooked by
   leaderboard and multiplayer.

## 5. Monetization (free is the moat)

All language learning, gamification, community, and cultural content stay
**permanently free**. Monetization rides on top and never gates the flywheel:

- **Beeli Educator** (first real revenue, product already built): Classroom
  Starter $99/mo, Pro $199/mo, Institution custom. Heritage schools before
  universities. 90-day target: 5+ accounts, $500+ MRR.
- **Beeli Plus** ($4.99/mo · $39.99/yr): convenience on top — offline downloads,
  auto streak-freeze, advanced review, customization. **Hard gate: do not launch
  until D60 retention > 15%.**
- **Sponsored Language Grants**: sponsor funds a bounty pool; mission revenue +
  press + content that strengthens the free product. The strongest-aligned line.

## 6. Growth & retention

- **CAC target ~zero.** Primary channels: contributor flywheel, achievement share
  cards, proverbs, diaspora-community partnerships (free classrooms for hosting
  events — target 10 orgs in 30 days), SEO/content, ASO. Paid acquisition is
  **deferred** until organic D30 retention is known.
- **Retention framework: Hook → Habit → Attachment** — onboarding first-win in 3
  minutes; streaks + daily challenges; level-title identity + My Contributions +
  classroom + multiplayer for long-term attachment.
- **Depth-gate marketing per language** — only promote languages whose content
  delivers a strong first lesson (Yoruba, Igbo, Swahili, Hausa, Amharic, Twi
  lead). A thin first lesson burns an emotionally-motivated download.

## 7. KPIs

- **North Star: Daily Active Learners (DAL)** — completed ≥1 lesson segment or
  daily challenge that day. Not installs, not followers.
- 30/90-day: 500/3,000 installs · 300/1,500 registered · D1>40%, D7>20%, D30>10% ·
  community: 10+ classrooms and 15+ languages with >10 active learners by Day 90.
- Retention thresholds gate monetization and paid acquisition switch-on.

## 8. The 90-day launch plan

- **Days 1–14 (Foundation):** verify PostHog; build the public web landing page
  (root currently redirects to `/learn`); ship updated App Store / Play listings;
  create @beeliapp socials; write 14 days of content ahead.
- **Days 15–30 (Soft launch seeding):** 10 diaspora orgs + 5 educators contacted;
  first Language of the Week (Yoruba); Product Hunt; first press pitch with the
  "70 vs 4" headline.
- **Days 31–60 (Content engine):** first 3 blog posts (Yoruba/Swahili/Amharic);
  Contributor Spotlight; #BeeliChallenge; onboard first 3 classrooms.
- **Days 61–90 (Evaluate / monetize):** retention by channel → double down on the
  winner; soft-launch "Support Beeli" CTA to Level 5+ users; activate first
  institutional educator partnership.

## 9. Open questions and tensions

- **No public marketing presence yet** — socials, landing page, and store
  listings are all to-do; nothing acquires until Days 1–14 ship.
- **The web root still redirects to `/learn`** — SEO and paid/organic acquisition
  have nowhere to land until a public landing page exists.
- **PostHog event flow needs verification** — every retention/monetization gate
  depends on trustworthy D1/D7/D30 numbers; confirm events before spending.
- **Beeli Plus timing** — the D60>15% gate must hold; resist pressure to monetize
  before habit formation.
- **Per-language content depth is uneven** — the priority matrix (marketing
  strategy Appendix C) must drive which languages get promoted; don't market depth
  you don't have.
- **The marketing doc cites v1.16.1; actual app is v1.42.0** — keep version
  references synced to `mobile/app.json`.

---

*Role context lives in the skill family: `beeli` (product/brand source of truth),
`beeli-finance`, `beeli-growth`, `beeli-marketing`, `beeli-product`. Load `beeli`
alongside any role skill.*
