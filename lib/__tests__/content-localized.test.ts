/**
 * The shared locale helper — `lib/content/internal/localized.ts`.
 *
 * Both rules it encodes were found by comparing the RSC flight payload, not the
 * DOM, and neither is observable in a rendered page. So they are pinned here
 * rather than left to a parity run that only fails once a localized object
 * happens to reach a client component.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { localized, orNull } from "@/lib/content/internal/localized";

const REPO_ROOT = path.resolve(__dirname, "../..");

describe("localized()", () => {
  it("emits the locale keys in Sanity's alphabetical order, not Payload's config order", () => {
    // Payload hands back `payload.config.ts`'s order; Sanity's Content Lake
    // serializes alphabetically. Key order is invisible to `===` and to any
    // property read, and visible the moment the object is serialized into the
    // flight payload — so the assertion has to be on the key list itself.
    const fromPayload = { en: "Climate", es: "Clima", fr: "Climat", ar: "مناخ" };
    expect(Object.keys(localized(fromPayload) ?? {})).toEqual(["ar", "en", "es", "fr"]);
  });

  it("preserves each locale's value while reordering", () => {
    const out = localized({ en: "Climate", es: "Clima", fr: "Climat", ar: "مناخ" });
    expect(out).toEqual({ ar: "مناخ", en: "Climate", es: "Clima", fr: "Climat" });
  });

  it("sorts a partially populated object too", () => {
    // The common shape in this dataset: `en` and `fr` set, `es`/`ar` null.
    expect(Object.keys(localized({ en: "Title", es: null, fr: "Titre", ar: null }) ?? {})).toEqual(["en", "fr"]);
  });

  it("drops the locale arms Payload spells out as null, which Sanity never stores", () => {
    expect(localized({ en: "Title", es: null, fr: null, ar: null })).toEqual({ en: "Title" });
  });

  it("drops empty strings, which are not a translation", () => {
    expect(localized({ en: "Title", es: "" })).toEqual({ en: "Title" });
  });

  it("collapses an object with nothing left to undefined, as an unset GROQ field is absent", () => {
    expect(localized({ en: null, es: null, fr: null, ar: null })).toBeUndefined();
    expect(localized({})).toBeUndefined();
    expect(localized(null)).toBeUndefined();
    expect(localized(undefined)).toBeUndefined();
  });
});

describe("orNull()", () => {
  it("turns an absent value into the null a GROQ projection emits", () => {
    // React writes an absent prop into the flight payload as `"$undefined"`,
    // which is a different byte string from `null`.
    expect(orNull(undefined)).toBeNull();
  });

  it("leaves a present value alone, including falsy ones", () => {
    expect(orNull("")).toBe("");
    expect(orNull(0)).toBe(0);
    expect(orNull(false)).toBe(false);
    expect(orNull(null)).toBeNull();
  });
});

describe("the Payload readers use the shared helper rather than a private copy", () => {
  // Five private copies is how the sixth reader gets it wrong again. This is
  // the guard that keeps the next task from adding a seventh, and it discovers
  // the readers rather than listing them so a new one is covered on the day it
  // lands rather than on the day someone remembers to add it here.
  const READER_DIR = path.join(REPO_ROOT, "lib/content/internal/payload");
  const readers = readdirSync(READER_DIR).filter((f) => f.endsWith(".ts"));

  it("finds the readers at all, so an empty directory cannot pass this suite", () => {
    expect(readers.length).toBeGreaterThan(5);
  });

  it.each(readers)("payload/%s declares no localized() of its own", (reader) => {
    const source = readFileSync(path.join(READER_DIR, reader), "utf8");
    expect(source).not.toMatch(/function\s+localized\s*\(/);
    expect(source).not.toMatch(/function\s+orNull\s*\(/);
  });

  it.each(readers)("payload/%s imports LocalizedRaw from the shared module if it names it", (reader) => {
    const source = readFileSync(path.join(READER_DIR, reader), "utf8");
    if (!source.includes("LocalizedRaw")) return;
    expect(source).toMatch(/from "@\/lib\/content\/internal\/localized"/);
    // A private `type LocalizedRaw = …` beside the import would shadow it.
    expect(source).not.toMatch(/type\s+LocalizedRaw\s*=/);
  });
});
