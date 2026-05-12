import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMyContributions } from "@/lib/hooks/use-contributions";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import {
    MOBILE_CHECKLIST_REGISTRY,
    type MobileChecklistAudience,
    type MobileChecklistId,
} from "@/lib/tours/mobile-checklist-registry";
import { useWelcomeChecklistStore } from "@/store/welcome-checklist-store";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChecklistItem {
  id: MobileChecklistId;
  route: string;
  audience: MobileChecklistAudience;
  titleKey: string;
  descriptionKey: string;
  icon: string;
}

function canSeeAudience(audience: MobileChecklistAudience, isAdmin = false, isReviewer = false) {
  if (audience === "all") return true;
  if (audience === "admin") return isAdmin;
  return isReviewer || isAdmin;
}

function audienceLabel(audience: MobileChecklistAudience, t: (key: string) => string) {
  if (audience === "admin") return t("welcomeChecklist.groupAdmin");
  if (audience === "reviewer") return t("welcomeChecklist.groupReviewer");
  return t("welcomeChecklist.groupCore");
}

export function WelcomeChecklistFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const tr = (key: string) => t(key as any) as string;

  const { data: currentUser } = useCurrentUser();
  const { data: summary } = useProgressSummary();
  const { data: myContributions } = useMyContributions();

  const completedActionIds = useWelcomeChecklistStore((s) => s.completedActionIds);
  const markCompleted = useWelcomeChecklistStore((s) => s.markCompleted);
  const isHydrated = useWelcomeChecklistStore((s) => s._hydrated);

  const isAdmin = currentUser?.isAdmin ?? false;
  const isReviewer = currentUser?.isReviewer ?? false;

  const visibleItems = useMemo<ChecklistItem[]>(
    () =>
      Object.entries(MOBILE_CHECKLIST_REGISTRY)
        .map(([id, def]) => ({
          id: id as MobileChecklistId,
          route: def.route,
          audience: def.audience,
          titleKey: def.titleKey,
          descriptionKey: def.descriptionKey,
          icon: def.icon,
        }))
        .filter((item) => canSeeAudience(item.audience, isAdmin, isReviewer)),
    [isAdmin, isReviewer]
  );

  const pendingCount = visibleItems.filter((item) => !completedActionIds.includes(item.id)).length;

  const grouped = useMemo(
    () =>
      (["all", "reviewer", "admin"] as const)
        .map((audience) => ({
          audience,
          label: audienceLabel(audience, tr),
          items: visibleItems.filter((item) => item.audience === audience),
        }))
        .filter((group) => group.items.length > 0),
    [tr, visibleItems]
  );

  // Action-based auto-completion using real progress/contribution signals.
  useEffect(() => {
    const toComplete: MobileChecklistId[] = [];

    if ((summary?.completedCount ?? 0) > 0 && !completedActionIds.includes("completeOneLesson")) {
      toComplete.push("completeOneLesson");
    }

    if ((myContributions?.length ?? 0) > 0 && !completedActionIds.includes("submitContribution")) {
      toComplete.push("submitContribution");
    }

    if (toComplete.length > 0) {
      markCompleted(toComplete);
    }
  }, [summary?.completedCount, myContributions?.length, completedActionIds, markCompleted]);

  if (!isHydrated || pendingCount <= 0) return null;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", right: 16, bottom: 72 + insets.bottom, zIndex: 60 }}>
      {open ? (
        <View className="mb-3 w-[320px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <View>
              <Text className="text-sm font-bold text-neutral-900 dark:text-white">{t("welcomeChecklist.title")}</Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">{t("welcomeChecklist.tasksRemaining", { count: pendingCount })}</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <IconSymbol name="xmark" size={16} color="#9ca3af" />
            </Pressable>
          </View>

          <ScrollView className="max-h-96" contentContainerStyle={{ padding: 12 }}>
            {grouped.map((group) => (
              <View key={group.audience} className="mb-4">
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {group.label}
                </Text>
                <View className="gap-2">
                  {group.items.map((item) => {
                    const done = completedActionIds.includes(item.id);
                    return (
                      <View
                        key={item.id}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/60"
                      >
                        <View className="flex-row items-start">
                          <Pressable
                            onPress={() => {
                              if (!done) markCompleted([item.id]);
                            }}
                            hitSlop={8}
                            className="mr-2 mt-0.5"
                          >
                            <IconSymbol
                              name={done ? "checkmark.circle.fill" : "circle"}
                              size={16}
                              color={done ? "#22c55e" : "#9ca3af"}
                            />
                          </Pressable>

                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-neutral-900 dark:text-white">{tr(item.titleKey)}</Text>
                            <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{tr(item.descriptionKey)}</Text>
                            <Pressable
                              onPress={() => {
                                setOpen(false);
                                router.push(item.route as any);
                              }}
                              className="mt-2 flex-row items-center"
                            >
                              <IconSymbol name={item.icon as any} size={14} color="#2563eb" />
                              <Text className="ml-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">{t("welcomeChecklist.openAction")}</Text>
                              <View className="ml-1">
                                <IconSymbol name="chevron.right" size={12} color="#2563eb" />
                              </View>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center rounded-full bg-blue-600 px-4 py-2.5 shadow-lg active:opacity-80"
      >
        <IconSymbol name="checkmark.circle.fill" size={16} color="#ffffff" />
        <Text className="ml-2 text-sm font-bold text-white">{t("welcomeChecklist.pendingTasks", { count: pendingCount })}</Text>
      </Pressable>
    </View>
  );
}
