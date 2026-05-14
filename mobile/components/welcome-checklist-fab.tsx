import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAwardChecklistBonus, useProgressSummary } from "@/lib/hooks/use-progress";
import { useMyContributions } from "@/lib/hooks/use-contributions";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useJournal } from "@/lib/hooks/use-journal";
import { playFinishSound } from "@/lib/sounds";
import {
    MOBILE_CHECKLIST_REGISTRY,
    type MobileChecklistAudience,
    type MobileChecklistId,
} from "@/lib/tours/mobile-checklist-registry";
import { useWelcomeChecklistStore } from "@/store/welcome-checklist-store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Reanimated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
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

function AllCompleteModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const starRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      playFinishSound().catch(() => {});
      scale.setValue(0.5);
      opacity.setValue(0);
      starRotate.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(starRotate, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.5);
      opacity.setValue(0);
    }
  }, [visible]);

  const rotate = starRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "20deg"] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Pressable onPress={onDismiss} className="flex-1 items-center justify-center bg-black/60">
        <Animated.View
          style={{ transform: [{ scale }], opacity }}
          className="mx-8 items-center rounded-3xl bg-white px-8 py-10 shadow-2xl dark:bg-neutral-900"
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <IconSymbol name="checkmark.seal.fill" size={52} color="#f59e0b" />
            </View>
          </Animated.View>

          <Text className="text-center text-2xl font-bold text-neutral-900 dark:text-white">
            {t("welcomeChecklist.allCompleteTitle")}
          </Text>
          <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t("welcomeChecklist.allCompleteBody")}
          </Text>

          <View className="mt-5 rounded-2xl bg-amber-50 px-6 py-3 dark:bg-amber-900/30">
            <Text className="text-center text-xl font-bold text-amber-600 dark:text-amber-400">
              {t("welcomeChecklist.allCompleteBonus")}
            </Text>
          </View>

          <Pressable
            onPress={onDismiss}
            className="mt-6 rounded-xl bg-blue-600 px-8 py-3 active:opacity-80"
          >
            <Text className="text-sm font-bold text-white">
              {t("welcomeChecklist.allCompleteDismiss")}
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function WelcomeChecklistFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const { t } = useTranslation();
  const tr = (key: string) => t(key as any) as string;

  const { data: currentUser } = useCurrentUser();
  const { data: summary } = useProgressSummary();
  const { data: myContributions } = useMyContributions();
  const { data: journalEntries } = useJournal();

  const completedActionIds = useWelcomeChecklistStore((s) => s.completedActionIds);
  const bonusAwarded = useWelcomeChecklistStore((s) => s.bonusAwarded);
  const markCompleted = useWelcomeChecklistStore((s) => s.markCompleted);
  const markBonusAwarded = useWelcomeChecklistStore((s) => s.markBonusAwarded);
  const isHydrated = useWelcomeChecklistStore((s) => s._hydrated);

  const { mutate: awardBonus } = useAwardChecklistBonus();

  const isAdmin = currentUser?.isAdmin ?? false;
  const isReviewer = currentUser?.isReviewer ?? false;

  const prevPendingRef = useRef<number | null>(null);
  const flashProgress = useSharedValue(0);
  const scaleAnim = useSharedValue(1);

  useEffect(() => {
    if (open) {
      cancelAnimation(flashProgress);
      cancelAnimation(scaleAnim);
      flashProgress.value = withTiming(0, { duration: 150 });
      scaleAnim.value = withTiming(1, { duration: 150 });
      return;
    }

    const PAUSE_MS = 12_000;
    flashProgress.value = withDelay(
      3_000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 450 }),
          withTiming(0, { duration: 700 }),
          withTiming(0, { duration: PAUSE_MS }),
        ),
        -1,
        false,
      ),
    );
    scaleAnim.value = withDelay(
      3_000,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 220 }),
          withTiming(1, { duration: 330 }),
          withTiming(1, { duration: PAUSE_MS }),
        ),
        -1,
        false,
      ),
    );
  }, [open]);

  const fabScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const flashOverlayStyle = useAnimatedStyle(() => ({
    opacity: flashProgress.value,
  }));

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

  // Auto-complete actions based on real progress signals
  useEffect(() => {
    const toComplete: MobileChecklistId[] = [];

    if ((summary?.completedCount ?? 0) > 0 && !completedActionIds.includes("completeOneLesson")) {
      toComplete.push("completeOneLesson");
    }
    if ((summary?.quizCount ?? 0) > 0 && !completedActionIds.includes("takeOneQuiz")) {
      toComplete.push("takeOneQuiz");
    }
    if ((myContributions?.length ?? 0) > 0 && !completedActionIds.includes("submitContribution")) {
      toComplete.push("submitContribution");
    }
    if ((journalEntries?.length ?? 0) > 0 && !completedActionIds.includes("writeJournalEntry")) {
      toComplete.push("writeJournalEntry");
    }

    if (toComplete.length > 0) {
      markCompleted(toComplete);
    }
  }, [summary?.completedCount, summary?.quizCount, myContributions?.length, journalEntries?.length, completedActionIds, markCompleted]);

  // Detect when all tasks just became complete — trigger celebration once
  useEffect(() => {
    if (!isHydrated) return;

    const prev = prevPendingRef.current;
    prevPendingRef.current = pendingCount;

    if (prev === null || bonusAwarded) return;

    if (prev > 0 && pendingCount === 0) {
      setOpen(false);
      setCelebrationVisible(true);
      markBonusAwarded();
      awardBonus();
    }
  }, [pendingCount, isHydrated, bonusAwarded, markBonusAwarded, awardBonus]);

  if (!isHydrated) return null;

  return (
    <>
      {/* Modal lives outside the pendingCount guard so it can show after the last task completes */}
      <AllCompleteModal
        visible={celebrationVisible}
        onDismiss={() => setCelebrationVisible(false)}
      />

      {pendingCount > 0 && (
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
                                if (!done) markCompleted([item.id]);
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

      <Reanimated.View style={fabScaleStyle}>
        <View style={styles.fabShell}>
          <Pressable
            onPress={() => setOpen((v) => !v)}
            style={styles.fabInner}
          >
            <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, flashOverlayStyle]}>
              <LinearGradient
                colors={["#0a0f2e", "#0c1b5e", "#0d2b7a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Reanimated.View>
            <IconSymbol name="checkmark.circle.fill" size={16} color="#ffffff" />
            <Text className="ml-2 text-sm font-bold text-white">{t("welcomeChecklist.pendingTasks", { count: pendingCount })}</Text>
          </Pressable>
        </View>
      </Reanimated.View>
    </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fabShell: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#2563eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
