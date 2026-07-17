import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { fonts, type } from "@/constants/typography";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

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

export interface EyebrowProps {
  label: string;
  /** "muted" for neutral section labels, "accent" for a featured / active eyebrow. */
  tone?: "muted" | "accent";
  style?: StyleProp<TextStyle>;
}

/**
 * Museum micro-label — the small uppercase overline that sits above a section
 * card ("JUMP BACK IN") or as an in-card eyebrow ("DAILY READ"). Unifies the
 * ad-hoc 10–11px / 700–800 / muted-or-accent labels that had drifted across the
 * learn screen onto the single `type.overline` token.
 */
export function Eyebrow({ label, tone = "muted", style }: EyebrowProps) {
  const M = useMuseumTheme();

  return (
    <Text
      style={[
        { ...type.overline, color: tone === "accent" ? M.accent : M.muted, textTransform: "uppercase" },
        style,
      ]}
    >
      {label}
    </Text>
  );
}

export interface ContentTeaserCardProps {
  /** External eyebrow shown above the card ("TODAY'S GALLERY", "DAILY READ", ...). */
  eyebrow: string;
  eyebrowTone?: "muted" | "accent";
  icon: IconSymbolName;
  iconColor: string;
  iconBackground: string;
  iconBorderColor?: string;
  /** Left-accent stripe color. */
  accentColor: string;
  title: string;
  subtitle?: string;
  /** Optional content rendered above the title (e.g. a type badge chip). */
  badge?: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Shared Learn-tab content teaser card — unifies Today's Gallery, Daily Read,
 * and From the Library onto one visual: external eyebrow, left-accent stripe,
 * 44px icon tile, padding:14, uniform chevron, paddingHorizontal:20 wrapper.
 */
export function ContentTeaserCard({
  eyebrow,
  eyebrowTone = "muted",
  icon,
  iconColor,
  iconBackground,
  iconBorderColor,
  accentColor,
  title,
  subtitle,
  badge,
  onPress,
  accessibilityLabel,
}: ContentTeaserCardProps) {
  const M = useMuseumTheme();

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Eyebrow label={eyebrow} tone={eyebrowTone} style={{ marginBottom: 8 }} />
      <Pressable
        onPress={onPress}
        style={{
          borderRadius: 16,
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.border,
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="active:opacity-70"
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: iconBackground,
            borderWidth: iconBorderColor ? 1 : 0,
            borderColor: iconBorderColor,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconSymbol name={icon} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          {badge}
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: M.text }}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={{ fontSize: 11, color: M.sub, marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <IconSymbol name="chevron.right" size={14} color={M.muted} />
      </Pressable>
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
