import { describe, expect, it } from "vitest";
import type { Block, Field } from "payload";
import { fieldAffectsData } from "payload/shared";
import * as library from "@/payload/blocks";
import { moreOptions } from "@/payload/blocks/more-options";

/** The stored shape: every data field's name, however deep, with collapsibles flattened. */
function dataNames(fields: Field[], prefix = ""): string[] {
  return fields
    .flatMap((f) => {
      if (f.type === "collapsible" || f.type === "row") return dataNames((f as { fields: Field[] }).fields, prefix);
      if (!fieldAffectsData(f)) return [];
      const here = `${prefix}${f.name}`;
      return f.type === "group" ? [here, ...dataNames(f.fields, `${here}.`)] : [here];
    })
    .sort();
}

const blocks = Object.values(library).filter((b): b is Block => typeof (b as Block)?.slug === "string" && Array.isArray((b as Block).fields));
const withOptions = ["hero1", "hero2", "sectionHeader", "splitRow", "gridRow", "cta1", "logoCloud1", "carousel1", "carousel2", "timelineRow", "faqs", "submitStoryBanner", "formNewsletter", "eventsCalendar"];

describe("More options", () => {
  it("never changes what is stored", () => {
    const sample: Field[] = [
      { name: "title", type: "text" },
      { name: "padding", type: "group", fields: [{ name: "top", type: "checkbox" }] },
      { name: "imagePosition", type: "select", options: ["left", "right"] },
    ];
    expect(dataNames(moreOptions(sample))).toEqual(dataNames(sample));
  });

  it("folds presentation settings away, last and collapsed, on every section that has them", () => {
    for (const slug of withOptions) {
      const block = blocks.find((b) => b.slug === slug)!;
      const last = block.fields[block.fields.length - 1] as { type: string; label?: string; admin?: { initCollapsed?: boolean } };
      expect(last, slug).toMatchObject({ type: "collapsible", label: "More options", admin: { initCollapsed: true } });
    }
  });

  it("puts the essentials first", () => {
    const hero = blocks.find((b) => b.slug === "hero1")!;
    expect((hero.fields[0] as { name?: string }).name).toBe("tagLine");
  });
});
