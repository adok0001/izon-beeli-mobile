import { AuthHeader } from "@/components/auth/auth-header";
import { AccountRow } from "@/components/ui/account-row";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getKnownAccounts,
  mergeAccountRows,
  type KnownAccountSnapshot,
  type MergedAccountRow,
} from "@/lib/known-accounts";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSessionList } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignBackInScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoaded: sessionsLoaded, sessions, setActive } = useSessionList();
  const [knownAccounts, setKnownAccounts] = useState<KnownAccountSnapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    getKnownAccounts().then((accounts) => {
      setKnownAccounts(accounts);
      setHydrated(true);
    });
  }, []);

  const rows = useMemo(
    () => mergeAccountRows(sessions, knownAccounts),
    [sessions, knownAccounts]
  );

  useEffect(() => {
    if (sessionsLoaded && hydrated && rows.length === 0) {
      router.replace("/(auth)/sign-in");
    }
  }, [sessionsLoaded, hydrated, rows.length, router]);

  const onTapRow = async (row: MergedAccountRow) => {
    if (row.kind === "live" && row.sessionId) {
      setSwitchingId(row.sessionId);
      try {
        await setActive?.({ session: row.sessionId });
        router.replace("/(tabs)/learn");
      } catch {
        router.push({
          pathname: "/(auth)/sign-in",
          params: { identifier: row.email ?? "" },
        });
      } finally {
        setSwitchingId(null);
      }
    } else {
      router.push({
        pathname: "/(auth)/sign-in",
        params: { identifier: row.email ?? "" },
      });
    }
  };

  if (!sessionsLoaded || !hydrated || rows.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: M.authBg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color={M.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.authBg }}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 28 }}>
        <AuthHeader title={t("auth.signBackInTitle")} size="compact" />

        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: M.border,
            backgroundColor: M.card,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          {rows.map((row, index) => (
            <View key={row.userId}>
              {index > 0 ? <View style={{ height: 1, backgroundColor: M.border }} /> : null}
              <Pressable onPress={() => onTapRow(row)} disabled={switchingId !== null}>
                <AccountRow
                  row={row}
                  trailing={
                    switchingId === row.sessionId ? (
                      <ActivityIndicator size="small" color={M.accent} />
                    ) : (
                      <IconSymbol name="chevron.right" size={16} color={M.muted} />
                    )
                  }
                />
              </Pressable>
            </View>
          ))}

          <View style={{ height: 1, backgroundColor: M.border }} />

          <Pressable
            onPress={() => router.push("/(auth)/sign-in")}
            disabled={switchingId !== null}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: M.border,
              }}
            >
              <IconSymbol name="plus" size={18} color={M.sub} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>
              {t("auth.addAnotherAccount")}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/(auth)/manage-accounts")} style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 1, color: M.muted }}>
            {t("auth.manageAccounts").toUpperCase()}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
