import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { pageBlocks } from "@/lib/content/internal/payload/blocks";

const MEDIA = { id: "m1", url: "https://cdn.example/l.webp", mimeType: "image/webp", lqip: "x", width: 400, height: 200, sizes: {} };
const org = (over: Record<string, unknown> = {}) => ({
  id: "o1", name: "Wellcome", slug: "wellcome", type: "foundation", showOnSite: true, logo: { asset: MEDIA, alt: null }, ...over,
});
const strip = (row: Record<string, unknown>) => (pageBlocks([{ id: "s", blockType: "logoCloud1", ...row }])![0] as { images: Array<Record<string, unknown>> | null });

describe("logo strip organisations", () => {
  it("shows each organisation's logo, named and linked to its page, before other logos", () => {
    const { images } = strip({ organizations: [org()], images: [{ id: "i", asset: MEDIA, alt: "Other" }] });
    expect(images!.map((i) => [i.name ?? i.alt, i.href])).toEqual([["Wellcome", "/organizations/wellcome"], ["Other", null]]);
    expect(images![0]).toMatchObject({ alt: "Wellcome", orgType: "foundation" });
  });
  it("leaves out hidden organisations and ones that no longer exist", () => {
    const { images } = strip({ organizations: [org({ showOnSite: false }), "deleted-id", null] });
    expect(images).toBeNull();
  });
  it("keeps an organisation with no logo, as its name", () => {
    const { images } = strip({ organizations: [org({ logo: null })] });
    expect(images![0]).toMatchObject({ name: "Wellcome", href: "/organizations/wellcome", asset: null });
  });
});
