import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Museum design system tokens.
 *
 * Rule:
 *   - Header sections are ALWAYS dark (museum foyer signature).
 *     Use `M.parchment`, `M.textDim`, `M.textDimDark` there.
 *   - Content areas (cards, lists) are mode-aware.
 *     Use `M.text`, `M.sub`, `M.muted`, `M.card`, `M.border` there.
 */
export function useMuseumTheme() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  return {
    // ── Always-dark foyer ────────────────────────────────────────
    ink: "#0D0F1A",
    inkDeep: "#07080F",
    parchment: "#F7F2E8",          // primary text on dark bg
    textDim: "#9A9480",            // secondary text on dark bg
    textDimDark: "#5A5D70",        // muted text on dark bg
    accentDim: "#8B5E1A",

    // ── Mode-aware content area ──────────────────────────────────
    bg:     dark ? "#0D0F1A" : "#F0EBE0",   // screen bg (behind dark header)
    card:   dark ? "#1A1D2C" : "#FDFAF5",   // card / list-item bg
    border: dark ? "#2E3245" : "#E0D5C4",   // dividers and card borders

    // Text on content background
    text:  dark ? "#F7F2E8" : "#1A1520",   // primary content text
    sub:   dark ? "#9A9480" : "#5C4F42",   // secondary content text
    muted: dark ? "#5A5D70" : "#A89880",   // muted / timestamps

    // ── Accent (identical in both modes) ────────────────────────
    accent:       "#C4862A",
    accentBorder: dark ? "rgba(196,134,42,0.4)"  : "rgba(196,134,42,0.35)",
    accentGlow:   dark ? "rgba(196,134,42,0.15)" : "rgba(196,134,42,0.10)",
    accentLight:  "#F5E8CC",

    // ── Input fields ─────────────────────────────────────────────
    inputBg:          dark ? "#161826" : "#FDFAF5",
    inputBorder:      dark ? "#2E3245" : "#D4C9B8",
    inputText:        dark ? "#F7F2E8" : "#1A1520",
    inputPlaceholder: dark ? "#5A5D70" : "#A89880",

    // ── Auth screen bg (no dark header, full-screen) ─────────────
    authBg: dark ? "#0D0F1A" : "#F0EBE0",

    // ── Aliases kept for backward compat ─────────────────────────
    cardBg:    dark ? "#1A1D2C" : "#FDFAF5",
    cardDark:  dark ? "#1A1D2C" : "#FDFAF5",
    borderDark:dark ? "#2E3245" : "#E0D5C4",
    warmWhite: "#FDFAF5",

    isDark: dark,
  } as const;
}

export type MuseumTheme = ReturnType<typeof useMuseumTheme>;
