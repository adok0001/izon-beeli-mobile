import { getAccent } from "@/constants/accent-colors";
import { LoadingScreen } from "@/components/loading-screen";
import { QueryErrorState } from "@/components/query-error-state";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useClassroomGroups } from "@/lib/hooks/use-classroom";
import { getLanguageName } from "@/lib/mock-data";
import type { Group } from "@/types";
import { useTranslation } from "react-i18next";

function GroupCard({ group }: { group: Group }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const memberCount = group.members.length;

  const handleCopyCode = () => {
    Clipboard.setString(group.inviteCode);
  };

  const handleShareCode = async (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    try {
      await Share.share({
        message: `Join my Beeli classroom group "${group.name}" with code: ${group.inviteCode}`,
      });
    } catch {
      // user dismissed
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/classroom/${group.id}`)}
      className="mb-3 rounded-xl bg-neutral-50 p-4 active:opacity-70 dark:bg-neutral-800"
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-lg font-bold text-neutral-900 dark:text-white">
          {group.name}
        </Text>
        <IconSymbol name="chevron.right" size={16} color={M.muted} />
      </View>
      <View className="mt-2 flex-row items-center gap-4">
        <View className="flex-row items-center">
          <IconSymbol name="person.2.fill" size={14} color={M.sub} />
          <Text className="ml-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t("classroom.memberCount", { count: memberCount })}
          </Text>
        </View>
        <View className="flex-row items-center">
          <IconSymbol name="book.fill" size={14} color={M.sub} />
          <Text className="ml-1 text-sm text-neutral-500 dark:text-neutral-400">
            {getLanguageName(group.languageId)}
          </Text>
        </View>
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Pressable
          onPress={handleCopyCode}
          onLongPress={handleShareCode}
          className="flex-row items-center rounded-lg bg-neutral-100 px-3 py-1.5 active:opacity-60 dark:bg-neutral-700"
        >
          <IconSymbol name="key.fill" size={12} color={M.muted} />
          <Text className="ml-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400">
            {group.inviteCode}
          </Text>
          <IconSymbol name="doc.on.doc" size={11} color={M.muted} className="ml-1.5" />
        </Pressable>
        <Pressable onPress={handleShareCode} hitSlop={8}>
          <IconSymbol name="square.and.arrow.up" size={16} color={getAccent("blue").solid} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function ClassroomScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: groups = [], isLoading, isError, refetch } = useClassroomGroups();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("profile.classroom"),
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/classroom/create")}
              hitSlop={8}
            >
              <IconSymbol name="plus" size={22} color={getAccent("blue").solid} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {isLoading ? (
          <LoadingScreen />
        ) : isError ? (
          <QueryErrorState onRetry={refetch} />
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 pb-8 pt-4"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
            renderItem={({ item }) => <GroupCard group={item} />}
            ListEmptyComponent={
              <View className="items-center px-8 py-16">
                <IconSymbol name="person.3.fill" size={48} color={M.border} />
                <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
                  {t("classroom.noGroups")}
                </Text>
              </View>
            }
            ListHeaderComponent={
              <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                {t("classroom.subtitle")}
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
