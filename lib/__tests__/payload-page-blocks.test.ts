/**
 * `lib/content/internal/payload/blocks.ts` — the block families, one describe each.
 *
 * The contract these assert is not "the renderer got something usable" but "the
 * object `PAGE_QUERY` returned", so most of them compare `Object.keys(...)` and
 * exact values rather than using `toMatchObject`. A block whose `padding` is
 * `{top: null, bottom: null}` instead of `null`, or whose `_key` moved, renders
 * identically and diffs in the RSC flight payload — which is the failure mode
 * this whole phase keeps finding.
 *
 * Every fixture below is shaped like a real row: the block `id`s carry the
 * Sanity `_key` the importer preserved, the groups are spelled out with the
 * `null`s Payload really returns, and the checkbox values are the ones measured
 * in the live data.
 */
import { describe, expect, it } from "vitest";
import { pageBlocks } from "@/lib/content/internal/payload/blocks";

/** A `media` row as Payload hands it back at `depth >= 1`. */
const MEDIA = {
  id: "image-f890a73bd70f8df08ea3bd39c090c35c95c43629-1370x981-png",
  url: "/payload-api/media/file/peoplepng.png",
  mimeType: "image/png",
  lqip: "data:image/png;base64,AAAA",
  width: 1370,
  height: 981,
  sizes: {},
};

/** Payload's `background` group, filled the way the import left it: nine
 *  sub-fields, `type: "none"` and `direction: "to-r"` on all 48 heroes. */
const BACKGROUND = {
  type: "none",
  ccmColor: null,
  color: null,
  gradient: { direction: "to-r", startColor: null, endColor: null },
  svgPattern: null,
  image: { asset: null, alt: null },
  lightText: false,
  blobAccent: false,
};

function one(row: Record<string, unknown>): Record<string, unknown> {
  const blocks = pageBlocks([row]) as Record<string, unknown>[];
  expect(blocks).toHaveLength(1);
  return blocks[0];
}

describe("the block `_key`", () => {
  it("is the Sanity key the importer parked in the row id", () => {
    const block = one({ id: "page-about-en:blocks:21c77edc001e", blockType: "hero1" });
    expect(block._key).toBe("21c77edc001e");
  });

  it("survives a key an editor typed rather than one Sanity generated", () => {
    // Both of these are real ids in the dev database.
    expect(one({ id: "page-all-outputs-en:blocks:hero", blockType: "hero1" })._key).toBe("hero");
    expect(
      one({
        id: "page-all-outputs-en:blocks:block-143146c1-1cae-4ee7-8319-8428f94dc965",
        blockType: "hero1",
      })._key,
    ).toBe("block-143146c1-1cae-4ee7-8319-8428f94dc965");
  });

  it("is minted from content, deterministically, when the id carries no key", () => {
    // Only a block created inside the Payload admin can reach this: every
    // imported row's id is `${sourceId}:${path}:${_key}`.
    const minted = one({ id: "674f0b3a9c1e4d2f8a6b5c30", blockType: "hero1", title: "Hello" });
    const again = one({ id: "a-different-id", blockType: "hero1", title: "Hello" });
    expect(minted._key).toMatch(/^p[0-9a-f]{11}$/);
    expect(again._key).toBe(minted._key);
    expect(one({ id: "x", blockType: "hero1", title: "Other" })._key).not.toBe(minted._key);
  });

  it("is never derived from the block's position, so a reorder cannot move it", () => {
    const [first, second] = pageBlocks([
      { id: "x", blockType: "hero1", title: "A" },
      { id: "y", blockType: "hero1", title: "B" },
    ]) as Record<string, unknown>[];
    const [reordered] = pageBlocks([
      { id: "y", blockType: "hero1", title: "B" },
      { id: "x", blockType: "hero1", title: "A" },
    ]) as Record<string, unknown>[];
    expect(reordered._key).toBe(second._key);
    expect(reordered._key).not.toBe(first._key);
  });
});

describe("a block type this task has not mapped", () => {
  it("is dropped rather than handed to a renderer that cannot dispatch on it", () => {
    expect(pageBlocks([{ id: "a:blocks:1", blockType: "somethingNew" }])).toEqual([]);
  });

  it("leaves the blocks it does know in order", () => {
    const blocks = pageBlocks([
      { id: "a:blocks:one", blockType: "hero1" },
      { id: "a:blocks:two", blockType: "somethingNew" },
      { id: "a:blocks:three", blockType: "hero1" },
    ]) as Record<string, unknown>[];
    expect(blocks.map((b) => b._key)).toEqual(["one", "three"]);
  });

  it("is null for a locale carrying no list at all, as GROQ answers for an unset array", () => {
    expect(pageBlocks(null)).toBeNull();
    expect(pageBlocks(undefined)).toBeNull();
  });
});

describe("hero-1", () => {
  const row = {
    id: "page-about-en:blocks:21c77edc001e",
    blockType: "hero1",
    background: BACKGROUND,
    tagLine: null,
    title: "Connecting Climate Minds Project",
    body: null,
    image: { asset: MEDIA, alt: null },
    links: [],
    padding: { top: null, bottom: true },
    imagePosition: "left",
    blockName: null,
  };

  it("emits PAGE_QUERY's keys, in the order Sanity serializes them", () => {
    expect(Object.keys(one(row))).toEqual([
      "_key",
      "_type",
      "background",
      "body",
      "image",
      "imagePosition",
      "links",
      "padding",
      "tagLine",
      "title",
    ]);
  });

  it("renames the block to the `_type` the renderer dispatches on", () => {
    expect(one(row)._type).toBe("hero-1");
  });

  it("rebuilds `padding` sparsely, with Sanity's own `_type`", () => {
    // Measured: only `true` is ever stored, so a block with bottom padding
    // alone stores `{_type, bottom}` and GROQ returns exactly that.
    expect(one(row).padding).toEqual({ _type: "section-padding", bottom: true });
    expect(one({ ...row, padding: { top: true, bottom: true } }).padding).toEqual({
      _type: "section-padding",
      bottom: true,
      top: true,
    });
  });

  it("answers null for padding neither side of which is set", () => {
    expect(one({ ...row, padding: { top: null, bottom: null } }).padding).toBeNull();
  });

  it("rebuilds `background` as the sparse object the spread returned", () => {
    // `background{...,}` is a spread: Payload's nine filled sub-fields collapse
    // back to the three Sanity stored on 106 of the corpus's 110 backgrounds.
    expect(one(row).background).toEqual({
      _type: "background-option",
      gradient: { direction: "to-r" },
      type: "none",
    });
  });

  it("leaves a background image as the reference the spread never dereferenced", () => {
    const background = one({
      ...row,
      background: { ...BACKGROUND, image: { asset: MEDIA, alt: null } },
    }).background as Record<string, unknown>;
    expect(background.image).toEqual({
      _type: "image",
      asset: { _ref: MEDIA.id, _type: "reference" },
    });
  });

  it("keeps `_type: \"image\"` on the image group, because that projection spreads", () => {
    const image = one(row).image as Record<string, unknown>;
    expect(image._type).toBe("image");
    expect(image.alt).toBeNull();
    expect((image.asset as Record<string, unknown>)._id).toBe(MEDIA.id);
  });

  it("answers null for an image whose upload is unset", () => {
    expect(one({ ...row, image: { asset: null, alt: null } }).image).toBeNull();
  });

  it("answers null for an empty links array, which is Payload's spelling of unset", () => {
    expect(one(row).links).toBeNull();
  });

  it("projects a link's four named fields and nothing else", () => {
    const links = one({
      ...row,
      links: [
        {
          id: "page-about-en:blocks[0].links:aaa",
          title: "Read more",
          href: "/about",
          target: false,
          buttonVariant: { variant: "default", size: "wide", stroke: "none" },
        },
      ],
    }).links as Record<string, unknown>[];
    expect(links).toEqual([
      {
        buttonVariant: { size: "wide", stroke: "none", variant: "default" },
        href: "/about",
        // The importer wrote every checkbox as `x === true`, and no link in the
        // corpus stores `target: false`, so `false` is Sanity's unset.
        target: null,
        title: "Read more",
      },
    ]);
  });

  it("answers null for a body that was never filled in", () => {
    expect(one(row).body).toBeNull();
  });
});
