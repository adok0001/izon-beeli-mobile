import { IconSymbol } from "@/components/ui/icon-symbol";
import type { SeasonChapter } from "@/lib/hooks/use-story-arc";
import { styleLabel } from "@/lib/series-presentation";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, View } from "react-native";

/**
 * One episode row in a season. Locked (inactive) episodes dim and don't press.
 * Pure props → shared by the live Series screen and the Studio season preview.
 */
export function SeasonEpisodeRow({
  chapter,
  onPress,
}: Readonly<{ chapter: SeasonChapter; onPress: (ch: SeasonChapter) => void }>) {
  const M = useMuseumTheme();
  const active = !!chapter.lessonIsActive;
  const style = styleLabel(chapter.lessonStyle);
  const runtime = chapter.lessonDuration ? `${Math.round(chapter.lessonDuration / 60)} min` : null;
  return (
    <Pressable
      onPress={() => onPress(chapter)}
      disabled={!active}
      className={active ? "active:opacity-80" : ""}
      style={{
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        borderColor: M.border,
        backgroundColor: M.card,
        opacity: active ? 1 : 0.55,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            backgroundColor: active ? M.accentGlow : M.pillBg,
            borderWidth: 1,
            borderColor: active ? M.accentBorder : M.border,
          }}
        >
          {active ? (
            <IconSymbol name="play.fill" size={15} color={M.accent} />
          ) : (
            <IconSymbol name="lock.fill" size={14} color={M.muted} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: active ? M.text : M.sub }} numberOfLines={1}>
            {chapter.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
            {style ? (
              <View style={{ borderRadius: 6, backgroundColor: M.pillBg, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", color: M.sub }}>{style}</Text>
              </View>
            ) : null}
            <Text style={{ fontSize: 12, color: M.muted }}>
              {runtime}
              {runtime && !active ? "  ·  " : ""}
              {!active ? "Coming soon" : ""}
            </Text>
          </View>
        </View>

        {active ? <IconSymbol name="chevron.right" size={16} color={M.muted} /> : null}
      </View>

      {chapter.narrativeIntro ? (
        <Text style={{ marginTop: 10, fontSize: 13, lineHeight: 19, color: M.sub }} numberOfLines={2}>
          {chapter.narrativeIntro}
        </Text>
      ) : null}
    </Pressable>
  );
}
