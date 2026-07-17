import { SectionShell, SubRow, ToolsGrid } from "@/components/studio/panel-nav-sections";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { canManageBounties, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useAdminStats } from "@/lib/hooks/use-educator-panel";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function AdminPanelScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser, isLoading } = useCurrentUser();
  const isAdmin = currentUser?.isAdmin ?? false;
  const { data: adminStats } = useAdminStats(isAdmin);
  const [openSection, setOpenSection] = useState<"people" | "content" | null>("people");

  if (!isLoading && !isAdmin) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
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
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
        {/* Header */}
        <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ fontSize: 32, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
            {t("educator.adminPanel")}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: M.textDim }}>
            {t("admin.internalTools")}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: M.card }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats */}
          <SectionLabel label={t("admin.overview.subtitle")} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            <StatCard icon="person.fill" label={t("admin.stats.totalUsers")} value={adminStats?.users ?? 0} />
            <StatCard icon="book.fill" label={t("admin.stats.courses")} value={adminStats?.courses ?? 0} />
            <StatCard icon="checkmark.circle.fill" label={t("admin.stats.pendingReview")} value={adminStats?.pendingContributions ?? 0} />
            <StatCard icon="character.book.closed" label={t("admin.stats.dictionaryEntries")} value={adminStats?.dictionaryEntries ?? 0} />
          </View>

          {/* Studio cross-link — admins don't see the Educator tab, so this is
              the only way back into the Learn/Explore content nav. */}
          <Pressable
            onPress={() => router.push("/(tabs)/educator")}
            style={{
              marginBottom: 20, borderRadius: 16, padding: 16,
              backgroundColor: M.accent, flexDirection: "row", alignItems: "center", gap: 14,
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
              <IconSymbol name="shield.fill" size={22} color={M.parchment} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.parchment }}>
                {t("educator.panelTitle")}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: `${M.parchment}BF` }}>
                {t("educator.nav.overview")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={`${M.parchment}B3`} />
          </Pressable>

          {/* Navigation — mirrors the Studio home's Learn/Explore/Tools
              grammar instead of a flat, rainbow-coded action list. */}
          <SectionLabel label={t("admin.overview.quickActions")} />
          <View style={{ gap: 10, marginBottom: 24 }}>
            <SectionShell
              icon="person.2.fill"
              label="People & Access"
              meta="2 tools"
              open={openSection === "people"}
              onToggle={() => setOpenSection((s) => (s === "people" ? null : "people"))}
              accent={getAccent("green").solid}
            >
              <SubRow
                label={t("admin.overview.manageUsers")}
                meta={t("admin.overview.manageUsersDesc")}
                onPress={() => router.push("/admin/users")}
              />
              <SubRow
                label={t("admin.streakTools.title")}
                meta={t("admin.streakTools.subtitle")}
                onPress={() => router.push("/admin/streak-tools")}
              />
            </SectionShell>

            <SectionShell
              icon="film.fill"
              label="Content Ops"
              meta="3 tools"
              open={openSection === "content"}
              onToggle={() => setOpenSection((s) => (s === "content" ? null : "content"))}
              accent={getAccent("teal").solid}
            >
              <SubRow
                label={t("admin.dailyContent.title")}
                meta={t("admin.dailyContent.actionRowDetail")}
                onPress={() => router.push("/admin/daily-content")}
              />
              <SubRow
                label={t("admin.nav.dailyChallenges")}
                meta="Edit the daily challenge template pool"
                onPress={() => router.push("/admin/daily-challenges")}
              />
              <SubRow
                label={t("admin.cultureContent.title")}
                meta={t("admin.cultureContent.subtitle")}
                onPress={() => router.push("/admin/culture-content")}
              />
              <SubRow
                label={t("admin.nav.media")}
                meta="Photos, audio, video assets"
                onPress={() => router.push("/admin/media" as never)}
              />
            </SectionShell>
          </View>

          <ToolsGrid
            title="Platform"
            tools={[
              { label: t("admin.notifications.title", "Push Notifications"), href: "/admin/broadcast" },
              { label: t("admin.nav.billing"), href: "/admin/plus-gate" },
              { label: t("admin.nav.languages"), href: "/admin/languages" },
              { label: t("admin.nav.contentPartners"), href: "/admin/content-partners" },
              { label: t("admin.nav.englishWordbank"), href: "/admin/english-wordbank" },
              { label: t("admin.nav.appConfig"), href: "/admin/app-config" },
              ...(currentUser && canManageBounties(currentUser) ? [{ label: t("profile.bounties"), href: "/bounties" }] : []),
            ]}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
