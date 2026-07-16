import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useStoryArcs } from "@/lib/hooks/use-story-arc";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DiscoverContentType, DiscoverItem } from "@/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

export const TYPE_CONFIG: Record<DiscoverContentType, { color: string; label: string; icon: string }> = {
  blog:    { color: getAccent("sky").solid,    label: "Blog",    icon: "doc.text.fill" },
  podcast: { color: getAccent("purple").solid, label: "Podcast", icon: "headphones" },
  film:    { color: getAccent("orange").solid, label: "Film",    icon: "play.circle.fill" },
};

export const EMPTY_FORM: Omit<DiscoverItem, "id"> = {
  type: "blog",
  title: "",
  description: "",
  author: "",
  publishedAt: new Date().toISOString(),
  duration: 360,
  coverGradient: ["#0F2A4A", "#0D0F1A"],
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

/** One selectable row in the story / season pickers. */
function OptionRow({
  title,
  subtitle,
  selected,
  onPress,
}: Readonly<{ title: string; subtitle?: string; selected: boolean; onPress: () => void }>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl border px-4 py-3 mb-2"
      style={selected ? { backgroundColor: M.accentGlow, borderColor: M.accentBorder } : { backgroundColor: M.card, borderColor: M.border }}
    >
      <View className="flex-1 mr-3">
        <Text className="text-sm font-semibold" style={{ color: M.text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs mt-0.5" style={{ color: M.sub }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected && <IconSymbol name="checkmark.circle.fill" size={18} color={M.accent} />}
    </Pressable>
  );
}

export function ItemForm({ initial, onSave, onCancel, saving }: Readonly<ItemFormProps>) {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const base = initial ?? ({ id: "", ...EMPTY_FORM } as DiscoverItem);
  const [type, setType] = useState<DiscoverContentType>(base.type);
  const [title, setTitle] = useState(base.title);
  const [description, setDescription] = useState(base.description);
  const [author, setAuthor] = useState(base.author);
  const [duration, setDuration] = useState(String(base.duration));
  const [featured, setFeatured] = useState(base.featured ?? false);
  const [audioUrl, setAudioUrl] = useState(base.audioUrl ?? "");
  const [contentUrl, setContentUrl] = useState(base.contentUrl ?? "");
  const [body, setBody] = useState(base.body ?? "");
  const [showNotes, setShowNotes] = useState(base.showNotes ?? "");
  const [seasonArcId, setSeasonArcId] = useState(base.seasonArcId ?? "");

  const { data: storyArcs, isLoading: arcsLoading } = useStoryArcs();

  const canSave = title.trim() && description.trim() && author.trim();

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
      featured,
      audioUrl: audioUrl.trim() || undefined,
      contentUrl: contentUrl.trim() || undefined,
      body: body.trim() || undefined,
      showNotes: showNotes.trim() || undefined,
      seasonArcId: seasonArcId.trim() || undefined,
    });
  }

  function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
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
  const linksLoading = arcsLoading;

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
        <>
          {/* Which season the card BELONGS TO (podcasts OPEN this season; films
              are SET IN its world). Films author their scene graph in the
              language-scoped educator Films flow, not here. */}
          <Field label={t("admin.discoverStories.seasonLinkLabel")}>
            <Text className="text-xs mb-2" style={{ color: M.sub }}>
              {t("admin.discoverStories.seasonLinkHint")}
            </Text>
            {linksLoading ? (
              <ActivityIndicator color={M.accent} style={{ marginVertical: 8 }} />
            ) : (
              <>
                <OptionRow
                  title={t("admin.discoverStories.seasonLinkNone")}
                  selected={!seasonArcId}
                  onPress={() => setSeasonArcId("")}
                />
                {(storyArcs ?? []).map((arc) => (
                  <OptionRow
                    key={arc.id}
                    title={arc.title}
                    subtitle={`${t("admin.discoverStories.storyGroupArc")} · ${arc.id}`}
                    selected={seasonArcId === arc.id}
                    onPress={() => setSeasonArcId(arc.id)}
                  />
                ))}
                {(storyArcs ?? []).length === 0 && (
                  <Text className="text-xs" style={{ color: M.muted }}>
                    {t("admin.discoverStories.seasonLinkEmpty")}
                  </Text>
                )}
              </>
            )}
          </Field>
        </>
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
