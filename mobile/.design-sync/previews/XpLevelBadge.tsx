import React from "react";
import { XpLevelBadge } from "izon-beeli-mobile";

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "center", width: 380, boxSizing: "border-box" }}>
    {children}
  </div>
);

export function Compact() {
  return (
    <Panel>
      <XpLevelBadge points={40} variant="compact" />
      <XpLevelBadge points={320} variant="compact" />
      <XpLevelBadge points={1480} variant="compact" />
    </Panel>
  );
}

export function Full() {
  return (
    <div style={{ background: "#0D0F1A", padding: 24, display: "flex", flexDirection: "column", gap: 16, width: 380, boxSizing: "border-box" }}>
      <XpLevelBadge points={120} variant="full" />
      <XpLevelBadge points={2650} variant="full" />
    </div>
  );
}
