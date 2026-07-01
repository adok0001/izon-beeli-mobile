import { useCallback } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { usePlusGate } from "@/lib/hooks/use-plus-gate";
import { useDownloadsStore, type DownloadInput } from "@/store/downloads-store";

/**
 * Shared download-toggle behavior for the three entry points (lesson
 * pre-play sheet, lesson player header, course bulk button): Plus-gates the
 * action, tracks downloaded/downloading state for a single lesson, and
 * confirms before removing or reports a failed download. `input` is
 * nullable so callers can invoke this hook unconditionally before their
 * lesson data has loaded.
 */
export function useLessonDownload(input: DownloadInput | null) {
  const { t } = useTranslation();
  const { isPlus, showPaywall } = usePlusGate();
  const lessonId = input?.lessonId ?? "";
  const isDownloaded = useDownloadsStore((s) => (input ? s.isDownloaded(lessonId) : false));
  const isDownloading = useDownloadsStore((s) => (input ? s.isDownloading(lessonId) : false));
  const download = useDownloadsStore((s) => s.download);
  const remove = useDownloadsStore((s) => s.remove);

  const onPress = useCallback(() => {
    if (!input) return;
    if (!isPlus) {
      showPaywall();
      return;
    }
    if (isDownloading) return;
    if (isDownloaded) {
      Alert.alert(
        t("downloads.deleteConfirmTitle"),
        t("downloads.deleteConfirmMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("downloads.deleteButton"), style: "destructive", onPress: () => remove(input.lessonId) },
        ]
      );
      return;
    }
    download(input).catch(() => {
      Alert.alert(t("downloads.downloadFailedTitle"), t("downloads.downloadFailedMessage"));
    });
  }, [input, isPlus, showPaywall, isDownloading, isDownloaded, download, remove, t]);

  return { isDownloaded, isDownloading, onPress };
}
