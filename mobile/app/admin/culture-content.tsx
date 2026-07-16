import { ItemForm, TYPE_CONFIG } from "@/components/studio/culture-item-form";
import { ActiveToggle } from "@/components/studio/active-toggle";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { apiFetch } from "@/lib/api";
import { useStoryArcs } from "@/lib/hooks/use-story-arc";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DiscoverContentType, DiscoverItem } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ContentFilter = "all" | DiscoverContentType;

const FILTER_OPTIONS: { id: ContentFilter; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "blog",    label: "Blog" },
  { id: "podcast", label: "Podcast" },
  { id: "film",    label: "Film" },
];

export default function CultureContentAdminScreen() {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
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
    // Admin list: includes inactive cards so the editor can re-activate them.
    queryFn: () => authedFetch("/culture-items/admin"),
    placeholderData: [],
  });

  const { data: storyArcs } = useStoryArcs();
  // Maps a season id → title for the "in season" badge. Films carry their scene
  // graph inline now (no external story link), so only seasons are resolved here.
  const seasonTitleById = useMemo(() => {
    const map = new Map<string, string>();
    (storyArcs ?? []).forEach((a) => map.set(a.id, a.title));
    return map;
  }, [storyArcs]);

  useEffect(() => {
    if (!editId) return;
    const target = items.find((i) => i.id === editId);
    if (target) {
      setEditTarget(target);
      setModalMode("edit");
    }
  }, [editId, items]);

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
              <IconSymbol name="film.stack" size={28} color={M.sub} style={{ marginBottom: 12 }} />
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
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: M.muted, marginTop: 2 }}>{item.author}</Text>
                        {(item.type === "film" || item.type === "podcast") && item.seasonArcId && (
                          seasonTitleById.has(item.seasonArcId) ? (
                            <View className="self-start flex-row items-center rounded-full px-2 py-0.5 mt-2" style={{ backgroundColor: M.pillBg, borderWidth: 1, borderColor: M.border }}>
                              <Text style={{ fontSize: 10, fontWeight: "700", color: M.sub }}>
                                {t("admin.cultureContent.linkedStoryBadge", { title: seasonTitleById.get(item.seasonArcId) ?? "" })}
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

                      <ActiveToggle
                        entityType="culture_items"
                        id={item.id}
                        isActive={item.isActive ?? true}
                        invalidateKeys={[["culture-items"]]}
                        M={M}
                        onToast={{ success: () => {}, error: (title, body) => Alert.alert(title, body ?? "") }}
                      />

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
