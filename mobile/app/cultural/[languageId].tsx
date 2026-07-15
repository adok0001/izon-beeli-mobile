import { IconSymbol } from "@/components/ui/icon-symbol";
import { LoadingScreen } from "@/components/loading-screen";
import { ShareModal } from "@/components/share/share-modal";
import { getAccent, type AccentHue } from "@/constants/accent-colors";
import { LANGUAGES } from "@/lib/data/languages";
import { useCultural } from "@/lib/hooks/use-cultural";
import { localize } from "@/lib/localize";
import { glass, useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore, type UiLanguage } from "@/store/ui-language-store";
import type { CulturalCategory, CulturalContent } from "@/types";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORY_HUE: Record<CulturalCategory, AccentHue> = {
  colors: "rose",
  naming_ceremonies: "sky",
  festivals: "orange",
  creation_myths: "purple",
  music: "pink",
  clothing: "teal",
  cuisine: "amber",
  greetings_etiquette: "green",
  governance_values: "indigo",
  land_livelihood: "green",
  kinship: "fuchsia",
  cosmology: "blue",
  oral_tradition: "amber",
  arts_oratory: "pink",
  numbers_trade: "teal",
  geography: "sky",
};

const CATEGORY_EMOJI: Record<CulturalCategory, string> = {
  colors: "🎨",
  naming_ceremonies: "👶",
  festivals: "🎉",
  creation_myths: "🌟",
  music: "🎵",
  clothing: "🧣",
  cuisine: "🍜",
  greetings_etiquette: "👋",
  governance_values: "⚖️",
  land_livelihood: "🌾",
  kinship: "👪",
  cosmology: "🌌",
  oral_tradition: "📖",
  arts_oratory: "🎭",
  numbers_trade: "🔢",
  geography: "🗺️",
};

const CATEGORY_ORDER: CulturalCategory[] = [
  "colors",
  "naming_ceremonies",
  "festivals",
  "creation_myths",
  "music",
  "clothing",
  "cuisine",
  "greetings_etiquette",
  "governance_values",
  "land_livelihood",
  "kinship",
  "cosmology",
  "oral_tradition",
  "arts_oratory",
  "numbers_trade",
  "geography",
];

/** Split a description block into readable paragraphs (~2 sentences each). */
function toParagraphs(text: string): string[] {
  const explicit = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [text];
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paras.push(sentences.slice(i, i + 2).join(" "));
  }
  return paras;
}

function termGloss(
  term: CulturalContent["keyTerms"][number],
  lang: UiLanguage
): string {
  return localize(term.gloss ?? term.english ?? term.french ?? "", lang);
}

/** Lazily loads + plays a remote headword clip; safe no-op when no url. */
function useHeadwordAudio(url?: string) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(async () => {
    if (!url) return;
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
      });
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [url]);

  useEffect(() => () => { soundRef.current?.unloadAsync(); }, []);
  return { isPlaying, play, enabled: !!url };
}

/** Three colour stripes (or a single tinted emoji panel) used as a reader hero. */
function ReaderHero({ item, height }: { item: CulturalContent; height: number }) {
  const { uiLanguage } = useUiLanguageStore();
  if (item.heroBands && item.heroBands.length > 0) {
    return (
      <View style={{ flexDirection: "row", height }}>
        {item.heroBands.map((band, i) => (
          <LinearGradient
            key={`${band.label}-${i}`}
            colors={[band.from, band.to]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{ flex: 1, justifyContent: "flex-end", padding: 16 }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", letterSpacing: -0.2, color: band.dark ? "#F7F2E8" : "#3A3128" }}>
              {band.label}
            </Text>
            {band.sublabel ? (
              <Text style={{ marginTop: 3, fontSize: 10.5, fontWeight: "700", lineHeight: 15, color: band.dark ? "rgba(247,242,232,0.72)" : "rgba(58,49,40,0.66)" }}>
                {localize(band.sublabel, uiLanguage)}
              </Text>
            ) : null}
          </LinearGradient>
        ))}
      </View>
    );
  }
  const accent = getAccent(CATEGORY_HUE[item.category]);
  return (
    <LinearGradient
      colors={[accent.bg, "#0B0D17"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ height, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontSize: 88 }}>{item.imageEmoji || CATEGORY_EMOJI[item.category]}</Text>
    </LinearGradient>
  );
}

function ReaderOverlay({ item, onClose }: { item: CulturalContent; onClose: () => void }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const insets = useSafeAreaInsets();
  const [shareVisible, setShareVisible] = useState(false);

  const title = localize(item.title, uiLanguage);
  const categoryLabel = t(`cultural.categories.${item.category}` as const);
  const paragraphs = useMemo(() => toParagraphs(localize(item.description, uiLanguage)), [item.description, uiLanguage]);
  const headword = item.headword ?? (item.keyTerms[0] ? { word: item.keyTerms[0].word, gloss: termGloss(item.keyTerms[0], uiLanguage), audioUrl: undefined } : null);
  const headwordGloss = headword ? localize(headword.gloss, uiLanguage) : "";
  const { play, enabled: audioEnabled } = useHeadwordAudio(item.headword?.audioUrl);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: M.bg }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <View style={{ position: "relative" }}>
            <ReaderHero item={item} height={220} />
            <Pressable
              onPress={onClose}
              accessibilityLabel={t("common.back")}
              hitSlop={8}
              style={{ position: "absolute", top: insets.top + 8, left: 14, width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(11,13,23,0.5)", borderWidth: 1, borderColor: glass(0.18) }}
            >
              <IconSymbol name="xmark" size={18} color={M.parchment} />
            </Pressable>
            <Pressable
              onPress={() => setShareVisible(true)}
              accessibilityLabel="Share content"
              hitSlop={8}
              style={{ position: "absolute", top: insets.top + 8, right: 14, width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(11,13,23,0.5)", borderWidth: 1, borderColor: glass(0.18) }}
            >
              <IconSymbol name="square.and.arrow.up" size={16} color={M.parchment} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
            <Text style={{ fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: "800", color: M.accent }}>
              {categoryLabel}
            </Text>
            <Text style={{ marginTop: 7, fontSize: 24, fontWeight: "800", letterSpacing: -0.6, lineHeight: 28, color: M.text }}>
              {title}
            </Text>

            {headword ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 13, marginTop: 16, borderRadius: 18, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 13 }}>
                <Pressable
                  onPress={play}
                  disabled={!audioEnabled}
                  accessibilityLabel={`Play ${headword.word}`}
                  style={{ width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", opacity: audioEnabled ? 1 : 0.45 }}
                >
                  <LinearGradient colors={["#EFC479", "#A66E1C"]} start={{ x: 0.35, y: 0.3 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, borderRadius: 14 }} />
                  <IconSymbol name="speaker.wave.2.fill" size={20} color="#FFFFFF" />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.3, color: M.text }}>{headword.word}</Text>
                  {headwordGloss ? <Text style={{ marginTop: 1, fontSize: 12.5, fontWeight: "600", color: M.sub }}>{headwordGloss}</Text> : null}
                </View>
              </View>
            ) : null}

            <View style={{ marginTop: 18 }}>
              {paragraphs.map((p, i) => (
                <Text key={i} style={{ marginBottom: 13, fontSize: 14, lineHeight: 23, fontWeight: "500", color: M.sub }}>
                  {p}
                </Text>
              ))}
            </View>

            {item.keyTerms.length > 0 && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: "800", color: M.accent, marginBottom: 11 }}>
                  {t("cultural.keyTerms")}
                </Text>
                {item.keyTerms.map((term) => (
                  <View key={term.word} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 11, marginBottom: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: M.accent }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }}>{term.word}</Text>
                      {termGloss(term, uiLanguage) ? (
                        <Text style={{ marginTop: 1, fontSize: 12, fontWeight: "600", color: M.sub }}>{termGloss(term, uiLanguage)}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {item.applications && item.applications.length > 0 && (
              <View style={{ marginTop: 20, borderRadius: 18, borderWidth: 1, borderColor: M.accentBorder, backgroundColor: M.accentGlow, padding: 16 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: "800", color: M.accent, marginBottom: 11 }}>
                  {t("cultural.applications")}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {item.applications.map((app, i) => (
                    <View key={i} style={{ borderRadius: 999, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 13, paddingVertical: 7 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: M.sub }}>{localize(app, uiLanguage)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        data={{
          template: "cultural",
          languageId: item.languageId,
          title,
          description: localize(item.description, uiLanguage),
          category: categoryLabel,
          emoji: item.imageEmoji,
          language: item.languageId,
        }}
      />
    </Modal>
  );
}

function FeaturedCard({ item, onOpen }: { item: CulturalContent; onOpen: () => void }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const bands = item.heroBands?.slice(0, 3);

  return (
    <Pressable
      onPress={onOpen}
      style={{ borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: M.border, backgroundColor: M.card }}
    >
      {bands && bands.length > 0 ? (
        <View style={{ flexDirection: "row", height: 118 }}>
          {bands.map((band, i) => (
            <LinearGradient key={`${band.label}-${i}`} colors={[band.from, band.to]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1, justifyContent: "flex-end", padding: 11 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 0.4, color: band.dark ? "rgba(255,255,255,0.82)" : "rgba(58,49,40,0.6)" }}>{band.label}</Text>
            </LinearGradient>
          ))}
        </View>
      ) : (
        <LinearGradient colors={[getAccent(CATEGORY_HUE[item.category]).bg, "#0B0D17"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 118, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 56 }}>{item.imageEmoji || CATEGORY_EMOJI[item.category]}</Text>
        </LinearGradient>
      )}

      <View style={{ padding: 16 }}>
        <View style={{ alignSelf: "flex-start", borderRadius: 7, borderWidth: 1, borderColor: M.accentBorder, backgroundColor: M.accentGlow, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 9.5, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: M.accent }}>
            {t("cultural.featured")} · {t(`cultural.categories.${item.category}` as const)}
          </Text>
        </View>
        <Text style={{ marginTop: 11, fontSize: 18.5, fontWeight: "800", letterSpacing: -0.4, lineHeight: 22, color: M.text }}>
          {localize(item.title, uiLanguage)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 13 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: M.accent }}>{t("cultural.readArticle")}</Text>
          <IconSymbol name="chevron.right" size={14} color={M.accent} />
        </View>
      </View>
    </Pressable>
  );
}

function CulturalRow({ item, onOpen }: { item: CulturalContent; onOpen: () => void }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const accent = getAccent(CATEGORY_HUE[item.category]);

  return (
    <Pressable
      onPress={onOpen}
      style={{ flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 11, marginBottom: 9 }}
    >
      <View style={{ width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: accent.bg, borderWidth: 1, borderColor: accent.border }}>
        <Text style={{ fontSize: 24 }}>{item.imageEmoji || CATEGORY_EMOJI[item.category]}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase", color: M.muted }}>
          {t(`cultural.categories.${item.category}` as const)}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 14.5, fontWeight: "800", letterSpacing: -0.2, color: M.text }}>
          {localize(item.title, uiLanguage)}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 11.5, fontWeight: "600", color: M.muted }}>
          {localize(item.description, uiLanguage)}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={M.muted} />
    </Pressable>
  );
}

export default function CulturalScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { languageId } = useLocalSearchParams<{ languageId: string }>();
  const { data: allContent = [], isLoading } = useCultural(languageId ?? "");
  const [selectedCategory, setSelectedCategory] = useState<CulturalCategory | null>(null);
  const [openItem, setOpenItem] = useState<CulturalContent | null>(null);

  const language = useMemo(() => LANGUAGES.find((l) => l.id === languageId), [languageId]);

  const availableCategories = useMemo(() => {
    const present = new Set(allContent.map((item) => item.category));
    return CATEGORY_ORDER.filter((id) => present.has(id));
  }, [allContent]);

  const filteredContent = useMemo(() => {
    if (!selectedCategory) return allContent;
    return allContent.filter((item) => item.category === selectedCategory);
  }, [allContent, selectedCategory]);

  // Featured card only on the unfiltered view; prefer a flagged entry.
  const featured = useMemo(
    () => (selectedCategory ? null : allContent.find((c) => c.featured) ?? allContent[0] ?? null),
    [allContent, selectedCategory]
  );
  const listItems = useMemo(
    () => (featured ? filteredContent.filter((c) => c.id !== featured.id) : filteredContent),
    [filteredContent, featured]
  );

  const eyebrow = language ? `${language.name} · ${language.region}` : (languageId ?? "");

  return (
    <View style={{ flex: 1, backgroundColor: M.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {/* Hero header — dark foyer fading into the content surface */}
          <LinearGradient
            colors={[M.inkDeep, M.ink, M.bg]}
            locations={[0, 0.7, 1]}
            style={{ paddingTop: insets.top + 12, paddingHorizontal: 22, paddingBottom: 28 }}
          >
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel={t("common.back")}
              hitSlop={8}
              style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: glass(0.14), backgroundColor: glass(0.08), paddingVertical: 6, paddingLeft: 9, paddingRight: 13 }}
            >
              <IconSymbol name="chevron.left" size={15} color={M.parchment} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: M.parchment }}>{t("common.back")}</Text>
            </Pressable>

            <Text style={{ marginTop: 18, fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: "800", color: M.accent }}>
              {eyebrow}
            </Text>
            <Text style={{ marginTop: 6, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, lineHeight: 31, color: M.parchment }}>
              {t("cultural.heritage")}
            </Text>
            <Text style={{ marginTop: 10, maxWidth: 300, fontSize: 13, lineHeight: 20, fontWeight: "500", color: M.textDim }}>
              {t("cultural.subtitle")}
            </Text>
          </LinearGradient>

          {/* Category filter */}
          {availableCategories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 4, gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedCategory(null)}
                style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: selectedCategory === null ? M.accent : M.card, borderWidth: 1, borderColor: selectedCategory === null ? M.accent : M.border }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: selectedCategory === null ? M.ink : M.sub }}>{t("cultural.all")}</Text>
              </Pressable>
              {availableCategories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(active ? null : cat)}
                    style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: active ? M.accent : M.card, borderWidth: 1, borderColor: active ? M.accent : M.border }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: active ? M.ink : M.sub }}>
                      {CATEGORY_EMOJI[cat]} {t(`cultural.categories.${cat}` as const)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {filteredContent.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 64 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder, marginBottom: 16 }}>
                <IconSymbol name="book.fill" size={28} color={M.accent} />
              </View>
              <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "700", color: M.text }}>{t("cultural.noContent")}</Text>
            </View>
          ) : (
            <>
              {featured && (
                <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
                  <FeaturedCard item={featured} onOpen={() => setOpenItem(featured)} />
                </View>
              )}

              {listItems.length > 0 && (
                <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: "800", color: M.accent }}>
                      {t("cultural.entries")}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: M.muted }}>
                      {t("cultural.entryCount", { count: filteredContent.length })}
                    </Text>
                  </View>
                  {listItems.map((item) => (
                    <CulturalRow key={item.id} item={item} onOpen={() => setOpenItem(item)} />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {openItem && <ReaderOverlay item={openItem} onClose={() => setOpenItem(null)} />}
    </View>
  );
}
