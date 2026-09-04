/**
 * Lexical (Payload's rich-text format) -> Portable Text.
 *
 * This is the inverse of `./lexical.ts` and the thing that keeps Phase 3 from
 * becoming a 36-file rendering rewrite: thirty-six files render Portable Text
 * through `@portabletext/react`, so the backend swap feeds them Lexical
 * converted *back* rather than rewriting all of them at once, where a
 * rendering bug and a data bug would look identical. Phase 4 deletes this file
 * and moves the renderers to Lexical natively.
 *
 * ## The property this file must hold
 *
 * `lexicalToPortableText(portableTextToLexical(x))` **renders** identically to
 * `x` — not byte-identical JSON. `lib/__tests__/lexical-adapter.test.ts`
 * asserts it that way: both sides go through `@portabletext/react` (and so
 * through the real toolkit — `nestLists`, `buildMarksTree`) and the two HTML
 * strings are compared.
 *
 * ## Which Portable Text facts have to survive, and which may be synthesized
 *
 * Task 9 could not carry block-level and span-level `_key`s across: an extra
 * property on a paragraph/heading/text node does not survive `parseEditorState`
 * (measured, not assumed). So this file mints them. Three facts decide whether
 * that is safe, all measured against `production_2` (886 documents, control
 * `count(*[_type=="agenda"]) == 29` asserted first):
 *
 *   1. Span `_key`s are React keys only. Never rendered. Safe to mint.
 *   2. Block `_key`s are React keys **except on headings**: the renderer sets
 *      `id={headingId(value)}` on every h2/h3, and `headingId` is
 *      `${slug}-${block._key}` (`lib/portable-text-headings.ts`). 239 headings
 *      in the dataset, all keyed. So heading anchor ids DO change — the one
 *      thing in this adapter that is not render-identical. See "What does not
 *      round-trip" at the bottom.
 *   3. markDef `_key`s must survive exactly, because `extractFootnotes` numbers
 *      footnotes off them and the renderer prints `[n]`. They do: Task 9 stores
 *      them as the link node's `id` / the footnote inline block's `fields.id`,
 *      and this file reads them back rather than minting anything.
 *
 * Because of (2) the minted keys are **content-derived** (a hash of the block's
 * style and text), not positional. A positional key would move every heading
 * anchor below any edit; a content key moves only when that heading's own text
 * changes. Both are deterministic, which is what the import needs to stay
 * idempotent.
 *
 * ## Ordering facts this relies on, also measured
 *
 * A block's `markDefs` array is rebuilt in the order the spans reference the
 * defs, because span order is the only order Lexical preserves. In all 101
 * blocks in the dataset that carry markDefs, declaration order already equals
 * first-use order, and there are zero orphan defs and zero dangling mark
 * references — so the rebuilt array is the stored array, and footnote numbering
 * (which `extractFootnotes` reads out of `markDefs` in array order) is
 * unchanged.
 *
 * The *order of marks within a span* is deliberately not preserved: it cannot
 * affect the render. `@portabletext/toolkit`'s `sortMarksByOccurences` re-sorts
 * a span's marks by (a) how many following siblings share the mark, (b) the
 * fixed `knownDecorators` order, (c) `localeCompare` — a total order over the
 * mark *set*, so two spans with the same set always nest identically.
 */

import { TEXT_FORMAT } from "./lexical";

/**
 * Lexical's format bitmask -> the Sanity decorator name, the inverse of
 * `DECORATOR_BITS` in `./lexical.ts`.
 *
 * `sub` and `sup` have no decorator in `block-content.ts` and cannot come out
 * of a Portable Text document, so they can only appear on content typed into
 * the Payload admin. They are still named rather than dropped: an unknown mark
 * renders its children through `@portabletext/react`'s `unknownMark`, whereas a
 * dropped bit loses the semantic with no trace.
 */
const DECORATOR_BY_BIT: readonly (readonly [number, string])[] = [
  [TEXT_FORMAT.bold, "strong"],
  [TEXT_FORMAT.italic, "em"],
  [TEXT_FORMAT.strikethrough, "strike-through"],
  [TEXT_FORMAT.underline, "underline"],
  [TEXT_FORMAT.code, "code"],
  [TEXT_FORMAT.subscript, "sub"],
  [TEXT_FORMAT.superscript, "sup"],
  [TEXT_FORMAT.highlight, "highlight"],
];

/** Lexical `listType` -> Sanity `listItem`. */
const LIST_ITEM_BY_TYPE: Record<string, string> = {
  bullet: "bullet",
  number: "number",
  check: "checkbox",
};

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/** The three `fields` members Payload owns; everything else is Sanity's. */
const RESERVED_FIELDS = ["blockName", "blockType", "id"];

/* --------------------------------------------------------------- helpers */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

const childrenOf = (node: Record<string, unknown>): Record<string, unknown>[] =>
  Array.isArray(node.children) ? node.children.filter(isRecord) : [];

const fieldsOf = (node: Record<string, unknown>): Record<string, unknown> =>
  isRecord(node.fields) ? node.fields : {};

/** Everything in a block/inlineBlock's `fields` that came from Sanity. */
function sanityProps(fields: Record<string, unknown>, alsoSkip: string[] = []): Record<string, unknown> {
  const skip = new Set([...RESERVED_FIELDS, ...alsoSkip, "_type", "_key"]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) if (!skip.has(k)) out[k] = v;
  return out;
}

function decorators(format: unknown): string[] {
  const bits = typeof format === "number" ? format : 0;
  const out: string[] = [];
  for (const [bit, name] of DECORATOR_BY_BIT) if (bits & bit) out.push(name);
  return out;
}

/* ------------------------------------------------------------ key minting */

/** FNV-1a, base36 — a short stable id from a string. */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * The block-level `_key` namespace for one conversion. markDef keys are NOT
 * tracked here: they live in a different namespace (a span's `marks` are only
 * ever matched against its own block's `markDefs`), and mixing the two could
 * make a minted block key push a real Sanity markDef key aside — which would
 * change a footnote's number.
 */
interface Keys {
  used: Set<string>;
}

/**
 * A deterministic, document-unique `_key` for a block. Derived from the block's
 * own content so a heading's anchor (`${slug}-${_key}`) does not move when
 * something above it is edited; suffixed on collision, which keeps two headings
 * with identical text distinguishable — the very thing `headingId` appends the
 * key for.
 */
function mintKey(seed: string, keys: Keys): string {
  const base = `pt${hash(seed)}`;
  let key = base;
  for (let n = 2; keys.used.has(key); n += 1) key = `${base}-${n}`;
  keys.used.add(key);
  return key;
}

/** An embed's `_key` came across as `fields.id`; only mint when it is absent. */
function reuseKey(id: unknown, seed: string, keys: Keys): string {
  const existing = asString(id);
  if (existing && !keys.used.has(existing)) {
    keys.used.add(existing);
    return existing;
  }
  return mintKey(existing ?? seed, keys);
}

/* ---------------------------------------------------------------- inline */

interface InlineResult {
  children: Record<string, unknown>[];
  markDefs: Record<string, unknown>[];
}

/**
 * A Lexical element's inline children become a block's `children` + `markDefs`.
 *
 * `inherited` carries the annotation keys of the enclosing link node(s) down
 * onto the spans, which is how Portable Text expresses what Lexical expresses
 * by nesting.
 */
function convertInline(
  nodes: Record<string, unknown>[],
  inherited: string[],
  out: InlineResult,
  keys: Keys,
): void {
  /** markDef keys are Sanity's, reused verbatim; this only breaks a tie. */
  const defKey = (id: unknown, seed: string): string => {
    const taken = new Set(out.markDefs.map((d) => String(d._key)));
    const existing = asString(id);
    if (existing) return existing;
    const base = hash(seed);
    let key = base;
    for (let n = 2; taken.has(key); n += 1) key = `${base}-${n}`;
    return key;
  };
  const pushDef = (def: Record<string, unknown>) => {
    if (!out.markDefs.some((d) => d._key === def._key)) out.markDefs.push(def);
  };
  const pushSpan = (text: string, marks: string[]) => {
    out.children.push({ _type: "span", _key: "", text, marks });
  };

  for (const node of nodes) {
    const type = asString(node.type);

    if (type === "text") {
      pushSpan(asString(node.text) ?? "", [...decorators(node.format), ...inherited]);
      continue;
    }

    // A soft line break. `@portabletext/react` renders a lone "\n" through its
    // `hardBreak` component (a <br/>), which is what Lexical draws too.
    if (type === "linebreak") {
      pushSpan("\n", [...inherited]);
      continue;
    }
    if (type === "tab") {
      pushSpan("\t", [...inherited]);
      continue;
    }

    if (type === "link" || type === "autolink") {
      const fields = fieldsOf(node);
      const key = defKey(node.id, `link:${asString(fields.url) ?? ""}`);
      if (fields.linkType === "internal") {
        // Zero occurrences in production_2. `doc` holds the raw Sanity `_ref`
        // Task 9 put there; only Task 12's id map knows the collection.
        const ref = isRecord(fields.doc) ? fields.doc.value : fields.doc;
        pushDef({ _key: key, _type: "internalLink", reference: { _type: "reference", _ref: ref ?? null } });
      } else {
        const def: Record<string, unknown> = {
          _key: key,
          _type: "link",
          href: asString(fields.url) ?? "",
        };
        // `target` is present on 5 of the 88 stored link defs and is always
        // boolean `true`; the renderer ignores it (it decides `_blank` from the
        // href), so writing it only when true keeps the JSON honest.
        if (fields.newTab === true) def.target = true;
        pushDef(def);
      }
      convertInline(childrenOf(node), [...inherited, key], out, keys);
      continue;
    }

    if (type === "inlineBlock") {
      const fields = fieldsOf(node);
      const blockType = asString(fields.blockType) ?? "unknown";

      if (blockType === "footnote") {
        // The inverse of Task 9's footnote inline block: `text` is the note,
        // `marker` is the span text the annotation sat on, `markerFormat` the
        // decorators that span also carried (3 of the 80 stored footnotes are
        // on a `strong` span).
        const key = defKey(fields.id, `footnote:${asString(fields.text) ?? ""}`);
        pushDef({ _key: key, _type: "footnote", ...sanityProps(fields, ["marker", "markerFormat"]) });
        pushSpan(asString(fields.marker) ?? "", [...decorators(fields.markerFormat), ...inherited, key]);
        continue;
      }

      // Any other inline block becomes an inline object child, the shape
      // Portable Text uses for one. Zero occur in the dataset (all 2999 block
      // children are spans), so this exists to avoid dropping anything.
      out.children.push({
        _type: blockType,
        _key: reuseKey(fields.id, `inline:${blockType}`, keys),
        ...sanityProps(fields),
      });
      continue;
    }

    // An unrecognised inline node. Keep its text rather than dropping it.
    const nested = childrenOf(node);
    if (nested.length > 0) convertInline(nested, inherited, out, keys);
    else if (typeof node.text === "string") pushSpan(node.text, [...inherited]);
  }
}

/* ---------------------------------------------------------------- blocks */

/** Plain text of the converted children — the seed for the block's `_key`. */
const seedText = (children: Record<string, unknown>[]): string =>
  children.map((c) => (typeof c.text === "string" ? c.text : `<${String(c._type)}>`)).join("");

function textBlock(
  nodes: Record<string, unknown>[],
  style: string,
  keys: Keys,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const result: InlineResult = { children: [], markDefs: [] };
  convertInline(nodes, [], result, keys);
  const key = mintKey(`${style}|${JSON.stringify(extra)}|${seedText(result.children)}`, keys);
  result.children.forEach((child, i) => {
    child._key = `${key}s${i}`;
  });
  return { _type: "block", _key: key, style, ...extra, markDefs: result.markDefs, children: result.children };
}

/**
 * The inverse of Task 9's embed rule: `fields.blockType` is the Sanity `_type`
 * verbatim and `fields.id` is the `_key`. Every other member of `fields` is a
 * Sanity property carried across untouched, which is how `image`, `youtube` and
 * the five never-authored embeds all come back through one path.
 */
function embedBlock(node: Record<string, unknown>, keys: Keys): Record<string, unknown> {
  const fields = fieldsOf(node);
  const blockType = asString(fields.blockType) ?? "unknown";
  const props = sanityProps(fields);
  return {
    _type: blockType,
    _key: reuseKey(fields.id, `${blockType}|${JSON.stringify(props)}`, keys),
    ...props,
  };
}

/**
 * Lexical nests: `list > listitem > (inline… , list)`. Portable Text flattens:
 * a run of sibling blocks each carrying `listItem` and `level`. This walks the
 * nesting back out into that run.
 *
 * A listitem whose only child is a nested list is Task 9's synthetic wrapper
 * (it creates one when a level-2 item has no level-1 item to hang off), so it
 * emits no block of its own — which is exactly what makes such a run
 * round-trip.
 */
function flattenList(
  list: Record<string, unknown>,
  level: number,
  out: Record<string, unknown>[],
  keys: Keys,
): void {
  const listItem = LIST_ITEM_BY_TYPE[asString(list.listType) ?? ""] ?? "bullet";

  for (const child of childrenOf(list)) {
    if (asString(child.type) === "list") {
      flattenList(child, level + 1, out, keys);
      continue;
    }
    if (asString(child.type) !== "listitem") continue;

    const inline: Record<string, unknown>[] = [];
    const nested: Record<string, unknown>[] = [];
    for (const c of childrenOf(child)) (asString(c.type) === "list" ? nested : inline).push(c);

    if (inline.length > 0 || nested.length === 0) {
      const extra: Record<string, unknown> = { listItem, level };
      if (listItem === "checkbox") extra.checked = child.checked === true;
      out.push(textBlock(inline, "normal", keys, extra));
    }
    for (const n of nested) flattenList(n, level + 1, out, keys);
  }
}

/* ------------------------------------------------------------------ entry */

/**
 * Convert a Lexical editor state (what Payload stores in a `richText` column)
 * into the Portable Text array `@portabletext/react` renders.
 *
 * Accepts the stored `{root: {...}}` object, a bare root, or `null` /
 * `undefined` / anything else — a rich-text field that was never filled in
 * comes back from Payload as `null`, and `[]` is the right answer to hand a
 * renderer for that.
 */
export function lexicalToPortableText(state: unknown): unknown[] {
  const root = isRecord(state) && isRecord(state.root) ? state.root : isRecord(state) ? state : undefined;
  if (!root) return [];

  const out: Record<string, unknown>[] = [];
  const keys: Keys = { used: new Set() };

  for (const node of childrenOf(root)) {
    const type = asString(node.type);

    switch (type) {
      case "paragraph":
        out.push(textBlock(childrenOf(node), "normal", keys));
        break;
      case "heading": {
        const tag = asString(node.tag) ?? "";
        out.push(textBlock(childrenOf(node), HEADING_TAGS.has(tag) ? tag : "normal", keys));
        break;
      }
      case "quote":
        out.push(textBlock(childrenOf(node), "blockquote", keys));
        break;
      case "list":
        flattenList(node, 1, out, keys);
        break;
      case "block":
        out.push(embedBlock(node, keys));
        break;
      case "horizontalrule":
        // Payload's default feature set includes HorizontalRuleFeature, so an
        // editor can insert one that never came from Sanity. `break`/`hr` is
        // what the Portable Text renderer draws a rule from — and what
        // `splitContentAtReadMore` looks for.
        out.push({ _type: "break", _key: mintKey(`hr|${out.length}`, keys), style: "hr" });
        break;
      default: {
        // Anything else: keep the text if it has children (an unrecognised
        // element), otherwise carry the node across as an object of that
        // `_type` so a renderer — or a Phase 3 log — can see what arrived
        // instead of it being silently dropped. `upload` and `relationship`
        // land here; mapping them needs the media/id map Phase 3 owns, not
        // this adapter.
        if (!type) break;
        const nested = childrenOf(node);
        if (nested.length > 0) {
          out.push(textBlock(nested, "normal", keys));
          break;
        }
        const props: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(node)) if (k !== "type" && k !== "version") props[k] = v;
        out.push({ _type: type, _key: mintKey(`${type}|${out.length}`, keys), ...props });
      }
    }
  }

  return out;
}

/**
 * ## What does not round-trip, and what Phase 3 has to do about it
 *
 * 1. **Heading anchor ids change.** Block `_key`s cannot survive Lexical, and
 *    `headingId` builds the h2/h3 `id` as `${slug}-${_key}`. In-page links keep
 *    working (the TOC and the renderer both recompute from the same blocks),
 *    but a URL someone bookmarked or shared as
 *    `#executive-summary-<sanity-key>` stops resolving. The 51 stored
 *    `#fragment` hrefs in the dataset are bare slugs (`#appendices`) that
 *    already do not match `headingId`'s output, so they are unaffected. Phase
 *    3's options: accept the churn, or key headings off the slug alone (and let
 *    Phase 4's native Lexical renderer do the same).
 * 2. **`lead` / `caption` / `sidebarNote` / `cta` paragraph styles** come back
 *    as `normal` — Task 9 has nowhere to put them. 0 occurrences.
 * 3. **A checkbox item's `checked` state.** Task 9 writes `checked:false` on
 *    every check listitem, so a ticked box comes back unticked. 0 occurrences
 *    (there are no checkbox lists in the dataset at all).
 * 4. **`internalLink`'s `relationTo`** is unknowable here; the def comes back
 *    with the raw `_ref` and no resolved document, so the renderer's
 *    `internalLink` mark falls through to plain children. 0 occurrences.
 * 5. **Empty spans** (6 in the dataset) are dropped by Task 9 and not restored.
 *    They render nothing either way.
 * 6. **`upload` / `relationship` nodes** — insertable in the Payload admin,
 *    never produced by the import — pass through as objects of that `_type`.
 *    A Portable Text renderer has no component for them.
 *
 * Everything else is reversible field-for-field, and the adapter test asserts
 * it by rendering both sides through `@portabletext/react`.
 */
