import { describe, expect, it, vi, beforeEach } from "vitest";

// generatePageMetadata's only Sanity-touching dependency is imageUrl; mock it
// directly rather than stubbing NEXT_PUBLIC_SANITY_PROJECT_ID/_DATASET (the
// approach content-images.test.ts uses for the real builder) — that lets this
// file import generatePageMetadata statically instead of loading the whole
// @sanity/image-url chain.
const mockImageUrl = vi.fn((_image: unknown, _opts?: unknown) => "https://cdn.example.com/og.jpg");
vi.mock("@/lib/content/images", () => ({
  imageUrl: (...args: [unknown, unknown?]) => mockImageUrl(...args),
}));

import { generatePageMetadata } from "@/lib/content/metadata";

beforeEach(() => {
  mockImageUrl.mockClear();
  delete process.env.NEXT_PUBLIC_SITE_ENV;
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
});

describe("generatePageMetadata", () => {
  it("resolves a plain string meta_title as-is", () => {
    const meta = generatePageMetadata({ page: { meta_title: "About us" }, slug: "about" });
    expect(meta.title).toBe("About us");
  });

  it("resolves a locale-keyed meta_title for the requested locale", () => {
    const meta = generatePageMetadata({
      page: { meta_title: { en: "About us", fr: "À propos" } },
      slug: "about",
      locale: "fr",
    });
    expect(meta.title).toBe("À propos");
  });

  it("falls back to English when the requested locale is missing", () => {
    const meta = generatePageMetadata({
      page: { meta_title: { en: "About us" } },
      slug: "about",
      locale: "ar",
    });
    expect(meta.title).toBe("About us");
  });

  it("defaults title to '' when meta_title is absent", () => {
    expect(generatePageMetadata({ page: {}, slug: "about" }).title).toBe("");
    expect(generatePageMetadata({ page: null, slug: "about" }).title).toBe("");
  });

  it("defaults description to '' when meta_description is absent", () => {
    expect(generatePageMetadata({ page: {}, slug: "about" }).description).toBe("");
  });

  it("passes meta_description through unchanged", () => {
    const meta = generatePageMetadata({ page: { meta_description: "A page about us." }, slug: "about" });
    expect(meta.description).toBe("A page about us.");
  });

  it("builds the canonical alternate from slug, treating 'index' as the root", () => {
    expect(generatePageMetadata({ page: {}, slug: "about" }).alternates.canonical).toBe("/about");
    expect(generatePageMetadata({ page: {}, slug: "index" }).alternates.canonical).toBe("/");
  });

  it("falls back to the site OG image and 1200x630 when there's no ogImage", () => {
    const meta = generatePageMetadata({ page: {}, slug: "about" });
    expect(meta.openGraph.images[0]).toEqual({
      url: "https://example.org/images/og-image.jpg",
      width: 1200,
      height: 630,
    });
    expect(mockImageUrl).not.toHaveBeenCalled();
  });

  it("resolves the OG image via imageUrl at quality 100 when ogImage is present", () => {
    const ogImage = { asset: { metadata: { dimensions: { width: 1600, height: 900 } } } };
    const meta = generatePageMetadata({ page: { ogImage }, slug: "about" });
    expect(mockImageUrl).toHaveBeenCalledWith(ogImage, { quality: 100 });
    expect(meta.openGraph.images[0]).toEqual({
      url: "https://cdn.example.com/og.jpg",
      width: 1600,
      height: 900,
    });
  });

  it("falls back to 1200x630 when ogImage has no dimensions metadata", () => {
    const meta = generatePageMetadata({ page: { ogImage: {} }, slug: "about" });
    expect(meta.openGraph.images[0].width).toBe(1200);
    expect(meta.openGraph.images[0].height).toBe(630);
  });

  describe("robots", () => {
    it("is 'noindex, nofollow' outside production, regardless of the noindex field", () => {
      expect(generatePageMetadata({ page: { noindex: false }, slug: "about" }).robots).toBe("noindex, nofollow");
    });

    // isProduction is read once at module scope (matching the original
    // sanity/lib/metadata.ts), so flipping NEXT_PUBLIC_SITE_ENV after this
    // file's static import of generatePageMetadata has no effect — these two
    // cases reset the module registry and re-import under the flag instead.
    it("in production, is 'noindex' when the page opts out", async () => {
      vi.resetModules();
      process.env.NEXT_PUBLIC_SITE_ENV = "production";
      const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
      expect(fresh({ page: { noindex: true }, slug: "about" }).robots).toBe("noindex");
    });

    it("in production, is 'index, follow' by default", async () => {
      vi.resetModules();
      process.env.NEXT_PUBLIC_SITE_ENV = "production";
      const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
      expect(fresh({ page: {}, slug: "about" }).robots).toBe("index, follow");
    });
  });
});
