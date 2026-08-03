"use client";

import type { Course, Lesson } from "@/app/educator/courses/[id]/_components/shared";
import { apiFetch } from "@/lib/api";
import { setContentActive } from "@/lib/content-workflow";
import { localizePair } from "@/lib/localize";
import { useForm } from "@/lib/use-form";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CastEditor } from "./cast-editor";
import { ChapterList } from "./chapter-list";
import { Field, PrimaryButton, SelectField, TextareaField } from "./fields";
import { CAST_HUES, type CastMember, type ChapterDraft, type StoryArcDetail } from "./types";

/**
 * Studio Web — the season editor.
 *
 * Loads through `GET /educator/story-arcs/arc/:id` rather than by course id, so
 * a STANDALONE season (courseId null — a cross-course narrative like a podcast)
 * opens like any other. Saves through the atomic `PUT /story-arcs/:id/save`,
 * which commits arc metadata, cast and chapters together rather than the old
 * per-part PUTs that could half-apply.
 */

/**
 * `/save` replaces the chapter rows wholesale and doesn't carry `isActive`
 * (server `story-arcs.ts:476-493`), so per-chapter visibility is re-applied
 * afterwards against the freshly written ids through the shared active toggle
 * (`POST /content/story_chapters/:id/active`). Rows come back ordered, and the
 * save wrote `order: i + 1`, so index i is draft i.
 */
async function reconcileChapterVisibility(
  token: string | undefined,
  arcId: string,
  drafts: ChapterDraft[],
) {
  const fresh = await apiFetch<StoryArcDetail>(`/educator/story-arcs/arc/${arcId}`, { token });
  const rows = [...(fresh.chapters ?? [])].sort((a, b) => a.order - b.order);
  await Promise.all(
    rows.flatMap((row, i) => {
      const wanted = drafts[i]?.isActive ?? true;
      if (row.isActive === wanted) return [];
      return [setContentActive("story_chapters", row.id, wanted, token)];
    }),
  );
}

export function SeasonEditor({
  arcId,
  courses,
  lessons,
  onClose,
}: Readonly<{
  arcId: string;
  courses: Course[];
  lessons: Lesson[];
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { uiLanguage } = useUiLanguageStore();

  const { data: arc, isPending } = useQuery<StoryArcDetail>({
    queryKey: ["educator-story-arc", "arc", arcId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<StoryArcDetail>(`/educator/story-arcs/arc/${arcId}`, { token: token ?? undefined });
    },
  });

  const [ui, setUi] = useForm({
    title: "",
    description: "",
    nativeTitle: "",
    logline: "",
    cast: [] as CastMember[],
    chapters: [] as ChapterDraft[],
    visibilityTouched: false,
  });

  useEffect(() => {
    if (!arc) return;
    setUi({
      title: arc.title,
      description: arc.description,
      nativeTitle: arc.nativeTitle ?? "",
      logline: arc.logline ?? "",
      cast: (arc.cast ?? []).map((m) => ({ ...m, hue: m.hue || CAST_HUES[0] })),
      chapters: [...(arc.chapters ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((ch) => ({
          key: ch.id,
          id: ch.id,
          lessonId: ch.lessonId,
          title: ch.title,
          narrativeIntro: ch.narrativeIntro,
          narrativeOutro: ch.narrativeOutro,
          isActive: ch.isActive ?? true,
        })),
      visibilityTouched: false,
    });
  }, [arc, setUi]);

  // A course-bound season draws its episodes from that course; a standalone one
  // is a cross-course narrative, so it may pick any lesson in its language.
  const lessonOptions = useMemo(
    () =>
      lessons
        .filter((l) => (arc?.courseId ? l.courseId === arc.courseId : l.languageId === arc?.languageId))
        .sort((a, b) => a.order - b.order),
    [lessons, arc],
  );

  const chaptersReadOnly = !!arc?.courseId;

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ["educator-story-arcs"] });
    void qc.invalidateQueries({ queryKey: ["educator-story-arc"] });
  }

  /** Mirrors the server's own validation so a bad save is caught before the round-trip. */
  function validationError(): string | null {
    if (!ui.title.trim()) return t("educator.story.errorTitleRequiredShort");
    for (const member of ui.cast) {
      if (!member.castId.trim() || !member.name.trim() || !member.role.trim()) {
        return t("educator.storyArcs.errorCastIncomplete", {
          defaultValue: "Every character needs an ID, a name, and a role.",
        });
      }
    }
    const ids = ui.cast.map((m) => m.castId.trim().toLowerCase());
    if (ids.some((id, i) => ids.indexOf(id) !== i)) return t("educator.story.castIdDuplicate");
    if (chaptersReadOnly) return null;
    for (const [i, ch] of ui.chapters.entries()) {
      if (!ch.lessonId) return t("educator.story.errorChapterNeedsLesson", { number: i + 1 });
      if (!ch.title.trim() || !ch.narrativeIntro.trim() || !ch.narrativeOutro.trim()) {
        return t("educator.story.errorChapterIncomplete", { number: i + 1 });
      }
    }
    return null;
  }

  const save = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await apiFetch<{ success: true; chaptersWritten: boolean }>(`/educator/story-arcs/${arcId}/save`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({
          arc: {
            title: ui.title.trim(),
            description: ui.description.trim(),
            nativeTitle: ui.nativeTitle.trim(),
            logline: ui.logline.trim(),
          },
          cast: ui.cast.map((m) => ({
            castId: m.castId.trim(),
            name: m.name.trim(),
            role: m.role.trim(),
            hue: m.hue,
          })),
          chapters: ui.chapters.map((ch, i) => ({
            lessonId: ch.lessonId,
            title: ch.title.trim(),
            narrativeIntro: ch.narrativeIntro.trim(),
            narrativeOutro: ch.narrativeOutro.trim(),
            order: i + 1,
          })),
        }),
      });
      if (ui.visibilityTouched || ui.chapters.some((ch) => !ch.isActive)) {
        await reconcileChapterVisibility(token ?? undefined, arcId, ui.chapters);
      }
    },
    onSuccess: () => {
      toast.success(t("educator.story.arcSaved"));
      setUi({ visibilityTouched: false });
      invalidate();
    },
  });

  /** Cast-only edit — the season's recurring characters without touching chapters. */
  const saveCast = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<{ success: true; count: number }>(`/educator/story-arcs/${arcId}/cast`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({
          cast: ui.cast.map((m) => ({
            castId: m.castId.trim(),
            name: m.name.trim(),
            role: m.role.trim(),
            hue: m.hue,
          })),
        }),
      });
    },
    onSuccess: () => {
      toast.success(t("educator.storyArcs.castSaved", { defaultValue: "Cast saved" }));
      invalidate();
    },
  });

  function handleSave() {
    const problem = validationError();
    if (problem) {
      toast.error(t("educator.story.errorFixHighlighted"), { description: problem });
      return;
    }
    save.mutate();
  }

  function moveChapter(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= ui.chapters.length) return;
    const next = [...ui.chapters];
    [next[index], next[target]] = [next[target], next[index]];
    setUi({ chapters: next });
  }

  if (isPending) {
    return <p className="text-sm text-neutral-500">{t("educator.story.loading")}</p>;
  }
  if (!arc) {
    return <p className="text-sm text-neutral-500">{t("educator.story.noArcsTitle")}</p>;
  }

  const attachedCourse = arc.courseId ? courses.find((c) => c.id === arc.courseId) : undefined;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("educator.storyArcs.editSeason", { defaultValue: "Edit season" })}
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05]"
        >
          {t("common.close")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field
          label={t("educator.story.labelArcTitle")}
          value={ui.title}
          onChange={(v) => setUi({ title: v })}
          placeholder={t("educator.story.arcTitlePlaceholder")}
          required
        />
        <Field
          label={t("educator.story.labelNativeTitle")}
          value={ui.nativeTitle}
          onChange={(v) => setUi({ nativeTitle: v })}
          placeholder={t("educator.story.nativeTitlePlaceholder")}
          hint={t("educator.story.nativeTitleHint")}
        />
        <TextareaField
          label={t("educator.story.labelDescription")}
          value={ui.description}
          onChange={(v) => setUi({ description: v })}
          placeholder={t("educator.story.arcDescriptionPlaceholder")}
        />
        <TextareaField
          label={t("educator.story.labelLogline")}
          value={ui.logline}
          onChange={(v) => setUi({ logline: v })}
          placeholder={t("educator.story.loglinePlaceholder")}
          rows={2}
        />
        {/* Attachment is fixed at creation — neither PUT accepts a courseId, and
            a course owns at most one season. */}
        <SelectField
          label={t("educator.story.labelCourse")}
          value={arc.courseId ?? ""}
          onChange={() => undefined}
          disabled
          hint={t("educator.storyArcs.attachmentLocked", {
            defaultValue: "A season's course is chosen when it's created and can't be moved here.",
          })}
        >
          <option value="">{t("educator.story.standaloneOption")}</option>
          {attachedCourse && (
            <option value={attachedCourse.id}>
              {localizePair(attachedCourse.titleTranslations, attachedCourse.title, uiLanguage)}
            </option>
          )}
          {arc.courseId && !attachedCourse && <option value={arc.courseId}>{arc.courseId}</option>}
        </SelectField>
      </div>

      <CastEditor
        cast={ui.cast}
        onChange={(cast) => setUi({ cast })}
        onSave={() => saveCast.mutate()}
        saving={saveCast.isPending}
      />

      <ChapterList
        chapters={ui.chapters}
        lessons={lessonOptions}
        readOnly={chaptersReadOnly}
        courseId={arc.courseId}
        onChange={(index, patch) =>
          setUi({
            chapters: ui.chapters.map((ch, i) => (i === index ? { ...ch, ...patch } : ch)),
            visibilityTouched: ui.visibilityTouched || patch.isActive !== undefined,
          })
        }
        onMove={moveChapter}
        onRemove={(index) => setUi({ chapters: ui.chapters.filter((_, i) => i !== index) })}
        onAdd={() =>
          setUi({
            chapters: [
              ...ui.chapters,
              {
                key: `new-${Date.now()}`,
                lessonId: lessonOptions[0]?.id ?? "",
                title: "",
                narrativeIntro: "",
                narrativeOutro: "",
                isActive: true,
              },
            ],
          })
        }
      />

      <PrimaryButton onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? t("educator.story.saving") : t("educator.story.saveButton")}
      </PrimaryButton>
    </div>
  );
}
