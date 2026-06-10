import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { canManageBounties, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useAdminStats } from "@/lib/hooks/use-educator-panel";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack, useRouter } from "expo-router";
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

export default function AdminPanelScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser, isLoading } = useCurrentUser();
  const isAdmin = currentUser?.isAdmin ?? false;
  const { data: adminStats } = useAdminStats(isAdmin);

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

          {/* Actions */}
          <SectionLabel label={t("admin.overview.quickActions")} />
          <View style={{ gap: 10 }}>
            <ActionRow
              icon="shield.fill"
              label={t("educator.panelTitle")}
              detail={t("educator.nav.overview")}
              onPress={() => router.push("/(tabs)/educator")}
              accent={getAccent("green").solid}
            />
            <ActionRow
              icon="sun.max.fill"
              label={t("admin.dailyContent.title")}
              detail={t("admin.dailyContent.actionRowDetail")}
              onPress={() => router.push("/admin/daily-content")}
              accent={getAccent("orange").solid}
            />
            <ActionRow
              icon="bell.fill"
              label={t("admin.notifications.title", "Push Notifications")}
              detail={t("admin.notifications.subtitle", "Broadcast a message to all users")}
              onPress={() => router.push("/admin/broadcast")}
              accent={getAccent("sky").solid}
            />
            <ActionRow
              icon="film"
              label="Culture Content"
              detail="Manage blogs, podcasts, and films"
              onPress={() => router.push("/admin/culture-content")}
              accent={getAccent("purple").solid}
            />
            {currentUser && canManageBounties(currentUser) ? (
              <ActionRow
                icon="star.fill"
                label={t("profile.bounties")}
                detail={t("admin.overview.manageCourses")}
                onPress={() => router.push("/bounties")}
                accent={getAccent("amber").solid}
              />
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
