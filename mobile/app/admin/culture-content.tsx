import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { apiFetch } from "@/lib/api";
import { useInteractiveStories } from "@/lib/hooks/use-discover";
import { useStoryArcs } from "@/lib/hooks/use-story-arc";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DiscoverContentType, DiscoverItem } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ContentFilter = "all" | DiscoverContentType;

const TYPE_CONFIG: Record<DiscoverContentType, { color: string; label: string; icon: string }> = {
  blog:    { color: getAccent("sky").solid,    label: "Blog",    icon: "doc.text.fill" },
  podcast: { color: getAccent("purple").solid, label: "Podcast", icon: "headphones" },
  film:    { color: getAccent("orange").solid, label: "Film",    icon: "play.circle.fill" },
};

const FILTER_OPTIONS: { id: ContentFilter; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "blog",    label: "Blog" },
  { id: "podcast", label: "Podcast" },
  { id: "film",    label: "Film" },
];

const EMPTY_FORM: Omit<DiscoverItem, "id"> = {
  type: "blog",
  title: "",
  description: "",
  author: "",
  publishedAt: new Date().toISOString(),
  duration: 360,
  coverGradient: ["#0F2A4A", "#0D0F1A"],
  coverEmoji: "📖",
  featured: false,
  audioUrl: "",
  contentUrl: "",
  body: "",
  showNotes: "",
};

interface ItemFormProps {
  initial?: DiscoverItem;
  onSave: (data: Omit<DiscoverItem, "id">) => void;
  onCancel: () => void;
  saving: boolean;
}

function ItemForm({ initial, onSave, onCancel, saving }: ItemFormProps) {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const base = initial ?? ({ id: "", ...EMPTY_FORM } as DiscoverItem);
  const [type, setType] = useState<DiscoverContentType>(base.type);
  const [title, setTitle] = useState(base.title);
  const [description, setDescription] = useState(base.description);
  const [author, setAuthor] = useState(base.author);
  const [coverEmoji, setCoverEmoji] = useState(base.coverEmoji);
  const [duration, setDuration] = useState(String(base.duration));
  const [featured, setFeatured] = useState(base.featured ?? false);
  const [audioUrl, setAudioUrl] = useState(base.audioUrl ?? "");
  const [contentUrl, setContentUrl] = useState(base.contentUrl ?? "");
  const [body, setBody] = useState(base.body ?? "");
  const [showNotes, setShowNotes] = useState(base.showNotes ?? "");
  const [storyId, setStoryId] = useState(base.storyId ?? "");
  const [storySearch, setStorySearch] = useState("");

  const { data: interactiveStories, isLoading: storiesLoading } = useInteractiveStories();
  const { data: storyArcs, isLoading: arcsLoading } = useStoryArcs();

  const storyOptions = useMemo(() => {
    const stories = (interactiveStories ?? []).map((s) => ({ id: s.id, title: s.title, kind: "story" as const }));
    const arcs = (storyArcs ?? []).map((a) => ({ id: a.id, title: a.title, kind: "arc" as const }));
    return [...stories, ...arcs];
  }, [interactiveStories, storyArcs]);

  const filteredStoryOptions = useMemo(() => {
    const q = storySearch.trim().toLowerCase();
    if (!q) return storyOptions;
    return storyOptions.filter((o) => o.title.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }, [storyOptions, storySearch]);

  const canSave = title.trim() && description.trim() && author.trim() && coverEmoji.trim();

  function handleSave() {
    if (!canSave) return;
    onSave({
      type,
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      publishedAt: base.publishedAt ?? new Date().toISOString(),
      duration: parseInt(duration, 10) || 360,
      coverGradient: base.coverGradient,
      coverEmoji: coverEmoji.trim(),
      featured,
      audioUrl: audioUrl.trim() || undefined,
      contentUrl: contentUrl.trim() || undefined,
      body: body.trim() || undefined,
      showNotes: showNotes.trim() || undefined,
      storyId: storyId.trim() || undefined,
    });
  }

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <View className="mb-4">
        <Text className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: M.muted }}>
          {label}
        </Text>
        {children}
      </View>
    );
  }

  const inputClass = "rounded-2xl border px-4 py-3 text-sm";
  const inputStyle = { backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      {/* Type picker */}
      <Field label={t("admin.cultureContent.formType")}>
        <View className="flex-row gap-2">
          {(["blog", "podcast", "film"] as DiscoverContentType[]).map((ct) => {
            const active = type === ct;
            const color = TYPE_CONFIG[ct].color;
            return (
              <Pressable
                key={ct}
                onPress={() => setType(ct)}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12,
                  backgroundColor: active ? `${color}18` : undefined,
                  borderWidth: 1, borderColor: active ? `${color}60` : M.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: active ? color : M.muted }}>
                  {t(`admin.cultureContent.typeLabel.${ct}` as const)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label={t("admin.cultureContent.formTitle")}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t("admin.cultureContent.titlePlaceholder")}
          placeholderTextColor={M.muted}
          maxLength={120}
          style={inputStyle}
          className={inputClass}
        />
      </Field>

      <Field label={t("admin.cultureContent.formDescription")}>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t("admin.cultureContent.descPlaceholder")}
          placeholderTextColor={M.muted}
          maxLength={300}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={inputStyle}
          className={`${inputClass} min-h-[72px]`}
        />
      </Field>

      <Field label={t("admin.cultureContent.formAuthor")}>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder={t("admin.cultureContent.authorPlaceholder")}
          placeholderTextColor={M.muted}
          maxLength={80}
          style={inputStyle}
          className={inputClass}
        />
      </Field>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: M.muted }}>
            {t("admin.cultureContent.formCoverEmoji")}
          </Text>
          <TextInput
            value={coverEmoji}
            onChangeText={setCoverEmoji}
            placeholder="🎙️"
            placeholderTextColor={M.muted}
            maxLength={4}
            style={inputStyle}
            className={inputClass}
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: M.muted }}>
            {t("admin.cultureContent.formDuration")}
          </Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="360"
            placeholderTextColor={M.muted}
            keyboardType="numeric"
            maxLength={6}
            style={inputStyle}
            className={inputClass}
          />
        </View>
      </View>

      <Field label={t("admin.cultureContent.formAudioUrl")}>
        <TextInput
          value={audioUrl}
          onChangeText={setAudioUrl}
          placeholder="https://cdn.beeli.app/podcast/ep-xx.mp3"
          placeholderTextColor={M.muted}
          autoCapitalize="none"
          keyboardType="url"
          style={inputStyle}
          className={inputClass}
        />
      </Field>

      <Field label={t("admin.cultureContent.formWebUrl")}>
        <TextInput
          value={contentUrl}
          onChangeText={setContentUrl}
          placeholder="https://beeli.app/blog/..."
          placeholderTextColor={M.muted}
          autoCapitalize="none"
          keyboardType="url"
          style={inputStyle}
          className={inputClass}
        />
      </Field>

      {type === "blog" && (
        <Field label={t("admin.cultureContent.formArticleBody")}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t("admin.cultureContent.bodyPlaceholder")}
            placeholderTextColor={M.muted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            style={inputStyle}
            className={`${inputClass} min-h-[160px]`}
          />
        </Field>
      )}

      {(type === "podcast" || type === "film") && (
        <Field label={t("admin.cultureContent.formShowNotes")}>
          <TextInput
            value={showNotes}
            onChangeText={setShowNotes}
            placeholder={t("admin.cultureContent.showNotesPlaceholder")}
            placeholderTextColor={M.muted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            style={inputStyle}
            className={`${inputClass} min-h-[160px]`}
          />
        </Field>
      )}

      {(type === "podcast" || type === "film") && (
        <Field label={t("admin.discoverStories.storyLinkLabel")}>
          <Text className="text-xs mb-2" style={{ color: M.sub }}>
            {t("admin.discoverStories.storyLinkHint")}
          </Text>
          <TextInput
            value={storySearch}
            onChangeText={setStorySearch}
            placeholder={t("admin.discoverStories.storyLinkPlaceholder")}
            placeholderTextColor={M.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={inputStyle}
            className={`${inputClass} mb-2`}
          />

          {storiesLoading || arcsLoading ? (
            <ActivityIndicator color={M.accent} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Pressable
                onPress={() => setStoryId("")}
                className="flex-row items-center justify-between rounded-2xl border px-4 py-3 mb-2"
                style={!storyId ? { backgroundColor: M.accentGlow, borderColor: M.accentBorder } : { backgroundColor: M.card, borderColor: M.border }}
              >
                <Text className="text-sm font-semibold" style={{ color: M.text }}>
                  {t("admin.discoverStories.storyLinkNone")}
                </Text>
                {!storyId && <IconSymbol name="checkmark.circle.fill" size={18} color={M.accent} />}
              </Pressable>

              {filteredStoryOptions.map((opt) => {
                const isSelected = storyId === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setStoryId(opt.id)}
                    className="flex-row items-center justify-between rounded-2xl border px-4 py-3 mb-2"
                    style={isSelected ? { backgroundColor: M.accentGlow, borderColor: M.accentBorder } : { backgroundColor: M.card, borderColor: M.border }}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold" style={{ color: M.text }} numberOfLines={1}>
                        {opt.title}
                      </Text>
                      <Text className="text-xs mt-0.5" style={{ color: M.sub }}>
                        {opt.kind === "story" ? t("admin.discoverStories.storyGroupStory") : t("admin.discoverStories.storyGroupArc")} · {opt.id}
                      </Text>
                    </View>
                    {isSelected && <IconSymbol name="checkmark.circle.fill" size={18} color={M.accent} />}
                  </Pressable>
                );
              })}

              {filteredStoryOptions.length === 0 && (
                <Text className="text-xs" style={{ color: M.muted }}>
                  {t("admin.discoverStories.storyLinkNoResults")}
                </Text>
              )}
            </>
          )}
        </Field>
      )}

      {/* Featured toggle */}
      <View className="flex-row items-center justify-between rounded-2xl border px-4 py-3 mb-6" style={{ backgroundColor: M.card, borderColor: M.border }}>
        <View>
          <Text className="text-sm font-semibold" style={{ color: M.text }}>{t("admin.cultureContent.featuredLabel")}</Text>
          <Text className="text-xs mt-0.5" style={{ color: M.sub }}>
            {t("admin.cultureContent.featuredHint")}
          </Text>
        </View>
        <Switch
          value={featured}
          onValueChange={setFeatured}
          trackColor={{ false: M.border, true: M.accent }}
          thumbColor={M.parchment}
        />
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={onCancel}
          className="flex-1 items-center rounded-2xl py-3.5 active:opacity-70"
          style={{ backgroundColor: M.card }}
        >
          <Text className="text-sm font-bold" style={{ color: M.sub }}>{t("admin.cultureContent.cancel")}</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          className={`flex-1 items-center rounded-2xl py-3.5 ${canSave && !saving ? "active:opacity-80" : ""}`}
          style={{ backgroundColor: canSave && !saving ? M.accent : M.border }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={M.parchment} />
          ) : (
            <Text className="text-sm font-bold" style={{ color: canSave ? M.parchment : M.muted }}>
              {initial ? t("admin.cultureContent.saveChanges") : t("admin.cultureContent.publish")}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function CultureContentAdminScreen() {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { editId, newStoryId } = useLocalSearchParams<{ editId?: string; newStoryId?: string }>();
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<DiscoverItem | null>(null);

  async function authedFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(path, { ...options, token: token ?? undefined });
  }

  const { data: items = [], isLoading } = useQuery<DiscoverItem[]>({
    queryKey: ["culture-items", "admin"],
    queryFn: () => authedFetch("/culture-items"),
    placeholderData: [],
  });

  const { data: interactiveStories } = useInteractiveStories();
  const { data: storyArcs } = useStoryArcs();
  const storyTitleById = useMemo(() => {
    const map = new Map<string, string>();
    (interactiveStories ?? []).forEach((s) => map.set(s.id, s.title));
    (storyArcs ?? []).forEach((a) => map.set(a.id, a.title));
    return map;
  }, [interactiveStories, storyArcs]);

  useEffect(() => {
    if (!editId) return;
    const target = items.find((i) => i.id === editId);
    if (target) {
      setEditTarget(target);
      setModalMode("edit");
    }
  }, [editId, items]);

  useEffect(() => {
    if (!newStoryId || modalMode) return;
    setEditTarget({ id: "", ...EMPTY_FORM, type: "film", storyId: newStoryId } as DiscoverItem);
    setModalMode("create");
  }, [newStoryId, modalMode]);

  const createItem = useMutation({
    mutationFn: (data: Omit<DiscoverItem, "id">) => {
      const id = `${data.type}-${Date.now()}`;
      const payload = {
        ...data,
        id,
        coverGradientFrom: data.coverGradient[0],
        coverGradientTo: data.coverGradient[1],
      };
      return authedFetch("/culture-items/admin", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["culture-items"] });
      setModalMode(null);
    },
    onError: () => Alert.alert("Error", t("admin.cultureContent.errorCreate")),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<DiscoverItem, "id"> }) => {
      const payload = {
        ...data,
        coverGradientFrom: data.coverGradient[0],
        coverGradientTo: data.coverGradient[1],
      };
      return authedFetch(`/culture-items/admin/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["culture-items"] });
      setModalMode(null);
      setEditTarget(null);
    },
    onError: () => Alert.alert("Error", t("admin.cultureContent.errorUpdate")),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) =>
      authedFetch(`/culture-items/admin/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["culture-items"] });
    },
    onError: () => Alert.alert("Error", t("admin.cultureContent.errorDelete")),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      authedFetch(`/culture-items/admin/${id}`, { method: "PATCH", body: JSON.stringify({ featured }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["culture-items"] });
    },
    onError: () => Alert.alert("Error", t("admin.cultureContent.errorFeatured")),
  });

  const q = search.toLowerCase();
  const filtered = useMemo(() => {
    let list = items;
    if (filter !== "all") list = list.filter((i) => i.type === filter);
    if (q) list = list.filter((i) => i.title.toLowerCase().includes(q) || i.author.toLowerCase().includes(q));
    return list;
  }, [items, filter, q]);

  function openEdit(item: DiscoverItem) {
    setEditTarget(item);
    setModalMode("edit");
  }

  function confirmDelete(item: DiscoverItem) {
    Alert.alert(
      t("admin.cultureContent.deleteTitle"),
      t("admin.cultureContent.deleteMessage", { title: item.title }),
      [
        { text: t("admin.cultureContent.deleteCancel"), style: "cancel" },
        { text: t("admin.cultureContent.deleteConfirm"), style: "destructive", onPress: () => deleteItem.mutate(item.id) },
      ]
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("admin.cultureContent.title") }} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.bg }} edges={["top"]}>
        <View className="px-5 pt-5 pb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-2xl font-bold" style={{ color: M.text }}>{t("admin.cultureContent.title")}</Text>
            <Pressable
              onPress={() => { setEditTarget(null); setModalMode("create"); }}
              className="flex-row items-center gap-1.5 rounded-2xl px-4 py-2 active:opacity-80"
              style={{ backgroundColor: M.accent }}
            >
              <IconSymbol name="plus" size={13} color={M.parchment} />
              <Text className="text-sm font-bold" style={{ color: M.parchment }}>{t("admin.cultureContent.newButton")}</Text>
            </Pressable>
          </View>
          <Text className="text-sm" style={{ color: M.sub }}>
            {t("admin.cultureContent.subtitle")}
          </Text>
        </View>

        {/* Filter pills */}
        <View className="flex-row px-5 gap-2 mb-3">
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.id;
            const color =
              opt.id === "blog" ? getAccent("sky").solid :
              opt.id === "podcast" ? getAccent("purple").solid :
              opt.id === "film" ? getAccent("orange").solid : M.accent;
            const filterLabel = opt.id === "all"
              ? t("admin.cultureContent.filterAll")
              : t(`admin.cultureContent.typeLabel.${opt.id}` as const);
            return (
              <Pressable
                key={opt.id}
                onPress={() => { setFilter(opt.id); setSearch(""); }}
                className="rounded-xl px-3.5 py-1.5"
                style={active ? { backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}60` } : { backgroundColor: M.card }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: active ? color : M.sub }}
                >
                  {filterLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Search */}
        <View className="px-5 mb-3">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("admin.cultureContent.searchPlaceholder")}
            placeholderTextColor={M.muted}
            style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
            className="rounded-2xl border px-4 py-2.5 text-sm"
          />
        </View>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          {isLoading ? (
            <ActivityIndicator className="my-8" color={M.accent} />
          ) : filtered.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-3xl mb-3">🎬</Text>
              <Text className="text-sm font-semibold" style={{ color: M.sub }}>
                {items.length === 0 ? t("admin.cultureContent.emptyFirst") : t("admin.cultureContent.emptyNoResults")}
              </Text>
            </View>
          ) : (
            filtered.map((item) => {
              const cfg = TYPE_CONFIG[item.type];
              return (
                <View
                  key={item.id}
                  style={{
                    borderRadius: 16,
                    backgroundColor: M.card,
                    borderWidth: 1,
                    borderColor: M.border,
                    borderLeftWidth: 4,
                    borderLeftColor: cfg.color,
                    marginBottom: 10,
                    overflow: "hidden",
                  }}
                >
                  <View style={{ padding: 14 }}>
                    {/* Header row */}
                    <View className="flex-row items-start justify-between gap-2 mb-1">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <View
                            style={{
                              borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2,
                              backgroundColor: `${cfg.color}18`,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1, color: cfg.color }}>
                              {cfg.label.toUpperCase()}
                            </Text>
                          </View>
                          {item.featured && (
                            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: M.warningBg }}>
                              <Text className="text-[9px] font-bold uppercase tracking-wider" style={{ color: M.warning }}>
                                {t("admin.cultureContent.featuredBadge")}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={{ fontSize: 14, fontWeight: "700", color: M.text, lineHeight: 19 }}
                          numberOfLines={2}
                        >
                          {item.coverEmoji} {item.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: M.muted, marginTop: 2 }}>{item.author}</Text>
                        {(item.type === "film" || item.type === "podcast") && item.storyId && (
                          storyTitleById.has(item.storyId) ? (
                            <View className="self-start flex-row items-center rounded-full px-2 py-0.5 mt-2" style={{ backgroundColor: M.pillBg, borderWidth: 1, borderColor: M.border }}>
                              <Text style={{ fontSize: 10, fontWeight: "700", color: M.sub }}>
                                {t("admin.cultureContent.linkedStoryBadge", { title: storyTitleById.get(item.storyId) ?? "" })}
                              </Text>
                            </View>
                          ) : (
                            <View className="self-start flex-row items-center rounded-full px-2 py-0.5 mt-2" style={{ backgroundColor: M.errorBg, borderWidth: 1, borderColor: M.errorBorder }}>
                              <Text style={{ fontSize: 10, fontWeight: "700", color: M.error }}>
                                {t("admin.cultureContent.brokenStoryBadge")}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>

                    {/* Action row */}
                    <View
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 8,
                        marginTop: 12, paddingTop: 10,
                        borderTopWidth: 1, borderTopColor: M.border,
                      }}
                    >
                      <Pressable
                        onPress={() => toggleFeatured.mutate({ id: item.id, featured: !item.featured })}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 5,
                          borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
                          backgroundColor: item.featured ? `${getAccent("amber").solid}18` : `${M.border}`,
                          borderWidth: 1,
                          borderColor: item.featured ? `${getAccent("amber").solid}50` : M.border,
                        }}
                      >
                        <IconSymbol
                          name={item.featured ? "star.fill" : "star"}
                          size={11}
                          color={item.featured ? getAccent("amber").solid : M.muted}
                        />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: item.featured ? getAccent("amber").solid : M.muted }}>
                          {item.featured ? t("admin.cultureContent.unfeatureButton") : t("admin.cultureContent.featureButton")}
                        </Text>
                      </Pressable>

                      <View style={{ flex: 1 }} />

                      <Pressable
                        onPress={() => openEdit(item)}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 5,
                          borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
                          backgroundColor: `${getAccent("sky").solid}18`,
                          borderWidth: 1, borderColor: `${getAccent("sky").solid}40`,
                        }}
                      >
                        <IconSymbol name="pencil" size={11} color={getAccent("sky").solid} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: getAccent("sky").solid }}>{t("admin.cultureContent.editButton")}</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => confirmDelete(item)}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 5,
                          borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
                          backgroundColor: M.errorBg,
                          borderWidth: 1, borderColor: M.errorBorder,
                        }}
                      >
                        <IconSymbol name="trash" size={11} color={M.error} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: M.error }}>{t("admin.cultureContent.deleteButton")}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Create / Edit modal */}
      <Modal
        visible={modalMode !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setModalMode(null); setEditTarget(null); }}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: M.bg }} edges={["top"]}>
          <View
            className="flex-row items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: M.border }}
          >
            <Text className="text-lg font-bold" style={{ color: M.text }}>
              {modalMode === "edit" ? t("admin.cultureContent.modalEditTitle") : t("admin.cultureContent.modalNewTitle")}
            </Text>
            <Pressable
              onPress={() => { setModalMode(null); setEditTarget(null); }}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
              style={{ backgroundColor: M.card }}
            >
              <IconSymbol name="xmark" size={14} color={M.muted} />
            </Pressable>
          </View>

          <ItemForm
            initial={editTarget ?? undefined}
            onSave={(data) => {
              if (modalMode === "edit" && editTarget) {
                updateItem.mutate({ id: editTarget.id, data });
              } else {
                createItem.mutate(data);
              }
            }}
            onCancel={() => { setModalMode(null); setEditTarget(null); }}
            saving={createItem.isPending || updateItem.isPending}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
