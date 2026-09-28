import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import config from "@payload-config";
import { findBlockById, statusLine, translationStatus } from "@/payload/components/translation-status";
import { withTranslationStatus } from "@/payload/blocks/row-label";
import { hero1 } from "@/payload/blocks";

const L = ["en", "es", "fr", "ar"] as const;

describe("translationStatus", () => {
  it("marks a language missing when any translatable text lacks it", () => {
    const block = { blockType: "hero1", title: { en: "Hi", es: "Hola", fr: "", ar: null }, body: { en: "x", es: "y", fr: "z", ar: "w" } };
    expect(translationStatus(block, L)).toEqual({ en: "complete", es: "complete", fr: "missing", ar: "missing" });
  });

  it("looks inside nested lists", () => {
    const block = { faqs: [{ title: { en: "Q", es: "P", fr: "Q", ar: "س" } }, { title: { en: "Q2", es: "", fr: "Q2", ar: "س" } }] };
    expect(translationStatus(block, L)).toEqual({ en: "complete", es: "missing", fr: "complete", ar: "complete" });
  });

  it("treats rich text as filled when it has any words", () => {
    const words = { root: { children: [{ children: [{ text: "Hello" }] }] } };
    const empty = { root: { children: [{ children: [] }] } };
    const block = { body: { en: words, es: words, fr: empty, ar: null } };
    expect(translationStatus(block, L)).toEqual({ en: "complete", es: "complete", fr: "missing", ar: "missing" });
  });

  it("a section with no translatable text is complete everywhere", () => {
    expect(translationStatus({ region: "ssa", count: 3 }, L)).toEqual({ en: "complete", es: "complete", fr: "complete", ar: "complete" });
  });

  it("ignores values whose English is empty (nothing to translate)", () => {
    expect(translationStatus({ title: { en: "", es: "" } }, L).es).toBe("complete");
  });
});

describe("statusLine", () => {
  it("spells the status out, English first", () => {
    expect(statusLine({ en: "complete", es: "missing", fr: "complete", ar: "missing" })).toEqual({
      text: "EN ✓ · ES missing · FR ✓ · AR missing",
      spoken: "Translations: English done, Spanish missing, French done, Arabic missing",
    });
  });
});

describe("findBlockById", () => {
  it("finds a section in a shared list, whose text holds every language", () => {
    const doc = { sections: [{ id: "b", blockType: "faqs", title: { en: "Q", fr: "Q" } }] };
    expect(findBlockById(doc, "b")).toEqual({ block: { id: "b", blockType: "faqs", title: { en: "Q", fr: "Q" } }, shared: true });
  });

  it("marks a section in a per-language list as not shared (it has no other languages to miss)", () => {
    const doc = { blocks: { en: [{ id: "a", blockType: "hero1", title: "Hi" }], fr: [] } };
    expect(findBlockById(doc, "a")).toEqual({ block: { id: "a", blockType: "hero1", title: "Hi" }, shared: false });
  });

  it("finds nothing for a new, unsaved section", () => {
    expect(findBlockById({ sections: [] }, "zzz")).toBeUndefined();
  });
});

describe("row label wiring", () => {
  it("adds the status label without changing the block's shape", () => {
    const labelled = withTranslationStatus(hero1);
    expect(labelled.slug).toBe("hero1");
    expect(labelled.fields).not.toBe(hero1.fields);
    expect(labelled.fields.map((f) => ("name" in f ? f.name : f.type))).toEqual(hero1.fields.map((f) => ("name" in f ? f.name : f.type)));
    expect(labelled.admin?.components?.Label).toEqual({
      path: "@/payload/components/section-row-label#SectionRowLabel",
      clientProps: { label: "Hero" },
    });
    expect(labelled.admin?.group).toBe("Openings");
  });

  it("every section on pages shows it", async () => {
    const pages = (await config).collections.find((c) => c.slug === "pages")!;
    const blocks = (pages.fields.find((f: Field) => "name" in f && f.name === "blocks") as { blocks: Array<{ admin?: { components?: { Label?: unknown } } }> }).blocks;
    expect(blocks.every((b) => b.admin?.components?.Label)).toBe(true);
  });
});
