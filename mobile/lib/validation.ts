import { z } from "zod";
import { DICTIONARY_CATEGORY_VALUES } from "@/lib/dictionary";

// ── Word / Phrase contribution ──────────────────────────────────────────────

export const wordContributionSchema = z.object({
  languageId: z.string().min(1, "Please select a language."),
  word: z.string().trim().min(1, "Word or phrase is required."),
  english: z.string().trim().min(1, "English translation is required."),
  category: z.enum(DICTIONARY_CATEGORY_VALUES, {
    errorMap: () => ({ message: "Please select a category." }),
  }),
  pronunciation: z.string().trim().optional(),
  example: z.string().trim().optional(),
  exampleTranslation: z.string().trim().optional(),
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
