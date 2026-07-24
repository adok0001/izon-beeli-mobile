import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput, toLocalizedText } from "@/components/ui/localized-text-input";
import { localize } from "@/lib/localize";
import { COURSE_ICON } from "@/lib/journey";
import { friendlyError } from "@/lib/api";
import type { EducatorCourse } from "@/lib/hooks/use-educator-panel";
import { useEducatorStoryArcs } from "@/lib/hooks/educator/use-story-arcs";
import { useUploadMediaAsset } from "@/lib/hooks/use-media-assets";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { CourseType, LocalizedText } from "@/types";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

/** The 8 course types the stub generator actually produces (server/src/lib/lesson-stubs.ts
 * COURSE_DEFS) — these drive the course's emoji/accent/scenery (see lib/journey.ts). Other
 * CourseType union members (house, community, work, modern_life, script, colors, grammar)
 * are legacy aliases from before a rename and aren't offered here to avoid duplicate-meaning
 * picks. */
const COURSE_TYPES: { value: CourseType; label: string }[] = [
  { value: "first_words", label: "First Words" },
  { value: "sound_script", label: "Sound & Script" },
  { value: "numbers_trade", label: "Numbers & Trade" },
  { value: "communicative", label: "Communicative" },
  { value: "oral_tradition", label: "Oral Tradition" },
  { value: "songs", label: "Songs" },
  { value: "everyday_life", label: "Everyday Life" },
  { value: "contemporary", label: "Contemporary" },
];

export interface CourseEditFields {
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  level: string;
  order: number;
  courseType: string | null;
  /** Free-form emoji override for the course badge; takes priority over the courseType icon. */
  emoji: string | null;
  /** Custom cover photo; takes priority over the courseType-driven gradient scene. */
  imageUrl: string | null;
  /** Season this course drills (`courses.season_arc_id`); `null` = standalone course. */
  seasonArcId: string | null;
}

/** Chip row: "None" + every season authored in the course's language. */
function SeasonPicker({
  languageId,
  value,
  onChange,
}: Readonly<{ languageId: string; value: string | null; onChange: (v: string | null) => void }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { data: arcs = [] } = useEducatorStoryArcs();

  const languageArcs = useMemo(
    () => arcs.filter((a) => !a.languageId || a.languageId === languageId),
    [arcs, languageId],
  );

  const chipStyle = (active: boolean) => ({
    flexDirection: "row" as const, alignItems: "center" as const, gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
    borderColor: active ? M.accent : M.border,
    backgroundColor: active ? `${M.accent}20` : M.card,
  });

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>
        {t("admin.courses.seasonLabel")}
      </Text>
      <Text style={{ fontSize: 12, color: M.muted, marginBottom: 8 }}>
        {t("admin.courses.seasonHint")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <Pressable onPress={() => onChange(null)} style={chipStyle(value === null)}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: value === null ? M.accent : M.muted }}>
            {t("admin.courses.seasonNone")}
          </Text>
        </Pressable>
        {languageArcs.map((arc) => {
          const active = value === arc.id;
          return (
            <Pressable key={arc.id} onPress={() => onChange(arc.id)} style={chipStyle(active)}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? M.accent : M.muted }}>{arc.title}</Text>
            </Pressable>
          );
        })}
      </View>
      {languageArcs.length === 0 && (
        <Text style={{ fontSize: 12, color: M.muted, marginTop: 6 }}>{t("admin.courses.seasonEmpty")}</Text>
      )}
    </View>
  );
}

/** Cover-photo picker: pick from the device library, upload, preview, remove. */
function CourseImagePicker({
  imageUrl,
  onChange,
}: Readonly<{ imageUrl: string | null; onChange: (url: string | null) => void }>) {
  const M = useMuseumTheme();
  const upload = useUploadMediaAsset();

  async function pick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to set a cover image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const filename = asset.uri.split("/").pop() ?? "image.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    upload.mutate(
      { uri: asset.uri, kind: "image", filename, mimeType },
      {
        onSuccess: (res) => onChange(res.url),
        onError: (err: Error) => Alert.alert("Upload failed", friendlyError(err, err.message)),
      },
    );
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>Cover Image</Text>
      <Text style={{ fontSize: 12, color: M.muted, marginBottom: 8 }}>
        Custom photo shown on the course card and map instead of the theme scene.
      </Text>
      {imageUrl ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={{ uri: imageUrl }} style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: M.card }} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={pick}
              disabled={upload.isPending}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: M.border, backgroundColor: M.card }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: M.text }}>
                {upload.isPending ? "Uploading…" : "Change"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onChange(null)}
              disabled={upload.isPending}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: M.errorBorder, backgroundColor: M.errorBg }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: M.error }}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={pick}
          disabled={upload.isPending}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", borderColor: M.border, backgroundColor: M.card }}
        >
          {upload.isPending ? (
            <ActivityIndicator size="small" color={M.accent} />
          ) : (
            <IconSymbol name="photo" size={16} color={M.muted} />
          )}
          <Text style={{ fontSize: 13, fontWeight: "700", color: M.sub }}>
            {upload.isPending ? "Uploading…" : "Choose from library"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function CourseEditModal({
  course,
  visible,
  onClose,
  onSave,
  onManageLessons,
  onDelete,
  saving,
  deleting,
}: Readonly<{
  course: EducatorCourse;
  visible: boolean;
  onClose: () => void;
  onSave: (fields: CourseEditFields) => void;
  onManageLessons: () => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}>) {
  const M = useMuseumTheme();
  const [title, setTitle] = useState<LocalizedText>(() => toLocalizedText(course.title, course.titleFr));
  const [description, setDescription] = useState<LocalizedText>(() => toLocalizedText(course.description, course.descriptionFr));
  const [level, setLevel] = useState(course.level);
  const [order, setOrder] = useState(String(course.order));
  const [courseType, setCourseType] = useState<string | null>(course.courseType ?? null);
  const [emoji, setEmoji] = useState(course.emoji ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(course.imageUrl ?? null);
  const [seasonArcId, setSeasonArcId] = useState<string | null>(course.seasonArcId ?? null);

  const canSave = !!(title.en?.trim()) && !!(description.en?.trim());

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: M.border }}>
            <Pressable onPress={onClose} style={{ marginRight: 12 }}>
              <IconSymbol name="xmark" size={18} color={M.muted} />
            </Pressable>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "800", color: M.parchment }} numberOfLines={1}>
              Edit: {localize(course.title, "en")}
            </Text>
            <Pressable
              onPress={() => canSave && onSave({ title: title.en ?? "", titleFr: title.fr ?? "", description: description.en ?? "", descriptionFr: description.fr ?? "", level, order: Number(order), courseType, emoji: emoji.trim() || null, imageUrl, seasonArcId })}
              disabled={!canSave || saving}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: canSave ? M.accent : M.border }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: canSave ? "#fff" : M.muted }}>
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>ID</Text>
              <Text style={{ fontSize: 13, color: M.muted, paddingHorizontal: 12, paddingVertical: 9 }}>{course.id}</Text>
            </View>
            <LocalizedTextInput label="Title" value={title} onChange={setTitle} required />
            <LocalizedTextInput label="Description" value={description} onChange={setDescription} multiline required />
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>Level *</Text>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
              {LEVELS.map((l) => (
                <Pressable
                  key={l}
                  onPress={() => setLevel(l)}
                  style={{ flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: level === l ? M.accent : M.border, backgroundColor: level === l ? `${M.accent}20` : M.card }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: level === l ? M.accent : M.muted, textTransform: "capitalize" }}>{l}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>Emoji</Text>
            <Text style={{ fontSize: 12, color: M.muted, marginBottom: 8 }}>
              Any emoji, overrides the theme icon on the course card and map badge.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <View
                style={{
                  width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: M.border, backgroundColor: M.card,
                }}
              >
                <Text style={{ fontSize: 22 }}>{emoji || "＿"}</Text>
              </View>
              <TextInput
                value={emoji}
                onChangeText={setEmoji}
                placeholder="Paste or type an emoji"
                placeholderTextColor={M.muted}
                maxLength={32}
                style={{ flex: 1, borderWidth: 1, borderColor: M.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: M.text, backgroundColor: M.card, fontSize: 16 }}
              />
              {emoji ? (
                <Pressable onPress={() => setEmoji("")} hitSlop={8}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={M.muted} />
                </Pressable>
              ) : null}
            </View>

            <CourseImagePicker imageUrl={imageUrl} onChange={setImageUrl} />

            <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>Theme</Text>
            <Text style={{ fontSize: 12, color: M.muted, marginBottom: 8 }}>
              Sets the fallback icon, accent color, and map scenery when no emoji or cover image is set.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              <Pressable
                onPress={() => setCourseType(null)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: courseType === null ? M.accent : M.border, backgroundColor: courseType === null ? `${M.accent}20` : M.card }}
              >
                <IconSymbol name="mappin" size={15} color={courseType === null ? M.accent : M.muted} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: courseType === null ? M.accent : M.muted }}>None</Text>
              </Pressable>
              {COURSE_TYPES.map((ct) => {
                const active = courseType === ct.value;
                return (
                  <Pressable
                    key={ct.value}
                    onPress={() => setCourseType(ct.value)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: active ? M.accent : M.border, backgroundColor: active ? `${M.accent}20` : M.card }}
                  >
                    <IconSymbol name={COURSE_ICON[ct.value]} size={15} color={active ? M.accent : M.muted} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: active ? M.accent : M.muted }}>{ct.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <SeasonPicker languageId={course.languageId} value={seasonArcId} onChange={setSeasonArcId} />

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>Order</Text>
              <Text style={{ fontSize: 12, color: M.muted, marginBottom: 6 }}>
                Long-press and drag a course on the list to reorder instead of typing a number.
              </Text>
              <TextInput
                value={order}
                onChangeText={setOrder}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: M.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: M.text, backgroundColor: M.card, fontSize: 14 }}
              />
            </View>

            <Pressable
              onPress={onManageLessons}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginTop: 6,
                backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
              }}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>Manage Lessons</Text>
              <IconSymbol name="chevron.right" size={14} color={M.muted} />
            </Pressable>

            <Pressable
              onPress={onDelete}
              disabled={deleting}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginTop: 10,
                backgroundColor: M.errorBg, borderWidth: 1, borderColor: M.errorBorder,
                opacity: deleting ? 0.5 : 1,
              }}
              className="active:opacity-70"
            >
              <IconSymbol name="trash.fill" size={14} color={M.error} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.error }}>
                {deleting ? "Deleting…" : "Delete Course"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export function CourseCard({
  course,
  onPress,
  onToggleActive,
  onDrag,
  dragging,
  toggling,
}: Readonly<{
  course: EducatorCourse;
  onPress: () => void;
  onToggleActive: () => void;
  onDrag: () => void;
  dragging: boolean;
  toggling: boolean;
}>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDrag}
      delayLongPress={200}
      className="rounded-2xl border p-4 active:opacity-70"
      style={{ opacity: dragging ? 0.85 : 1, backgroundColor: M.card, borderColor: M.border }}
    >
      <View className="flex-row items-center">
        {course.imageUrl ? (
          <Image source={{ uri: course.imageUrl }} style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12, backgroundColor: M.bg }} />
        ) : course.emoji ? (
          <View style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12, alignItems: "center", justifyContent: "center", backgroundColor: M.bg }}>
            <Text style={{ fontSize: 20 }}>{course.emoji}</Text>
          </View>
        ) : null}
        <View className="flex-1">
          <Text className="text-base font-semibold" style={{ color: M.text }}>{localize(course.title, "en")}</Text>
          {course.description ? (
            <Text className="mt-0.5 text-sm" style={{ color: M.sub }} numberOfLines={2}>
              {localize(course.description, "en")}
            </Text>
          ) : null}
          {course.courseType ? (
            <View className="mt-2 self-start rounded-full px-2 py-0.5" style={{ backgroundColor: M.pillBg }}>
              <Text className="text-xs" style={{ color: M.sub }}>{course.courseType}</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          onPressIn={onDrag}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="ml-3 p-1"
        >
          <IconSymbol name="line.3.horizontal" size={16} color={M.muted} />
        </Pressable>
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t pt-3" style={{ borderColor: M.border }}>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onToggleActive(); }}
          disabled={toggling}
          className="flex-row items-center gap-1.5 rounded-full px-3 py-1"
          style={{ backgroundColor: course.isActive !== false ? M.successBg : M.pillBg }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol
            name={course.isActive !== false ? "eye" : "eye.slash"}
            size={12}
            color={course.isActive !== false ? M.success : M.muted}
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: course.isActive !== false ? M.success : M.sub }}
          >
            {toggling ? "…" : course.isActive !== false ? "Active" : "Inactive"}
          </Text>
        </Pressable>
        <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: M.pillBg }}>
          <IconSymbol name="pencil" size={12} color={M.accent} />
          <Text className="text-xs font-semibold" style={{ color: M.text }}>Edit</Text>
        </View>
      </View>
    </Pressable>
  );
}
