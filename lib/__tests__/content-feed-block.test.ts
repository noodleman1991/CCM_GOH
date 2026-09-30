import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { contentFeed } from "@/payload/blocks/content-feed";
import { pageBlocks } from "@/lib/content/internal/payload/blocks";

type AnyField = {
  name?: string;
  type?: string;
  options?: Array<{ value: string; label: string }>;
  admin?: {
    description?: string;
    condition?: (data: unknown, sibling: Record<string, unknown>, ctx?: { blockData?: Record<string, unknown> }) => boolean;
  };
  fields?: AnyField[];
};
const fields = contentFeed.fields as AnyField[];
const field = (name: string) => fields.find((f) => f.name === name);

describe("content feed section (admin)", () => {
  it("is named and grouped", () => {
    expect([contentFeed.slug, contentFeed.labels?.singular, contentFeed.admin?.group]).toEqual(["contentFeed", "Content feed", "Content"]);
  });

  it("offers the three plain fill choices", () => {
    expect(field("fill")?.options).toEqual([
      { value: "automatic", label: "Automatic — newest items that match" },
      { value: "automaticWithPicks", label: "Automatic, with my picks first" },
      { value: "picksOnly", label: "Only the items I pick" },
    ]);
  });

  it("shows picks only when they're used", () => {
    const condition = field("picks")!.admin!.condition!;
    expect(condition({}, { fill: "automatic" })).toBe(false);
    expect(condition({}, { fill: "automaticWithPicks" })).toBe(true);
    expect(condition({}, { fill: "picksOnly" })).toBe(true);
  });

  it("never blocks publishing because a pick was unpublished later (it's skipped instead)", async () => {
    const picks = field("picks") as unknown as { validate?: (value: unknown, options: unknown) => unknown; filterOptions?: unknown };
    expect(picks.filterOptions).toBeTypeOf("function");
    expect(picks.validate).toBeTypeOf("function");
    expect(await picks.validate!([{ relationTo: "caseStudies", value: "unpublished-id" }], {})).toBe(true);
  });

  it("offers one Region filter, a Communities filter of audience tags, and Themes without them", () => {
    const f = (name: string) => field("filters")!.fields!.find((x) => x.name === name) as AnyField & { label?: string; filterOptions?: unknown; relationTo?: string; hasMany?: boolean };
    expect(f("regions")).toMatchObject({ label: "Region", hasMany: true });
    expect((f("communities")?.admin as { hidden?: boolean } | undefined)?.hidden).toBe(true);
    expect(f("audiences")).toMatchObject({ label: "Communities", type: "relationship", relationTo: "tags", hasMany: true, filterOptions: { category: { equals: "audience" } } });
    expect(f("tags")).toMatchObject({ label: "Themes", filterOptions: { category: { not_equals: "audience" } } });
  });

  it("tells editors events have no featured flag", () => {
    const featured = field("filters")!.fields!.find((f) => f.name === "featuredOnly");
    expect(featured?.admin?.description).toBe("Events have no featured flag, so they won't appear when this is on.");
  });

  it("offers 'upcoming only' just when events are shown", () => {
    const upcoming = field("filters")!.fields!.find((f) => f.name === "upcomingOnly")!;
    expect(upcoming.admin!.condition!({}, {}, { blockData: { kinds: ["newsPosts"] } })).toBe(false);
    expect(upcoming.admin!.condition!({}, {}, { blockData: { kinds: ["newsPosts", "events"] } })).toBe(true);
  });

  it("counts from 1 to 24, 6 by default", () => {
    expect(field("count")).toMatchObject({ min: 1, max: 24, defaultValue: 6 });
  });
});

describe("content feed section (site)", () => {
  it("carries its settings to the renderer, with picks and relations as plain ids", () => {
    const [block] = pageBlocks([
      {
        id: "cf",
        blockType: "contentFeed",
        heading: "Latest",
        intro: null,
        kinds: ["caseStudies", "newsPosts"],
        fill: "automaticWithPicks",
        picks: [
          { relationTo: "newsPosts", value: { id: "n1", title: "x" } },
          { relationTo: "caseStudies", value: "c2" },
          { relationTo: "caseStudies", value: null },
        ],
        filters: { regions: ["ssa"], communities: [{ id: "rc1" }, "rc2"], audiences: [{ id: "a1" }], tags: [{ id: "t1" }], organizations: [{ id: "o9" }, "o8"], featuredOnly: false, upcomingOnly: false },
        sort: "newest",
        count: 4,
        layout: "carousel",
        viewAll: { show: true, href: null, label: null },
      },
    ])! as Array<Record<string, unknown>>;
    expect(block._type).toBe("content-feed");
    expect(block.settings).toEqual({
      heading: "Latest",
      intro: null,
      kinds: ["caseStudies", "newsPosts"],
      fill: "automaticWithPicks",
      picks: [
        { kind: "newsPosts", id: "n1" },
        { kind: "caseStudies", id: "c2" },
      ],
      filters: { regions: ["ssa"], communityIds: ["rc1", "rc2"], audienceTagIds: ["a1"], tagIds: ["t1"], organizationIds: ["o9", "o8"], featuredOnly: false, upcomingOnly: false },
      sort: "newest",
      count: 4,
      layout: "carousel",
      viewAll: { show: true, href: null, label: null },
    });
  });
});
