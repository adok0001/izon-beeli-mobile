import React from "react";
import { ScreenContainer, SectionHeader, Button } from "izon-beeli-mobile";

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 16, width: 420, boxSizing: "border-box" }}>
    <div style={{ height: 460, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(247,242,232,0.08)" }}>{children}</div>
  </div>
);

export function Padded() {
  return (
    <Frame>
      <ScreenContainer edges={[]}>
        <div style={{ height: 16 }} />
        <SectionHeader eyebrow="Profile" title="Your progress" subtitle="A standard padded screen with the content gutter." />
        <div style={{ height: 16 }} />
        <Button label="Edit profile" onPress={() => {}} variant="secondary" />
      </ScreenContainer>
    </Frame>
  );
}
