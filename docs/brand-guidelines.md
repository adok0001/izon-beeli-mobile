# Beeli Brand & Design System

**Status:** canonical direction · **Owner:** design
**Source of truth for tokens:** `mobile/lib/use-museum-theme.ts`

Beeli has one brand: the dark-first, warm **"Museum"** system. Historically the
mobile app used Museum (bronze/parchment) while the `web/` app used a separate
purple "aurora/glow" system. That split reads as two products. This document
makes **Museum canonical for every surface** and defines the convergence path.

---

## 1. Palette (canonical)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0D0F1A` | Primary dark background / navigation chrome ("foyer") |
| `ink-deep` | `#07080F` | Deepest background, gradients bottom |
| `ink-raised` | `#1A1D2C` | Cards / raised surfaces on dark |
| `parchment` | `#F7F2E8` | Primary text on dark; warm "paper" light surface |
| `text-dim` | `#9A9480` | Secondary text on dark |
| **`bronze-500`** | **`#C4862A`** | **The brand accent** — CTAs, highlights, focus, active state |
| `bronze-400` | `#D89A3A` | Accent light (gradient top, hover) |
| `bronze-600/700` | `#A66E1C` / `#8B5E1A` | Accent dark (gradient bottom, pressed) |

Semantic state colors (success/error/warning/info) and their `*Bg`/`*Border`
variants are defined per mode in `useMuseumTheme()`; reuse those rather than
hardcoding hex.

**Categorical accents** (course/level/skill hues) come from `getAccent(hue)` and
`constants/course-colors.ts` — bronze is the *brand* accent, not the only color.

## 2. Web tokens

`web/tailwind.config.ts` now exposes the Museum palette:

- `bronze.{50…900}` — the brand accent scale (use instead of `brand.*`)
- `museum.{ink,ink-deep,ink-raised,parchment,text-dim,border}` — surfaces
- `bg-gradient-bronze`, `shadow-glow-bronze` — bronze equivalents of the
  purple `gradient-brand` / `glow` utilities
- Global `::selection` and `:focus-visible` now use bronze (`globals.css`)

## 3. Migration: retire purple `brand.*`

The purple `brand.*` scale and neon `aurora`/`glow`/`mesh-brand` treatments are
**deprecated**. Convergence steps, in order of impact:

1. **Done:** shared bronze/museum tokens + bronze selection/focus + bronze
   gradient/glow utilities available in web.
2. Re-skin primary CTAs and hero gradients: `gradient-brand` → `gradient-bronze`,
   `shadow-glow*` → `shadow-glow-bronze`.
3. Replace `brand-*` utility usages component-by-component with `bronze-*` /
   `museum-*`. Grep target: `brand-[0-9]`, `glow`, `aurora`, `mesh-brand`.
4. Soften the neon aesthetic: reduce heavy glows/auroras toward the restrained,
   warm "museum" mood (flat cards, hairline borders, parchment).
5. Remove the `brand` and aurora tokens once no component references them.

Keep motion and glass where they aid the audio/visual-first feel — just
re-skinned bronze/parchment, not purple neon.

## 4. Typography

Plus Jakarta Sans is the shared type family (`font-heading` on mobile,
`font-sans` on web). `Akagu` is reserved for indigenous scripts. Reserve the
serif `font-display` for editorial moments, not UI chrome.

## 5. Do / Don't

- **Do** use `bronze-500` for the single primary action on a surface.
- **Do** consume tokens (`useMuseumTheme()` / `bronze.*` / `museum.*`) — never
  hardcode surface/text/state hex.
- **Don't** introduce new purple `brand.*` usages.
- **Don't** mix the two systems on one screen.
