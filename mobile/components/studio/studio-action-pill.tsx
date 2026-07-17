import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text } from "react-native";

type Tone = "neutral" | "accent" | "danger" | "success";

type M = ReturnType<typeof useMuseumTheme>;

function toneColor(tone: Tone, M: M) {
  switch (tone) {
    case "accent": return M.accent;
    case "danger": return M.error;
    case "success": return M.success;
    default: return M.sub;
  }
}

function toneBg(tone: Tone, M: M, active: boolean) {
  if (tone === "danger") return M.errorBg;
  if (tone === "success") return M.successBg;
  if (!active) return M.pillBg;
  return `${toneColor(tone, M)}18`;
}

function toneBorder(tone: Tone, M: M, active: boolean) {
  if (tone === "danger") return M.errorBorder;
  if (tone === "success") return M.successBorder;
  if (!active) return M.border;
  return `${toneColor(tone, M)}50`;
}

/**
 * The standard Studio list-row action button: a small icon+label pill. Used
 * for Edit / Delete / Feature / Deactivate and any other per-row action, so
 * every content-editor list renders the same button instead of each screen
 * inventing its own icon/color/spacing combination.
 */
export function ActionPill({
  icon,
  label,
  onPress,
  tone = "neutral",
  active = true,
  disabled = false,
}: Readonly<{
  icon?: IconSymbolName;
  label: string;
  onPress: () => void;
  /** Visual category: neutral (edit-ish), accent (feature/star), danger (delete), success (active state). */
  tone?: Tone;
  /** For toggle-style pills (e.g. "Feature") — whether the toggled state is on. */
  active?: boolean;
  disabled?: boolean;
}>) {
  const M = useMuseumTheme();
  const color = active ? toneColor(tone, M) : M.muted;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row", alignItems: "center", gap: 5,
        borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
        backgroundColor: toneBg(tone, M, active),
        borderWidth: 1,
        borderColor: toneBorder(tone, M, active),
        opacity: disabled ? 0.5 : 1,
      }}
      className="active:opacity-70"
    >
      {icon && <IconSymbol name={icon} size={11} color={color} />}
      <Text style={{ fontSize: 11, fontWeight: "700", color }}>{label}</Text>
    </Pressable>
  );
}

/**
 * The standard Studio active/inactive toggle pill (eye icon + ACTIVE/INACTIVE
 * text). Presentational only — the caller owns the mutation and passes the
 * current state in. For screens already on the generic content-active
 * infrastructure, prefer {@link ActiveToggle} in `active-toggle.tsx`, which
 * wires this same look to `useToggleContentActive` directly.
 */
export function ActiveTogglePill({
  active,
  pending,
  onPress,
}: Readonly<{ active: boolean; pending?: boolean; onPress: () => void }>) {
  const M = useMuseumTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      accessibilityRole="button"
      accessibilityLabel={active ? "Deactivate — hide from learners" : "Activate — show to learners"}
      style={{
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 999, borderWidth: 1,
        backgroundColor: active ? M.successBg : M.pillBg,
        borderColor: active ? M.successBorder : M.border,
        opacity: pending ? 0.5 : 1,
      }}
    >
      <IconSymbol name={active ? "eye" : "eye.slash"} size={12} color={active ? M.success : M.muted} />
      <Text style={{ fontSize: 11, fontWeight: "800", color: active ? M.success : M.muted }}>
        {pending ? "…" : active ? "ACTIVE" : "INACTIVE"}
      </Text>
    </Pressable>
  );
}
