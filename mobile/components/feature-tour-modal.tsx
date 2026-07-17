import { IconSymbol } from "@/components/ui/icon-symbol";
import { fonts, type } from "@/constants/typography";
import { hapticTap } from "@/lib/haptics";
import { MOBILE_TOUR_REGISTRY } from "@/lib/tours/mobile-tour-registry";
import { MUSEUM, bronze, glass } from "@/lib/use-museum-theme";
import { useTourStore } from "@/store/tour-store";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The Foyer Tour — a paged "gallery walk" welcome.
 *
 * Rather than scrolling a list of feature cards, the visitor moves room to room.
 * Each room spotlights one capability under a bronze picture-light, captioned by
 * a brass plaque (Roman numerals). Progress is the row of framed "paintings" up
 * top — the one you stand in front of is lit. Always dark (the museum foyer),
 * driven entirely by MOBILE_TOUR_REGISTRY so every tour id reuses it.
 */

/** Brass-plaque numerals; index 0 is the foyer (no number). */
const PLAQUE = ["✦", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

interface Scene {
  icon: string;
  title: string;
  body: string;
  plaque: string;
}

/** The cone of a gallery spotlight: stacked bronze halos behind the glyph. */
function PictureLight({ icon }: Readonly<{ icon: string }>) {
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
function GalleryRoom({
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
function PaintingWall({
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

export function FeatureTourModal() {
  const { activeTour, dismissTour } = useTourStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const tr = (key: string) => t(key as never) as string;
  const config = activeTour ? MOBILE_TOUR_REGISTRY[activeTour] : null;

  const scenes = useMemo<Scene[]>(() => {
    if (!config) return [];
    const foyer: Scene = {
      icon: config.heroIcon,
      title: tr(config.titleKey),
      body: tr(config.subtitleKey),
      plaque: PLAQUE[0],
    };
    const rooms = config.features.map<Scene>((f, i) => ({
      icon: f.icon,
      title: tr(f.titleKey),
      body: tr(f.detailKey),
      plaque: PLAQUE[i + 1] ?? String(i + 1),
    }));
    return [foyer, ...rooms];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, t]);

  if (!config || scenes.length === 0) return null;

  const isLast = index >= scenes.length - 1;

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      if (next !== index) {
        setIndex(next);
        hapticTap();
      }
    },
  });

  const advance = () => {
    if (isLast) {
      dismissTour();
    } else {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    }
  };

  return (
    <Modal visible animationType="fade" onRequestClose={dismissTour} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: MUSEUM.inkDeep }}>
        {/* Ceiling spotlight wash */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -120,
            alignSelf: "center",
            width: 460,
            height: 460,
            borderRadius: 230,
            backgroundColor: bronze(0.06),
          }}
        />

        {/* Top wall: framed-paintings progress + exit */}
        <View
          style={{
            paddingTop: insets.top + 10,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PaintingWall count={scenes.length} scrollX={scrollX} width={width} />
          <Pressable
            onPress={dismissTour}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={tr("onboarding.skip")}
            style={{
              position: "absolute",
              right: 20,
              top: insets.top + 6,
              height: 34,
              width: 34,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 17,
              borderWidth: 1,
              borderColor: bronze(0.35),
              backgroundColor: glass(0.04),
            }}
          >
            <IconSymbol name={"xmark" as never} size={15} color={MUSEUM.textDim} />
          </Pressable>
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          style={{ flex: 1 }}
        >
          {scenes.map((scene, i) => (
            <GalleryRoom key={`${scene.plaque}-${i}`} scene={scene} index={i} scrollX={scrollX} width={width} />
          ))}
        </Animated.ScrollView>

        {/* Floor rail + actions */}
        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, gap: 12 }}>
          <View style={{ height: 1, backgroundColor: bronze(0.18), marginBottom: 8 }} />
          <Pressable
            onPress={advance}
            accessibilityRole="button"
            accessibilityLabel={isLast ? tr("onboarding.letsGo") : tr("onboarding.continue")}
            className="active:opacity-80"
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 16,
              backgroundColor: MUSEUM.accent,
              paddingVertical: 17,
            }}
          >
            <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: MUSEUM.ink }}>
              {isLast ? tr("onboarding.letsGo") : tr("onboarding.continue")}
            </Text>
            {!isLast && <IconSymbol name={"arrow.right" as never} size={16} color={MUSEUM.ink} />}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
