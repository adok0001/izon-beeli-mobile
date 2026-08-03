"use client";

import { useTranslation } from "react-i18next";
import { ActionButton, Field, SelectField } from "./fields";
import { CAST_HUES, type CastMember } from "./types";

/**
 * The season's recurring cast. `castId` is what a transcript segment's
 * `speaker` refers to, so it must be unique — the server rejects duplicates
 * (`story-arcs.ts:417-421`), and this editor flags them before the round-trip.
 *
 * Saved either with the whole season (`PUT /save`) or on its own through
 * `PUT /story-arcs/:id/cast` for a cast-only edit.
 */
export function CastEditor({
  cast,
  onChange,
  onSave,
  saving,
}: Readonly<{
  cast: CastMember[];
  onChange: (next: CastMember[]) => void;
  onSave: () => void;
  saving: boolean;
}>) {
  const { t } = useTranslation();

  const duplicateIds = new Set(
    cast
      .map((m) => m.castId.trim().toLowerCase())
      .filter((id, i, all) => id.length > 0 && all.indexOf(id) !== i),
  );

  const update = (index: number, patch: Partial<CastMember>) =>
    onChange(cast.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  return (
    <div className="space-y-3 border-t border-neutral-200 dark:border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t("educator.story.castTitle", { count: cast.length })}
          </h4>
          <p className="text-xs text-neutral-500">{t("educator.story.castHint")}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ActionButton onClick={onSave} disabled={saving}>
            {saving ? t("educator.story.saving") : t("educator.storyArcs.saveCast", { defaultValue: "Save cast" })}
          </ActionButton>
          <ActionButton
            onClick={() => onChange([...cast, { castId: "", name: "", role: "", hue: CAST_HUES[0] }])}
          >
            {t("educator.story.castAdd")}
          </ActionButton>
        </div>
      </div>

      {cast.length === 0 && <p className="text-sm text-neutral-500">{t("educator.story.castEmpty")}</p>}

      {cast.map((member, i) => (
        <div
          key={`cast-${i}`}
          className="rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">
              {t("educator.storyArcs.castMember", { defaultValue: "Character {{number}}", number: i + 1 })}
            </span>
            <ActionButton tone="danger" onClick={() => onChange(cast.filter((_, idx) => idx !== i))}>
              {t("educator.storyArcs.remove", { defaultValue: "Remove" })}
            </ActionButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label={t("educator.storyArcs.castIdLabel", { defaultValue: "Cast ID" })}
              value={member.castId}
              onChange={(v) => update(i, { castId: v })}
              placeholder={t("educator.story.castIdPlaceholder")}
              required
            />
            <Field
              label={t("educator.storyArcs.castNameLabel", { defaultValue: "Name" })}
              value={member.name}
              onChange={(v) => update(i, { name: v })}
              placeholder={t("educator.story.castNamePlaceholder")}
              required
            />
            <Field
              label={t("educator.storyArcs.castRoleLabel", { defaultValue: "Role" })}
              value={member.role}
              onChange={(v) => update(i, { role: v })}
              placeholder={t("educator.story.castRolePlaceholder")}
              required
            />
            <SelectField
              label={t("educator.storyArcs.castHueLabel", { defaultValue: "Avatar colour" })}
              value={member.hue}
              onChange={(v) => update(i, { hue: v })}
            >
              {CAST_HUES.map((hue) => (
                <option key={hue} value={hue}>
                  {hue}
                </option>
              ))}
            </SelectField>
          </div>
          {duplicateIds.has(member.castId.trim().toLowerCase()) && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {t("educator.story.castIdDuplicate")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
