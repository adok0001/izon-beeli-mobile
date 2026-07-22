import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export function SwipeApprove() {
  const { t } = useTranslation();
  return (
    <View className="mb-3 mx-5 flex-1 items-start justify-center rounded-2xl bg-green-500 pl-6">
      <IconSymbol name="checkmark.circle.fill" size={28} color="#fff" />
      <Text className="mt-1 text-xs font-bold text-white">{t("common.approve")}</Text>
    </View>
  );
}

export function SwipeReject() {
  const { t } = useTranslation();
  return (
    <View className="mb-3 mx-5 flex-1 items-end justify-center rounded-2xl bg-red-500 pr-6">
      <IconSymbol name="xmark.circle.fill" size={28} color="#fff" />
      <Text className="mt-1 text-xs font-bold text-white">{t("common.reject")}</Text>
    </View>
  );
}
