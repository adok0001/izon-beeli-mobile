import React from "react";
import { Button } from "izon-beeli-mobile";

const Panel = ({ children, w = 380 }: { children: React.ReactNode; w?: number }) => (
  <div style={{ background: "#0D0F1A", padding: 24, display: "flex", flexDirection: "column", gap: 12, width: w, boxSizing: "border-box" }}>
    {children}
  </div>
);

export function Variants() {
  return (
    <Panel>
      <Button label="Begin lesson" onPress={() => {}} variant="primary" />
      <Button label="Continue" onPress={() => {}} variant="secondary" />
      <Button label="Skip for now" onPress={() => {}} variant="ghost" />
      <Button label="Delete entry" onPress={() => {}} variant="danger" />
    </Panel>
  );
}

export function Sizes() {
  return (
    <Panel>
      <Button label="Small" onPress={() => {}} size="sm" />
      <Button label="Medium" onPress={() => {}} size="md" />
      <Button label="Large" onPress={() => {}} size="lg" />
    </Panel>
  );
}

export function States() {
  return (
    <Panel>
      <Button label="Saving…" onPress={() => {}} loading />
      <Button label="Unavailable" onPress={() => {}} disabled />
      <Button label="Inline action" onPress={() => {}} variant="secondary" fullWidth={false} />
    </Panel>
  );
}
