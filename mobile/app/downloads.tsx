import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatBytes, type DownloadRecord } from "@/lib/downloads";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useDownloadsStore } from "@/store/downloads-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function DownloadRow({ record, onDelete }: { record: DownloadRecord; onDelete: (lessonId: string) => void }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();

  const handleDelete = () => {
    Alert.alert(
      t("downloads.deleteConfirmTitle"),
      t("downloads.deleteConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("downloads.deleteButton"), style: "destructive", onPress: () => onDelete(record.lessonId) },
      ]
    );
  };

  return (
    <Pressable
      onPress={() => router.push(`/lesson/${record.lessonId}`)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: M.border,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: M.accentGlow,
        }}
      >
        <IconSymbol name="checkmark.circle.fill" size={16} color={M.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: M.text }} numberOfLines={1}>
          {localize(record.title, uiLanguage)}
        </Text>
        <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }} numberOfLines={1}>
          {record.courseTitle ? localize(record.courseTitle, uiLanguage) : ""}
          {record.courseTitle ? " · " : ""}
          {formatBytes(record.sizeBytes)}
        </Text>
      </View>
      <Pressable onPress={handleDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("downloads.deleteButton")}>
        <IconSymbol name="trash" size={15} color={M.error} />
      </Pressable>
    </Pressable>
  );
}

export default function DownloadsScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const downloads = useDownloadsStore((s) => s.downloads);
  const total = useDownloadsStore((s) => s.totalSizeBytes());
  const removeDownload = useDownloadsStore((s) => s.remove);
  const clearAll = useDownloadsStore((s) => s.clearAll);

  const records = useMemo(
    () => Object.values(downloads).sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt)),
    [downloads]
  );

  const handleClearAll = () => {
    Alert.alert(
      t("downloads.clearAllTitle"),
      t("downloads.clearAllMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("downloads.clearAllConfirm"), style: "destructive", onPress: () => clearAll() },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: t("downloads.title"), headerBackTitle: "Back" }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        {records.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottomWidth: 1,
              borderBottomColor: M.border,
              paddingHorizontal: 20,
              paddingVertical: 14,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: M.sub }}>
                {t("downloads.totalLabel")} · {records.length}
              </Text>
              <Text style={{ fontSize: 13, color: M.sub, marginTop: 2 }}>
                {t("downloads.storageUsed")}: {formatBytes(total)}
              </Text>
            </View>
            <Pressable onPress={handleClearAll} accessibilityRole="button" accessibilityLabel={t("downloads.clearAllButton")}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: M.error }}>
                {t("downloads.clearAllButton")}
              </Text>
            </Pressable>
          </View>
        )}

        <FlatList
          data={records}
          keyExtractor={(item) => item.lessonId}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <DownloadRow record={item} onDelete={removeDownload} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 80 }}>
              <View
                style={{
                  marginBottom: 16,
                  height: 64,
                  width: 64,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 32,
                  backgroundColor: M.accentGlow,
                  borderWidth: 1,
                  borderColor: M.accentBorder,
                }}
              >
                <IconSymbol name="arrow.down.circle" size={28} color={M.accent} />
              </View>
              <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "600", color: M.sub }}>
                {t("downloads.emptyTitle")}
              </Text>
              <Text style={{ marginTop: 4, textAlign: "center", fontSize: 13, color: M.muted }}>
                {t("downloads.emptyHint")}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
