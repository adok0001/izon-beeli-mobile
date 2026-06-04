"use client";

import { DoorTransition } from "@/components/ui/door-transition";

export default function CourseTemplate({ children }: { children: React.ReactNode }) {
  return <DoorTransition accentColor="rgb(245 158 11)">{children}</DoorTransition>;
}
