import { fonts, type } from "@/constants/typography";
import type { ShareCardData } from "@/lib/share-card";
import { bronze, glass, MUSEUM } from "@/lib/use-museum-theme";
import { Badge } from "@/components/ui/badge";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

const DIVIDER_COLORS = [bronze(0.7), bronze(0.08)] as const;
const CARD_COLORS = [MUSEUM.inkRaised, MUSEUM.ink, MUSEUM.inkDeep] as const;

function AccentDivider() {
  return (
    <LinearGradient
      colors={DIVIDER_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.divider}
    />
  );
}

export const ShareCardPreview = forwardRef<View, ShareCardData>((props, ref) => {
  const { t } = useTranslation();
  const language = "language" in props ? props.language : undefined;

  return (
    <View ref={ref} collapsable={false} style={styles.frame}>
      <LinearGradient
        colors={CARD_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={styles.body}
      >
        <View pointerEvents="none" style={styles.glow} />

        {/* Brand header */}
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <View style={styles.brandDot} />
            <Text style={{ ...type.overline, color: MUSEUM.accent }}>BEELI</Text>
          </View>
          {language ? (
            <Badge label={language} color={MUSEUM.textDim} bg={glass(0.08)} border={glass(0.14)} />
          ) : null}
        </View>

        {props.template === "word" && (
          <>
            <Text style={{ ...type.display, color: MUSEUM.parchment }}>{props.word}</Text>
            {props.pronunciation && (
              <Text style={styles.pronunciation}>/{props.pronunciation}/</Text>
            )}
            <AccentDivider />
            <Text style={{ ...type.h3, color: MUSEUM.textDim }}>{props.translation}</Text>
          </>
        )}

        {props.template === "proverb" && (
          <>
            <Text style={styles.quoteMark}>&ldquo;</Text>
            <Text style={{ ...type.h3, fontStyle: "italic", color: MUSEUM.parchment, marginTop: -14 }}>
              {props.text}
            </Text>
            <AccentDivider />
            <Text style={{ ...type.body, color: MUSEUM.textDim }}>{props.translation}</Text>
          </>
        )}

        {props.template === "achievement" && (
          <>
            <View style={styles.trophyRing}>
              <Text style={{ fontSize: 26 }}>🏆</Text>
            </View>
            <Text style={{ ...type.h2, color: MUSEUM.parchment }}>{props.title}</Text>
            <Text style={{ ...type.body, color: MUSEUM.textDim, marginTop: 6 }}>{props.detail}</Text>
          </>
        )}

        {props.template === "symbol" && (
          <>
            <Text style={{ ...type.h1, color: MUSEUM.parchment }}>{props.name}</Text>
            <AccentDivider />
            <Text style={{ ...type.body, color: MUSEUM.textDim }}>{props.meaning}</Text>
          </>
        )}

        {props.template === "cultural" && (
          <>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Text style={{ fontSize: 30 }}>{props.emoji}</Text>
              <Badge
                label={props.category.charAt(0).toUpperCase() + props.category.slice(1)}
                color={MUSEUM.accent}
                bg={bronze(0.14)}
                border={bronze(0.3)}
              />
            </View>
            <Text style={{ ...type.h2, color: MUSEUM.parchment, marginTop: 12 }}>{props.title}</Text>
            <Text style={{ ...type.body, color: MUSEUM.textDim, marginTop: 8 }} numberOfLines={3}>
              {props.description}
            </Text>
          </>
        )}

        {props.template === "lesson" && (
          <>
            <View style={styles.trophyRing}>
              <Text style={{ fontSize: 26 }}>📖</Text>
            </View>
            <Text style={{ ...type.h2, color: MUSEUM.parchment }}>{props.title}</Text>
            {props.description ? (
              <Text style={{ ...type.body, color: MUSEUM.textDim, marginTop: 8 }} numberOfLines={3}>
                {props.description}
              </Text>
            ) : null}
          </>
        )}

        {/* Footer */}
        <View className="mt-7 flex-row items-center justify-center" style={{ gap: 6 }}>
          <View style={styles.footerRule} />
          <Text style={styles.footerText}>{t("share.tagline")}</Text>
          <View style={styles.footerRule} />
        </View>
      </LinearGradient>
    </View>
  );
});

ShareCardPreview.displayName = "ShareCardPreview";

const styles = StyleSheet.create({
  frame: {
    width: 320,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: bronze(0.35),
  },
  body: { padding: 28 },
  glow: {
    position: "absolute",
    top: -70,
    right: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: bronze(0.14),
  },
  brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: MUSEUM.accent },
  divider: { height: 1.5, borderRadius: 1, marginVertical: 16 },
  pronunciation: { marginTop: 6, fontSize: 14, fontStyle: "italic", color: MUSEUM.textDim },
  quoteMark: { fontFamily: fonts.heading, fontSize: 44, lineHeight: 44, color: bronze(0.55) },
  trophyRing: {
    marginBottom: 14,
    height: 56,
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: bronze(0.16),
    borderWidth: 1,
    borderColor: bronze(0.4),
  },
  footerRule: { height: 1, width: 18, backgroundColor: glass(0.18) },
  footerText: { fontSize: 10, letterSpacing: 0.6, color: glass(0.45) },
});
