// The lesson bulk-import contract is defined once, in `@mobile/lib/lesson-import`,
// and re-exported here so the existing `@/lib/lesson-import` call sites are
// untouched. It used to be a hand-maintained copy on each side — the copies
// drifted (mobile grew the in-lesson checks section), so this is now a re-export
// like `@/lib/import-types` and `@/lib/parse-csv`.
export {
  LESSON_META_GUIDE,
  LESSON_LINE_GUIDE,
  LESSON_LINE_COLUMNS,
  LESSON_CHECK_COLUMNS,
  LESSON_CHECK_GUIDE,
  LESSON_TEMPLATE_CSV,
  parseLessonFile,
} from "@mobile/lib/lesson-import";
export type { ParsedLessonFile } from "@mobile/lib/lesson-import";
