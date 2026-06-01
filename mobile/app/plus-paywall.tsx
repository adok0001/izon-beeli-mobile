import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppConfig } from "@/lib/hooks/use-app-config";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PLUS_FEATURES = [
  {
    icon: "snowflake",
    title: "Auto streak freezes",
    description: "Get 1 streak freeze automatically restocked every month.",
  },
  {
    icon: "arrow.down.circle",
    title: "Offline audio downloads",
    description: "Download lessons and listen without an internet connection.",
  },
  {
    icon: "slider.horizontal.3",
    title: "Custom review intervals",
    description: "Adjust your spaced repetition schedule to match your pace.",
  },
  {
    icon: "paintpalette",
    title: "Profile customization",
    description: "Choose your badge accent color and profile theme.",
  },
  {
    icon: "bell.badge",
    title: "Early access",
    description: "Get new language content before anyone else.",
  },
] as const;

export default function PlusPaywallScreen() {
  const router = useRouter();
  const { data: config } = useAppConfig();
  const { data: user } = useCurrentUser();
  const [loading, setLoading] = useState(false);

  const shouldGoBack = !config?.plusEnabled || user?.planTier === "plus";

  useEffect(() => {
    if (shouldGoBack) {
      router.back();
    }
  }, [shouldGoBack, router]);

  // If Plus is globally disabled or user already has Plus, render nothing while navigating back.
  if (shouldGoBack) {
    return null;
  }

  async function handleSubscribe() {
    if (Platform.OS === "web") {
      Alert.alert("Subscribe on mobile", "Open the Beeli app on iOS or Android to subscribe.");
      return;
    }

    setLoading(true);
    try {
      // RevenueCat purchase flow (stubbed until react-native-purchases is installed via EAS)
      // In production: replace with Purchases.purchasePackage(offering.availablePackages[0])
      // Then call the server to sync planTier.
      Alert.alert(
        "Coming soon",
        "In-app purchase will be available in the next app release.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Purchase failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* Header */}
        <View className="items-center pt-8 pb-6">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
            <IconSymbol name="star.fill" size={32} color="#6366f1" />
          </View>
          <Text className="text-2xl font-extrabold text-neutral-900 dark:text-white text-center">
            Beeli Plus
          </Text>
          <Text className="mt-2 text-neutral-500 dark:text-neutral-400 text-center text-sm max-w-xs">
            Unlock the full Beeli experience and accelerate your language journey.
          </Text>
        </View>

        {/* Features */}
        <View className="gap-4 mb-8">
          {PLUS_FEATURES.map((f) => (
            <View
              key={f.title}
              className="flex-row items-start gap-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4"
            >
              <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                <IconSymbol name={f.icon as any} size={18} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-neutral-900 dark:text-white text-sm">
                  {f.title}
                </Text>
                <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {f.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 mb-6">
          <View className="flex-row items-baseline gap-1 mb-1">
            <Text className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
              $4.99
            </Text>
            <Text className="text-indigo-500 text-sm">/month</Text>
          </View>
          <Text className="text-indigo-600 dark:text-indigo-400 text-sm">
            or $39.99/year — save 33%
          </Text>
        </View>

        {/* Subscribe button */}
        <Pressable
          onPress={handleSubscribe}
          disabled={loading}
          className="bg-indigo-600 active:bg-indigo-700 rounded-2xl py-4 items-center mb-4"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Subscribe to Plus</Text>
          )}
        </Pressable>

        {/* Restore / cancel */}
        <Pressable onPress={() => router.back()} className="items-center py-2">
          <Text className="text-neutral-400 text-sm">Maybe later</Text>
        </Pressable>

        <Text className="text-center text-xs text-neutral-400 mt-4">
          Subscriptions auto-renew. Cancel anytime in your App Store settings.
          {"\n"}Payment charged to your Apple ID or Google Play account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
