import { describe, expect, it } from "vitest";
import type { Block } from "payload";
import { SKIP_REQUIRED_SECTIONS, sectionsField, requiredSectionsValidator } from "@/payload/fields/sections";

const hero: Block = { slug: "hero1", labels: { singular: "Hero", plural: "Heroes" }, fields: [{ name: "title", type: "text", localized: true }] };
const map: Block = { slug: "atlasEmbed", labels: { singular: "Atlas", plural: "Atlases" }, fields: [{ name: "region", type: "text" }] };

type AnyField = {
  name: string;
  type: string;
  localized?: boolean;
  label?: string;
  defaultValue?: unknown;
  admin: { condition: (data: Record<string, unknown>) => boolean };
  blocks: Array<Block & { fields: Array<{ localized?: boolean }> }>;
  validate?: (value: unknown) => true | string;
};

describe("sectionsField", () => {
  const [, toggle, shared, perLanguage] = sectionsField({ blocks: [hero, map] }) as unknown as AnyField[];

  it("has the opt-out switch, a shared list and a per-language list", () => {
    expect(toggle).toMatchObject({
      name: "layoutPerLanguage",
      type: "checkbox",
      defaultValue: false,
      label: "This page has its own layout in each language",
    });
    expect(shared).toMatchObject({ name: "sections", type: "blocks" });
    expect(shared.localized).toBeFalsy();
    expect(perLanguage).toMatchObject({ name: "sectionsByLanguage", type: "blocks", localized: true });
  });

  it("shows exactly one list depending on the switch", () => {
    expect(shared.admin.condition({ layoutPerLanguage: false })).toBe(true);
    expect(perLanguage.admin.condition({ layoutPerLanguage: false })).toBe(false);
    expect(shared.admin.condition({ layoutPerLanguage: true })).toBe(false);
    expect(perLanguage.admin.condition({ layoutPerLanguage: true })).toBe(true);
  });

  it("gives each list its own copy of every block, with distinct table names", () => {
    expect(shared.blocks[0]).not.toBe(perLanguage.blocks[0]);
    expect(shared.blocks[0].fields).not.toBe(perLanguage.blocks[0].fields);
    expect(shared.blocks[0].fields).not.toBe(perLanguage.blocks[0].fields);
    // No custom table names: Payload's write path finds tables by block type, so it names them itself.
    expect(shared.blocks[0].dbName).toBeUndefined();
  });

  it("keeps text translatable inside the shared list", () => {
    expect(shared.blocks[0].fields[0].localized).toBe(true);
  });

  it("leaves the original blocks untouched", () => {
    expect(hero.dbName).toBeUndefined();
  });

  it("only validates when some sections are required", () => {
    expect(shared.validate).toBeUndefined();
    const [, , withRequired] = sectionsField({ blocks: [hero, map], required: ["atlasEmbed"] }) as unknown as AnyField[];
    expect(withRequired.validate!([{ blockType: "hero1" }])).toBe("This page always keeps its Atlas. You can move it, but not remove it.");
  });
});

describe("required sections", () => {
  const validate = requiredSectionsValidator(["atlasEmbed"], { atlasEmbed: "Atlas" });

  it("refuses to save without a required section", () => {
    expect(validate([{ blockType: "hero1" }])).toBe("This page always keeps its Atlas. You can move it, but not remove it.");
    expect(validate(null)).toBe("This page always keeps its Atlas. You can move it, but not remove it.");
  });

  it("accepts it anywhere in the list", () => {
    expect(validate([{ blockType: "hero1" }, { blockType: "atlasEmbed" }])).toBe(true);
  });
});

describe("one-of required sections", () => {
  const validate = requiredSectionsValidator([["hero1", "hero2"]], { hero1: "Hero", hero2: "Hero with image" });
  it("is satisfied by any section in the group", () => {
    expect(validate([{ blockType: "hero2" }])).toBe(true);
    expect(validate([{ blockType: "faqs" }, { blockType: "hero1" }])).toBe(true);
  });
  it("names the first section of the group when none is present", () => {
    expect(validate([{ blockType: "faqs" }])).toBe("This page always keeps its Hero. You can move it, but not remove it.");
  });
});

describe("nested sections get their own copies", () => {
  const column: Block = { slug: "splitContent", fields: [{ name: "title", type: "text", localized: true }] };
  const row: Block = { slug: "splitRow", fields: [{ name: "splitColumns", type: "blocks", blocks: [column] }] };
  const [, , shared, perLanguage] = sectionsField({ blocks: [row] }) as unknown as Array<{ blocks: Array<{ fields: Array<{ blocks: Block[] }> }> }>;

  it("gives each list its own copy of blocks nested inside a section, so Payload can give them their own tables", () => {
    expect(shared.blocks[0].fields[0].blocks[0]).not.toBe(column);
    expect(shared.blocks[0].fields[0].blocks[0]).not.toBe(perLanguage.blocks[0].fields[0].blocks[0]);
    expect(shared.blocks[0].fields[0].blocks[0].dbName).toBeUndefined();
  });

  it("leaves the original nested block untouched", () => {
    expect(column.dbName).toBeUndefined();
  });
});

describe("emptying a list on purpose", () => {
  it("lets a script that says so empty the list (the homepage move's --revert), and nobody else", () => {
    const [, , shared] = sectionsField({ blocks: [hero, map], required: ["atlasEmbed"] }) as unknown as Array<{ validate: (v: unknown, o?: unknown) => true | string }>;
    expect(shared.validate([], { req: { context: { [SKIP_REQUIRED_SECTIONS]: true } } })).toBe(true);
    expect(shared.validate([], { req: { context: {} } })).toBe("This page always keeps its Atlas. You can move it, but not remove it.");
  });
});
