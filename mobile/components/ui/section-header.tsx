import { fonts, type } from "@/constants/typography";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

export interface SectionHeaderProps {
  title: string;
  /** Small uppercase eyebrow above the title (museum "exhibit" label). */
  eyebrow?: string;
  subtitle?: string;
  /** Optional trailing element (e.g. a "See all" link/button). */
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Museum section header. Unifies the ~4 divergent section-label / exhibit-header
 * variants in settings, profile, learn, and listen into one component.
 */
export function SectionHeader({ title, eyebrow, subtitle, action, style }: SectionHeaderProps) {
  const M = useMuseumTheme();

  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 },
        style,
      ]}
    >
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <Text
            style={{
              ...type.overline,
              color: M.accent,
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: M.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ ...type.caption, color: M.sub, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      {action ? <View style={{ marginLeft: 12 }}>{action}</View> : null}
    </View>
  );
}

export interface ExhibitDividerProps {
  label: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Centered museum divider — hairline · dot · uppercase label · dot · hairline.
 * Unifies the duplicated ExhibitHeader / SectionLabel variants in explore.
 */
export function ExhibitDivider({ label, style }: ExhibitDividerProps) {
  const M = useMuseumTheme();

  return (
    <View
      style={[{ marginTop: 28, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 12 }, style]}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: M.accent }} />
        <Text
          style={{
            fontSize: 9, fontWeight: "800", letterSpacing: 2.5,
            textTransform: "uppercase", color: M.muted,
          }}
        >
          {label}
        </Text>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: M.accent }} />
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
    </View>
  );
}
