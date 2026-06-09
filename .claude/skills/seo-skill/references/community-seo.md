# Beeli — Community SEO & App Store Optimization

Beeli has no physical location to rank for, but two non-Google discovery
channels matter enormously: the App Store / Google Play (ASO), and word-of-
mouth within Izon diaspora and African language learning communities. Both
channels compound over time and are far less competitive than web SEO.

---

## App Store Optimization (ASO)

### iOS App Store

**App name (30 chars max):**
`Beeli — Learn Izon & African`

**Subtitle (30 chars max):**
`Language & Heritage Learning`

**Keywords field (100 chars, comma-separated — these are invisible to users but drive search):**
```
izon,ijaw,african language,heritage language,niger delta,language learning,Izon lessons,Aurufie
```

**Description (first 3 lines — shown before "more"):**
> Beeli is the only app in the world for learning Izon — the language of the
> Niger Delta, spoken by over 2 million people. Structured lessons, native
> audio, interactive quizzes, and a community dictionary — free to start.

**Full description structure:**
1. Hook — the Izon gap (no other app teaches it)
2. Feature list: lessons, audio, quizzes, matching games, dictionary, journaling, community
3. For the diaspora: reconnect with your language and culture
4. For educators: classroom tools and progress tracking
5. For contributors: help preserve Izon for future generations
6. Available in English, French, and Nigerian Pidgin
7. Free to start, iOS and Android

**Screenshots (required, in order):**
1. Home screen / learn tab with Izon lesson cards
2. Audio lesson in progress
3. Quiz/matching game
4. Dictionary lookup with pronunciation
5. Educator panel or leaderboard

**App Store category:** Education (primary), Reference (secondary)

**Age rating:** 4+ (no restricted content)

---

### Google Play Store

**Short description (80 chars):**
`Learn Izon — the only app with structured Niger Delta language lessons.`

**Full description:** Same structure as iOS, adapted for Play Store markdown.

**Tags:** Language Learning, Education, African Languages, Cultural Heritage

---

## ASO Keyword Research Notes

High-value App Store search terms (low competition, relevant intent):

| Search term | Priority |
|---|---|
| `izon language` | Critical — own this |
| `ijaw language` | Critical — own this |
| `african language learning` | High |
| `heritage language` | High |
| `niger delta language` | High |
| `learn nigerian language` | Medium |
| `african language app` | Medium |
| `language preservation` | Medium |

---

## Diaspora Community Presence

The Izon and broader Nigerian diaspora is the highest-concentration user
base. Community word-of-mouth within these networks is worth more than any
paid channel.

### Priority Communities

**Facebook groups:**
- Izon/Ijaw diaspora groups (search "Izon", "Ijaw", "Niger Delta")
- Nigerian parents abroad groups (high intent for heritage language teaching)
- African language learning groups

**WhatsApp / Telegram:**
- Izon community channels in the UK, Canada, US
- Nigerian educators and cultural organisations

**Reddit:**
- r/languagelearning (1M+ members — blog posts about Izon perform here)
- r/nigeria
- r/africanlanguages (if exists or create it)

**Twitter/X:**
- Tag: #IzonLanguage #NigerDelta #AfricanLanguages #HeritageLanguage
- Engage with: Nigerian cultural accounts, African language researchers, diaspora educators

### Community Engagement Rules

1. **Provide value first** — share lessons, words, or cultural content before any promotion
2. **Answer language questions** — be the go-to source for Izon queries in groups
3. **Feature community members** — highlight contributors, learners, and educators
4. **Never spam** — one announcement per group per release; ongoing value-add posts only

---

## Educational Partnerships

Institutional partners are the highest-quality backlinks and drive bulk sign-ups.

### Target Partner Types

| Partner Type | Example | What Beeli Offers | What We Get |
|---|---|---|---|
| Nigerian cultural organisations | Ijaw National Congress, Izon cultural associations | Free educator accounts, content support | Backlinks, community endorsement, press |
| Universities with African studies depts | SOAS (London), Univ. of Lagos, Howard | Free institutional access | .edu/.ac.uk backlinks, researcher citations |
| Nigerian language teachers abroad | Diaspora community schools in UK/Canada | Free classroom tools | Organic growth, teacher referrals |
| African diaspora media | Nigerian news sites, diaspora magazines | Story + embed | High-DA backlinks, audience coverage |

### Outreach Pitch (one paragraph)
> "Beeli is building the first complete digital learning resource for the
> Izon language. We're looking to partner with [organisation] to give your
> community free access to structured lessons and our growing dictionary. In
> return, we'd love a mention on your website and a post to your community.
> This takes 10 minutes to set up — let us know if you're interested."

---

## Press & Earned Media

Beeli is genuinely newsworthy in several verticals:

| Angle | Target Publications |
|---|---|
| "Only app for learning Izon" | Tech Cabal, Techpoint Africa, Disrupt Africa |
| Heritage language preservation tech | The Guardian, BBC Africa, Al Jazeera |
| Diaspora identity and language | Nigerian Tribune, Vanguard, This Day |
| Ed-tech for minority languages | EdTech Magazine, Inside Higher Ed |
| African startup / founder story | TechCrunch Africa, Quartz Africa |

**Press page:** Ensure `izon-beeli.com/press` (or `/about`) has a press kit:
- App screenshots in 3 sizes
- Logo (light + dark versions)
- One-paragraph company description
- Key stats (languages supported, users, dictionary entries)
- Contact email for press enquiries

---

## Review Generation Strategy

Reviews on the App Store and Google Play directly affect ASO rankings.

**In-app review prompt timing:**
- Trigger after a user completes their 3rd lesson (high satisfaction moment)
- Trigger after a quiz score improves
- Never prompt immediately on launch

**After completing a lesson:**
Use `expo-store-review` (`StoreReview.requestReview()`) — Apple's native prompt.
Only call after meaningful engagement, and at most once per 365 days per user.

**Respond to all reviews publicly:**
- Positive: "Thank you! More languages coming soon."
- Negative: Acknowledge the issue, explain what's being done, offer to help via [support email].
