/**
 * `lib/content/internal/image-shape.ts`, and the ratchet that keeps it the only
 * copy.
 *
 * The shape it produces is invisible to the rendered DOM: a component reads
 * `image.asset.url` whatever order the keys sit in, and `toEqual` does not
 * compare key order either. Both times this layer drifted on an image — Task
 * 13's `{width, height}` for Sanity's `{height, width}`, and the six unsorted
 * groups this file's extraction found — it drifted silently, and was caught
 * only by diffing an API response or an RSC flight payload.
 *
 * So the assertions below compare `Object.keys(...)` and `JSON.stringify(...)`,
 * not just values, and the last block reads the readers' own source to fail if
 * one of them starts building the shape by hand again.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  altString,
  assetShape,
  flattenedMedia,
  imageGroup,
  mediaOf,
  type PayloadMediaRow,
} from "@/lib/content/internal/image-shape";

const MEDIA: PayloadMediaRow = {
  id: "image-abc-1200x800-jpg",
  url: "/payload-api/media/file/photo.jpg",
  mimeType: "image/jpeg",
  lqip: "data:image/png;base64,AAAA",
  width: 1200,
  height: 800,
  sizes: { card: { url: "/payload-api/media/file/photo-400.jpg" } },
};

describe("assetShape", () => {
  it("holds exactly the keys the projection names, and no others", () => {
    expect(Object.keys(assetShape(MEDIA, ["url"]))).toEqual(["url"]);
    expect(Object.keys(assetShape(MEDIA, ["_id", "url"]))).toEqual(["_id", "url"]);
    expect(Object.keys(assetShape(MEDIA, ["_id", "url", "mimeType"]))).toEqual([
      "_id",
      "mimeType",
      "url",
    ]);
  });

  it("emits its keys in the alphabetical order Sanity serializes them in", () => {
    const asset = assetShape(MEDIA, ["_id", "url", "mimeType", "lqip", "dimensions"]);
    expect(Object.keys(asset)).toEqual(["_id", "metadata", "mimeType", "url"]);
    expect(Object.keys(asset.metadata as object)).toEqual(["dimensions", "lqip"]);
  });

  it("emits dimensions as {height, width} — the pair Task 13 found reversed", () => {
    const asset = assetShape(MEDIA, ["_id", "url", "dimensions"]);
    const metadata = asset.metadata as { dimensions: unknown };
    expect(JSON.stringify(metadata.dimensions)).toBe('{"height":800,"width":1200}');
  });

  it("omits metadata entirely when neither lqip nor dimensions is projected", () => {
    expect(assetShape(MEDIA, ["_id", "url", "mimeType"])).not.toHaveProperty("metadata");
  });

  it("carries lqip without dimensions when only lqip is projected", () => {
    const asset = assetShape(MEDIA, ["_id", "url", "lqip"]);
    expect(asset.metadata).toEqual({ lqip: MEDIA.lqip });
  });

  it("reads a files row's filename and filesize as Sanity's originalFilename and size", () => {
    const file: PayloadMediaRow = {
      id: "file-1",
      url: "/payload-api/files/file/a.pdf",
      filename: "a.pdf",
      filesize: 4096,
      mimeType: "application/pdf",
    };
    expect(assetShape(file, ["_id", "url", "originalFilename", "size", "mimeType"])).toEqual({
      _id: "file-1",
      mimeType: "application/pdf",
      originalFilename: "a.pdf",
      size: 4096,
      url: "/payload-api/files/file/a.pdf",
    });
  });

  it("emits null for a projected key the row does not set — what GROQ returns", () => {
    const bare: PayloadMediaRow = { id: "m1", url: "/u.png" };
    expect(assetShape(bare, ["_id", "url", "mimeType", "lqip", "dimensions"])).toEqual({
      _id: "m1",
      metadata: { dimensions: null, lqip: null },
      mimeType: null,
      url: "/u.png",
    });
  });

  it('drops those keys instead under unset:"omit", for rich-text alone', () => {
    const bare: PayloadMediaRow = { id: "m1", url: "/u.png" };
    expect(
      assetShape(bare, ["_id", "url", "mimeType", "lqip", "dimensions"], { unset: "omit" }),
    ).toEqual({ _id: "m1", url: "/u.png" });
  });

  it('keeps a partial dimension pair under unset:"omit"', () => {
    const half: PayloadMediaRow = { id: "m1", url: "/u.png", width: 10 };
    const asset = assetShape(half, ["_id", "url", "dimensions"], { unset: "omit" });
    expect(asset.metadata).toEqual({ dimensions: { width: 10 } });
  });

  it("spells a missing url the way the caller asks", () => {
    const noUrl: PayloadMediaRow = { id: "m1" };
    expect(assetShape(noUrl, ["url"])).toEqual({ url: null });
    expect(assetShape(noUrl, ["url"], { urlWhenMissing: "" })).toEqual({ url: "" });
  });
});

describe("imageGroup", () => {
  it("emits asset, the projected group keys and the flattened media row, sorted", () => {
    const group = imageGroup(
      { asset: MEDIA, alt: { en: "A photo" } },
      { asset: ["_id", "url", "mimeType", "lqip", "dimensions"], keys: ["alt", "caption"] },
    );
    expect(Object.keys(group as object)).toEqual([
      "alt",
      "asset",
      "caption",
      "height",
      "lqip",
      "mimeType",
      "sizes",
      "url",
      "width",
    ]);
    expect(group?.alt).toBe("A photo");
    // Projected but declared by neither schema, so null on every document.
    expect(group?.caption).toBeNull();
  });

  it("emits only the group keys the projection names", () => {
    const group = imageGroup({ asset: MEDIA, alt: { en: "x" } }, { asset: ["_id", "url"] });
    expect(group).not.toHaveProperty("alt");
    expect(group).not.toHaveProperty("caption");
  });

  it("emits hotspot and crop as null — Payload models focal points on the row", () => {
    const group = imageGroup(
      { asset: MEDIA },
      { asset: ["url"], keys: ["hotspot", "crop"] },
    );
    expect(group?.hotspot).toBeNull();
    expect(group?.crop).toBeNull();
  });

  it("omits the flattened media row when the caller says so", () => {
    const group = imageGroup({ asset: MEDIA }, { asset: ["url"], flatten: false });
    expect(Object.keys(group as object)).toEqual(["asset"]);
  });

  it("is null for an absent group, an unresolved upload and a row with no url", () => {
    expect(imageGroup(null, { asset: ["url"] })).toBeNull();
    expect(imageGroup({ asset: "media-id-only" }, { asset: ["url"] })).toBeNull();
    expect(imageGroup({ asset: { id: "m1" } }, { asset: ["url"] })).toBeNull();
  });
});

describe("the flattened media row", () => {
  it("is the six fields payload-image-source unwraps before it reaches asset._id", () => {
    expect(flattenedMedia(MEDIA)).toEqual({
      url: MEDIA.url,
      mimeType: MEDIA.mimeType,
      width: MEDIA.width,
      height: MEDIA.height,
      lqip: MEDIA.lqip,
      sizes: MEDIA.sizes,
    });
  });

  it("nulls each of them rather than leaving it absent", () => {
    expect(flattenedMedia({ id: "m1" })).toEqual({
      url: null,
      mimeType: null,
      width: null,
      height: null,
      lqip: null,
      sizes: null,
    });
  });
});

describe("altString and mediaOf", () => {
  it("reads alt out of the en arm, and accepts a Sanity-shaped bare string", () => {
    expect(altString({ en: "photo", es: "foto" })).toBe("photo");
    expect(altString("photo")).toBe("photo");
    expect(altString(null)).toBeUndefined();
    expect(altString({ en: "" })).toBeUndefined();
  });

  it("resolves a group's asset only when the upload is populated", () => {
    expect(mediaOf({ asset: MEDIA })).toBe(MEDIA);
    expect(mediaOf({ asset: "bare-id" })).toBeUndefined();
    expect(mediaOf(undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The ratchet
// ---------------------------------------------------------------------------

const READER_DIR = join(process.cwd(), "lib/content/internal/payload");

/** A reader's source with its comments removed, so a doc comment describing a
 *  GROQ projection does not read as a hand-built shape. */
function code(file: string): string {
  const raw = readFileSync(join(READER_DIR, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  return raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const READERS = readdirSync(READER_DIR).filter((f) => f.endsWith(".ts"));

/**
 * Each pattern is a way the shape was previously written by hand. `metadata`
 * and `dimensions` are the wrapper's two nested levels; the third catches a
 * media-row field being copied into a projection (`lqip: media.lqip`), while
 * leaving alone a flat output field that merely shares the name
 * (`payload/regions.ts`'s `lqip: blurDataURL(image)`).
 */
const HAND_BUILT: { pattern: RegExp; what: string }[] = [
  { pattern: /\bmetadata\s*:/, what: "a `metadata` key" },
  { pattern: /\bdimensions\s*:/, what: "a `dimensions` key" },
  {
    pattern: /\b(lqip|sizes|originalFilename|mimeType)\s*:\s*\w+[.?]/,
    what: "a media-row field copied into a projection",
  },
  {
    pattern: /\binterface\s+\w*(Media|Asset)\w*\s*\{/,
    what: "a private copy of the media-row type",
  },
];

describe("the readers all go through the one image-shape helper", () => {
  it("finds the readers it is meant to be guarding", () => {
    expect(READERS.length).toBeGreaterThanOrEqual(11);
    expect(READERS).toContain("news.ts");
    expect(READERS).toContain("rich-text.ts");
  });

  it.each(READERS)("%s builds no part of the image shape by hand", (file) => {
    const source = code(file);
    for (const { pattern, what } of HAND_BUILT) {
      const hit = source.match(pattern);
      expect(
        hit,
        `${file} builds ${what} itself. The image shape has exactly one ` +
          `implementation, lib/content/internal/image-shape.ts — route this ` +
          `through assetShape/imageGroup rather than adding the 19th copy.`,
      ).toBeNull();
    }
  });

  it.each(READERS)("%s reaches a media row only through the helper", (file) => {
    const source = code(file);
    // A reader that dereferences an image group's `asset` must import the
    // helper; one that never touches an image is free of the rule.
    if (!/\.asset\b/.test(source)) return;
    expect(source, `${file} reads an image group's asset without importing the helper`).toMatch(
      /from "@\/lib\/content\/internal\/image-shape"/,
    );
  });
});
