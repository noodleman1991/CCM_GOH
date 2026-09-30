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
 * `_type: "image"` is deliberately NOT emitted, and the parity harness is why
 * ---------------------------------------------------------------------------
 *
 * Half these projections spread the stored object before naming their keys
 * (`image{ ..., asset->{…}, alt }`), so Sanity's answer carries the stored
 * `_type: "image"` alongside `alt` and `asset`; the other half name their keys
 * (`headerImage{ asset->{…}, alt }`) and carry none. Reproducing the spread's
 * `_type` looks free and is not: `payload-image-source`'s `resolveMedia`
 * **refuses any object carrying `_id`, `_ref` or `_type`**, because that is how
 * it tells a Sanity image from a Payload one — a distinction its own header
 * records as found by this same harness, and one the thirteen not-yet-swapped
 * modules still depend on.
 *
 * Emitting `_type` therefore made `imageUrl()` return `""`, and the first hero
 * parity run rendered `<img>` with a blur placeholder and **no `src` at all**.
 * So the key is left off, and every image group here is the named spelling.
 *
 * That is a deviation, and it is the same one already accepted for the six
 * flattened media keys `image-shape.ts` emits beside `asset` (Task 10's concern
 * 5, Task 11's note 6, the plan's Task-18 blocker 2): both are visible only in
 * the flight payload, and both are owned by the tidier fix in
 * `payload-image-source` rather than by a per-reader workaround. Narrowing
 * `isSanityShaped` to ignore a `_type` on an object that also carries a Payload
 * `url` would let the key come back; it is a change to a file with nineteen
 * call sites and thirteen unswapped callers, so it is written down here rather
 * than made here.
 *
 * Nothing rendered depends on it: no renderer reads an image group's `_type`
 * (grepped `components/blocks/`; the only `_type` reads are the two block
 * dispatchers).
 */
import { groupLogos } from "@/lib/logos/group-logos";
import "server-only";
import { createHash } from "node:crypto";
import { imageGroup, mediaOf } from "@/lib/content/internal/image-shape";
import { groqObject, localized, orNull, type LocalizedRaw } from "@/lib/content/internal/localized";
import { agendaCardProjection } from "@/lib/content/internal/payload/outputs";
import { portableText } from "@/lib/content/internal/payload/rich-text";
import { isRegionCode, type RegionCode } from "@/lib/maps/region-codes";

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
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



/**
 * `link{title, href, target, buttonVariant{…}}`.
 *
 * `null` unless the link carries a title or an href, because Payload's group is
 * always present and Sanity's field usually is not: measured, 22 of the 26
 * `split-content`s in the corpus have no `link` at all (GROQ: `null`) and the
 * other 4 have one holding nothing but a default `buttonVariant`, while all 16
 * `grid-card`s have a real one. Emitting the object always would be right 20
 * times and wrong 22; this is right 38 times and wrong on those 4 empty ones.
 */
function linkObject(group: unknown): Row | null {
  if (!isRow(group)) return null;
  const title = text(group.title);
  const href = text(group.href);
  if (!title && !href) return null;
  return groqObject({
    buttonVariant: buttonVariantObject(group.buttonVariant),
    href: orNull(href),
    target: checkbox(group.target),
    title: orNull(title),
  });
}

/** `image{ asset->{…}, alt }`. Both spellings of the projection land here — see
 *  the header for why the spread's `_type` is left off. Nothing else the
 *  document stores comes along: `hotspot` and `crop` are unset on every image
 *  group in the corpus, so a spread has nothing else to carry. */
function projectedImage(
  group: unknown,
  asset: readonly ("_id" | "url" | "mimeType" | "lqip" | "dimensions")[] = FULL_ASSET,
): Row | null {
  return imageGroup(group, { asset, keys: ["alt"] });
}

/** `body[]{…}` — Payload's Lexical column as the Portable Text the renderers
 *  read. `null`, not `[]`, when the column was never filled: GROQ returns null
 *  for an unset array and 9 of the 26 `split-content`s in the corpus have no
 *  body at all. */
function richText(state: unknown): unknown[] | null {
  return state == null ? null : portableText(state);
}

/**
 * Rich text a projection names as a **bare field reference** rather than as a
 * `[]{…}` projection — `grid-row.description` and the six regional grid slots'
 * `description`.
 *
 * GROQ returns the stored value untouched for a bare field, so an image inside
 * it keeps its **undereferenced** `{_type: "image", asset: {_ref, _type:
 * "reference"}}` — the same shape `backgroundObject` already reproduces for
 * `background.image`, and for the same reason: a spread does not follow a
 * reference. `lib/content/images.ts` resolves such a reference through the
 * Sanity builder on either backend, which is what keeps the rendered `<img>`
 * identical.
 *
 * Measured across the whole corpus (2026-09-07): exactly **one** stored
 * description contains an image — `central-and-southern-asia`'s `agendasGrid`,
 * in all four locales — and Sanity returns it as `{_key, _type, asset}` and
 * nothing else. Dereferencing it instead handed the renderer real dimensions
 * and an `lqip`, where Sanity's undereferenced asset has neither and
 * `portable-text-renderer.tsx` falls back to 800x450 with no blur placeholder.
 * That is a visible layout difference on one figure, which is why this exists
 * rather than the simpler `richText` above. The other 35 page descriptions and
 * every homepage grid description hold text only, so the two behave identically
 * there.
 */
function storedRichText(state: unknown): unknown[] | null {
  if (state == null) return null;
  return portableText(state).map(unresolveImage);
}

function unresolveImage(node: unknown): unknown {
  if (!isRow(node) || node._type !== "image") return node;
  // `portableText` has already run, so `asset` is the shaped projection rather
  // than a raw media row and its `_id` is the media row id — which is the
  // Sanity asset id verbatim (`payload/collections/media.ts` preserves it), so
  // the reference it goes back into still resolves.
  const id = isRow(node.asset) ? text(node.asset._id) : undefined;
  if (!id) return node;
  return groqObject({ _key: node._key, _type: "image", asset: referenced(id) });
}

// ---------------------------------------------------------------------------
// The families
// ---------------------------------------------------------------------------

/** `HERO_1_PROJECTION`, key for key. */
function hero1Block(row: Row, key: string | null = blockKey(row), type = "hero-1"): Row {
  return groqObject({
    _key: key,
    _type: type,
    background: backgroundObject(row.background),
    body: richText(row.body),
    image: projectedImage(row.image),
    imagePosition: orNull(text(row.imagePosition)),
    links: linksArray(row.links),
    padding: paddingObject(row.padding),
    tagLine: orNull(text(row.tagLine)),
    title: orNull(text(row.title)),
  });
}

/** `SPLIT_ROW_PROJECTION`. `splitColumns` is emitted as the array Payload
 *  holds, empty included: every split-row in the corpus has columns, and an
 *  array field that exists is not the unset field `links` is. */
function splitRowBlock(row: Row, key: string | null = blockKey(row)): Row {
  return groqObject({
    _key: key,
    _type: "split-row",
    noGap: checkbox(row.noGap),
    padding: paddingObject(row.padding),
    splitColumns: Array.isArray(row.splitColumns)
      ? row.splitColumns.map(mapSplitColumn).filter((column): column is Row => column !== undefined)
      : null,
  });
}

/** `SPLIT_CONTENT_PROJECTION`. `image` and `links` are stored on 18 and 22 of
 *  the 26 real instances and named by neither the projection nor the Payload
 *  block — dead in production on both sides (`transform.ts`'s
 *  `SPLIT_CONTENT_DROPPED`). */
function splitContentColumn(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "split-content",
    body: richText(row.body),
    link: linkObject(row.link),
    padding: paddingObject(row.padding),
    sticky: checkbox(row.sticky),
    tagLine: orNull(text(row.tagLine)),
    title: orNull(text(row.title)),
  });
}

/** `SPLIT_IMAGE_PROJECTION` — the image's keys are named, so no `_type`.
 *  Zero instances live inside `page.blocks` (all 16 are the homepage's split-row
 *  slots, i.e. 14d's); mapped here because `splitRow.splitColumns` offers it. */
function splitImageColumn(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "split-image",
    image: projectedImage(row.image),
  });
}

/**
 * `CAROUSEL_2_PROJECTION`.
 *
 * **Unexercised on both sides.** `carousel-2` is offered by the `pages`
 * collection and authored zero times on a page — its four real instances are the
 * homepage's `livedExperiences` slot, i.e. 14d's — and even there `testimonial`
 * is empty on all four, so the site renders this carousel with no cards today.
 * Mapped against the schema so 14d inherits it and so an editor adding one gets
 * a rendered block rather than a dropped one.
 *
 * The two `coalesce`s are the projection's own, and both are legacy fallbacks
 * Payload models as separate columns: `jobTitle` (localized) falls back to
 * `title` (the deprecated single-language one) wrapped as `{en: …}`, and
 * `quote` (localized rich text) falls back to `body` the same way.
 *
 * `project->{_id, name}` has no Payload counterpart — the `project` document
 * type has 0 live documents and was not ported — so it is `null`, which is also
 * what Sanity answers for the 21 testimonials that never set it.
 */
function carousel2Block(row: Row, key: string | null = blockKey(row)): Row {
  return groqObject({
    _key: key,
    _type: "carousel-2",
    description: orNull(text(row.description)),
    padding: paddingObject(row.padding),
    testimonial: Array.isArray(row.testimonial)
      ? listOrNull(row.testimonial.filter(isRow).map(testimonialCard))
      : null,
    title: orNull(text(row.title)),
  });
}

function testimonialCard(row: Row): Row {
  return groqObject({
    _id: String(row.id ?? ""),
    featured: row.featured ?? null,
    image: imageGroup(row.image, {
      asset: ["_id", "url", "mimeType", "lqip", "dimensions"],
      keys: ["alt", "crop", "hotspot"],
    }),
    name: orNull(text(row.name)),
    organization: namedReference(row.organization),
    project: null,
    quote: orNull(localizedRichText(row.quote, row.body)),
    rating: orNull(num(row.rating)),
    relatedCommunity: namedReference(row.relatedCommunity),
    title: orNull(localized(row.jobTitle as LocalizedRaw) ?? wrapEn(text(row.title))),
  });
}

/** `coalesce(quote, {"en": body})` — the localized rich text, or the legacy
 *  single-language column wrapped as its English arm. */
function localizedRichText(value: unknown, legacy: unknown): Record<string, unknown> | undefined {
  if (isRow(value)) {
    const arms = Object.entries(value)
      .filter(([, state]) => state != null)
      .map(([locale, state]) => [locale, portableText(state)] as const);
    if (arms.length > 0) return groqObject(Object.fromEntries(arms));
  }
  return legacy == null ? undefined : groqObject({ en: portableText(legacy) });
}

function wrapEn(value: string | undefined): Record<string, string> | undefined {
  return value === undefined ? undefined : { en: value };
}

/** `x->{_id, name}` — the two-key dereference `carousel-2` uses three times. */
function namedReference(value: unknown): Row | null {
  if (!isRow(value)) return null;
  return groqObject({
    _id: String(value.id ?? ""),
    name: orNull(localized(value.name as LocalizedRaw) ?? text(value.name)),
  });
}

/** `[]` is Payload's spelling of an array field nobody filled in; GROQ answers
 *  `null` for the same field. */
function listOrNull(rows: Row[]): Row[] | null {
  return rows.length > 0 ? rows : null;
}

/** `CTA_1_PROJECTION`. `sectionWidth: "full"` cannot come back — see note 3 in
 *  the header. */
function cta1Block(row: Row, key: string | null = blockKey(row)): Row {
  return groqObject({
    _key: key,
    _type: "cta-1",
    background: backgroundObject(row.background),
    body: richText(row.body),
    links: linksArray(row.links),
    padding: paddingObject(row.padding),
    sectionWidth: orNull(text(row.sectionWidth)),
    stackAlign: orNull(text(row.stackAlign)),
    tagLine: orNull(text(row.tagLine)),
    title: orNull(text(row.title)),
  });
}

/**
 * `SECTION_HEADER_PROJECTION`.
 *
 * `link` is projected by the GROQ and declared by neither the Sanity schema nor
 * the Payload block, so it is `null` on all three instances in both stores —
 * the same "projected, undeclared" shape `caption` has on an image group.
 */
function sectionHeaderBlock(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "section-header",
    description: orNull(text(row.description)),
    link: null,
    padding: paddingObject(row.padding),
    sectionWidth: orNull(text(row.sectionWidth)),
    stackAlign: orNull(text(row.stackAlign)),
    tagLine: orNull(text(row.tagLine)),
    title: orNull(text(row.title)),
  });
}

/**
 * `LOGO_CLOUD_1_PROJECTION`.
 *
 * `images[]{ ..., label, orgType, asset->{…}, alt }` spreads, so each entry is
 * an image group in its own right rather than a wrapper around one: `asset` and
 * `alt` sit directly on the array row, beside the two keys the projection adds.
 * The entry's `_key` comes from the array row's id the same way a block's does.
 *
 * `logo-cloud-1.tsx` is a **client** component, so these entries reach the RSC
 * flight payload — which is exactly where the `_type` decision in the header
 * would have been visible, and where the flattened media keys are.
 */
function logoCloud1Block(row: Row, key: string | null = blockKey(row)): Row {
  const orgs = (value: unknown) =>
    (Array.isArray(value) ? value.map(logoFromOrganization).filter((i): i is Row => i !== null) : []).map((r) => ({ ...r, id: String(r._key) }));
  // Funded by / Hosted by lead the wall; an organisation shows once (spec §3.4).
  const grouped = groupLogos({
    fundedBy: row.layout === "grid" ? orgs(row.fundedBy) : [],
    hostedBy: row.layout === "grid" ? orgs(row.hostedBy) : [],
    partners: orgs(row.organizations),
    others: (Array.isArray(row.images) ? row.images.filter(isRow).map(logoCloudImage).filter((i): i is Row => i !== null) : []).map((r) => ({ ...r, id: String(r._key) })),
  });
  const strip = (row: Row): Row => { const rest = { ...row }; delete rest.id; return rest; };
  return groqObject({
    _key: key,
    _type: "logo-cloud-1",
    description: orNull(text(row.description)),
    // Only present when set, so a strip without them keeps its old shape.
    ...(grouped.leads.length ? { leads: grouped.leads.map(({ item, role }) => ({ ...strip(item), role })) } : {}),
    // Partner organisations first (CMS project 2), then any unlinked logos.
    images: listOrNull([...grouped.partners.map(strip), ...grouped.others.map(strip)]),
    layout: orNull(text(row.layout)),
    motionSpeed: orNull(text(row.motionSpeed)),
    padding: paddingObject(row.padding),
    title: orNull(text(row.title)),
  });
}

function logoCloudImage(row: Row): Row | null {
  const projected = projectedImage(row);
  if (!projected) return null;
  return groqObject({
    _key: blockKey(row),
    ...projected,
    href: null,
    label: orNull(text(row.label)),
    name: null,
    orgType: orNull(text(row.orgType)),
  });
}

/** A partner organisation as a logo: its own logo (or none — the strip shows
 *  its name), named, linked to its hub page. Hidden or deleted ones are left out. */
function logoFromOrganization(value: unknown): Row | null {
  if (!isRow(value) || value.showOnSite === false) return null;
  const name = text(value.name);
  const slug = text(value.slug);
  if (!name || !slug) return null;
  const logo = projectedImage(value.logo);
  return groqObject({
    _key: `org-${String(value.id ?? slug)}`,
    ...(logo ?? { asset: null }),
    alt: name,
    href: `/organizations/${slug}`,
    label: name,
    name,
    orgType: orNull(text(value.type)),
  });
}

/**
 * `GRID_ROW_PROJECTION`.
 *
 * `headerImage`'s asset projection is the one that does **not** name
 * `mimeType` — `{_id, url, metadata{lqip, dimensions}}` — so it is passed
 * explicitly rather than defaulted.
 *
 * `description` is read by GROQ as a bare field reference, not as a `[]{…}`
 * projection, so Sanity returns the stored Portable Text verbatim — including,
 * in principle, an image block still holding its undereferenced `_ref`. Zero of
 * the 36 stored descriptions contain an image (measured: every entry is
 * `_type: "block"`), so `portableText()`'s dereferencing has nothing to change;
 * if one ever appears, this is the projection that will disagree.
 */
function gridRowBlock(row: Row, key: string | null = blockKey(row)): Row {
  return groqObject({
    _key: key,
    _type: "grid-row",
    background: backgroundObject(row.background),
    cardVariant: orNull(text(row.cardVariant)),
    columns: Array.isArray(row.columns)
      ? row.columns.map(mapGridColumn).filter((column): column is Row => column !== undefined)
      : null,
    description: storedRichText(row.description),
    gridColumns: orNull(text(row.gridColumns)),
    headerImage: projectedImage(row.headerImage, ["_id", "url", "lqip", "dimensions"]),
    initialDisplayCount: orNull(num(row.initialDisplayCount)),
    padding: paddingObject(row.padding),
    subtitle: orNull(text(row.subtitle)),
    title: orNull(text(row.title)),
  });
}

/** `GRID_CARD_PROJECTION`. 16 instances, all carrying a real link. */
function gridCardColumn(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "grid-card",
    excerpt: orNull(text(row.excerpt)),
    image: projectedImage(row.image),
    link: linkObject(row.link),
    title: orNull(text(row.title)),
  });
}

/**
 * `GRID_AGENDA_PROJECTION` — the corpus's single biggest block, 182 instances.
 *
 * The three booleans are the documented exception to the `false` -> `null` rule
 * in the header: Sanity stores all three **explicitly** on all 182
 * (`showTags` false, `showMetadata` false, `showDownloadButtons` true), so
 * Payload's value is Sanity's value and passing it through is exact.
 *
 * The dereferenced agenda is `outputs.ts`'s own `AGENDA_FIELDS` projection,
 * reused rather than rebuilt — see `agendaCardProjection` there for the one
 * latent difference between the two GROQ spellings.
 */
function gridAgendaColumn(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "grid-agenda",
    agenda: agendaCardProjection(row.agenda),
    showDownloadButtons: row.showDownloadButtons === true,
    showMetadata: row.showMetadata === true,
    showTags: row.showTags === true,
  });
}

/**
 * `GRID_NEWS_PROJECTION`.
 *
 * **Zero instances inside `page.blocks`** — all 16 real ones are the homepage's,
 * i.e. 14d's — so this is written against the schema rather than against data,
 * the same treatment `outputs.ts` gives `organizations` (0/29). It is here
 * because `gridRow.columns` offers `gridNews` to an editor today, and a column
 * this file dropped would vanish silently.
 *
 * Its `newsPost` projection is **not** `news.ts`'s `NEWS_POST_FIELDS`: it takes
 * a narrower set, keeps `slug` as the raw slug object rather than
 * `"slug": slug.current`, and asks organizations for `acronym` instead of
 * `logo`. Reusing that reader's helpers would have meant giving each of them a
 * field list for a shape nothing exercises.
 *
 * The five booleans follow the header's rule rather than `grid-agenda`'s: with
 * no page instance to measure, the schema default is the only evidence, and
 * `x === true` is what the importer wrote.
 */
function gridNewsColumn(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "grid-news",
    customExcerpt: orNull(text(row.customExcerpt)),
    newsPost: newsPostCard(row.newsPost),
    showAuthor: checkbox(row.showAuthor),
    showLocation: checkbox(row.showLocation),
    showMetadata: checkbox(row.showMetadata),
    showTags: checkbox(row.showTags),
  });
}

/** `newsPost->{…}` as `GRID_NEWS_PROJECTION` names it. */
function newsPostCard(value: unknown): Row | null {
  if (!isRow(value)) return null;
  return groqObject({
    _id: String(value.id ?? ""),
    author: newsAuthor(value.author),
    excerpt: orNull(localized(value.excerpt as LocalizedRaw)),
    featured: value.featured ?? null,
    image: imageGroup(value.image, {
      asset: ["_id", "url", "mimeType", "lqip", "dimensions"],
      keys: ["alt", "crop", "hotspot"],
    }),
    locationDetails: locationDetails(value.locationDetails),
    organizations: referencedList(value.organizations, ["_id", "acronym", "name", "slug"]),
    publishedAt: orNull(text(value.publishedAt)),
    slug: orNull(slugObject(value.slug)),
    subtitle: orNull(localized(value.subtitle as LocalizedRaw)),
    tags: referencedList(value.tags, ["_id", "color", "label", "value"]),
    title: orNull(localized(value.title as LocalizedRaw)),
  });
}

/** `author->{_id, name, image{asset->{_id, url}, alt}}`. */
function newsAuthor(value: unknown): Row | null {
  if (!isRow(value)) return null;
  return groqObject({
    _id: String(value.id ?? ""),
    image: projectedImage(value.image, ["_id", "url"]),
    name: orNull(text(value.name)),
  });
}

/**
 * A dereferenced list, holding exactly the keys the projection names.
 *
 * `name`/`label` are localized in Payload and plain strings in the Sanity
 * schemas these two projections read, so the `en` arm is what both stores
 * answer — the same split `image.alt` has. `slug` is the raw slug object,
 * because these projections write a bare `slug` rather than `slug.current`.
 */
function referencedList(rows: unknown, fields: readonly string[]): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const list = rows.filter(isRow).map((row) => {
    const all: Row = {
      _id: String(row.id ?? ""),
      acronym: orNull(text(row.acronym)),
      color: orNull(text(row.color)),
      label: orNull(localized(row.label as LocalizedRaw)),
      name: orNull(localized(row.name as LocalizedRaw)?.en ?? text(row.name)),
      slug: orNull(slugObject(row.slug)),
      value: orNull(text(row.value)),
    };
    return groqObject(Object.fromEntries(fields.map((key) => [key, all[key]])));
  });
  return list.length > 0 ? list : null;
}

/** `slug` as the object Sanity stores, for the projections that name the field
 *  rather than `slug.current`. */
function slugObject(value: unknown): Row | undefined {
  const current = text(value);
  return current ? groqObject({ _type: "slug", current }) : undefined;
}

/** `locationDetails{city, country, region, coordinates}` — Payload's group
 *  always answers with a null per field where GROQ returns `null` for a group
 *  nobody filled in. `coordinates` is projected and declared by neither schema.
 *  Same shape `news.ts` builds for the same GROQ. */
function locationDetails(value: unknown): Row | null {
  if (!isRow(value)) return null;
  const city = orNull(text(value.city));
  const country = orNull(text(value.country));
  const region = orNull(text(value.region));
  if (city === null && country === null && region === null) return null;
  return groqObject({ city, coordinates: null, country, region });
}

/**
 * `grid-post`, `grid-case-study` and `grid-lived-experience` are the
 * projection's other three arms.
 *
 * None is offered by `gridRow.columns` in Payload and none was ever authored
 * inside one — measured, `grid-row.columns[]` holds only `grid-agenda` (182),
 * `grid-card` (16) and, elsewhere in the corpus, `grid-news`.
 * `grid-case-study` is real but lives in `regionalCommunityPage`'s
 * `contentGrid.manualItems[]`, which is 14d's.
 */
function mapGridColumn(row: unknown): Row | undefined {
  if (!isRow(row)) return undefined;
  switch (row.blockType) {
    case "gridCard":
      return gridCardColumn(row);
    case "gridAgenda":
      return gridAgendaColumn(row);
    case "gridNews":
      return gridNewsColumn(row);
    default:
      return undefined;
  }
}

/** `split-cards-list` and `split-info-list` are the projection's other two arms
 *  and were never authored — 0 instances, and Phase 2 ported no block for
 *  either. An entry of an unported type is dropped, as at the page level. */
function mapSplitColumn(row: unknown): Row | undefined {
  if (!isRow(row)) return undefined;
  switch (row.blockType) {
    case "splitContent":
      return splitContentColumn(row);
    case "splitImage":
      return splitImageColumn(row);
    default:
      return undefined;
  }
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
    case "splitRow":
      return splitRowBlock(row);
    case "gridRow":
      return gridRowBlock(row);
    case "carousel2":
      return carousel2Block(row);
    case "cta1":
      return cta1Block(row);
    case "sectionHeader":
      return sectionHeaderBlock(row);
    case "logoCloud1":
      return logoCloud1Block(row);
    case "hero2":
      return hero2Block(row);
    case "faqs":
      return faqsBlock(row);
    case "timelineRow":
      return timelineRowBlock(row);
    case "carousel1":
      return carousel1Block(row);
    case "submitStoryBanner":
      return submitStoryBannerBlock(row);
    case "formNewsletter":
      return formNewsletterBlock(row);
    case "eventsCalendar":
      return eventsCalendarBlock(row);
    case "peopleWidget":
      return peopleWidgetBlock(row);
    case "regionMap":
      return regionMapBlock(row);
    case "atlasEmbed":
      return atlasEmbedBlock(row);
    case "contentFeed":
      return contentFeedBlock(row);
    case "communityCarousel":
      return communityCarouselBlock(row);
    case "communityHeader":
      return groqObject({ _key: blockKey(row), _type: "community-header", intro: orNull(text(row.intro)), padding: paddingObject(row.padding) });
    case "communityMembers":
      return groqObject({ _key: blockKey(row), _type: "community-members", padding: paddingObject(row.padding), title: orNull(text(row.title)) });
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Sections added in the page builder (2026-09-28)
// ---------------------------------------------------------------------------
//
// These have no Sanity history, so there is no GROQ shape to reproduce: each
// returns exactly the props its component (components/blocks/index.tsx) reads,
// with `null` for anything unset — the same convention as the families above.

/** `hero-2` — hero-1's shape without the side image. */
function hero2Block(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "hero-2",
    background: backgroundObject(row.background),
    body: richText(row.body),
    links: linksArray(row.links),
    padding: paddingObject(row.padding),
    tagLine: orNull(text(row.tagLine)),
    title: orNull(text(row.title)),
  });
}

/** `faqs[]{_id, title, body}` — `_id` is the array row's id. */
function faqsBlock(row: Row): Row {
  const items = Array.isArray(row.faqs)
    ? row.faqs.filter(isRow).map((item) =>
        groqObject({ _id: String(item.id ?? ""), body: richText(item.body), title: orNull(text(item.title)) }),
      )
    : [];
  return groqObject({ _key: blockKey(row), _type: "faqs", faqs: listOrNull(items), padding: paddingObject(row.padding) });
}

function timelineRowBlock(row: Row): Row {
  const steps = Array.isArray(row.timelines)
    ? row.timelines.filter(isRow).map((item) =>
        groqObject({
          _key: blockKey(item),
          body: richText(item.body),
          tagLine: orNull(text(item.tagLine)),
          title: orNull(text(item.title)),
        }),
      )
    : [];
  return groqObject({ _key: blockKey(row), _type: "timeline-row", padding: paddingObject(row.padding), timelines: listOrNull(steps) });
}

/** Each image row is an image group; one whose upload is gone is dropped. */
function carousel1Block(row: Row): Row {
  const images = Array.isArray(row.images)
    ? row.images.filter(isRow).map((item) => projectedImage(item)).filter((image): image is Row => image !== null)
    : [];
  return groqObject({
    _key: blockKey(row),
    _type: "carousel-1",
    background: backgroundObject(row.background),
    description: orNull(text(row.description)),
    images: listOrNull(images),
    indicators: orNull(text(row.indicators)),
    padding: paddingObject(row.padding),
    size: orNull(text(row.size)),
    title: orNull(text(row.title)),
  });
}

function submitStoryBannerBlock(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "submit-story-banner",
    ctaLabel: orNull(text(row.ctaLabel)),
    illustration: projectedImage(row.illustration),
    padding: paddingObject(row.padding),
    subtitle: orNull(text(row.subtitle)),
    title: orNull(text(row.title)),
  });
}

function formNewsletterBlock(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "form-newsletter",
    buttonText: orNull(text(row.buttonText)),
    consentText: orNull(text(row.consentText)),
    padding: paddingObject(row.padding),
    successMessage: orNull(text(row.successMessage)),
  });
}

/** A region only when it is one of the seven — anything else would reach a
 *  Postgres enum or a component that needs a valid code. */
function regionOrNull(value: unknown): RegionCode | null {
  const code = text(value);
  return code && isRegionCode(code) ? code : null;
}

function eventsCalendarBlock(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "events-calendar",
    description: orNull(text(row.description)),
    padding: paddingObject(row.padding),
    title: orNull(text(row.title)),
    upcomingLimit: num(row.upcomingLimit) ?? 6,
  });
}

function peopleWidgetBlock(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "people-widget",
    description: orNull(text(row.description)),
    limit: num(row.limit) ?? 12,
    region: regionOrNull(row.region),
    title: orNull(text(row.title)),
  });
}

function regionMapBlock(row: Row): Row {
  return groqObject({
    _key: blockKey(row),
    _type: "region-map",
    description: orNull(text(row.description)),
    // Unset (every section saved before the switch existed) means on.
    showRegionStories: row.showRegionStories !== false,
    title: orNull(text(row.title)),
  });
}

/** A relationship value — populated row, bare id, or `{relationTo, value}` —
 *  as its id. */
function relationIdOf(value: unknown): string | undefined {
  if (isRow(value)) return relationIdOf(value.id);
  if (typeof value === "number") return String(value);
  return text(value);
}

function idList(values: unknown): string[] {
  return Array.isArray(values) ? values.map(relationIdOf).filter((id): id is string => id !== undefined) : [];
}

/**
 * `content-feed` carries its settings, not its cards: the component resolves
 * them at render time (lib/content/feeds/resolve.ts), so a feed stays current
 * without the page being republished. Relations become plain ids here so
 * nothing populated reaches the flight payload. Exported for the admin's
 * "What will show now" preview, which sends the same raw values.
 */
export function contentFeedSettings(row: Row): Row {
  const filters = isRow(row.filters) ? row.filters : {};
  const viewAll = isRow(row.viewAll) ? row.viewAll : {};
  const picks = (Array.isArray(row.picks) ? row.picks : []).filter(isRow).flatMap((pick) => {
    const id = relationIdOf(pick.value);
    const kind = text(pick.relationTo);
    return id && kind ? [{ kind, id }] : [];
  });
  return {
    heading: orNull(text(row.heading)),
    intro: orNull(text(row.intro)),
    kinds: Array.isArray(row.kinds) ? row.kinds.filter((kind): kind is string => typeof kind === "string") : [],
    fill: orNull(text(row.fill)),
    picks,
    filters: {
      regions: Array.isArray(filters.regions) ? filters.regions.filter((code): code is string => typeof code === "string") : [],
      communityIds: idList(filters.communities),
      audienceTagIds: idList(filters.audiences),
      tagIds: idList(filters.tags),
      organizationIds: idList(filters.organizations),
      featuredOnly: filters.featuredOnly === true,
      upcomingOnly: filters.upcomingOnly === true,
    },
    sort: orNull(text(row.sort)),
    count: orNull(num(row.count)),
    layout: orNull(text(row.layout)),
    viewAll: { show: viewAll.show !== false, href: orNull(text(viewAll.href)), label: orNull(text(viewAll.label)) },
  };
}

function contentFeedBlock(row: Row): Row {
  return { _key: blockKey(row), _type: "content-feed", settings: contentFeedSettings(row) };
}

/** The Community carousel's settings; the cards themselves are read at render time. */
function communityCarouselBlock(row: Row): Row {
  const show = isRow(row.show) ? row.show : {};
  const on = (v: unknown) => v !== false;
  return {
    _key: blockKey(row),
    _type: "community-carousel",
    heading: text(row.heading) ?? null,
    intro: text(row.intro) ?? null,
    communities: Array.isArray(row.communities) ? row.communities.map(relationIdOf).filter((id): id is string => Boolean(id)) : [],
    show: { members: on(show.members), stories: on(show.stories), events: on(show.events), faces: on(show.faces), latest: on(show.latest) },
    autoplay: row.autoplay !== false,
    speed: row.speed === "normal" ? "normal" : "calm",
  };
}

/** Dropped (like an unknown block) without a valid region: the component
 *  renders nothing for one anyway. */
function atlasEmbedBlock(row: Row): Row | undefined {
  const region = regionOrNull(row.region);
  if (!region) return undefined;
  return groqObject({ _key: blockKey(row), _type: "atlas-embed", region, showBreakdown: row.showBreakdown !== false });
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

// ---------------------------------------------------------------------------
// Named slots — Task 14d
// ---------------------------------------------------------------------------

/**
 * The block types a **named slot** can hold.
 *
 * `homepage` and `regionalCommunityPage` do not compose from a block array:
 * they declare fixed, named fields whose *type* is a block, and Payload models
 * each as a `group` carrying that block's own field list
 * (`payload/fields/block-slot.ts`). So the same six family mappers above serve
 * them — 14d writes no second mapper — with two differences a slot forces.
 */
export type SlotBlock = "hero1" | "splitRow" | "gridRow" | "carousel2" | "cta1" | "logoCloud1";

export interface SlotOptions {
  /**
   * The stored `_type`, when the slot holds a block of a different declared
   * type than the one whose field list it carries.
   *
   * One real case, and it is the reason this is a parameter rather than a
   * constant: `regionalCommunityPage.whyJoinCTA` stores `_type: "cta-1"` on all
   * 28 published documents while storing **hero-1's** field set (`image` on
   * 25, `imagePosition` on 20 — neither declared by cta-1). Sanity tolerates
   * it because the renderers dispatch on the stored `_type`;
   * `payload/collections/regional-community-pages.ts` types the slot on hero1
   * so the images survive, and records "do not fix this to cta1". The GROQ
   * projects `_type` as a plain field reference, so it returns the stored
   * `"cta-1"` — which is what the page renders as today, and what this
   * reproduces.
   */
  type?: string;
  /** Keys the slot's own projection names beside the block's own — only
   *  `agendasModule` and `news` on the homepage, which prefix `mode, maxItems`
   *  to `GRID_ROW_PROJECTION`. */
  extra?: Record<string, unknown>;
}

/**
 * One named slot, as the object its GROQ projection returns — or `null` for a
 * slot no editor ever filled in.
 *
 * ---------------------------------------------------------------------------
 * `_key` is `null`, and that is measured rather than assumed
 * ---------------------------------------------------------------------------
 *
 * Every one of these projections names `_key`, and a slot is a field rather
 * than an array row, so Sanity has never had one to return. Measured on
 * `production_2` at the published perspective (control
 * `count(*[_type=="agenda"])` = 29): `_key` is `null` on all eleven homepage
 * slots across all four documents and on `welcomeHero`/`whyJoinCTA` across all
 * 28 regional community pages. Payload agrees structurally — a `group` has no
 * row id — so nothing is lost and nothing has to be minted.
 *
 * ---------------------------------------------------------------------------
 * An all-null slot is the field GROQ answers `null` for
 * ---------------------------------------------------------------------------
 *
 * Payload's group always exists: `logoCloud` on a page that never had one still
 * arrives as `{padding: null, title: null, …, images: []}`, where GROQ answers
 * `null` for the whole field. The two are not the same to a renderer —
 * `regional-community-template.tsx` gates the logo section on `logoCloud &&
 * (logoCloud.images || logoCloud.showTitle !== false)`, and an always-present
 * object would **add** an empty logo cloud to every page that has none.
 *
 * So a mapped slot whose every projected key is null is reported as the unset
 * field. `background` is excluded from that test because
 * `backgroundObject` always answers with an object (see note 2 in the header),
 * and `_key`/`_type` because they are this function's own.
 *
 * Measured against Sanity, all four locales: `logoCloud` is non-null on 16 of
 * the 28 (slug, language) pairs and this rule reproduces exactly those 16.
 * `welcomeHero`, `whyJoinCTA` and all eleven homepage slots are authored
 * everywhere, so the rule never fires on them.
 */
export function slotBlock(row: unknown, block: SlotBlock, options: SlotOptions = {}): Row | null {
  if (!isRow(row)) return null;
  const mapped = mapSlot(row, block, options.type);
  if (!mapped) return null;
  const merged = groqObject({ ...mapped, ...(options.extra ?? {}) });
  return isAuthored(merged) ? merged : null;
}

function mapSlot(row: Row, block: SlotBlock, type: string | undefined): Row | undefined {
  switch (block) {
    case "hero1":
      return hero1Block(row, null, type ?? "hero-1");
    case "splitRow":
      return splitRowBlock(row, null);
    case "gridRow":
      return gridRowBlock(row, null);
    case "carousel2":
      return carousel2Block(row, null);
    case "cta1":
      return cta1Block(row, null);
    case "logoCloud1":
      return logoCloud1Block(row, null);
    default:
      return undefined;
  }
}

/** Did an editor fill anything into this slot? See the note above. */
function isAuthored(mapped: Row): boolean {
  return Object.entries(mapped).some(
    ([key, value]) => value !== null && key !== "_key" && key !== "_type" && key !== "background",
  );
}

/**
 * `contentGrid.manualItems[]` as the six regional grid slots project it.
 *
 * The projection is `manualItems[]->{…}` — a **dereference** — and the stored
 * entries are `grid-agenda` / `grid-case-study` / `grid-news` *objects*, not
 * references. GROQ's `->` on a non-reference is `null`, so the live query
 * returns one `null` per stored item and has done since the field was
 * authored: measured across all 28 published documents, every one of the 48
 * agenda, 76 case-study and 4 news entries projects as `null`, and
 * `regional-community-template.tsx` consequently renders a manual grid of
 * nulls that `mergePinnedWithDynamic` and the card components skip.
 *
 * Reproducing that is the whole job here. Emitting the mapped blocks instead
 * would be *better* data and a visible change — hand-picked cards would appear
 * on pages that show none today — which this phase's premise forbids.
 * `payload/blocks/content-grid.ts` keeps the real items, so a future task can
 * fix the projection deliberately.
 */
export { storedRichText };

export function dereferencedItems(rows: unknown): null[] | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows.map(() => null);
}
