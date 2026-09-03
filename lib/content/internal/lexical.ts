/**
 * Portable Text -> Lexical (Payload's rich-text format).
 *
 * Task 10 builds the inverse, `lexicalToPortableText`, and the property that
 * matters is that `lexicalToPortableText(portableTextToLexical(x))` *renders*
 * identically to `x`. So every mapping here is chosen to be reversible, and
 * everything this file cannot carry across is listed under "What is dropped"
 * at the bottom.
 *
 * ## The shapes are measured, not read out of the docs
 *
 * Every node shape below was serialized out of an editor built from THIS
 * project's own config (`editorConfigFactory.fromFeatures` + `getEnabledNodes`
 * + `createHeadlessEditor`), then fed back through `parseEditorState` to prove
 * the editor accepts it. Two of them differ from bare Lexical and would have
 * been wrong if guessed:
 *
 *   - The embedded block is a DecoratorBlockNode LEAF at **version 2** —
 *     `{type:"block", version:2, format:"", fields:{blockName, blockType, id, ...}}`.
 *     No `children`, no `direction`, no `indent`.
 *   - The link is Payload's `LinkFeature` node at **version 3**, which carries
 *     a `fields` object — `{linkType, newTab, url}` — NOT bare Lexical's
 *     `{url, rel, target, title}`.
 *
 * `format` on a text node is a bitmask, also measured: bold 1, italic 2,
 * strikethrough 4, underline 8, code 16, subscript 32, superscript 64,
 * highlight 128.
 *
 * ## The surface, measured across all 886 documents in production_2
 *
 * 377 Portable Text arrays holding 2072 `block`, 41 `image`, 36 `youtube`.
 * Styles: normal 1830, h2 193, h3 19, h4 16, h1 11, blockquote 2, absent 1.
 * Lists: bullet 305, number 36 — `level` is always 1, nothing nests.
 * Decorators: strong 457, em 198 only. Annotations: link 88, footnote 80,
 * internalLink 0. Three spans carry `footnote` AND `strong` together, which is
 * why the footnote inline block records the decorator bitmask it displaced.
 *
 * The five registered-but-never-authored embeds (`break`, `infoBox`,
 * `storyTimeline`, `storyChart`, `storyMermaid`) have no stored instance to
 * check against, so they ride the same generic embed path as `image` and
 * `youtube` and are covered by unit tests only.
 */

/** Lexical's text-format bitmask. Measured, not quoted. */
export const TEXT_FORMAT = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
  subscript: 32,
  superscript: 64,
  highlight: 128,
} as const;

/**
 * Sanity decorator -> Lexical format bit. Only `strong` and `em` occur in the
 * dataset; the rest are declared by `styled-block-content`'s schema and are
 * mapped so an editor who uses one tomorrow does not silently lose it.
 */
const DECORATOR_BITS: Record<string, number> = {
  strong: TEXT_FORMAT.bold,
  em: TEXT_FORMAT.italic,
  "strike-through": TEXT_FORMAT.strikethrough,
  strikethrough: TEXT_FORMAT.strikethrough,
  underline: TEXT_FORMAT.underline,
  code: TEXT_FORMAT.code,
  highlight: TEXT_FORMAT.highlight,
};

/**
 * The `blockType` of an embed is the Sanity `_type`, verbatim. That identity is
 * the whole inverse rule for Task 10 — `blockType` in, `_type` out — and
 * `payload/blocks/rich-text-embeds.ts` registers exactly these slugs so the
 * admin can open what this file writes. A test asserts the two sets match.
 */
export const EMBED_BLOCK_TYPES = [
  "image",
  "youtube",
  "break",
  "infoBox",
  "storyTimeline",
  "storyChart",
  "storyMermaid",
] as const;

/** The `blockType` of the inline block that carries a `footnote` annotation. */
export const FOOTNOTE_BLOCK_TYPE = "footnote";

/* ------------------------------------------------------------------ types */

export interface SerializedTextNode {
  detail: number;
  format: number;
  mode: "normal";
  style: string;
  text: string;
  type: "text";
  version: 1;
}

export interface SerializedInlineBlockNode {
  type: "inlineBlock";
  version: 1;
  fields: { blockName: string; blockType: string; id: string } & Record<string, unknown>;
}

export interface SerializedLinkNode {
  children: SerializedInlineNode[];
  direction: null;
  format: "";
  indent: 0;
  type: "link";
  version: 3;
  id: string;
  fields: { linkType: "custom" | "internal"; newTab: boolean; url?: string; doc?: unknown };
}

export type SerializedInlineNode = SerializedTextNode | SerializedLinkNode | SerializedInlineBlockNode;

export interface SerializedBlockNode {
  type: "block";
  version: 2;
  format: "";
  fields: { blockName: string; blockType: string; id: string } & Record<string, unknown>;
}

interface ElementBase {
  direction: null;
  format: "";
  indent: number;
  version: 1;
}

export interface SerializedParagraphNode extends ElementBase {
  type: "paragraph";
  children: SerializedInlineNode[];
  textFormat: number;
  textStyle: string;
}

export interface SerializedHeadingNode extends ElementBase {
  type: "heading";
  children: SerializedInlineNode[];
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export interface SerializedQuoteNode extends ElementBase {
  type: "quote";
  children: SerializedInlineNode[];
}

export interface SerializedListItemNode extends ElementBase {
  type: "listitem";
  children: SerializedInlineNode[];
  value: number;
  checked?: boolean;
}

export interface SerializedListNode extends ElementBase {
  type: "list";
  children: SerializedListItemNode[];
  listType: "bullet" | "number" | "check";
  start: number;
  tag: "ul" | "ol";
}

export type SerializedRootChild =
  | SerializedParagraphNode
  | SerializedHeadingNode
  | SerializedQuoteNode
  | SerializedListNode
  | SerializedBlockNode;

export interface SerializedEditorState {
  root: ElementBase & { type: "root"; children: SerializedRootChild[] };
}

/* ------------------------------------------------------- input narrowing */

interface PortableTextSpan {
  _key?: string;
  _type?: string;
  text?: string;
  marks?: string[];
}

interface PortableTextMarkDef {
  _key?: string;
  _type?: string;
  [key: string]: unknown;
}

interface PortableTextBlock {
  _key?: string;
  _type?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: unknown[];
  markDefs?: unknown[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/* ------------------------------------------------------------- id minting */

/**
 * Payload's block/inlineBlock/link nodes each require an `id`. Where the
 * Portable Text node or markDef has a `_key` we reuse it verbatim — that is
 * how the key survives the round trip. Where it does not (6 documents in the
 * dataset have `_key`-less nodes), we mint a deterministic one so converting
 * the same input twice produces the same JSON; a random id would make the
 * import non-idempotent, which is the one property Phase 2 cannot lose.
 */
function mintId(prefix: string, counter: { n: number }): string {
  counter.n += 1;
  return `${prefix}-${counter.n}`;
}

/* -------------------------------------------------------------- builders */

function textNode(text: string, format: number): SerializedTextNode {
  return { detail: 0, format, mode: "normal", style: "", text, type: "text", version: 1 };
}

function element<T extends string>(type: T, indent: number) {
  return { direction: null as null, format: "" as const, indent, version: 1 as const, type };
}

function embedNode(blockType: string, id: string, props: Record<string, unknown>): SerializedBlockNode {
  return {
    type: "block",
    version: 2,
    format: "",
    fields: { blockName: "", blockType, id, ...props },
  };
}

/* ---------------------------------------------------------------- inline */

/**
 * The span's decorators, folded into one bitmask. Unknown decorators are
 * ignored rather than guessed at — there are none in the dataset, and
 * inventing a bit would put a format on the text that no editor can clear.
 */
function spanFormat(marks: string[], defKeys: Set<string>): number {
  let format = 0;
  for (const m of marks) {
    if (defKeys.has(m)) continue;
    format |= DECORATOR_BITS[m] ?? 0;
  }
  return format;
}

function annotationKey(marks: string[], defKeys: Set<string>): string | undefined {
  return marks.find((m) => defKeys.has(m));
}

function linkFields(def: PortableTextMarkDef): SerializedLinkNode["fields"] {
  if (def._type === "internalLink") {
    // Zero occurrences in production_2. Carried through as an internal link
    // whose `doc` is the raw Sanity reference; Task 12 (which holds the id
    // map) is the only place that can resolve `relationTo`.
    const ref = isRecord(def.reference) ? asString(def.reference._ref) : undefined;
    return { linkType: "internal", newTab: false, doc: ref ?? null };
  }
  return {
    linkType: "custom",
    newTab: def.target === true,
    url: asString(def.href) ?? "",
  };
}

/**
 * One Portable Text block's `children` become Lexical inline nodes.
 *
 * Consecutive spans sharing the same annotation key collapse into a single
 * link node. No such run exists in the dataset today (measured: 0), but a
 * Portable Text editor produces them the moment a link straddles a bold word,
 * and splitting one link into two `<a>` elements would change the render.
 */
function convertChildren(
  children: unknown[],
  markDefs: PortableTextMarkDef[],
  counter: { n: number },
): SerializedInlineNode[] {
  const defsByKey = new Map<string, PortableTextMarkDef>();
  for (const d of markDefs) {
    const key = asString(d._key);
    if (key) defsByKey.set(key, d);
  }
  const defKeys = new Set(defsByKey.keys());

  const out: SerializedInlineNode[] = [];

  for (const raw of children) {
    if (!isRecord(raw)) continue;
    const span = raw as PortableTextSpan;

    // A non-span child of a block (Portable Text allows inline objects).
    // None exist in production_2; carried as an inline block so nothing is
    // silently deleted.
    if (span._type !== undefined && span._type !== "span") {
      const { _key, _type, ...props } = raw as Record<string, unknown>;
      out.push({
        type: "inlineBlock",
        version: 1,
        fields: {
          blockName: "",
          blockType: String(_type),
          id: asString(_key) ?? mintId("inline", counter),
          ...props,
        },
      });
      continue;
    }

    const text = span.text ?? "";
    const marks = Array.isArray(span.marks) ? span.marks.filter((m): m is string => typeof m === "string") : [];
    const format = spanFormat(marks, defKeys);
    const key = annotationKey(marks, defKeys);
    const def = key ? defsByKey.get(key) : undefined;

    if (!def) {
      // Lexical drops empty text nodes on parse; emitting one would make the
      // converter's output differ from what the editor stores.
      if (text === "") continue;
      out.push(textNode(text, format));
      continue;
    }

    if (def._type === "footnote") {
      // A footnote is an annotation on a span, and Lexical has no arbitrary
      // text mark. It becomes an inline block that carries BOTH halves: the
      // note (`text`, the Sanity field name) and the span text it was attached
      // to (`marker`), plus the decorator bitmask that span also had — three
      // spans in the dataset are `footnote` + `strong`, and a footnote node
      // with no room for the bold would lose it.
      const props = { ...(def as Record<string, unknown>) };
      delete props._key;
      delete props._type;
      out.push({
        type: "inlineBlock",
        version: 1,
        fields: {
          blockName: "",
          blockType: FOOTNOTE_BLOCK_TYPE,
          id: asString(def._key) ?? mintId("footnote", counter),
          ...props,
          marker: text,
          markerFormat: format,
        },
      });
      continue;
    }

    // Link (or any other annotation, which renders as a link in the Sanity
    // renderer too). Merge into the previous node when it is the same link.
    const previous = out[out.length - 1];
    if (previous && previous.type === "link" && previous.id === key) {
      if (text !== "") previous.children.push(textNode(text, format));
      continue;
    }
    out.push({
      children: text === "" ? [] : [textNode(text, format)],
      direction: null,
      format: "",
      indent: 0,
      type: "link",
      version: 3,
      id: key ?? mintId("link", counter),
      fields: linkFields(def),
    });
  }

  return out;
}

/* ----------------------------------------------------------------- blocks */

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

const LIST_TAGS: Record<string, { listType: "bullet" | "number" | "check"; tag: "ul" | "ol" }> = {
  bullet: { listType: "bullet", tag: "ul" },
  number: { listType: "number", tag: "ol" },
  checkbox: { listType: "check", tag: "ul" },
};

function convertTextBlock(
  block: PortableTextBlock,
  counter: { n: number },
): SerializedParagraphNode | SerializedHeadingNode | SerializedQuoteNode {
  const children = convertChildren(
    Array.isArray(block.children) ? block.children : [],
    (Array.isArray(block.markDefs) ? block.markDefs : []).filter(isRecord) as PortableTextMarkDef[],
    counter,
  );
  const style = block.style;

  if (style && HEADING_TAGS.has(style)) {
    return { ...element("heading", 0), children, tag: style as SerializedHeadingNode["tag"] };
  }
  if (style === "blockquote") {
    return { ...element("quote", 0), children };
  }
  // `normal`, an absent style (1 block in the dataset), and the four
  // styled-block-content extras (`lead`, `caption`, `sidebarNote`, `cta`,
  // all 0 occurrences) are all paragraphs. Lexical has no per-paragraph style
  // slot that survives a parse, so a `lead` paragraph would come back
  // `normal` — see "What is dropped".
  return { ...element("paragraph", 0), children, textFormat: 0, textStyle: "" };
}

/**
 * Portable Text expresses a list as a run of sibling blocks each carrying
 * `listItem` and `level`; Lexical nests a `list` around `listitem` children.
 * `level` is 1 on all 341 list blocks in the dataset, but a level-2 run has to
 * nest or it renders flat, so the grouping is written for the general case:
 * a deeper level opens a nested list inside the current item (Lexical's own
 * representation of nesting), a shallower one closes back out.
 */
function pushListBlock(
  stack: { node: SerializedListNode; level: number }[],
  roots: SerializedRootChild[],
  block: PortableTextBlock,
  counter: { n: number },
): void {
  const kind = LIST_TAGS[block.listItem ?? ""] ?? LIST_TAGS.bullet;
  const level = Math.max(1, typeof block.level === "number" ? block.level : 1);

  while (stack.length && stack[stack.length - 1].level > level) stack.pop();

  let current = stack[stack.length - 1];
  if (current && current.level === level && current.node.listType !== kind.listType) {
    // Same depth, different list kind: Portable Text ends one list and starts
    // another. Lexical has no mixed list.
    stack.pop();
    current = stack[stack.length - 1];
  }

  if (!current || current.level < level) {
    const node: SerializedListNode = {
      ...element("list", stack.length),
      children: [],
      listType: kind.listType,
      start: 1,
      tag: kind.tag,
    };
    if (!current) {
      roots.push(node);
    } else {
      // Nested list: Lexical hangs it off the last listitem of the parent.
      const host = current.node.children[current.node.children.length - 1];
      if (host) (host.children as unknown[]).push(node);
      else current.node.children.push({ ...element("listitem", stack.length), children: [node as never], value: 1 });
    }
    stack.push({ node, level });
    current = stack[stack.length - 1];
  }

  const item: SerializedListItemNode = {
    ...element("listitem", current.node.indent),
    children: convertChildren(
      Array.isArray(block.children) ? block.children : [],
      (Array.isArray(block.markDefs) ? block.markDefs : []).filter(isRecord) as PortableTextMarkDef[],
      counter,
    ),
    value: current.node.children.length + 1,
  };
  if (kind.listType === "check") item.checked = false;
  current.node.children.push(item);
}

/* ------------------------------------------------------------------ entry */

/**
 * Convert a Portable Text array into a Lexical editor state Payload can store
 * and its admin can open.
 *
 * Anything that is not an object is skipped. Anything that is an object but
 * not a `block` becomes an embed node whose `blockType` is the Sanity `_type`
 * and whose `fields` carry every remaining property verbatim — `image`,
 * `youtube` and the five unauthored embeds all take that one path, so a
 * Portable Text type nobody anticipated is preserved rather than dropped.
 */
export function portableTextToLexical(blocks: unknown[]): SerializedEditorState {
  const children: SerializedRootChild[] = [];
  const counter = { n: 0 };
  let listStack: { node: SerializedListNode; level: number }[] = [];

  for (const raw of Array.isArray(blocks) ? blocks : []) {
    if (!isRecord(raw)) continue;
    const block = raw as PortableTextBlock;

    if (block._type === "block") {
      if (block.listItem) {
        pushListBlock(listStack, children, block, counter);
        continue;
      }
      listStack = [];
      children.push(convertTextBlock(block, counter));
      continue;
    }

    listStack = [];
    const { _key, _type, ...props } = raw;
    children.push(embedNode(String(_type ?? "unknown"), asString(_key) ?? mintId("embed", counter), props));
  }

  return {
    root: {
      children,
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

/**
 * ## What is dropped, and why Task 10 can still rebuild a render-identical
 * Portable Text array
 *
 * 1. **`_key` on `block` nodes and on `span` children.** Measured, not
 *    assumed: an extra property on a Lexical paragraph/heading/text node does
 *    NOT survive `parseEditorState` — the editor rebuilds those nodes from
 *    their declared fields and silently discards the rest. There is no slot to
 *    put them in. They are React keys in `@portabletext/react`, never rendered,
 *    so Task 10 must synthesize them (deterministically, so re-running the
 *    import stays idempotent). Keys that DO survive, because Payload's own
 *    schema has a slot for them: every markDef `_key` (as the link node's `id`
 *    / the footnote inline block's `id`) and every embed `_key` (as the block
 *    node's `fields.id`).
 * 2. **The four never-authored paragraph styles** `lead`, `caption`,
 *    `sidebarNote`, `cta` collapse to `normal`. 0 occurrences in the dataset;
 *    Lexical's paragraph has no style slot that survives a parse.
 * 3. **Empty spans** (`text: ""`, 6 in the dataset) are not emitted, because
 *    Lexical drops empty text nodes itself — keeping them would make the
 *    converter's output differ from what the editor stores back.
 * 4. **`internalLink`'s `relationTo`.** The Sanity reference `_ref` is kept in
 *    `fields.doc`, but which collection it points at is only knowable from the
 *    id map Task 12 holds. 0 occurrences in the dataset.
 *
 * Everything else round-trips: block styles, heading level, list kind and
 * nesting, decorator bitmask, link href/target, footnote note text AND the
 * span text and decorators it displaced, and every property of every embed.
 */
