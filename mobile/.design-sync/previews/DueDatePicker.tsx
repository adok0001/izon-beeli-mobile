import React from "react";
import { DueDatePicker } from "izon-beeli-mobile";

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, display: "flex", flexDirection: "column", gap: 16, width: 360, boxSizing: "border-box" }}>
    {children}
  </div>
);

export function Empty() {
  return (
    <Panel>
      <DueDatePicker value={null} onChange={() => {}} />
    </Panel>
  );
}

export function WithDate() {
  return (
    <Panel>
      <DueDatePicker value={new Date("2026-07-15T00:00:00")} onChange={() => {}} />
    </Panel>
  );
}
