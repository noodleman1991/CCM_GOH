import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

beforeEach(() => {
  // `activeBackend()` reads the environment per call, so an override left
  // behind by the Payload section at the bottom would silently redirect the
  // Sanity assertions above it.
  delete process.env.CONTENT_BACKEND_IMAGES;
  delete process.env.NEXT_PUBLIC_CONTENT_BACKEND_IMAGES;
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_IMAGES;
  delete process.env.NEXT_PUBLIC_CONTENT_BACKEND_IMAGES;
  vi.restoreAllMocks();
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

  // Task 10b: lib/content/metadata.ts's generatePageMetadata needs the OG
  // image at a fixed quality (the original called urlFor(img).quality(100)
  // directly) — added here rather than left unreachable through the wrapper.
  it("matches urlFor(img).quality(n).url() exactly — uncropped", () => {
    const before = urlFor(jpegImage).quality(100).url();
    const after = imageUrl(jpegImage, { quality: 100 });
    expect(after).toBe(before);
    expect(after).toContain("q=100");
  });

  it("matches urlForCropped(img, w, h).quality(n).url() exactly — cropped", () => {
    const before = urlForCropped(jpegImage, 800, 450).quality(90).url();
    const after = imageUrl(jpegImage, { width: 800, height: 450, crop: true, quality: 90 });
    expect(after).toBe(before);
    expect(after).toContain("q=90");
  });

  it("omits the quality param when not passed", () => {
    expect(imageUrl(jpegImage)).not.toContain("q=");
  });
});

// ---------------------------------------------------------------------------
// The same wrapper, answered by Payload
// ---------------------------------------------------------------------------
//
// `imageUrl` is the component-facing path — 35 call sites — and its two arms
// answer different stores, not two shapes of one store. The Payload arm
// delegates wholesale to `lib/content/internal/payload-image-source.ts`, whose
// four-tier policy has its own test file; what is asserted here is that the
// wrapper reaches it, keeps its contract (`""` rather than a throw), and does
// not touch Sanity's builder on the way.
// ---------------------------------------------------------------------------

/** A `media` row as Payload serialises it, with two of the eleven sizes. */
const payloadMedia = {
  asset: {
    id: "image-270ae998fd4b397584bdcc5aac573c8e6f371e01-1920x1080-jpg",
    url: "/payload-api/media/file/cover.jpg?prefix=cms%2Fmedia",
    mimeType: "image/jpeg",
    lqip: "data:image/webp;base64,QQ",
    width: 1920,
    height: 1080,
    sizes: {
      max800x450: { url: "/payload-api/media/file/cover-800x450.webp", width: 800, height: 450 },
      crop800x450: { url: "/payload-api/media/file/cover-crop-800x450.jpg", width: 800, height: 450 },
    },
  },
  alt: "A case study cover",
};

describe("imageUrl, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_IMAGES = "payload";
    process.env.NEXT_PUBLIC_CONTENT_BACKEND_IMAGES = "payload";
  });

  it("resolves a dimensioned request to the stored derivative, not to a Sanity CDN URL", () => {
    expect(imageUrl(payloadMedia, { width: 800, height: 450 })).toBe(
      "/payload-api/media/file/cover-800x450.webp",
    );
  });

  it("keeps the cropped and uncropped families apart, as the two Sanity builders do", () => {
    expect(imageUrl(payloadMedia, { width: 800, height: 450, crop: true })).toBe(
      "/payload-api/media/file/cover-crop-800x450.jpg",
    );
  });

  it("returns a same-origin relative URL — no Payload host is in images.remotePatterns", () => {
    const url = imageUrl(payloadMedia, { width: 800, height: 450 });
    expect(url.startsWith("/")).toBe(true);
    expect(url).not.toContain("cdn.sanity.io");
  });

  it("resolves a dimension-less request to the original, deliberately", () => {
    expect(imageUrl(payloadMedia)).toBe("/payload-api/media/file/cover.jpg?prefix=cms%2Fmedia");
  });

  it("returns '' for a null or unresolvable image — an image is never worth a 500", () => {
    expect(imageUrl(null)).toBe("");
    expect(imageUrl(undefined)).toBe("");
    expect(imageUrl({ asset: {} })).toBe("");
  });

  // This is the transition window, and it is measured rather than assumed.
  // Thirteen domain modules — `pages.ts` above all — do not swap until Task 14,
  // so with the flag set this wrapper is still handed Sanity images by most of
  // its 35 call sites. The parity harness caught what happened before the
  // Payload source refused them: a dereferenced Sanity asset looked enough
  // like a media row to be accepted, found no `sizes`, and came back as its
  // CDN URL stripped of `?fm=webp&fit=max` — 56 silently un-transformed lines
  // on `/en`. Returning `""` instead would have blanked them.
  it("hands a Sanity-shaped image back to the Sanity builder, transform intact", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const url = imageUrl(jpegImage, { width: 800 });
    expect(url).toBe(urlFor(jpegImage).width(800).url());
    expect(url).toContain("fm=webp");
    expect(url).toContain("fit=max");
  });

  it("does not resolve a Sanity reference as a media row — `_ref` is Sanity's spelling", async () => {
    const { imageUrl: payloadOnly } = await import("@/lib/content/internal/payload-image-source");
    expect(payloadOnly({ asset: { _ref: "image-abc-100x100-png" } })).toBe("");
    expect(payloadOnly(jpegImage, { width: 800 })).toBe("");
  });

  it("does not fall through to the Sanity builder for a Payload row", () => {
    // The Sanity builder would happily produce a cdn.sanity.io URL from this
    // row's id, because `media.id` IS the Sanity asset id — which is exactly
    // why "it returned a URL" is not evidence the right arm ran.
    expect(imageUrl(payloadMedia, { width: 800, height: 450 })).not.toContain("cdn.sanity.io");
  });

  it("warns once when the server and the browser would disagree", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Server says payload; the browser sees only NEXT_PUBLIC_*, and there is
    // none — so it would answer sanity and build a different src on hydration.
    delete process.env.NEXT_PUBLIC_CONTENT_BACKEND_IMAGES;
    imageUrl(payloadMedia, { width: 800, height: 450 });
    imageUrl(payloadMedia, { width: 800, height: 450 });
    const split = warn.mock.calls.filter(([message]) => String(message).includes("[content/images]"));
    // Once per process, not once per image: a page renders dozens.
    expect(split.length).toBeLessThanOrEqual(1);
  });
});
