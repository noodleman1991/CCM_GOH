import { describe, expect, it } from "vitest";
import config from "@payload-config";

describe("hub illustrations", () => {
  it("lets editors choose the picture news cards show when a story has none", async () => {
    const g = (await config).globals.find((x) => x.slug === "hubIllustrations")!;
    const f = g.fields.find((x) => "name" in x && x.name === "newsFallback") as { label?: string; type?: string } | undefined;
    expect(f?.type).toBe("group");
    expect(f?.label).toBe("News picture when a story has none");
  });
});
