import { GalleryRoom, PaintingWall, PLAQUE, type Scene } from "@/components/auth/gallery-tour";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { fonts } from "@/constants/typography";
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
 * driven entirely by MOBILE_TOUR_REGISTRY so every tour id reuses it. The room
 * primitives themselves live in `components/auth/gallery-tour.tsx`, shared with
 * the pre-auth landing carousel.
 */

export function FeatureTourModal() {
  const { activeTour, dismissTour } = useTourStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const config = activeTour ? MOBILE_TOUR_REGISTRY[activeTour] : null;

  const scenes = useMemo<Scene[]>(() => {
    if (!config) return [];
    const foyer: Scene = {
      icon: config.heroIcon,
      title: t(config.titleKey),
      body: t(config.subtitleKey),
      plaque: PLAQUE[0],
    };
    const rooms = config.features.map<Scene>((f, i) => ({
      icon: f.icon,
      title: t(f.titleKey),
      body: t(f.detailKey),
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
            accessibilityLabel={t("onboarding.skip")}
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
            <IconSymbol name={"xmark"} size={15} color={MUSEUM.textDim} />
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
            accessibilityLabel={isLast ? t("onboarding.letsGo") : t("onboarding.continue")}
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
              {isLast ? t("onboarding.letsGo") : t("onboarding.continue")}
            </Text>
            {!isLast && <IconSymbol name={"arrow.right"} size={16} color={MUSEUM.ink} />}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
