import { useState } from "react";
import { STEPS, type Segment, type Step } from "./types";

interface StepNavInput {
  selectedLanguage: string | null;
  title: string;
  description: string;
  audioUri: string | null;
  segments: Segment[];
  onLeaveLanguage: (languageId: string) => void;
}

export interface StepNav {
  step: Step;
  currentIndex: number;
  canGoNext: () => boolean;
  goNext: () => void;
  goBack: () => void;
}

export function useStepNav({
  selectedLanguage,
  title,
  description,
  audioUri,
  segments,
  onLeaveLanguage,
}: StepNavInput): StepNav {
  const [step, setStep] = useState<Step>("language");
  const currentIndex = STEPS.indexOf(step);

  const canGoNext = () => {
    switch (step) {
      case "language": return !!selectedLanguage;
      case "course": return true;
      case "details": return title.trim().length > 0 && description.trim().length > 0;
      case "audio": return !!audioUri;
      case "transcript": return segments.some((s) => s.text.trim().length > 0);
      default: return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= STEPS.length) return;
    if (step === "language" && selectedLanguage) onLeaveLanguage(selectedLanguage);
    setStep(STEPS[nextIndex]);
  };

  const goBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) return;
    setStep(STEPS[prevIndex]);
  };

  return { step, currentIndex, canGoNext, goNext, goBack };
}
