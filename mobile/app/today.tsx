import { DailyExhibits } from "@/components/explore/daily-exhibits";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function TodayScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2.5, color: M.accent, marginBottom: 4 }}>
          {tr("learn.todaysGallerySub").toUpperCase()}
        </Text>
        <Text style={{ fontSize: 28, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
          {tr("learn.todaysGallery").toUpperCase()}
        </Text>
        <View style={{ height: 1, backgroundColor: M.accent, opacity: 0.25, marginTop: 12 }} />
      </View>
      <DailyExhibits />
    </SafeAreaView>
  );
}
