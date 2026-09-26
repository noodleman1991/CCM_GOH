import { describe, expect, it } from "vitest";
import { UPLOAD_CACHE_CONTROL, uploadObjectKeys, uploadNeedsCacheControl } from "@/payload/hooks/upload-cache-control";

/**
 * Upload filenames are randomised (payload/hooks/upload-filename.ts), so an
 * object's URL never carries different bytes: a year-long immutable
 * Cache-Control is safe on every object, and the hook stamps it on the
 * original and every generated size after the row is committed.
 */
describe("upload-cache-control", () => {
  const doc = {
    filename: "hero-1a2b.jpg",
    mimeType: "image/jpeg",
    prefix: "cms/media",
    sizes: {
      crop80x80: { filename: "hero-1a2b-80x80.jpg", mimeType: "image/jpeg" },
      max800: { filename: "hero-1a2b-800x420.webp", mimeType: "image/webp" },
      empty: { filename: null, mimeType: null },
    },
  };

  it("is a one-year immutable policy", () => {
    expect(UPLOAD_CACHE_CONTROL).toMatch(/max-age=31536000/);
    expect(UPLOAD_CACHE_CONTROL).toMatch(/\bimmutable\b/);
  });

  it("lists the original and every generated size with its own content type", () => {
    expect(uploadObjectKeys(doc)).toEqual([
      { key: "cms/media/hero-1a2b.jpg", contentType: "image/jpeg" },
      { key: "cms/media/hero-1a2b-80x80.jpg", contentType: "image/jpeg" },
      { key: "cms/media/hero-1a2b-800x420.webp", contentType: "image/webp" },
    ]);
  });

  it("copes with a prefix-less row and an SVG without sizes", () => {
    expect(uploadObjectKeys({ filename: "logo.svg", mimeType: "image/svg+xml" })).toEqual([
      { key: "logo.svg", contentType: "image/svg+xml" },
    ]);
    expect(uploadObjectKeys({ filename: null })).toEqual([]);
  });

  it("runs on create and on a replaced file, not on a caption edit", () => {
    expect(uploadNeedsCacheControl("create", doc, undefined)).toBe(true);
    expect(uploadNeedsCacheControl("update", doc, { ...doc, filename: "old-9z.jpg" })).toBe(true);
    const captionEdit = { ...doc, alt: "x" };
    expect(uploadNeedsCacheControl("update", doc, captionEdit)).toBe(false);
  });

  it("stays out of the Sanity import's way; the backfill script stamps those objects afterwards", () => {
    const imported = { ...doc, sanityAssetId: "image-abc-800x600-jpg" };
    expect(uploadNeedsCacheControl("create", imported, undefined)).toBe(false);
  });
});
