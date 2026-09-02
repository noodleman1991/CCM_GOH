import { beforeAll, describe, expect, it } from "vitest";

/**
 * `sanity/env.ts` asserts NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET at import
 * time, and vitest doesn't load .env files into process.env. Static imports
 * of `@/sanity/lib/image` (directly, or transitively via
 * `@/lib/content/images`) would therefore throw before this file's own code
 * runs — ES imports are hoisted above any top-level `process.env` assignment
 * in the same file. Stubbing the vars in `beforeAll` and importing both
 * modules dynamically afterward sidesteps that, and lets this file exercise
 * the *real* `@sanity/image-url` builder rather than a hand-rolled mock —
 * which is what makes the byte-identity assertions below meaningful.
 */
let imageUrl: typeof import("@/lib/content/images").imageUrl;
let urlFor: typeof import("@/sanity/lib/image").urlFor;
let urlForCropped: typeof import("@/sanity/lib/image").urlForCropped;

const PROJECT_ID = "gm67v7rk";
const DATASET = "development";

beforeAll(async () => {
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = PROJECT_ID;
  process.env.NEXT_PUBLIC_SANITY_DATASET = DATASET;
  ({ urlFor, urlForCropped } = await import("@/sanity/lib/image"));
  ({ imageUrl } = await import("@/lib/content/images"));
});

// A real dereferenced Sanity image (GROQ's `asset->{...}` shape), sampled
// from a live caseStudy document in the `development` dataset.
const jpegImage = {
  asset: {
    _id: "image-270ae998fd4b397584bdcc5aac573c8e6f371e01-1920x1080-jpg",
    url: "https://cdn.sanity.io/images/gm67v7rk/development/270ae998fd4b397584bdcc5aac573c8e6f371e01-1920x1080.jpg",
    mimeType: "image/jpeg",
  },
  alt: "A case study cover",
};

// No SVG asset currently exists in either Sanity dataset (verified via the
// API), so this is synthetic — but it follows the exact `image-<id>-<w>x<h>-<ext>`
// asset-id shape @sanity/image-url's parser expects, matching what a real
// SVG partner logo (logo-cloud-1) would dereference to.
const svgImage = {
  asset: {
    _id: "image-abc123def456abc123def456abc123def456ab-512x512-svg",
    url: "https://cdn.sanity.io/images/gm67v7rk/development/abc123def456abc123def456abc123def456ab-512x512.svg",
    mimeType: "image/svg+xml",
  },
  alt: "Partner logo",
};

describe("imageUrl", () => {
  it("returns '' for null/undefined rather than throwing", () => {
    expect(imageUrl(null)).toBe("");
    expect(imageUrl(undefined)).toBe("");
  });

  it("returns '' for an unresolvable image rather than throwing", () => {
    expect(imageUrl({ foo: "bar" })).toBe("");
    expect(imageUrl("not an image")).toBe("");
    expect(imageUrl(42)).toBe("");
  });

  it("matches urlFor(img).url() exactly — plain, no options", () => {
    const before = urlFor(jpegImage).url();
    const after = imageUrl(jpegImage);
    expect(after).toBe(before);
    expect(after).toContain("fm=webp");
    expect(after).toContain("fit=max");
  });

  it("matches urlFor(img).width(n).url() exactly", () => {
    const before = urlFor(jpegImage).width(800).url();
    const after = imageUrl(jpegImage, { width: 800 });
    expect(after).toBe(before);
    expect(after).toContain("w=800");
  });

  it("matches urlFor(img).width(n).height(n).url() exactly — uncropped forces webp/max", () => {
    const before = urlFor(jpegImage).width(1200).height(675).url();
    const after = imageUrl(jpegImage, { width: 1200, height: 675 });
    expect(after).toBe(before);
    expect(after).toContain("w=1200");
    expect(after).toContain("h=675");
    expect(after).toContain("fm=webp");
    expect(after).toContain("fit=max");
  });

  it("matches urlForCropped(img, w, h).url() exactly — cropped uses fit=crop & auto=format, not forced webp", () => {
    const before = urlForCropped(jpegImage, 800, 450).url();
    const after = imageUrl(jpegImage, { width: 800, height: 450, crop: true });
    expect(after).toBe(before);
    expect(after).toContain("w=800");
    expect(after).toContain("h=450");
    expect(after).toContain("fit=crop");
    expect(after).toContain("auto=format");
    expect(after).not.toContain("fm=webp");
  });

  it("falls back to the uncropped path when crop is requested without both dimensions", () => {
    const before = urlFor(jpegImage).width(800).url();
    expect(imageUrl(jpegImage, { width: 800, crop: true })).toBe(before);
    expect(imageUrl(jpegImage, { height: 800, crop: true })).toBe(urlFor(jpegImage).height(800).url());
  });

  it("SVGs bypass the transform pipeline (uncropped) — identical to urlFor", () => {
    const before = urlFor(svgImage).url();
    const after = imageUrl(svgImage);
    expect(after).toBe(before);
    // No format/fit params — the raw asset URL shape, no query string at all.
    expect(after).not.toContain("fm=");
    expect(after).not.toContain("fit=");
    expect(after).toContain(".svg");
  });

  it("SVGs bypass the transform pipeline (cropped) — identical to urlForCropped", () => {
    const before = urlForCropped(svgImage, 80, 80).url();
    const after = imageUrl(svgImage, { width: 80, height: 80, crop: true });
    expect(after).toBe(before);
    expect(after).not.toContain("fit=crop");
    expect(after).not.toContain("w=80");
    expect(after).toContain(".svg");
  });
});
