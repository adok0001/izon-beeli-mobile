import { ActivityGrid } from "@/components/activity-grid";
import { SymbolOfTheDay } from "@/components/adinkra/symbol-of-the-day";
import { CulturalSection } from "@/components/cultural/cultural-section";
import { DailyChallengeCards } from "@/components/daily-challenge-card";
import { LanguagePickerButton } from "@/components/language-picker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordOfTheDay } from "@/components/word-of-the-day";
import { getAccent } from "@/constants/accent-colors";
import { ALL_LESSONS } from "@/lib/data/lessons";
import { useCourses } from "@/lib/hooks/use-courses";
import { useProverbOfTheMonth } from "@/lib/hooks/use-proverb-of-the-month";
import { useProverbs } from "@/lib/hooks/use-proverbs";
import { useSongOfTheWeek } from "@/lib/hooks/use-song-of-the-week";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { localizeField } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


function ExhibitHeader({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ marginTop: 28, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: M.accent }} />
        <Text
          style={{
            fontSize: 9, fontWeight: "800", letterSpacing: 2.5,
            textTransform: "uppercase", color: M.muted,
          }}
        >
          {label}
        </Text>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: M.accent }} />
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
    </View>
  );
}

function ProverbOfTheMonthCard({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const router = useRouter();
  const proverb = useProverbOfTheMonth(languageId);
  const { data: proverbs = [] } = useProverbs(languageId);
  const displayed = proverb ?? proverbs[0] ?? null;

  if (!displayed) return null;

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
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          backgroundColor: `${M.accent}10`,
          paddingHorizontal: 14, paddingVertical: 8,
          borderBottomWidth: 1, borderBottomColor: `${M.accent}20`,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <IconSymbol name="text.quote" size={12} color={M.accent} />
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: M.accent }}>
            {t("practice.proverbOfTheMonth").toUpperCase()}
          </Text>
        </View>
        <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: `${M.accent}20` }}>
          <Text style={{ fontSize: 8, fontWeight: "700", letterSpacing: 1, color: M.accent }}>FEATURED</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ fontSize: 42, lineHeight: 36, marginBottom: 6, color: M.accent, fontWeight: "900" }}>"</Text>
        <Text style={{ fontSize: 16, fontWeight: "600", fontStyle: "italic", lineHeight: 24, color: M.text }}>
          {displayed.text}
        </Text>
        <View style={{ height: 1, backgroundColor: M.border, marginVertical: 12 }} />
        <Text style={{ fontSize: 13, lineHeight: 18, color: M.sub }}>
          {localizeField(displayed.translation, displayed.translationFr, uiLanguage)}
        </Text>
        {displayed.meaning ? (
          <View style={{ marginTop: 10, borderRadius: 10, padding: 12, backgroundColor: `${M.accent}08` }}>
            <Text style={{ fontSize: 12, lineHeight: 17, color: M.sub }}>
              {localizeField(displayed.meaning, displayed.meaningFr, uiLanguage)}
            </Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => router.push(`/proverbs/${languageId}` as Href)}
          style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" }}
          className="active:opacity-60"
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: M.accent }}>Browse all proverbs</Text>
          <IconSymbol name="chevron.right" size={11} color={M.accent} />
        </Pressable>
      </View>
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

  if (!song && !hasSongs) return null;

  if (!song) {
    return (
      <View
        style={{
          borderRadius: 16, backgroundColor: M.card,
          borderWidth: 1, borderColor: M.border,
          borderLeftWidth: 4, borderLeftColor: "#f43f5e",
          overflow: "hidden",
        }}
      >
        <Pressable
          onPress={() => router.push(`/songs/${languageId}` as Href)}
          className="active:opacity-70"
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text style={{ fontSize: 13, color: M.sub }}>{t("practice.noSongThisWeek")}</Text>
            <IconSymbol name="chevron.right" size={14} color="#f43f5e" />
          </View>
        </Pressable>
        <View style={{ height: 1, backgroundColor: M.border }} />
        <Pressable
          onPress={() => router.push(`/songs/${languageId}` as Href)}
          style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" }}
          className="active:opacity-60"
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: M.accent }}>Browse all songs</Text>
          <IconSymbol name="chevron.right" size={11} color={M.accent} />
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: 16, backgroundColor: M.card,
        borderWidth: 1, borderColor: M.border,
        borderLeftWidth: 4, borderLeftColor: "#f43f5e",
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => router.push(`/lesson/${song.id}` as Href)}
        className="active:opacity-70"
      >
        <View
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            backgroundColor: "rgba(244, 63, 94, 0.08)",
            paddingHorizontal: 14, paddingVertical: 8,
            borderBottomWidth: 1, borderBottomColor: "rgba(244, 63, 94, 0.15)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <IconSymbol name="music.note" size={12} color="#f43f5e" />
            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: "#f43f5e" }}>
              {t("practice.songOfTheWeek").toUpperCase()}
            </Text>
          </View>
          <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "rgba(244, 63, 94, 0.15)" }}>
            <Text style={{ fontSize: 8, fontWeight: "700", letterSpacing: 1, color: "#f43f5e" }}>
              {t("practice.thisWeeksSelection").toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
          <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(244, 63, 94, 0.12)" }}>
            <IconSymbol name="music.note.list" size={22} color="#f43f5e" />
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
          <IconSymbol name="play.circle.fill" size={32} color="#f43f5e" />
        </View>
      </Pressable>
      <View style={{ height: 1, backgroundColor: M.border }} />
      <Pressable
        onPress={() => router.push(`/songs/${languageId}` as Href)}
        style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" }}
        className="active:opacity-60"
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#f43f5e" }}>Browse all songs</Text>
        <IconSymbol name="chevron.right" size={11} color="#f43f5e" />
      </Pressable>
    </View>
  );
}

function SongsCard({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: courses = [] } = useCourses(languageId);
  const songs = useMemo(() => {
    const songCourseIds = courses.filter((c) => c.courseType === "songs").map((c) => c.id);
    if (songCourseIds.length === 0) return [];
    return ALL_LESSONS.filter((l) => l.type === "song" && songCourseIds.includes(l.courseId));
  }, [courses]);

  if (songs.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push(`/songs/${languageId}` as Href)}
      style={{
        flexDirection: "row", alignItems: "center",
        borderRadius: 14, padding: 14,
        backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
      }}
      className="active:opacity-70"
    >
      <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(244, 63, 94, 0.12)", marginRight: 12 }}>
        <IconSymbol name="music.note" size={18} color="#f43f5e" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>{t("songs.title")}</Text>
        <Text style={{ fontSize: 11, color: M.muted, marginTop: 1 }}>{songs.length} songs available</Text>
      </View>
      <IconSymbol name="chevron.right" size={13} color="#f43f5e" />
    </Pressable>
  );
}

function ProverbsCollectionCard({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: proverbs = [] } = useProverbs(languageId);

  if (proverbs.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push(`/proverbs/${languageId}` as Href)}
      style={{
        flexDirection: "row", alignItems: "center",
        borderRadius: 14, padding: 14,
        backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
      }}
      className="active:opacity-70"
    >
      <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: `${M.accent}12`, marginRight: 12 }}>
        <IconSymbol name="text.quote" size={18} color={M.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>{t("practice.proverbs")}</Text>
        <Text style={{ fontSize: 11, color: M.muted, marginTop: 1 }}>{proverbs.length} proverbs in collection</Text>
      </View>
      <IconSymbol name="chevron.right" size={13} color={M.accent} />
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();
  const { data: dueWords = [] } = useWordsDueForReview(selectedLanguageId);

  const hasScriptPractice = ["amharic", "tigrinya", "oromo"].includes(selectedLanguageId);
  const hasAdinkra = ["ga", "ewe", "dagbani"].includes(selectedLanguageId);
  const hasAkan = selectedLanguageId === "akan";
  const hasNsibidi = selectedLanguageId === "igbo";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
              {t("practice.title")}
            </Text>
            <Text style={{ fontSize: 13, color: M.textDim, marginTop: 4 }}>
              {t("practice.subtitle")}
            </Text>
          </View>
          <View style={{ marginTop: 4 }}>
            <LanguagePickerButton />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Today's Gallery ── */}
        <ExhibitHeader label={t("practice.sectionToday")} />
        <View style={{ gap: 10 }}>
          <WordOfTheDay languageId={selectedLanguageId} />
          <ProverbOfTheMonthCard languageId={selectedLanguageId} />
          <SongOfTheWeekCard languageId={selectedLanguageId} />
          <DailyChallengeCards />
        </View>

        {/* ── The Playground ── */}
        <ExhibitHeader label="THE PLAYGROUND" />
        <ActivityGrid />

        {/* ── The Workshop ── */}
        <ExhibitHeader label={t("practice.sectionActivities")} />
        <View style={{ gap: 10 }}>
          {/* Quick tools */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => router.push("/word-review")}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 16,
                borderRadius: 14, backgroundColor: M.card,
                borderWidth: 1, borderColor: M.border,
              }}
              className="active:opacity-70"
            >
              <View>
                <IconSymbol name="brain.head.profile" size={22} color={M.success} />
                {dueWords.length > 0 && (
                  <View
                    style={{
                      position: "absolute", top: -4, right: -8,
                      minWidth: 16, borderRadius: 999,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: M.error, paddingHorizontal: 4, paddingVertical: 1,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>{dueWords.length}</Text>
                  </View>
                )}
              </View>
              <Text style={{ marginTop: 6, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, color: M.success }}>
                {t("practice.wordReview")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/quiz")}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 16,
                borderRadius: 14, backgroundColor: M.card,
                borderWidth: 1, borderColor: M.border,
              }}
              className="active:opacity-70"
            >
              <IconSymbol name="trophy.fill" size={22} color={M.accent} />
              <Text style={{ marginTop: 6, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, color: M.accent }}>
                {t("practice.quiz")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/matching-game")}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 16,
                borderRadius: 14, backgroundColor: M.card,
                borderWidth: 1, borderColor: M.border,
              }}
              className="active:opacity-70"
            >
              <IconSymbol name="rectangle.grid.2x2" size={22} color="#a78bfa" />
              <Text style={{ marginTop: 6, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, color: "#a78bfa" }}>
                {t("practice.match")}
              </Text>
            </Pressable>
          </View>

          {/* Multiplayer */}
          <Pressable
            onPress={() => router.push("/multiplayer")}
            style={{
              borderRadius: 16, overflow: "hidden",
              backgroundColor: "#0F1B4A",
              borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.3)",
              borderLeftWidth: 4, borderLeftColor: "#3b82f6",
            }}
            className="active:opacity-70"
          >
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(59, 130, 246, 0.2)" }}>
                <IconSymbol name="trophy.fill" size={20} color="#60a5fa" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: "#60a5fa" }}>
                  {t("practice.multiplayer").toUpperCase()}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 15, fontWeight: "800", color: M.text }}>
                  {t("practice.multiplayerTitle")}
                </Text>
                <Text style={{ fontSize: 11, color: "#60a5fa", marginTop: 1 }}>
                  {t("practice.multiplayerSubtitle")}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color="#60a5fa" />
            </View>
          </Pressable>
        </View>

        {/* ── Cultural Hall ── */}
        <ExhibitHeader label={t("practice.sectionCulture")} />
        <View style={{ gap: 10 }}>
          {/* <SongsCard languageId={selectedLanguageId} /> */}
          {/* <ProverbsCollectionCard languageId={selectedLanguageId} /> */}
          <CulturalSection
            languageId={selectedLanguageId}
            onViewAll={() => router.push(`/cultural/${selectedLanguageId}` as Href)}
          />

          {hasAkan && <SymbolOfTheDay />}

          {hasScriptPractice && (
            <Pressable
              onPress={() => router.push("/geez-lesson")}
              style={{
                flexDirection: "row", alignItems: "center",
                borderRadius: 14, padding: 14,
                backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
                borderLeftWidth: 4, borderLeftColor: M.success,
              }}
              className="active:opacity-70"
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(74, 222, 128, 0.1)", marginRight: 12 }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: M.success }}>ሀ</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: M.success }}>
                  {t("practice.scriptPractice").toUpperCase()}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginTop: 2 }}>
                  {t("practice.geezTitle")}
                </Text>
                <Text style={{ fontSize: 11, color: M.sub, marginTop: 1 }}>{t("practice.geezSubtitle")}</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={M.success} />
            </Pressable>
          )}

          {hasAdinkra && (
            <Pressable
              onPress={() => router.push("/adinkra")}
              style={{
                flexDirection: "row", alignItems: "center",
                borderRadius: 14, padding: 14,
                backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
                borderLeftWidth: 4, borderLeftColor: "#a78bfa",
              }}
              className="active:opacity-70"
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(167, 139, 250, 0.1)", marginRight: 12 }}>
                <IconSymbol name="sparkles" size={20} color="#a78bfa" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: "#a78bfa" }}>
                  {t("practice.culturalSymbols").toUpperCase()}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginTop: 2 }}>
                  {t("practice.adinkraTitle")}
                </Text>
                <Text style={{ fontSize: 11, color: M.sub, marginTop: 1 }}>{t("practice.adinkraSubtitle")}</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color="#a78bfa" />
            </Pressable>
          )}

          {hasNsibidi && (
            <Pressable
              onPress={() => router.push("/nsibidi-lesson")}
              style={{
                flexDirection: "row", alignItems: "center",
                borderRadius: 14, padding: 14,
                backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
                borderLeftWidth: 4, borderLeftColor: getAccent("amber").solid,
              }}
              className="active:opacity-70"
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(245, 158, 11, 0.1)", marginRight: 12 }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: getAccent("amber").solid }}>𐘕</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: getAccent("amber").solid }}>
                  {t("practice.scriptPractice").toUpperCase()}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginTop: 2 }}>
                  {t("practice.nsibidiTitle")}
                </Text>
                <Text style={{ fontSize: 11, color: M.sub, marginTop: 1 }}>{t("practice.nsibidiSubtitle")}</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={getAccent("amber").solid} />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
