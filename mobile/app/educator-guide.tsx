import { IconSymbol } from "@/components/ui/icon-symbol";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Section = {
  icon: string;
  titleKey: string;
  bodyKey: string;
};

const SECTIONS: Section[] = [
  { icon: "square.and.pencil", titleKey: "educator.guide.contentTitle", bodyKey: "educator.guide.contentBody" },
  { icon: "checkmark.seal.fill", titleKey: "educator.guide.reviewTitle", bodyKey: "educator.guide.reviewBody" },
  { icon: "person.2.fill", titleKey: "educator.guide.classroomTitle", bodyKey: "educator.guide.classroomBody" },
];

function GuideSection({ icon, title, body }: Readonly<{ icon: string; title: string; body: string }>) {
  return (
    <View className="mb-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
        <IconSymbol name={icon as never} size={20} color="#3b82f6" />
      </View>
      <Text className="text-base font-bold text-neutral-900 dark:text-white">{title}</Text>
      <Text className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{body}</Text>
    </View>
  );
}

export default function EducatorGuideScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: t("educator.guide.title"), headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["bottom"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        >
          <View className="mb-2 h-14 w-14 items-center justify-center rounded-2xl bg-blue-500">
            <IconSymbol name="book.fill" size={28} color="#fff" />
          </View>
          <Text className="mt-4 text-3xl font-bold text-neutral-900 dark:text-white">
            {t("educator.guide.heading")}
          </Text>
          <Text className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t("educator.guide.intro")}
          </Text>

          <Text className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[1.5px] text-neutral-400 dark:text-neutral-500">
            {t("educator.guide.rolesLabel")}
          </Text>

          {SECTIONS.map((s) => (
            <GuideSection
              key={s.titleKey}
              icon={s.icon}
              title={t(s.titleKey)}
              body={t(s.bodyKey)}
            />
          ))}

          <Text className="mb-3 mt-2 text-xs font-semibold uppercase tracking-[1.5px] text-neutral-400 dark:text-neutral-500">
            {t("educator.guide.qualityLabel")}
          </Text>
          <View className="mb-6 rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
            <Text className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
              {t("educator.guide.qualityNote")}
            </Text>
          </View>

          <Pressable
            onPress={() => router.replace("/(tabs)/educator")}
            className="items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
          >
            <Text className="text-base font-bold text-white">{t("educator.guide.cta")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
