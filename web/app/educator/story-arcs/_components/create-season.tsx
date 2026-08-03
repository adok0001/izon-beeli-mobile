"use client";

import type { Course } from "@/app/educator/courses/[id]/_components/shared";
import { apiFetch } from "@/lib/api";
import { localizePair } from "@/lib/localize";
import { useForm } from "@/lib/use-form";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Field, PrimaryButton, SelectField, TextareaField } from "./fields";

/**
 * Create a season. The course is picked from a native `<select>` — with a
 * standalone option for a cross-course narrative, where the server takes the
 * languageId directly instead of deriving it from a course
 * (`story-arcs.ts:142-156`). Attachment is only settable here: neither update
 * route accepts a courseId.
 */
export function CreateSeason({
  languageId,
  courses,
  takenCourseIds,
  onCreated,
}: Readonly<{
  languageId: string;
  courses: Course[];
  takenCourseIds: Set<string>;
  onCreated: (id: string) => void;
}>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { uiLanguage } = useUiLanguageStore();

  const [form, setForm] = useForm({
    courseId: "",
    title: "",
    description: "",
    nativeTitle: "",
    logline: "",
  });

  // One season per course, so a course that already has one isn't offerable.
  const available = courses.filter((c) => c.languageId === languageId && !takenCourseIds.has(c.id));

  const create = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<{ id: string }>("/educator/story-arcs", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({
          courseId: form.courseId || undefined,
          languageId,
          title: form.title.trim(),
          description: form.description.trim(),
          nativeTitle: form.nativeTitle.trim(),
          logline: form.logline.trim(),
        }),
      });
    },
    onSuccess: (created) => {
      toast.success(t("educator.storyArcs.seasonCreated", { defaultValue: "Season created" }));
      setForm({ courseId: "", title: "", description: "", nativeTitle: "", logline: "" });
      void qc.invalidateQueries({ queryKey: ["educator-story-arcs"] });
      onCreated(created.id);
    },
  });

  const canCreate = !!languageId && form.title.trim().length > 0 && form.description.trim().length > 0;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 space-y-3">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("educator.story.newArcTitle")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField
          label={t("educator.story.labelCourse")}
          value={form.courseId}
          onChange={(v) => setForm({ courseId: v })}
          hint={form.courseId ? undefined : t("educator.story.standaloneHint")}
        >
          <option value="">{t("educator.story.standaloneOption")}</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {localizePair(c.titleTranslations, c.title, uiLanguage)}
            </option>
          ))}
        </SelectField>
        <Field
          label={t("educator.story.labelTitle")}
          value={form.title}
          onChange={(v) => setForm({ title: v })}
          placeholder={t("educator.story.titlePlaceholder")}
          required
        />
        <TextareaField
          label={t("educator.story.labelDescription")}
          value={form.description}
          onChange={(v) => setForm({ description: v })}
          placeholder={t("educator.story.descriptionPlaceholder")}
          required
        />
        <Field
          label={t("educator.story.labelNativeTitle")}
          value={form.nativeTitle}
          onChange={(v) => setForm({ nativeTitle: v })}
          placeholder={t("educator.story.nativeTitlePlaceholder")}
          hint={t("educator.story.nativeTitleHint")}
        />
        <TextareaField
          label={t("educator.story.labelLogline")}
          value={form.logline}
          onChange={(v) => setForm({ logline: v })}
          placeholder={t("educator.story.loglinePlaceholder")}
          rows={2}
        />
      </div>
      <PrimaryButton onClick={() => create.mutate()} disabled={!canCreate || create.isPending}>
        {create.isPending ? t("educator.story.creating") : t("educator.story.createButton")}
      </PrimaryButton>
    </div>
  );
}
