import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAwardChecklistBonus, useProgressSummary } from "@/lib/hooks/use-progress";
import { useMyContributions } from "@/lib/hooks/use-contributions";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useJournal } from "@/lib/hooks/use-journal";
import { useMuseumTheme } from "@/lib/use-museum-theme";
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
  const M = useMuseumTheme();
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
      <Pressable
        onPress={onDismiss}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <Animated.View
          style={{ transform: [{ scale }], opacity, marginHorizontal: 32, alignItems: "center", borderRadius: 24, backgroundColor: M.card, paddingHorizontal: 32, paddingVertical: 40, borderWidth: 1, borderColor: M.border }}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <View style={{ marginBottom: 16, height: 96, width: 96, alignItems: "center", justifyContent: "center", borderRadius: 48, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}>
              <IconSymbol name="checkmark.seal.fill" size={52} color={M.accent} />
            </View>
          </Animated.View>

          <Text style={{ textAlign: "center", fontSize: 22, fontWeight: "700", color: M.text }}>
            {t("welcomeChecklist.allCompleteTitle")}
          </Text>
          <Text style={{ marginTop: 8, textAlign: "center", fontSize: 13, color: M.sub }}>
            {t("welcomeChecklist.allCompleteBody")}
          </Text>

          <View style={{ marginTop: 20, borderRadius: 16, backgroundColor: M.accentGlow, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: M.accentBorder }}>
            <Text style={{ textAlign: "center", fontSize: 20, fontWeight: "700", color: M.accent }}>
              {t("welcomeChecklist.allCompleteBonus")}
            </Text>
          </View>

          <Pressable
            onPress={onDismiss}
            style={{ marginTop: 24, borderRadius: 12, backgroundColor: M.accent, paddingHorizontal: 32, paddingVertical: 12 }}
            className="active:opacity-80"
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: M.ink }}>
              {t("welcomeChecklist.allCompleteDismiss")}
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function WelcomeChecklistFab() {
  const M = useMuseumTheme();
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
      <AllCompleteModal
        visible={celebrationVisible}
        onDismiss={() => setCelebrationVisible(false)}
      />

      {pendingCount > 0 && (
      <View pointerEvents="box-none" style={{ position: "absolute", right: 16, bottom: 72 + insets.bottom, zIndex: 60 }}>

      {open ? (
        <View style={{ marginBottom: 12, width: 320, overflow: "hidden", borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.card }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 16, paddingVertical: 12 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>{t("welcomeChecklist.title")}</Text>
              <Text style={{ fontSize: 11, color: M.sub }}>{t("welcomeChecklist.tasksRemaining", { count: pendingCount })}</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <IconSymbol name="xmark" size={16} color={M.muted} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 384 }} contentContainerStyle={{ padding: 12 }}>
            {grouped.map((group) => (
              <View key={group.audience} style={{ marginBottom: 16 }}>
                <Text style={{ marginBottom: 8, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
                  {group.label}
                </Text>
                <View style={{ gap: 8 }}>
                  {group.items.map((item) => {
                    const done = completedActionIds.includes(item.id);
                    return (
                      <View
                        key={item.id}
                        style={{ borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, paddingHorizontal: 12, paddingVertical: 10 }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                          <Pressable
                            onPress={() => {
                              if (!done) markCompleted([item.id]);
                            }}
                            hitSlop={8}
                            style={{ marginRight: 8, marginTop: 2 }}
                          >
                            <IconSymbol
                              name={done ? "checkmark.circle.fill" : "circle"}
                              size={16}
                              color={done ? M.success : M.muted}
                            />
                          </Pressable>

                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>{tr(item.titleKey)}</Text>
                            <Text style={{ marginTop: 2, fontSize: 11, color: M.sub }}>{tr(item.descriptionKey)}</Text>
                            <Pressable
                              onPress={() => {
                                if (!done) markCompleted([item.id]);
                                setOpen(false);
                                router.push(item.route as any);
                              }}
                              style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}
                            >
                              <IconSymbol name={item.icon as any} size={14} color={M.accent} />
                              <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: "600", color: M.accent }}>{t("welcomeChecklist.openAction")}</Text>
                              <View style={{ marginLeft: 4 }}>
                                <IconSymbol name="chevron.right" size={12} color={M.accent} />
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
            <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: "700", color: "#ffffff" }}>{t("welcomeChecklist.pendingTasks", { count: pendingCount })}</Text>
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
    backgroundColor: "#C4862A",
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
