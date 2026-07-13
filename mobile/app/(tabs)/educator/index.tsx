import { LanguagePickerModal } from "@/components/language-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { CourseEditModal } from "@/components/studio/course-editor";
import { ExploreSection, LearnSection, StoriesSection, ToolsStrip } from "@/components/studio/panel-nav-sections";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { friendlyError } from "@/lib/api";
import { useContentHealth } from "@/lib/hooks/educator/use-content-health";
import { EducatorCourse, useEducatorStats, useUpdateEducatorCourse } from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
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

function HealthBar({ label, pct }: Readonly<{ label: string; pct: number }>) {
  const M = useMuseumTheme();
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: M.sub }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: "800", color: M.text }}>{pct}%</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: M.card, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${pct}%`, borderRadius: 3, backgroundColor: M.accent }} />
      </View>
    </View>
  );
}

export default function EducatorPanelScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user: currentUser, canAccess } = useStudioAccess();
  const { data: educatorStats, refetch: refetchStats } = useEducatorStats(canAccess);
  const { data: contentHealth, refetch: refetchHealth } = useContentHealth(currentUser?.reviewerLanguages?.[0]);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | null>(null);
  const [openSection, setOpenSection] = useState<"learn" | "stories" | "explore" | null>("learn");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<EducatorCourse | null>(null);
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const updateCourse = useUpdateEducatorCourse();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchHealth()]);
    setRefreshing(false);
  }, [refetchStats, refetchHealth]);

  const allowedLanguages = useMemo(() => {
    if (!currentUser) return [] as string[];
    return currentUser.isAdmin ? LANGUAGES.map((l) => l.id) : currentUser.reviewerLanguages;
  }, [currentUser]);
  const activeLanguageId =
    selectedLanguageId ?? allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

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
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
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

      <NestableScrollContainer
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
      >
        {/* Onboarding */}
        {onboardingStep != null && (
          <View
            style={{
              marginBottom: 16, borderRadius: 16, overflow: "hidden",
              backgroundColor: getAccent("blue").bg,
              borderWidth: 1, borderColor: getAccent("blue").border,
              borderLeftWidth: 4, borderLeftColor: getAccent("sky").solid,
            }}
          >
            <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 16 }}>
              {([1, 2, 3] as const).map((s) => (
                <View
                  key={s}
                  style={{
                    height: 3, flex: 1, borderRadius: 2,
                    backgroundColor: s <= onboardingStep ? getAccent("sky").solid : M.border,
                  }}
                />
              ))}
            </View>
            <Text style={{ paddingHorizontal: 16, paddingTop: 6, fontSize: 9, fontWeight: "800", letterSpacing: 2, color: getAccent("sky").solid }}>
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
                  <View style={{ width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: getAccent("sky").bg, marginBottom: 10 }}>
                    <IconSymbol name={icons[step - 1] as never} size={18} color={getAccent("sky").solid} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{titles[step - 1]}</Text>
                  <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>{descs[step - 1]}</Text>
                  <Pressable
                    onPress={onCtaPress}
                    style={{ marginTop: 14, alignItems: "center", borderRadius: 12, paddingVertical: 11, backgroundColor: getAccent("sky").solid }}
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
            <IconSymbol name="book.fill" size={22} color={M.parchment} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: M.parchment }}>
              {t("educator.guide.title")}
            </Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: `${M.parchment}BF` }}>
              {t("educator.guide.subtitle")}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={`${M.parchment}B3`} />
        </Pressable>

        {/* Stats */}
        <SectionLabel label={t("educator.nav.overview")} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          <StatCard icon="checkmark.circle.fill" label={t("educator.stats.pendingContributions")} value={educatorStats?.pendingContributions ?? 0} />
          <StatCard icon="waveform" label={t("educator.stats.pendingLessons")} value={educatorStats?.pendingLessons ?? 0} />
          <StatCard icon="book.fill" label={t("educator.stats.dictionaryEntries")} value={educatorStats?.dictionaryEntries ?? 0} />
          <StatCard icon="chart.bar.fill" label={t("educator.stats.approvedContributions")} value={educatorStats?.approvedContributions ?? 0} />
        </View>

        {/* Content health */}
        {contentHealth && (
          <>
            <SectionLabel label="Content Health" />
            <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 24 }}>
              <HealthBar label="Dictionary coverage" pct={contentHealth.dictionaryCoverage.pct} />
              <HealthBar label="Audio coverage" pct={contentHealth.mediaCoverage.audio.pct} />
              <HealthBar label="Image coverage" pct={contentHealth.mediaCoverage.image.pct} />
            </View>
          </>
        )}

        {/* Navigation — mirrors the app's own Learn/Explore structure instead
            of a flat list of content-type editors; everything with no single
            learner screen to map to lives in Tools below. */}
        <SectionLabel label={t("admin.overview.quickActions")} />
        {currentUser && (
          <>
            <Pressable
              onPress={() => setLanguagePickerOpen(true)}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
                backgroundColor: M.bg, borderWidth: 1, borderColor: M.border,
              }}
              className="active:opacity-70"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <IconSymbol name="globe.fill" size={14} color={M.accent} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>
                  {getLanguageName(activeLanguageId)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 11, color: M.muted }}>
                  {allowedLanguages.length} language{allowedLanguages.length === 1 ? "" : "s"} assigned
                </Text>
                <IconSymbol name="chevron.right" size={12} color={M.muted} />
              </View>
            </Pressable>

            <View style={{ gap: 10, marginBottom: 24 }}>
              <LearnSection
                currentUser={currentUser}
                activeLanguageId={activeLanguageId}
                open={openSection === "learn"}
                onToggle={() => setOpenSection((s) => (s === "learn" ? null : "learn"))}
                onSelectCourse={setEditingCourse}
                onToastSuccess={toastSuccess}
                onToastError={toastError}
              />
              <StoriesSection
                currentUser={currentUser}
                activeLanguageId={activeLanguageId}
                open={openSection === "stories"}
                onToggle={() => setOpenSection((s) => (s === "stories" ? null : "stories"))}
              />
              <ExploreSection
                currentUser={currentUser}
                activeLanguageId={activeLanguageId}
                open={openSection === "explore"}
                onToggle={() => setOpenSection((s) => (s === "explore" ? null : "explore"))}
              />
            </View>
          </>
        )}

        {currentUser && <ToolsStrip currentUser={currentUser} />}
      </NestableScrollContainer>

      <LanguagePickerModal
        visible={languagePickerOpen}
        selectedId={activeLanguageId}
        allowedIds={allowedLanguages.length > 0 ? allowedLanguages : undefined}
        onSelect={(languageId) => {
          setSelectedLanguageId(languageId);
          setLanguagePickerOpen(false);
        }}
        onClose={() => setLanguagePickerOpen(false)}
      />

      {editingCourse && (
        <CourseEditModal
          course={editingCourse}
          visible
          saving={updateCourse.isPending}
          onClose={() => setEditingCourse(null)}
          onManageLessons={() => {
            const courseId = editingCourse.id;
            setEditingCourse(null);
            router.push({ pathname: "/educator/lessons", params: { courseId } });
          }}
          onSave={(fields) =>
            updateCourse.mutate(
              { id: editingCourse.id, ...fields },
              {
                onSuccess: () => {
                  toastSuccess("Course updated", localize(editingCourse.title, "en"));
                  setEditingCourse(null);
                },
                onError: (err: Error) => toastError("Update failed", friendlyError(err)),
              },
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
