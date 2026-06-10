import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { apiFetch } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DiscoverContentType, DiscoverItem } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState, useMemo } from "react";
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
  blog:    { color: "#38bdf8", label: "Blog",    icon: "doc.text.fill" },
  podcast: { color: "#a78bfa", label: "Podcast", icon: "headphones" },
  film:    { color: "#fb923c", label: "Film",    icon: "play.circle.fill" },
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
    });
  }

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <View className="mb-4">
        <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
          {label}
        </Text>
        {children}
      </View>
    );
  }

  const inputClass =
    "rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-900 dark:text-white";

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      {/* Type picker */}
      <Field label="Type">
        <View className="flex-row gap-2">
          {(["blog", "podcast", "film"] as DiscoverContentType[]).map((t) => {
            const active = type === t;
            const color = TYPE_CONFIG[t].color;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12,
                  backgroundColor: active ? `${color}18` : undefined,
                  borderWidth: 1, borderColor: active ? `${color}60` : "#2E3245",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: active ? color : M.muted }}>
                  {TYPE_CONFIG[t].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Title">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Article or episode title"
          placeholderTextColor={M.muted}
          maxLength={120}
          className={inputClass}
        />
      </Field>

      <Field label="Description">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Short summary shown on the card"
          placeholderTextColor={M.muted}
          maxLength={300}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className={`${inputClass} min-h-[72px]`}
        />
      </Field>

      <Field label="Author">
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="Author or publication name"
          placeholderTextColor={M.muted}
          maxLength={80}
          className={inputClass}
        />
      </Field>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
            Cover Emoji
          </Text>
          <TextInput
            value={coverEmoji}
            onChangeText={setCoverEmoji}
            placeholder="🎙️"
            placeholderTextColor={M.muted}
            maxLength={4}
            className={inputClass}
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
            Duration (sec)
          </Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="360"
            placeholderTextColor={M.muted}
            keyboardType="numeric"
            maxLength={6}
            className={inputClass}
          />
        </View>
      </View>

      <Field label="Audio URL (podcast)">
        <TextInput
          value={audioUrl}
          onChangeText={setAudioUrl}
          placeholder="https://cdn.beeli.app/podcast/ep-xx.mp3"
          placeholderTextColor={M.muted}
          autoCapitalize="none"
          keyboardType="url"
          className={inputClass}
        />
      </Field>

      <Field label="Web URL">
        <TextInput
          value={contentUrl}
          onChangeText={setContentUrl}
          placeholder="https://beeli.app/blog/..."
          placeholderTextColor={M.muted}
          autoCapitalize="none"
          keyboardType="url"
          className={inputClass}
        />
      </Field>

      {type === "blog" && (
        <Field label="Article Body">
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={"Full article text. Use blank lines to separate paragraphs."}
            placeholderTextColor={M.muted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            className={`${inputClass} min-h-[160px]`}
          />
        </Field>
      )}

      {(type === "podcast" || type === "film") && (
        <Field label="Show Notes / Synopsis">
          <TextInput
            value={showNotes}
            onChangeText={setShowNotes}
            placeholder={"Episode summary, guest bio, or film synopsis."}
            placeholderTextColor={M.muted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            className={`${inputClass} min-h-[160px]`}
          />
        </Field>
      )}

      {/* Featured toggle */}
      <View className="flex-row items-center justify-between rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 mb-6">
        <View>
          <Text className="text-sm font-semibold text-neutral-900 dark:text-white">Featured</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Shown in the hero / featured strip
          </Text>
        </View>
        <Switch
          value={featured}
          onValueChange={setFeatured}
          trackColor={{ false: "#3A3A3A", true: "#C4862A" }}
          thumbColor="#fff"
        />
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={onCancel}
          className="flex-1 items-center rounded-2xl py-3.5 bg-neutral-100 dark:bg-neutral-800 active:opacity-70"
        >
          <Text className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          className={`flex-1 items-center rounded-2xl py-3.5 ${canSave && !saving ? "bg-brand-600 active:opacity-80" : "bg-neutral-200 dark:bg-neutral-700"}`}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className={`text-sm font-bold ${canSave ? "text-white" : "text-neutral-400"}`}>
              {initial ? "Save Changes" : "Publish"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function CultureContentAdminScreen() {
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const qc = useQueryClient();
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
    onError: () => Alert.alert("Error", "Failed to create item."),
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
    onError: () => Alert.alert("Error", "Failed to update item."),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) =>
      authedFetch(`/culture-items/admin/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["culture-items"] });
    },
    onError: () => Alert.alert("Error", "Failed to delete item."),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      authedFetch(`/culture-items/admin/${id}`, { method: "PATCH", body: JSON.stringify({ featured }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["culture-items"] });
    },
    onError: () => Alert.alert("Error", "Failed to update featured status."),
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
      "Delete item",
      `Remove "${item.title}" from the Culture tab?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteItem.mutate(item.id) },
      ]
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Culture Content" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <View className="px-5 pt-5 pb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Culture Content</Text>
            <Pressable
              onPress={() => { setEditTarget(null); setModalMode("create"); }}
              className="flex-row items-center gap-1.5 rounded-2xl bg-brand-600 px-4 py-2 active:opacity-80"
            >
              <IconSymbol name="plus" size={13} color="#fff" />
              <Text className="text-sm font-bold text-white">New</Text>
            </Pressable>
          </View>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage blogs, podcasts, and films on the Culture tab.
          </Text>
        </View>

        {/* Filter pills */}
        <View className="flex-row px-5 gap-2 mb-3">
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.id;
            const color =
              opt.id === "blog" ? "#38bdf8" :
              opt.id === "podcast" ? "#a78bfa" :
              opt.id === "film" ? "#fb923c" : "#C4862A";
            return (
              <Pressable
                key={opt.id}
                onPress={() => { setFilter(opt.id); setSearch(""); }}
                className={`rounded-xl px-3.5 py-1.5 ${active ? "" : "bg-neutral-100 dark:bg-neutral-800"}`}
                style={active ? { backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}60` } : {}}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: active ? color : undefined }}
                >
                  {opt.label}
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
            placeholder="Search by title or author…"
            placeholderTextColor={M.muted}
            className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm text-neutral-900 dark:text-white"
          />
        </View>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          {isLoading ? (
            <ActivityIndicator className="my-8" />
          ) : filtered.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-3xl mb-3">🎬</Text>
              <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                {items.length === 0 ? "No content yet — tap New to add the first item." : "No results."}
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
                            <View className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5">
                              <Text className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Featured
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
                          {item.featured ? "Unfeature" : "Feature"}
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
                        <Text style={{ fontSize: 11, fontWeight: "700", color: getAccent("sky").solid }}>Edit</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => confirmDelete(item)}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 5,
                          borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
                          backgroundColor: "rgba(239,68,68,0.1)",
                          borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
                        }}
                      >
                        <IconSymbol name="trash" size={11} color="#ef4444" />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#ef4444" }}>Delete</Text>
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
        <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
          <View
            className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800"
          >
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              {modalMode === "edit" ? "Edit Item" : "New Culture Item"}
            </Text>
            <Pressable
              onPress={() => { setModalMode(null); setEditTarget(null); }}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 active:opacity-70"
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
