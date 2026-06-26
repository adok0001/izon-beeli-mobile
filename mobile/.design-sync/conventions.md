# Beeli "Museum" — mobile (React Native) design system

These are **React Native** components from the Beeli mobile app, rendered here via
`react-native-web`. They are **self-styling**: each component reads the Museum
theme internally, so you compose them and pass props — you do **not** wrap them in
a theme provider or pass `className`/CSS to style them.

## The look (dark-first "Museum")

Dark-first, gallery aesthetic. The signature accent is **bronze gold `#C4862A`**
(`accentLight #D89A3A`, `accentDark #A66E1C`). Core dark surfaces: page bg
`#0D0F1A` (ink), raised card `#1A1D2C`, hairline borders at low-opacity parchment
(`#F7F2E8` at ~8–12% alpha). Primary text is near-white parchment; secondary text
is muted warm grey. Semantic states use green/red/amber/blue with matching
`*Bg`/`*Border` tints. When you build your own layout glue around these
components, match that palette — bronze accents on deep near-black surfaces, never
pure black or pure white.

## How to compose

Import components from the library and lay them out with React Native primitives
(`View`, `Text`, `Pressable`) using inline `style` props (RN style objects, not
CSS). Realistic content matters — these are learning-app cards (lessons, proverbs,
word-of-the-day, XP, challenges).

```jsx
import { View } from 'react-native';
import { SectionHeader, Button, ProverbCard } from '<library>';

<View style={{ backgroundColor: '#0D0F1A', padding: 20, gap: 16 }}>
  <SectionHeader eyebrow="Today" title="Continue learning"
    subtitle="Pick up where you left off." />
  <ProverbCard proverb={{ text: 'Beni mienge, beni saramu.',
    translation: { en: 'Still water runs deep.' },
    meaning: { en: 'Quiet people carry the most depth.' } }} />
  <Button label="Begin lesson" onPress={() => {}} variant="primary" />
</View>
```

## Two component families

- **Primitives** (`Button`, `Badge`, `SectionHeader`, `ExhibitDivider`,
  `ScreenContainer`, `LocalizedTextInput`, `LanguagePicker`, `DueDatePicker`,
  `IconSymbol`) — pure, prop-driven. Read each `<Name>.d.ts` for the exact API
  (e.g. `Button` has `variant`: primary/secondary/ghost/danger, `size`: sm/md/lg).
- **Content cards** (`XpLevelBadge`, `ProverbCard`, `DiscoverCard` take data via
  props; `WordOfTheDay`, `ProverbOfTheDay`, `UpNextCard`, `WordChallengeCard`,
  `DailyChallengeCards`, `ContributionSpotlightCard` **fetch their own data**
  through TanStack Query + Clerk auth). In a real screen the data-fetching cards
  need the app wrapped in `QueryClientProvider`, `ClerkProvider` and an i18next
  provider; in this design environment their content is seeded for preview.

## Notes

- `IconSymbol` renders a **placeholder glyph** here (the native icon font isn't
  shipped with this sync) — treat it as an icon slot, sized via `size`/`color`.
- Read each component's `<Name>.prompt.md` and `<Name>.d.ts` before composing — the
  `.d.ts` is the authoritative prop contract.
