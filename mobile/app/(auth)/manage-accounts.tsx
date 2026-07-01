import { AccountRow } from "@/components/ui/account-row";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getKnownAccounts,
  mergeAccountRows,
  removeKnownAccount,
  type KnownAccountSnapshot,
  type MergedAccountRow,
} from "@/lib/known-accounts";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSessionList } from "@clerk/clerk-expo";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManageAccountsScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoaded: sessionsLoaded, sessions } = useSessionList();
  const [knownAccounts, setKnownAccounts] = useState<KnownAccountSnapshot[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refreshKnown = () => getKnownAccounts().then(setKnownAccounts);

  useEffect(() => {
    refreshKnown();
  }, []);

  const rows = useMemo(
    () => mergeAccountRows(sessions, knownAccounts),
    [sessions, knownAccounts]
  );

  const onRemove = (row: MergedAccountRow) => {
    Alert.alert(
      t("auth.removeAccountConfirmTitle"),
      t("auth.removeAccountConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("auth.removeAccount"),
          style: "destructive",
          onPress: async () => {
            setRemovingId(row.userId);
            try {
              if (row.kind === "live" && row.sessionId) {
                const session = sessions?.find((s) => s.id === row.sessionId);
                await session?.end();
              }
              await removeKnownAccount(row.userId);
              await refreshKnown();
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (sessionsLoaded && rows.length === 0) {
      router.replace("/(auth)/sign-in");
    }
  }, [sessionsLoaded, rows.length, router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("auth.manageAccountsTitle"),
          headerStyle: { backgroundColor: M.ink },
          headerTintColor: M.parchment,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
        <View
          style={{
            margin: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: M.border,
            backgroundColor: M.card,
            overflow: "hidden",
          }}
        >
          {rows.map((row, index) => (
            <View key={row.userId}>
              {index > 0 ? <View style={{ height: 1, backgroundColor: M.border }} /> : null}
              <AccountRow
                row={row}
                size={44}
                trailing={
                  <Pressable
                    onPress={() => onRemove(row)}
                    disabled={removingId !== null}
                    hitSlop={8}
                    accessibilityLabel={t("auth.removeAccount")}
                    accessibilityRole="button"
                  >
                    <IconSymbol name="xmark" size={18} color={M.error} />
                  </Pressable>
                }
              />
            </View>
          ))}
        </View>
      </SafeAreaView>
    </>
  );
}
