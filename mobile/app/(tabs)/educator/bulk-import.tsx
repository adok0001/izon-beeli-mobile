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
import { useEducatorCourses } from "@/lib/hooks/educator/use-courses";
import { useLessonImport } from "@/lib/hooks/educator/use-lesson-import";
import { useUnifiedImport, type UnifiedImportResult } from "@/lib/hooks/educator/use-unified-import";
import { useToast } from "@/lib/hooks/use-toast";
import { LESSON_LINE_GUIDE, LESSON_META_GUIDE, LESSON_TEMPLATE_CSV, parseLessonFile } from "@/lib/lesson-import";
import { localize } from "@/lib/localize";
import { getLanguageName } from "@/lib/mock-data";
import { UNIFIED_FIELD_GUIDE, UNIFIED_TEMPLATE_CSV, parseUnifiedCsv } from "@/lib/unified-import";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguages } from "@/store/languages-store";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "content" | "lessons";

const MODE_META: Record<Mode, { unit: string; sampleFile: string; template: string; guide: { label: string; uses: string }[] }> = {
  content: {
    unit: "rows",
    sampleFile: "beeli-content-template.csv",
    template: UNIFIED_TEMPLATE_CSV,
    guide: UNIFIED_FIELD_GUIDE.map((g) => ({ label: g.type, uses: g.uses })),
  },
  lessons: {
    unit: "lessons",
    sampleFile: "beeli-lesson-template.csv",
    template: LESSON_TEMPLATE_CSV,
    guide: [
      ...LESSON_META_GUIDE.map((g) => ({ label: g.key, uses: g.uses })),
      ...LESSON_LINE_GUIDE.map((g) => ({ label: g.column, uses: `line — ${g.uses}` })),
    ],
  },
};

export default function BulkImportScreen() {
  const M = useMuseumTheme();
  const { user: currentUser } = useStudioAccess();
  const languages = useLanguages();
  const unifiedImport = useUnifiedImport();
  const lessonImport = useLessonImport();
  const { data: allCourses } = useEducatorCourses();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  // Deep-link from a course's lesson list preselects lessons mode + that course.
  const params = useLocalSearchParams<{ mode?: string; courseId?: string; languageId?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === "lessons" ? "lessons" : "content");
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
  const [result, setResult] = useState<UnifiedImportResult | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const reset = () => { setFileName(null); setEntries(null); setResult(null); };
  const busy = unifiedImport.isPending || lessonImport.isPending;

  const submit = (payload: unknown[], dryRun: boolean) =>
    mode === "content"
      ? unifiedImport.mutateAsync({ languageId: activeLanguageId, entries: payload as Record<string, string>[], dryRun })
      : lessonImport.mutateAsync({ languageId: activeLanguageId, courseId: activeCourseId, entries: payload, dryRun });

  const pickFile = async () => {
    try {
      // Content is one flat CSV; lessons are one-file-per-lesson, so allow many.
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel", "*/*"],
        copyToCacheDirectory: true,
        multiple: mode === "lessons",
      });
      const assets = picked.canceled ? [] : picked.assets;
      if (assets.length === 0) return;
      reset();

      let payload: unknown[];
      if (mode === "content") {
        payload = parseUnifiedCsv(await new File(assets[0].uri).text());
        if (payload.length === 0) {
          toastError("Nothing to import", "No rows found — every row needs a `type`.");
          return;
        }
        setFileName(assets[0].name);
      } else {
        payload = await Promise.all(assets.map((a) => new File(a.uri).text().then(parseLessonFile)));
        setFileName(assets.length === 1 ? assets[0].name : `${assets.length} files`);
      }
      setEntries(payload);
      setResult(await submit(payload, true));
    } catch (err) {
      toastError("Couldn’t read file", friendlyError(err));
    }
  };

  const confirm = async () => {
    if (!entries) return;
    try {
      const res = await submit(entries, false);
      setResult(res);
      const where = res.resultStatus === "in_review" ? "staged for review" : "published live";
      toastSuccess("Import complete", `Imported ${res.inserted} ${meta.unit} — ${where}.`);
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
      <StudioScreenHeader title="Bulk Import" subtitle="Upload a CSV of content or lessons" />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <StudioFilterPills
          options={[{ id: "content", label: "Content" }, { id: "lessons", label: "Lessons" }]}
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
              onChange={(id) => { setCourseId(id); reset(); }}
            />
          )
        )}

        {/* Format guide */}
        <StudioCard>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text, marginBottom: 6 }}>How the sheet works</Text>
          <Text style={{ fontSize: 12, color: M.sub, marginBottom: 12, lineHeight: 18 }}>
            {mode === "content"
              ? "Each row’s type column decides where it lands. Fill only the columns that type uses. Re-uploading updates rows instead of duplicating them."
              : "One file is one full lesson: a metadata block, a --- line, then the transcript grid. Pick several files to import several lessons into the course above."}
          </Text>
          {meta.guide.map((g) => (
            <View key={g.label} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: M.accent }}>{g.label}</Text>
              <Text style={{ fontSize: 12, color: M.muted, lineHeight: 17 }}>{g.uses}</Text>
            </View>
          ))}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <GhostButton label={showTemplate ? "Hide template" : "Show template"} onPress={() => setShowTemplate((s) => !s)} />
            </View>
            <View style={{ flex: 1 }}>
              <ShareFileButton
                label="Download sample"
                fileName={meta.sampleFile}
                contents={meta.template}
                message="Beeli import template"
                onError={(e) => toastError("Couldn’t export sample", friendlyError(e))}
              />
            </View>
          </View>
          {showTemplate && (
            <View style={{ marginTop: 10, borderRadius: 10, backgroundColor: M.bg, borderWidth: 1, borderColor: M.border, padding: 10 }}>
              <Text selectable style={{ fontSize: 11, color: M.sub, fontFamily: "Menlo" }}>
                {meta.template.trim()}
              </Text>
            </View>
          )}
        </StudioCard>

        {/* Pick file */}
        <PrimaryButton
          label={busy ? "Working…" : fileName ? "Choose different file(s)" : mode === "lessons" ? "Choose CSV file(s)" : "Choose CSV file"}
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
            onConfirm={entries ? () => void confirm() : undefined}
            onCancel={reset}
          />
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
          <IconSymbol name="info.circle" size={13} color={M.muted} />
          <Text style={{ flex: 1, fontSize: 11, color: M.muted, lineHeight: 16 }}>
            {currentUser?.isAdmin
              ? `As an admin, imported ${meta.unit} publish live.`
              : `Imported ${meta.unit} are staged for review before going live.`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
