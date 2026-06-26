import React from "react";
import { ProverbCard } from "izon-beeli-mobile";

const proverb = {
  id: "p1",
  languageId: "izon",
  text: "Beni mienge, beni saramu.",
  translation: { en: "Still water runs deep.", fr: "L'eau calme est profonde." },
  meaning: {
    en: "Those who speak least often carry the most depth — judge by substance, not noise.",
    fr: "Ceux qui parlent le moins portent souvent le plus de profondeur.",
  },
  literal: "Calm water, strong current",
  context: "Said of a reserved elder whose counsel proves wisest.",
};

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, width: 400, boxSizing: "border-box" }}>{children}</div>
);

export function Default() {
  return (
    <Panel>
      <ProverbCard proverb={proverb} />
    </Panel>
  );
}

export function Compact() {
  return (
    <Panel>
      <ProverbCard proverb={proverb} compact />
    </Panel>
  );
}
