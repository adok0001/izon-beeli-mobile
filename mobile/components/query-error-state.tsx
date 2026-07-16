import { Button } from "@/components/ui/button";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export interface QueryErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Museum-styled error card for failed React Query fetches. Shows a friendly
 * message and an optional Retry button. Use in place of a false "empty" state
 * when a query's `isError` is true.
 */
export function QueryErrorState({ message, onRetry }: QueryErrorStateProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <View style={{ width: "100%", maxWidth: 340, alignItems: "center", gap: 16, padding: 20, borderRadius: 16, borderWidth: 1, backgroundColor: M.card, borderColor: M.border }}>
        <Text style={{ fontSize: 15, textAlign: "center", color: M.sub }}>{message ?? t("common.couldntLoad")}</Text>
        {onRetry ? <Button label={t("common.tryAgain")} onPress={onRetry} variant="secondary" fullWidth={false} size="sm" /> : null}
      </View>
    </View>
  );
}
