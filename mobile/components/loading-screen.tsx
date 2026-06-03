import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Image } from "expo-image";

const TIPS = [
  // Language learning
  "Repeating words out loud trains your mouth to form sounds your ears haven't memorised yet.",
  "Daily 5-minute sessions beat one-hour cram sessions every time.",
  "Listening to native audio — even without fully understanding — builds your ear.",
  "Your accent improves naturally the more you speak, not the more you think about it.",
  "Tonal languages reveal their logic once you start seeing tone as meaning, not music.",
  "The fastest way to remember a word is to use it in a real sentence today.",
  "Mistakes in speaking are not failures — they are the fastest feedback your brain can get.",
  "Reading and listening together reinforces both vocabulary and pronunciation at once.",
  // App features
  "Open the Journal tab to write in the language you're learning — even a single sentence counts.",
  "Audio lessons in the Listen tab let you absorb language without looking at a screen.",
  "Your streak motivates short, daily practice — even one lesson keeps it alive.",
  "The community Feed shows what other learners are achieving — your completions appear there too.",
  "Quizzes at the end of a lesson help move vocabulary from short-term to long-term memory.",
  "The Dictionary is available from the Profile tab — look up any word you've encountered.",
  "Story mode lets you follow a narrative while picking up vocabulary naturally in context.",
  "Proverbs in the app carry centuries of cultural wisdom — reading them teaches idioms, not just words.",
  // Cultural facts
  "Izon (Ijaw) is spoken by over 2 million people in the Niger Delta region of Nigeria.",
  "Twi is one of the most widely spoken languages in Ghana, with over 9 million speakers.",
  "The Ge'ez script, one of Africa's oldest writing systems, is still used in Ethiopian and Eritrean liturgy.",
  "Adinkra symbols from the Akan people each carry a specific philosophical meaning.",
  "African languages often encode social relationships through tone — how you say something matters as much as what you say.",
  "Many African proverbs encode philosophical wisdom passed down across generations.",
  "Swahili is a Bantu language spoken by over 200 million people across East and Central Africa.",
  "The Ijaw people of the Niger Delta have one of the oldest continuous civilisations in West Africa.",
];

const mascot = require("../public/mascot.jpg");

interface LoadingScreenProps {
  showBranding?: boolean;
  color?: string;
}

export function LoadingScreen({ showBranding = false, color = "#3b82f6" }: LoadingScreenProps) {
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  return (
    <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-neutral-900">
      {showBranding && (
        <>
          <Image source={mascot} style={{ width: 120, height: 80 }} contentFit="contain" />
          <Text className="mb-1 mt-4 text-3xl font-bold text-blue-600">Beeli</Text>
          <Text className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
            Learn African Languages
          </Text>
        </>
      )}
      <ActivityIndicator size="large" color={color} />
      <View className="mt-8 rounded-2xl bg-blue-50 px-5 py-4 dark:bg-blue-950">
        <Text className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400">
          Tip
        </Text>
        <Text className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {tip}
        </Text>
      </View>
    </View>
  );
}
