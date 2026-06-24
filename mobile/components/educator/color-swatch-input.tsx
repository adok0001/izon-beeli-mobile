import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

/** Curated quick-pick palette for cultural colour bands — warm reds, creams, and
 *  deep darks that read well as gradient stops, plus earthy and jewel tones. */
export const BAND_SWATCHES = [
  "#B5462F", "#7E2C1B", "#C4862A", "#E08A1E", "#8B5E3C", "#6B4423",
  "#F7F2E8", "#EDE3CE", "#FFFFFF", "#2F5D3A", "#4B7A52", "#1E3A5F",
  "#2B4C7E", "#4A2C5E", "#6B3FA0", "#2B2233", "#1A1530", "#0B0D17",
] as const;

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHex(v: string): boolean {
  return HEX_RE.test(v.trim());
}

/** Convert HSL (h 0-360, s/l 0-100) to an uppercase #RRGGBB hex string. */
function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => {
    const c = lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Spectrum grid: each hue is a row of light→dark steps, with a neutral row on top.
const HUES = [0, 20, 40, 60, 95, 140, 170, 195, 215, 250, 285, 320];
const LIGHTNESS = [90, 78, 66, 54, 42, 30, 20];
const GRAYS = [98, 84, 70, 56, 42, 28, 14].map((l) => hslToHex(0, 0, l));
const SPECTRUM = HUES.map((h) => LIGHTNESS.map((l) => hslToHex(h, 65, l)));

interface Props {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

/** Swatch picker for a single hex colour: curated quick picks, a full HSL
 *  spectrum behind a toggle, and a manual hex field. Guarantees a valid,
 *  non-empty value when a swatch is chosen — which is what the reader's
 *  gradients (and the save-time band filter) require. */
export function ColorSwatchInput({ label, value, onChange }: Props) {
  const M = useMuseumTheme();
  const [expanded, setExpanded] = useState(false);
  const valid = isHex(value);
  const normalized = value.trim().toLowerCase();

  const swatch = (hex: string, opts: { size?: number; fill?: boolean; key?: string }) => {
    const selected = hex.toLowerCase() === normalized;
    const big = opts.size !== undefined && opts.size >= 30;
    return (
      <Pressable
        key={opts.key ?? hex}
        onPress={() => onChange(hex)}
        accessibilityLabel={`Colour ${hex}`}
        style={{
          width: opts.fill ? "100%" : opts.size,
          height: opts.fill ? 26 : opts.size,
          borderRadius: big ? 9 : 6,
          backgroundColor: hex,
          borderWidth: selected ? 2.5 : 1,
          borderColor: selected ? M.accent : M.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <IconSymbol name="checkmark" size={big ? 14 : 11} color={isLight(hex) ? "#0B0D17" : "#FFFFFF"} />
        )}
      </Pressable>
    );
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted }}>{label}</Text>
        <Pressable onPress={() => setExpanded((e) => !e)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <IconSymbol name={expanded ? "chevron.up" : "plus"} size={12} color={M.accent} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: M.accent }}>
            {expanded ? "Less" : "More colours"}
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingRight: 4 }}>
        {BAND_SWATCHES.map((hex) => swatch(hex, { size: 32 }))}
      </ScrollView>

      {expanded && (
        <View style={{ marginTop: 8, gap: 4 }}>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {GRAYS.map((hex) => (
              <View key={hex} style={{ flex: 1 }}>{swatch(hex, { fill: true })}</View>
            ))}
          </View>
          {SPECTRUM.map((row, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: 4 }}>
              {row.map((hex, ci) => (
                <View key={`${ri}-${ci}`} style={{ flex: 1 }}>{swatch(hex, { fill: true, key: `${ri}-${ci}` })}</View>
              ))}
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: M.border,
            backgroundColor: valid ? value : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!valid && <IconSymbol name="questionmark" size={13} color={M.muted} />}
        </View>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="#RRGGBB"
          placeholderTextColor={M.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: valid ? M.border : M.error,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 9,
            color: M.text,
            backgroundColor: M.card,
            fontSize: 14,
          }}
        />
      </View>
    </View>
  );
}

/** Rough perceived-lightness test so the check mark stays legible on any swatch. */
function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
