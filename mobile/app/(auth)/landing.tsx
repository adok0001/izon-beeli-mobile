import { GalleryRoom, PaintingWall, PLAQUE, type Scene } from "@/components/auth/gallery-tour";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { MOBILE_TOUR_REGISTRY } from "@/lib/tours/mobile-tour-registry";
import { MUSEUM, bronze } from "@/lib/use-museum-theme";
import { useGuestStore } from "@/store/guest-store";
import { useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Pre-auth landing: the same Foyer Tour gallery-walk as `FeatureTourModal`
 * (fed by `MOBILE_TOUR_REGISTRY.welcome`), but as the first screen a
 * signed-out visitor with no known account lands on — "Get Started" /
 * "I already have an account" stay pinned below the carousel throughout,
 * instead of a dismiss button.
 */
export default function LandingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const enterGuest = useGuestStore((s) => s.enterGuest);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const tr = (key: string) => t(key as never) as string;
  const config = MOBILE_TOUR_REGISTRY.welcome;

  const scenes = useMemo<Scene[]>(() => {
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
  }, [t]);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
  });

  const onGetStarted = () => router.push("/(auth)/sign-up");

  const onSignIn = () => router.push("/(auth)/sign-in");

  const onContinueAsGuest = () => {
    analytics.guestStart();
    enterGuest();
    router.replace("/(tabs)/learn");
  };

  return (
    <View style={{ flex: 1, backgroundColor: MUSEUM.inkDeep }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
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

        <View style={{ paddingTop: 10, paddingHorizontal: 20, alignItems: "center" }}>
          <PaintingWall count={scenes.length} scrollX={scrollX} width={width} />
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

        <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 12 }}>
          <View style={{ height: 1, backgroundColor: bronze(0.18), marginBottom: 8 }} />

          <Button label={t("auth.getStarted")} onPress={onGetStarted} />
          <Button label={t("auth.alreadyHaveAccountAction")} onPress={onSignIn} variant="secondary" />

          <Pressable onPress={onContinueAsGuest} hitSlop={8} accessibilityRole="button" style={{ alignSelf: "center", paddingVertical: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: MUSEUM.textDim }}>
              {t("auth.continueAsGuest")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
