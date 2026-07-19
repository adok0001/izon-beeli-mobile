import { IconSymbol } from "@/components/ui/icon-symbol";
import { type } from "@/constants/typography";
import { MUSEUM, bronze, glass } from "@/lib/use-museum-theme";
import { Animated, Text, View } from "react-native";

/**
 * The Foyer Tour's shared visual grammar — a paged "gallery walk": a bronze
 * picture-light per scene, a brass-plaque caption, and a wall of framed
 * "paintings" tracking progress. Shared by `FeatureTourModal` (the in-app
 * replay) and the pre-auth landing carousel so both walk the same rooms
 * instead of maintaining two copies of this look.
 */

/** Brass-plaque numerals; index 0 is the foyer (no number). */
export const PLAQUE = ["✦", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export interface Scene {
  icon: string;
  title: string;
  body: string;
  plaque: string;
}

/** The cone of a gallery spotlight: stacked bronze halos behind the glyph. */
export function PictureLight({ icon }: Readonly<{ icon: string }>) {
  return (
    <View style={{ width: 208, height: 208, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 208, height: 208, borderRadius: 104, backgroundColor: bronze(0.05) }} />
      <View style={{ position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: bronze(0.09) }} />
      <View
        style={{
          position: "absolute",
          width: 92,
          height: 92,
          borderRadius: 46,
          backgroundColor: bronze(0.14),
          borderWidth: 1,
          borderColor: bronze(0.5),
        }}
      />
      <IconSymbol name={icon as never} size={38} color={MUSEUM.accentLight} />
    </View>
  );
}

/** One gallery room. Content drifts on swipe — walking past a hung painting. */
export function GalleryRoom({
  scene,
  index,
  scrollX,
  width,
}: Readonly<{ scene: Scene; index: number; scrollX: Animated.Value; width: number }>) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const drift = scrollX.interpolate({ inputRange, outputRange: [70, 0, -70], extrapolate: "clamp" });
  const lift = scrollX.interpolate({ inputRange, outputRange: [26, 0, 26], extrapolate: "clamp" });
  const fade = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: "clamp" });

  return (
    <View style={{ width, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 }}>
      <Animated.View style={{ opacity: fade, transform: [{ translateX: drift }] }}>
        <PictureLight icon={scene.icon} />
      </Animated.View>

      <Animated.View
        style={{ marginTop: 36, alignItems: "center", opacity: fade, transform: [{ translateY: lift }] }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View style={{ height: 1, width: 22, backgroundColor: bronze(0.45) }} />
          <Text style={{ ...type.overline, color: MUSEUM.accent }}>{scene.plaque}</Text>
          <View style={{ height: 1, width: 22, backgroundColor: bronze(0.45) }} />
        </View>

        <Text style={{ ...type.display, color: MUSEUM.parchment, textAlign: "center" }}>{scene.title}</Text>

        <Text
          style={{
            marginTop: 14,
            fontSize: 15,
            lineHeight: 24,
            color: MUSEUM.textDim,
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          {scene.body}
        </Text>
      </Animated.View>
    </View>
  );
}

/** Framed paintings along the top wall; the current room's frame is lit. */
export function PaintingWall({
  count,
  scrollX,
  width,
}: Readonly<{ count: number; scrollX: Animated.Value; width: number }>) {
  return (
    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const lit = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: "clamp" });
        return (
          <View
            key={i}
            style={{
              width: 20,
              height: 15,
              borderRadius: 2,
              borderWidth: 1,
              borderColor: bronze(0.4),
              backgroundColor: glass(0.03),
              overflow: "hidden",
            }}
          >
            <Animated.View style={{ flex: 1, backgroundColor: MUSEUM.accent, opacity: lit }} />
          </View>
        );
      })}
    </View>
  );
}
