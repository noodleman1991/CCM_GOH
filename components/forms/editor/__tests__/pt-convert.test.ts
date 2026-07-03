import { describe, it, expect } from "vitest";
import { tiptapToPortableText, portableTextToTiptap } from "../pt-convert";

/**
 * Round-trip tests: tiptap JSON -> Portable Text -> tiptap JSON.
 * These are pure functions (no DOM, no editor instance) so we drive them
 * directly with hand-built Tiptap JSON docs shaped like what the real nodes
 * emit (see slash-menu.ts / block node defs for the actual attrs).
 */

describe("pt-convert: paragraph + marks (baseline, still covered)", () => {
  it("round-trips a simple paragraph with bold/italic/link", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello ", marks: [{ type: "bold" }] },
            { type: "text", text: "world", marks: [{ type: "italic" }] },
            {
              type: "text",
              text: "link",
              marks: [{ type: "link", attrs: { href: "https://example.com" } }],
            },
          ],
        },
      ],
    };

    const pt = tiptapToPortableText(doc);
    expect(pt).toHaveLength(1);
    expect(pt[0]._type).toBe("block");
    expect(pt[0].style).toBe("normal");
    expect(pt[0].children.map((c: any) => c.text)).toEqual(["Hello ", "world", "link"]);

    const back = portableTextToTiptap(pt);
    const p = back.content[0];
    expect(p.type).toBe("paragraph");
    expect(p.content[0].marks).toEqual([{ type: "bold" }]);
    expect(p.content[1].marks).toEqual([{ type: "italic" }]);
    expect(p.content[2].marks[0]).toMatchObject({ type: "link", attrs: { href: "https://example.com" } });
  });
});

describe("pt-convert: blockquote", () => {
  it("round-trips a blockquote to PT style=blockquote and back", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "A quoted line." }],
            },
          ],
        },
      ],
    };

    const pt = tiptapToPortableText(doc);
    expect(pt).toHaveLength(1);
    expect(pt[0]._type).toBe("block");
    expect(pt[0].style).toBe("blockquote");
    expect(pt[0].children[0].text).toBe("A quoted line.");

    const back = portableTextToTiptap(pt);
    expect(back.content[0].type).toBe("blockquote");
    expect(back.content[0].content[0].type).toBe("paragraph");
    expect(back.content[0].content[0].content[0].text).toBe("A quoted line.");
  });

  it("round-trips a multi-paragraph blockquote (each PT block becomes a paragraph inside the quote)", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Line one." }] },
            { type: "paragraph", content: [{ type: "text", text: "Line two." }] },
          ],
        },
      ],
    };

    const pt = tiptapToPortableText(doc);
    expect(pt).toHaveLength(2);
    expect(pt.every((b: any) => b.style === "blockquote")).toBe(true);

    const back = portableTextToTiptap(pt);
    expect(back.content).toHaveLength(1);
    expect(back.content[0].type).toBe("blockquote");
    expect(back.content[0].content).toHaveLength(2);
  });
});

describe("pt-convert: image (upload-backed, placement + caption + alt)", () => {
  const imageNode = (overrides: Partial<Record<string, any>> = {}) => ({
    type: "doc",
    content: [
      {
        type: "image",
        attrs: {
          src: "https://cdn.sanity.io/images/proj/ds/abc123-800x450.jpg",
          alt: "A field of solar panels",
          caption: "Solar panels near the coast",
          placement: "start",
          assetRef: "image-abc123-800x450-jpg",
          width: 800,
          height: 450,
          lqip: "data:image/png;base64,aaaa",
          ...overrides,
        },
      },
    ],
  });

  it("converts to a PT image object carrying asset ref/url/metadata + alt/caption/placement", () => {
    const pt = tiptapToPortableText(imageNode());
    expect(pt).toHaveLength(1);
    const img = pt[0];
    expect(img._type).toBe("image");
    expect(typeof img._key).toBe("string");
    expect(img.asset).toMatchObject({
      _type: "reference",
      _ref: "image-abc123-800x450-jpg",
      url: "https://cdn.sanity.io/images/proj/ds/abc123-800x450.jpg",
      metadata: { lqip: "data:image/png;base64,aaaa", dimensions: { width: 800, height: 450 } },
    });
    expect(img.alt).toBe("A field of solar panels");
    expect(img.caption).toBe("Solar panels near the coast");
    expect(img.placement).toBe("start");
  });

  it("round-trips placement variants (full/start/end/center)", () => {
    for (const placement of ["full", "start", "end", "center"]) {
      const pt = tiptapToPortableText(imageNode({ placement }));
      expect(pt[0].placement).toBe(placement);
      const back = portableTextToTiptap(pt);
      expect(back.content[0].attrs.placement).toBe(placement);
    }
  });

  it("defaults placement to 'full' when omitted", () => {
    const doc = {
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://example.com/x.jpg", alt: "x" } }],
    };
    const pt = tiptapToPortableText(doc);
    expect(pt[0].placement).toBe("full");
  });

  it("round-trips back to a tiptap image node with the same attrs", () => {
    const pt = tiptapToPortableText(imageNode());
    const back = portableTextToTiptap(pt);
    const node = back.content[0];
    expect(node.type).toBe("image");
    expect(node.attrs).toMatchObject({
      src: "https://cdn.sanity.io/images/proj/ds/abc123-800x450.jpg",
      alt: "A field of solar panels",
      caption: "Solar panels near the coast",
      placement: "start",
      assetRef: "image-abc123-800x450-jpg",
      width: 800,
      height: 450,
    });
  });

  it("falls back to an empty alt string when alt is missing (never undefined, matches renderer expectations)", () => {
    const doc = {
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://example.com/x.jpg" } }],
    };
    const pt = tiptapToPortableText(doc);
    expect(pt[0].alt).toBe("");
  });

  it("PT -> tiptap: a PT image without asset.url falls back to building the src from asset._ref (legacy/base64 passthrough)", () => {
    const pt = [
      {
        _type: "image",
        _key: "k1",
        asset: { _type: "reference", _ref: "data:image/png;base64,zzzz" },
        alt: "legacy inline image",
        placement: "full",
      },
    ];
    const back = portableTextToTiptap(pt);
    expect(back.content[0].type).toBe("image");
    expect(back.content[0].attrs.src).toBe("data:image/png;base64,zzzz");
  });
});

describe("pt-convert: youtube", () => {
  it("converts a youtube node to a PT youtube object with videoId + caption", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "youtube", attrs: { videoId: "dQw4w9WgXcQ", caption: "Great talk" } },
      ],
    };
    const pt = tiptapToPortableText(doc);
    expect(pt).toHaveLength(1);
    expect(pt[0]).toMatchObject({ _type: "youtube", videoId: "dQw4w9WgXcQ", caption: "Great talk" });
    expect(typeof pt[0]._key).toBe("string");
  });

  it("round-trips back to a tiptap youtube node", () => {
    const pt = [{ _type: "youtube", _key: "k1", videoId: "dQw4w9WgXcQ", caption: "Great talk" }];
    const back = portableTextToTiptap(pt);
    expect(back.content[0]).toMatchObject({
      type: "youtube",
      attrs: { videoId: "dQw4w9WgXcQ", caption: "Great talk" },
    });
  });

  it("omits caption when not provided (renderer treats falsy caption as 'no caption')", () => {
    const doc = { type: "doc", content: [{ type: "youtube", attrs: { videoId: "abc12345678" } }] };
    const pt = tiptapToPortableText(doc);
    expect(pt[0].caption).toBe("");
  });
});

describe("pt-convert: infoBox", () => {
  it("converts an infoBox node with nested paragraph content to a PT infoBox object", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "infoBox",
          attrs: { variant: "warning" },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Careful with this." }],
            },
          ],
        },
      ],
    };

    const pt = tiptapToPortableText(doc);
    expect(pt).toHaveLength(1);
    expect(pt[0]._type).toBe("infoBox");
    expect(pt[0].variant).toBe("warning");
    expect(Array.isArray(pt[0].content)).toBe(true);
    expect(pt[0].content[0]._type).toBe("block");
    expect(pt[0].content[0].children[0].text).toBe("Careful with this.");
  });

  it("round-trips back to a tiptap infoBox node with nested content preserved", () => {
    const pt = [
      {
        _type: "infoBox",
        _key: "k1",
        variant: "success",
        content: [
          {
            _type: "block",
            _key: "b1",
            style: "normal",
            children: [{ _type: "span", _key: "s1", text: "All good.", marks: [] }],
            markDefs: [],
          },
        ],
      },
    ];

    const back = portableTextToTiptap(pt);
    const node = back.content[0];
    expect(node.type).toBe("infoBox");
    expect(node.attrs.variant).toBe("success");
    expect(node.content[0].type).toBe("paragraph");
    expect(node.content[0].content[0].text).toBe("All good.");
  });

  it("defaults variant to 'info' when missing", () => {
    const doc = {
      type: "doc",
      content: [{ type: "infoBox", attrs: {}, content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }] }],
    };
    const pt = tiptapToPortableText(doc);
    expect(pt[0].variant).toBe("info");
  });
});

describe("pt-convert: break", () => {
  it("converts a break node to a PT break object with style", () => {
    const doc = { type: "doc", content: [{ type: "break", attrs: { style: "chapter" } }] };
    const pt = tiptapToPortableText(doc);
    expect(pt).toHaveLength(1);
    expect(pt[0]).toMatchObject({ _type: "break", style: "chapter" });
  });

  it("round-trips all four break styles", () => {
    for (const style of ["hr", "readMore", "section", "chapter"]) {
      const pt = [{ _type: "break", _key: "k", style }];
      const back = portableTextToTiptap(pt);
      expect(back.content[0]).toMatchObject({ type: "break", attrs: { style } });
    }
  });

  it("defaults to 'hr' when style is missing", () => {
    const doc = { type: "doc", content: [{ type: "break", attrs: {} }] };
    const pt = tiptapToPortableText(doc);
    expect(pt[0].style).toBe("hr");
  });
});

describe("pt-convert: unknown/unsupported node passthrough behavior", () => {
  it("silently drops an unrecognized tiptap node type (documented: no crash, no PT entry)", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "before" }] },
        { type: "mysteryNode", attrs: { foo: "bar" } },
        { type: "paragraph", content: [{ type: "text", text: "after" }] },
      ],
    };
    const pt = tiptapToPortableText(doc);
    expect(pt).toHaveLength(2);
    expect(pt[0].children[0].text).toBe("before");
    expect(pt[1].children[0].text).toBe("after");
  });

  it("silently drops an unrecognized PT _type on the reverse conversion (documented: no crash, no tiptap node)", () => {
    const pt = [
      { _type: "block", _key: "b1", style: "normal", children: [{ _type: "span", _key: "s1", text: "kept", marks: [] }], markDefs: [] },
      { _type: "someFutureBlockType", _key: "x1", data: 1 },
    ];
    const back = portableTextToTiptap(pt);
    expect(back.content).toHaveLength(1);
    expect(back.content[0].content[0].text).toBe("kept");
  });

  it("handles empty/undefined content arrays without throwing", () => {
    expect(tiptapToPortableText({ type: "doc", content: [] })).toEqual([]);
    expect(tiptapToPortableText({ type: "doc" })).toEqual([]);
    expect(portableTextToTiptap([])).toEqual({ type: "doc", content: [] });
    expect(portableTextToTiptap(undefined as any)).toEqual({ type: "doc", content: [] });
  });
});
