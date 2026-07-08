import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput, toLocalizedText } from "@/components/ui/localized-text-input";
import { localize } from "@/lib/localize";
import { COURSE_EMOJI } from "@/lib/journey";
import type { EducatorCourse } from "@/lib/hooks/use-educator-panel";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { CourseType, LocalizedText } from "@/types";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
}

export function CourseEditModal({
  course,
  visible,
  onClose,
  onSave,
  onManageLessons,
  saving,
}: Readonly<{
  course: EducatorCourse;
  visible: boolean;
  onClose: () => void;
  onSave: (fields: CourseEditFields) => void;
  onManageLessons: () => void;
  saving: boolean;
}>) {
  const M = useMuseumTheme();
  const [title, setTitle] = useState<LocalizedText>(() => toLocalizedText(course.title, course.titleFr));
  const [description, setDescription] = useState<LocalizedText>(() => toLocalizedText(course.description, course.descriptionFr));
  const [level, setLevel] = useState(course.level);
  const [order, setOrder] = useState(String(course.order));
  const [courseType, setCourseType] = useState<string | null>(course.courseType ?? null);

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
              onPress={() => canSave && onSave({ title: title.en ?? "", titleFr: title.fr ?? "", description: description.en ?? "", descriptionFr: description.fr ?? "", level, order: Number(order), courseType })}
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
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>Image / Emoji</Text>
            <Text style={{ fontSize: 12, color: M.muted, marginBottom: 8 }}>
              Sets the icon and accent color shown on the course card and map.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              <Pressable
                onPress={() => setCourseType(null)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: courseType === null ? M.accent : M.border, backgroundColor: courseType === null ? `${M.accent}20` : M.card }}
              >
                <Text style={{ fontSize: 15 }}>📍</Text>
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
                    <Text style={{ fontSize: 15 }}>{COURSE_EMOJI[ct.value]}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: active ? M.accent : M.muted }}>{ct.label}</Text>
                  </Pressable>
                );
              })}
            </View>
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
