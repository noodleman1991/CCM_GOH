import { describe, expect, it } from "vitest";
import { planShowAtlas, type RegionalPageAtlasRow } from "@/scripts/regional-pages/show-atlas";

describe("planShowAtlas", () => {
  it("plans only the pages whose atlas embed is explicitly false", () => {
    const rows: RegionalPageAtlasRow[] = [
      { id: "1", slug: "sub-saharan-africa", enabled: false },
      { id: "2", slug: "oceania", enabled: true },
      { id: "3", slug: "europe-and-northern-america", enabled: null },
      { id: "4", slug: "latin-america-and-the-caribbean", enabled: undefined },
    ];
    expect(planShowAtlas(rows)).toEqual([{ id: "1", slug: "sub-saharan-africa", enabled: false }]);
  });

  it("plans nothing when every page already shows the atlas (unset or true)", () => {
    const rows: RegionalPageAtlasRow[] = [
      { id: "1", slug: "oceania", enabled: true },
      { id: "2", slug: "northern-africa-and-western-asia", enabled: undefined },
    ];
    expect(planShowAtlas(rows)).toEqual([]);
  });
});
