"use client";

import { DoorTransition } from "@/components/ui/door-transition";

export default function LessonTemplate({ children }: { children: React.ReactNode }) {
  return <DoorTransition accentColor="rgb(139 92 246)">{children}</DoorTransition>;
}
