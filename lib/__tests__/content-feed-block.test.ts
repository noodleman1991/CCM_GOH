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
        filters: { regions: ["ssa"], communities: [{ id: "rc1" }, "rc2"], tags: [{ id: "t1" }], featuredOnly: false, upcomingOnly: false },
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
      filters: { regions: ["ssa"], communityIds: ["rc1", "rc2"], tagIds: ["t1"], featuredOnly: false, upcomingOnly: false },
      sort: "newest",
      count: 4,
      layout: "carousel",
      viewAll: { show: true, href: null, label: null },
    });
  });
});
