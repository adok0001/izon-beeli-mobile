import { ItemForm, TYPE_CONFIG } from "@/components/studio/culture-item-form";
import { ActiveToggle } from "@/components/studio/active-toggle";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { StudioSearchInput } from "@/components/studio/studio-search-input";
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
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.ink }} edges={["top"]}>
        <StudioScreenHeader
          title={t("admin.cultureContent.title")}
          subtitle={t("admin.cultureContent.subtitle")}
          action={{
            label: t("admin.cultureContent.newButton"),
            onPress: () => { setEditTarget(null); setModalMode("create"); },
          }}
        />

        {/* Filter pills */}
        <View className="px-5 mb-3" style={{ backgroundColor: M.bg, paddingTop: 4 }}>
          <StudioFilterPills
            options={FILTER_OPTIONS.map((opt) => ({
              id: opt.id,
              label: opt.id === "all" ? t("admin.cultureContent.filterAll") : t(`admin.cultureContent.typeLabel.${opt.id}` as const),
              color:
                opt.id === "blog" ? getAccent("sky").solid :
                opt.id === "podcast" ? getAccent("purple").solid :
                opt.id === "film" ? getAccent("orange").solid : undefined,
            }))}
            value={filter}
            onChange={(id) => { setFilter(id); setSearch(""); }}
          />
        </View>

        {/* Search */}
        <View className="px-5 mb-3" style={{ backgroundColor: M.bg }}>
          <StudioSearchInput value={search} onChangeText={setSearch} placeholder={t("admin.cultureContent.searchPlaceholder")} />
        </View>

        {/* List */}
        <ScrollView
          style={{ flex: 1, backgroundColor: M.bg }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
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
                <StudioCard key={item.id} accentColor={cfg.color} style={{ marginBottom: 10 }}>
                  <View>
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
                      <ActionPill
                        icon={item.featured ? "star.fill" : "star"}
                        label={item.featured ? t("admin.cultureContent.unfeatureButton") : t("admin.cultureContent.featureButton")}
                        tone="accent"
                        active={item.featured}
                        onPress={() => toggleFeatured.mutate({ id: item.id, featured: !item.featured })}
                      />

                      <ActiveToggle
                        entityType="culture_items"
                        id={item.id}
                        isActive={item.isActive ?? true}
                        invalidateKeys={[["culture-items"]]}
                        M={M}
                        onToast={{ success: () => {}, error: (title, body) => Alert.alert(title, body ?? "") }}
                      />

                      <View style={{ flex: 1 }} />

                      <ActionPill icon="pencil" label={t("admin.cultureContent.editButton")} onPress={() => openEdit(item)} />
                      <ActionPill icon="trash.fill" label={t("admin.cultureContent.deleteButton")} tone="danger" onPress={() => confirmDelete(item)} />
                    </View>
                  </View>
                </StudioCard>
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
