/**
 * Feature-accent palette.
 *
 * Beeli uses a set of categorical accent hues to give sections and features a
 * distinct identity — rose for the Songs/Listen section, blue for Bounties, teal
 * for the Elder role, the geez/nsibidi script-mode accents, etc. These are NOT
 * semantic state colors (use `M.success` / `M.error` from the Museum theme for
 * those); they are intentional brand accents that were previously hardcoded as
 * raw hex (`#f43f5e`, `${color}20`, ...) scattered across screens.
 *
 * Each hue exposes a `solid` color plus `bg` / `border` overlays tuned to read
 * correctly on both the dark and light content surfaces (low-alpha overlays sit
 * on either background). Reach for `getAccent(hue)` instead of inlining hex.
 */
export type AccentHue =
  | "rose"
  | "purple"
  | "blue"
  | "teal"
  | "indigo"
  | "orange"
  | "green"
  | "amber"
  | "sky"
  | "pink"
  | "fuchsia";

export interface AccentColor {
  /** Base color for icons, text, and borders-as-rules. */
  solid: string;
  /** ~12% fill for pill/card backgrounds. */
  bg: string;
  /** ~30% outline for bordered pills/cards. */
  border: string;
}

/** Build an accent entry from an "r, g, b" triplet so bg/border stay in sync. */
function hue(rgb: string, solid: string): AccentColor {
  return { solid, bg: `rgba(${rgb}, 0.12)`, border: `rgba(${rgb}, 0.30)` };
}

export const ACCENTS: Record<AccentHue, AccentColor> = {
  rose:    hue("244, 63, 94", "#F43F5E"),
  purple:  hue("167, 139, 250", "#A78BFA"),
  blue:    hue("59, 130, 246", "#3B82F6"),
  teal:    hue("45, 212, 191", "#2DD4BF"),
  indigo:  hue("99, 102, 241", "#6366F1"),
  orange:  hue("251, 146, 60", "#FB923C"),
  green:   hue("74, 222, 128", "#4ADE80"),
  amber:   hue("245, 158, 11", "#F59E0B"),
  sky:     hue("56, 189, 248", "#38BDF8"),
  pink:    hue("236, 72, 153", "#EC4899"),
  fuchsia: hue("217, 70, 239", "#D946EF"),
};

export function getAccent(h: AccentHue): AccentColor {
  return ACCENTS[h];
}
