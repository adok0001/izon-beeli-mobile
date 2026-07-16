import { SeasonCastStrip } from "@/components/series/season-cast-strip";
import { SeasonEpisodeRow } from "@/components/series/season-episode-row";
import { SeasonHero } from "@/components/series/season-hero";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { SeasonChapter } from "@/lib/hooks/use-story-arc";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { SeasonCastMember } from "@/types";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type PreviewChapter = Readonly<{
  key: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
}>;

/** Neutral placeholder cover — a real season's cover comes from its linked
 *  discover item, which the arc editor doesn't own, so the preview stands one in. */
const PLACEHOLDER_GRADIENT_TOP = "#3B1F6E";

/**
 * Season "bible" preview — renders the live draft through the very same
 * `components/series/*` the learner sees on the Series screen, so an author sees
 * their unsaved title / logline / cast / episode intros exactly as they'll ship.
 * Author-owned fields only: runtime, level grouping and the real cover come from
 * the linked lessons/discover item and are intentionally absent here.
 */
export function SeasonPreviewModal({
  visible,
  title,
  nativeTitle,
  logline,
  cast,
  chapters,
  onClose,
}: Readonly<{
  visible: boolean;
  title: string;
  nativeTitle?: string;
  logline?: string;
  cast: readonly SeasonCastMember[];
  chapters: readonly PreviewChapter[];
  onClose: () => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  const previewChapters: SeasonChapter[] = chapters.map((ch, i) => ({
    id: ch.key,
    lessonId: ch.lessonId,
    title: ch.title.trim() || t("educator.story.previewUntitledEpisode", { number: i + 1, defaultValue: `Episode ${i + 1}` }),
    narrativeIntro: ch.narrativeIntro,
    narrativeOutro: ch.narrativeOutro,
    order: i + 1,
    // Draft rows have no linked-lesson enrichment; render them as live so the
    // author sees the active layout rather than a wall of "coming soon".
    lessonIsActive: true,
  }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: M.text }}>
            {t("educator.story.previewTitle", { defaultValue: "Preview" })}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <IconSymbol name="xmark" size={20} color={M.sub} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <SeasonHero
            title={title.trim() || t("educator.story.previewUntitledSeason", { defaultValue: "Untitled season" })}
            nativeTitle={nativeTitle?.trim() || null}
            logline={logline?.trim() || null}
            icon="headphones"
            gradientTop={PLACEHOLDER_GRADIENT_TOP}
            episodeCount={chapters.length}
            totalMinutes={0}
            levelCount={0}
            castCount={cast.length}
            allComingSoon={false}
          />

          {/* Placeholder-cover disclosure — so the neutral gradient doesn't read
              as the final art. */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingTop: 10 }}>
            <IconSymbol name="info.circle" size={12} color={M.muted} />
            <Text style={{ flex: 1, fontSize: 11.5, color: M.muted }}>
              {t("educator.story.previewCoverNote", { defaultValue: "Placeholder cover — the real cover comes from the linked discover item." })}
            </Text>
          </View>

          <SeasonCastStrip cast={cast} />

          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            {previewChapters.length === 0 ? (
              <Text style={{ fontSize: 13, color: M.muted }}>
                {t("educator.story.previewNoEpisodes", { defaultValue: "No episodes yet." })}
              </Text>
            ) : (
              previewChapters.map((ch) => <SeasonEpisodeRow key={ch.id} chapter={ch} onPress={() => {}} />)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
