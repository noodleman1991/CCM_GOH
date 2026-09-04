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
  // `sub`/`sup` are not decorators in `block-content.ts`, so no Sanity
  // document can carry them — but Task 10 EMITS them for bits 32/64, so
  // without an entry here a subscript typed in the admin survives one
  // direction and dies on the way back.
  sub: TEXT_FORMAT.subscript,
  sup: TEXT_FORMAT.superscript,
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

/**
 * Lexical's element alignment. `defaultEditorFeatures` includes `AlignFeature`,
 * so the admin can set any of these on a paragraph, heading, quote, list item
 * or embedded block; measured through `parseEditorState`, all of them survive.
 */
export type ElementFormat = "" | "left" | "center" | "right" | "justify" | "start" | "end";

const ELEMENT_FORMATS = new Set<string>(["left", "center", "right", "justify", "start", "end"]);

/** The Portable Text property Task 10 parks an element's alignment in. */
export const ALIGN_PROP = "textAlign";
/** The Portable Text property Task 10 parks an element's indent in. */
export const INDENT_PROP = "indent";
/** The Portable Text property Task 10 parks an ordered list's `start` in. */
export const LIST_START_PROP = "listStart";

export interface SerializedBlockNode {
  type: "block";
  version: 2;
  format: ElementFormat;
  fields: { blockName: string; blockType: string; id: string } & Record<string, unknown>;
}

interface ElementBase {
  direction: null;
  format: ElementFormat;
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
  /** Written by Task 10 for an admin-aligned element. Never in Sanity data. */
  textAlign?: unknown;
  /** Written by Task 10 for an admin-indented element. Never in Sanity data. */
  indent?: unknown;
  /** Written by Task 10 for an `<ol start="n">`. Never in Sanity data. */
  listStart?: unknown;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/* ------------------------------------------------------------- the losses */

/**
 * A fact this converter could not carry across.
 *
 * Every one of these is 0-occurrence in `production_2` (measured over every
 * Portable-Text-shaped array in the dataset — 401 of them, 2072 `block` nodes,
 * drafts included), which is exactly why they must be loud: the paths are
 * reachable only from content nobody has authored yet, so a silent drop would
 * be discovered by a reader of the rendered page rather than by the import.
 */
export interface ConversionIssue {
  kind:
    | "unknown-mark"
    | "keyless-mark-def"
    | "reserved-field-collision"
    | "unsupported-annotation";
  /** Enough to find the offending node in the source document. */
  detail: string;
}

export interface PortableTextToLexicalOptions {
  /**
   * Called once per lost fact. The default warns; pass a collector to fail an
   * import on it, or a no-op to silence it deliberately.
   */
  onIssue?: (issue: ConversionIssue) => void;
}

const warnIssue = (issue: ConversionIssue): void => {
  console.warn(`[portableTextToLexical] ${issue.kind}: ${issue.detail}`);
};

/** Counter + loss channel, threaded through the whole conversion. */
interface Ctx {
  counter: { n: number };
  report: (issue: ConversionIssue) => void;
}

/**
 * Payload owns `blockName`, `blockType` and `id` inside a block's `fields`, so
 * a Sanity property of the same name cannot be stored beside them. The
 * reserved value wins (losing it would destroy the `_key` or rewrite the
 * `_type`); the collision is reported rather than swallowed.
 */
function guardReserved(props: Record<string, unknown>, where: string, ctx: Ctx): Record<string, unknown> {
  for (const name of ["blockName", "blockType", "id"]) {
    if (name in props) {
      ctx.report({
        kind: "reserved-field-collision",
        detail: `${where} carries a Sanity property named \`${name}\`, which Payload reserves inside \`fields\`; the Sanity value is dropped`,
      });
    }
  }
  return props;
}

/* ------------------------------------------------------------- id minting */

/**
 * Payload's block/inlineBlock/link nodes each require an `id`. Where the
 * Portable Text node or markDef has a `_key` we reuse it verbatim — that is
 * how the key survives the round trip. Where it does not (6 documents in the
 * dataset have `_key`-less nodes), we mint a deterministic one so converting
 * the same input twice produces the same JSON; a random id would make the
 * import non-idempotent, which is the one property Phase 2 cannot lose.
 */
function mintId(prefix: string, ctx: Ctx): string {
  ctx.counter.n += 1;
  return `${prefix}-${ctx.counter.n}`;
}

/* -------------------------------------------------------------- builders */

function textNode(text: string, format: number): SerializedTextNode {
  return { detail: 0, format, mode: "normal", style: "", text, type: "text", version: 1 };
}

function element<T extends string>(type: T, indent: number, format: ElementFormat = "") {
  return { direction: null as null, format, indent, version: 1 as const, type };
}

/**
 * `...props` comes FIRST. The other order let a Sanity property called `id`
 * overwrite the `_key` Payload stores there (and a `blockType` property rewrite
 * the node's `_type` outright): `{_type:"storyChart", _key:"k", id:"chart-7"}`
 * became `fields.id = "chart-7"`, so Task 10 rebuilt it with `_key:"chart-7"`
 * and the real key was gone. 0 such collisions exist in `production_2`.
 */
function embedNode(
  blockType: string,
  id: string,
  props: Record<string, unknown>,
  format: ElementFormat = "",
): SerializedBlockNode {
  return {
    type: "block",
    version: 2,
    format,
    fields: { ...props, blockName: "", blockType, id },
  };
}

/** A Portable Text alignment property back into a Lexical element format. */
const alignFormat = (v: unknown): ElementFormat =>
  typeof v === "string" && ELEMENT_FORMATS.has(v) ? (v as ElementFormat) : "";

/** A Portable Text indent property back into a Lexical element indent. */
const elementIndent = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;

/* ---------------------------------------------------------------- inline */

/**
 * The span's decorators, folded into one bitmask.
 *
 * A mark that is neither a known decorator nor one of this block's markDef
 * keys is a dangling reference or a decorator nobody registered. There is
 * nowhere to put it — an extra property on a Lexical text node does not
 * survive `parseEditorState` — so it is reported and dropped rather than
 * dropped alone. 0 occur in `production_2`.
 */
function spanFormat(marks: string[], defKeys: Set<string>, ctx: Ctx): number {
  let format = 0;
  for (const m of marks) {
    if (defKeys.has(m)) continue;
    const bit = DECORATOR_BITS[m];
    if (bit === undefined) {
      ctx.report({
        kind: "unknown-mark",
        detail: `mark \`${m}\` is neither a known decorator nor a markDef key on its block; it is dropped`,
      });
      continue;
    }
    format |= bit;
  }
  return format;
}

/** This span's annotation marks, in mark order, deduped. */
function annotationKeys(marks: string[], defKeys: Set<string>): string[] {
  return [...new Set(marks.filter((m) => defKeys.has(m)))];
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

function linkNode(key: string, def: PortableTextMarkDef): SerializedLinkNode {
  return {
    children: [],
    direction: null,
    format: "",
    indent: 0,
    type: "link",
    version: 3,
    id: key,
    fields: linkFields(def),
  };
}

/**
 * The footnote inline block: a footnote is an annotation on a span and Lexical
 * has no arbitrary text mark, so it becomes an inline block carrying BOTH
 * halves — the note (`text`, the Sanity field name) and the span text it was
 * attached to (`marker`), plus the decorator bitmask that span also had (three
 * spans in the dataset are `footnote` + `strong`, and a footnote node with no
 * room for the bold would lose it).
 */
function footnoteNode(
  key: string,
  def: PortableTextMarkDef,
  marker: string,
  markerFormat: number,
  ctx: Ctx,
): SerializedInlineBlockNode {
  const props = { ...(def as Record<string, unknown>) };
  delete props._key;
  delete props._type;
  guardReserved(props, `footnote markDef \`${key}\``, ctx);
  return {
    type: "inlineBlock",
    version: 1,
    fields: {
      ...props,
      blockName: "",
      blockType: FOOTNOTE_BLOCK_TYPE,
      id: key,
      marker,
      markerFormat,
    },
  };
}

/**
 * The innermost link node of the tail of `out` whose id chain is exactly
 * `keys`, or undefined. That is the node a following span carrying the same
 * annotation stack belongs inside — splitting one `<a>` into two would change
 * the render.
 */
function mergeHost(out: SerializedInlineNode[], keys: string[]): SerializedLinkNode | undefined {
  let node: SerializedInlineNode | undefined = out[out.length - 1];
  let host: SerializedLinkNode | undefined;
  for (const key of keys) {
    if (!node || node.type !== "link" || node.id !== key) return undefined;
    host = node;
    node = node.children[node.children.length - 1];
  }
  return host;
}

/**
 * One Portable Text block's `children` become Lexical inline nodes.
 *
 * Consecutive spans sharing the same annotation stack collapse into a single
 * link node. No such run exists in the dataset today (measured: 0), but a
 * Portable Text editor produces them the moment a link straddles a bold word,
 * and splitting one link into two `<a>` elements would change the render.
 *
 * ## Overlapping annotations
 *
 * Sanity permits a span to carry several annotations at once (0 do today).
 * Both halves are representable and both are carried:
 *
 *   - Every non-footnote annotation becomes a link node, NESTED when there is
 *     more than one. Nested link nodes survive `parseEditorState` built from
 *     this project's config (measured), and Task 10 walks the nest back into a
 *     span carrying both mark keys.
 *   - Every footnote annotation becomes its own inline block inside that nest.
 *     The first carries the span's text as its `marker`; the rest carry an
 *     empty marker, because the text can only live in one of them.
 */
function convertChildren(
  children: unknown[],
  markDefs: PortableTextMarkDef[],
  ctx: Ctx,
): SerializedInlineNode[] {
  const defsByKey = new Map<string, PortableTextMarkDef>();
  for (const d of markDefs) {
    const key = asString(d._key);
    if (key) {
      defsByKey.set(key, d);
      continue;
    }
    // A markDef with no `_key` can never be referenced by a span, so it is
    // already dead in Sanity — but dropping it without a word is how a
    // half-written annotation disappears unnoticed. 0 occur.
    ctx.report({
      kind: "keyless-mark-def",
      detail: `markDef of type \`${String(d._type)}\` has no _key and cannot be referenced; it is dropped`,
    });
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
      guardReserved(props, `inline object \`${String(_type)}\``, ctx);
      out.push({
        type: "inlineBlock",
        version: 1,
        fields: {
          ...props,
          blockName: "",
          blockType: String(_type),
          id: asString(_key) ?? mintId("inline", ctx),
        },
      });
      continue;
    }

    const text = span.text ?? "";
    const marks = Array.isArray(span.marks) ? span.marks.filter((m): m is string => typeof m === "string") : [];
    const format = spanFormat(marks, defKeys, ctx);
    const keys = annotationKeys(marks, defKeys);
    const footnotes = keys.filter((k) => defsByKey.get(k)?._type === "footnote");
    const wrappers = keys.filter((k) => defsByKey.get(k)?._type !== "footnote");

    // What this span contributes, before any link wrapping.
    let content: SerializedInlineNode[];
    if (footnotes.length > 0) {
      content = footnotes.map((k, i) =>
        footnoteNode(k, defsByKey.get(k) as PortableTextMarkDef, i === 0 ? text : "", i === 0 ? format : 0, ctx),
      );
    } else if (text === "") {
      // Lexical drops empty text nodes on parse; emitting one would make the
      // converter's output differ from what the editor stores.
      content = [];
    } else {
      content = [textNode(text, format)];
    }

    if (wrappers.length === 0) {
      out.push(...content);
      continue;
    }

    const host = mergeHost(out, wrappers);
    if (host) {
      host.children.push(...content);
      continue;
    }

    const chain = wrappers.map((k) => linkNode(k, defsByKey.get(k) as PortableTextMarkDef));
    chain.forEach((node, i) => {
      if (i > 0) chain[i - 1].children.push(node);
    });
    chain[chain.length - 1].children.push(...content);
    out.push(chain[0]);
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

/**
 * Alignment and indent are Payload's, not Sanity's: `defaultEditorFeatures`
 * includes `AlignFeature` and `IndentFeature`, so an editor can centre or
 * indent a paragraph in the admin. Portable Text has no slot for either, so
 * Task 10 parks them on the block as `textAlign` / `indent` and this reads them
 * back. No Sanity block carries either property: across all 401 arrays the
 * complete set of block properties is _key, _type, alt, asset, children, crop,
 * hotspot, level, listItem, markDefs, placement, style, videoId — so the names
 * cannot collide with stored content.
 */
function convertTextBlock(
  block: PortableTextBlock,
  ctx: Ctx,
): SerializedParagraphNode | SerializedHeadingNode | SerializedQuoteNode {
  const children = convertChildren(
    Array.isArray(block.children) ? block.children : [],
    (Array.isArray(block.markDefs) ? block.markDefs : []).filter(isRecord) as PortableTextMarkDef[],
    ctx,
  );
  const style = block.style;
  const format = alignFormat(block.textAlign);
  const indent = elementIndent(block.indent);

  if (style && HEADING_TAGS.has(style)) {
    return { ...element("heading", indent, format), children, tag: style as SerializedHeadingNode["tag"] };
  }
  if (style === "blockquote") {
    return { ...element("quote", indent, format), children };
  }
  // `normal`, an absent style (1 block in the dataset), and the four
  // styled-block-content extras (`lead`, `caption`, `sidebarNote`, `cta`,
  // all 0 occurrences) are all paragraphs. Lexical has no per-paragraph style
  // slot that survives a parse, so a `lead` paragraph would come back
  // `normal` — see "What is dropped".
  return { ...element("paragraph", indent, format), children, textFormat: 0, textStyle: "" };
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
  ctx: Ctx,
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
      // An `<ol start="5">` is authorable in the admin and has no Portable Text
      // slot, so Task 10 parks it on the block that opens the run.
      start: typeof block.listStart === "number" && block.listStart >= 1 ? Math.floor(block.listStart) : 1,
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
    // A list item's `indent` is structural in Lexical (it is how the nesting is
    // drawn), so it stays derived from the stack; only the alignment is read
    // back off the block.
    ...element("listitem", current.node.indent, alignFormat(block.textAlign)),
    children: convertChildren(
      Array.isArray(block.children) ? block.children : [],
      (Array.isArray(block.markDefs) ? block.markDefs : []).filter(isRecord) as PortableTextMarkDef[],
      ctx,
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
export function portableTextToLexical(
  blocks: unknown[],
  options: PortableTextToLexicalOptions = {},
): SerializedEditorState {
  const children: SerializedRootChild[] = [];
  const ctx: Ctx = { counter: { n: 0 }, report: options.onIssue ?? warnIssue };
  let listStack: { node: SerializedListNode; level: number }[] = [];

  for (const raw of Array.isArray(blocks) ? blocks : []) {
    if (!isRecord(raw)) continue;
    const block = raw as PortableTextBlock;

    if (block._type === "block") {
      if (block.listItem) {
        pushListBlock(listStack, children, block, ctx);
        continue;
      }
      listStack = [];
      children.push(convertTextBlock(block, ctx));
      continue;
    }

    listStack = [];
    const { _key, _type, ...props } = raw;
    // An embedded block can be aligned in the admin too; `textAlign` is only
    // consumed when it holds one of Lexical's alignment keywords, so a Sanity
    // property that happened to share the name would stay a property.
    const format = alignFormat(props.textAlign);
    if (format) delete props.textAlign;
    guardReserved(props, `embed \`${String(_type)}\``, ctx);
    children.push(
      embedNode(String(_type ?? "unknown"), asString(_key) ?? mintId("embed", ctx), props, format),
    );
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
 * 5. **A mark with nowhere to go** — a decorator not in `DECORATOR_BITS`, a
 *    markDef with no `_key`, a mark referencing a def its block does not
 *    declare, or a Sanity property colliding with `blockName`/`blockType`/`id`
 *    inside a block's `fields`. All four are 0-occurrence in `production_2` and
 *    all four are now REPORTED through `options.onIssue` (default: a
 *    `console.warn`) instead of vanishing. There is no slot to carry them in.
 * 6. **The marker text of a second footnote on the same span.** Each footnote
 *    annotation becomes its own inline block, but the span's text can only sit
 *    in one of them, so the first keeps it and the rest carry `marker: ""`.
 *    0 spans in the dataset carry two annotations at all.
 *
 * Everything else round-trips: block styles, heading level, list kind, nesting
 * and an ordered list's `start`, element alignment and indent, decorator
 * bitmask (`sub`/`sup` included), link href/target, overlapping annotations
 * (nested link nodes; a footnote inside them), footnote note text AND the span
 * text and decorators it displaced, and every property of every embed.
 */
