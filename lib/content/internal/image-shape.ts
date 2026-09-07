/**
 * One implementation of "a Payload media row, shaped like a Sanity image".
 *
 * ---------------------------------------------------------------------------
 * Why this file exists
 * ---------------------------------------------------------------------------
 *
 * Every Payload reader has to hand components the shape their GROQ used to
 * return — `image{ asset->{…}, alt }` — because nothing under `components/`
 * changes in this phase. Before this file, five readers each built that shape
 * by hand: **18 `asset` constructions and 9 copies of the flattened media
 * row**, across `case-studies`, `discovery`, `news`, `outputs` and
 * `lived-experiences`, with no shared helper and five private copies of the
 * `MediaRow` interface.
 *
 * They had already drifted, in two ways that no test and no rendered DOM can
 * see:
 *
 * 1. **Key order.** Sanity's Content Lake serializes an object's keys
 *    alphabetically (see `internal/localized.ts`), and that order reaches the
 *    RSC flight payload verbatim. `case-studies`, `discovery` and three of
 *    `outputs`' sites ran their groups through `groqObject`; `news`' four sites
 *    and `lived-experiences`' two did not. So the same picture serialized
 *    `{alt, asset, height, …}` from one reader and `{asset, alt, url, …}` from
 *    another.
 * 2. **`dimensions`.** Task 13 caught `{width, height}` where Sanity emits
 *    `{height, width}`; `news`, `outputs` and `lived-experiences` still emitted
 *    the unsorted pair here.
 *
 * `pages.ts` carries **234 `asset->` dereferences and 197 `metadata`
 * references**. Writing the shape per block would have turned 18 drifting
 * copies into hundreds, which is exactly what the locale-key defect did before
 * `internal/localized.ts` ended it. This file is that fix for images, and
 * `lib/__tests__/payload-image-shape.test.ts` fails if a reader builds the
 * shape by hand again.
 *
 * ---------------------------------------------------------------------------
 * The Sanity-shaped wrapper is deliberate and stays
 * ---------------------------------------------------------------------------
 *
 * Components gate on `image.asset._id` (`news-post-card.tsx:81` renders the
 * picture only `{image?.asset?._id && …}`), and `payload-image-source`'s
 * `resolveMedia` recurses into `object.asset` while `isSanityShaped` tests for
 * `_id`/`_ref`/`_type`. So an image emitted **only** as `asset->{_id, url, …}`
 * resolves to `""` and disappears, and one emitted **only** as a bare media row
 * blanks every card that gates on `_id`.
 *
 * Both shapes are therefore emitted at once: `asset` for the renderers, and the
 * media row's own six fields flattened onto the group for `resolveMedia`, which
 * unwraps those first and never reaches `asset._id`. Those six flattened keys
 * are **not** part of Sanity's shape and are visible in the flight payload
 * wherever the group reaches a client component — recorded as Task 10's concern
 * 5, Task 11's note 6, and the plan's Task-18 blocker 2, which owns the tidier
 * fix in `payload-image-source` rather than per reader.
 *
 * ---------------------------------------------------------------------------
 * `fields` names what the GROQ projects, and nothing else
 * ---------------------------------------------------------------------------
 *
 * A GROQ projection emits **exactly** the keys it names — a key it does not
 * name must be **absent**, not `null`. The eight distinct asset projections in
 * the layer are all spelled as a `fields` list rather than as a shape enum, so
 * a reader states what its query asks for and the helper decides how to answer:
 *
 *   `asset->{_id, url, mimeType, metadata{lqip, dimensions{…}}}`
 *      -> ["_id", "url", "mimeType", "lqip", "dimensions"]
 *   `asset->{_id, url, metadata{lqip}}`
 *      -> ["_id", "url", "lqip"]
 *   `asset->{url}`
 *      -> ["url"]
 *   `asset->{_id, url, originalFilename, size, mimeType}`   (a `files` row)
 *      -> ["_id", "url", "originalFilename", "size", "mimeType"]
 *
 * `lqip` and `dimensions` are asset fields here because that is how a reader
 * thinks of them; the helper puts both inside `metadata`, and omits `metadata`
 * entirely when neither is asked for.
 */
import { groqObject, localized, orNull, type LocalizedRaw } from "@/lib/content/internal/localized";

type Row = Record<string, unknown>;

/**
 * A `media` row (or a `files` row) as Payload hands it back at `depth >= 1`.
 *
 * `filename`/`filesize` are the `files` collection's answer to Sanity's
 * `originalFilename`/`size`; `lqip` is the column Phase 2 populated 347/347 and
 * that 25 components render as a blur placeholder.
 */
export interface PayloadMediaRow {
  id?: unknown;
  url?: string | null;
  mimeType?: string | null;
  lqip?: string | null;
  width?: number | null;
  height?: number | null;
  sizes?: unknown;
  filename?: string | null;
  filesize?: number | null;
}

/** One key a caller's `asset->{…}` projection names. `lqip` and `dimensions`
 *  land inside `metadata`; the rest sit directly on `asset`. */
export type AssetField =
  | "_id"
  | "url"
  | "mimeType"
  | "lqip"
  | "dimensions"
  | "originalFilename"
  | "size";

/** One key an `image{ asset->{…}, … }` projection names beside `asset`. */
export type ImageGroupKey = "alt" | "caption" | "hotspot" | "crop";

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * The media row a group's `asset` points at, or `undefined`.
 *
 * At `depth: 0` Payload leaves an upload field as a bare id string, which
 * carries no url and no dimensions — the same nothing an unresolvable Sanity
 * reference carries, so it is treated the same way.
 */
export function mediaOf(group: unknown): PayloadMediaRow | undefined {
  if (!isRow(group)) return undefined;
  return isRow(group.asset) ? (group.asset as PayloadMediaRow) : undefined;
}

/**
 * `image.alt` as the plain string a GROQ read of it returns.
 *
 * Sanity declares `alt` `type: "string"` on every image type this layer reads;
 * Payload models it localized with `fallback: true`, so the `en` arm is the
 * value the import wrote. The `text()` arm covers a Sanity-shaped bare string
 * reaching the seam.
 */
export function altString(value: unknown): string | undefined {
  return localized(value as LocalizedRaw)?.en ?? text(value);
}

/**
 * `asset->{…}`, holding exactly the keys `fields` names, in Sanity's order.
 *
 * @param opts.unset `"null"` (the default) is what a GROQ projection returns
 *   for a key it names and the document does not set. `"omit"` drops those keys
 *   instead, and is used by `payload/rich-text.ts` alone: a Portable Text image
 *   block's null arms were measured as pure parity noise there and are dropped
 *   wholesale, so an asset that spelled them out would put them straight back.
 *
 * @param opts.urlWhenMissing what `url` becomes when the row carries none.
 *   `null` is what a GROQ projection of an unset field returns and is the
 *   default; `""` is preserved for `lived-experiences`' detail thumbnail, whose
 *   declared type is a non-nullable `string`. No `media` row in either store
 *   has a null url, so the two are indistinguishable in the live data.
 */
export function assetShape(
  media: PayloadMediaRow,
  fields: readonly AssetField[],
  opts: { urlWhenMissing?: null | ""; unset?: "null" | "omit" } = {},
): Row {
  const asked = new Set(fields);
  const omit = opts.unset === "omit";
  const asset: Row = {};

  /** A projected key: `null` when unset, or absent in `omit` mode. */
  const put = (key: string, value: unknown, into: Row = asset) => {
    if (value === undefined && omit) return;
    into[key] = value ?? null;
  };

  if (asked.has("_id")) put("_id", String(media.id ?? ""));
  if (asked.has("url")) put("url", text(media.url) ?? opts.urlWhenMissing ?? undefined);
  if (asked.has("mimeType")) put("mimeType", text(media.mimeType));
  if (asked.has("originalFilename")) put("originalFilename", text(media.filename));
  if (asked.has("size")) put("size", num(media.filesize));

  if (asked.has("lqip") || asked.has("dimensions")) {
    const metadata: Row = {};
    if (asked.has("lqip")) put("lqip", text(media.lqip), metadata);
    if (asked.has("dimensions")) {
      const width = num(media.width);
      const height = num(media.height);
      // `{height, width}` — Sanity's alphabetical order. Task 13 found this
      // pair emitted `{width, height}`, invisible in the DOM and caught only by
      // comparing an API response.
      const dimensions = omit
        ? groqObject(Object.fromEntries(
            ([["height", height], ["width", width]] as const).filter(([, v]) => v !== undefined),
          ))
        : width !== undefined && height !== undefined
          ? groqObject({ height, width })
          : undefined;
      if (!omit || (dimensions && Object.keys(dimensions).length > 0)) {
        put("dimensions", dimensions, metadata);
      }
    }
    if (!omit || Object.keys(metadata).length > 0) put("metadata", groqObject(metadata));
  }

  return groqObject(asset);
}

/**
 * The media row's own six fields, flattened onto the image group.
 *
 * Not part of the GROQ shape — see the header for why `payload-image-source`
 * needs them anyway.
 */
export function flattenedMedia(media: PayloadMediaRow): Row {
  return {
    url: media.url ?? null,
    mimeType: media.mimeType ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
    lqip: media.lqip ?? null,
    sizes: media.sizes ?? null,
  };
}

/**
 * `image{ asset->{…}[, alt][, caption][, hotspot][, crop] }`, plus the
 * flattened media row.
 *
 * `null` when the group is absent, when its upload is unresolved, or when the
 * row carries no url — the three cases in which a GROQ dereference produces
 * nothing renderable, and in which every hand-written copy of this shape
 * already returned `null`.
 *
 * `hotspot` and `crop` are `null` whenever a projection names them: Payload
 * models a focal point as `focalX`/`focalY` on the media row rather than as a
 * Sanity hotspot, and both are unset on every document in both stores.
 * `caption` is likewise `null` — the projections that name it are reading a
 * field neither schema declares.
 */
export function imageGroup(
  group: unknown,
  opts: {
    asset: readonly AssetField[];
    keys?: readonly ImageGroupKey[];
    /** `false` for a projection whose result never reaches `imageUrl()`. */
    flatten?: boolean;
  },
): Row | null {
  if (!isRow(group)) return null;
  const media = mediaOf(group);
  if (!media || !text(media.url)) return null;

  const available: Record<ImageGroupKey, unknown> = {
    alt: orNull(altString(group.alt)),
    caption: null,
    crop: null,
    hotspot: null,
  };

  const projection: Row = { asset: assetShape(media, opts.asset) };
  for (const key of opts.keys ?? []) projection[key] = available[key];
  if (opts.flatten !== false) Object.assign(projection, flattenedMedia(media));

  return groqObject(projection);
}
