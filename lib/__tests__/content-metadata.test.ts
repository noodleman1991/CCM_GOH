import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  // `activeBackend()` reads the environment per call, so an override left
  // behind by the Payload section below would silently redirect these.
  delete process.env.CONTENT_BACKEND_METADATA;
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_METADATA;
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

  it("omits the title when meta_title is absent, so the layout default applies instead of ' | Connecting Climate Minds'", () => {
    // Slice 10a: an empty title used to render through the template as a bare suffix.
    expect(generatePageMetadata({ page: {}, slug: "about" }).title).toBeUndefined();
    expect(generatePageMetadata({ page: null, slug: "about" }).title).toBeUndefined();
  });

  it("defaults description to '' when meta_description is absent", () => {
    expect(generatePageMetadata({ page: {}, slug: "about" }).description).toBe("");
  });

  it("passes meta_description through unchanged", () => {
    const meta = generatePageMetadata({ page: { meta_description: "A page about us." }, slug: "about" });
    expect(meta.description).toBe("A page about us.");
  });

  it("builds the locale-prefixed canonical from slug, treating 'index' as the root", () => {
    // Slice 10a: canonicals carry the locale; the default locale is English.
    expect(generatePageMetadata({ page: {}, slug: "about" }).alternates.canonical).toBe("/en/about");
    expect(generatePageMetadata({ page: {}, slug: "index" }).alternates.canonical).toBe("/en");
    expect(generatePageMetadata({ page: {}, slug: "about", locale: "fr" }).alternates.canonical).toBe("/fr/about");
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

// ---------------------------------------------------------------------------
// The Open Graph image under Payload — the decision this task owns
// ---------------------------------------------------------------------------
//
// `generatePageMetadata` is a formatter, not a query, so what swaps is which
// image source resolves `page.ogImage`. The five halves of the decision (see
// the module header) are pinned here one by one, because each of them is a
// choice that could plausibly have gone the other way:
//
//   WebP derivative, not the stored original      (the one true regression)
//   1200x675, not full size                       (crawler size ceilings)
//   absolute, while every other call site stays relative
//   `quality` dropped, not passed through
//   declared dimensions describing the derivative, not the source
//
// `imageSource` is exercised for real here rather than mocked: the whole point
// of asserting "it asks for 1200x675 and reports what it got" is lost if the
// thing that chooses is a stub.
// ---------------------------------------------------------------------------

/** The one document in the dataset that has an ogImage: a 3840x2160 PNG, as
 *  Payload stores it once `pages.ts` swaps in Task 14. */
const payloadOgImage = {
  asset: {
    id: "image-4e0940eff53a2dff5066595f7432d23f576dd8b2-3840x2160-png",
    url: "/payload-api/media/file/toolkits.png?prefix=cms%2Fmedia",
    mimeType: "image/png",
    width: 3840,
    height: 2160,
    sizes: {
      max1200x675: { url: "/payload-api/media/file/toolkits-1200x675.webp", width: 1200, height: 675 },
      max800: { url: "/payload-api/media/file/toolkits-800.webp", width: 800, height: 450 },
    },
  },
  alt: "Connecting Climate Minds' Toolkits",
};

describe("the Open Graph image, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_METADATA = "payload";
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
  });

  it("serves the max1200x675 WebP derivative, absolutised — not the stored PNG", async () => {
    const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
    const meta = fresh({ page: { ogImage: payloadOgImage }, slug: "research-and-action/toolkits" });
    expect(meta.openGraph.images[0].url).toBe(
      "https://example.org/payload-api/media/file/toolkits-1200x675.webp",
    );
    // Crawlers fetch this URL directly, so `next/image`'s AVIF/WebP re-encode
    // never applies and the stored PNG would be a real format regression.
    expect(meta.openGraph.images[0].url).not.toContain("toolkits.png");
  });

  it("declares the derivative's dimensions, not the 3840x2160 source's", async () => {
    const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
    const meta = fresh({ page: { ogImage: payloadOgImage }, slug: "x" });
    expect(meta.openGraph.images[0].width).toBe(1200);
    expect(meta.openGraph.images[0].height).toBe(675);
  });

  it("does not pass `quality` — Payload bakes its derivatives at upload", async () => {
    const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
    const { getImageSizeMisses, clearImageSizeMisses } = await import(
      "@/lib/content/internal/payload-image-source"
    );
    clearImageSizeMisses();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fresh({ page: { ogImage: payloadOgImage }, slug: "x" });
    // An `unsupported-quality` miss on every page render would drown the log
    // that exists to catch a genuinely unserved transform.
    expect(getImageSizeMisses().filter((m) => m.reason === "unsupported-quality")).toEqual([]);
    expect(mockImageUrl).not.toHaveBeenCalled();
    clearImageSizeMisses();
  });

  it("falls through to the Sanity builder for a Sanity-shaped ogImage, until pages.ts swaps", async () => {
    const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
    // `pages.ts` does not swap until Task 14, so with CONTENT_BACKEND=payload
    // this formatter is still handed Sanity's shape. Dropping to the site
    // default there would silently lose the one page that has an OG image.
    const sanityShaped = { asset: { _id: "image-abc-1600x900-png", metadata: { dimensions: { width: 1600, height: 900 } } } };
    const meta = fresh({ page: { ogImage: sanityShaped }, slug: "x" });
    expect(mockImageUrl).toHaveBeenCalledWith(sanityShaped, { quality: 100 });
    expect(meta.openGraph.images[0]).toEqual({
      url: "https://cdn.example.com/og.jpg",
      width: 1600,
      height: 900,
    });
  });

  it("still falls back to the site OG image when there is no ogImage at all", async () => {
    const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
    const meta = fresh({ page: {}, slug: "x" });
    expect(meta.openGraph.images[0]).toEqual({
      url: "https://example.org/images/og-image.jpg",
      width: 1200,
      height: 630,
    });
  });

  it("leaves an already-absolute URL alone", async () => {
    const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
    const absolute = {
      asset: {
        id: "image-x-100x100-png",
        url: "https://assets.example.net/x.png",
        width: 100,
        height: 100,
        sizes: {
          max1200x675: { url: "https://assets.example.net/x-1200x675.webp", width: 100, height: 56 },
        },
      },
    };
    const meta = fresh({ page: { ogImage: absolute }, slug: "x" });
    expect(meta.openGraph.images[0].url).toBe("https://assets.example.net/x-1200x675.webp");
  });

  it("records a loud miss and serves the original when no derivative covers the OG box", async () => {
    const { generatePageMetadata: fresh } = await import("@/lib/content/metadata");
    const { getImageSizeMisses, clearImageSizeMisses } = await import(
      "@/lib/content/internal/payload-image-source"
    );
    clearImageSizeMisses();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // An asset uploaded before `max1200x675` existed, or one whose derivatives
    // were `select`ed away. Serving the original silently is the one option
    // Task 4 ruled out, so this must be visible in the miss log.
    const uncovered = {
      asset: {
        id: "image-y-3840x2160-png",
        url: "/payload-api/media/file/y.png",
        width: 3840,
        height: 2160,
        sizes: { max800: { url: "/payload-api/media/file/y-800.webp", width: 800, height: 450 } },
      },
    };
    const meta = fresh({ page: { ogImage: uncovered }, slug: "x" });
    expect(meta.openGraph.images[0].url).toBe("https://example.org/payload-api/media/file/y.png");
    expect(getImageSizeMisses().map((m) => m.reason)).toContain("no-covering-size");
    expect(warn).toHaveBeenCalled();
    clearImageSizeMisses();
  });
});
