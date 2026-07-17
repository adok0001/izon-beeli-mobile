import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

/**
 * The standard Studio (admin/educator) screen header: back chevron, title,
 * subtitle, and an optional right-aligned primary action ("+ New", etc).
 * Every Studio list/editor screen should open with this instead of a
 * hand-rolled header row, so back navigation and title styling stay uniform
 * across sections (the `admin` Stack renders with `headerShown: false`, so
 * this in-body header is the only back affordance learners of the pattern get).
 */
export function StudioScreenHeader({
  title,
  subtitle,
  action,
  onBack,
}: Readonly<{
  title: string;
  subtitle?: string;
  action?: { label: string; icon?: IconSymbolName; onPress: () => void };
  /** Override the default router.back() — rarely needed. */
  onBack?: () => void;
}>) {
  const M = useMuseumTheme();
  const router = useRouter();

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>{title}</Text>
          {subtitle && (
            <Text style={{ fontSize: 12, color: M.textDim, marginTop: 2 }}>{subtitle}</Text>
          )}
        </View>
        {action && (
          <Pressable
            onPress={action.onPress}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9,
              backgroundColor: M.accent,
            }}
            className="active:opacity-80"
          >
            <IconSymbol name={action.icon ?? "plus"} size={13} color={M.ink} />
            <Text style={{ fontSize: 13, fontWeight: "800", color: M.ink }}>{action.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
