import { describe, it, expect } from "vitest";
import { deriveAgendaLanguages } from "../agenda-languages";

describe("deriveAgendaLanguages", () => {
  it("collects languages from files", () => {
    const langs = deriveAgendaLanguages(
      [{ language: "en" }, { language: "es" }],
      null
    );
    expect(langs).toEqual(["en", "es"]);
  });

  it("includes languages with a non-empty localized title", () => {
    const langs = deriveAgendaLanguages([], { en: "Title", fr: "Titre", es: "" });
    expect(langs).toEqual(["en", "fr"]);
  });

  it("merges file + title languages in canonical order", () => {
    const langs = deriveAgendaLanguages(
      [{ language: "ar" }],
      { en: "Hi", ar: "مرحبا" }
    );
    expect(langs).toEqual(["en", "ar"]);
  });

  it("defaults to en when nothing is available", () => {
    expect(deriveAgendaLanguages([], {})).toEqual(["en"]);
    expect(deriveAgendaLanguages(null, null)).toEqual(["en"]);
  });

  it("ignores unsupported / blank file languages", () => {
    const langs = deriveAgendaLanguages(
      [{ language: "de" }, { language: undefined }, { language: "es" }],
      null
    );
    expect(langs).toEqual(["es"]);
  });

  it("dedupes when a language appears in both files and title", () => {
    const langs = deriveAgendaLanguages([{ language: "fr" }], { fr: "Titre" });
    expect(langs).toEqual(["fr"]);
  });
});
