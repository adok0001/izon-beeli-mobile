import type { IconSymbolName } from "@/components/ui/icon-symbol-mapping";
import type { TranslationKey } from "@/lib/locales";
import type { TFunction } from "i18next";
import type { Step } from "./types";

interface StepMeta {
  label: string;
  icon: IconSymbolName;
}

const STEP_LABEL_KEYS: Record<Step, TranslationKey> = {
  language: "contribute.stepLanguage",
  course: "contribute.stepCourse",
  details: "contribute.stepDetails",
  audio: "contribute.stepAudio",
  transcript: "contribute.stepTranscript",
};

const STEP_ICONS: Record<Step, IconSymbolName> = {
  language: "globe",
  course: "book.fill",
  details: "pencil",
  audio: "waveform",
  transcript: "text.alignleft",
};

export function useStepMeta(t: TFunction): Record<Step, StepMeta> {
  return {
    language: { label: t(STEP_LABEL_KEYS.language), icon: STEP_ICONS.language },
    course: { label: t(STEP_LABEL_KEYS.course), icon: STEP_ICONS.course },
    details: { label: t(STEP_LABEL_KEYS.details), icon: STEP_ICONS.details },
    audio: { label: t(STEP_LABEL_KEYS.audio), icon: STEP_ICONS.audio },
    transcript: { label: t(STEP_LABEL_KEYS.transcript), icon: STEP_ICONS.transcript },
  };
}
