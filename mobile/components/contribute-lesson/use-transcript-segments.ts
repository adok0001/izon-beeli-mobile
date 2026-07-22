import { useState } from "react";
import type { Segment } from "./types";

export interface TranscriptSegments {
  segments: Segment[];
  handleMarkSegment: (index: number) => void;
  updateSegment: (index: number, field: keyof Segment, value: string) => void;
  addSegment: () => void;
  removeSegment: (index: number) => void;
}

export function useTranscriptSegments(getCurrentPosition: () => number): TranscriptSegments {
  const [segments, setSegments] = useState<Segment[]>([
    { text: "", translation: "", startTime: "", endTime: "" },
  ]);

  const handleMarkSegment = (index: number) => {
    const pos = getCurrentPosition();
    const newSegs = [...segments];
    newSegs[index] = { ...newSegs[index], startTime: pos.toFixed(1) };
    if (index > 0) {
      newSegs[index - 1] = { ...newSegs[index - 1], endTime: pos.toFixed(1) };
    }
    setSegments(newSegs);
  };

  const updateSegment = (index: number, field: keyof Segment, value: string) => {
    const newSegs = [...segments];
    newSegs[index] = { ...newSegs[index], [field]: value };
    setSegments(newSegs);
  };

  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      { text: "", translation: "", startTime: "", endTime: "" },
    ]);
  };

  const removeSegment = (index: number) => {
    if (segments.length === 1) return;
    setSegments((prev) => prev.filter((_, i) => i !== index));
  };

  return { segments, handleMarkSegment, updateSegment, addSegment, removeSegment };
}
