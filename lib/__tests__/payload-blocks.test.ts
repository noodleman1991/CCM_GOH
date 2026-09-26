import { describe, expect, it } from "vitest";
import { blocks } from "@/payload/blocks";
import { localizedRichText, localizedText, localizedTextarea } from "@/payload/fields/localized";

describe("payload blocks", () => {
  it("defines exactly the twelve blocks that carry data", () => {
    const slugs = blocks.map((b) => b.slug).sort();
    expect(slugs).toEqual([
      "carousel2", "cta1", "gridAgenda", "gridCard", "gridNews", "gridRow",
      "hero1", "logoCloud1", "sectionHeader", "splitContent", "splitImage", "splitRow",
    ]);
  });

  it("gives every block an interfaceName so payload-types names them", () => {
    for (const b of blocks) expect(b.interfaceName).toBeTruthy();
  });

  it("has no duplicate slugs or interfaceNames", () => {
    const slugs = blocks.map((b) => b.slug);
    const interfaceNames = blocks.map((b) => b.interfaceName);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(interfaceNames).size).toBe(interfaceNames.length);
  });

  it("nests splitContent and splitImage inside splitRow.splitColumns, and gridCard/gridAgenda/gridNews inside gridRow.columns", () => {
    const splitRow = blocks.find((b) => b.slug === "splitRow");
    const splitColumns = splitRow?.fields.find(
      (f): f is Extract<typeof f, { type: "blocks" }> => "name" in f && f.name === "splitColumns",
    );
    expect(splitColumns?.blocks.map((b) => b.slug).sort()).toEqual(["splitContent", "splitImage"]);

    const gridRow = blocks.find((b) => b.slug === "gridRow");
    const columns = gridRow?.fields.find(
      (f): f is Extract<typeof f, { type: "blocks" }> => "name" in f && f.name === "columns",
    );
    expect(columns?.blocks.map((b) => b.slug).sort()).toEqual(["gridAgenda", "gridCard", "gridNews"]);
  });
});

describe("localized field helpers", () => {
  it("localizedText/localizedTextarea/localizedRichText all set localized: true and the field's own type", () => {
    expect(localizedText("title")).toMatchObject({ name: "title", type: "text", localized: true });
    expect(localizedTextarea("excerpt")).toMatchObject({ name: "excerpt", type: "textarea", localized: true });
    const rich = localizedRichText("body");
    expect(rich).toMatchObject({ name: "body", type: "richText", localized: true });
    expect(rich.editor).toBeTruthy();
  });

  it("lets callers override any option, including localized itself", () => {
    expect(localizedText("slug", { required: true })).toMatchObject({ required: true, localized: true });
    expect(localizedText("legacy", { localized: false })).toMatchObject({ localized: false });
  });
});
