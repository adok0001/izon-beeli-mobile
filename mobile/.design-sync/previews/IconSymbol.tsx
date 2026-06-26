import React from "react";
import { IconSymbol } from "izon-beeli-mobile";

// NOTE: icons render as deterministic placeholder glyphs in this sync (the
// native icon font isn't shipped). The preview shows the size/color API.
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, display: "flex", flexDirection: "row", gap: 18, alignItems: "center", width: 380, boxSizing: "border-box" }}>
    {children}
  </div>
);

export function SizesAndColors() {
  return (
    <Panel>
      <IconSymbol name="star.fill" size={18} color="#C4862A" />
      <IconSymbol name="flame.fill" size={24} color="#C4862A" />
      <IconSymbol name="checkmark.circle.fill" size={32} color="#7CC4A0" />
      <IconSymbol name="bell.fill" size={28} color="#9A9480" />
    </Panel>
  );
}
