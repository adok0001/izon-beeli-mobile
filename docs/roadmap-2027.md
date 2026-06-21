# Beeli — 2027 Roadmap

**Flagship:** Izon (Ijaw)  
**Goal date:** 31 December 2027  
**Current date:** June 2026

---

## Targets

| Credential | Current | Target |
|---|---|---|
| Izon dictionary entries | ~402 | 22,000+ |
| Yoruba entries | ~96 | 10,000+ |
| Efik entries | ~5 | 5,000+ |
| Hausa entries | ~100 | 5,000+ |
| Native-speaker audio recordings | 0 | 500+ (Izon) |
| Institutional partners | 0 | 9 |
| App downloads | — | 20,000+ |
| Countries | — | 20+ |
| Publications | 0 | 2 (Izon Pocket Dictionary + Izon Thesaurus) |
| Library deposits | 0 | SOAS, Oxford, Harvard |
| Recognition | — | ALCA Award submission |

---

## Phase 1 — Q3 2026 (July – September)
### Anchor the institutional foundation

> **Principle: separate who *knows* from who *digitizes*.** The campus pipeline is a
> velocity engine for entering and verifying words. It is not the source of the rarest
> vocabulary. The deepest Izon — proverbs, ritual language, occupational and dialectal
> forms — lives with elders, not undergraduates. The contributor strategy must reach
> both groups deliberately, or it stalls exactly when the data becomes thesaurus-grade.

**A. Knowledge holders — the source (rare, irreplaceable vocabulary)**

These are who the *content* ultimately comes from. Approach via institutions that carry
legitimacy with them:
- **Ijaw National Congress** and the **Bayelsa State Council of Traditional Rulers** — legitimacy and a direct line to elders
- **Bible translation bodies** (Izon scripture exists; its translators are among the most rigorous living Izon lexicographers — a known, underused asset for low-resource languages)
- **Community radio** broadcasting in Izon — they produce spoken-language content daily
- **Festival/cultural associations** — praise-singers and oral-tradition keepers
- **Diaspora associations as contributors** (not only as a distribution channel) — diaspora elders are often the most motivated keepers of the language

**B. Digitizers — the velocity (entry + verification at scale)**

- **Niger Delta University** (Wilberforce Island, Bayelsa) — most natural partner; Ijaw studies is central to their mission
- **Federal University Otuoke** (Bayelsa) — founded in an Ijaw town; institutional alignment is explicit
- **University of Port Harcourt** — larger institution, strong linguistics and African language faculty
- **Secondary schools** in Ijaw LGAs where Izon is taught — an underrated, motivated digitizing corps

Partnership model: co-authorship credit on the dataset, student research projects contribute verified entries under faculty supervision, Beeli provides the contribution and review workflow (already built). Crucially, students don't *invent* rare vocabulary — they capture and verify it from the knowledge-holders in group A.

Action: Draft and send proposals to **one knowledge-holder institution** (Ijaw National Congress or a Bible-translation body) and **one digitizer institution** (NDU). Target: 2 signed MoUs by end of September — one of each type.

**Content — first 3,000 Izon entries**

Focus on high-frequency categories first (learner-facing utility):
- Greetings & courtesies (complete)
- Family & relationships
- Body parts
- Food & drink
- Verbs & actions
- Time & days
- Market & money

Dialect coverage map: Kolokuma-Opokuma (prestige/standard), Nembe, Brass. The `dialectalVariants` field is ready.

**Phase 1 milestones**
- [ ] 2 partnership MoUs signed — one knowledge-holder institution, one digitizer institution
- [ ] 3,000 Izon entries
- [ ] Dialect coverage mapped across 3 dialects
- [ ] ALCA — join the association; understand nomination calendar

---

## Phase 2 — Q4 2026 (October – December)
### Audio competition + first publication

**🎵 "Speak Izon" — a creative-contribution campaign**

A public campaign to gather native-speaker audio for the dictionary. Deliberately **not**
a per-word bounty: paying cash for single words rewards reach over substance, invites
spam and dialect disputes over money, and produces forgettable clips that market nothing.
Instead the submission format itself demands effort — which is self-limiting (you can't
spam a folktale), produces exactly the rare assets we need, and doubles as shareable
marketing content.

**Two tiers, mixed audience:**

- **Tier 1 — "Teach a Word" (low barrier, volume + reach).** Record a word with its
  meaning and one example sentence; upload with `#SpeakIzon`, tag `@beeli`. Open to
  everyone — this is the youth/diaspora reach engine and feeds lesson content directly.
- **Tier 2 — "Keep the Word" (high effort, depth + headline prizes).** One of:
  - **Folktale / oral-history retelling** — dense rare vocabulary + culture
  - **Proverb with meaning & context** — this *is* the Phase 4 rare vocabulary, gathered early
  - **Praise-song / work-song** — Ijaw oral tradition, unmatched as social content
  - **Elder interview** — a younger person records an elder (the bridge format: youth do
    the uploading, elders are the source — captures depth *and* gets social reach)

- **Prize structure:**
  - Tier 2 headline prizes: ₦50,000 (1st), ₦25,000 (2nd), ₦10,000 (3rd) — monthly rounds
  - Tier 1: rolling micro-rewards — Beeli Plus, "Voice Contributor" badge, XP multiplier,
    monthly draw among valid entries (keeps the barrier low without per-word cash)
- **Judging:** weighted toward **authenticity and depth** by an elder + faculty panel.
  Community vote (TikTok likes/shares) is an engagement layer only — it does **not**
  decide rankings.
- **Mechanics:** monthly Tier-2 theme (e.g. "October: Folktales", "November: Proverbs");
  Tier 1 runs continuously.
- **Goal:** 500 verified audio recordings by December 2026.
- **Secondary effect:** Tier 2 winning entries are the campaign's marketing — a strong
  folktale clip reaches the Ijaw diaspora (UK, US, Canada) far better than a word ever could.

Action items:
- Design the two-tier brief, rules, and judging rubric (depth-weighted)
- Build the TikTok presence (`@beeli`)
- Wire up audio submission flow in-app (contribution type `entry_audio` already exists);
  add a structured field for Tier-2 context (story/proverb meaning, elder attribution)
- Recruit panel judges: faculty (Tier 1 accuracy) + elders/knowledge-holders (Tier 2 authenticity)
- Launch October 1, 2026

**Izon Pocket Dictionary — first publication**

- Draft and publish with an ISBN
- Digital-first is sufficient; what matters is the ISBN registration
- Submit to **SOAS Library** immediately on publication — they hold the strongest Ijaw/Niger Delta linguistics collection in the UK
- This begins the "held in the collections of" credential

**Partner expansion — reach 5**

Add Isaac Jasper Boro College and Ambrose Alli University.

**Phase 2 milestones**
- [ ] TikTok campaign live by October 1
- [ ] 500 verified audio recordings
- [ ] 8,000 Izon entries
- [ ] Izon Pocket Dictionary published (ISBN)
- [ ] Submitted to SOAS
- [ ] 5 institutional partners

---

## Phase 3 — Q1–Q2 2027
### Depth + recognition pipeline

**Thesaurus structure**

Shift from quantity to depth. The synonyms, antonyms, semantic hierarchies, and etymology fields are built — now the work is filling them systematically. A 12,000-entry Izon dataset with full semantic structure becomes the **Izon Thesaurus** — a rarer and more significant publication than a dictionary alone, and the first of its kind for the language.

**Reach 9 institutional partners**

Remaining 4 should include:
- **University of Ibadan** or **UNILAG** — national credibility
- **Obafemi Awolowo University** — strong linguistics faculty
- One international institution (SOAS-affiliated researcher, or University of London)

**ALCA Award**

Research the specific nomination process and timeline. Begin preparing the submission. The body of work by mid-2027 — 15,000+ entries, 9 partners, two publications, 500+ audio recordings — is a credible nomination package.

**Diaspora reach**

Ijaw communities in the UK (London), US (Houston, New York), and Canada (Toronto). Community association partnerships are both a distribution channel and a credibility signal. Target: 15+ countries by June 2027.

**Phase 3 milestones**
- [ ] 15,000 Izon entries
- [ ] Thesaurus structure complete (synonyms/semantic domains filled for top 5,000 entries)
- [ ] 9 institutional partners signed
- [ ] ALCA submission drafted
- [ ] Izon Thesaurus publication begun
- [ ] 12,000+ app downloads
- [ ] 15+ countries

---

## Phase 4 — Q3–Q4 2027
### Close out

**Sprint to 22,000 entries**

The last 5,000 entries are the rarest vocabulary — proverbs, technical terms, ritual language, full dialectal forms. Academic partnerships pay off most here: elders and specialist faculty hold this knowledge. This is where university collaboration becomes irreplaceable.

**Library deposits**

Once the Izon Thesaurus is published:
- Submit to **Harvard Widener Library** (African Studies acquisitions)
- Submit to **Bodleian Library, Oxford** (African languages collection)
- SOAS deposit already done in Phase 2

The submission is proactive — acquisitions librarians need a direct approach, not passive hope.

**ALCA Award submission**

Submit if the cycle is open. The 2028 cycle will also be strong. What matters is that the body of work is fully documented and the submission is ready.

**Downloads & countries**

- 20,000+ downloads requires sustained diaspora-community outreach
- 20+ countries: Ijaw diaspora is spread across Nigeria, UK, US, Canada, Germany, Finland, and more — community partnerships unlock these counts

**Phase 4 milestones**
- [ ] 22,000 Izon entries
- [ ] 10,000 Yoruba, 5,000 Efik, 5,000 Hausa
- [ ] Harvard and Oxford deposits confirmed
- [ ] ALCA Award submitted
- [ ] 20,000+ downloads
- [ ] 20+ countries
- [ ] Izon Thesaurus published

---

## Critical Path

```
University partnership (NDU)
    → Student contributor pipeline
        → Entry count velocity
            → Thesaurus structure
                → Publication
                    → ALCA submission
                        → Library deposits
```

**The TikTok audio campaign** runs parallel to this and feeds a different asset — native-speaker audio — which is the single feature that most differentiates a lexicographic resource from a word list.

---

## Next Actions

1. **Draft two partnership proposals** — one knowledge-holder body (Ijaw National Congress / Bible-translation org) and one digitizer institution (NDU)
2. **Design "Speak Izon" two-tier campaign** — Tier 1/Tier 2 rules, depth-weighted judging rubric, prize structure, launch date
3. **Build audio submission flow** — in-app TikTok-linked contribution UI, with structured Tier-2 context + elder attribution fields
4. **Recruit judging panel** — faculty (accuracy) + elders/knowledge-holders (authenticity)
5. **Join ALCA** — establish membership before pursuing the award
6. **ISBN registration research** — process for Nigerian publishers
