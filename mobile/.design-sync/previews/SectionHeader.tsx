import React from "react";
import { SectionHeader, Button } from "izon-beeli-mobile";

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, width: 420, boxSizing: "border-box" }}>{children}</div>
);

export function WithEyebrow() {
  return (
    <Panel>
      <SectionHeader eyebrow="Today" title="Continue learning" subtitle="Pick up where you left off in Izon." />
    </Panel>
  );
}

export function WithAction() {
  return (
    <Panel>
      <SectionHeader
        title="Proverbs"
        action={<Button label="See all" onPress={() => {}} variant="ghost" size="sm" fullWidth={false} />}
      />
    </Panel>
  );
}

export function TitleOnly() {
  return (
    <Panel>
      <SectionHeader title="Your collection" />
    </Panel>
  );
}
