/**
 * A Payload `blocks` row, as the `_type`/`_key` object the renderers dispatch on.
 *
 * Task 14b swapped the page document's envelope and left `blocks[]` empty on
 * purpose; this file is 14c filling it. Nothing under `components/` changes in
 * this phase, so `components/blocks/index.tsx` still looks up
 * `componentMap[block._type]` and still uses `block._key` as its React key —
 * which means the mapping here is not "produce something reasonable", it is
 * "produce the object `PAGE_QUERY` produced", key for key.
 *
 * ---------------------------------------------------------------------------
 * The `_key`s were never lost, so they are recovered rather than minted
 * ---------------------------------------------------------------------------
 *
 * Phase 2 established that a Portable Text block's `_key` cannot survive
 * Lexical, and Task 10's adapter mints content-derived replacements. A **page**
 * block's `_key` is a different story and a happier one:
 * `scripts/payload-import/lib/transform.ts`'s `rowId()` writes each block row's
 * primary key as `` `${sourceId}:${path}:${_key}` ``, so the Sanity `_key` is
 * the last `:`-separated segment of the Payload row id.
 *
 * Verified end to end (2026-09-07, `production_2` at the published perspective,
 * control `count(*[_type=="agenda"])` = 29): the `about` page's four Sanity
 * block keys are `fd5b8e24ee7d, 21c77edc001e, be78c49f2b65, c84d22b75df2` and
 * Payload's four row ids end in exactly those — including the two keys an
 * editor typed by hand rather than letting Sanity generate (`hero`,
 * `block-143146c1-1cae-4ee7-8319-8428f94dc965`).
 *
 * `mintedKey` therefore only ever runs for a row whose id carries no key, which
 * no imported row does and only a block created inside the Payload admin can
 * produce. It hashes the row's own content, so it is stable across renders and
 * cannot be reordered by anything: nothing here derives a key from array
 * position.
 *
 * ---------------------------------------------------------------------------
 * Three things GROQ says that Payload cannot
 * ---------------------------------------------------------------------------
 *
 * All three are import-time losses, measured rather than assumed, and each is
 * resolved towards the answer that matches more of the corpus:
 *
 * 1. **A `false` checkbox.** `transform.ts` writes every checkbox as
 *    `doc.x === true`, so "the editor never set it" and "the editor set it
 *    false" are the same `false` in Postgres. GROQ answers `null` for the
 *    first and `false` for the second. Measured on the page corpus: `noGap` is
 *    absent on 16 split-rows and stored `false` on 4; `sticky` absent on 22
 *    split-contents and `false` on 4; `link.target` is stored **only** when
 *    true, never false. So `false` maps to `null` — right on 16/20, 22/26 and
 *    on every link, wrong on the 4 + 4 that stored an explicit `false`, and
 *    falsy in every renderer either way. `grid-agenda`'s three booleans are the
 *    documented exception (see `gridAgendaBlock`).
 * 2. **`background` is a spread.** `background{...,}` returns the stored object
 *    or `null`, and 40 of the 110 background-carrying blocks in the corpus
 *    never stored one. Payload fills the group with `type: "none"` either way,
 *    so the two are indistinguishable; the object is emitted always, which is
 *    what the other 70 look like and what `type: "none"` already means to the
 *    renderers.
 * 3. **`sectionWidth: "full"`.** Four `cta-1`s on `research-and-action/
 *    case-studies` store it; `transform.ts` normalises it to `"default"`
 *    because no Postgres enum has ever heard of `"full"`. Both renderers test
 *    `=== "narrow"`, so nothing rendered moves. Unrecoverable here, recorded
 *    there.
 *
 * ---------------------------------------------------------------------------
 * Two spellings of an image, and both are the projection's own
 * ---------------------------------------------------------------------------
 *
 * The block projections read images two ways, and the difference is not
 * cosmetic: `image{ ..., asset->{…}, alt }` spreads the stored object first, so
 * its result carries `_type: "image"` (and would carry a `hotspot`/`crop` if
 * one were ever stored — measured, none is), while `headerImage{ asset->{…},
 * alt }` names its keys and so carries no `_type`. Both spellings appear below,
 * and both build the asset itself through `internal/image-shape.ts` — the one
 * implementation, guarded by a ratchet.
 */
import "server-only";
import { createHash } from "node:crypto";
import { imageGroup, mediaOf } from "@/lib/content/internal/image-shape";
import { groqObject, orNull } from "@/lib/content/internal/localized";
import { portableText } from "@/lib/content/internal/payload/rich-text";

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

// ---------------------------------------------------------------------------
// `_key`
// ---------------------------------------------------------------------------

/**
 * The Sanity `_key` this row was imported with.
 *
 * `rowId()` joins on `:`, and neither a Sanity `_key` nor the `String(index)`
 * fallback it uses contains one, so the last segment is the key. A row id with
 * no `:` at all did not come from the importer.
 */
function importedKey(id: unknown): string | undefined {
  const value = text(id);
  if (!value || !value.includes(":")) return undefined;
  return text(value.slice(value.lastIndexOf(":") + 1));
}

/**
 * A deterministic `_key` for a block Payload minted the id for.
 *
 * Content-derived and prefixed so it cannot collide with a Sanity key, in the
 * same spirit as Task 10's adapter. Twelve hex characters, matching the length
 * Sanity generates.
 */
function mintedKey(row: Row): string {
  const seed = JSON.stringify(row, (key, value) => (key === "id" ? undefined : value));
  return `p${createHash("sha256").update(seed).digest("hex").slice(0, 11)}`;
}

function blockKey(row: Row): string {
  return importedKey(row.id) ?? mintedKey(row);
}

// ---------------------------------------------------------------------------
// The shared sub-objects
// ---------------------------------------------------------------------------

/**
 * A checkbox, as the value GROQ returns for the field it backs.
 *
 * See note 1 in the header: Payload's `false` is Sanity's "unset" far more
 * often than it is Sanity's `false`, and `null` is what GROQ answers for unset.
 */
function checkbox(value: unknown): true | null {
  return value === true ? true : null;
}

/**
 * `padding` — a plain field reference, so the stored object comes back verbatim.
 *
 * Sanity stores `section-padding` sparsely: measured across the page corpus,
 * only `true` is ever written, so a block with top padding alone stores
 * `{_type, top: true}` and one with neither stores nothing at all and GROQ
 * answers `null`. Payload's group always has both keys, `null` where Sanity had
 * nothing, which is exactly the information needed to rebuild the sparse form.
 */
function paddingObject(group: unknown): Row | null {
  if (!isRow(group)) return null;
  const out: Row = { _type: "section-padding" };
  if (group.bottom === true) out.bottom = true;
  if (group.top === true) out.top = true;
  return Object.keys(out).length > 1 ? groqObject(out) : null;
}

/**
 * `background{...,}` — the spread, rebuilt sparsely.
 *
 * Payload declares nine sub-fields and fills every one; Sanity stored three
 * (`_type`, `gradient`, `type`) on 106 of the 110 backgrounds in the corpus and
 * a fourth (`image`) on the remaining 4. So each key is emitted only when it
 * carries something, which reproduces both stored shapes exactly.
 *
 * The nested `image` is deliberately **not** dereferenced: a spread does not
 * follow a reference, so `PAGE_QUERY` returns the raw
 * `{_type: "image", asset: {_ref, _type: "reference"}}` here — the one place in
 * this file where an image is a reference rather than a picture.
 */
function backgroundObject(group: unknown): Row | null {
  if (!isRow(group)) return null;
  const out: Row = { _type: "background-option" };

  const type = text(group.type);
  if (type) out.type = type;
  for (const key of ["ccmColor", "color"] as const) {
    const value = text(group[key]);
    if (value) out[key] = value;
  }
  if (group.lightText === true) out.lightText = true;
  if (group.blobAccent === true) out.blobAccent = true;

  if (isRow(group.gradient)) {
    const gradient: Row = {};
    for (const key of ["direction", "startColor", "endColor"] as const) {
      const value = text(group.gradient[key]);
      if (value) gradient[key] = value;
    }
    if (Object.keys(gradient).length > 0) out.gradient = groqObject(gradient);
  }

  const svgPattern = mediaOf({ asset: group.svgPattern });
  if (svgPattern?.id) out.svgPattern = groqObject({ _type: "file", asset: referenced(svgPattern.id) });
  const image = mediaOf(group.image);
  if (image?.id) out.image = groqObject({ _type: "image", asset: referenced(image.id) });

  return groqObject(out);
}

/** A Sanity reference, as the spread that never dereferenced it returned it.
 *  The Payload row id **is** the Sanity asset id — `payload/collections/media.ts`
 *  preserves it verbatim so every imported reference still resolves. */
function referenced(id: unknown): Row {
  return groqObject({ _ref: String(id ?? ""), _type: "reference" });
}

/** `buttonVariant{variant, size, stroke}`. */
function buttonVariantObject(group: unknown): Row | null {
  if (!isRow(group)) return null;
  return groqObject({
    size: orNull(text(group.size)),
    stroke: orNull(text(group.stroke)),
    variant: orNull(text(group.variant)),
  });
}

/** `links[]{title, href, target, buttonVariant{…}}`. Payload writes `[]` where
 *  Sanity wrote nothing, and no block in the corpus stores an empty array, so
 *  an empty list is the `null` GROQ returns for the unset field. Unlike
 *  `linkObject` this keeps an entry with neither title nor href: an array
 *  element that exists was authored. */
function linksArray(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const links = rows.filter(isRow).map((row) =>
    groqObject({
      buttonVariant: buttonVariantObject(row.buttonVariant),
      href: orNull(text(row.href)),
      target: checkbox(row.target),
      title: orNull(text(row.title)),
    }),
  );
  return links.length > 0 ? links : null;
}

/** The five-field asset every block-level image projection asks for. */
const FULL_ASSET = ["_id", "url", "mimeType", "lqip", "dimensions"] as const;

/** `image{ ..., asset->{…}, alt }` — the spread keeps the stored object's own
 *  `_type`, which is why this and `namedImage` are two functions. */
function spreadImage(group: unknown, asset: readonly ("_id" | "url" | "mimeType" | "lqip" | "dimensions")[] = FULL_ASSET): Row | null {
  const projected = imageGroup(group, { asset, keys: ["alt"] });
  return projected ? groqObject({ _type: "image", ...projected }) : null;
}

/** `body[]{…}` — Payload's Lexical column as the Portable Text the renderers
 *  read. `null`, not `[]`, when the column was never filled: GROQ returns null
 *  for an unset array and 9 of the 26 `split-content`s in the corpus have no
 *  body at all. */
function richText(state: unknown): unknown[] | null {
  return state == null ? null : portableText(state);
}

// ---------------------------------------------------------------------------
// The families
// ---------------------------------------------------------------------------

/** `HERO_1_PROJECTION`, key for key. */
function hero1Block(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "hero-1",
    background: backgroundObject(row.background),
    body: richText(row.body),
    image: spreadImage(row.image),
    imagePosition: orNull(text(row.imagePosition)),
    links: linksArray(row.links),
    padding: paddingObject(row.padding),
    tagLine: orNull(text(row.tagLine)),
    title: orNull(text(row.title)),
  });
}

/**
 * One Payload block row, as the object `components/blocks/index.tsx` dispatches
 * on — or `undefined` for a block type this task has not mapped yet.
 *
 * An unmapped row is **dropped**, never passed through: the renderer would put
 * an object it cannot dispatch on into the flight payload, and 14b's whole
 * reason for leaving `blocks[]` empty was to avoid exactly that. A dropped
 * block shows up in the parity harness as a deletion, which is the honest
 * signal.
 */
function mapBlock(row: unknown): Row | undefined {
  if (!isRow(row)) return undefined;
  switch (row.blockType) {
    case "hero1":
      return hero1Block(row);
    default:
      return undefined;
  }
}

/**
 * A page's `blocks[]`, as `PAGE_QUERY` returns it.
 *
 * `null` for a locale carrying no list at all — GROQ's answer for an unset
 * array, and the value `toPage` turns into the empty one.
 */
export function pageBlocks(rows: unknown): unknown[] | null {
  if (!Array.isArray(rows)) return null;
  return rows.map(mapBlock).filter((block): block is Row => block !== undefined);
}
