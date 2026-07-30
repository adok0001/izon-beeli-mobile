import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { Sense } from "@/lib/dictionary";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { fonts, type } from "@/constants/typography";

/**
 * Lexicon Plate — a museum-catalog placard for a word that carries several
 * readings. Each sense is threaded onto a single bronze "binding" rail and
 * indexed with a hand-set numeral, the way a catalogue plate lists every
 * documented interpretation of one artifact. The first sense is treated as the
 * headword reading (larger, parchment-weight); the rest recede to secondary
 * text. Any parenthetical disambiguation is lifted out of the line into a
 * bronze note tag so the meaning itself stays clean.
 *
 * Differentiation: a continuous rail with numerals threaded over it ("beads on
 * a string"), not a flat numbered list — instead of `1. … 2. …` stacked text.
 */
const GUTTER = 34; // numeral column width
const RAIL_X = GUTTER / 2 - 0.5; // centre the 1px rail under the numerals

export function SensesPlacard({
  senses,
  selectedIndex,
  onSelect,
}: {
  senses: Sense[];
  /** The sense the page is scoped to. Its row is marked as current. */
  selectedIndex?: number;
  /**
   * Select a sense, scoping the page to it — the one case where "which meaning
   * does this learner want?" has a direct answer instead of being inferred from
   * progress. Omitted (the Studio preview), rows stay inert.
   */
  onSelect?: (index: number) => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 6,
      }}
    >
      {/* Plate header: overline + total count set in the display face */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ ...type.overline, textTransform: "uppercase", color: M.muted }}>
          {t("wordDetail.senses")}
        </Text>
        <Text style={{ fontFamily: fonts.heading, fontSize: 15, color: M.accent }}>
          {String(senses.length).padStart(2, "0")}
        </Text>
      </View>

      <View style={{ position: "relative" }}>
        {/* The binding rail: one hairline behind every numeral */}
        <View
          style={{
            position: "absolute",
            left: RAIL_X,
            top: 14,
            bottom: 14,
            width: 1,
            backgroundColor: M.accentBorder,
          }}
        />
        {senses.map((sense, i) => (
          <SenseRow
            key={i}
            index={i}
            sense={sense}
            primary={i === 0}
            selected={selectedIndex === i}
            onSelect={onSelect && (() => onSelect(i))}
          />
        ))}
      </View>
    </View>
  );
}

function SenseRow({
  index,
  sense,
  primary,
  selected,
  onSelect,
}: {
  index: number;
  sense: Sense;
  primary: boolean;
  selected: boolean;
  onSelect?: () => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [pressed, setPressed] = useState(false);
  // With no selection (the preview, or a page not yet scoped) the first sense
  // reads as the headword reading; with one, the selected sense is what's current.
  const current = onSelect ? selected : primary;

  // Inert unless a handler is supplied — Pressable with no onPress would still
  // read as interactive to a screen reader.
  const Row = onSelect ? Pressable : View;

  return (
    <Row
      onPress={onSelect}
      onPressIn={onSelect && (() => setPressed(true))}
      onPressOut={onSelect && (() => setPressed(false))}
      accessibilityRole={onSelect ? "radio" : undefined}
      accessibilityState={onSelect ? { selected } : undefined}
      accessibilityLabel={
        onSelect ? t("wordDetail.showSense", { sense: sense.text }) : undefined
      }
      style={{
        flexDirection: "row",
        paddingVertical: 10,
        // Bleed the highlight past the card's padding so a selected or tapped row
        // reads as a full-width band rather than a floating rectangle.
        marginHorizontal: -18,
        paddingHorizontal: 18,
        backgroundColor: selected || pressed ? M.accentGlow : "transparent",
      }}
    >
      {/* Numeral threaded onto the rail — card-bg disc breaks the line */}
      <View style={{ width: GUTTER, alignItems: "center" }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: current ? M.accent : M.card,
            borderWidth: 1,
            borderColor: current ? M.accent : M.accentBorder,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.heading,
              fontSize: 13,
              color: current ? M.ink : M.accent,
            }}
          >
            {index + 1}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingLeft: 4 }}>
        <Text
          style={{
            fontFamily: primary ? fonts.headingMedium : undefined,
            fontSize: primary ? 19 : 16,
            lineHeight: primary ? 26 : 23,
            fontWeight: primary ? "600" : "400",
            color: primary ? M.text : M.sub,
          }}
        >
          {sense.text}
        </Text>
        {!!sense.note && (
          <View
            style={{
              alignSelf: "flex-start",
              marginTop: 6,
              borderRadius: 6,
              backgroundColor: M.accentGlow,
              borderWidth: 1,
              borderColor: M.accentBorder,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", color: M.accent }}>
              {sense.note}
            </Text>
          </View>
        )}
      </View>

      {/* Affordance: only where tapping does something. A check on the sense
          being shown, a chevron on the ones you can switch to. */}
      {!!onSelect && (
        <View style={{ justifyContent: "center", paddingLeft: 8 }}>
          <IconSymbol
            name={selected ? "checkmark" : "chevron.right"}
            size={14}
            color={selected ? M.accent : M.muted}
          />
        </View>
      )}
    </Row>
  );
}
