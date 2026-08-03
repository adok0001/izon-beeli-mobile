"use client";

import { StudioShell } from "@/app/(studio)/_components/studio-shell";
import type { Course, Lesson } from "@/app/educator/courses/[id]/_components/shared";
import { apiFetch } from "@/lib/api";
import { canPublishContent, canSubmitForReview, publishContent } from "@/lib/content-workflow";
import { useMe } from "@/lib/hooks/use-me";
import { localizePair } from "@/lib/localize";
import { StatusPill } from "@/components/ui/status-pill";
import type { Language, UserMe } from "@/types";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ActionButton } from "./_components/fields";
import { CreateSeason } from "./_components/create-season";
import { SeasonEditor } from "./_components/season-editor";
import type { StoryArcSummary } from "./_components/types";

/**
 * Studio Web — Seasons (story arcs). Reviewer-scoped (admins see all languages).
 *
 * The list covers standalone seasons too — ones with no owning course, like a
 * cross-course podcast narrative — and the editor opens by arc id, so those are
 * reachable rather than unopenable as they were when detail was only
 * addressable by courseId.
 */

/** Languages a user may edit: reviewers are scoped; admins get the full catalogue. */
function useScopedLanguages(me: UserMe | undefined) {
  const { getToken } = useAuth();
  const { data: allLanguages } = useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Language[]>("/languages", { token: token ?? undefined });
    },
    enabled: me?.isAdmin === true,
  });

  return useMemo(() => {
    if (!me) return [];
    if (me.isAdmin) return allLanguages ?? [];
    return me.reviewerLanguages.map((id) => ({ id, name: id, nativeName: id, region: "" }));
  }, [me, allLanguages]);
}

function StoryArcsEditor() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const languages = useScopedLanguages(me);
  const { uiLanguage } = useUiLanguageStore();

  const [languageId, setLanguageId] = useState<string>("");
  const activeLanguageId = languageId || languages[0]?.id || "";
  const [editingArcId, setEditingArcId] = useState<string | null>(null);

  const arcsQuery = useQuery<StoryArcSummary[]>({
    queryKey: ["educator-story-arcs"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<StoryArcSummary[]>("/educator/story-arcs", { token: token ?? undefined });
    },
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["educator-courses"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>("/educator/courses", { token: token ?? undefined });
    },
  });

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ["educator-lessons"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Lesson[]>("/educator/lessons", { token: token ?? undefined });
    },
  });

  // The list endpoint is already language-scoped server-side; this narrows it to
  // the language being worked on.
  const visibleArcs = useMemo(
    () => (arcsQuery.data ?? []).filter((a) => a.languageId === activeLanguageId),
    [arcsQuery.data, activeLanguageId],
  );

  const courseTitle = (courseId: string | null) => {
    if (!courseId) return t("educator.story.standaloneLabel");
    const course = courses.find((c) => c.id === courseId);
    return course ? localizePair(course.titleTranslations, course.title, uiLanguage) : courseId;
  };

  // One season per course, so courses that already have one can't be offered again.
  const takenCourseIds = useMemo(
    () => new Set((arcsQuery.data ?? []).map((a) => a.courseId).filter((id): id is string => !!id)),
    [arcsQuery.data],
  );

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["educator-story-arcs"] });
    void queryClient.invalidateQueries({ queryKey: ["educator-story-arc"] });
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: (_data, id) => {
      toast.success(t("educator.story.arcDeleted"));
      if (editingArcId === id) setEditingArcId(null);
      invalidate();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${id}`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({ status: "in_review" }),
      });
    },
    onSuccess: () => {
      toast.success(t("educator.story.submitted"));
      invalidate();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return publishContent("story_arcs", id, token ?? undefined);
    },
    onSuccess: () => {
      toast.success(t("educator.story.arcPublished"));
      invalidate();
    },
  });

  const actor = { isAdmin: me?.isAdmin ?? false, reviewerRole: me?.reviewerRole, userId: me?.id };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{t("educator.story.screenTitle")}</h2>
          <p className="text-sm text-neutral-500">{t("educator.story.screenSubtitle")}</p>
        </div>
        <select
          value={activeLanguageId}
          onChange={(e) => {
            setLanguageId(e.target.value);
            setEditingArcId(null);
          }}
          className="rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-neutral-900 dark:text-white"
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.id})
            </option>
          ))}
        </select>
      </div>

      {editingArcId ? (
        <SeasonEditor
          key={editingArcId}
          arcId={editingArcId}
          courses={courses}
          lessons={lessons}
          onClose={() => setEditingArcId(null)}
        />
      ) : (
        <CreateSeason
          languageId={activeLanguageId}
          courses={courses}
          takenCourseIds={takenCourseIds}
          onCreated={setEditingArcId}
        />
      )}

      <div className="space-y-2">
        {arcsQuery.isPending && <p className="text-sm text-neutral-500">{t("educator.story.loading")}</p>}
        {!arcsQuery.isPending && visibleArcs.length === 0 && (
          <p className="text-sm text-neutral-500">{t("educator.story.noArcsTitle")}</p>
        )}
        {visibleArcs.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white">{a.title}</span>
                  <StatusPill status={a.status} />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{a.description}</p>
                <p className="text-xs text-neutral-500 mt-1">{courseTitle(a.courseId)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {canSubmitForReview(a.status) && (
                  <ActionButton onClick={() => submitMutation.mutate(a.id)}>
                    {t("educator.story.submitButton")}
                  </ActionButton>
                )}
                {canPublishContent(a.status, a.createdBy, actor) && (
                  <ActionButton tone="publish" onClick={() => publishMutation.mutate(a.id)}>
                    {t("educator.story.publishButton")}
                  </ActionButton>
                )}
                <ActionButton onClick={() => setEditingArcId(a.id)}>{t("common.edit")}</ActionButton>
                <ActionButton
                  tone="danger"
                  onClick={() => {
                    if (globalThis.confirm(t("educator.story.deleteArcMessage", { title: a.title }))) {
                      deleteMutation.mutate(a.id);
                    }
                  }}
                >
                  {t("common.delete")}
                </ActionButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoryArcsPage() {
  return (
    <StudioShell access="reviewer">
      <StoryArcsEditor />
    </StudioShell>
  );
}
