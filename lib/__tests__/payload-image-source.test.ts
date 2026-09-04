import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Payload image source, tested against real rows.
 *
 * Unlike `payload-source.test.ts` there is nothing to mock here: this module
 * never opens a connection. A Payload media document already carries every
 * derivative URL Payload generated for it, so resolving an image to a URL is
 * pure arithmetic over a document the domain readers hand in — which is the
 * whole reason it can be a separate file from the read primitives.
 *
 * The two fixtures below are verbatim rows from the dev `payload_cms.media`
 * table (read-only probe, 2026-09-05), with `lqip` truncated: a 2 KB base64
 * string proves nothing a 30-character one does not. Everything else — the
 * URL encoding of the spaces and parentheses in the filename, the fact that
 * `max1100` on an 810px-wide source came back 810x873, the `.png` crops
 * beside the `.webp` maxes — is exactly what the database holds.
 */
import { MEDIA_IMAGE_SIZES } from "@/payload/collections/media";
import {
  blurDataURL,
  clearImageSizeMisses,
  getImageSizeMisses,
  imageUrl,
} from "@/lib/content/internal/payload-image-source";

/** `image-00336d924f7337fed2c5b3794365a8d158926dd7-810x873-png`, a portrait
 *  PNG used by the team grid. Chosen because it is portrait and smaller than
 *  several of the boxes, so every `fit: inside` subtlety shows up in it. */
const pngMedia = {
  id: "image-00336d924f7337fed2c5b3794365a8d158926dd7-810x873-png",
  filename: "Team 2 (1).png",
  mimeType: "image/png",
  filesize: 476358,
  width: 810,
  height: 873,
  focalX: 50,
  focalY: 50,
  lqip: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
  url: "/payload-api/media/file/Team%202%20(1).png",
  sizes: {
    crop80x80: { url: "/payload-api/media/file/Team%202%20(1)-80x80.png", width: 80, height: 80, mimeType: "image/png" },
    crop320x320: { url: "/payload-api/media/file/Team%202%20(1)-320x320.png", width: 320, height: 320, mimeType: "image/png" },
    crop800x450: { url: "/payload-api/media/file/Team%202%20(1)-800x450.png", width: 800, height: 450, mimeType: "image/png" },
    crop800x533: { url: "/payload-api/media/file/Team%202%20(1)-800x533.png", width: 800, height: 533, mimeType: "image/png" },
    crop800x600: { url: "/payload-api/media/file/Team%202%20(1)-800x600.png", width: 800, height: 600, mimeType: "image/png" },
    max400x225: { url: "/payload-api/media/file/Team%202%20(1)-209x225.webp", width: 209, height: 225, mimeType: "image/webp" },
    max600x400: { url: "/payload-api/media/file/Team%202%20(1)-371x400.webp", width: 371, height: 400, mimeType: "image/webp" },
    max800x450: { url: "/payload-api/media/file/Team%202%20(1)-418x450.webp", width: 418, height: 450, mimeType: "image/webp" },
    max800: { url: "/payload-api/media/file/Team%202%20(1)-800x862.webp", width: 800, height: 862, mimeType: "image/webp" },
    max1100: { url: "/payload-api/media/file/Team%202%20(1)-810x873.webp", width: 810, height: 873, mimeType: "image/webp" },
    max1200x675: { url: "/payload-api/media/file/Team%202%20(1)-626x675.webp", width: 626, height: 675, mimeType: "image/webp" },
  },
};

/** The one `image/avif` asset. Phase 2 gave it real dimensions (3840x1280);
 *  it is in `RESIZABLE_IMAGE_MIME_TYPES`, so it has a full set of sizes, and
 *  its crops keep AVIF while its maxes are WebP. */
const avifMedia = {
  id: "image-1e53c8216d88a819ddc8ef94749e4f380103ee4e-3840x1280-heif",
  filename: "file-20260306-57-3ugri.avif",
  mimeType: "image/avif",
  width: 3840,
  height: 1280,
  lqip: "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYH",
  url: "/payload-api/media/file/file-20260306-57-3ugri.avif",
  sizes: {
    crop80x80: { url: "/payload-api/media/file/file-20260306-57-3ugri-80x80.avif", width: 80, height: 80, mimeType: "image/avif" },
    crop320x320: { url: "/payload-api/media/file/file-20260306-57-3ugri-320x320.avif", width: 320, height: 320, mimeType: "image/avif" },
    crop800x450: { url: "/payload-api/media/file/file-20260306-57-3ugri-800x450.avif", width: 800, height: 450, mimeType: "image/avif" },
    crop800x533: { url: "/payload-api/media/file/file-20260306-57-3ugri-800x533.avif", width: 800, height: 533, mimeType: "image/avif" },
    crop800x600: { url: "/payload-api/media/file/file-20260306-57-3ugri-800x600.avif", width: 800, height: 600, mimeType: "image/avif" },
    max400x225: { url: "/payload-api/media/file/file-20260306-57-3ugri-400x133.webp", width: 400, height: 133, mimeType: "image/webp" },
    max600x400: { url: "/payload-api/media/file/file-20260306-57-3ugri-600x200.webp", width: 600, height: 200, mimeType: "image/webp" },
    max800x450: { url: "/payload-api/media/file/file-20260306-57-3ugri-800x267.webp", width: 800, height: 267, mimeType: "image/webp" },
    max800: { url: "/payload-api/media/file/file-20260306-57-3ugri-800x267.webp", width: 800, height: 267, mimeType: "image/webp" },
    max1100: { url: "/payload-api/media/file/file-20260306-57-3ugri-1100x367.webp", width: 1100, height: 367, mimeType: "image/webp" },
    max1200x675: { url: "/payload-api/media/file/file-20260306-57-3ugri-1200x400.webp", width: 1200, height: 400, mimeType: "image/webp" },
  },
};

/**
 * Synthetic, because there is no SVG in either dataset today — the same
 * reason `content-images.test.ts`'s SVG fixture is synthetic. What matters is
 * the shape Payload produces for one: `mimeType: "image/svg+xml"` and **no
 * `sizes` at all**, because `canResizeImage` excludes SVG.
 */
const svgMedia = {
  id: "image-abc123def456abc123def456abc123def456ab-512x512-svg",
  filename: "partner-logo.svg",
  mimeType: "image/svg+xml",
  width: 512,
  height: 512,
  lqip: null,
  url: "/payload-api/media/file/partner-logo.svg",
};

/** The `imageField()` group shape (`payload/blocks/shared.ts`): the asset is
 *  nested under `asset`, with per-usage localized alt beside it. */
const asField = (media: unknown, alt = "Alt text") => ({ asset: media, alt });

beforeEach(() => {
  clearImageSizeMisses();
});

describe("imageUrl against Payload media", () => {
  it("returns '' rather than throwing for anything unresolvable", () => {
    expect(imageUrl(null)).toBe("");
    expect(imageUrl(undefined)).toBe("");
    expect(imageUrl({})).toBe("");
    expect(imageUrl("not an image")).toBe("");
    expect(imageUrl({ foo: "bar" })).toBe("");
    // depth: 0 leaves the upload as a bare id — there is no URL to build.
    expect(imageUrl(asField("image-00336d924f7337fed2c5b3794365a8d158926dd7-810x873-png"))).toBe("");
  });

  it("accepts a bare media document, an imageField group, and a flat ContentImage", () => {
    expect(imageUrl(pngMedia, { width: 800 })).toBe(pngMedia.sizes.max800.url);
    expect(imageUrl(asField(pngMedia), { width: 800 })).toBe(pngMedia.sizes.max800.url);
    // ContentImage is `{ url, alt?, caption? }` — no sizes to choose from.
    expect(imageUrl({ url: "https://example.test/x.png" }, { width: 800 })).toBe("https://example.test/x.png");
  });

  it("hits every one of the eleven named sizes exactly, from the options its call sites pass", () => {
    // Each entry is a real call site's options; see payload/collections/media.ts
    // for the citation per size.
    const callSites: [Parameters<typeof imageUrl>[1], keyof typeof pngMedia.sizes][] = [
      [{ width: 80, height: 80, crop: true }, "crop80x80"],
      [{ width: 320, height: 320, crop: true }, "crop320x320"],
      [{ width: 800, height: 450, crop: true }, "crop800x450"],
      [{ width: 800, height: 533, crop: true }, "crop800x533"],
      [{ width: 800, height: 600, crop: true }, "crop800x600"],
      [{ width: 400, height: 225 }, "max400x225"],
      [{ width: 600, height: 400 }, "max600x400"],
      [{ width: 800, height: 450 }, "max800x450"],
      [{ width: 800 }, "max800"],
      [{ width: 1100 }, "max1100"],
      [{ width: 1200, height: 675 }, "max1200x675"],
    ];
    for (const [opts, size] of callSites) {
      expect(imageUrl(pngMedia, opts)).toBe(pngMedia.sizes[size].url);
    }
    expect(callSites).toHaveLength(MEDIA_IMAGE_SIZES.length);
    expect(getImageSizeMisses()).toEqual([]);
  });

  it("keeps the crop/uncrop format split: crops keep the source format, maxes are webp", () => {
    expect(imageUrl(pngMedia, { width: 800, height: 450, crop: true })).toMatch(/\.png$/);
    expect(imageUrl(pngMedia, { width: 800, height: 450 })).toMatch(/\.webp$/);
    expect(imageUrl(avifMedia, { width: 800, height: 450, crop: true })).toMatch(/\.avif$/);
    expect(imageUrl(avifMedia, { width: 800, height: 450 })).toMatch(/\.webp$/);
  });

  it("distinguishes cropped from uncropped at the same box — they are different images", () => {
    expect(imageUrl(pngMedia, { width: 800, height: 450, crop: true })).toBe(pngMedia.sizes.crop800x450.url);
    expect(imageUrl(pngMedia, { width: 800, height: 450 })).toBe(pngMedia.sizes.max800x450.url);
  });

  it("ignores `crop` without both dimensions, exactly as the Sanity builder does", () => {
    // lib/content/images.ts: `if (crop && width && height)`.
    expect(imageUrl(pngMedia, { width: 800, crop: true })).toBe(pngMedia.sizes.max800.url);
  });
});

describe("the SVG bypass", () => {
  it("returns an SVG's original URL unmodified, whatever was asked for", () => {
    expect(imageUrl(svgMedia)).toBe(svgMedia.url);
    expect(imageUrl(svgMedia, { width: 800 })).toBe(svgMedia.url);
    expect(imageUrl(svgMedia, { width: 80, height: 80, crop: true })).toBe(svgMedia.url);
    expect(imageUrl(asField(svgMedia), { width: 1200, height: 675 })).toBe(svgMedia.url);
  });

  it("does not record a miss for an SVG — having no derivatives is the rule, not a gap", () => {
    imageUrl(svgMedia, { width: 999, height: 111, crop: true });
    expect(getImageSizeMisses()).toEqual([]);
  });
});

describe("what happens on a size miss", () => {
  // Every miss warns by design; the spy keeps the suite's own output clean
  // and lets one test below assert how often it fired.
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it("picks the nearest size up rather than the nearest size at all", () => {
    // A 200x200 crop is covered by crop320x320 (same aspect, larger) — never
    // by crop80x80, which would be an upscale.
    expect(imageUrl(pngMedia, { width: 200, height: 200, crop: true })).toBe(pngMedia.sizes.crop320x320.url);
    // 1000x563 uncropped is 16:9 and covered by the 1200x675 box.
    expect(imageUrl(pngMedia, { width: 1000, height: 563 })).toBe(pngMedia.sizes.max1200x675.url);
    // Width-only requests may only be answered by width-only boxes: a box
    // with a height ceiling would silently constrain the other axis.
    expect(imageUrl(pngMedia, { width: 900 })).toBe(pngMedia.sizes.max1100.url);
    expect(imageUrl(pngMedia, { width: 300 })).toBe(pngMedia.sizes.max800.url);
  });

  it("never substitutes a crop of a different aspect ratio", () => {
    // 4:1 — no crop size has it. crop800x450 is bigger in both axes but would
    // hand back a different picture.
    expect(imageUrl(pngMedia, { width: 400, height: 100, crop: true })).toBe(pngMedia.url);
    expect(getImageSizeMisses()).toHaveLength(1);
  });

  it("records a miss, loudly, when it falls through to the original", () => {
    expect(imageUrl(pngMedia, { width: 2400 })).toBe(pngMedia.url);
    const misses = getImageSizeMisses();
    expect(misses).toHaveLength(1);
    expect(misses[0]).toMatchObject({ reason: "no-covering-size", width: 2400, crop: false, count: 1 });
    expect(warn).toHaveBeenCalledTimes(1);
    // The same request a second time is the same gap, not a second one: a warn
    // per render would drown the log it is meant to surface in.
    imageUrl(avifMedia, { width: 2400 });
    expect(getImageSizeMisses()).toHaveLength(1);
    expect(getImageSizeMisses()[0].count).toBe(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("records `quality` as unsupported — no derivative can express it", () => {
    // lib/content/metadata.ts:72, the Open Graph image.
    const url = imageUrl(pngMedia, { quality: 100 });
    expect(url).toBe(pngMedia.url);
    expect(getImageSizeMisses()).toHaveLength(1);
    expect(getImageSizeMisses()[0]).toMatchObject({ reason: "unsupported-quality", quality: 100 });
  });

  it("does not treat a dimension-less request as a miss — the original is the right answer", () => {
    // Sanity's `fit("max")` with no width returns the asset at full size, and
    // no derivative reproduces full resolution. The twelve dimension-less call
    // sites all render through next/image, which re-encodes.
    expect(imageUrl(pngMedia)).toBe(pngMedia.url);
    expect(imageUrl(asField(pngMedia))).toBe(pngMedia.url);
    expect(getImageSizeMisses()).toEqual([]);
  });
});

describe("blurDataURL", () => {
  it("returns the stored lqip — 347/347 media rows carry one and 25 components render it", () => {
    expect(blurDataURL(pngMedia)).toBe(pngMedia.lqip);
    expect(blurDataURL(asField(pngMedia))).toBe(pngMedia.lqip);
  });

  it("returns the avif asset's lqip too — it is a real row, not an edge case to skip", () => {
    expect(blurDataURL(avifMedia)).toBe(avifMedia.lqip);
    expect(blurDataURL(avifMedia)).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("returns undefined, never '', when there is nothing to show", () => {
    // `placeholder="blur"` with an empty blurDataURL is a next/image error;
    // undefined is what the 25 call sites' `?? undefined` / `|| undefined`
    // already expect.
    expect(blurDataURL(svgMedia)).toBeUndefined();
    expect(blurDataURL(null)).toBeUndefined();
    expect(blurDataURL(undefined)).toBeUndefined();
    expect(blurDataURL({})).toBeUndefined();
    expect(blurDataURL({ url: "https://example.test/x.png" })).toBeUndefined();
    expect(blurDataURL(asField({ ...pngMedia, lqip: "   " }))).toBeUndefined();
  });
});

describe("drift guards", () => {
  it("builds its size keys from the collection's own list, so the two cannot drift", () => {
    // Every generated size must be reachable by some (width, height, crop)
    // triple, or it is dead weight in the schema.
    for (const size of MEDIA_IMAGE_SIZES) {
      const crop = size.name.startsWith("crop");
      const opts = { width: size.width ?? undefined, height: size.height ?? undefined, crop };
      const expected = (pngMedia.sizes as Record<string, { url: string }>)[size.name];
      expect(imageUrl(pngMedia, opts)).toBe(expected.url);
    }
    expect(getImageSizeMisses()).toEqual([]);
  });

  it("falls through to the original when a derivative exists in the schema but not on the row", () => {
    const partial = { ...pngMedia, sizes: { ...pngMedia.sizes, max800: { url: null } } };
    // max800's own box is unavailable, so the next covering width-only box wins.
    expect(imageUrl(partial, { width: 800 })).toBe(pngMedia.sizes.max1100.url);
  });
});
