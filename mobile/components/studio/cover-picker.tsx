import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TextInput, View } from "react-native";

/**
 * On-brand two-stop gradient presets (dark → bright), tuned to read as cover
 * art on the dark content surface. "Custom" falls back to raw hex entry, so an
 * author is never boxed out of a specific colour.
 */
const GRADIENT_PRESETS: readonly (readonly [string, string])[] = [
  ["#8B5E1F", "#C4862A"], // bronze (default)
  ["#7C2D12", "#F97316"], // ember
  ["#831843", "#EC4899"], // rose
  ["#4C1D95", "#A78BFA"], // violet
  ["#3730A3", "#6366F1"], // indigo
  ["#1E3A8A", "#3B82F6"], // ocean
  ["#0C4A6E", "#38BDF8"], // sky
  ["#134E4A", "#2DD4BF"], // teal
  ["#065F46", "#10B981"], // jade
  ["#78350F", "#F59E0B"], // amber
  ["#374151", "#9CA3AF"], // slate
];

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
const sameGradient = (a: readonly [string, string], b: readonly [string, string]) =>
  a[0].toLowerCase() === b[0].toLowerCase() && a[1].toLowerCase() === b[1].toLowerCase();

/**
 * Gradient cover picker — a swatch row of presets with a live preview chip, plus
 * a "Custom" escape hatch to raw hex. Used for the interactive-story cover and,
 * inline, for a scene's gradient.
 */
export function CoverPicker({
  from,
  to,
  onChange,
  label,
  compact = false,
}: Readonly<{
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label?: string;
  /** Smaller preview + tighter spacing for the in-scene use. */
  compact?: boolean;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const current: [string, string] = [from, to];
  const isPreset = GRADIENT_PRESETS.some((p) => sameGradient(p, current));
  const [customOpen, setCustomOpen] = useState(!isPreset);
  const chipSize = compact ? 34 : 44;

  return (
    <View>
      {label ? (
        <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 6 }}>{label}</Text>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {/* Live preview chip */}
        <LinearGradient
          colors={[from || "#000000", to || "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: chipSize, height: chipSize, borderRadius: 12, borderWidth: 1, borderColor: M.border }}
        />
        <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {GRADIENT_PRESETS.map((preset) => {
            const active = sameGradient(preset, current);
            return (
              <Pressable
                key={`${preset[0]}-${preset[1]}`}
                onPress={() => {
                  onChange(preset[0], preset[1]);
                  setCustomOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className="active:opacity-70"
              >
                <LinearGradient
                  colors={[preset[0], preset[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? M.accent : M.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active ? <IconSymbol name="checkmark" size={13} color="#FFFFFF" /> : null}
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => setCustomOpen((v) => !v)}
        className="mt-2 flex-row items-center gap-1 self-start active:opacity-70"
      >
        <IconSymbol name={customOpen ? "chevron.down" : "chevron.right"} size={11} color={M.muted} />
        <Text style={{ fontSize: 11.5, fontWeight: "600", color: M.muted }}>
          {t("educator.interactiveStoriesEditor.coverCustom", { defaultValue: "Custom" })}
        </Text>
      </Pressable>

      {customOpen ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
          <HexField label={t("educator.interactiveStoriesEditor.coverGradientFromLabel")} value={from} onChange={(v) => onChange(v, to)} M={M} />
          <HexField label={t("educator.interactiveStoriesEditor.coverGradientToLabel")} value={to} onChange={(v) => onChange(from, v)} M={M} />
        </View>
      ) : null}
    </View>
  );
}

function HexField({
  label,
  value,
  onChange,
  M,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  M: ReturnType<typeof useMuseumTheme>;
}>) {
  const invalid = value.length > 0 && !HEX_RE.test(value.trim());
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 2 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="#000000"
        placeholderTextColor={M.muted}
        style={{
          borderRadius: 10,
          borderWidth: 1,
          borderColor: invalid ? M.errorBorder : M.inputBorder,
          backgroundColor: M.inputBg,
          color: M.inputText,
          paddingHorizontal: 12,
          paddingVertical: 8,
          fontSize: 13,
        }}
      />
    </View>
  );
}
