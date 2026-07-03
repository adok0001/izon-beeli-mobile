/**
 * Admin — Series & Stories overview (read-only).
 *
 * Surfaces the Discover "story" layer that otherwise lives across bundled code
 * and the DB, in one place:
 *   • Interactive stories (bundled in lib/data/interactive-stories) — the
 *     branching film experiences (Griot's Path, the Bou Mie films, Writing
 *     Systems of Africa, …).
 *   • Story arcs (podcast season + course arcs, from /story-arcs).
 *   • Link health — films whose `storyId` resolves to neither, so a
 *     broken/plain link is easy to spot.
 *
 * Culture items themselves are edited on /admin/culture-content (including the
 * Story link field). Interactive-story *content* is bundled code, so it is
 * read-only here; a future DB migration would make it fully editable.
 */
import { IconSymbol } from "@/components/ui/icon-symbol";
import { INTERACTIVE_STORIES } from "@/lib/data/interactive-stories";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useStoryArcs } from "@/lib/hooks/use-story-arc";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DiscoverStoriesAdminScreen() {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const router = useRouter();
  const { all } = useDiscover("all");
  const { data: arcs = [] } = useStoryArcs();

  const stories = Object.values(INTERACTIVE_STORIES);
  const storyIds = new Set(stories.map((s) => s.id));
  const arcIds = new Set(arcs.map((a) => a.id));
  const linkedTo = (id: string) => all.filter((i) => i.storyId === id);
  const brokenLinks = all.filter(
    (i) => i.type === "film" && i.storyId && !storyIds.has(i.storyId) && !arcIds.has(i.storyId),
  );

  const Section = ({ title, count, children }: { title: string; count: number; children: React.ReactNode }) => (
    <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 13, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase", color: M.muted, marginBottom: 10 }}>
        {title}
        <Text style={{ color: M.sub }}>{`  ${count}`}</Text>
      </Text>
      {children}
    </View>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 14, marginBottom: 10 }}>
      {children}
    </View>
  );

  const Chip = ({ label, tone }: { label: string; tone?: "warn" }) => (
    <View style={{ borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginRight: 6, marginTop: 6, backgroundColor: tone === "warn" ? M.errorBg : M.pillBg, borderWidth: 1, borderColor: tone === "warn" ? M.errorBorder : M.border }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color: tone === "warn" ? M.error : M.sub }}>{label}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: t("admin.discoverStories.title") }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Text style={{ fontSize: 13, lineHeight: 19, color: M.sub }}>
              {t("admin.discoverStories.intro")}
            </Text>
            <Pressable onPress={() => router.push("/admin/culture-content")} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: M.accent }}>
                {t("admin.discoverStories.editLink")} →
              </Text>
            </Pressable>
          </View>

          {/* Interactive stories */}
          <Section title={t("admin.discoverStories.interactiveStories")} count={stories.length}>
            {stories.map((s) => {
              const links = linkedTo(s.id);
              return (
                <Card key={s.id}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>{s.coverEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{s.title}</Text>
                      <Text style={{ fontSize: 11, color: M.muted, marginTop: 1 }}>
                        {s.id} · {t("admin.discoverStories.scenesCount", { count: Object.keys(s.scenes).length })} · {s.author}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {links.length > 0 ? (
                      links.map((l) => <Chip key={l.id} label={`▶ ${l.title}`} />)
                    ) : (
                      <Chip label={t("admin.discoverStories.notLinked")} tone="warn" />
                    )}
                  </View>
                </Card>
              );
            })}
          </Section>

          {/* Story arcs */}
          <Section title={t("admin.discoverStories.storyArcs")} count={arcs.length}>
            {arcs.length === 0 ? (
              <Text style={{ paddingHorizontal: 4, fontSize: 13, color: M.muted }}>
                {t("admin.discoverStories.arcsNone")}
              </Text>
            ) : (
              arcs.map((a) => {
                const links = linkedTo(a.id);
                return (
                  <Card key={a.id}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{a.title}</Text>
                    <Text style={{ fontSize: 11, color: M.muted, marginTop: 1 }}>
                      {a.id} · {t("admin.discoverStories.courseLabel", { courseId: a.courseId })}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {links.map((l) => <Chip key={l.id} label={`▶ ${l.title}`} />)}
                    </View>
                  </Card>
                );
              })
            )}
          </Section>

          {/* Link health */}
          <Section title={t("admin.discoverStories.brokenLinks")} count={brokenLinks.length}>
            {brokenLinks.length === 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4 }}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={M.success} />
                <Text style={{ fontSize: 13, color: M.sub, marginLeft: 8 }}>
                  {t("admin.discoverStories.linksHealthy")}
                </Text>
              </View>
            ) : (
              brokenLinks.map((i) => (
                <Card key={i.id}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>{i.title}</Text>
                  <Text style={{ fontSize: 11, color: M.error, marginTop: 2 }}>
                    {t("admin.discoverStories.brokenDetail", { storyId: i.storyId ?? "" })}
                  </Text>
                </Card>
              ))
            )}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
