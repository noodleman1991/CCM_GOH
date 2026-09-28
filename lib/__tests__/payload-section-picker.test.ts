import { describe, expect, it } from "vitest";
import type { Block } from "payload";
import { hero1 } from "@/payload/blocks/hero-1";
import { sectionHeader } from "@/payload/blocks/section-header";
import { splitRow } from "@/payload/blocks/split-row";
import { gridRow } from "@/payload/blocks/grid-row";
import { cta1 } from "@/payload/blocks/cta-1";
import { logoCloud1 } from "@/payload/blocks/logo-cloud-1";
import { carousel2 } from "@/payload/blocks/carousel-2";
import { contentGrid } from "@/payload/blocks/content-grid";
import { SECTION_GROUPS, SECTION_PICTURES } from "@/payload/blocks/picker";
import { existsSync } from "node:fs";
import { join } from "node:path";

const expected: Array<[Block, string, string, string]> = [
  [hero1, "hero1", "Hero", "Openings"],
  [sectionHeader, "sectionHeader", "Section heading", "Openings"],
  [splitRow, "splitRow", "Text + image", "Text & media"],
  [gridRow, "gridRow", "Link cards", "Content"],
  [cta1, "cta1", "Call to action", "Calls to action"],
  [logoCloud1, "logoCloud1", "Logo strip", "Logos & quotes"],
  [carousel2, "carousel2", "Testimonials", "Logos & quotes"],
];

describe("section picker", () => {
  it.each(expected)("%s keeps its slug and gets a plain name, group and picture", (block, slug, label, group) => {
    expect(block.slug).toBe(slug);
    expect(block.labels?.singular).toBe(label);
    expect(block.admin?.group).toBe(group);
    const thumb = block.admin?.images?.thumbnail as { url: string; alt: string };
    expect(thumb.url).toMatch(/^\/admin\/sections\/[a-z0-9-]+\.svg$/);
    expect(thumb.alt.length).toBeGreaterThan(10);
  });

  it("marks the old regional content section as old, pointing to Content feed", () => {
    expect(contentGrid.labels?.singular).toBe("Content section (old)");
  });

  it("describes grid-row's automatic mode as an old setting", () => {
    const mode = (gridRow.fields as Array<{ name?: string; admin?: { description?: string } }>).find((f) => f.name === "mode");
    expect(mode?.admin?.description).toBe("Old automatic setting — use a Content feed section instead.");
  });

  it("has the six groups in order", () => {
    expect(SECTION_GROUPS).toEqual(["Openings", "Text & media", "Content", "Maps", "Calls to action", "Logos & quotes"]);
  });

  it("has a picture file for every section", () => {
    for (const url of Object.values(SECTION_PICTURES)) {
      expect(existsSync(join(process.cwd(), "public", url)), url).toBe(true);
    }
  });
});
