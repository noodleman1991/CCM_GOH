import { describe, expect, it } from "vitest";
import { createElement as h, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import config from "@payload-config";
import { editorConfigFactory, getEnabledNodes } from "@payloadcms/richtext-lexical";
import { createHeadlessEditor } from "@payloadcms/richtext-lexical/lexical/headless";
import { richTextEditor } from "@/payload/blocks/rich-text-embeds";
import { portableTextToLexical, type SerializedEditorState } from "@/lib/content/internal/lexical";
import { lexicalToPortableText } from "@/lib/content/internal/lexical-to-portable-text";
import { extractFootnotes, extractToc, headingId } from "@/lib/portable-text-headings";
import { splitContentAtReadMore } from "@/lib/portable-text-utils";
import fixtures from "./fixtures/portable-text.json";

/**
 * The property under test is `lexicalToPortableText(portableTextToLexical(x))`
 * **renders** identically to `x` — so the assertion is a rendered one, not a
 * structural one.
 *
 * ## Why the oracle is `@portabletext/react` and not `convertLexicalToHTML`
 *
 * Both sides of the comparison are Portable Text; the Lexical state is only the
 * intermediate. `convertLexicalToHTML` renders the intermediate, which would
 * test Payload's HTML converter rather than this adapter. Rendering both
 * Portable Text arrays through `@portabletext/react` runs them through the same
 * machinery the 36 real renderers use — `nestLists`, `buildMarksTree`,
 * `sortMarksByOccurences` — which is where a mark, a list level or a footnote
 * number would actually go wrong.
 *
 * ## The component map below is deliberately STRICTER than production
 *
 * `components/portable-text-renderer.tsx` ignores most of an embed's fields
 * (it reads `value.asset.url`, `value.videoId`, and so on). The map here dumps
 * every field of every non-block node into a `data-value` attribute, so a
 * property the adapter loses fails the test even when today's renderer would
 * not have shown it. Everything production *does* render — heading level, list
 * kind, checkbox state, mark nesting, link href, footnote numbering via
 * `extractFootnotes` — is mirrored one-for-one.
 *
 * The one production behaviour held back to its own test is `headingId`, which
 * builds an h2/h3 `id` out of the block's `_key`. Keys cannot survive Lexical
 * (Task 9 measured it), so that id necessarily changes; the test named
 * "heading anchor ids DO change" pins the loss instead of hiding it.
 */

const FIXTURES = fixtures as Record<string, { _id: string; field: string; blocks: unknown[] }>;

/* ----------------------------------------------------------- the oracle */

const sortedDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortedDeep);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((k) => [k, sortedDeep(record[k])]));
  }
  return value;
};

/** Every field of a node except `_key`, key-order-independent. */
const dumpValue = (value: unknown): string => {
  const { _key, ...rest } = (value ?? {}) as Record<string, unknown>;
  void _key;
  return JSON.stringify(sortedDeep(rest));
};

type AnyProps = { children?: ReactNode; value?: unknown; markType?: string };

/** The node a component was handed, as a plain record. */
const rec = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const tagged = (tag: string, props: Record<string, unknown> | null = null) =>
  function Tagged({ children }: AnyProps) {
    return h(tag, props, children);
  };

const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

const testComponents = (
  numberByKey: Record<string, number>,
  withHeadingIds: boolean,
): PortableTextComponents => ({
  types: {},
  // Every image / youtube / break / infoBox / story* / pullQuote / code /
  // references node, with all of its fields.
  unknownType: ({ value }: AnyProps) =>
    h("div", { "data-type": String(rec(value)._type), "data-value": dumpValue(value) }),
  block: {
    normal: tagged("p"),
    blockquote: tagged("blockquote"),
    ...Object.fromEntries(
      HEADINGS.map((tag) => [
        tag,
        function Heading({ children, value }: AnyProps) {
          return h(tag, withHeadingIds ? { id: headingId(rec(value)) } : null, children);
        },
      ]),
    ),
  },
  // lead / caption / sidebarNote / cta and anything else land here, rendered
  // distinctly so a style that collapses to `normal` fails the test.
  unknownBlockStyle: ({ children, value }: AnyProps) =>
    h("p", { "data-style": String(rec(value).style) }, children),
  list: {
    bullet: tagged("ul"),
    number: tagged("ol"),
    checkbox: tagged("ul", { "data-list": "checkbox" }),
  },
  listItem: {
    bullet: tagged("li"),
    number: tagged("li"),
    checkbox: ({ children, value }: AnyProps) =>
      h("li", { "data-checked": String(rec(value).checked === true) }, children),
  },
  unknownList: tagged("ul", { "data-list": "unknown" }),
  unknownListItem: tagged("li", { "data-item": "unknown" }),
  marks: {
    strong: tagged("strong"),
    em: tagged("em"),
    underline: tagged("u"),
    "strike-through": tagged("s"),
    highlight: tagged("mark"),
    code: tagged("code"),
    link: ({ children, value }: AnyProps) =>
      h(
        "a",
        { href: String(rec(value).href ?? "#"), "data-target": String(rec(value).target === true) },
        children,
      ),
    internalLink: ({ children, value }: AnyProps) =>
      h(
        "a",
        { "data-ref": String((rec(value).reference as { _ref?: string } | undefined)?._ref ?? "") },
        children,
      ),
    // Mirrors production: the marker text is discarded and the footnote's
    // number (from extractFootnotes, keyed by the markDef `_key`) is printed.
    footnote: ({ value }: AnyProps) => {
      const key = rec(value)._key;
      const n = typeof key === "string" ? numberByKey[key] : undefined;
      return n ? h("sup", { id: `fn-${n}` }, `[${n}]`) : null;
    },
  },
  unknownMark: ({ children, markType }: AnyProps) => h("span", { "data-mark": String(markType) }, children),
  hardBreak: () => h("br"),
});

/** The rendered form of a Portable Text array. */
const render = (blocks: unknown[], opts: { headingIds?: boolean } = {}): string => {
  const { numberByKey } = extractFootnotes(blocks as Parameters<typeof extractFootnotes>[0]);
  return renderToStaticMarkup(
    h(PortableText, {
      value: blocks as PortableTextBlock[],
      components: testComponents(numberByKey, opts.headingIds === true),
    }),
  );
};

/* ------------------------------------------------------- the round trips */

const roundTrip = (blocks: unknown[]): unknown[] => lexicalToPortableText(portableTextToLexical(blocks));

/** The editor built from THIS project's config — what Payload actually stores. */
const buildEditor = async () =>
  createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig: await editorConfigFactory.fromEditor({ config: await config, editor: richTextEditor() }),
    }),
    onError: (e) => {
      throw e;
    },
  });

/**
 * The Phase 3 pipeline in full: Portable Text -> Lexical -> through the editor
 * (`parseEditorState`, which is what normalises what Payload stores) -> back to
 * Portable Text. A round trip that only holds for the converter's own output
 * would not survive the first edit in the admin.
 */
const roundTripThroughEditor = async (blocks: unknown[]): Promise<unknown[]> => {
  const editor = await buildEditor();
  const stored = editor.parseEditorState(portableTextToLexical(blocks) as never).toJSON();
  return lexicalToPortableText(stored);
};

/* ------------------------------------------------------------- fragments */

const span = (text: string, marks: string[] = []) => ({ _type: "span", _key: `k-${text}`, text, marks });
const block = (over: Record<string, unknown> = {}) => ({
  _type: "block",
  _key: "b1",
  style: "normal",
  markDefs: [],
  children: [span("hello")],
  ...over,
});

const types = (blocks: unknown[]) => blocks.map((b) => (b as { _type: string })._type);
const styles = (blocks: unknown[]) => blocks.map((b) => (b as { style?: string }).style);
const textBlocks = (blocks: unknown[]) => blocks.filter((b) => (b as { _type?: string })._type === "block");

/* =================================================================== tests */

describe("the oracle discriminates (negative controls)", () => {
  // If the renderer above collapsed differences, every round-trip test below
  // would pass vacuously. These prove it does not.
  it("sees a changed link href", () => {
    const linked = [
      block({ markDefs: [{ _key: "m1", _type: "link", href: "https://a.example" }], children: [span("x", ["m1"])] }),
    ];
    const changed = JSON.parse(JSON.stringify(linked));
    changed[0].markDefs[0].href = "https://b.example";
    expect(render(changed)).not.toBe(render(linked));
  });

  it("sees a lost decorator", () => {
    expect(render([block({ children: [span("x", ["strong"])] })])).not.toBe(render([block({ children: [span("x")] })]));
  });

  it("sees a changed embed field the production renderer ignores", () => {
    const one = [{ _type: "image", _key: "i1", asset: { _ref: "image-a" }, credit: "Ada" }];
    const two = [{ _type: "image", _key: "i1", asset: { _ref: "image-a" }, credit: "Grace" }];
    expect(render(one)).not.toBe(render(two));
  });

  it("sees a changed heading level and a changed list kind", () => {
    expect(render([block({ style: "h2" })])).not.toBe(render([block({ style: "h3" })]));
    expect(render([block({ listItem: "bullet", level: 1 })])).not.toBe(
      render([block({ listItem: "number", level: 1 })]),
    );
  });

  it("sees renumbered footnotes", () => {
    const two = [
      block({
        markDefs: [
          { _key: "f1", _type: "footnote", text: "first" },
          { _key: "f2", _type: "footnote", text: "second" },
        ],
        children: [span("a", ["f1"]), span("b", ["f2"])],
      }),
    ];
    const swapped = JSON.parse(JSON.stringify(two));
    swapped[0].markDefs.reverse();
    expect(render(swapped)).not.toBe(render(two));
  });
});

describe("lexicalToPortableText — the real fixtures render identically", () => {
  it.each(Object.keys(FIXTURES))("%s: round trip renders byte-identical HTML", (name) => {
    const { blocks } = FIXTURES[name];
    expect(render(roundTrip(blocks))).toBe(render(blocks));
  });

  it.each(Object.keys(FIXTURES))("%s: and so does the trip through the editor itself", async (name) => {
    const { blocks } = FIXTURES[name];
    expect(render(await roundTripThroughEditor(blocks))).toBe(render(blocks));
  });

  it.each(Object.keys(FIXTURES))("%s: the block sequence is unchanged, type for type", (name) => {
    const { blocks } = FIXTURES[name];
    expect(types(roundTrip(blocks))).toEqual(types(blocks));
    // Only text blocks carry a style; the one style-less block in the dataset
    // comes back as the explicit `normal` it always rendered as.
    expect(styles(textBlocks(roundTrip(blocks)))).toEqual(
      styles(textBlocks(blocks)).map((s) => s ?? "normal"),
    );
  });

  it.each(Object.keys(FIXTURES))("%s: every markDef comes back with its key, type and fields", (name) => {
    const { blocks } = FIXTURES[name];
    const defsOf = (bs: unknown[]) =>
      bs.flatMap((b) => ((b as { markDefs?: Record<string, unknown>[] }).markDefs ?? []));
    expect(defsOf(roundTrip(blocks))).toEqual(defsOf(blocks));
  });

  it.each(Object.keys(FIXTURES))("%s: converting twice produces identical JSON (idempotent)", (name) => {
    const { blocks } = FIXTURES[name];
    expect(roundTrip(blocks)).toEqual(roundTrip(blocks));
  });

  it.each(Object.keys(FIXTURES))("%s: every span's text survives in order", (name) => {
    const { blocks } = FIXTURES[name];
    const text = (bs: unknown[]) =>
      bs
        .map((b) => {
          const node = b as { _type?: string; children?: { text?: string }[] };
          return node._type === "block" ? (node.children ?? []).map((c) => c.text ?? "").join("") : "";
        })
        .join("␟");
    expect(text(roundTrip(blocks))).toBe(text(blocks));
  });

  it("docsChapterExecutiveSummary: the footnote numbering is preserved key for key", () => {
    const { blocks } = FIXTURES.docsChapterExecutiveSummary;
    const before = extractFootnotes(blocks as Parameters<typeof extractFootnotes>[0]);
    const after = extractFootnotes(roundTrip(blocks) as Parameters<typeof extractFootnotes>[0]);
    expect(before.footnotes.length).toBeGreaterThan(0);
    expect(after.footnotes).toEqual(before.footnotes);
    expect(after.numberByKey).toEqual(before.numberByKey);
  });

  it("newsPost: the in-body image keeps every one of its Sanity fields", () => {
    const { blocks } = FIXTURES.newsPost;
    const images = (bs: unknown[]) => bs.filter((b) => (b as { _type?: string })._type === "image");
    expect(images(blocks)).toHaveLength(1);
    expect(images(roundTrip(blocks))).toEqual(images(blocks));
  });

  it("testimonial: the youtube node keeps its videoId and key", () => {
    const { blocks } = FIXTURES.testimonial;
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("caseStudy: the table of contents (headings and their order) is unchanged", () => {
    const { blocks } = FIXTURES.caseStudy;
    const toc = (bs: unknown[]) =>
      extractToc(bs as Parameters<typeof extractToc>[0]).map(({ text, level }) => ({ text, level }));
    expect(toc(blocks).length).toBeGreaterThan(0);
    expect(toc(roundTrip(blocks))).toEqual(toc(blocks));
  });
});

describe("lexicalToPortableText — blocks and styles", () => {
  it("returns [] for null, undefined and junk rather than throwing", () => {
    expect(lexicalToPortableText(null)).toEqual([]);
    expect(lexicalToPortableText(undefined)).toEqual([]);
    expect(lexicalToPortableText("nope")).toEqual([]);
    expect(lexicalToPortableText(42)).toEqual([]);
    expect(lexicalToPortableText({ root: { children: [] } })).toEqual([]);
  });

  it("accepts a bare root as well as the stored {root} wrapper", () => {
    const state = portableTextToLexical([block()]);
    expect(lexicalToPortableText(state.root)).toEqual(lexicalToPortableText(state));
  });

  it.each(["h1", "h2", "h3", "h4", "h5", "h6"])("brings heading %s back as that style", (style) => {
    expect(styles(roundTrip([block({ style })]))).toEqual([style]);
  });

  it("brings a quote back as `blockquote`", () => {
    expect(styles(roundTrip([block({ style: "blockquote" })]))).toEqual(["blockquote"]);
  });

  it("gives a heading with no tag the `normal` style rather than dropping it", () => {
    const state = { root: { children: [{ type: "heading", children: [{ type: "text", text: "x", format: 0 }] }] } };
    expect(lexicalToPortableText(state)).toMatchObject([{ _type: "block", style: "normal" }]);
  });

  it("renders a style-less block identically (1 such block exists in the dataset)", () => {
    const bare = [{ _type: "block", _key: "x", markDefs: [], children: [span("bare")] }];
    expect(render(roundTrip(bare))).toBe(render(bare));
  });
});

describe("lexicalToPortableText — marks", () => {
  it.each([
    ["strong", 1],
    ["em", 2],
    ["strike-through", 4],
    ["underline", 8],
    ["code", 16],
    ["sub", 32],
    ["sup", 64],
    ["highlight", 128],
  ])("decodes the %s bit (%i)", (name, bit) => {
    const state = { root: { children: [{ type: "paragraph", children: [{ type: "text", text: "x", format: bit }] }] } };
    const [b] = lexicalToPortableText(state) as { children: { marks: string[] }[] }[];
    expect(b.children[0].marks).toEqual([name]);
  });

  it("round-trips a span carrying two decorators (11 such spans exist)", () => {
    const both = [block({ children: [span("x", ["strong", "em"])] })];
    expect(render(roundTrip(both))).toBe(render(both));
  });

  it("round-trips a link, its href and its target", () => {
    const linked = [
      block({
        markDefs: [{ _key: "m1", _type: "link", href: "https://example.org", target: true }],
        children: [span("before"), span("linked", ["m1"]), span("after")],
      }),
    ];
    expect(roundTrip(linked)).toMatchObject([
      { markDefs: [{ _key: "m1", _type: "link", href: "https://example.org", target: true }] },
    ]);
    expect(render(roundTrip(linked))).toBe(render(linked));
  });

  it("splits a merged link back into one span per format run", () => {
    const linked = [
      block({
        markDefs: [{ _key: "m1", _type: "link", href: "https://example.org" }],
        children: [span("plain ", ["m1"]), span("bold", ["m1", "strong"])],
      }),
    ];
    expect(render(roundTrip(linked))).toBe(render(linked));
  });

  it("round-trips a footnote, including the marker's own decorators", () => {
    const noted = [
      block({
        markDefs: [{ _key: "f1", _type: "footnote", text: "the note" }],
        children: [span("body "), span("12", ["f1", "strong"])],
      }),
    ];
    const [out] = roundTrip(noted) as { markDefs: unknown[]; children: { text: string; marks: string[] }[] }[];
    expect(out.markDefs).toEqual([{ _key: "f1", _type: "footnote", text: "the note" }]);
    expect(out.children[1].text).toBe("12");
    expect(out.children[1].marks.sort()).toEqual(["f1", "strong"]);
    expect(render(roundTrip(noted))).toBe(render(noted));
  });

  it("keeps an internalLink's reference, with no collection to resolve it against", () => {
    const internal = [
      block({
        markDefs: [{ _key: "m1", _type: "internalLink", reference: { _type: "reference", _ref: "case-study-20" } }],
        children: [span("go", ["m1"])],
      }),
    ];
    expect(roundTrip(internal)).toMatchObject([
      { markDefs: [{ _key: "m1", _type: "internalLink", reference: { _ref: "case-study-20" } }] },
    ]);
    expect(render(roundTrip(internal))).toBe(render(internal));
  });

  it("turns a lexical linebreak into the hard break the renderer draws", () => {
    const state = {
      root: {
        children: [
          { type: "paragraph", children: [{ type: "text", text: "a", format: 0 }, { type: "linebreak" }, { type: "text", text: "b", format: 0 }] },
        ],
      },
    };
    expect(render(lexicalToPortableText(state))).toContain("<br/>");
  });
});

describe("lexicalToPortableText — lists", () => {
  const list = (items: [string, string, number][]) =>
    items.map(([text, listItem, level], i) => ({
      _type: "block",
      _key: `l${i}`,
      style: "normal",
      listItem,
      level,
      markDefs: [],
      children: [span(text)],
    }));

  it("round-trips a flat bullet list (305 items in the dataset)", () => {
    const bullets = list([
      ["one", "bullet", 1],
      ["two", "bullet", 1],
    ]);
    expect(render(roundTrip(bullets))).toBe(render(bullets));
  });

  it("round-trips a numbered list whose items carry no `level` at all (all 36 do not)", () => {
    const numbered = [
      { _type: "block", _key: "n1", style: "normal", listItem: "number", markDefs: [], children: [span("one")] },
      { _type: "block", _key: "n2", style: "normal", listItem: "number", markDefs: [], children: [span("two")] },
    ];
    // `@portabletext/toolkit` reads `block.level || 1`, so an absent level and
    // an explicit 1 nest the same — which is why re-emitting `level: 1` is safe.
    expect(render(roundTrip(numbered))).toBe(render(numbered));
    expect(roundTrip(numbered)).toMatchObject([{ level: 1 }, { level: 1 }]);
  });

  it("round-trips a nested list (no nesting exists in the dataset; the code is general)", () => {
    const nested = list([
      ["one", "bullet", 1],
      ["one a", "bullet", 2],
      ["one b", "bullet", 2],
      ["two", "bullet", 1],
    ]);
    expect(render(roundTrip(nested))).toBe(render(nested));
  });

  it("flattens a level-2 item that has no level-1 parent to level 1, and renders it the same", () => {
    // Task 9 has nowhere to hang an orphan level-2 item — with no parent item
    // to nest under it opens a top-level list — so it comes back at level 1.
    // `nestLists` renders both as a single <ul>, which is why this is a
    // structural difference and not a rendered one.
    const orphan = list([["deep", "bullet", 2]]);
    const back = roundTrip(orphan) as { listItem: string; level: number }[];
    expect(back).toHaveLength(1);
    expect(back[0]).toMatchObject({ listItem: "bullet", level: 1 });
    expect(render(roundTrip(orphan))).toBe(render(orphan));
  });

  it("round-trips a bullet run followed by a numbered run", () => {
    const mixed = list([
      ["a", "bullet", 1],
      ["b", "number", 1],
    ]);
    expect(render(roundTrip(mixed))).toBe(render(mixed));
  });

  it("keeps a list item's marks and links", () => {
    const items = [
      {
        _type: "block",
        _key: "l1",
        style: "normal",
        listItem: "bullet",
        level: 1,
        markDefs: [{ _key: "m1", _type: "link", href: "https://example.org" }],
        children: [span("see ", []), span("this", ["m1", "em"])],
      },
    ];
    expect(render(roundTrip(items))).toBe(render(items));
  });

  it("brings a checkbox list back as `checkbox` (0 exist; unit-tested only)", () => {
    const checks = list([["todo", "checkbox", 1]]);
    expect(roundTrip(checks)).toMatchObject([{ listItem: "checkbox", checked: false }]);
  });
});

describe("lexicalToPortableText — embeds", () => {
  const embed = (value: Record<string, unknown>) => [value];

  it.each([
    ["image", { asset: { _ref: "image-abc-800x600-png" }, alt: "Alt", placement: "start", credit: "Ada" }],
    ["youtube", { videoId: "dQw4w9WgXcQ" }],
    ["break", { style: "readMore" }],
    ["infoBox", { variant: "warning", content: [] }],
    ["storyTimeline", { items: [{ _key: "i1", date: "2020", title: "T", text: "x" }] }],
    ["storyChart", { renderStatus: "ok", renderedSvg: "<svg/>", caption: "C", source: "S", sourceUrl: "https://s" }],
    ["storyMermaid", { renderStatus: "ok", renderedSvg: "<svg/>" }],
    ["pullQuote", { text: "Quoted", attribution: "Someone" }],
    ["code", { code: "const a = 1;", language: "ts", filename: "a.ts" }],
    ["references", { items: [{ _key: "r1", text: "Ref", url: "https://r" }] }],
  ])("round-trips a `%s` node field for field", (type, props) => {
    const nodes = embed({ _type: type, _key: `${type}-1`, ...props });
    expect(roundTrip(nodes)).toEqual(nodes);
    expect(render(roundTrip(nodes))).toBe(render(nodes));
  });

  it("keeps a readMore break findable by splitContentAtReadMore", () => {
    const body = [block({ children: [span("before")] }), { _type: "break", _key: "br1", style: "readMore" }, block({ children: [span("after")] })];
    const split = splitContentAtReadMore(roundTrip(body) as PortableTextBlock[]);
    expect(split.hasReadMoreBreak).toBe(true);
    expect(split.readMoreIndex).toBe(1);
  });

  it("carries an unanticipated Sanity type through rather than dropping it", () => {
    const odd = [{ _type: "somethingNew", _key: "x1", payload: { deep: true } }];
    expect(roundTrip(odd)).toEqual(odd);
  });

  it("strips Payload's three reserved `fields` members on the way back", () => {
    // No stored embed carries a property called `id`, `blockType` or
    // `blockName` (measured across all 886 documents), so those three names
    // belong to Payload and are stripped on the way back. The collision case —
    // a Sanity property that DOES use one of the names — is the test below.
    const state = {
      root: {
        children: [
          { type: "block", version: 2, fields: { blockName: "", blockType: "image", id: "i1", alt: "A" } },
        ],
      },
    };
    expect(lexicalToPortableText(state)).toEqual([{ _type: "image", _key: "i1", alt: "A" }]);
  });

  it("maps a lexical horizontal rule (admin-only, never imported) to a `break`", () => {
    const state = { root: { children: [{ type: "horizontalrule", version: 1 }] } };
    expect(lexicalToPortableText(state)).toMatchObject([{ _type: "break", style: "hr" }]);
  });

  it("passes an admin-inserted upload node through as its own type rather than losing it", () => {
    const state = { root: { children: [{ type: "upload", version: 3, relationTo: "media", value: "abc" }] } };
    expect(lexicalToPortableText(state)).toMatchObject([{ _type: "upload", relationTo: "media", value: "abc" }]);
  });
});

describe("synthesized keys", () => {
  it("mints a unique key for every block and span", () => {
    const { blocks } = FIXTURES.docsChapterActionAgenda;
    const back = roundTrip(blocks) as { _key: string; children?: { _key: string }[] }[];
    const blockKeys = back.map((b) => b._key);
    expect(new Set(blockKeys).size).toBe(blockKeys.length);
    for (const b of back) {
      const spanKeys = (b.children ?? []).map((c) => c._key);
      expect(new Set(spanKeys).size).toBe(spanKeys.length);
      for (const k of spanKeys) expect(k).toBeTruthy();
    }
  });

  it("derives the key from the block's own content, so an edit above it moves nothing", () => {
    const body = [block({ style: "h2", _key: "a", children: [span("Executive Summary")] }), block({ _key: "b" })];
    const withInsert = [block({ _key: "z", children: [span("new opening") ] }), ...body];
    const keyOf = (bs: unknown[], text: string) =>
      (roundTrip(bs) as { _key: string; children?: { text: string }[] }[]).find(
        (b) => (b.children ?? []).map((c) => c.text).join("") === text,
      )?._key;
    expect(keyOf(body, "Executive Summary")).toBe(keyOf(withInsert, "Executive Summary"));
  });

  it("keeps two identical headings apart, which is what headingId needs the key for", () => {
    const twice = [block({ style: "h2", children: [span("Overview")] }), block({ style: "h2", children: [span("Overview")] })];
    const back = roundTrip(twice) as { _key: string }[];
    expect(back[0]._key).not.toBe(back[1]._key);
    expect(new Set(extractToc(roundTrip(twice) as Parameters<typeof extractToc>[0]).map((t) => t.id)).size).toBe(2);
  });

  it("reuses the Sanity `_key` wherever Payload had a slot for it (embeds and markDefs)", () => {
    const body = [
      { _type: "image", _key: "sanity-image-key", asset: { _ref: "image-a" } },
      block({ markDefs: [{ _key: "sanity-def-key", _type: "link", href: "https://x" }], children: [span("x", ["sanity-def-key"])] }),
    ];
    const back = roundTrip(body) as { _key: string; markDefs?: { _key: string }[] }[];
    expect(back[0]._key).toBe("sanity-image-key");
    expect(back[1].markDefs?.[0]._key).toBe("sanity-def-key");
  });
});

describe("what does NOT round-trip — pinned, not hidden", () => {
  it("heading anchor ids DO change: the slug survives, the key suffix does not", () => {
    const heading = [block({ style: "h2", _key: "9fce1a2b", children: [span("Executive Summary")] })];
    const [before] = heading;
    const [after] = roundTrip(heading) as Record<string, unknown>[];
    const idBefore = headingId(before as never);
    const idAfter = headingId(after as never);
    expect(idBefore).toBe("executive-summary-9fce1a2b");
    expect(idAfter.startsWith("executive-summary-")).toBe(true);
    expect(idAfter).not.toBe(idBefore);
    // Consequence, stated: with `headingId` rendered, the HTML differs.
    expect(render(roundTrip(heading), { headingIds: true })).not.toBe(render(heading, { headingIds: true }));
    // Without it — everything else about the heading — it does not.
    expect(render(roundTrip(heading))).toBe(render(heading));
  });

  it("the anchor is at least stable: converting the same body twice gives the same id", () => {
    const heading = [block({ style: "h2", _key: "9fce1a2b", children: [span("Executive Summary")] })];
    const once = headingId((roundTrip(heading) as never[])[0]);
    const twice = headingId((roundTrip(heading) as never[])[0]);
    expect(once).toBe(twice);
  });

  it("the four never-authored paragraph styles collapse to `normal`", () => {
    for (const style of ["lead", "caption", "sidebarNote", "cta"]) {
      expect(styles(roundTrip([block({ style })]))).toEqual(["normal"]);
      expect(render(roundTrip([block({ style })]))).not.toBe(render([block({ style })]));
    }
  });

  it("a ticked checkbox comes back unticked (Task 9 writes checked:false)", () => {
    const ticked = [
      { _type: "block", _key: "c1", style: "normal", listItem: "checkbox", level: 1, checked: true, markDefs: [], children: [span("done")] },
    ];
    expect(roundTrip(ticked)).toMatchObject([{ checked: false }]);
    expect(render(roundTrip(ticked))).not.toBe(render(ticked));
  });

  it("an empty span is dropped, but renders the same either way", () => {
    const empty = [block({ children: [span(""), span("text")] })];
    expect((roundTrip(empty) as { children: unknown[] }[])[0].children).toHaveLength(1);
    expect(render(roundTrip(empty))).toBe(render(empty));
  });
});

/* ===================================================================== */
/* The review round's seven findings. All 0-occurrence in production_2   */
/* and reachable only from the admin Phase 3 turns on, so the Lexical    */
/* states below are authored directly rather than round-tripped from a   */
/* Sanity fixture.                                                       */
/* ===================================================================== */

/** The other direction: a state authored in the admin, out to Portable Text and back. */
const lexicalRoundTrip = (state: unknown): SerializedEditorState =>
  portableTextToLexical(lexicalToPortableText(state));

const rootOf = (children: unknown[]) => ({
  root: { children, direction: null, format: "", indent: 0, type: "root", version: 1 },
});
const textNode = (text: string, format = 0) => ({
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  type: "text",
  version: 1,
});
const linkNode = (id: string, url: string, children: unknown[]) => ({
  children,
  direction: null,
  format: "",
  indent: 0,
  type: "link",
  version: 3,
  id,
  fields: { linkType: "custom", newTab: false, url },
});

describe("lexicalToPortableText — alignment and indent (finding 1)", () => {
  it("brings a centred, indented paragraph back with both facts on the block", () => {
    const state = rootOf([
      { type: "paragraph", version: 1, format: "center", indent: 2, children: [textNode("centred")] },
    ]);
    expect(lexicalToPortableText(state)).toMatchObject([{ _type: "block", textAlign: "center", indent: 2 }]);
  });

  it("does the same for a heading, a quote and a list item", () => {
    const state = rootOf([
      { type: "heading", version: 1, tag: "h2", format: "right", indent: 1, children: [textNode("h")] },
      { type: "quote", version: 1, format: "justify", indent: 0, children: [textNode("q")] },
      {
        type: "list",
        version: 1,
        listType: "bullet",
        tag: "ul",
        start: 1,
        format: "",
        indent: 0,
        children: [
          { type: "listitem", version: 1, value: 1, format: "center", indent: 0, children: [textNode("i")] },
        ],
      },
    ]);
    expect(lexicalToPortableText(state)).toMatchObject([
      { style: "h2", textAlign: "right", indent: 1 },
      { style: "blockquote", textAlign: "justify" },
      { listItem: "bullet", textAlign: "center" },
    ]);
  });

  it("survives the whole trip back into Lexical, which is what an editor would see", () => {
    const state = rootOf([
      { type: "paragraph", version: 1, format: "center", indent: 2, children: [textNode("centred")] },
    ]);
    const back = lexicalRoundTrip(state).root.children[0] as { format: string; indent: number };
    expect([back.format, back.indent]).toEqual(["center", 2]);
  });

  it("keeps an embedded block's alignment across the round trip", () => {
    const state = rootOf([
      { type: "block", version: 2, format: "center", fields: { blockName: "", blockType: "youtube", id: "y1", videoId: "v" } },
    ]);
    expect(lexicalToPortableText(state)).toMatchObject([{ _type: "youtube", textAlign: "center", videoId: "v" }]);
    expect((lexicalRoundTrip(state).root.children[0] as { format: string }).format).toBe("center");
  });

  it("writes neither property for an unaligned element, so no Sanity body gains one", () => {
    const { blocks } = FIXTURES.docsChapterActionAgenda;
    const keys = new Set(roundTrip(blocks).flatMap((b) => Object.keys(b as Record<string, unknown>)));
    expect(keys.has("textAlign")).toBe(false);
    expect(keys.has("indent")).toBe(false);
  });
});

describe("lexicalToPortableText — a decorator leaf inside an element (finding 2)", () => {
  const image = {
    type: "block",
    version: 2,
    format: "",
    fields: { blockName: "", blockType: "image", id: "i9", asset: { _ref: "image-a" }, alt: "A" },
  };

  it("carries an embedded block that sits inside a list item", () => {
    const state = rootOf([
      {
        type: "list",
        version: 1,
        listType: "bullet",
        tag: "ul",
        start: 1,
        format: "",
        indent: 0,
        children: [
          { type: "listitem", version: 1, value: 1, format: "", indent: 0, children: [textNode("item"), image] },
        ],
      },
    ]);
    const [item] = lexicalToPortableText(state) as { children: Record<string, unknown>[] }[];
    expect(item.children.map((c) => c._type)).toEqual(["span", "image"]);
    expect(item.children[1]).toMatchObject({ _key: "i9", asset: { _ref: "image-a" }, alt: "A" });
  });

  it("carries one that sits inside a quote", () => {
    const state = rootOf([
      { type: "quote", version: 1, format: "", indent: 0, children: [textNode("q"), { ...image, fields: { ...image.fields, blockType: "youtube", id: "y1", videoId: "dQw4" } }] },
    ]);
    const [quote] = lexicalToPortableText(state) as { children: Record<string, unknown>[] }[];
    expect(quote.children.map((c) => c._type)).toEqual(["span", "youtube"]);
    expect(quote.children[1]).toMatchObject({ _key: "y1", videoId: "dQw4" });
  });

  it("carries an upload and a relationship the same way, rather than deleting them", () => {
    const state = rootOf([
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        children: [
          textNode("see "),
          { type: "upload", version: 3, relationTo: "media", value: "abc" },
          { type: "relationship", version: 2, relationTo: "case-studies", value: "cs-1" },
        ],
      },
    ]);
    const [p] = lexicalToPortableText(state) as { children: Record<string, unknown>[] }[];
    expect(p.children.map((c) => c._type)).toEqual(["span", "upload", "relationship"]);
    expect(p.children[1]).toMatchObject({ relationTo: "media", value: "abc" });
    expect(p.children[2]).toMatchObject({ relationTo: "case-studies", value: "cs-1" });
  });

  it("renders it — a Portable Text renderer is handed the node, not a hole", () => {
    const state = rootOf([
      { type: "quote", version: 1, format: "", indent: 0, children: [textNode("q"), image] },
    ]);
    expect(render(lexicalToPortableText(state))).toContain('data-type="image"');
  });
});

describe("lexicalToPortableText — overlapping annotations (finding 3)", () => {
  it("round-trips a span carrying a link AND a footnote, render included", () => {
    const both = [
      block({
        markDefs: [
          { _key: "m1", _type: "link", href: "https://a.example" },
          { _key: "f1", _type: "footnote", text: "the note" },
        ],
        children: [span("claim", ["m1", "f1"])],
      }),
    ];
    const [out] = roundTrip(both) as { markDefs: unknown[]; children: { text: string; marks: string[] }[] }[];
    expect(out.markDefs).toEqual([
      { _key: "m1", _type: "link", href: "https://a.example" },
      { _key: "f1", _type: "footnote", text: "the note" },
    ]);
    expect(out.children[0].marks.sort()).toEqual(["f1", "m1"]);
    expect(render(roundTrip(both))).toBe(render(both));
  });

  it("round-trips a span carrying two links, render included", () => {
    const both = [
      block({
        markDefs: [
          { _key: "m1", _type: "link", href: "https://a.example" },
          { _key: "m2", _type: "link", href: "https://b.example" },
        ],
        children: [span("both", ["m1", "m2"])],
      }),
    ];
    const [out] = roundTrip(both) as { markDefs: { href: string }[]; children: { marks: string[] }[] }[];
    expect(out.markDefs.map((d) => d.href)).toEqual(["https://a.example", "https://b.example"]);
    expect(out.children[0].marks.sort()).toEqual(["m1", "m2"]);
    expect(render(roundTrip(both))).toBe(render(both));
  });

  it("keeps both footnote defs when two sit on one span", () => {
    const both = [
      block({
        markDefs: [
          { _key: "f1", _type: "footnote", text: "first note" },
          { _key: "f2", _type: "footnote", text: "second note" },
        ],
        children: [span("claim", ["f1", "f2"])],
      }),
    ];
    const [out] = roundTrip(both) as { markDefs: unknown[]; children: { text: string; marks: string[] }[] }[];
    expect(out.markDefs).toEqual([
      { _key: "f1", _type: "footnote", text: "first note" },
      { _key: "f2", _type: "footnote", text: "second note" },
    ]);
    expect(out.children.map((c) => c.text)).toEqual(["claim", ""]);
    // Both numbers survive `extractFootnotes`, which is what the renderer prints.
    expect(extractFootnotes(roundTrip(both) as Parameters<typeof extractFootnotes>[0]).footnotes).toHaveLength(2);
  });
});

describe("lexicalToPortableText — two annotations sharing an id (finding 6)", () => {
  it("keeps both hrefs instead of collapsing them onto the first", () => {
    const state = rootOf([
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        children: [
          linkNode("same", "https://a.example", [textNode("a")]),
          textNode(" and "),
          linkNode("same", "https://b.example", [textNode("b")]),
        ],
      },
    ]);
    const [p] = lexicalToPortableText(state) as { markDefs: { _key: string; href: string }[]; children: { text: string; marks: string[] }[] }[];
    expect(p.markDefs.map((d) => d.href)).toEqual(["https://a.example", "https://b.example"]);
    expect(p.markDefs.map((d) => d._key)).toEqual(["same", "same-2"]);
    expect(p.children.filter((c) => c.marks.length > 0).map((c) => c.marks)).toEqual([["same"], ["same-2"]]);
    expect(render(lexicalToPortableText(state))).toContain("https://b.example");
  });

  it("still collapses one Sanity annotation that arrives as two link nodes", () => {
    // Task 9 merges only CONSECUTIVE spans, so a link split by an unlinked word
    // produces two link nodes with the same id and the same href — one markDef.
    const split = [
      block({
        markDefs: [{ _key: "m1", _type: "link", href: "https://example.org" }],
        children: [span("one", ["m1"]), span(" gap "), span("two", ["m1"])],
      }),
    ];
    const [out] = roundTrip(split) as { markDefs: unknown[] }[];
    expect(out.markDefs).toEqual([{ _key: "m1", _type: "link", href: "https://example.org" }]);
    expect(render(roundTrip(split))).toBe(render(split));
  });
});

describe("lexicalToPortableText — an ordered list's start (finding 7)", () => {
  const ol = (start: number) =>
    rootOf([
      {
        type: "list",
        version: 1,
        listType: "number",
        tag: "ol",
        start,
        format: "",
        indent: 0,
        children: [
          { type: "listitem", version: 1, value: 1, format: "", indent: 0, children: [textNode("five")] },
          { type: "listitem", version: 1, value: 2, format: "", indent: 0, children: [textNode("six")] },
        ],
      },
    ]);

  it("puts `start` on the block that opens the run, and only that one", () => {
    const back = lexicalToPortableText(ol(5)) as Record<string, unknown>[];
    expect(back.map((b) => b.listStart)).toEqual([5, undefined]);
  });

  it("survives back into Lexical", () => {
    expect((lexicalRoundTrip(ol(5)).root.children[0] as { start: number }).start).toBe(5);
  });

  it("writes nothing for the default start of 1, which is every list in the dataset", () => {
    const back = lexicalToPortableText(ol(1)) as Record<string, unknown>[];
    expect(back.some((b) => "listStart" in b)).toBe(false);
  });
});

describe("lexicalToPortableText — a Sanity property using a reserved name (finding 5)", () => {
  it("keeps the real `_key` when an embed also carries a property called `id`", () => {
    const source = [{ _type: "storyChart", _key: "sanitykey", id: "chart-7", caption: "C" }];
    expect(roundTrip(source)).toMatchObject([{ _type: "storyChart", _key: "sanitykey", caption: "C" }]);
  });

  it("keeps the real `_type` when an embed carries a property called `blockType`", () => {
    const source = [{ _type: "image", _key: "i1", blockType: "youtube", alt: "A" }];
    expect(roundTrip(source)).toMatchObject([{ _type: "image", _key: "i1", alt: "A" }]);
  });
});
