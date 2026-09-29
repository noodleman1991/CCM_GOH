import { describe, expect, it } from "vitest";
import type { Block, Field } from "payload";
import { withShortEnumNames } from "@/payload/fields/short-enum-names";

type EnumFn = (args: { tableName: string }) => string;
const find = (fields: Field[], name: string): Record<string, unknown> | undefined => {
  for (const f of fields as Array<Record<string, unknown>>) {
    if (f.name === name) return f;
    if (Array.isArray(f.fields)) {
      const inner = find(f.fields as Field[], name);
      if (inner) return inner;
    }
  }
  return undefined;
};

const block: Block = {
  slug: "demo",
  fields: [
    { name: "size", type: "select", options: ["a", "b"] },
    { name: "chapter", type: "group", fields: [{ name: "kind", type: "select", options: ["x"] }] },
    { type: "collapsible", label: "More", fields: [{ name: "layout", type: "select", options: ["g"] }] },
    { name: "rows", type: "array", fields: [{ name: "tone", type: "select", options: ["t"] }] },
  ],
};

describe("withShortEnumNames", () => {
  const out = withShortEnumNames(block);

  it("keeps Payload's own name when it fits in 63 characters", () => {
    expect((find(out.fields, "size")!.enumName as EnumFn)({ tableName: "short_table" })).toBe("enum_short_table_size");
    expect((find(out.fields, "kind")!.enumName as EnumFn)({ tableName: "t" })).toBe("enum_t_chapter_kind");
    expect((find(out.fields, "layout")!.enumName as EnumFn)({ tableName: "t" })).toBe("enum_t_layout");
    expect((find(out.fields, "tone")!.enumName as EnumFn)({ tableName: "t_rows" })).toBe("enum_t_rows_tone");
  });

  it("shortens a name that would be too long, the same way every time, and distinctly per table", () => {
    const fn = find(out.fields, "kind")!.enumName as EnumFn;
    const long = "regional_communities_blocks_submit_story_banner";
    const a = fn({ tableName: long });
    expect(a.length).toBeLessThanOrEqual(63);
    expect(fn({ tableName: long })).toBe(a);
    expect(fn({ tableName: `_${long}_v` })).not.toBe(a);
  });

  it("leaves the original block untouched", () => {
    expect((block.fields[0] as { enumName?: unknown }).enumName).toBeUndefined();
  });
});
