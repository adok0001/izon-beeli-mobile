import { localize, localizeField } from "../localize";

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

describe("localizeField (legacy shim)", () => {
  it("returns french value when lang is fr and fr exists", () => {
    expect(localizeField("Hello", "Bonjour", "fr")).toBe("Bonjour");
  });

  it("returns english value when lang is not fr", () => {
    expect(localizeField("Hello", "Bonjour", "en")).toBe("Hello");
  });

  it("returns english value when fr is missing", () => {
    expect(localizeField("Hello", null, "fr")).toBe("Hello");
  });
});
