import React from "react";
import { LanguagePicker } from "izon-beeli-mobile";

const LANGUAGES = [
  { id: "izon", name: "Izon (Ijaw)", nativeName: "Ịzọn", region: "Niger Delta" },
  { id: "yoruba", name: "Yoruba", nativeName: "Yorùbá", region: "Southwest" },
  { id: "igbo", name: "Igbo", nativeName: "Igbo", region: "Southeast" },
  { id: "hausa", name: "Hausa", nativeName: "Hausa", region: "North" },
  { id: "swahili", name: "Swahili", nativeName: "Kiswahili", region: "East Africa" },
];

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 16, width: 420, boxSizing: "border-box" }}>
    <div style={{ height: 460, overflow: "hidden" }}>{children}</div>
  </div>
);

export function Onboarding() {
  return (
    <Frame>
      <LanguagePicker
        value="izon"
        onSelect={() => {}}
        languages={LANGUAGES}
        title="Choose your language"
        subtitle="Start with the one closest to home."
      />
    </Frame>
  );
}
