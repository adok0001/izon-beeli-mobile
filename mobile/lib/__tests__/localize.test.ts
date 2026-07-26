import { localize, localizePair } from "../localize";

const map = { en: "Hello", fr: "Bonjour", ar: "مرحبا" };

describe("localize", () => {
  it("picks the requested language from a map", () => {
    expect(localize(map, "fr")).toBe("Bonjour");
    expect(localize(map, "ar")).toBe("مرحبا");
  });

  it("falls back to en when the requested lang is missing", () => {
    expect(localize({ en: "Hello" }, "pcm")).toBe("Hello");
  });

  it("falls back to first available value when en is also missing", () => {
    expect(localize({ fr: "Bonjour" }, "ar")).toBe("Bonjour");
  });

  it("returns the string as-is for legacy string values", () => {
    expect(localize("raw string", "fr")).toBe("raw string");
  });

  it("returns fallback for null, undefined, and empty string", () => {
    expect(localize(null, "en", "—")).toBe("—");
    expect(localize(undefined, "en", "—")).toBe("—");
    expect(localize("", "en", "—")).toBe("—");
  });

  it("returns fallback for empty map", () => {
    expect(localize({}, "en", "—")).toBe("—");
  });
});

describe("localizePair", () => {
  it("prefers the map over the flat column", () => {
    expect(localizePair({ en: "Hello", fr: "Bonjour" }, "Hi", "fr")).toBe("Bonjour");
  });

  it("falls back to the flat column when the map is absent", () => {
    expect(localizePair(null, "Hello", "fr")).toBe("Hello");
  });

  it("falls back to the map's english when the language is missing", () => {
    expect(localizePair({ en: "Hello" }, "Hello", "fr")).toBe("Hello");
  });
});
