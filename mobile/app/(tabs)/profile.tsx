import { FeedbackModal } from "@/components/feedback-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { XpLevelBadge } from "@/components/xp-level-badge";
import { canAccessEducatorPanel, type DailyGoal, useCurrentUser, useUpdateDailyGoal } from "@/lib/hooks/use-current-user";
import { analytics } from "@/lib/analytics";
import { useAppConfig } from "@/lib/hooks/use-app-config";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { getLevelInfo } from "@/lib/xp-levels";
import { useLanguageStore } from "@/store/language-store";
import { useTourStore } from "@/store/tour-store";
import { useWelcomeChecklistStore } from "@/store/welcome-checklist-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLanguageName } from "@/lib/mock-data";


const GOAL_OPTIONS: { id: DailyGoal; icon: string; labelKey: string; detailKey: string }[] = [
  { id: "casual", icon: "leaf.fill", labelKey: "onboarding.goalCasual", detailKey: "onboarding.goalCasualDetail" },
  { id: "steady", icon: "flame.fill", labelKey: "onboarding.goalSteady", detailKey: "onboarding.goalSteadyDetail" },
  { id: "intensive", icon: "bolt.fill", labelKey: "onboarding.goalIntensive", detailKey: "onboarding.goalIntensiveDetail" },
];

function StatCard({ icon, label, value, color }: Readonly<{ icon: string; label: string; value: string; color?: string }>) {
  const M = useMuseumTheme();
  const iconColor = color ?? M.accent;
  return (
    <View
      style={{
        flex: 1, alignItems: "center",
        borderRadius: 14, paddingHorizontal: 8, paddingVertical: 14,
        backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
      }}
    >
      <IconSymbol name={icon as any} size={20} color={iconColor} />
      <Text style={{ marginTop: 6, fontSize: 18, fontWeight: "800", color: M.text }}>
        {value}
      </Text>
      <Text style={{ marginTop: 2, fontSize: 10, color: M.muted, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  detail,
  onPress,
  danger,
}: Readonly<{ icon: string; label: string; detail?: string; onPress: () => void; danger?: boolean }>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: M.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}: ${detail}` : label}
      className="active:opacity-70"
    >
      <IconSymbol name={icon as any} size={18} color={danger ? "#f87171" : M.muted} />
      <Text
        style={{
          marginLeft: 14, flex: 1, fontSize: 14,
          color: danger ? "#f87171" : M.text,
          fontWeight: danger ? "700" : "500",
        }}
      >
        {label}
      </Text>
      {!!detail && (
        <Text style={{ marginRight: 8, fontSize: 12, color: M.muted }}>{detail}</Text>
      )}
      {!danger && <IconSymbol name="chevron.right" size={14} color={M.muted} />}
    </Pressable>
  );
}

function SectionLabel({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 4 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: M.accent }} />
      <Text
        style={{
          fontSize: 9, fontWeight: "800", letterSpacing: 2,
          textTransform: "uppercase", color: M.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { data: currentUser } = useCurrentUser();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const updateDailyGoal = useUpdateDailyGoal();
  const { data: summary } = useProgressSummary();
  const { data: config } = useAppConfig();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();
  const showTour = useTourStore((s) => s.showTour);
  const resetChecklist = useWelcomeChecklistStore((s) => s.reset);
  const resetTours = useTourStore((s) => s.reset);
  const isAdmin = currentUser?.isAdmin ?? false;
  const levelInfo = getLevelInfo(summary?.points ?? 0);
  const showPlusCta =
    config?.plusEnabled && currentUser?.planTier !== "plus" && levelInfo.level >= 5;
  const canAccessEducator = currentUser ? canAccessEducatorPanel(currentUser) : false;
  const reviewerRole = currentUser?.reviewerRole ?? null;
  const displayName = user?.username ?? "Learner";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: 20, paddingTop: 32, paddingBottom: 28,
            backgroundColor: M.ink,
            borderBottomWidth: 1, borderBottomColor: M.border,
          }}
        >
          <View
            style={{
              width: 72, height: 72, borderRadius: 36,
              alignItems: "center", justifyContent: "center",
              backgroundColor: M.accent,
              marginBottom: 12,
              shadowColor: M.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "900", color: M.ink }}>{initial}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: M.text, letterSpacing: -0.3 }}>
            {displayName}
          </Text>
          {email ? (
            <Text style={{ marginTop: 3, fontSize: 12, color: M.sub }}>{email}</Text>
          ) : null}
          {/* Role badges */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {isAdmin && (
              <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: `${M.accent}20`, borderWidth: 1, borderColor: `${M.accent}40` }}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: M.accent }}>ADMIN</Text>
              </View>
            )}
            {reviewerRole === "elder" && (
              <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: "rgba(45, 212, 191, 0.15)", borderWidth: 1, borderColor: "rgba(45, 212, 191, 0.3)" }}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: "#2dd4bf" }}>{t("reviewerApplication.roleElder").toUpperCase()}</Text>
              </View>
            )}
            {reviewerRole === "professor" && (
              <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: "rgba(99, 102, 241, 0.15)", borderWidth: 1, borderColor: "rgba(99, 102, 241, 0.3)" }}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: "#818cf8" }}>{t("reviewerApplication.roleProfessor").toUpperCase()}</Text>
              </View>
            )}
            {reviewerRole === "teacher" && (
              <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: "rgba(96, 165, 250, 0.15)", borderWidth: 1, borderColor: "rgba(96, 165, 250, 0.3)" }}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: "#60a5fa" }}>{t("reviewerApplication.roleTeacher").toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={{ backgroundColor: M.card, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 }}>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <XpLevelBadge points={summary?.points ?? 0} variant="full" />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatCard icon="flame.fill" label={t("profile.streak")} value={String(summary?.streak ?? 0)} color="#fb923c" />
            <StatCard icon="snowflake" label={t("profile.freezes")} value={String(summary?.freezeCount ?? 0)} color="#60a5fa" />
            <StatCard icon="checkmark.circle.fill" label={t("profile.lessons")} value={String(summary?.completedCount ?? 0)} color="#4ade80" />
          </View>
        </View>

        {/* Plus CTA */}
        {showPlusCta ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8, backgroundColor: M.card }}>
            <Pressable
              onPress={() => { analytics.plusCtaTapped("profile"); router.push("/plus-paywall"); }}
              style={{
                flexDirection: "row", alignItems: "center", gap: 14,
                borderRadius: 16, padding: 16,
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                borderWidth: 1, borderColor: "rgba(99, 102, 241, 0.25)",
                borderLeftWidth: 4, borderLeftColor: "#6366f1",
              }}
              className="active:opacity-80"
            >
              <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(99, 102, 241, 0.15)" }}>
                <IconSymbol name="heart.fill" size={18} color="#818cf8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#818cf8" }}>Support Beeli</Text>
                <Text style={{ marginTop: 2, fontSize: 11, color: "rgba(129, 140, 248, 0.7)", lineHeight: 15 }}>
                  You've reached {levelInfo.title}. Unlock Plus and keep us growing.
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color="#6366f1" />
            </Pressable>
          </View>
        ) : null}

        {/* Menu */}
        <View style={{ backgroundColor: M.card, paddingHorizontal: 20, paddingBottom: 8 }}>
          <SectionLabel label={t("settings.learning")} />
          <MenuRow icon="chart.bar.fill" label={t("profile.progressDashboard")} onPress={() => router.push("/dashboard")} />
          <MenuRow icon="book.fill" label={t("profile.learning")} detail={getLanguageName(selectedLanguageId)} onPress={() => router.push("/(tabs)/learn")} />
          <MenuRow
            icon="target"
            label={t("profile.dailyGoal")}
            detail={currentUser?.dailyGoal ? t(`onboarding.goal${currentUser.dailyGoal.charAt(0).toUpperCase()}${currentUser.dailyGoal.slice(1)}` as any) : undefined}
            onPress={() => setGoalPickerVisible(true)}
          />
          <MenuRow icon="character.book.closed" label={t("profile.dictionary")} onPress={() => router.push("/dictionary")} />

          {currentUser?.isAdmin ? (
            <>
              <SectionLabel label="Admin" />
              <MenuRow icon="shield.fill" label={t("educator.panelTitle")} onPress={() => router.push("/(tabs)/educator")} />
              <MenuRow icon="gearshape.fill" label={t("educator.adminPanel")} onPress={() => router.push("/(tabs)/admin")} />
            </>
          ) : null}
          {!isAdmin && canAccessEducator ? (
            <>
              <SectionLabel label="Educator" />
              <MenuRow icon="shield.fill" label={t("educator.panelTitle")} onPress={() => router.push("/(tabs)/educator")} />
            </>
          ) : null}

          <SectionLabel label="Community" />
          {(isAdmin || currentUser?.isReviewer) && (
            <MenuRow icon="checkmark.shield.fill" label={t("profile.reviewContributions")} onPress={() => router.push("/review")} />
          )}
          <MenuRow icon="doc.text.fill" label={t("profile.myContributions")} onPress={() => router.push("/my-contributions")} />
          <MenuRow icon="star.fill" label={t("profile.bounties")} onPress={() => router.push("/bounties")} />
          <MenuRow icon="trophy.fill" label={t("profile.contributors")} onPress={() => router.push("/contributors")} />
          <MenuRow icon="person.3.fill" label={t("profile.classroom")} onPress={() => router.push("/classroom")} />

          <SectionLabel label={t("settings.app")} />
          <MenuRow icon="exclamationmark.bubble" label={t("profile.sendFeedback")} onPress={() => setFeedbackVisible(true)} />
          <MenuRow icon="map.fill" label={t("profile.restartWelcomeTour")} onPress={async () => { await resetChecklist(); await resetTours(); showTour("welcome"); }} />
          <MenuRow icon="gearshape.fill" label={t("profile.settings")} onPress={() => router.push("/settings")} />

          <View style={{ marginTop: 20 }}>
            <MenuRow icon="xmark" label={t("profile.signOut")} onPress={() => { analytics.reset(); signOut(); }} danger />
          </View>
        </View>

        <View style={{ height: 40, backgroundColor: M.card }} />
      </ScrollView>

      <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} />

      {/* Goal picker */}
      <Modal visible={goalPickerVisible} transparent animationType="slide" onRequestClose={() => setGoalPickerVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={() => setGoalPickerVisible(false)} />
        <View
          style={{
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            backgroundColor: M.ink,
            borderTopWidth: 1, borderTopColor: M.border,
            paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: M.border, alignSelf: "center", marginBottom: 16 }} />
          <Text style={{ marginBottom: 20, textAlign: "center", fontSize: 17, fontWeight: "800", color: M.text }}>
            {t("profile.dailyGoal")}
          </Text>
          {GOAL_OPTIONS.map((opt) => {
            const selected = currentUser?.dailyGoal === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => { updateDailyGoal.mutate(opt.id); setGoalPickerVisible(false); }}
                style={{
                  marginBottom: 10, flexDirection: "row", alignItems: "center",
                  borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? M.accent : M.border,
                  backgroundColor: selected ? `${M.accent}10` : M.card,
                }}
                className="active:opacity-70"
              >
                <View
                  style={{
                    marginRight: 14, width: 42, height: 42, borderRadius: 21,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: selected ? M.accent : M.border,
                  }}
                >
                  <IconSymbol name={opt.icon as any} size={18} color={selected ? M.ink : M.sub} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? M.accent : M.text }}>
                    {t(opt.labelKey as any)}
                  </Text>
                  <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }}>{t(opt.detailKey as any)}</Text>
                </View>
                {selected && <IconSymbol name="checkmark.circle.fill" size={20} color={M.accent} />}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
