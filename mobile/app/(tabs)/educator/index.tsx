import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  canAccessEducatorPanel,
  canManageBounties,
  useCurrentUser,
} from "@/lib/hooks/use-current-user";
import { useEducatorStats } from "@/lib/hooks/use-educator-panel";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { getLanguageName } from "@/lib/mock-data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ONBOARDING_KEY = "educator_onboarded";

function StatCard({ icon, label, value }: Readonly<{ icon: string; label: string; value: number }>) {
  const M = useMuseumTheme();
  return (
    <View
      style={{
        minWidth: "46%", flex: 1, borderRadius: 16, padding: 16,
        backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
      }}
    >
      <View
        style={{
          width: 36, height: 36, borderRadius: 10,
          alignItems: "center", justifyContent: "center",
          backgroundColor: `${M.accent}15`,
        }}
      >
        <IconSymbol name={icon as never} size={18} color={M.accent} />
      </View>
      <Text style={{ marginTop: 12, fontSize: 26, fontWeight: "800", color: M.text }}>{value}</Text>
      <Text style={{ marginTop: 3, fontSize: 12, color: M.muted }}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon, label, detail, onPress, accent }: Readonly<{
  icon: string; label: string; detail: string; onPress: () => void; accent?: string;
}>) {
  const M = useMuseumTheme();
  const color = accent ?? M.accent;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center",
        borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
        backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
        borderLeftWidth: 4, borderLeftColor: color,
      }}
      className="active:opacity-70"
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 10,
          alignItems: "center", justifyContent: "center",
          backgroundColor: `${color}15`, marginRight: 12,
        }}
      >
        <IconSymbol name={icon as never} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>{label}</Text>
        <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>{detail}</Text>
      </View>
      <IconSymbol name="chevron.right" size={14} color={M.muted} />
    </Pressable>
  );
}

function SectionLabel({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: M.accent }} />
      <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", color: M.muted }}>
        {label}
      </Text>
    </View>
  );
}

export default function EducatorPanelScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser, isLoading } = useCurrentUser();
  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;
  const { data: educatorStats } = useEducatorStats(canAccess);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    if (!educatorStats) return;
    const isEmpty =
      educatorStats.dictionaryEntries === 0 &&
      educatorStats.pendingLessons === 0 &&
      educatorStats.approvedContributions === 0;
    if (!isEmpty) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val: string | null) => {
      if (!val) setOnboardingStep(1);
    }).catch(() => {});
  }, [educatorStats]);

  const dismissOnboarding = () => {
    setOnboardingStep(null);
    AsyncStorage.setItem(ONBOARDING_KEY, "done").catch(() => {});
  };

  if (!isLoading && !canAccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink, alignItems: "center", justifyContent: "center" }} edges={["top"]}>
        <View
          style={{
            width: 64, height: 64, borderRadius: 32,
            alignItems: "center", justifyContent: "center",
            backgroundColor: `${M.accent}12`,
            borderWidth: 1, borderColor: `${M.accent}25`,
          }}
        >
          <IconSymbol name="shield.fill" size={26} color={M.muted} />
        </View>
        <Text style={{ marginTop: 16, paddingHorizontal: 32, textAlign: "center", fontSize: 14, fontWeight: "600", color: M.sub }}>
          {t("review.adminRequired")}
        </Text>
        <Pressable
          onPress={() => router.replace("/(tabs)/profile")}
          style={{
            marginTop: 20, borderRadius: 999,
            paddingHorizontal: 24, paddingVertical: 10,
            borderWidth: 1, borderColor: M.border, backgroundColor: M.card,
          }}
          className="active:opacity-80"
        >
          <Text style={{ fontWeight: "700", color: M.text }}>{t("common.goBack")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const languageNames = (currentUser?.reviewerLanguages ?? [])
    .map((languageId) => getLanguageName(languageId))
    .join(", ");
  const assignedLanguages = currentUser?.isAdmin
    ? t("educator.overview.scopeAdmin")
    : t("educator.overview.scopeLangs", {
        languages: languageNames || getLanguageName(currentUser?.selectedLanguageId),
      });
  const panelTitle = t("educator.panelTitle");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
          {panelTitle}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 13, color: M.textDim }}>
          {currentUser
            ? t("educator.overview.welcome", { name: currentUser.name || t("profile.learner") })
            : t("common.loading")}
        </Text>
        <Text style={{ marginTop: 2, fontSize: 12, color: M.textDimDark }}>{assignedLanguages}</Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Onboarding */}
        {onboardingStep != null && (
          <View
            style={{
              marginBottom: 16, borderRadius: 16, overflow: "hidden",
              backgroundColor: "rgba(59,130,246,0.07)",
              borderWidth: 1, borderColor: "rgba(59,130,246,0.2)",
              borderLeftWidth: 4, borderLeftColor: "#60a5fa",
            }}
          >
            <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 16 }}>
              {([1, 2, 3] as const).map((s) => (
                <View
                  key={s}
                  style={{
                    height: 3, flex: 1, borderRadius: 2,
                    backgroundColor: s <= onboardingStep ? "#60a5fa" : M.border,
                  }}
                />
              ))}
            </View>
            <Text style={{ paddingHorizontal: 16, paddingTop: 6, fontSize: 9, fontWeight: "800", letterSpacing: 2, color: "#60a5fa" }}>
              {t("educator.onboarding.stepOf", { step: onboardingStep, total: 3 }).toUpperCase()}
            </Text>

            {[1, 2, 3].map((step) => {
              if (onboardingStep !== step) return null;
              const titles = [
                t("educator.onboarding.step1Title"),
                t("educator.onboarding.step2Title"),
                t("educator.onboarding.step3Title"),
              ];
              const descs = [
                t("educator.onboarding.step1Desc"),
                t("educator.onboarding.step2Desc"),
                t("educator.onboarding.step3Desc"),
              ];
              const ctas = [
                t("educator.onboarding.step1Cta"),
                t("educator.onboarding.step2Cta"),
                t("educator.onboarding.step3Cta"),
              ];
              const icons = ["book.fill", "waveform", "person.2.fill"];
              const onCtaPress = () => {
                if (step < 3) {
                  router.push("/educator/courses" as any);
                  setOnboardingStep((step + 1) as 2 | 3);
                } else {
                  router.push("/groups" as any);
                  dismissOnboarding();
                }
              };
              return (
                <View key={step} style={{ padding: 16 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#60a5fa20", marginBottom: 10 }}>
                    <IconSymbol name={icons[step - 1] as never} size={18} color="#60a5fa" />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{titles[step - 1]}</Text>
                  <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>{descs[step - 1]}</Text>
                  <Pressable
                    onPress={onCtaPress}
                    style={{ marginTop: 14, alignItems: "center", borderRadius: 12, paddingVertical: 11, backgroundColor: "#60a5fa" }}
                    className="active:opacity-80"
                  >
                    <Text style={{ fontWeight: "800", color: M.ink, fontSize: 14 }}>{ctas[step - 1]} →</Text>
                  </Pressable>
                </View>
              );
            })}

            <Pressable onPress={dismissOnboarding} style={{ alignItems: "center", paddingBottom: 14 }}>
              <Text style={{ fontSize: 11, color: M.muted }}>{t("educator.onboarding.skip")}</Text>
            </Pressable>
          </View>
        )}

        {/* Educator Guide banner */}
        <Pressable
          onPress={() => router.push("/educator-guide")}
          style={{
            marginBottom: 20,
            borderRadius: 16,
            padding: 16,
            backgroundColor: M.accent,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
          className="active:opacity-80"
        >
          <View
            style={{
              width: 44, height: 44, borderRadius: 12,
              alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <IconSymbol name="book.fill" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>
              {t("educator.guide.title")}
            </Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
              {t("educator.guide.subtitle")}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Stats */}
        <SectionLabel label={t("educator.nav.overview")} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          <StatCard icon="checkmark.circle.fill" label={t("educator.stats.pendingContributions")} value={educatorStats?.pendingContributions ?? 0} />
          <StatCard icon="waveform" label={t("educator.stats.pendingLessons")} value={educatorStats?.pendingLessons ?? 0} />
          <StatCard icon="book.fill" label={t("educator.stats.dictionaryEntries")} value={educatorStats?.dictionaryEntries ?? 0} />
          <StatCard icon="chart.bar.fill" label={t("educator.stats.approvedContributions")} value={educatorStats?.approvedContributions ?? 0} />
        </View>

        {/* Actions */}
        <SectionLabel label={t("admin.overview.quickActions")} />
        <View style={{ gap: 10 }}>
          <ActionRow icon="checkmark.circle.fill" label={t("educator.nav.review")} detail={t("educator.review.subtitle")} onPress={() => router.push("/review")} accent="#4ade80" />
          <ActionRow icon="character.book.closed" label={t("educator.nav.dictionary")} detail={t("profile.dictionary")} onPress={() => router.push("/educator/dictionary")} />
          <ActionRow icon="book.fill" label={t("educator.nav.lessons")} detail={t("learn.webSubtitle")} onPress={() => router.push("/educator/courses")} />
          <ActionRow icon="globe" label={t("educator.nav.culture")} detail={t("welcomeChecklist.exploreCultureMusicDetail")} onPress={() => router.push("/educator/culture" as never)} accent="#a78bfa" />
          <ActionRow icon="book.closed.fill" label={t("educator.story.screenTitle")} detail={t("educator.story.screenSubtitle")} onPress={() => router.push("/educator/stories" as never)} accent="#fb923c" />
          {currentUser && canManageBounties(currentUser) ? (
            <ActionRow icon="star.fill" label={t("profile.bounties")} detail={t("admin.overview.manageCourses")} onPress={() => router.push("/bounties")} accent="#f59e0b" />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
