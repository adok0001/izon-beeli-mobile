import { IconSymbol } from "@/components/ui/icon-symbol";
import { friendlyError } from "@/lib/api";
import {
  useToggleContentActive,
  type ActiveToggleEntityType,
} from "@/lib/hooks/educator/use-content-workflow";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text } from "react-native";

type M = ReturnType<typeof useMuseumTheme>;

/**
 * The Studio active/inactive visibility switch, shared across every content
 * editor. A single-tap eye-pill (matching the course toggle) that flips the
 * row's `is_active` flag via POST /content/:entityType/:id/active. Inactive
 * rows stay editable in Studio but are hidden from learners.
 *
 * Presentational state comes from the `isActive` prop; the parent owns the
 * query cache and passes the keys to invalidate. Toast feedback is delegated
 * to the screen (which already renders a NotificationBanner) via `onToast`.
 */
export function ActiveToggle({
  entityType,
  id,
  isActive,
  invalidateKeys,
  M,
  onToast,
}: Readonly<{
  entityType: ActiveToggleEntityType;
  id: string;
  isActive: boolean;
  invalidateKeys: unknown[][];
  M: M;
  onToast?: { success: (title: string, body?: string) => void; error: (title: string, body?: string) => void };
}>) {
  const toggle = useToggleContentActive(entityType, invalidateKeys);
  const pending = toggle.isPending;
  // Treat undefined as active — rows created before the column existed default true.
  const active = isActive !== false;

  const flip = () =>
    toggle.mutate(
      { id, isActive: !active },
      {
        onSuccess: () => onToast?.success(active ? "Hidden from learners" : "Now visible to learners"),
        onError: (e: Error) => onToast?.error("Update failed", friendlyError(e)),
      }
    );

  return (
    <Pressable
      onPress={flip}
      disabled={pending}
      accessibilityRole="button"
      accessibilityLabel={active ? "Deactivate — hide from learners" : "Activate — show to learners"}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
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
