import React from "react";
import { UpNextCard } from "izon-beeli-mobile";

// Content is supplied by the seeded QueryClient (["progress","next-lesson","izon"]).
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, width: 420, boxSizing: "border-box" }}>{children}</div>
);

export function Default() {
  return (
    <Panel>
      <UpNextCard languageId="izon" />
    </Panel>
  );
}
