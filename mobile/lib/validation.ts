import { z } from "zod";
import { DICTIONARY_CATEGORY_VALUES } from "@/lib/dictionary";

// ── Word / Phrase contribution ──────────────────────────────────────────────

function isLocalizedText(val: unknown): val is Record<string, string> {
  return typeof val === "object" && val !== null && !Array.isArray(val) &&
    Object.values(val as Record<string, unknown>).every((v) => typeof v === "string");
}

const localizedTextSchema = z
  .custom<Record<string, string>>(isLocalizedText, "Invalid translation map.")
  .refine(
    (obj) => Object.values(obj).some((v) => v.trim()),
    "At least one translation is required.",
  );

export const wordContributionSchema = z.object({
  languageId: z.string().min(1, "Please select a language."),
  word: z.string().trim().min(1, "Word or phrase is required."),
  english: localizedTextSchema,
  category: z.enum(DICTIONARY_CATEGORY_VALUES).refine(Boolean, { message: "Please select a category." }),
  pronunciation: z.string().trim().optional(),
  example: z.string().trim().optional(),
  exampleTranslation: z.custom<Record<string, string>>(isLocalizedText).optional(),
  audioUri: z.string().optional(),
  imageUri: z.string().optional(),
});

export type WordContributionData = z.infer<typeof wordContributionSchema>;

// ── Lesson contribution ─────────────────────────────────────────────────────

export const lessonSegmentSchema = z.object({
  text: z.string().trim().min(1, "Segment text cannot be empty."),
  translation: z.string().trim().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const lessonContributionSchema = z.object({
  languageId: z.string().min(1, "Please select a language."),
  courseId: z.string().optional().nullable(),
  title: z.string().trim().min(1, "Lesson title is required."),
  description: z.string().trim().min(1, "Description is required."),
  audioUri: z.string().min(1, "An audio file is required."),
  segments: z
    .array(lessonSegmentSchema)
    .min(1, "At least one transcript segment with text is required."),
});

export type LessonContributionData = z.infer<typeof lessonContributionSchema>;
