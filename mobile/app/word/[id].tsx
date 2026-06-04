import { friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState, useEffect, useCallback, useRef } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { KeyboardAvoidingView, Platform, View, Text, Pressable, ScrollView, TextInput, Image } from "react-native";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/dictionary";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useSubmitEntryContribution } from "@/lib/hooks/use-contributions";
import { useToast } from "@/lib/hooks/use-toast";
import { useContributionStore } from "@/store/contribution-store";
import { useDictionaryNavStore } from "@/store/dictionary-nav-store";
import { useSaveWord, useRemoveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { addRecentlyViewed } from "@/lib/hooks/use-recently-viewed";
import { useTranslation } from "react-i18next";

function InlineAudioButton({ audioUrl }: { audioUrl: string }) {
  const M = useMuseumTheme();
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const handlePress = useCallback(async () => {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => { if (s.isLoaded && s.didJustFinish) setPlaying(false); });
      setPlaying(true);
      await sound.playAsync();
    } catch { setPlaying(false); }
  }, [audioUrl]);

  return (
    <Pressable onPress={handlePress} disabled={playing} hitSlop={8} style={{ marginLeft: 8, padding: 4 }}>
      <IconSymbol
        name={playing ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
        size={18}
        color={playing ? M.accent : M.muted}
      />
    </Pressable>
  );
}

export default function WordDetailScreen() {
  const M = useMuseumTheme();
  const { id, languageId } = useLocalSearchParams<{
    id: string;
    languageId: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const { data: entries = [], isLoading } = useDictionary(languageId);
  const entry = entries.find((e) => e.id === id);

  const { data: savedIds } = useWordBank();
  const savedSet = new Set(savedIds ?? []);
  const saveWord = useSaveWord();
  const removeWord = useRemoveWord();

  const { entryIds, languageId: navLanguageId } = useDictionaryNavStore();
  const currentIndex = entryIds.indexOf(id);
  const prevId = currentIndex > 0 ? entryIds[currentIndex - 1] : null;
  const nextId = currentIndex < entryIds.length - 1 ? entryIds[currentIndex + 1] : null;
  const hasNavContext = entryIds.length > 0;

  const submitEntry = useSubmitEntryContribution();
  const {
    isRecording,
    isPlaying,
    recordingUri,
    startRecording,
    stopRecording,
    discardRecording,
    playRecording,
    stopPlayback,
  } = useContributionStore();
  const [showMeaningInput, setShowMeaningInput] = useState(false);
  const [newMeaning, setNewMeaning] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showContribute, setShowContribute] = useState(false);

  const entryId = entry?.id;
  const entryLanguageId = entry?.languageId;
  useEffect(() => {
    if (entryId && entryLanguageId) {
      addRecentlyViewed(entryId, entryLanguageId);
    }
  }, [entryId, entryLanguageId]);

  const saved = entry ? savedSet.has(entry.id) : false;

  const handleSubmitAudio = () => {
    if (!entry || !recordingUri) return;
    submitEntry.mutate(
      {
        type: "entry_audio",
        languageId: entry.languageId,
        dictionaryEntryId: entry.id,
        word: entry.word,
        english: entry.english,
        category: entry.category,
        audioUri: recordingUri,
      },
      {
        onSuccess: () => {
          discardRecording();
          toastSuccess(t("entryContribute.submitted"), t("entryContribute.audioSubmittedDesc"));
        },
        onError: (err) => {
          toastError(t("common.error"), friendlyError(err));
        },
      }
    );
  };

  const handlePickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmitImage = () => {
    if (!entry || !imageUri) return;
    submitEntry.mutate(
      {
        type: "entry_image",
        languageId: entry.languageId,
        dictionaryEntryId: entry.id,
        word: entry.word,
        english: entry.english,
        category: entry.category,
        imageUri,
      },
      {
        onSuccess: () => {
          setImageUri(null);
          toastSuccess(t("entryContribute.submitted"), t("entryContribute.imageSubmittedDesc"));
        },
        onError: (err) => {
          toastError(t("common.error"), friendlyError(err));
        },
      }
    );
  };

  const handleSubmitMeaning = () => {
    if (!entry || !newMeaning.trim()) return;
    submitEntry.mutate(
      {
        type: "entry_meaning",
        languageId: entry.languageId,
        dictionaryEntryId: entry.id,
        word: entry.word,
        english: newMeaning.trim(),
        category: entry.category,
      },
      {
        onSuccess: () => {
          setNewMeaning("");
          setShowMeaningInput(false);
          toastSuccess(t("entryContribute.submitted"), t("entryContribute.meaningSubmittedDesc"));
        },
        onError: (err) => {
          toastError(t("common.error"), friendlyError(err));
        },
      }
    );
  };

  const handleToggleSave = () => {
    if (!entry) return;
    if (saved) {
      removeWord.mutate(entry.id);
    } else {
      saveWord.mutate(entry.id);
    }
  };

  const handlePractice = () => {
    if (!entry) return;
    router.push({
      pathname: "/quiz",
      params: {
        focusWord: entry.word,
        focusEnglish: entry.english,
        ...(typeof entry.audioUrl === "string" && entry.audioUrl
          ? { focusAudio: entry.audioUrl }
          : {}),
      },
    });
  };

  const navigateTo = (targetId: string) => {
    router.replace({
      pathname: "/word/[id]",
      params: { id: targetId, languageId: navLanguageId || languageId },
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "", headerBackTitle: "Back" }} />
        <LoadingScreen />
      </>
    );
  }

  if (!entry) {
    return (
      <>
        <Stack.Screen options={{ title: "Word", headerBackTitle: "Back" }} />
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: M.bg, paddingHorizontal: 32 }} edges={[]}>
          <IconSymbol name="questionmark.circle" size={48} color={M.muted} />
          <Text style={{ marginTop: 16, textAlign: "center", fontSize: 15, color: M.sub }}>
            {t("wordDetail.notFound")}
          </Text>
        </SafeAreaView>
      </>
    );
  }

  const categoryLabel = CATEGORY_LABELS[entry.category];
  const categoryIcon = CATEGORY_ICONS[entry.category];
  const hasContributable = !entry.audioUrl || !entry.imageUrl;

  return (
    <>
      <Stack.Screen
        options={{ title: entry.word, headerBackTitle: "Back" }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <View style={{ alignItems: "center", paddingHorizontal: 24, paddingBottom: 24, paddingTop: 40 }}>
            {entry.imageUrl && (
              <Image
                source={{ uri: entry.imageUrl }}
                style={{ marginBottom: 20, height: 192, width: "100%", borderRadius: 16 }}
                resizeMode="cover"
              />
            )}
            <Text style={{ textAlign: "center", fontSize: 60, fontWeight: "700", color: M.text }}>
              {entry.word}
            </Text>

            {entry.pronunciation && (
              <Text style={{ marginTop: 8, fontSize: 16, fontStyle: "italic", color: M.sub }}>
                /{entry.pronunciation}/
              </Text>
            )}

            {(() => {
              const meanings = entry.english.split(";").map((m) => m.trim()).filter(Boolean);
              if (meanings.length <= 1) {
                return (
                  <Text style={{ marginTop: 12, textAlign: "center", fontSize: 20, color: M.sub }}>
                    {entry.english}
                  </Text>
                );
              }
              return (
                <View style={{ marginTop: 12, alignItems: "center", gap: 4 }}>
                  {meanings.map((meaning, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: M.accent }}>
                        {i + 1}.
                      </Text>
                      <Text style={{ fontSize: 18, color: M.sub }}>
                        {meaning}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            {!!entry.french && (
              <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: M.accentBorder }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: M.accent }}>
                    {t("wordDetail.french")}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, color: M.sub }}>
                  {entry.french}
                </Text>
              </View>
            )}

            {/* Audio button */}
            <View style={{ marginTop: 24, alignItems: "center" }}>
              <View style={{ height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: M.accent }}>
                <WordAudioButton audioSource={entry.audioUrl} word={entry.word} size={28} />
              </View>
              <Text style={{ marginTop: 8, fontSize: 11, fontWeight: "600", color: M.accent }}>
                {entry.audioUrl ? t("wordDetail.hearPronunciation") : t("wordDetail.textToSpeech")}
              </Text>
            </View>

            {/* Category badge */}
            <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: M.accentBorder }}>
              <IconSymbol name={categoryIcon as any} size={13} color={M.accent} />
              <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: M.accent }}>
                {categoryLabel}
              </Text>
            </View>
          </View>

          <View style={{ marginHorizontal: 20, height: 1, backgroundColor: M.border }} />

          {/* Example sentence */}
          {entry.example && (
            <View style={{ marginHorizontal: 20, marginTop: 20, borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: M.border }}>
              <Text style={{ marginBottom: 6, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
                {t("wordDetail.example")}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text style={{ flex: 1, fontSize: 16, color: M.text }}>
                  {entry.example}
                </Text>
                {entry.exampleAudioUrl && (
                  <InlineAudioButton audioUrl={entry.exampleAudioUrl} />
                )}
              </View>
              {entry.exampleTranslation && (
                <Text style={{ marginTop: 6, fontSize: 13, color: M.sub }}>
                  {entry.exampleTranslation}
                </Text>
              )}
            </View>
          )}

          {/* Related words */}
          {(() => {
            const related = entries
              .filter((e) => e.category === entry.category && e.id !== entry.id)
              .slice(0, 5);
            if (related.length === 0) return null;
            return (
              <View style={{ marginTop: 20 }}>
                <Text style={{ marginHorizontal: 20, marginBottom: 8, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
                  {t("wordDetail.moreInCategory", { category: categoryLabel })}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ paddingHorizontal: 20 }}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {related.map((rel) => (
                    <Pressable
                      key={rel.id}
                      onPress={() => router.push(`/word/${rel.id}?languageId=${languageId}` as any)}
                      style={{ borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: M.border }}
                      className="active:opacity-70"
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>
                        {rel.word}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: 11, color: M.sub }} numberOfLines={1}>
                        {rel.english}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            );
          })()}

          {/* Contributor */}
          {entry.contributorName && (
            <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: "row", alignItems: "center" }}>
              <IconSymbol name="person.fill" size={13} color={M.muted} />
              <Text style={{ marginLeft: 6, fontSize: 13, color: M.muted }}>
                {t("wordDetail.contributedBy", { name: entry.contributorName })}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={{ marginHorizontal: 20, marginTop: 32, gap: 12 }}>
            <Pressable
              onPress={handlePractice}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "#22c55e", paddingVertical: 16 }}
              className="active:opacity-80"
            >
              <IconSymbol name="brain.head.profile" size={18} color="#fff" />
              <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "600", color: "#fff" }}>
                {t("wordDetail.practiceWord")}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleToggleSave}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center",
                borderRadius: 16, borderWidth: 1, paddingVertical: 16,
                backgroundColor: saved ? M.accentGlow : M.card,
                borderColor: saved ? M.accentBorder : M.border,
              }}
              className="active:opacity-80"
            >
              <IconSymbol name={saved ? "star.fill" : "star"} size={18} color={saved ? M.accent : M.muted} />
              <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "600", color: saved ? M.accent : M.sub }}>
                {saved ? t("wordDetail.savedToWordBank") : t("wordDetail.saveToWordBank")}
              </Text>
            </Pressable>
          </View>

          {/* Prev / Next navigation */}
          {hasNavContext && (
            <View style={{ marginHorizontal: 20, marginTop: 20, flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => prevId && navigateTo(prevId)}
                disabled={!prevId}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 12, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, opacity: prevId ? 1 : 0.3 }}
                className={prevId ? "active:opacity-70" : ""}
              >
                <IconSymbol name="chevron.left" size={14} color={M.sub} />
                <Text style={{ marginLeft: 4, fontSize: 13, fontWeight: "500", color: M.sub }}>
                  {t("wordDetail.prevWord")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => nextId && navigateTo(nextId)}
                disabled={!nextId}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 12, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, opacity: nextId ? 1 : 0.3 }}
                className={nextId ? "active:opacity-70" : ""}
              >
                <Text style={{ marginRight: 4, fontSize: 13, fontWeight: "500", color: M.sub }}>
                  {t("wordDetail.nextWord")}
                </Text>
                <IconSymbol name="chevron.right" size={14} color={M.sub} />
              </Pressable>
            </View>
          )}

          {/* Contribute section — collapsible */}
          {hasContributable && (
            <View style={{ marginHorizontal: 20, marginTop: 32, marginBottom: 8 }}>
              <Pressable
                onPress={() => setShowContribute((v) => !v)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, borderWidth: 1, borderColor: M.border, paddingHorizontal: 16, paddingVertical: 14 }}
                className="active:opacity-80"
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconSymbol name="plus.circle.fill" size={18} color={M.accent} />
                  <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "500", color: M.accent }}>
                    {t("wordDetail.contributeExpand")}
                  </Text>
                </View>
                <IconSymbol name={showContribute ? "chevron.up" : "chevron.down"} size={14} color={M.muted} />
              </Pressable>

              {showContribute && (
                <View style={{ marginTop: 12, gap: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
                    {t("entryContribute.title")}
                  </Text>

                  {!entry.audioUrl && (
                    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 16 }}>
                      <Text style={{ marginBottom: 4, fontSize: 14, fontWeight: "600", color: M.text }}>
                        {t("entryContribute.recordAudio")}
                      </Text>
                      <Text style={{ marginBottom: 12, fontSize: 12, color: M.sub }}>
                        {t("entryContribute.recordAudioDesc")}
                      </Text>
                      <View style={{ alignItems: "center" }}>
                        {recordingUri ? (
                          <View style={{ alignItems: "center", gap: 8 }}>
                            <Pressable
                              onPress={isPlaying ? stopPlayback : playRecording}
                              style={{ height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: 28, backgroundColor: isPlaying ? M.accent : "#22c55e20" }}
                            >
                              <IconSymbol name={isPlaying ? "stop.fill" : "play.fill"} size={22} color={isPlaying ? M.ink : "#22c55e"} />
                            </Pressable>
                            <Text style={{ fontSize: 13, color: "#22c55e" }}>{t("contribute.recordingSaved")}</Text>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              <Pressable onPress={() => discardRecording()} style={{ borderRadius: 8, backgroundColor: M.border, paddingHorizontal: 16, paddingVertical: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: "500", color: M.sub }}>{t("contribute.reRecord")}</Text>
                              </Pressable>
                              <Pressable onPress={handleSubmitAudio} disabled={submitEntry.isPending} style={{ borderRadius: 8, backgroundColor: M.accent, paddingHorizontal: 16, paddingVertical: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: "500", color: M.ink }}>{submitEntry.isPending ? t("contribute.submitting") : t("common.submit")}</Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          <>
                            <Pressable
                              onPress={isRecording ? stopRecording : startRecording}
                              style={{ height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: 28, backgroundColor: isRecording ? "#ef4444" : "#ef444420" }}
                            >
                              {isRecording ? (
                                <View style={{ height: 20, width: 20, borderRadius: 4, backgroundColor: "#fff" }} />
                              ) : (
                                <IconSymbol name="mic.fill" size={22} color="#ef4444" />
                              )}
                            </Pressable>
                            <Text style={{ marginTop: 8, fontSize: 12, color: M.muted }}>
                              {isRecording ? t("contribute.recordingTapToStop") : t("entryContribute.tapToRecord")}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  )}

                  {!entry.imageUrl && (
                    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 16 }}>
                      <Text style={{ marginBottom: 4, fontSize: 14, fontWeight: "600", color: M.text }}>{t("entryContribute.addImage")}</Text>
                      <Text style={{ marginBottom: 12, fontSize: 12, color: M.sub }}>{t("entryContribute.addImageDesc")}</Text>
                      {imageUri ? (
                        <View style={{ alignItems: "center", gap: 12 }}>
                          <Image source={{ uri: imageUri }} style={{ height: 160, width: "100%", borderRadius: 12 }} resizeMode="cover" />
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable onPress={() => setImageUri(null)} style={{ borderRadius: 8, backgroundColor: M.border, paddingHorizontal: 16, paddingVertical: 8 }}>
                              <Text style={{ fontSize: 13, fontWeight: "500", color: M.sub }}>{t("common.cancel")}</Text>
                            </Pressable>
                            <Pressable onPress={handleSubmitImage} disabled={submitEntry.isPending} style={{ borderRadius: 8, backgroundColor: M.accent, paddingHorizontal: 16, paddingVertical: 8 }}>
                              <Text style={{ fontSize: 13, fontWeight: "500", color: M.ink }}>{submitEntry.isPending ? t("contribute.submitting") : t("common.submit")}</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <Pressable onPress={handlePickImage} style={{ alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: M.border, paddingVertical: 24 }}>
                          <IconSymbol name="photo.badge.plus" size={28} color={M.muted} />
                          <Text style={{ fontSize: 13, color: M.muted }}>{t("entryContribute.tapToPickImage")}</Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {showMeaningInput ? (
                    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 16 }}>
                      <Text style={{ marginBottom: 4, fontSize: 14, fontWeight: "600", color: M.text }}>{t("entryContribute.addMeaning")}</Text>
                      <Text style={{ marginBottom: 12, fontSize: 12, color: M.sub }}>{t("entryContribute.addMeaningDesc")}</Text>
                      <TextInput
                        value={newMeaning}
                        onChangeText={setNewMeaning}
                        placeholder={t("entryContribute.meaningPlaceholder")}
                        placeholderTextColor={M.inputPlaceholder}
                        style={{ marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: M.inputBorder, backgroundColor: M.inputBg, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: M.inputText }}
                        autoFocus
                      />
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Pressable onPress={() => { setShowMeaningInput(false); setNewMeaning(""); }} style={{ flex: 1, alignItems: "center", borderRadius: 12, backgroundColor: M.border, paddingVertical: 12 }}>
                          <Text style={{ fontWeight: "600", color: M.sub }}>{t("common.cancel")}</Text>
                        </Pressable>
                        <Pressable onPress={handleSubmitMeaning} disabled={!newMeaning.trim() || submitEntry.isPending} style={{ flex: 1, alignItems: "center", borderRadius: 12, backgroundColor: newMeaning.trim() && !submitEntry.isPending ? M.accent : M.accentGlow, paddingVertical: 12 }}>
                          <Text style={{ fontWeight: "600", color: newMeaning.trim() ? M.ink : M.muted }}>{submitEntry.isPending ? t("contribute.submitting") : t("common.submit")}</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => setShowMeaningInput(true)} style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: M.border, paddingHorizontal: 16, paddingVertical: 14 }} className="active:opacity-80">
                      <IconSymbol name="plus.circle.fill" size={20} color={M.accent} />
                      <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "500", color: M.accent }}>{t("entryContribute.addMeaning")}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
