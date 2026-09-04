import { describe, expect, it } from "vitest";
import config from "@payload-config";
import { editorConfigFactory, getEnabledNodes } from "@payloadcms/richtext-lexical";
import { createHeadlessEditor } from "@payloadcms/richtext-lexical/lexical/headless";
import {
  EMBED_BLOCK_TYPES,
  FOOTNOTE_BLOCK_TYPE,
  TEXT_FORMAT,
  portableTextToLexical,
  type SerializedBlockNode,
  type SerializedEditorState,
  type SerializedHeadingNode,
  type SerializedInlineNode,
  type SerializedLinkNode,
  type SerializedListNode,
  type SerializedParagraphNode,
} from "@/lib/content/internal/lexical";
import { richTextEditor, richTextEmbedBlocks, richTextInlineBlocks } from "@/payload/blocks/rich-text-embeds";
import fixtures from "./fixtures/portable-text.json";

/**
 * The fixtures are five real Portable Text bodies pulled verbatim out of
 * `production_2` on 2026-09-04, with `count(*[_type=="agenda"]) == 29`
 * asserted on the same connection first — an untokened Sanity query returns
 * HTTP 200 with an empty result rather than a 401, so a control is the only
 * way to know a zero is real.
 *
 *   caseStudy                    case-study-20.content                    h1/h2, numbered list, strong+em
 *   docsChapterExecutiveSummary  docsChapter-…-executive-summary.body     link AND footnote markDefs
 *   docsChapterActionAgenda      docsChapter-…-global-action-agenda.body  h3, bullet list, in-body image
 *   newsPost                     622112d8-….content                       blockquote, in-body image
 *   testimonial                  0a2d0180-….body                          the `youtube` node
 *
 * `livedExperience` is NOT among them because it has no Portable Text at all:
 * `livedExperience.body` is populated on 0 of 56 documents and `description`
 * is a plain localized string. The brief asked for one; there is none to take.
 */
const FIXTURES = fixtures as Record<string, { _id: string; field: string; blocks: unknown[] }>;

/** The editor built from THIS project's config — the only authority on shape. */
const projectEditorConfig = async () =>
  editorConfigFactory.fromEditor({ config: await config, editor: richTextEditor() });

const buildEditor = async () => {
  const editorConfig = await projectEditorConfig();
  return createHeadlessEditor({
    nodes: getEnabledNodes({ editorConfig }),
    onError: (e) => {
      throw e;
    },
  });
};

/** Depth-first text of a converted state, in document order. */
const plainText = (node: unknown): string => {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; children?: unknown[]; fields?: Record<string, unknown> };
  if (n.type === "text") return n.text ?? "";
  if (n.type === "inlineBlock" && n.fields?.blockType === FOOTNOTE_BLOCK_TYPE) {
    return typeof n.fields.marker === "string" ? n.fields.marker : "";
  }
  return (n.children ?? []).map(plainText).join("");
};

/** The same text, taken off the Portable Text side. */
const portableTextPlain = (blocks: unknown[]): string =>
  blocks
    .map((b) => {
      const block = b as { _type?: string; children?: { text?: string }[] };
      if (block._type !== "block") return "";
      return (block.children ?? []).map((c) => c.text ?? "").join("");
    })
    .join("");

const collect = (state: SerializedEditorState, type: string): unknown[] => {
  const found: unknown[] = [];
  const walk = (n: unknown) => {
    if (!n || typeof n !== "object") return;
    const node = n as { type?: string; children?: unknown[] };
    if (node.type === type) found.push(node);
    (node.children ?? []).forEach(walk);
  };
  state.root.children.forEach(walk);
  return found;
};

const span = (text: string, marks: string[] = []) => ({ _type: "span", _key: `s-${text}`, text, marks });
const block = (over: Record<string, unknown> = {}) => ({
  _type: "block",
  _key: "b1",
  style: "normal",
  markDefs: [],
  children: [span("hello")],
  ...over,
});

describe("portableTextToLexical — the root", () => {
  it("produces the measured root shape", () => {
    expect(portableTextToLexical([])).toEqual({
      root: { children: [], direction: null, format: "", indent: 0, type: "root", version: 1 },
    });
  });

  it("tolerates non-arrays and non-object members without throwing", () => {
    expect(portableTextToLexical(null as never).root.children).toEqual([]);
    expect(portableTextToLexical(["nope", 42, null] as unknown[]).root.children).toEqual([]);
  });
});

describe("portableTextToLexical — blocks and styles", () => {
  it("maps `normal` to the measured paragraph shape", () => {
    const [p] = portableTextToLexical([block()]).root.children as SerializedParagraphNode[];
    expect(p).toEqual({
      type: "paragraph",
      children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "hello", type: "text", version: 1 }],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
      textFormat: 0,
      textStyle: "",
    });
  });

  it.each(["h1", "h2", "h3", "h4"])("maps style %s to a heading with that tag", (style) => {
    const [h] = portableTextToLexical([block({ style })]).root.children as SerializedHeadingNode[];
    expect(h.type).toBe("heading");
    expect(h.tag).toBe(style);
  });

  it("maps `blockquote` to a quote node", () => {
    const [q] = portableTextToLexical([block({ style: "blockquote" })]).root.children;
    expect(q.type).toBe("quote");
  });

  it("treats a style-less block as a paragraph (1 such block exists in the dataset)", () => {
    const [p] = portableTextToLexical([{ _type: "block", children: [span("bare")], markDefs: [] }]).root.children;
    expect(p.type).toBe("paragraph");
  });

  it("collapses the four never-authored styles onto paragraph", () => {
    for (const style of ["lead", "caption", "sidebarNote", "cta"]) {
      expect(portableTextToLexical([block({ style })]).root.children[0].type).toBe("paragraph");
    }
  });

  it("drops empty spans, because Lexical drops empty text nodes itself", () => {
    const [p] = portableTextToLexical([block({ children: [span(""), span("kept")] })])
      .root.children as SerializedParagraphNode[];
    expect(p.children).toHaveLength(1);
    expect((p.children[0] as { text: string }).text).toBe("kept");
  });
});

describe("portableTextToLexical — decorators", () => {
  it("uses the measured format bitmask", () => {
    const [p] = portableTextToLexical([
      block({
        children: [
          span("plain"),
          span("b", ["strong"]),
          span("i", ["em"]),
          span("bi", ["strong", "em"]),
          span("s", ["strike-through"]),
          span("u", ["underline"]),
          span("c", ["code"]),
          span("h", ["highlight"]),
        ],
      }),
    ]).root.children as SerializedParagraphNode[];
    expect(p.children.map((c) => (c as { format: number }).format)).toEqual([
      0,
      TEXT_FORMAT.bold,
      TEXT_FORMAT.italic,
      TEXT_FORMAT.bold | TEXT_FORMAT.italic,
      TEXT_FORMAT.strikethrough,
      TEXT_FORMAT.underline,
      TEXT_FORMAT.code,
      TEXT_FORMAT.highlight,
    ]);
    expect(TEXT_FORMAT.bold | TEXT_FORMAT.italic).toBe(3);
  });

  it("ignores an unknown decorator rather than inventing a bit for it", () => {
    const [p] = portableTextToLexical([block({ children: [span("x", ["sparkle"])] })])
      .root.children as SerializedParagraphNode[];
    expect((p.children[0] as { format: number }).format).toBe(0);
  });
});

describe("portableTextToLexical — links", () => {
  const linked = (def: Record<string, unknown>, text = "here") =>
    portableTextToLexical([
      block({ markDefs: [{ _key: "lk1", ...def }], children: [span("see "), span(text, ["lk1"])] }),
    ]);

  it("emits Payload's LinkFeature node — version 3 with a `fields` object, not bare Lexical's url/rel/target", () => {
    const [p] = linked({ _type: "link", href: "https://example.com" }).root.children as SerializedParagraphNode[];
    const link = p.children[1] as SerializedLinkNode;
    expect(link).toEqual({
      children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "here", type: "text", version: 1 }],
      direction: null,
      format: "",
      indent: 0,
      type: "link",
      version: 3,
      id: "lk1",
      fields: { linkType: "custom", newTab: false, url: "https://example.com" },
    });
  });

  it("carries `target` through as newTab (5 of the 88 stored links set it)", () => {
    const [p] = linked({ _type: "link", href: "https://x.test", target: true }).root.children as SerializedParagraphNode[];
    expect((p.children[1] as SerializedLinkNode).fields.newTab).toBe(true);
  });

  it("keeps the markDef `_key` as the link node's id, so the mark key survives", () => {
    const [p] = linked({ _type: "link", href: "https://x.test" }).root.children as SerializedParagraphNode[];
    expect((p.children[1] as SerializedLinkNode).id).toBe("lk1");
  });

  it("merges consecutive spans carrying the same link into one <a>", () => {
    const [p] = portableTextToLexical([
      block({
        markDefs: [{ _key: "lk1", _type: "link", href: "https://x.test" }],
        children: [span("bold", ["lk1", "strong"]), span("plain", ["lk1"])],
      }),
    ]).root.children as SerializedParagraphNode[];
    expect(p.children).toHaveLength(1);
    const link = p.children[0] as SerializedLinkNode;
    expect(link.children.map((c) => (c as { text: string }).text)).toEqual(["bold", "plain"]);
    expect((link.children[0] as { format: number }).format).toBe(TEXT_FORMAT.bold);
  });

  it("carries an internalLink's reference through as an internal link (0 in the dataset)", () => {
    const [p] = linked({ _type: "internalLink", reference: { _ref: "page-about" } })
      .root.children as SerializedParagraphNode[];
    expect((p.children[1] as SerializedLinkNode).fields).toEqual({
      linkType: "internal",
      newTab: false,
      doc: "page-about",
    });
  });
});

describe("portableTextToLexical — footnotes", () => {
  const footnoted = (marks: string[]) =>
    portableTextToLexical([
      block({
        markDefs: [{ _key: "fn1", _type: "footnote", text: "Lawrance EL et al. Nat Ment Health. 2024;2:121–5." }],
        children: [span("claim", marks)],
      }),
    ]);

  it("becomes an inline block carrying the note, the marker text, and the marker's format", () => {
    const [p] = footnoted(["fn1"]).root.children as SerializedParagraphNode[];
    expect(p.children[0]).toEqual({
      type: "inlineBlock",
      version: 1,
      fields: {
        blockName: "",
        blockType: "footnote",
        id: "fn1",
        text: "Lawrance EL et al. Nat Ment Health. 2024;2:121–5.",
        marker: "claim",
        markerFormat: 0,
      },
    });
  });

  it("keeps the decorator the marker span also carried (3 stored footnotes are footnote+strong)", () => {
    const [p] = footnoted(["fn1", "strong"]).root.children as SerializedParagraphNode[];
    expect((p.children[0] as unknown as { fields: { markerFormat: number } }).fields.markerFormat).toBe(TEXT_FORMAT.bold);
  });
});

describe("portableTextToLexical — lists", () => {
  const item = (text: string, over: Record<string, unknown> = {}) =>
    block({ _key: `li-${text}`, listItem: "bullet", level: 1, children: [span(text)], ...over });

  it("groups a run of listItem blocks into one list with the measured shape", () => {
    const state = portableTextToLexical([item("one"), item("two")]);
    expect(state.root.children).toHaveLength(1);
    const list = state.root.children[0] as SerializedListNode;
    expect(list.type).toBe("list");
    expect(list.listType).toBe("bullet");
    expect(list.tag).toBe("ul");
    expect(list.start).toBe(1);
    expect(list.children.map((c) => c.value)).toEqual([1, 2]);
    expect(list.children[0].type).toBe("listitem");
  });

  it("maps `number` to an ordered list and `checkbox` to a checklist", () => {
    const ol = portableTextToLexical([item("a", { listItem: "number" })]).root.children[0] as SerializedListNode;
    expect([ol.listType, ol.tag]).toEqual(["number", "ol"]);
    const check = portableTextToLexical([item("a", { listItem: "checkbox" })]).root.children[0] as SerializedListNode;
    expect(check.listType).toBe("check");
    expect(check.children[0].checked).toBe(false);
  });

  it("starts a second list when the kind changes at the same level", () => {
    const state = portableTextToLexical([item("a"), item("b", { listItem: "number" })]);
    expect(state.root.children.map((c) => (c as SerializedListNode).listType)).toEqual(["bullet", "number"]);
  });

  it("ends the list at the first non-list block", () => {
    const state = portableTextToLexical([item("a"), block(), item("b")]);
    expect(state.root.children.map((c) => c.type)).toEqual(["list", "paragraph", "list"]);
  });

  it("nests a deeper level inside the preceding item (level is 1 everywhere in the dataset)", () => {
    const state = portableTextToLexical([item("outer"), item("inner", { level: 2 })]);
    expect(state.root.children).toHaveLength(1);
    const outer = state.root.children[0] as SerializedListNode;
    expect(outer.children).toHaveLength(1);
    const nested = (outer.children[0].children as unknown[])[1] as SerializedListNode;
    expect(nested.type).toBe("list");
    expect((nested.children[0].children[0] as { text: string }).text).toBe("inner");
  });

  it("closes back out to the shallower level", () => {
    const state = portableTextToLexical([item("a"), item("b", { level: 2 }), item("c")]);
    const outer = state.root.children[0] as SerializedListNode;
    expect(outer.children.map((c) => (c.children[0] as { text?: string }).text)).toEqual(["a", "c"]);
  });
});

describe("portableTextToLexical — embeds", () => {
  it("maps `image` to a block node whose blockType is the Sanity _type, with every prop kept", () => {
    const image = {
      _type: "image",
      _key: "img1",
      asset: { _ref: "image-abc-810x873-png", _type: "reference" },
      alt: "Mental Health Illustration",
      placement: "center",
    };
    const [node] = portableTextToLexical([image]).root.children as SerializedBlockNode[];
    expect(node).toEqual({
      type: "block",
      version: 2,
      format: "",
      fields: {
        blockName: "",
        blockType: "image",
        id: "img1",
        asset: { _ref: "image-abc-810x873-png", _type: "reference" },
        alt: "Mental Health Illustration",
        placement: "center",
      },
    });
  });

  it("maps `youtube` the same way", () => {
    const [node] = portableTextToLexical([{ _type: "youtube", _key: "yt1", videoId: "dQw4" }])
      .root.children as SerializedBlockNode[];
    expect(node.fields).toEqual({ blockName: "", blockType: "youtube", id: "yt1", videoId: "dQw4" });
  });

  // The five embeds the spec chose to port have ZERO stored instances, so
  // there is nothing to compare against; unit tests are the whole coverage.
  it.each([
    ["break", { style: "chapter" }],
    ["infoBox", { variant: "warning", content: [{ _type: "block", children: [{ _type: "span", text: "careful" }] }] }],
    ["storyTimeline", { items: [{ date: "2024", title: "COP28", text: "…" }] }],
    ["storyChart", { chartType: "line", labels: ["a", "b"], series: [{ name: "s", values: [1, 2] }] }],
    ["storyMermaid", { code: "graph TD; A-->B", renderStatus: "ok" }],
  ])("carries the never-authored embed `%s` through with its props intact", (type, props) => {
    const [node] = portableTextToLexical([{ _type: type, _key: `${type}-1`, ...props }])
      .root.children as SerializedBlockNode[];
    expect(node.type).toBe("block");
    expect(node.version).toBe(2);
    expect(node.fields).toEqual({ blockName: "", blockType: type, id: `${type}-1`, ...props });
  });

  it("keeps the Portable Text `_key` as the block node's id", () => {
    const [node] = portableTextToLexical([{ _type: "image", _key: "k-42", asset: {} }])
      .root.children as SerializedBlockNode[];
    expect(node.fields.id).toBe("k-42");
  });

  it("mints a deterministic id when a node has no _key, so re-running the import is idempotent", () => {
    const input = [{ _type: "image", asset: {} }, { _type: "youtube", videoId: "x" }];
    const a = portableTextToLexical(input) as SerializedEditorState;
    const b = portableTextToLexical(input) as SerializedEditorState;
    expect(a).toEqual(b);
    expect((a.root.children as SerializedBlockNode[]).map((n) => n.fields.id)).toEqual(["embed-1", "embed-2"]);
  });

  it("preserves an unanticipated Portable Text type rather than dropping it", () => {
    const [node] = portableTextToLexical([{ _type: "pullQuote", _key: "pq", text: "…", attribution: "A" }])
      .root.children as SerializedBlockNode[];
    expect(node.fields.blockType).toBe("pullQuote");
    expect(node.fields.attribution).toBe("A");
  });
});

describe("the block registry and the converter agree", () => {
  it("every blockType the converter emits is a registered lexical block", () => {
    expect(richTextEmbedBlocks.map((b) => b.slug).sort()).toEqual([...EMBED_BLOCK_TYPES].sort());
    expect(richTextInlineBlocks.map((b) => b.slug)).toEqual([FOOTNOTE_BLOCK_TYPE]);
  });

  it("the project's editor is built with those blocks", async () => {
    const editorConfig = await projectEditorConfig();
    const types = getEnabledNodes({ editorConfig }).map((n) =>
      typeof n === "function"
        ? n.getType?.()
        : (n as { replace?: { getType?: () => string } })?.replace?.getType?.(),
    );
    expect(types).toContain("block");
    expect(types).toContain("inlineBlock");
    expect(types).toContain("link");
  });
});

describe("real fixtures from production_2", () => {
  const names = Object.keys(FIXTURES);

  it("has the five real bodies, 103 nodes in total", () => {
    expect(names).toEqual([
      "caseStudy",
      "docsChapterExecutiveSummary",
      "docsChapterActionAgenda",
      "newsPost",
      "testimonial",
    ]);
    expect(names.reduce((n, k) => n + FIXTURES[k].blocks.length, 0)).toBe(103);
  });

  it("the fixture set covers the whole measured surface", () => {
    const all = names.flatMap((k) => FIXTURES[k].blocks) as Record<string, unknown>[];
    const types = new Set(all.map((n) => n._type));
    expect([...types].sort()).toEqual(["block", "image", "youtube"]);
    const styles = new Set(all.filter((n) => n._type === "block").map((n) => n.style));
    expect(styles).toContain("normal");
    expect(styles).toContain("blockquote");
    expect(styles).toContain("h1");
    expect(styles).toContain("h2");
    expect(styles).toContain("h3");
    // h4 and the single style-less block in the dataset are NOT in the
    // fixtures — h4 lives only in the 84 KB appendices chapter and the
    // style-less block in an author bio. Both take the same code path as the
    // styles above and are covered by unit tests.
    const lists = new Set(all.map((n) => n.listItem).filter(Boolean));
    expect([...lists].sort()).toEqual(["bullet", "number"]);
    const defs = new Set(
      all.flatMap((n) => ((n.markDefs as { _type: string }[] | undefined) ?? []).map((d) => d._type)),
    );
    expect([...defs].sort()).toEqual(["footnote", "link"]);
  });

  it.each(Object.keys(FIXTURES))("%s: every character of text survives, in order", (name) => {
    const { blocks } = FIXTURES[name];
    expect(plainText({ children: portableTextToLexical(blocks).root.children })).toBe(portableTextPlain(blocks));
  });

  it.each(Object.keys(FIXTURES))("%s: the editor built from this project's config accepts the output", async (name) => {
    const editor = await buildEditor();
    const state = portableTextToLexical(FIXTURES[name].blocks);
    // parseEditorState throws on a node the registered set cannot build.
    const reparsed = editor.parseEditorState(state as never).toJSON();
    expect(reparsed.root.children).toHaveLength(state.root.children.length);
    expect(plainText(reparsed.root)).toBe(portableTextPlain(FIXTURES[name].blocks));
  });

  it.each(Object.keys(FIXTURES))("%s: converting twice produces identical JSON", (name) => {
    const { blocks } = FIXTURES[name];
    expect(portableTextToLexical(blocks)).toEqual(portableTextToLexical(blocks));
  });

  it("caseStudy: the h1/h2 headings and the numbered list land as such", () => {
    const state = portableTextToLexical(FIXTURES.caseStudy.blocks);
    const tags = (collect(state, "heading") as SerializedHeadingNode[]).map((h) => h.tag);
    expect(tags).toContain("h1");
    expect(tags).toContain("h2");
    const lists = collect(state, "list") as SerializedListNode[];
    expect(lists.map((l) => l.listType)).toContain("number");
  });

  it("docsChapterExecutiveSummary: all 8 footnotes and both links survive as nodes", () => {
    const blocks = FIXTURES.docsChapterExecutiveSummary.blocks as Record<string, unknown>[];
    const defs = blocks.flatMap((b) => ((b.markDefs as { _type: string }[] | undefined) ?? []));
    const state = portableTextToLexical(blocks);
    const inline = collect(state, "inlineBlock") as { fields: { blockType: string; text?: string } }[];
    const footnotes = defs.filter((d) => d._type === "footnote");
    const links = defs.filter((d) => d._type === "link");
    expect(footnotes.length).toBeGreaterThan(0);
    expect(inline.filter((n) => n.fields.blockType === FOOTNOTE_BLOCK_TYPE)).toHaveLength(footnotes.length);
    expect(collect(state, "link")).toHaveLength(links.length);
    // The note text is carried, not just the marker.
    const notes = inline.map((n) => n.fields.text);
    for (const d of footnotes) expect(notes).toContain((d as unknown as { text: string }).text);
  });

  it("newsPost: the blockquote and the in-body image both convert", () => {
    const state = portableTextToLexical(FIXTURES.newsPost.blocks);
    expect(collect(state, "quote")).toHaveLength(1);
    const embeds = state.root.children.filter((c) => c.type === "block") as SerializedBlockNode[];
    expect(embeds.map((e) => e.fields.blockType)).toEqual(["image"]);
    expect(embeds[0].fields.asset).toBeDefined();
  });

  it("testimonial: the only real youtube node in the dataset converts to a youtube block", () => {
    const [node] = portableTextToLexical(FIXTURES.testimonial.blocks).root.children as SerializedBlockNode[];
    expect(node.fields.blockType).toBe("youtube");
    expect(typeof node.fields.videoId).toBe("string");
  });

  it.each(Object.keys(FIXTURES))("%s: every markDef key survives on a link or footnote node", (name) => {
    const blocks = FIXTURES[name].blocks as Record<string, unknown>[];
    const keys = blocks
      .flatMap((b) => ((b.markDefs as { _key: string }[] | undefined) ?? []))
      .map((d) => d._key);
    if (keys.length === 0) return;
    const state = portableTextToLexical(blocks);
    const ids = new Set([
      ...(collect(state, "link") as SerializedLinkNode[]).map((l) => l.id),
      ...(collect(state, "inlineBlock") as { fields: { id: string } }[]).map((n) => n.fields.id),
    ]);
    for (const k of keys) expect(ids.has(k)).toBe(true);
  });

  it.each(Object.keys(FIXTURES))("%s: every embed's _key survives as the block node's id", (name) => {
    const blocks = FIXTURES[name].blocks as Record<string, unknown>[];
    const embedKeys = blocks.filter((b) => b._type !== "block").map((b) => b._key);
    if (embedKeys.length === 0) return;
    const ids = (portableTextToLexical(blocks).root.children.filter((c) => c.type === "block") as SerializedBlockNode[])
      .map((n) => n.fields.id);
    expect(ids).toEqual(embedKeys);
  });
});

describe("what Task 10 must reconstruct rather than read back", () => {
  it("block-level `_key`s are gone — an extra property does not survive the editor", async () => {
    const editor = await buildEditor();
    const state = portableTextToLexical([block({ _key: "keep-me" })]);
    expect(JSON.stringify(state)).not.toContain("keep-me");
    // And proof of WHY: even if the converter smuggled one in, the editor
    // rebuilds paragraphs from their declared fields and drops the rest.
    const smuggled = JSON.parse(JSON.stringify(state)) as SerializedEditorState;
    (smuggled.root.children[0] as unknown as Record<string, unknown>)._key = "keep-me";
    expect(JSON.stringify(editor.parseEditorState(smuggled as never).toJSON())).not.toContain("keep-me");
  });

  it("span-level `_key`s are gone for the same reason", () => {
    const state = portableTextToLexical([block({ children: [span("hi")] })]);
    const [p] = state.root.children as SerializedParagraphNode[];
    expect(Object.keys(p.children[0] as SerializedInlineNode).sort()).toEqual([
      "detail",
      "format",
      "mode",
      "style",
      "text",
      "type",
      "version",
    ]);
  });
});

/* ===================================================================== */
/* The review round's seven findings. Every one is 0-occurrence in       */
/* production_2 and reachable only once Phase 3 turns the admin on, so   */
/* the Lexical shapes below are authored directly — there is no Sanity   */
/* fixture to take them from — and each is checked against the editor    */
/* built from this project's own config where the claim is "the admin    */
/* can produce this".                                                    */
/* ===================================================================== */

describe("portableTextToLexical — alignment and indent (finding 1)", () => {
  it("carries a block's alignment onto the element's format", () => {
    const [p] = portableTextToLexical([block({ textAlign: "center" })]).root.children as SerializedParagraphNode[];
    expect(p.format).toBe("center");
  });

  it("carries a block's indent", () => {
    const [p] = portableTextToLexical([block({ indent: 2 })]).root.children as SerializedParagraphNode[];
    expect(p.indent).toBe(2);
  });

  it("carries both onto a heading and a quote", () => {
    const [h] = portableTextToLexical([block({ style: "h2", textAlign: "right", indent: 1 })])
      .root.children as SerializedHeadingNode[];
    expect([h.format, h.indent]).toEqual(["right", 1]);
    const [q] = portableTextToLexical([block({ style: "blockquote", textAlign: "justify" })]).root.children;
    expect(q.format).toBe("justify");
  });

  it("carries the alignment onto a list item", () => {
    const list = portableTextToLexical([
      block({ listItem: "bullet", level: 1, textAlign: "end", children: [span("x")] }),
    ]).root.children[0] as SerializedListNode;
    expect(list.children[0].format).toBe("end");
  });

  it("aligns an embedded block too — a DecoratorBlockNode carries a format", () => {
    const [node] = portableTextToLexical([{ _type: "image", _key: "i1", asset: {}, textAlign: "center" }])
      .root.children as SerializedBlockNode[];
    expect(node.format).toBe("center");
    // …and it is not left behind as a field as well.
    expect(node.fields.textAlign).toBeUndefined();
  });

  it("ignores a value that is not one of Lexical's alignments", () => {
    const [p] = portableTextToLexical([block({ textAlign: "sideways", indent: -3 })])
      .root.children as SerializedParagraphNode[];
    expect([p.format, p.indent]).toEqual(["", 0]);
    // On an embed, an unrecognised value stays a Sanity property rather than
    // being eaten by a feature it does not belong to.
    const [node] = portableTextToLexical([{ _type: "image", _key: "i1", textAlign: "sideways" }])
      .root.children as SerializedBlockNode[];
    expect(node.fields.textAlign).toBe("sideways");
  });

  it("the editor built from this project's config keeps both", async () => {
    const editor = await buildEditor();
    const state = portableTextToLexical([block({ style: "h2", textAlign: "center", indent: 2 })]);
    const back = editor.parseEditorState(state as never).toJSON().root.children[0] as unknown as {
      format: string;
      indent: number;
    };
    expect([back.format, back.indent]).toEqual(["center", 2]);
  });
});

describe("portableTextToLexical — overlapping annotations (finding 3)", () => {
  const two = (marks: string[]) =>
    portableTextToLexical([
      block({
        markDefs: [
          { _key: "m1", _type: "link", href: "https://a.example" },
          { _key: "f1", _type: "footnote", text: "the note" },
        ],
        children: [span("claim", marks)],
      }),
    ]);

  it("keeps BOTH a link and a footnote that sit on one span", () => {
    const [p] = two(["m1", "f1"]).root.children as SerializedParagraphNode[];
    const link = p.children[0] as SerializedLinkNode;
    expect(link.type).toBe("link");
    expect(link.id).toBe("m1");
    const footnote = link.children[0] as unknown as { type: string; fields: Record<string, unknown> };
    expect(footnote.type).toBe("inlineBlock");
    expect(footnote.fields).toMatchObject({ blockType: "footnote", id: "f1", text: "the note", marker: "claim" });
  });

  it("nests two link annotations rather than dropping the second", () => {
    const [p] = portableTextToLexical([
      block({
        markDefs: [
          { _key: "m1", _type: "link", href: "https://a.example" },
          { _key: "m2", _type: "link", href: "https://b.example" },
        ],
        children: [span("both", ["m1", "m2"])],
      }),
    ]).root.children as SerializedParagraphNode[];
    const outer = p.children[0] as SerializedLinkNode;
    const inner = outer.children[0] as SerializedLinkNode;
    expect([outer.id, inner.id]).toEqual(["m1", "m2"]);
    expect(outer.fields.url).toBe("https://a.example");
    expect(inner.fields.url).toBe("https://b.example");
    expect((inner.children[0] as { text: string }).text).toBe("both");
  });

  it("gives each footnote its own inline block; only the first can hold the marker text", () => {
    const [p] = portableTextToLexical([
      block({
        markDefs: [
          { _key: "f1", _type: "footnote", text: "first note" },
          { _key: "f2", _type: "footnote", text: "second note" },
        ],
        children: [span("claim", ["f1", "f2", "strong"])],
      }),
    ]).root.children as SerializedParagraphNode[];
    const fields = p.children.map((c) => (c as unknown as { fields: Record<string, unknown> }).fields);
    expect(fields.map((f) => f.id)).toEqual(["f1", "f2"]);
    expect(fields.map((f) => f.marker)).toEqual(["claim", ""]);
    expect(fields.map((f) => f.markerFormat)).toEqual([TEXT_FORMAT.bold, 0]);
  });

  it("the editor accepts the nested link — the shape is storable, not invented", async () => {
    const editor = await buildEditor();
    const state = portableTextToLexical([
      block({
        markDefs: [
          { _key: "m1", _type: "link", href: "https://a.example" },
          { _key: "m2", _type: "link", href: "https://b.example" },
        ],
        children: [span("both", ["m1", "m2"])],
      }),
    ]);
    const ids = collect(editor.parseEditorState(state as never).toJSON() as never, "link").map(
      (l) => (l as SerializedLinkNode).id,
    );
    expect(ids).toEqual(["m1", "m2"]);
  });

  it("still merges consecutive spans that share the whole annotation stack", () => {
    const [p] = two(["m1"]).root.children as SerializedParagraphNode[];
    expect(p.children).toHaveLength(1);
  });
});

describe("portableTextToLexical — the losses are reported, not silent (finding 4)", () => {
  const issuesOf = (blocks: unknown[]) => {
    const seen: { kind: string; detail: string }[] = [];
    portableTextToLexical(blocks, { onIssue: (i) => seen.push(i) });
    return seen;
  };

  it("reports a decorator it has no bit for", () => {
    expect(issuesOf([block({ children: [span("x", ["smallCaps"])] })]).map((i) => i.kind)).toEqual(["unknown-mark"]);
  });

  it("reports a markDef with no _key, which no span could reference", () => {
    expect(
      issuesOf([block({ markDefs: [{ _type: "link", href: "https://x" }], children: [span("x")] })]).map((i) => i.kind),
    ).toEqual(["keyless-mark-def"]);
  });

  it("reports a mark referencing a def its block does not declare", () => {
    expect(issuesOf([block({ markDefs: [], children: [span("x", ["ghost"])] })]).map((i) => i.kind)).toEqual([
      "unknown-mark",
    ]);
  });

  it("reports an embed property colliding with one of Payload's three reserved names", () => {
    const issues = issuesOf([{ _type: "storyChart", _key: "k1", id: "chart-7" }]);
    expect(issues.map((i) => i.kind)).toEqual(["reserved-field-collision"]);
    expect(issues[0].detail).toContain("id");
  });

  it("maps `sub` and `sup`, the two bits Task 10 emits that had no way back", () => {
    const [p] = portableTextToLexical([block({ children: [span("a", ["sub"]), span("b", ["sup"])] })])
      .root.children as SerializedParagraphNode[];
    expect(p.children.map((c) => (c as { format: number }).format)).toEqual([
      TEXT_FORMAT.subscript,
      TEXT_FORMAT.superscript,
    ]);
  });

  it.each(Object.keys(FIXTURES))("%s: a real body reports nothing at all", (name) => {
    expect(issuesOf(FIXTURES[name].blocks)).toEqual([]);
  });
});

describe("portableTextToLexical — reserved fields win over Sanity props (finding 5)", () => {
  it("a Sanity property named `id` cannot destroy the embed's _key", () => {
    const [node] = portableTextToLexical([
      { _type: "storyChart", _key: "sanitykey", id: "chart-7", caption: "C" },
    ]).root.children as SerializedBlockNode[];
    expect(node.fields.id).toBe("sanitykey");
    expect(node.fields.caption).toBe("C");
  });

  it("a Sanity property named `blockType` cannot rewrite the node's type", () => {
    const [node] = portableTextToLexical([{ _type: "image", _key: "i1", blockType: "youtube" }])
      .root.children as SerializedBlockNode[];
    expect(node.fields.blockType).toBe("image");
  });

  it("the same guard covers an inline object and a footnote def", () => {
    const [p] = portableTextToLexical([
      block({
        markDefs: [{ _key: "f1", _type: "footnote", text: "n", id: "not-the-key" }],
        children: [span("x", ["f1"]), { _type: "chip", _key: "c1", blockType: "hijack" } as never],
      }),
    ]).root.children as SerializedParagraphNode[];
    const fields = p.children.map((c) => (c as unknown as { fields: Record<string, unknown> }).fields);
    expect(fields[0].id).toBe("f1");
    expect(fields[1]).toMatchObject({ blockType: "chip", id: "c1" });
  });
});

describe("portableTextToLexical — an ordered list's start (finding 7)", () => {
  it("reads `listStart` back onto the list node", () => {
    const list = portableTextToLexical([
      block({ listItem: "number", level: 1, listStart: 5, children: [span("five")] }),
      block({ listItem: "number", level: 1, children: [span("six")] }),
    ]).root.children[0] as SerializedListNode;
    expect(list.start).toBe(5);
    expect(list.children).toHaveLength(2);
  });

  it("defaults to 1 when there is none, which is every list in the dataset", () => {
    const list = portableTextToLexical([block({ listItem: "number", level: 1, children: [span("one")] })])
      .root.children[0] as SerializedListNode;
    expect(list.start).toBe(1);
  });
});
