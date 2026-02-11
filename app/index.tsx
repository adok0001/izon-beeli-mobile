import { View, Text, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

const mascot = require("../public/mascot.jpg");

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <Image
          source={mascot}
          style={{ width: 120, height: 80 }}
          contentFit="contain"
        />
        <Text className="mb-1 mt-4 text-3xl font-bold text-blue-600">
          Izon Beeli
        </Text>
        <Text className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
          Learn African Languages
        </Text>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/learn" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
