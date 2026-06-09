# Beeli — Brand Guidelines

Source: `docs/marketing-strategy.md` §5 (Brand Identity & Messaging) and
`mobile/constants/theme.ts` / `mobile/tailwind.config.ts`.

---

## Positioning Lines

Lead with the identity line for diaspora acquisition; use the functional line for
educators and institutions.

| Line | Angle | Best channel |
|---|---|---|
| **"Your language, your roots."** | Identity (primary) | Social, ASO, hero |
| "The language of your ancestors. Now in your pocket." | Diaspora, emotional | Social ads, PR |
| "Hear Africa speak." | Audio-first | App Store subtitle |
| "Learn African languages, interactively." | Functional | SEO, educator outreach |

**Messaging hierarchy** (build heroes and listings in this order):

| Level | Message |
|---|---|
| Headline | "Your language, your roots." |
| Sub-headline | "70+ African languages. Audio-first. Free." |
| Proof point | "Built with native speakers. Used by diaspora communities worldwide." |
| Differentiator | "Duolingo covers 4 African languages. Beeli covers 70." |

---

## Colour Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Ocean Blue | `#0a7ea4` | Primary CTA, UI chrome, links, active tab |
| Accent | Ancestral Purple | `#8b5cf6` | Achievement badges, level-up, premium / Plus markers |
| Highlight | Savanna Gold | gold | Cultural content highlights, streak flames, XP |
| Alert | Sunset Orange | orange | Notifications, urgency, streak-at-risk |

**IMPORTANT:** Ocean Blue and Ancestral Purple are fixed. Do not substitute them.
The palette is bright and confident — never muted, never the safari/earth-tone
cliché. Dark mode is first-class (React Navigation `ThemeProvider`, system
preference) — verify every colour pairs against both light and dark surfaces.

Source of truth in code: `mobile/constants/theme.ts` (`Colors.light` /
`Colors.dark`, tint `#0a7ea4`). In NativeWind, prefer Tailwind tokens / theme
values over hardcoded hex.

---

## Typography — Plus Jakarta Sans

Modern, globally legible, culturally neutral — deliberately *not* a "tribal" or
decorative display face. The language content carries the cultural identity; the
type stays clean so the content is the hero.

| Role | Weight | Tailwind token |
|---|---|---|
| Headlines / H1–H2 | 700 Bold | `font-heading` (`PlusJakartaSans_700Bold`) |
| Subheads / accent | 600 SemiBold | `font-heading-medium` (`PlusJakartaSans_600SemiBold`) |
| Body / UI | System / default | default stack |

Transcripts and lesson text may use the platform reading stack for legibility —
the brand face is for chrome and headings, not long-form reading.

---

## Visual Motifs

- **Adinkra symbol aesthetic** is Beeli's strongest owned visual identity. Use it
  for social posts, cultural-content headers, print, and section dividers.
- **Region-grouped language identity** — the language picker's regional groupings
  (Niger Delta, Southwest Nigeria, East Africa, …) are themselves a brand asset:
  breadth made visible.
- **Real learner progress** as imagery — streak calendars, level titles
  ("Elder," "Guardian," "Legend"), XP bars. The product *is* the brand visual.

---

## Tone of Voice

- **Warm but not patronizing** — speak to learners as adults reconnecting with
  something they already partially own, never as remedial students.
- **Culturally grounded** — cite real proverbs, real traditions, specific
  language names. Never generic "African" imagery or vague continental references.
- **Precise about language** — "Izon," not "an African language." Precision
  signals respect and builds trust with communities.
- **Aspirational without hustle-culture** — the motivation is identity, not
  productivity.

### Do

- Name specific languages and communities in every piece of content
- Use actual proverbs in copy — memorable, culturally resonant, and free
- Show real level titles, real streaks, real contributor names
- Feature community contributors by name and language

### Do Not

- Homogenize Africa ("the African language" — Africa has 2,000+ languages across 54 countries)
- Use safari/wildlife imagery or generic Kente patterns as continental stand-ins
- Frame the app as remedial or "for people who failed to learn their language"
- Use the word "exotic" to describe any language or culture on the platform

### Copy voice examples

✅ *"Stop saying you'll learn later. Start today — your family will notice."*
✅ *"The culture is deeper when you understand the language."*
✅ *"I am a Guardian of Igbo." A statement of self, not a points score.*

❌ *"Experience the exotic sounds of the African continent."*
❌ *"Learn any African language!"* (which one? name it)

---

## Brand Asset Status

See `docs/marketing-strategy.md` Appendix A for the live checklist. App icon,
adaptive icon, splash, favicon, OG image, and share-card templates are done
(`mobile/assets/images/`, `mobile/components/share/`, `web/app/opengraph-image.tsx`).
Social profile images, store screenshots, the app preview video, the brand
guidelines PDF, the educator one-pager, and the press kit are still to create.
