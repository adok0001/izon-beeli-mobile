import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import {
  BADGE_LABELS,
  useContributors,
  type ContributorBadgeType,
  type ContributorProfile,
} from "@/lib/hooks/use-contributors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function BadgePill({ badge }: { badge: ContributorBadgeType }) {
  const info = BADGE_LABELS[badge];
  return (
    <View className="mr-1.5 flex-row items-center rounded-full bg-amber-50 px-2 py-0.5 dark:bg-amber-900/30">
      <IconSymbol name={info.icon as any} size={10} color="#d97706" />
      <Text className="ml-1 text-xs text-amber-700 dark:text-amber-400">
        {info.label}
      </Text>
    </View>
  );
}

function ContributorRow({
  contributor,
  rank,
}: {
  contributor: ContributorProfile;
  rank: number;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const medalColor =
    rank === 1 ? getAccent("amber").solid : rank === 2 ? M.muted : rank === 3 ? "#cd7f32" : undefined;

  return (
    <View className="mb-2 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: medalColor ? `${medalColor}20` : "#e5e7eb" }}
        >
          {medalColor ? (
            <IconSymbol name="medal.fill" size={20} color={medalColor} />
          ) : (
            <Text className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
              {rank}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {contributor.name}
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {t("contributors.wordsCount", { count: contributor.approvedCount })}
            {contributor.audioCount > 0 ? ` ${t("contributors.audioCount", { count: contributor.audioCount })}` : ""}
          </Text>
        </View>
      </View>

      {contributor.badges.length > 0 && (
        <View className="mt-2 flex-row flex-wrap">
          {contributor.badges.map((badge) => (
            <BadgePill key={badge} badge={badge} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ContributorsScreen() {
  const { t } = useTranslation();
  const { data: contributors } = useContributors();

  return (
    <>
      <Stack.Screen options={{ title: t("contributors.title") }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <FlatList
          data={contributors}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8 pt-4"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="mb-4">
              <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                {t("contributors.thankYou")}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ContributorRow contributor={item} rank={index + 1} />
          )}
        />
      </SafeAreaView>
    </>
  );
}
