import { scopeToSense, type DictionaryEntry } from "../dictionary";

const NAMA: DictionaryEntry = {
  id: "nama",
  word: "nama",
  english: "animal; beast; meat; beef",
  category: "animals",
  languageId: "izon",
  example: "Nama bara emi",
  exampleTranslation: "There is meat",
  exampleAudioUrl: "https://audio/nama-example.mp3",
};

describe("scopeToSense", () => {
  it("gives the primary sense the entry's example", () => {
    // dictionary_entries carries one example column for the whole headword, and
    // the corpus backfill attaches it to sense 1 on the same assumption.
    expect(scopeToSense(NAMA, 0)).toEqual({
      example: "Nama bara emi",
      exampleTranslation: "There is meat",
      exampleTranslations: undefined,
      exampleAudioUrl: "https://audio/nama-example.mp3",
    });
  });

  it("gives later senses nothing rather than borrowing sense 1's sentence", () => {
    // Showing a sentence written for "animal" under the "meat" reading would be
    // a quiet mistranslation. An empty slot is the honest state, and it is what
    // makes the gap visible to the educator who can fill it.
    expect(scopeToSense(NAMA, 1)).toEqual({});
    expect(scopeToSense(NAMA, 3)).toEqual({});
  });

  it("falls back to the whole entry when no sense is selected", () => {
    expect(scopeToSense(NAMA).example).toBe("Nama bara emi");
  });

  it("does not leak example audio onto a sense that has no example", () => {
    // The audio belongs to the sentence, so a sense with no sentence has none.
    expect(scopeToSense(NAMA, 2).exampleAudioUrl).toBeUndefined();
  });
});
