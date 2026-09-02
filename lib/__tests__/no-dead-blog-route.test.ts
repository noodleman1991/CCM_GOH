import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { schema } from "@/sanity/schema";

describe("the dead /blog route is gone", () => {
  it("no longer registers a post document type", () => {
    const names = schema.types.map((t) => (t as { name: string }).name);
    expect(names).not.toContain("post");
  });

  it("does not link to /blog from the header", () => {
    expect(readFileSync("components/header/index.tsx", "utf8")).not.toContain('"/blog"');
  });

  it("does not link to /blog from the footer", () => {
    expect(readFileSync("components/footer.tsx", "utf8")).not.toContain('"/blog"');
  });

  it("does not emit /blog URLs in the sitemap", () => {
    expect(readFileSync("app/sitemap.ts", "utf8")).not.toContain("/blog/");
  });
});
