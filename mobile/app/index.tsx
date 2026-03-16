import { Image } from "expo-image";
import { ActivityIndicator, Text, View } from "react-native";

const mascot = require("../public/mascot.jpg");

/**
 * Splash / loading screen shown while AuthGate (in _layout.tsx) resolves
 * auth state and decides where to redirect.  No hooks needed here — all
 * auth and onboarding routing logic lives in AuthGate.
 */
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
      <Image
        source={mascot}
        style={{ width: 120, height: 80 }}
        contentFit="contain"
      />
      <Text className="mb-1 mt-4 text-3xl font-bold text-blue-600">
        Beeli
      </Text>
      <Text className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
        Learn African Languages
      </Text>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}
