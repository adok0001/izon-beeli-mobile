import React from "react";
import { Badge } from "izon-beeli-mobile";

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center", width: 380, boxSizing: "border-box" }}>
    {children}
  </div>
);

export function Tones() {
  return (
    <Panel>
      <Badge label="Neutral" tone="neutral" />
      <Badge label="Accent" tone="accent" />
      <Badge label="Success" tone="success" />
      <Badge label="Error" tone="error" />
      <Badge label="Warning" tone="warning" />
      <Badge label="Info" tone="info" />
    </Panel>
  );
}

export function CustomPalette() {
  return (
    <Panel>
      <Badge label="Beginner" color="#7CC4A0" bg="rgba(124,196,160,0.14)" border="rgba(124,196,160,0.3)" />
      <Badge label="Level 3" color="#D89A3A" bg="rgba(216,154,58,0.14)" border="rgba(216,154,58,0.3)" />
    </Panel>
  );
}
