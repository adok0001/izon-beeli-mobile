# design-sync notes — Beeli Mobile (Museum)

Off-script sync: this is a **React Native / Expo** app, not a browser DS. Components
render via `react-native-web` + a forked esbuild pass. Project:
https://claude.ai/design/p/428d4ed0-35b4-454a-b6cc-3a50a4d9c803

## How it's wired (don't relearn this)

- **Scoped entry** `ds-entry.ts` re-exports only the 18 synced components, so the
  bundle doesn't pull the whole app. `--entry .design-sync/ds-entry.ts`.
- **Forks** (`overrides/`, declared in `cfg.libOverrides`):
  - `bundle.mjs` — esbuild: alias `react-native`→`react-native-web`, `jsx:automatic`
    + `jsxImportSource:nativewind`, ttf/otf/audio loaders, a `process` polyfill
    banner, and web shims for native-only modules (expo-router, @clerk/clerk-expo,
    expo-haptics/speech/av/etc., reanimated, gesture-handler, safe-area-context,
    @expo/vector-icons, react-native-view-shot). Contract pieces (stampHeader,
    reactShim, IIFE/footer) are re-exported unchanged from the bundled lib.
  - `dts.mjs` — adds the component `.tsx` tree + `@/` path resolution to the ts-morph
    project so `<Name>Props` extracts (no shipped `.d.ts`).
- **Provider** `ds-provider.tsx` (cfg.provider = DesignSyncProvider): wraps previews
  in a QueryClient **seeded** with sample data for the data-connected cards; also
  (a) pins dark mode via theme-store, (b) inits real i18next from `lib/locales/en`,
  (c) neutralizes RN `Animated.timing/spring` so entrance fades settle instantly,
  (d) renames RNW's empty `<style id="react-native-stylesheet">` so the render
  check's `[id^="r"]` root selector doesn't read it as "root empty".
- **Clerk shim returns signed-in** (`isSignedIn:true`) so auth-gated queries
  (`enabled: !!isSignedIn`) run and read their seeded cache.
- **CSS** `museum.css` is `tailwindcss` compiled from `global.css` (regenerate with
  `node_modules/.bin/tailwindcss -i ./global.css -o ./.design-sync/museum.css --config ./tailwind.config.ts`).
  **Fonts** `fonts.css` @font-faces PlusJakartaSans from `@expo-google-fonts`.

## Known render warnings (triaged — not new issues)

- `Animated: useNativeDriver is not supported` console warning — expected on RNW.
- IconSymbol renders **placeholder glyphs** (no icon font shipped). Deliberate.

## Re-sync risks (watch these)

- **Seeded data is inlined in `ds-provider.tsx`** keyed by the app's query keys
  (`["wotd",L]`, `["proverbs",L]`, `["progress","next-lesson",L]`,
  `["daily-challenges","today"]`, `["contributors",null]`). If a hook's query key or
  data shape changes upstream, the matching card goes blank — re-check that card and
  update the seed. `PREVIEW_LANG="izon"`.
- **New native modules** in a component's import graph will fail the bundle with
  "Cannot find native module" or an esbuild resolve error — add a shim/null-mod in
  `overrides/bundle.mjs`.
- Previews use **fixed-width** dark panels (380–420px). `width:100%` collapses to 0
  in the capture container (reads as root-empty) — keep them fixed.
- 8 components use `cfg.overrides.<Name>.cardMode:"column"` (fluid/wide content).
- The forks pin esbuild behavior; if the bundled `lib/bundle.mjs` or `lib/dts.mjs`
  changes upstream, diff and re-merge the forks.
- Icons: to ship real glyphs, wire the MaterialIcons font and un-stub
  `@expo/vector-icons` (currently a placeholder box).

## Verification

playwright + chromium installed under `.ds-sync/`. Build → capture → validate all
green; 18/18 render cleanly, all cells graded `good`.
