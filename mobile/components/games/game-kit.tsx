import { IconSymbol } from "@/components/ui/icon-symbol";
import type { AccentColor } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { ComponentProps } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

type IconName = ComponentProps<typeof IconSymbol>["name"];

/**
 * Shared "game kit" — accent-aware primitives for the practice mini-games.
 *
 * Why this exists: every mini-game used to re-declare an identical `OptionTile`
 * and `ProgressBar` themed with the single bronze `M.accent`, so the games were
 * visually indistinguishable. These primitives take a per-game `accent`
 * (`getAccent(hue)`) so each game owns its identity hue, while keeping the
 * correct/incorrect feedback *semantic* (Museum success/error) so the answer
 * state reads the same everywhere. No hardcoded hex — accents come from
 * `constants/accent-colors`, surfaces/state from the Museum theme.
 */

/** Append an alpha to a 6-digit hex (#RRGGBB -> #RRGGBBAA). */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

// ── Eyebrow ──────────────────────────────────────────────────────────────────
/** Small uppercase label that tags a prompt, tinted with the game accent. */
export function GameEyebrow({
  label,
  accent,
  icon,
  align = "left",
  style,
}: {
  label: string;
  accent: AccentColor;
  icon?: IconName;
  align?: "left" | "center";
  style?: ViewStyle;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: 6,
        ...style,
      }}
    >
      {icon && <IconSymbol name={icon} size={11} color={accent.solid} />}
      <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 2, color: accent.solid }}>
        {label}
      </Text>
    </View>
  );
}

// ── Progress ─────────────────────────────────────────────────────────────────
export type GameProgressVariant = "bar" | "segments" | "rule";

/**
 * Accent-aware progress indicator with per-game flavour:
 *  - `bar`      filled rounded bar (default)
 *  - `segments` one chunk per question — reads like an inscription row
 *  - `rule`     hairline editorial rule
 */
export function GameProgress({
  current,
  total,
  accent,
  variant = "bar",
}: {
  current: number;
  total: number;
  accent: AccentColor;
  variant?: GameProgressVariant;
}) {
  const M = useMuseumTheme();
  const pct = total > 0 ? Math.min(1, current / total) : 0;

  if (variant === "segments") {
    return (
      <View
        style={{ marginHorizontal: 20, marginTop: 8, flexDirection: "row", gap: 4 }}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: current }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              backgroundColor: i < current ? accent.solid : M.border,
            }}
          />
        ))}
      </View>
    );
  }

  const height = variant === "rule" ? 2 : 6;
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 8,
        height,
        borderRadius: 999,
        backgroundColor: variant === "rule" ? "transparent" : M.border,
        borderBottomWidth: variant === "rule" ? 1 : 0,
        borderBottomColor: M.border,
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: current }}
    >
      <View style={{ height, borderRadius: 999, backgroundColor: accent.solid, width: `${pct * 100}%` }} />
    </View>
  );
}

// ── Option tile ──────────────────────────────────────────────────────────────
export type GameOptionState = "default" | "correct" | "incorrect" | "dimmed";

/**
 * Accent-aware multiple-choice tile. Identity comes from the `badge` (lettered
 * or numbered chip in the game accent); correct/incorrect stay semantic so the
 * answer feedback reads identically across every game.
 */
export function GameOption({
  label,
  state,
  onPress,
  accent,
  badge,
  marker,
}: {
  label: string;
  state: GameOptionState;
  onPress: () => void;
  accent: AccentColor;
  /** Lettered/numbered chip on the leading edge (e.g. "A", "1"). */
  badge?: string;
  /** Subtle diamond/tick lead-in instead of a badge (script motif). */
  marker?: boolean;
}) {
  const M = useMuseumTheme();
  const bg = { default: M.card, correct: M.successBg, incorrect: M.errorBg, dimmed: M.card }[state];
  const border = { default: M.border, correct: M.success, incorrect: M.error, dimmed: M.border }[state];
  const color = { default: M.text, correct: M.success, incorrect: M.error, dimmed: M.muted }[state];

  // Badge colour follows the answer state once locked, else the game accent.
  const badgeColor =
    state === "correct" ? M.success : state === "incorrect" ? M.error : state === "dimmed" ? M.muted : accent.solid;

  return (
    <Pressable
      onPress={onPress}
      disabled={state !== "default"}
      style={{
        marginBottom: 10,
        borderRadius: 14,
        borderWidth: 2,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: bg,
        borderColor: border,
        opacity: state === "dimmed" ? 0.45 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={
        state === "correct" ? `${label}, correct` : state === "incorrect" ? `${label}, incorrect` : label
      }
      accessibilityState={{ disabled: state !== "default", selected: state === "correct" || state === "incorrect" }}
    >
      {badge !== undefined && (
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tint(badgeColor, 0.14),
            borderWidth: 1,
            borderColor: tint(badgeColor, 0.35),
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "900", color: badgeColor }}>{badge}</Text>
        </View>
      )}
      {marker && (
        <View
          style={{
            width: 8,
            height: 8,
            transform: [{ rotate: "45deg" }],
            backgroundColor: badgeColor,
            borderRadius: 1,
          }}
        />
      )}
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: "600",
          color,
          textAlign: badge !== undefined || marker ? "left" : "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Result view ──────────────────────────────────────────────────────────────
export interface GameAction {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "ghost";
}

/**
 * Shared end-of-session screen body. Replaces the near-identical results block
 * copy-pasted across the games, and colours the score ring + primary action
 * with the per-game accent.
 */
export function GameResultView({
  accent,
  stat,
  statLabel,
  headline,
  subtitle,
  actions,
  children,
}: {
  accent: AccentColor;
  stat: string;
  statLabel?: string;
  headline: string;
  subtitle?: string;
  actions: GameAction[];
  children?: React.ReactNode;
}) {
  const M = useMuseumTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <View
        style={{
          width: 124,
          height: 124,
          borderRadius: 62,
          borderWidth: 3,
          borderColor: accent.solid,
          backgroundColor: tint(accent.solid, 0.08),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Text style={{ fontSize: 38, fontWeight: "900", color: accent.solid }}>{stat}</Text>
        {statLabel && (
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: M.muted }}>{statLabel}</Text>
        )}
      </View>
      <Text style={{ fontSize: 24, fontWeight: "800", color: M.text, marginBottom: 8 }}>{headline}</Text>
      {subtitle && <Text style={{ fontSize: 15, color: M.sub, textAlign: "center" }}>{subtitle}</Text>}
      {children}
      <View style={{ width: "100%", gap: 10, marginTop: 32 }}>
        {actions.map((a) => {
          const kind = a.kind ?? "secondary";
          if (kind === "ghost") {
            return (
              <Pressable key={a.label} onPress={a.onPress} style={{ paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 14, color: M.muted }}>{a.label}</Text>
              </Pressable>
            );
          }
          if (kind === "primary") {
            return (
              <Pressable
                key={a.label}
                onPress={a.onPress}
                style={{ borderRadius: 14, paddingVertical: 16, backgroundColor: accent.solid, alignItems: "center" }}
                className="active:opacity-80"
              >
                <Text style={{ fontSize: 15, fontWeight: "800", color: M.ink }}>{a.label}</Text>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              style={{ borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: M.border, alignItems: "center" }}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: M.text }}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Score chip ───────────────────────────────────────────────────────────────
/** Compact stat chip for in-game top bars. */
export function GameStatChip({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: AccentColor;
}) {
  const M = useMuseumTheme();
  const fg = accent ? accent.solid : M.text;
  return (
    <View
      style={{
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        minWidth: 56,
        alignItems: "center",
        backgroundColor: accent ? tint(accent.solid, 0.12) : M.card,
        borderWidth: 1,
        borderColor: accent ? tint(accent.solid, 0.3) : M.border,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "900", color: fg }}>{value}</Text>
      <Text style={{ fontSize: 8, fontWeight: "700", letterSpacing: 1.5, color: M.muted }}>{label}</Text>
    </View>
  );
}
