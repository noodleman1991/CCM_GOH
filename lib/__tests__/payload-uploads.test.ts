import { existsSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import type { Field, ImageSize } from "payload";
import config from "@payload-config";
import { MEDIA_IMAGE_SIZES, Media, RESIZABLE_IMAGE_MIME_TYPES } from "@/payload/collections/media";
import { Files } from "@/payload/collections/files";

const uploadCollections = [Media, Files];

function findField(fields: Field[], name: string): Field | undefined {
  return fields.find((f) => "name" in f && f.name === name);
}

function sizeByName(name: string): ImageSize | undefined {
  return MEDIA_IMAGE_SIZES.find((s) => s.name === name);
}

describe("payload upload collections", () => {
  it("declares exactly the two upload collections, each with an `upload` config", () => {
    expect(uploadCollections.map((c) => c.slug)).toEqual(["media", "files"]);
    for (const c of uploadCollections) {
      expect(c.upload, `${c.slug} must declare upload`).toBeTruthy();
      expect(typeof c.upload).toBe("object");
    }
  });

  it("restricts `media` to images — a PDF cannot be uploaded to it", () => {
    const upload = Media.upload as { mimeTypes?: string[] };
    expect(upload.mimeTypes).toEqual(["image/*"]);
    expect(upload.mimeTypes).not.toContain("application/pdf");
  });

  it("keeps images out of `files`, and accepts every mime type the schema's file fields offer", () => {
    const mimeTypes = (Files.upload as { mimeTypes?: string[] }).mimeTypes ?? [];
    // 48/48 real sanity.fileAsset documents are PDFs.
    expect(mimeTypes).toContain("application/pdf");
    // livedExperiences.videoFile's own accept list.
    expect(mimeTypes).toContain("video/mp4");
    expect(mimeTypes).toContain("video/webm");
    expect(mimeTypes.some((m) => m.startsWith("image/"))).toBe(false);
  });

  it("gives both collections a hidden, required, text `id` field — Sanity's _id, preserved verbatim", () => {
    for (const c of uploadCollections) {
      expect(findField(c.fields, "id")).toMatchObject({
        name: "id",
        type: "text",
        required: true,
        admin: { hidden: true },
      });
    }
  });

  it("gives both collections a unique `sanityAssetId`, so Task 11's import is idempotent", () => {
    for (const c of uploadCollections) {
      expect(findField(c.fields, "sanityAssetId")).toMatchObject({
        name: "sanityAssetId",
        type: "text",
        unique: true,
      });
    }
  });

  it("never names a field `status` — it collides with Payload's own `_status` enum type", () => {
    for (const c of uploadCollections) {
      expect(findField(c.fields, "status")).toBeUndefined();
    }
  });

  it("carries Sanity's lqip on `media` — 347/347 assets have one and 25 components render it as blurDataURL", () => {
    expect(findField(Media.fields, "lqip")).toMatchObject({ name: "lqip", type: "text" });
  });
});

describe("media imageSizes, derived from lib/content/images.ts", () => {
  it("covers every transform the site requests, and nothing else", () => {
    expect(MEDIA_IMAGE_SIZES.map((s) => s.name)).toEqual([
      // urlForCropped: fit("crop"), hotspot-aware
      "crop80x80", // carousel-2.tsx:118
      "crop320x320", // team-grid.tsx:208
      "crop800x450", // the five grid cards, isWide branch
      "crop800x533", // the same five + grid-post.tsx:95
      "crop800x600", // manual-content-block.tsx:91
      // urlFor: format("webp"), fit("max")
      "max400x225", // grid-lived-experience / case-study-card / lived-experience-card
      "max600x400", // lived-experience-card.tsx:106
      "max800x450", // featured-news-card + news/[slug], via CARD_ASPECT_SOURCE.wide
      "max800", // lived-experiences-carousel.tsx:83
      "max1100", // split-image.tsx:32, hero-1.tsx:167
      "max1200x675", // the four lead images + featured-news-card's lead variant
    ]);
  });

  it("gives every size the pixel box its call sites ask for", () => {
    const boxes = Object.fromEntries(
      MEDIA_IMAGE_SIZES.map((s) => [s.name, [s.width ?? null, s.height ?? null]]),
    );
    expect(boxes).toEqual({
      crop80x80: [80, 80],
      crop320x320: [320, 320],
      crop800x450: [800, 450],
      crop800x533: [800, 533],
      crop800x600: [800, 600],
      max400x225: [400, 225],
      max600x400: [600, 400],
      max800x450: [800, 450],
      max800: [800, null],
      max1100: [1100, null],
      max1200x675: [1200, 675],
    });
  });

  it("forces webp on the uncropped path only — urlFor does, urlForCropped uses auto('format')", () => {
    for (const size of MEDIA_IMAGE_SIZES) {
      if (size.name.startsWith("max")) {
        expect(size.formatOptions?.format, `${size.name} must be webp`).toBe("webp");
        expect(size.fit, `${size.name} mirrors fit("max")`).toBe("inside");
      } else {
        // auto("format") is a per-request AVIF/WebP choice the Sanity CDN makes.
        // Payload writes static files, so pinning one format here would discard
        // half of that behaviour; next/image negotiates instead.
        expect(size.formatOptions, `${size.name} must not pin a format`).toBeUndefined();
        expect(size.fit, `${size.name} mirrors fit("crop")`).toBe("cover");
      }
    }
  });

  it("never upscales — 83 of 347 assets are narrower than 800px and would otherwise emit null sizes", () => {
    for (const size of MEDIA_IMAGE_SIZES) {
      expect(size.withoutEnlargement, `${size.name}`).toBe(true);
    }
  });

  it("crops around the editor's hotspot, which is what urlForCropped existed for", () => {
    expect((Media.upload as { focalPoint?: boolean }).focalPoint).toBe(true);
    expect(sizeByName("crop800x450")?.fit).toBe("cover");
  });
});

describe("SVG transform bypass", () => {
  // sanity/lib/image.ts: "SVGs must bypass the CDN transform pipeline or they
  // get rasterized/cropped." In Payload the equivalent guarantee comes from
  // canResizeImage(), which decides whether an upload is handed to sharp at
  // all. This asserts against Payload's own copy of that list so an upgrade
  // that started resizing SVGs would fail here rather than in production.
  const canResizeImagePath = path.resolve(
    process.cwd(),
    "node_modules/payload/dist/uploads/canResizeImage.js",
  );

  it("Payload itself refuses to resize SVGs", () => {
    expect(
      existsSync(canResizeImagePath),
      "payload/dist/uploads/canResizeImage.js moved — re-verify that SVGs still bypass sharp",
    ).toBe(true);
    const source = readFileSync(canResizeImagePath, "utf8");
    expect(source).not.toContain("image/svg+xml");
    for (const mimeType of RESIZABLE_IMAGE_MIME_TYPES) {
      expect(source, `payload no longer resizes ${mimeType}`).toContain(mimeType);
    }
  });

  it("still accepts SVG uploads — media's mimeTypes admit them", () => {
    const mimeTypes = (Media.upload as { mimeTypes?: string[] }).mimeTypes ?? [];
    expect(mimeTypes).toContain("image/*");
    expect(RESIZABLE_IMAGE_MIME_TYPES as readonly string[]).not.toContain("image/svg+xml");
  });
});

describe("r2Storage wiring", () => {
  it("stores both upload collections on R2 rather than the local disk", async () => {
    const c = await config;
    for (const slug of ["media", "files"]) {
      const collection = c.collections.find((x) => x.slug === slug);
      expect(collection, `${slug} must be registered`).toBeTruthy();
      const upload = collection!.upload as { disableLocalStorage?: boolean };
      // Set by r2Storage() on every collection it adopts — its presence is
      // proof the plugin ran and claimed this collection.
      expect(upload.disableLocalStorage, `${slug} must not fall back to disk`).toBe(true);
      // The cloud-storage plugin adds this field to collections it manages.
      expect(findField(collection!.fields as Field[], "prefix")).toBeTruthy();
    }
  });
});
