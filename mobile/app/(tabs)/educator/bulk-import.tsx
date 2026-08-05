import { NotificationBanner } from "@/components/notifications/notification-banner";
import { ImportResultCard } from "@/components/studio/import-result-card";
import { ShareFileButton } from "@/components/studio/share-file-button";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioDropdown } from "@/components/studio/studio-dropdown";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { GhostButton, PrimaryButton } from "@/components/studio/studio-form";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { friendlyError } from "@/lib/api";
import { CONTENT_EXPORT_GUIDE, CONTENT_EXPORT_TYPES, DEFAULT_CONTENT_EXPORT_TYPE, contentExportFilename } from "@/lib/content-export";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "@/lib/dictionary";
import { EDIT_FIELD_GUIDE, parseEditCsv } from "@/lib/edit-import";
import { useContentExport } from "@/lib/hooks/educator/use-content-export";
import { useEducatorCourses } from "@/lib/hooks/educator/use-courses";
import { useDictionaryEdit, useDictionaryExport } from "@/lib/hooks/educator/use-dictionary-edit";
import { useLessonExport } from "@/lib/hooks/educator/use-lesson-export";
import { useLessonImport } from "@/lib/hooks/educator/use-lesson-import";
import { useEducatorLessons } from "@/lib/hooks/educator/use-lessons";
import { type ImportResult } from "@/lib/import-result";
import { useUnifiedImport } from "@/lib/hooks/educator/use-unified-import";
import { useToast } from "@/lib/hooks/use-toast";
import { LESSON_CHECK_GUIDE, LESSON_LINE_GUIDE, LESSON_META_GUIDE, LESSON_TEMPLATE_CSV, lessonExportFilename, parseLessonFiles } from "@/lib/lesson-import";
import { localize } from "@/lib/localize";
import { getLanguageName } from "@/lib/mock-data";
import { UNIFIED_FIELD_GUIDE, UNIFIED_TEMPLATE_CSV, parseUnifiedCsv, type UnifiedRowType } from "@/lib/unified-import";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguages } from "@/store/languages-store";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "content" | "lessons" | "edit";

interface ModeMeta {
  label: string;
  unit: string;
  /** Verb on the confirm button — inserts import, edits apply. */
  confirmLabel: string;
  title: string;
  blurb: string;
  buttonLabel: string;
  /** True when the picker accepts several files (lessons; a file may hold several). */
  multiple: boolean;
  emptyFile: { title: string; body: string };
  /** Omitted in edit mode: the sheet comes from an export, not from a blank template. */
  sample?: { fileName: string; csv: string };
  guide: { label: string; uses: string }[];
  /** Footer note explaining what happens to the uploaded rows, per role. */
  footer: (isAdmin: boolean) => string;
}

/**
 * Everything that differs between the three modes, as data. The screen reads
 * `meta.*` instead of branching on `mode` at a dozen render sites — the shape
 * that made adding a third mode a matter of one more entry here.
 */
const MODE_META: Record<Mode, ModeMeta> = {
  content: {
    label: "Content",
    unit: "rows",
    confirmLabel: "Import",
    title: "How the sheet works",
    blurb:
      "Each row’s type column decides where it lands. Fill only the columns that type uses. A row carrying an id — everything an export hands back — updates that row; a row without one is added. To correct words without any chance of creating one, use Edit.",
    buttonLabel: "Choose CSV file",
    multiple: false,
    emptyFile: { title: "Nothing to import", body: "No rows found — every row needs a `type`." },
    sample: { fileName: "beeli-content-template.csv", csv: UNIFIED_TEMPLATE_CSV },
    guide: UNIFIED_FIELD_GUIDE.map((g) => ({ label: g.type, uses: g.uses })),
    footer: (isAdmin) => isAdmin
      ? "As an admin, imported rows publish live."
      : "Imported rows are staged for review before going live.",
  },
  lessons: {
    label: "Lessons",
    unit: "lessons",
    confirmLabel: "Import",
    title: "How the sheet works",
    blurb:
      "A lesson is a metadata block, a --- line, the transcript grid, and optionally another --- line plus checks. One file may hold several lessons with a === line between them — which is exactly what the export above hands back, so you can upload it straight back.",
    buttonLabel: "Choose CSV file(s)",
    multiple: true,
    emptyFile: { title: "Nothing to import", body: "No lesson found in that file." },
    sample: { fileName: "beeli-lesson-template.csv", csv: LESSON_TEMPLATE_CSV },
    guide: [
      ...LESSON_META_GUIDE.map((g) => ({ label: g.key, uses: g.uses })),
      ...LESSON_LINE_GUIDE.map((g) => ({ label: g.column, uses: `line — ${g.uses}` })),
      ...LESSON_CHECK_GUIDE.map((g) => ({ label: g.column, uses: `check — ${g.uses}` })),
    ],
    footer: (isAdmin) => isAdmin
      ? "As an admin, imported lessons publish live."
      : "Imported lessons are staged for review before going live.",
  },
  edit: {
    label: "Edit",
    unit: "words",
    confirmLabel: "Apply",
    title: "2 · How editing works",
    blurb:
      "Export the words you want to fix, change them in a spreadsheet, and upload the same sheet back. Rows are matched on id — an id that isn’t already in this language is an error, so this mode can never create a word by accident.",
    buttonLabel: "Upload edited CSV",
    multiple: false,
    emptyFile: { title: "Nothing to change", body: "No rows found — every row needs its `id` column." },
    guide: EDIT_FIELD_GUIDE,
    footer: (isAdmin) => isAdmin
      ? "As an admin, your corrections stay live — a published word keeps its status."
      : "Editing a published word sends it back for review, so it leaves the app until an admin approves it.",
  },
};

export default function BulkImportScreen() {
  const M = useMuseumTheme();
  const { user: currentUser } = useStudioAccess();
  const languages = useLanguages();
  const unifiedImport = useUnifiedImport();
  const lessonImport = useLessonImport();
  const dictionaryEdit = useDictionaryEdit();
  const dictionaryExport = useDictionaryExport();
  const contentExport = useContentExport();
  const lessonExport = useLessonExport();
  const { data: allCourses } = useEducatorCourses();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  // Deep-link from a course's lesson list (or the dictionary screen) preselects
  // a mode plus that mode's scoping param — course for lessons, category for edit.
  const params = useLocalSearchParams<{ mode?: string; courseId?: string; languageId?: string; category?: string }>();
  const [mode, setMode] = useState<Mode>(
    params.mode && params.mode in MODE_META ? (params.mode as Mode) : "content",
  );
  const meta = MODE_META[mode];

  const allowedLanguages = useMemo(() => {
    if (!currentUser) return [] as string[];
    return currentUser.isAdmin ? languages.map((l) => l.id) : currentUser.reviewerLanguages;
  }, [currentUser, languages]);

  const [languageId, setLanguageId] = useState(params.languageId ?? "");
  const activeLanguageId = languageId || allowedLanguages[0] || currentUser?.selectedLanguageId || "izon";

  const courses = useMemo(
    () => (allCourses ?? []).filter((c) => c.languageId === activeLanguageId),
    [allCourses, activeLanguageId],
  );
  const [courseId, setCourseId] = useState(params.courseId ?? "");
  const activeCourseId = courseId || courses[0]?.id || "";

  const [fileName, setFileName] = useState<string | null>(null);
  const [entries, setEntries] = useState<unknown[] | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const [exportCategory, setExportCategory] = useState(params.category ?? "");
  const [exportType, setExportType] = useState<UnifiedRowType>(DEFAULT_CONTENT_EXPORT_TYPE);

  // Which lessons the export covers. Empty means the whole Movement — the common
  // case, and the one that needs no tapping.
  const [pickedLessons, setPickedLessons] = useState<Set<string>>(new Set());
  const { data: allLessons } = useEducatorLessons(mode === "lessons");
  const courseLessons = useMemo(
    () => (allLessons ?? []).filter((l) => l.courseId === activeCourseId),
    [allLessons, activeCourseId],
  );
  const toggleLesson = (id: string) =>
    setPickedLessons((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const reset = () => { setFileName(null); setEntries(null); setResult(null); };
  const busy = unifiedImport.isPending || lessonImport.isPending || dictionaryEdit.isPending;

  const submit = (payload: unknown[], dryRun: boolean) => {
    const rows = payload as Record<string, string>[];
    switch (mode) {
      case "content":
        return unifiedImport.mutateAsync({ languageId: activeLanguageId, entries: rows, dryRun });
      case "edit":
        return dictionaryEdit.mutateAsync({ languageId: activeLanguageId, entries: rows, dryRun });
      case "lessons":
        return lessonImport.mutateAsync({ languageId: activeLanguageId, courseId: activeCourseId, entries: payload, dryRun });
    }
  };

  /** Parse the picked file(s) into the payload this mode submits. */
  const parseAssets = async (assets: { uri: string; name: string }[]): Promise<unknown[]> => {
    if (mode === "lessons") {
      // Several files, and now several lessons per file — an export of a whole
      // Movement comes back as one sheet with `===` between its lessons.
      const files = await Promise.all(assets.map((a) => new File(a.uri).text().then(parseLessonFiles)));
      return files.flat();
    }
    const text = await new File(assets[0].uri).text();
    return mode === "edit" ? parseEditCsv(text) : parseUnifiedCsv(text);
  };

  const pickFile = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel", "*/*"],
        copyToCacheDirectory: true,
        multiple: meta.multiple,
      });
      const assets = picked.canceled ? [] : picked.assets;
      if (assets.length === 0) return;
      reset();

      const payload = await parseAssets(assets);
      if (payload.length === 0) {
        toastError(meta.emptyFile.title, meta.emptyFile.body);
        return;
      }
      setFileName(assets.length > 1 ? `${assets.length} files` : assets[0].name);
      setEntries(payload);
      setResult(await submit(payload, true));
    } catch (err) {
      toastError("Couldn’t read file", friendlyError(err));
    }
  };

  /**
   * Both exports are capped at what the same role may upload back, so a sheet
   * can come down short. Say so — a silently truncated export looks like a
   * complete one, and re-uploading it looks like the rest was deleted.
   */
  const warnIfTruncated = (
    data: { truncated: boolean; totalCount: number; rowCount: number; cap: number },
    unit: string,
    narrow: string,
  ) => {
    if (!data.truncated) return;
    toastError(
      "Export cut short",
      `${data.totalCount} ${unit} match — you can upload ${data.cap} at a time, so only the first ${data.rowCount} are in this file.${narrow}`,
    );
  };

  const exportEditCsv = async () => {
    const data = await dictionaryExport.mutateAsync({
      languageId: activeLanguageId,
      category: exportCategory || undefined,
    });
    warnIfTruncated(data, "words", " Pick a category to narrow it.");
    return data.csv;
  };

  const exportContentCsv = async () => {
    const data = await contentExport.mutateAsync({ languageId: activeLanguageId, type: exportType });
    warnIfTruncated(data, "rows", "");
    return data.csv;
  };

  const exportLessonsCsv = async () => {
    const data = await lessonExport.mutateAsync({
      languageId: activeLanguageId,
      courseId: activeCourseId,
      ids: [...pickedLessons],
    });
    warnIfTruncated(
      { ...data, rowCount: data.lessonCount },
      "lessons",
      " Tick the ones you need instead.",
    );
    return data.csv;
  };

  const confirm = async () => {
    if (!entries) return;
    try {
      const res = await submit(entries, false);
      setResult(res);
      if (res.mode === "edit") {
        const pending = res.unpublished
          ? ` ${res.unpublished} went back for review.`
          : "";
        toastSuccess("Changes applied", `Updated ${res.updated} ${meta.unit}.${pending}`);
      } else {
        const where = res.resultStatus === "in_review" ? "staged for review" : "published live";
        toastSuccess("Import complete", `Imported ${res.inserted} ${meta.unit} — ${where}.`);
      }
      setEntries(null);
    } catch (err) {
      toastError("Import failed", friendlyError(err));
    }
  };

  const needsCourse = mode === "lessons" && !activeCourseId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <StudioScreenHeader title="Bulk Actions" subtitle="Export, correct, and upload CSVs of content or lessons" />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <StudioFilterPills
          options={(Object.keys(MODE_META) as Mode[]).map((m) => ({ id: m, label: MODE_META[m].label }))}
          value={mode}
          onChange={(m) => { setMode(m as Mode); reset(); setShowTemplate(false); }}
        />

        {allowedLanguages.length > 1 && (
          <StudioDropdown
            label="Language"
            icon="globe.fill"
            value={activeLanguageId}
            options={allowedLanguages.map((id) => ({ id, label: getLanguageName(id) }))}
            onChange={(id) => { setLanguageId(id); setCourseId(""); reset(); }}
          />
        )}

        {mode === "lessons" && (
          courses.length === 0 ? (
            <StudioCard>
              <Text style={{ fontSize: 12, color: M.warning }}>
                This language has no course yet — create one first, then import lessons into it.
              </Text>
            </StudioCard>
          ) : (
            <StudioDropdown
              label="Course"
              icon="book.fill"
              title="Choose a course"
              value={activeCourseId}
              options={courses.map((c) => ({ id: c.id, label: localize(c.title, "en"), sublabel: c.level }))}
              onChange={(id) => { setCourseId(id); reset(); setPickedLessons(new Set()); }}
            />
          )
        )}

        {/* Pick the scope, then download it: the whole Movement, or just the
            lessons ticked below. Everything comes back as one uploadable file. */}
        {mode === "lessons" && activeCourseId !== "" && (
          <StudioCard accentColor={M.accent}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text, marginBottom: 6 }}>Export lessons to fix</Text>
            <Text style={{ fontSize: 12, color: M.sub, marginBottom: 12, lineHeight: 18 }}>
              {pickedLessons.size === 0
                ? `Exports all ${courseLessons.length} lessons in this Movement. Tick lessons below to narrow it.`
                : `Exports the ${pickedLessons.size} ticked lesson${pickedLessons.size === 1 ? "" : "s"}.`}
              {" "}They arrive as one file — edit it and upload it straight back.
            </Text>

            {courseLessons.length > 0 && (
              <View style={{ marginBottom: 12, borderRadius: 10, borderWidth: 1, borderColor: M.border, overflow: "hidden" }}>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                  {courseLessons.map((lesson) => {
                    const picked = pickedLessons.has(lesson.id);
                    return (
                      <Pressable
                        key={lesson.id}
                        onPress={() => toggleLesson(lesson.id)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: M.bg }}
                      >
                        <IconSymbol
                          name={picked ? "checkmark.circle.fill" : "circle"}
                          size={18}
                          color={picked ? M.accent : M.muted}
                        />
                        <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: M.text }}>
                          {localize(lesson.title, "en")}
                        </Text>
                        {lesson.type === "game" && (
                          <Text style={{ fontSize: 10, fontWeight: "800", color: M.muted }}>GATE</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {pickedLessons.size > 0 && (
              <View style={{ marginBottom: 10 }}>
                <GhostButton label="Clear selection" onPress={() => setPickedLessons(new Set())} />
              </View>
            )}
            <ShareFileButton
              label="Export CSV"
              fileName={lessonExportFilename(activeCourseId)}
              contents={exportLessonsCsv}
              busy={lessonExport.isPending}
              message="Beeli lesson export"
              onError={(e) => toastError("Couldn’t export", friendlyError(e))}
            />
          </StudioCard>
        )}

        {/* Step 1 of edit mode: get the sheet to correct. */}
        {mode === "edit" && (
          <StudioCard accentColor={M.accent}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text, marginBottom: 6 }}>1 · Export the words to fix</Text>
            <Text style={{ fontSize: 12, color: M.sub, marginBottom: 12, lineHeight: 18 }}>
              Pick a category — an export bigger than one upload can carry is cut short, and the whole
              dictionary is far bigger than that.
            </Text>
            <View style={{ marginBottom: 12 }}>
              <StudioDropdown
                label="Category"
                icon="tag"
                title="Filter the export"
                value={exportCategory}
                options={[
                  { id: "", label: "All categories" },
                  ...ALL_CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })),
                ]}
                onChange={setExportCategory}
              />
            </View>
            <ShareFileButton
              label="Export CSV"
              fileName={`beeli-${activeLanguageId}-${exportCategory || "dictionary"}.csv`}
              contents={exportEditCsv}
              busy={dictionaryExport.isPending}
              message="Beeli dictionary export"
              onError={(e) => toastError("Couldn’t export", friendlyError(e))}
            />
          </StudioCard>
        )}

        {/* The other half of content mode: get what's already there back out. */}
        {mode === "content" && (
          <StudioCard accentColor={M.accent}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text, marginBottom: 6 }}>Export what’s already there</Text>
            <Text style={{ fontSize: 12, color: M.sub, marginBottom: 12, lineHeight: 18 }}>{CONTENT_EXPORT_GUIDE}</Text>
            <View style={{ marginBottom: 12 }}>
              <StudioDropdown
                label="Content type"
                icon="square.grid.2x2"
                title="What to export"
                value={exportType}
                options={CONTENT_EXPORT_TYPES.map((t) => ({ id: t.id, label: t.label }))}
                onChange={(id) => setExportType(id as UnifiedRowType)}
              />
            </View>
            <ShareFileButton
              label="Export CSV"
              fileName={contentExportFilename(activeLanguageId, exportType)}
              contents={exportContentCsv}
              busy={contentExport.isPending}
              message="Beeli content export"
              onError={(e) => toastError("Couldn’t export", friendlyError(e))}
            />
          </StudioCard>
        )}

        {/* Format guide */}
        <StudioCard>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text, marginBottom: 6 }}>{meta.title}</Text>
          <Text style={{ fontSize: 12, color: M.sub, marginBottom: 12, lineHeight: 18 }}>{meta.blurb}</Text>
          {meta.guide.map((g) => (
            <View key={g.label} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: M.accent }}>{g.label}</Text>
              <Text style={{ fontSize: 12, color: M.muted, lineHeight: 17 }}>{g.uses}</Text>
            </View>
          ))}

          {meta.sample && (
            <>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <GhostButton label={showTemplate ? "Hide template" : "Show template"} onPress={() => setShowTemplate((s) => !s)} />
                </View>
                <View style={{ flex: 1 }}>
                  <ShareFileButton
                    label="Download sample"
                    fileName={meta.sample.fileName}
                    contents={meta.sample.csv}
                    message="Beeli import template"
                    onError={(e) => toastError("Couldn’t export sample", friendlyError(e))}
                  />
                </View>
              </View>
              {showTemplate && (
                <View style={{ marginTop: 10, borderRadius: 10, backgroundColor: M.bg, borderWidth: 1, borderColor: M.border, padding: 10 }}>
                  <Text selectable style={{ fontSize: 11, color: M.sub, fontFamily: "Menlo" }}>
                    {meta.sample.csv.trim()}
                  </Text>
                </View>
              )}
            </>
          )}
        </StudioCard>

        {/* Pick file */}
        <PrimaryButton
          label={busy ? "Working…" : fileName ? "Choose different file(s)" : meta.buttonLabel}
          onPress={() => void pickFile()}
          disabled={busy || needsCourse}
        />
        {needsCourse && (
          <Text style={{ fontSize: 11, color: M.muted, textAlign: "center" }}>Pick a course to import lessons into.</Text>
        )}
        {fileName && (
          <Text style={{ fontSize: 12, color: M.muted, textAlign: "center" }}>{fileName}</Text>
        )}

        {result && (
          <ImportResultCard
            result={result}
            unit={meta.unit}
            busy={busy}
            confirmLabel={meta.confirmLabel}
            onConfirm={entries ? () => void confirm() : undefined}
            onCancel={reset}
          />
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
          <IconSymbol name="info.circle" size={13} color={M.muted} />
          <Text style={{ flex: 1, fontSize: 11, color: M.muted, lineHeight: 16 }}>
            {meta.footer(currentUser?.isAdmin ?? false)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
