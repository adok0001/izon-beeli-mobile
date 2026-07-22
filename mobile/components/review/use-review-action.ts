import { friendlyError } from "@/lib/api";
import { useReviewContribution } from "@/lib/hooks/use-contributions";
import { type TranslationKey } from "@/lib/locales";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

/**
 * Word and lesson review mutations share the same variables shape, so either
 * one satisfies this type.
 */
type ReviewMutation = ReturnType<typeof useReviewContribution>;

export type ReviewPromptCopy = {
  rejectTitle: TranslationKey;
  rejectMessage: TranslationKey;
  approveTitle: TranslationKey;
  approveMessage: TranslationKey;
};

/**
 * Builds the approve/reject confirmation flow for a pending contribution.
 * Rejection uses `Alert.prompt` (iOS-only) to collect an optional note.
 */
export function useReviewAction(mutation: ReviewMutation, copy: ReviewPromptCopy) {
  const { t } = useTranslation();

  return (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? t("common.approve") : t("common.reject");
    if (action === "reject") {
      Alert.prompt(
        t(copy.rejectTitle),
        t(copy.rejectMessage),
        (note) =>
          mutation.mutate(
            { id, action, note: note?.trim() || undefined },
            { onError: (e) => Alert.alert(t("common.error"), friendlyError(e)) }
          ),
        "plain-text",
        "",
        "default"
      );
    } else {
      Alert.alert(
        t(copy.approveTitle),
        t(copy.approveMessage),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: label,
            onPress: () =>
              mutation.mutate(
                { id, action },
                { onError: (e) => Alert.alert(t("common.error"), friendlyError(e)) }
              ),
          },
        ]
      );
    }
  };
}
