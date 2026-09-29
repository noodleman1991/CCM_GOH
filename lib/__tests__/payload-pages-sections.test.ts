import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import config from "@payload-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const named = (fields: Field[], name: string) => fields.find((f) => "name" in f && f.name === name) as Record<string, any> | undefined;

describe("pages on sections", async () => {
  const pages = (await config).collections.find((c) => c.slug === "pages")!;
  it("has the shared list after the old per-language list, which is hidden", () => {
    const names = pages.fields.map((f) => ("name" in f ? f.name : null));
    expect(names.indexOf("sections")).toBeGreaterThan(names.indexOf("blocks"));
    expect(named(pages.fields, "blocks")?.admin?.hidden).toBe(true);
    expect(named(pages.fields, "sectionsByLanguage")).toMatchObject({ localized: true });
    expect(named(pages.fields, "layoutPerLanguage")?.type).toBe("checkbox");
  });
  it("requires nothing", async () => {
    expect(await named(pages.fields, "sections")!.validate([], { req: { context: {}, t: (k: string) => k }, required: false })).toBe(true);
  });
  it("opens on the section an edit link names", () => {
    const focus = named(pages.fields, "sectionFocus");
    expect(focus?.type).toBe("ui");
    expect(focus?.admin?.components?.Field).toBe("@/payload/components/section-focus#SectionFocus");
  });
});
