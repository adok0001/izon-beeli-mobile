import { SymbolOfTheDay } from "@/components/adinkra/symbol-of-the-day";
import { CulturalSection } from "@/components/cultural/cultural-section";
import { FeaturedGameCard } from "@/components/playground/featured-game-card";
import { GameShelf } from "@/components/playground/game-shelf";
import { PlaygroundDoorCard } from "@/components/playground/playground-door-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ExhibitDivider } from "@/components/ui/section-header";
import { WordOfTheDay } from "@/components/word-of-the-day";
import { getAccent, type AccentColor, type AccentHue } from "@/constants/accent-colors";
import { useProverbOfTheMonth } from "@/lib/hooks/use-proverb-of-the-month";
import { useSongOfTheWeek } from "@/lib/hooks/use-song-of-the-week";
import { useCourses } from "@/lib/hooks/use-courses";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { localizeField } from "@/lib/localize";
import { pickFeaturedGame, rankShelfGames, usePlaygroundStore } from "@/lib/playground";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

function BrowseAllLink({ label, href, color }: { label: string; href: Href; color: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" }}
      className="active:opacity-60"
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color }}>{label}</Text>
      <IconSymbol name="chevron.right" size={11} color={color} />
    </Pressable>
  );
}

function ProverbOfTheMonthCard({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const proverb = useProverbOfTheMonth(languageId);

  if (!proverb) return null;

  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1, borderColor: M.border,
        borderLeftWidth: 4, borderLeftColor: M.accent,
        overflow: "hidden",
      }}
    >
      {/* Label strip */}
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: 7,
          backgroundColor: `${M.accent}10`,
          paddingHorizontal: 14, paddingVertical: 8,
          borderBottomWidth: 1, borderBottomColor: `${M.accent}20`,
        }}
      >
        <IconSymbol name="text.quote" size={12} color={M.accent} />
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: M.accent }}>
          {t("practice.proverbOfTheMonth").toUpperCase()}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 }}>
        <Text style={{ fontSize: 42, lineHeight: 36, marginBottom: 6, color: M.accent, fontWeight: "900" }}>{"“"}</Text>
        <Text style={{ fontSize: 16, fontWeight: "600", fontStyle: "italic", lineHeight: 24, color: M.text }}>
          {proverb.text}
        </Text>
        <View style={{ height: 1, backgroundColor: M.border, marginVertical: 12 }} />
        <Text style={{ fontSize: 13, lineHeight: 18, color: M.sub }}>
          {localizeField(proverb.translation, proverb.translationFr, uiLanguage)}
        </Text>
        {proverb.meaning ? (
          <View style={{ marginTop: 10, borderRadius: 10, padding: 12, backgroundColor: `${M.accent}08` }}>
            <Text style={{ fontSize: 12, lineHeight: 17, color: M.sub }}>
              {localizeField(proverb.meaning, proverb.meaningFr, uiLanguage)}
            </Text>
          </View>
        ) : null}
      </View>
      <BrowseAllLink
        label={t("practice.browseAllProverbs")}
        href={`/proverbs/${languageId}` as Href}
        color={M.accent}
      />
    </View>
  );
}

function SongOfTheWeekCard({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const song = useSongOfTheWeek(languageId);
  const { uiLanguage } = useUiLanguageStore();
  const { data: courses = [] } = useCourses(languageId);
  const hasSongs = useMemo(() => courses.some((c) => c.courseType === "songs"), [courses]);
  const rose = getAccent("rose");

  if (!song && !hasSongs) return null;

  return (
    <View
      style={{
        borderRadius: 16, backgroundColor: M.card,
        borderWidth: 1, borderColor: M.border,
        borderLeftWidth: 4, borderLeftColor: rose.solid,
        overflow: "hidden",
      }}
    >
      {song ? (
        <Pressable
          onPress={() => router.push(`/lesson/${song.id}` as Href)}
          className="active:opacity-70"
        >
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 7,
              backgroundColor: rose.bg,
              paddingHorizontal: 14, paddingVertical: 8,
              borderBottomWidth: 1, borderBottomColor: rose.border,
            }}
          >
            <IconSymbol name="music.note" size={12} color={rose.solid} />
            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: rose.solid }}>
              {t("practice.songOfTheWeek").toUpperCase()}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: rose.bg }}>
              <IconSymbol name="music.note.list" size={22} color={rose.solid} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>
                {localizeField(song.title, song.titleFr, uiLanguage)}
              </Text>
              {song.description ? (
                <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }} numberOfLines={1}>
                  {localizeField(song.description, song.descriptionFr, uiLanguage)}
                </Text>
              ) : null}
            </View>
            <IconSymbol name="play.circle.fill" size={32} color={rose.solid} />
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push(`/songs/${languageId}` as Href)}
          className="active:opacity-70"
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text style={{ fontSize: 13, color: M.sub }}>{t("practice.noSongThisWeek")}</Text>
            <IconSymbol name="chevron.right" size={14} color={rose.solid} />
          </View>
        </Pressable>
      )}
      <View style={{ height: 1, backgroundColor: M.border }} />
      <BrowseAllLink
        label={t("practice.browseAllSongs")}
        href={`/songs/${languageId}` as Href}
        color={rose.solid}
      />
    </View>
  );
}

interface ScriptCardConfig {
  href: Href;
  hue: AccentHue;
  glyph?: string;
  icon?: ComponentProps<typeof IconSymbol>["name"];
  kickerKey: string;
  titleKey: string;
  subtitleKey: string;
}

const SCRIPT_CARDS: Record<"geez" | "adinkra" | "nsibidi", ScriptCardConfig> = {
  geez: {
    href: "/geez-lesson",
    hue: "green",
    glyph: "ሀ",
    kickerKey: "practice.scriptPractice",
    titleKey: "practice.geezTitle",
    subtitleKey: "practice.geezSubtitle",
  },
  adinkra: {
    href: "/adinkra",
    hue: "purple",
    icon: "sparkles",
    kickerKey: "practice.culturalSymbols",
    titleKey: "practice.adinkraTitle",
    subtitleKey: "practice.adinkraSubtitle",
  },
  nsibidi: {
    href: "/nsibidi-lesson",
    hue: "amber",
    glyph: "𐘕",
    kickerKey: "practice.scriptPractice",
    titleKey: "practice.nsibidiTitle",
    subtitleKey: "practice.nsibidiSubtitle",
  },
};

function ScriptPracticeCard({ config }: { config: ScriptCardConfig }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never) as string;
  const accent: AccentColor = getAccent(config.hue);

  return (
    <Pressable
      onPress={() => router.push(config.href)}
      style={{
        flexDirection: "row", alignItems: "center",
        borderRadius: 14, padding: 14,
        backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
      }}
      className="active:opacity-70"
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: accent.bg, marginRight: 12 }}>
        {config.icon ? (
          <IconSymbol name={config.icon} size={20} color={accent.solid} />
        ) : (
          <Text style={{ fontSize: 22, fontWeight: "800", color: accent.solid }}>{config.glyph}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: accent.solid }}>
          {tr(config.kickerKey).toUpperCase()}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginTop: 2 }}>
          {tr(config.titleKey)}
        </Text>
        <Text style={{ fontSize: 11, color: M.sub, marginTop: 1 }}>{tr(config.subtitleKey)}</Text>
      </View>
      <IconSymbol name="chevron.right" size={14} color={accent.solid} />
    </Pressable>
  );
}

export function DailyExhibits() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();
  const { data: dueWords = [] } = useWordsDueForReview(selectedLanguageId);
  const playedToday = usePlaygroundStore((s) => s.playedToday);
  const hydratePlayground = usePlaygroundStore((s) => s.hydrate);

  useEffect(() => {
    hydratePlayground();
  }, [hydratePlayground]);

  const hasScriptPractice = ["amharic", "tigrinya", "oromo"].includes(selectedLanguageId);
  const hasAdinkra = ["ga", "ewe", "dagbani"].includes(selectedLanguageId);
  const hasAkan = selectedLanguageId === "akan";
  const hasNsibidi = selectedLanguageId === "igbo";

  const featuredCtx = useMemo(
    () => ({
      languageId: selectedLanguageId,
      dueCount: dueWords.length,
      wordChallengeDone: playedToday.includes("word-challenge"),
    }),
    [selectedLanguageId, dueWords.length, playedToday]
  );
  const featuredGame = useMemo(() => pickFeaturedGame(featuredCtx), [featuredCtx]);
  const shelfGames = useMemo(
    () => rankShelfGames(featuredCtx, featuredGame.id, playedToday),
    [featuredCtx, featuredGame.id, playedToday]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: M.card }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Today's Gallery ── */}
      <ExhibitDivider label={t("practice.sectionToday")} />
      <View style={{ gap: 10 }}>
        <WordOfTheDay languageId={selectedLanguageId} />
        <ProverbOfTheMonthCard languageId={selectedLanguageId} />
        <SongOfTheWeekCard languageId={selectedLanguageId} />
      </View>

      {/* ── The Playground: one featured game, a shelf, and the door to the rest ── */}
      <ExhibitDivider label={t("playground.title")} />
      <View style={{ gap: 10 }}>
        <FeaturedGameCard game={featuredGame} dueCount={dueWords.length} />
        <GameShelf games={shelfGames} dueCount={dueWords.length} />
        <PlaygroundDoorCard languageId={selectedLanguageId} />
      </View>

      {/* ── Cultural Hall ── */}
      <ExhibitDivider label={t("practice.sectionCulture")} />
      <View style={{ gap: 10 }}>
        <CulturalSection
          languageId={selectedLanguageId}
          onViewAll={() => router.push(`/cultural/${selectedLanguageId}` as Href)}
        />

        {hasAkan && <SymbolOfTheDay />}
        {hasScriptPractice && <ScriptPracticeCard config={SCRIPT_CARDS.geez} />}
        {hasAdinkra && <ScriptPracticeCard config={SCRIPT_CARDS.adinkra} />}
        {hasNsibidi && <ScriptPracticeCard config={SCRIPT_CARDS.nsibidi} />}
      </View>
    </ScrollView>
  );
}
