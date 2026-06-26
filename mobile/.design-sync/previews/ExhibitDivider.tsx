import React from "react";
import { ExhibitDivider } from "izon-beeli-mobile";

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, width: 420, boxSizing: "border-box" }}>{children}</div>
);

export function Default() {
  return (
    <Panel>
      <ExhibitDivider label="This week" />
      <div style={{ height: 16 }} />
      <ExhibitDivider label="Earlier" />
    </Panel>
  );
}
