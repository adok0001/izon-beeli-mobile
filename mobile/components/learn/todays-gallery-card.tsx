import { ContentTeaserCard } from "@/components/ui/section-header";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export function TodaysGalleryCard() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;
  const router = useRouter();

  return (
    <ContentTeaserCard
      eyebrow={tr("learn.todaysGallery")}
      icon="sparkles"
      iconColor={M.accent}
      iconBackground={M.accentGlow}
      iconBorderColor={M.accentBorder}
      accentColor={M.accent}
      title={tr("learn.todaysGallerySub")}
      onPress={() => router.push("/today" as never)}
      accessibilityLabel={tr("learn.todaysGallery")}
    />
  );
}
