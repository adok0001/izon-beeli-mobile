import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput, toLocalizedText } from "@/components/ui/localized-text-input";
import { getAccent } from "@/constants/accent-colors";
import { localize } from "@/lib/localize";
import type { EducatorCourse } from "@/lib/hooks/use-educator-panel";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { LocalizedText } from "@/types";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export interface CourseEditFields {
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  level: string;
  order: number;
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
              onPress={() => canSave && onSave({ title: title.en ?? "", titleFr: title.fr ?? "", description: description.en ?? "", descriptionFr: description.fr ?? "", level, order: Number(order) })}
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
      className="rounded-2xl border border-neutral-200 bg-white p-4 active:opacity-70 dark:border-neutral-700 dark:bg-neutral-900"
      style={{ opacity: dragging ? 0.85 : 1 }}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">{localize(course.title, "en")}</Text>
          {course.description ? (
            <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
              {localize(course.description, "en")}
            </Text>
          ) : null}
          {course.courseType ? (
            <View className="mt-2 self-start rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">{course.courseType}</Text>
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
      <View className="mt-3 flex-row items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-700/60">
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onToggleActive(); }}
          disabled={toggling}
          className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${
            course.isActive !== false
              ? "bg-emerald-50 dark:bg-emerald-950/30"
              : "bg-neutral-100 dark:bg-neutral-800"
          }`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol
            name={course.isActive !== false ? "eye" : "eye.slash"}
            size={12}
            color={course.isActive !== false ? getAccent("teal").solid : M.muted}
          />
          <Text
            className={`text-xs font-semibold ${
              course.isActive !== false ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            {toggling ? "…" : course.isActive !== false ? "Active" : "Inactive"}
          </Text>
        </Pressable>
        <View className="flex-row items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
          <IconSymbol name="pencil" size={12} color={M.accent} />
          <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Edit</Text>
        </View>
      </View>
    </Pressable>
  );
}
