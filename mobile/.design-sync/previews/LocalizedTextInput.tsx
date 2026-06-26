import React from "react";
import { LocalizedTextInput } from "izon-beeli-mobile";

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0D0F1A", padding: 24, width: 420, boxSizing: "border-box" }}>{children}</div>
);

export function Default() {
  return (
    <Frame>
      <LocalizedTextInput
        label="Translation"
        value={{ en: "Welcome home", fr: "Bienvenue à la maison" }}
        onChange={() => {}}
      />
    </Frame>
  );
}

export function Multiline() {
  return (
    <Frame>
      <LocalizedTextInput
        label="Example sentence"
        required
        multiline
        value={{ en: "The river carries our stories to the sea." }}
        onChange={() => {}}
      />
    </Frame>
  );
}
