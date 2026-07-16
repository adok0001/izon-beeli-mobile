"use client";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerModal } from "@/components/language-picker";
import { LocalizedTextInput, toLocalizedText } from "@/components/ui/localized-text-input";
import { getAccent } from "@/constants/accent-colors";
import type { LocalizedText } from "@/types";
import { apiFetch, friendlyError } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AdminCourse {
  id: string;
  languageId: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  level: string;
  lessonsCount: number;
  order: number;
}

interface AdminLesson {
  id: string;
  courseId: string;
  title: string;
  titleFr?: string | null;
  description: string;
  audioUrl?: string | null;
  duration?: number | null;
  order: number;
}

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "url";
  editable?: boolean;
}) {
  const M = useMuseumTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={M.muted}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        numberOfLines={multiline ? 3 : 1}
        style={{
          borderWidth: 1,
          borderColor: M.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 9,
          color: M.text,
          backgroundColor: editable ? M.card : M.ink,
          fontSize: 14,
          textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? 72 : undefined,
          opacity: editable ? 1 : 0.5,
        }}
      />
    </View>
  );
}

function LevelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
      {LEVELS.map((l) => (
        <Pressable
          key={l}
          onPress={() => onChange(l)}
          style={{
            flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center",
            borderWidth: 1,
            borderColor: value === l ? M.accent : M.border,
            backgroundColor: value === l ? `${M.accent}20` : M.card,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: value === l ? M.accent : M.muted, textTransform: "capitalize" }}>
            {l}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Course Form Modal ─────────────────────────────────────────────────────────

function CourseFormModal({
  visible,
  initial,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  initial?: Partial<AdminCourse>;
  onClose: () => void;
  onSave: (data: Omit<AdminCourse, "lessonsCount">) => void;
  saving: boolean;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const isNew = !initial?.id;

  const [id, setId] = useState(initial?.id ?? "");
  const [languageId, setLanguageId] = useState(initial?.languageId ?? currentUser?.selectedLanguageId ?? "izon");
  const [title, setTitle] = useState<LocalizedText>(() => toLocalizedText(initial?.title, initial?.titleFr));
  const [description, setDescription] = useState<LocalizedText>(() => toLocalizedText(initial?.description, initial?.descriptionFr));
  const [level, setLevel] = useState(initial?.level ?? "beginner");
  const [order, setOrder] = useState(String(initial?.order ?? "0"));
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  const canSave = id.trim() && !!(title.en?.trim()) && !!(description.en?.trim());

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: M.border }}>
            <Pressable onPress={onClose} style={{ marginRight: 12 }}>
              <IconSymbol name="xmark" size={18} color={M.muted} />
            </Pressable>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "800", color: M.parchment }}>
              {isNew ? t("admin.courses.newCourse") : t("admin.courses.editing") + ": " + (initial?.title ?? "")}
            </Text>
            <Pressable
              onPress={() => canSave && onSave({ id, languageId, title: title.en ?? "", titleFr: title.fr || null, description: description.en ?? "", descriptionFr: description.fr || null, level, order: Number(order) })}
              disabled={!canSave || saving}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: canSave ? M.accent : M.border }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: canSave ? "#fff" : M.muted }}>
                {saving ? t("admin.courses.saving") : t("admin.courses.save")}
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Field label={t("admin.courses.formId") + " *"} value={id} onChangeText={setId} placeholder="e.g. izon-beginner-1" editable={isNew} />
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>
                {t("admin.courses.formLanguage")} *
              </Text>
              <Pressable
                onPress={() => setLangPickerVisible(true)}
                style={{ borderWidth: 1, borderColor: M.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: M.card, flexDirection: "row", alignItems: "center" }}
              >
                <Text style={{ flex: 1, color: languageId ? M.text : M.muted, fontSize: 14 }}>{languageId || "Select language"}</Text>
                <IconSymbol name="chevron.down" size={14} color={M.muted} />
              </Pressable>
            </View>
            <LocalizedTextInput label={t("admin.courses.formTitle")} value={title} onChange={setTitle} required />
            <LocalizedTextInput label={t("admin.courses.formDesc")} value={description} onChange={setDescription} multiline required />
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 4 }}>{t("admin.courses.formLevel")} *</Text>
            <LevelPicker value={level} onChange={setLevel} />
            <Field label={t("admin.courses.formOrder")} value={order} onChangeText={setOrder} keyboardType="numeric" />
          </ScrollView>
        </KeyboardAvoidingView>
        <LanguagePickerModal
          visible={langPickerVisible}
          selectedId={languageId}
          onClose={() => setLangPickerVisible(false)}
          onSelect={(id) => { setLanguageId(id); setLangPickerVisible(false); }}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Lesson Form Modal ─────────────────────────────────────────────────────────

function LessonFormModal({
  visible,
  courseId,
  initial,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  courseId: string;
  initial?: Partial<AdminLesson>;
  onClose: () => void;
  onSave: (data: Omit<AdminLesson, "courseId">) => void;
  saving: boolean;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const isNew = !initial?.id;

  const [id, setId] = useState(initial?.id ?? "");
  const [title, setTitle] = useState<LocalizedText>(() => toLocalizedText(initial?.title, initial?.titleFr));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl ?? "");
  const [duration, setDuration] = useState(String(initial?.duration ?? ""));
  const [order, setOrder] = useState(String(initial?.order ?? "0"));

  const canSave = id.trim() && !!(title.en?.trim()) && description.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: M.border }}>
            <Pressable onPress={onClose} style={{ marginRight: 12 }}>
              <IconSymbol name="xmark" size={18} color={M.muted} />
            </Pressable>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "800", color: M.parchment }}>
              {isNew ? t("admin.courses.addLesson") : (title.en ?? "")}
            </Text>
            <Pressable
              onPress={() => canSave && onSave({ id, title: title.en ?? "", titleFr: title.fr || null, description, audioUrl: audioUrl || null, duration: duration ? Number(duration) : null, order: Number(order) })}
              disabled={!canSave || saving}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: canSave ? M.accent : M.border }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: canSave ? "#fff" : M.muted }}>
                {saving ? t("admin.courses.saving") : t("admin.courses.saveLesson")}
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Field label={t("admin.courses.formLessonId") + " *"} value={id} onChangeText={setId} placeholder={`${courseId}-lesson-1`} editable={isNew} />
            <LocalizedTextInput label={t("admin.courses.formTitle")} value={title} onChange={setTitle} required />
            <Field label={t("admin.courses.formDescEn") + " *"} value={description} onChangeText={setDescription} multiline />
            <Field label={t("admin.courses.formAudioUrl")} value={audioUrl} onChangeText={setAudioUrl} placeholder="https://…/audio.mp3" keyboardType="url" />
            <Field label={t("admin.courses.formDuration") + " (s)"} value={duration} onChangeText={setDuration} keyboardType="numeric" />
            <Field label={t("admin.courses.formOrder")} value={order} onChangeText={setOrder} keyboardType="numeric" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Lesson Row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson, onEdit, onDelete }: { lesson: AdminLesson; onEdit: () => void; onDelete: () => void }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: M.card, borderRadius: 10, borderWidth: 1, borderColor: M.border, marginBottom: 6 }}>
      <IconSymbol name="book" size={14} color={M.muted} style={{ marginRight: 8 }} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: M.text }} numberOfLines={1}>{localize(lesson.title, "en")}</Text>
      {lesson.duration ? (
        <Text style={{ fontSize: 11, color: M.muted, marginRight: 8 }}>{Math.round(lesson.duration / 60)}m</Text>
      ) : null}
      <Pressable onPress={onEdit} style={{ padding: 4, marginRight: 2 }}>
        <IconSymbol name="pencil" size={14} color={M.accent} />
      </Pressable>
      <Pressable onPress={onDelete} style={{ padding: 4 }}>
        <IconSymbol name="trash" size={14} color={getAccent("rose").solid} />
      </Pressable>
    </View>
  );
}

// ── Lessons Panel (inline) ────────────────────────────────────────────────────

function LessonsPanel({ courseId, token }: { courseId: string; token: string | null }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [addingLesson, setAddingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);

  const { data: lessons = [], isLoading } = useQuery<AdminLesson[]>({
    queryKey: ["admin", "lessons", courseId],
    queryFn: () => apiFetch<AdminLesson[]>(`/admin/lessons?courseId=${courseId}`, { token: token ?? undefined }),
    enabled: !!token,
  });

  const createLesson = useMutation({
    mutationFn: (data: AdminLesson) =>
      apiFetch(`/admin/lessons`, { method: "POST", body: JSON.stringify(data), token: token ?? undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "lessons", courseId] });
      void qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      setAddingLesson(false);
    },
    onError: (e) => Alert.alert(t("common.error"), friendlyError(e)),
  });

  const updateLesson = useMutation({
    mutationFn: ({ id, ...data }: Partial<AdminLesson> & { id: string }) =>
      apiFetch(`/admin/lessons/${id}`, { method: "PATCH", body: JSON.stringify(data), token: token ?? undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "lessons", courseId] });
      setEditingLesson(null);
    },
    onError: (e) => Alert.alert(t("common.error"), friendlyError(e)),
  });

  const deleteLesson = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/lessons/${id}`, { method: "DELETE", token: token ?? undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "lessons", courseId] });
      void qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (e) => Alert.alert(t("common.error"), friendlyError(e)),
  });

  return (
    <View style={{ marginTop: 8, paddingLeft: 8, borderLeftWidth: 2, borderColor: M.border }}>
      {isLoading && (
        <View style={{ height: 36, backgroundColor: M.border, borderRadius: 8 }} />
      )}
      {lessons.map((lesson) => (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          onEdit={() => setEditingLesson(lesson)}
          onDelete={() =>
            Alert.alert("Confirm", `Delete lesson "${localize(lesson.title, "en")}"?`, [
              { text: t("common.cancel"), style: "cancel" },
              { text: t("common.delete"), style: "destructive", onPress: () => deleteLesson.mutate(lesson.id) },
            ])
          }
        />
      ))}
      <Pressable
        onPress={() => setAddingLesson(true)}
        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 6 }}
      >
        <IconSymbol name="plus.circle" size={14} color={M.accent} />
        <Text style={{ fontSize: 12, color: M.accent, fontWeight: "600" }}>{t("admin.courses.addLesson")}</Text>
      </Pressable>
      <LessonFormModal
        visible={addingLesson}
        courseId={courseId}
        saving={createLesson.isPending}
        onClose={() => setAddingLesson(false)}
        onSave={(data) => createLesson.mutate({ courseId, ...data })}
      />
      {editingLesson && (
        <LessonFormModal
          visible
          courseId={courseId}
          initial={editingLesson}
          saving={updateLesson.isPending}
          onClose={() => setEditingLesson(null)}
          onSave={(data) => updateLesson.mutate({ ...data, id: editingLesson.id })}
        />
      )}
    </View>
  );
}

// ── Course Card ───────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#16a34a",
  intermediate: "#d97706",
  advanced: "#dc2626",
};

function CourseCard({
  course,
  token,
  onEdit,
  onDelete,
}: {
  course: AdminCourse;
  token: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const levelColor = LEVEL_COLORS[course.level] ?? M.muted;

  return (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, marginBottom: 10, overflow: "hidden" }}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 10 }}
        className="active:opacity-80"
      >
        <IconSymbol name={expanded ? "chevron.down" : "chevron.right"} size={12} color={M.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>{localize(course.title, "en")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: `${levelColor}20` }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: levelColor, textTransform: "capitalize" }}>{course.level}</Text>
            </View>
            <Text style={{ fontSize: 11, color: M.muted }}>{course.languageId}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <IconSymbol name="list.bullet" size={12} color={M.muted} />
          <Text style={{ fontSize: 11, color: M.muted }}>{course.lessonsCount}</Text>
        </View>
        <Pressable onPress={onEdit} style={{ padding: 6 }}>
          <IconSymbol name="pencil" size={14} color={M.accent} />
        </Pressable>
        <Pressable onPress={onDelete} style={{ padding: 6 }}>
          <IconSymbol name="trash" size={14} color={getAccent("rose").solid} />
        </Pressable>
      </Pressable>
      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <LessonsPanel courseId={course.id} token={token} />
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminCoursesScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const [token, setToken] = useState<string | null>(null);
  const [filterLang, setFilterLang] = useState(currentUser?.selectedLanguageId ?? "");
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);

  const { data: courses = [], isLoading } = useQuery<AdminCourse[]>({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const t = await getToken();
      setToken(t);
      return apiFetch<AdminCourse[]>("/admin/courses", { token: t ?? undefined });
    },
    staleTime: 15_000,
  });

  const createCourse = useMutation({
    mutationFn: (data: Omit<AdminCourse, "lessonsCount">) =>
      apiFetch("/admin/courses", { method: "POST", body: JSON.stringify(data), token: token ?? undefined }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "courses"] }); setAddingCourse(false); },
    onError: (e) => Alert.alert(t("common.error"), friendlyError(e)),
  });

  const updateCourse = useMutation({
    mutationFn: ({ id, ...data }: Partial<AdminCourse> & { id: string }) =>
      apiFetch(`/admin/courses/${id}`, { method: "PATCH", body: JSON.stringify(data), token: token ?? undefined }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "courses"] }); setEditingCourse(null); },
    onError: (e) => Alert.alert(t("common.error"), friendlyError(e)),
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/courses/${id}`, { method: "DELETE", token: token ?? undefined }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "courses"] }); },
    onError: (e) => Alert.alert(t("common.error"), friendlyError(e)),
  });

  const filtered = !filterLang ? courses : courses.filter((c) => c.languageId === filterLang);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: M.border }}>
          <Text style={{ fontSize: 26, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
            {t("admin.courses.title")}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 12, color: M.textDim }}>
            {t("admin.courses.totalCount", { count: courses.length })}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
            <Pressable
              onPress={() => setLangPickerVisible(true)}
              style={{ flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: M.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: M.card }}
            >
              <Text style={{ flex: 1, fontSize: 13, color: filterLang ? M.text : M.muted }}>{filterLang || "All languages"}</Text>
              <IconSymbol name="chevron.down" size={12} color={M.muted} />
            </Pressable>
            <Pressable
              onPress={() => setAddingCourse(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: M.accent }}
            >
              <IconSymbol name="plus" size={14} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{t("admin.courses.newCourse")}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && Array.from({ length: 3 }, (_, i) => (
            <View key={i} style={{ height: 60, borderRadius: 14, backgroundColor: M.card, marginBottom: 10 }} />
          ))}
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              token={token}
              onEdit={() => setEditingCourse(course)}
              onDelete={() =>
                Alert.alert("Confirm", `Delete course "${localize(course.title, "en")}" and all its lessons?`, [
                  { text: t("common.cancel"), style: "cancel" },
                  { text: t("common.delete"), style: "destructive", onPress: () => deleteCourse.mutate(course.id) },
                ])
              }
            />
          ))}
          {!isLoading && filtered.length === 0 && (
            <View style={{ alignItems: "center", paddingTop: 48 }}>
              <IconSymbol name="book.closed" size={32} color={M.muted} />
              <Text style={{ marginTop: 8, fontSize: 14, color: M.muted }}>{t("admin.courses.noCourses")}</Text>
            </View>
          )}
        </ScrollView>

        <LanguagePickerModal
          visible={langPickerVisible}
          selectedId={filterLang}
          onClose={() => setLangPickerVisible(false)}
          onSelect={(id) => { setFilterLang(id); setLangPickerVisible(false); }}
        />

        <CourseFormModal
          visible={addingCourse}
          saving={createCourse.isPending}
          onClose={() => setAddingCourse(false)}
          onSave={(data) => createCourse.mutate(data)}
        />

        {editingCourse && (
          <CourseFormModal
            visible
            initial={editingCourse}
            saving={updateCourse.isPending}
            onClose={() => setEditingCourse(null)}
            onSave={(data) => updateCourse.mutate({ ...data, id: editingCourse.id })}
          />
        )}
      </SafeAreaView>
    </>
  );
}
