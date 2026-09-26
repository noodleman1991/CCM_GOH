/**
 * A Payload `richText` column, as the Portable Text the renderers expect.
 *
 * `lexicalToPortableText` does the structural half — blocks, spans, marks,
 * lists, footnotes — and stops exactly where it says it stops: an `image`
 * embed comes back carrying Payload's own `media` relationship, because
 * "mapping them needs the media/id map Phase 3 owns, not this adapter". This
 * file is Phase 3 owning it.
 *
 * ---------------------------------------------------------------------------
 * What `media` -> `asset` has to reproduce
 * ---------------------------------------------------------------------------
 *
 * Every Portable Text body in this codebase is projected through
 * `STYLED_BODY_PROJECTION` (or one of its per-domain twins), whose image arm is
 *
 *   _type == "image" => { ..., asset->{ _id, url, mimeType,
 *                                       metadata { lqip, dimensions { width, height } } } }
 *
 * and `components/portable-text-renderer.tsx` reads exactly those fields:
 * `value.asset.url` for the `src`, `value.asset.metadata.lqip` for the
 * placeholder, and `metadata.dimensions.{width,height}` for the intrinsic box
 * (it returns `null` outright when `value.asset` is missing, so an unmapped
 * image is not a degraded image — it is a deleted one). Payload's `media` row
 * holds the same five facts under different names, so the mapping is a rename,
 * not a reconstruction:
 *
 *   media.id -> asset._id          media.url    -> asset.url
 *   media.mimeType -> asset.mimeType
 *   media.lqip -> asset.metadata.lqip
 *   media.width/height -> asset.metadata.dimensions.{width,height}
 *
 * `media.id` really is Sanity's asset `_id` (`payload/collections/media.ts`
 * preserves it verbatim so every imported reference resolves), so the mapped
 * `_id` is the same string on both backends.
 *
 * ---------------------------------------------------------------------------
 * Why nulls are dropped
 * ---------------------------------------------------------------------------
 *
 * A GROQ projection omits a field the document does not set; Payload spells it
 * out as `null` (`alt: null`, `caption: null`, `credit: null`, `hotspot: null`,
 * `crop: null` on the 18 of 34 stored image blocks that carry no alt). Left in,
 * those are a different object for the same content and every one of them shows
 * up as a parity difference that means nothing. `Boolean(value.credit)` and
 * `getLocalizedValue(value.alt, …)` treat `null` and absent identically, so
 * dropping them changes no render — it just stops the two stores describing the
 * same picture differently. Same rule as `payload/taxonomy.ts`'s `localized()`.
 *
 * ---------------------------------------------------------------------------
 * What is deliberately NOT resolved here
 * ---------------------------------------------------------------------------
 *
 * **`internalLink` markDefs.** `lexicalToPortableText` emits them as
 * `{_type:"internalLink", reference:{_type:"reference", _ref}}` — the raw
 * Sanity `_ref`, because Payload's link node stores `fields.doc` with no
 * `relationTo` (Phase-2 obligation 11). GROQ dereferences it to
 * `{_type, "slug": slug.current}`. Resolving that needs to know which
 * collection the id belongs to, which is Task 14's reference-resolution work,
 * and there is nothing here to regress in the meantime: **zero** stored
 * markDefs are `internalLink` — measured across all 12 `docsChapter` bodies in
 * `production_2` (control `count(*[_type=="agenda"])` = 29), whose markDef
 * types are `link` and `footnote` only. Left as the adapter emits it rather
 * than half-resolved, so the day a real one appears it is visibly unresolved
 * instead of quietly pointing at nothing.
 */
import "server-only";
import { assetShape, type PayloadMediaRow } from "@/lib/content/internal/image-shape";
import { lexicalToPortableText } from "@/lib/content/internal/lexical-to-portable-text";
import type { RichText } from "@/lib/content/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Sanity's `asset->{…}` projection, rebuilt from a `media` row.
 *
 *  The shape itself is `internal/image-shape.ts`'s, so this file cannot drift
 *  from the other six readers the way `{width, height}` once drifted from
 *  `{height, width}`. `unset: "omit"` is this file's own rule and only this
 *  file's: see "Why nulls are dropped" above.
 *
 *  `undefined` when the relationship is unpopulated — at `depth: 0` Payload
 *  leaves it as a bare id string, and an id is not a picture. The renderer's
 *  own `if (!value?.asset) return null` then applies, which is the same thing
 *  it does for a Sanity image whose asset reference does not resolve. */
function assetFrom(media: unknown): Record<string, unknown> | undefined {
  if (!isRecord(media)) return undefined;
  const row = media as PayloadMediaRow;
  if (typeof row.url !== "string" || row.url.length === 0) return undefined;
  return assetShape(row, ["_id", "url", "mimeType", "lqip", "dimensions"], { unset: "omit" });
}

/** The block's own properties, minus the two that are Payload bookkeeping and
 *  minus every explicit `null`. See the header on why the nulls go. */
function withoutNulls(node: Record<string, unknown>, drop: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (drop.includes(key) || value === null) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Rewrite one converted node, and everything nested inside it.
 *
 * Recursive because Portable Text nests: an image can be an inline object
 * inside a list item's `children`, which is where `lexicalToPortableText`'s
 * "decorator LEAF" escape hatch puts an image dropped into a quote in the
 * admin. A top-level-only pass would map the common case and silently miss
 * that one.
 */
function mapNode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mapNode);
  if (!isRecord(value)) return value;

  const mapped: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) mapped[key] = mapNode(nested);

  if (mapped._type !== "image") return mapped;

  const asset = assetFrom(mapped.media);
  const rest = withoutNulls(mapped, ["media", "sanityAssetId"]);
  return asset ? { ...rest, asset } : rest;
}

/**
 * Convert what Payload stores in a `richText` column into the Portable Text
 * array `@portabletext/react` renders, with embedded media resolved.
 *
 * Accepts `null`/`undefined` — a rich-text field that was never filled in comes
 * back from Payload as `null`, and `[]` is the right answer for a renderer.
 */
export function portableText(state: unknown): RichText {
  return lexicalToPortableText(state).map(mapNode);
}
