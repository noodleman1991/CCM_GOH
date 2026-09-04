/**
 * Task 12 — Sanity document -> Payload document data.
 *
 * Everything in this file is **pure**: no database, no filesystem, no network.
 * `documents.ts` reads the Phase 0 archive and drives Payload's local API;
 * this module answers the one question "what does document X look like in
 * Payload, in locale L?". That split is what lets the whole mapping be tested
 * against fixtures instead of against Neon and R2.
 *
 * ## The four properties the import needs, and where they live here
 *
 * 1. **ID-preserving.** `documentTargets()` puts the Sanity `_id` in
 *    `target.id`. For the four Lane-A types (page, regionalCommunityPage,
 *    homepage, onboardingContent) four Sanity documents collapse into one, and
 *    the id kept is the **`en` member's** — measured, that is the canonical
 *    unsuffixed id in every group (`page-about-en`,
 *    `regional-community-page-oceania`, `homepage-en`).
 * 2. **Idempotent.** Nothing here is random or clock-dependent. Array and
 *    block row ids are derived from the source document id, the field path and
 *    the Sanity `_key`, so a second run writes the same rows rather than a
 *    fresh set.
 * 3. **Reference-order aware.** `reference()` throws unless the target id is
 *    already in `ctx.known`. A reference to a not-yet-imported document is a
 *    hard error, never a silent null.
 * 4. **Locale-collapsing.** `groupSources()` groups the Lane-A types **by
 *    slug**, not by `translation.metadata` — only 1 of the 9 page groups has
 *    that metadata and it links 2 of the 4 languages, whereas every one of the
 *    9 page slugs and 7 region slugs has a complete `ar/en/es/fr` set.
 *
 * ## The archive has no `asset._ref`
 *
 * `@sanity/export` rewrote every asset reference into
 * `"_sanityAsset": "image@file://./images/<basename>"` — 759 occurrences, zero
 * `_ref`. Everything here resolves assets through
 * `assetIdFromSanityAssetRef()` from `./sanity-export`, including the images
 * embedded inside Portable Text (see `resolveRichTextAssets`), which the
 * lexical converter would otherwise carry through as an unresolvable string.
 *
 * ## Unknown fields are an error, not a shrug
 *
 * Every builder ends with `assertHandled()`, which compares the source
 * document's own keys against the ones the builder consumed plus an explicit,
 * documented `dropped` list. A Sanity field nobody placed stops the import
 * instead of vanishing into it. The `dropped` lists below are therefore the
 * complete inventory of what this migration deliberately leaves behind.
 */

import { portableTextToLexical } from "@/lib/content/internal/lexical";
import { OnboardingContent } from "@/payload/globals/onboarding-content";
import { assetIdFromSanityAssetRef } from "./sanity-export";

export const LOCALES = ["en", "es", "fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export type SanityDoc = Record<string, unknown>;
export type PayloadData = Record<string, unknown>;

/** Sanity `_id` -> Payload id, for the documents this run has already written. */
export interface TransformContext {
  /** Sanity asset `_id` -> Payload upload id (Task 11; the identity map in practice). */
  assets: Map<string, string>;
  /** Every Payload id that already exists. A reference outside this set throws. */
  known: Set<string>;
}

export class ImportTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportTransformError";
  }
}

/* ------------------------------------------------------------------ atoms */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Sanity's `{_type:"slug", current}` — and the 4 documents that store a bare `{current}`. */
export function slugOf(value: unknown): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (isRecord(value) && typeof value.current === "string") return value.current || undefined;
  return undefined;
}

/**
 * The three localized shapes the real data uses, collapsed to one lane.
 *
 * - `{en, es, fr, ar}` (often partial — `tag.label` is `{en}` on 27 of 67)
 * - `internationalizedArray` `[{_key:"en", value}]` — only workType and
 *   expertiseArea use it
 * - a bare value, which is the same in every locale (`caseStudy.content`,
 *   `docsChapter.title`, and every `image.alt`)
 *
 * Falls back to `en` when the requested locale is absent, then to the first
 * populated locale. The fallback matters because most localized fields in
 * Payload are `required` — writing `null` into the `es` lane of
 * `caseStudies.content` would fail validation, and Payload's own
 * `fallback: true` only covers reads.
 */
export function localizedValue(value: unknown, locale: Locale): unknown {
  if (Array.isArray(value) && value.length > 0 && value.every(isInternationalizedEntry)) {
    const entries = value as { _key: string; value?: unknown }[];
    const hit =
      entries.find((e) => e._key === locale && present(e.value)) ??
      entries.find((e) => e._key === "en" && present(e.value)) ??
      entries.find((e) => present(e.value));
    return hit?.value;
  }
  if (isLocaleObject(value)) {
    const map = value as Record<string, unknown>;
    if (present(map[locale])) return map[locale];
    if (present(map.en)) return map.en;
    return Object.values(map).find(present);
  }
  return value;
}

/**
 * An **empty string is an absent translation**, not a translation to nothing.
 *
 * Measured the hard way: two case studies store
 * `title: {en: "…", es: "", fr: "", ar: ""}`, and `caseStudies.title` is
 * `localized` **and** `required`. Reading the locale literally wrote `null`
 * into the `ar` lane and Payload rejected the whole document — the import
 * lost two case studies to three empty strings. Falling back to `en` is also
 * what Payload's own `fallback: true` does at read time, so this only makes
 * the stored value agree with what the site would have shown anyway.
 */
function present(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

function isInternationalizedEntry(entry: unknown): boolean {
  return (
    isRecord(entry) &&
    typeof entry._key === "string" &&
    (LOCALES as readonly string[]).includes(entry._key) &&
    Object.keys(entry).every((k) => k === "_key" || k === "_type" || k === "value")
  );
}

function isLocaleObject(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((k) => (LOCALES as readonly string[]).includes(k));
}

/** Localized text, flattened to a string. */
export function text(value: unknown, locale: Locale): string | undefined {
  const picked = localizedValue(value, locale);
  if (typeof picked === "string") return picked || undefined;
  if (typeof picked === "number") return String(picked);
  return undefined;
}

/**
 * Empty string is not a date. The single `caseStudyDraft` stores
 * `studyPeriod: {startDate: "", endDate: ""}`, and one published `caseStudy`
 * has an empty `startDate` too, against `type: "date"` columns.
 */
export function dateOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Sanity `geopoint` -> Payload `point`, which is `[longitude, latitude]`. */
export function pointOf(value: unknown): [number, number] | null {
  if (!isRecord(value)) return null;
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return [lng, lat];
}

/**
 * A group's value. Always an object, never `null` — see `image()` for the
 * Payload behaviour that makes a null group a crash rather than an empty one.
 * The emptiness that mattered (`{}`, `{startDate:"", endDate:""}`) is already
 * handled by `dateOf`/`pointOf` turning the leaves into nulls.
 */
export function groupValue(value: PayloadData): PayloadData {
  return value;
}

function refTarget(value: unknown): string | undefined {
  if (isRecord(value) && typeof value._ref === "string") return value._ref;
  return undefined;
}

/**
 * A reference, checked against what has already been imported.
 *
 * The whole point of importing in dependency order is that this can throw:
 * Payload would happily write a relationship to a row that does not exist yet
 * only for the foreign key to reject it far from the field that caused it, and
 * a `hasMany` list would silently lose the member.
 */
export function reference(value: unknown, ctx: TransformContext, where: string): string | undefined {
  const ref = refTarget(value);
  if (ref === undefined) return undefined;
  if (!ctx.known.has(ref)) {
    throw new ImportTransformError(
      `${where} references "${ref}", which has not been imported yet. ` +
        `Fix the import order in documents.ts rather than writing a null here.`,
    );
  }
  return ref;
}

export function references(value: unknown, ctx: TransformContext, where: string): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .map((entry, i) => reference(entry, ctx, `${where}[${i}]`))
    .filter((id): id is string => id !== undefined);
  return out.length > 0 ? out : undefined;
}

/**
 * An upload reference. The archive expresses these as
 * `"image@file://./images/<basename>"`; `assetIdFromSanityAssetRef` turns that
 * back into the Sanity asset `_id`, which is also the Payload upload id.
 */
export function upload(value: unknown, ctx: TransformContext, where: string): string | undefined {
  const raw = isRecord(value) ? value._sanityAsset : value;
  const assetId = assetIdFromSanityAssetRef(raw);
  if (assetId === undefined) return undefined;
  const uploadId = ctx.assets.get(assetId);
  if (uploadId === undefined) {
    throw new ImportTransformError(
      `${where} references asset "${assetId}", which is not in the Task 11 asset map. ` +
        `Run \`pnpm import:assets\` first.`,
    );
  }
  return uploadId;
}

/**
 * Sanity's `image` object -> Payload's `{asset, alt}` group.
 *
 * **`alt` is stored as a bare string** on all 305 real image fields, never as
 * an `{en,…}` lane, so it resolves to the same string in every locale. Payload
 * keeps `alt` localized and `fallback: true` covers es/fr/ar; writing the bare
 * string into `en` is what makes it appear at all.
 */
export function image(
  value: unknown,
  locale: Locale,
  ctx: TransformContext,
  where: string,
  extra: PayloadData = {},
): PayloadData {
  const asset = upload(value, ctx, where);
  const alt = isRecord(value) ? text(value.alt, locale) : undefined;
  // Never `null`, even when the source has no image. Payload's
  // `beforeValidate` promise tests `typeof siblingData[name] !== "object"`
  // before substituting `{}` — and `typeof null === "object"`, so a null group
  // is passed straight through and its `upload` child then reads `.asset` off
  // it and throws. Measured the hard way: six authors with no image took down
  // a run. Every group in this file is written as an object for that reason.
  return { asset: asset ?? null, alt: alt ?? null, ...extra };
}

/* -------------------------------------------------------------- rich text */

/**
 * Rewrites the asset references inside a Portable Text array before it is
 * converted.
 *
 * `portableTextToLexical` carries every property of a non-`block` member
 * through verbatim into the lexical block node's `fields`, which is exactly
 * right for `youtube` and the five unauthored embeds — but an `image` member
 * would arrive carrying `_sanityAsset: "image@file://…"`, a string the
 * `image` embed block (payload/blocks/rich-text-embeds.ts) has no field for.
 * That block declares `media` (upload) and `sanityAssetId` (text), so the
 * resolution happens here, before conversion.
 *
 * `alt` inside Portable Text is `{en: …}` on 18 of the 41 image members and a
 * bare string on the rest; the embed block's `alt` is a plain `text`, so it is
 * flattened.
 */
export function resolveRichTextAssets(blocks: unknown[], ctx: TransformContext, where: string): unknown[] {
  return blocks.map((node, i) => {
    if (!isRecord(node)) return node;
    if (node._type === "block") return node;
    if (typeof node._sanityAsset !== "string") return node;
    const { _sanityAsset, alt, ...rest } = node;
    const assetId = assetIdFromSanityAssetRef(_sanityAsset);
    const resolved = assetId ? upload(_sanityAsset, ctx, `${where}[${i}]`) : undefined;
    return {
      ...rest,
      ...(resolved ? { media: resolved, sanityAssetId: assetId } : {}),
      ...(alt !== undefined ? { alt: text(alt, "en") ?? null } : {}),
    };
  });
}

/** Portable Text -> Lexical, with embedded assets resolved first. */
export function richText(
  value: unknown,
  locale: Locale,
  ctx: TransformContext,
  where: string,
): ReturnType<typeof portableTextToLexical> | undefined {
  const picked = localizedValue(value, locale);
  if (!Array.isArray(picked)) return undefined;
  return portableTextToLexical(resolveRichTextAssets(picked, ctx, where));
}

/* ----------------------------------------------------------- row identity */

/**
 * A deterministic id for an array or block row.
 *
 * Payload types these columns `varchar PRIMARY KEY`, so it will take ours.
 * Letting it mint its own would mean a second run replaced every row with a
 * differently-identified copy — content-identical, but not the same database,
 * which is the property this phase is built on. The source document id is part
 * of the key because the primary key spans the whole table (every parent), and
 * because a localized blocks table stores one row per locale: the four
 * language documents of a `page` supply four different prefixes.
 */
export function rowId(sourceId: string, path: string, key: unknown, index: number): string {
  const suffix = typeof key === "string" && key.length > 0 ? key : String(index);
  return `${sourceId}:${path}:${suffix}`;
}

/* --------------------------------------------------------- key accounting */

const SANITY_META = new Set(["_id", "_type", "_rev", "_createdAt", "_updatedAt", "_key", "_system"]);

/**
 * Fails the import on a Sanity field nobody placed.
 *
 * Silent field loss is the one import failure that looks like a rendering bug
 * three weeks later, so an unrecognised key is an error and the only way past
 * it is to add the field to a builder or to name it in `dropped` with a
 * reason.
 */
export function assertHandled(
  doc: Record<string, unknown>,
  where: string,
  handled: readonly string[],
  dropped: readonly string[],
): void {
  const allowed = new Set<string>([...handled, ...dropped]);
  const stray = Object.keys(doc).filter((k) => !SANITY_META.has(k) && !allowed.has(k));
  if (stray.length > 0) {
    throw new ImportTransformError(
      `${where}: no Payload field claims ${stray.map((k) => `"${k}"`).join(", ")}. ` +
        `Add it to the builder, or list it in that builder's \`dropped\` array with a reason.`,
    );
  }
}

/* ------------------------------------------------------------ shared bits */

/**
 * `sectionWidth: "full"` is a legacy value the current option list
 * (`sanity/schemas/blocks/shared/layout-variants.ts`) no longer offers — 4 of
 * the 19 stored values, all on `cta-1`. Both renderers that read the field
 * (`components/blocks/cta/cta-1.tsx`, `components/blocks/section-header.tsx`)
 * test `=== "narrow"` and treat everything else as default, so `"full"` and
 * `"default"` already render identically. Normalising is therefore lossless,
 * and the alternative — passing `"full"` to a Postgres enum that has never
 * heard of it — fails the import.
 */
function sectionWidth(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value === "default" || value === "narrow" ? value : "default";
}

const PADDING_KEYS = ["top", "bottom"] as const;

function padding(value: unknown, where: string): PayloadData | undefined {
  if (!isRecord(value)) return undefined;
  assertHandled(value, `${where}.padding`, PADDING_KEYS, []);
  return { top: value.top === true, bottom: value.bottom === true };
}

const BUTTON_VARIANT_KEYS = ["variant", "size", "stroke"] as const;

function buttonVariant(value: unknown, where: string): PayloadData | undefined {
  if (!isRecord(value)) return undefined;
  assertHandled(value, `${where}.buttonVariant`, BUTTON_VARIANT_KEYS, []);
  return {
    variant: (value.variant as string) ?? null,
    size: (value.size as string) ?? null,
    stroke: (value.stroke as string) ?? null,
  };
}

const LINK_HANDLED = ["title", "href", "target", "buttonVariant"] as const;
/**
 * 4 homepage `split-content` links store a flat `variant` beside `href`
 * instead of inside `buttonVariant`. `components/ui/sanity-button.tsx` reads
 * only `link.buttonVariant`, so that flat value has never reached a rendered
 * button — same fate, and the same reason, as the `links` array and
 * `colorVariant` that Task 3 dropped from this block.
 */
const LINK_DROPPED = ["variant"] as const;

function link(value: unknown, locale: Locale, where: string): PayloadData | undefined {
  if (!isRecord(value)) return undefined;
  assertHandled(value, `${where}.link`, LINK_HANDLED, LINK_DROPPED);
  return {
    title: text(value.title, locale) ?? null,
    href: (value.href as string) ?? null,
    target: value.target === true,
    buttonVariant: buttonVariant(value.buttonVariant, where) ?? {},
  };
}

function links(
  value: unknown,
  locale: Locale,
  sourceId: string,
  path: string,
  where: string,
): PayloadData[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((entry, i) => ({
    id: rowId(sourceId, path, isRecord(entry) ? entry._key : undefined, i),
    ...(link(entry, locale, `${where}[${i}]`) ?? {}),
  }));
}

const BACKGROUND_HANDLED = [
  "type",
  "ccmColor",
  "color",
  "gradient",
  "svgPattern",
  "image",
  "lightText",
  "blobAccent",
] as const;

function background(
  value: unknown,
  locale: Locale,
  ctx: TransformContext,
  where: string,
): PayloadData | undefined {
  if (!isRecord(value)) return undefined;
  assertHandled(value, `${where}.background`, BACKGROUND_HANDLED, []);
  const gradient = isRecord(value.gradient) ? value.gradient : undefined;
  return {
    type: (value.type as string) ?? null,
    ccmColor: (value.ccmColor as string) ?? null,
    color: (value.color as string) ?? null,
    gradient: {
      direction: (gradient?.direction as string) ?? null,
      startColor: (gradient?.startColor as string) ?? null,
      endColor: (gradient?.endColor as string) ?? null,
    },
    // `svgPattern` is a Sanity fileAsset that Task 8 deliberately pointed at
    // `media`, not `files` (payload/blocks/shared.ts records why). 0 of the
    // 188 real backgrounds populate it.
    svgPattern: upload(value.svgPattern, ctx, `${where}.background.svgPattern`) ?? null,
    image: image(value.image, locale, ctx, `${where}.background.image`),
    lightText: value.lightText === true,
    blobAccent: value.blobAccent === true,
  };
}

/* ------------------------------------------------------------------ blocks */

/**
 * Sanity block `_type` -> Payload block slug. The twelve blocks a census
 * found actually authored (payload/blocks/index.ts), plus `grid-case-study`,
 * which lives only inside `regionalCommunityPage`'s grids.
 */
export const BLOCK_SLUGS: Record<string, string> = {
  "hero-1": "hero1",
  "section-header": "sectionHeader",
  "split-row": "splitRow",
  "split-content": "splitContent",
  "split-image": "splitImage",
  "grid-row": "gridRow",
  "grid-card": "gridCard",
  "grid-agenda": "gridAgenda",
  "grid-news": "gridNews",
  "grid-case-study": "gridCaseStudy",
  "cta-1": "cta1",
  "logo-cloud-1": "logoCloud1",
  "carousel-2": "carousel2",
};

interface BlockArgs {
  locale: Locale;
  ctx: TransformContext;
  sourceId: string;
  /** Field path, used for deterministic row ids and error messages. */
  path: string;
}

/**
 * `colorVariant` is stored on 27 page blocks, 4 homepage slots and 4
 * split-contents. No current Sanity schema declares it and no renderer reads
 * it — Task 3 established the trail and dropped it from every ported block.
 */
const DEAD_COLOR_VARIANT = ["colorVariant"] as const;

function heroOrCta(
  slug: "hero1" | "cta1",
  doc: Record<string, unknown>,
  args: BlockArgs,
): PayloadData {
  const { locale, ctx, sourceId, path } = args;
  const handled = ["background", "tagLine", "title", "body", "image", "links", "padding", "imagePosition", "sectionWidth", "stackAlign"];
  assertHandled(doc, path, handled, DEAD_COLOR_VARIANT);
  const common: PayloadData = {
    background: background(doc.background, locale, ctx, path) ?? {},
    tagLine: text(doc.tagLine, locale) ?? null,
    title: text(doc.title, locale) ?? null,
    body: richText(doc.body, locale, ctx, `${path}.body`) ?? null,
    links: links(doc.links, locale, sourceId, `${path}.links`, path) ?? [],
    padding: padding(doc.padding, path) ?? {},
  };
  if (slug === "hero1") {
    return {
      ...common,
      image: image(doc.image, locale, ctx, `${path}.image`),
      imagePosition: (doc.imagePosition as string) ?? null,
    };
  }
  return { ...common, sectionWidth: sectionWidth(doc.sectionWidth) ?? null, stackAlign: (doc.stackAlign as string) ?? null };
}

function gridRowBlock(doc: Record<string, unknown>, args: BlockArgs): PayloadData {
  const { locale, ctx, sourceId, path } = args;
  assertHandled(
    doc,
    path,
    ["padding", "background", "title", "subtitle", "description", "headerImage", "gridColumns", "cardVariant", "mode", "maxItems", "initialDisplayCount", "columns"],
    DEAD_COLOR_VARIANT,
  );
  return {
    padding: padding(doc.padding, path) ?? {},
    background: background(doc.background, locale, ctx, path) ?? {},
    title: text(doc.title, locale) ?? null,
    subtitle: text(doc.subtitle, locale) ?? null,
    description: richText(doc.description, locale, ctx, `${path}.description`) ?? null,
    headerImage: image(doc.headerImage, locale, ctx, `${path}.headerImage`),
    gridColumns: (doc.gridColumns as string) ?? null,
    cardVariant: (doc.cardVariant as string) ?? null,
    mode: (doc.mode as string) ?? null,
    maxItems: (doc.maxItems as number) ?? null,
    initialDisplayCount: (doc.initialDisplayCount as number) ?? null,
    columns: blockArray(doc.columns, { ...args, path: `${path}.columns` }),
  };
}

function splitRowBlock(doc: Record<string, unknown>, args: BlockArgs): PayloadData {
  const { path } = args;
  assertHandled(doc, path, ["padding", "noGap", "splitColumns"], DEAD_COLOR_VARIANT);
  return {
    padding: padding(doc.padding, path) ?? {},
    noGap: doc.noGap === true,
    splitColumns: blockArray(doc.splitColumns, { ...args, path: `${path}.splitColumns` }),
  };
}

/**
 * `split-content` stores three things Payload's block does not declare, all
 * three already invisible in production — `lib/content/pages.ts`'s
 * `split-content` projection selects only sticky/padding/tagLine/title/body/link:
 *
 * - `links` (22 instances): the plural array a `link`-only renderer ignores.
 * - `image` (18): never projected, never rendered; `split-image` is the column
 *   type that carries an image.
 * - `colorVariant` (4): the same dead field Task 3 dropped everywhere else.
 */
const SPLIT_CONTENT_DROPPED = ["links", "image", "colorVariant"] as const;

function splitContentBlock(doc: Record<string, unknown>, args: BlockArgs): PayloadData {
  const { locale, ctx, path } = args;
  assertHandled(doc, path, ["sticky", "padding", "tagLine", "title", "body", "link"], SPLIT_CONTENT_DROPPED);
  return {
    sticky: doc.sticky === true,
    padding: padding(doc.padding, path) ?? {},
    tagLine: text(doc.tagLine, locale) ?? null,
    title: text(doc.title, locale) ?? null,
    body: richText(doc.body, locale, ctx, `${path}.body`) ?? null,
    link: link(doc.link, locale, path) ?? {},
  };
}

function logoCloudBlock(doc: Record<string, unknown>, args: BlockArgs): PayloadData {
  const { locale, ctx, sourceId, path } = args;
  assertHandled(doc, path, ["padding", "title", "description", "layout", "motionSpeed", "images"], DEAD_COLOR_VARIANT);
  const images = Array.isArray(doc.images) ? doc.images : [];
  return {
    padding: padding(doc.padding, path) ?? {},
    title: text(doc.title, locale) ?? null,
    description: text(doc.description, locale) ?? null,
    layout: (doc.layout as string) ?? null,
    motionSpeed: (doc.motionSpeed as string) ?? null,
    images: images.map((entry, i) => {
      const row = isRecord(entry) ? entry : {};
      assertHandled(row, `${path}.images[${i}]`, ["_sanityAsset", "alt", "label", "orgType"], []);
      return {
        id: rowId(sourceId, `${path}.images`, row._key, i),
        asset: upload(row._sanityAsset, ctx, `${path}.images[${i}]`) ?? null,
        alt: text(row.alt, locale) ?? null,
        label: text(row.label, locale) ?? null,
        orgType: (row.orgType as string) ?? null,
      };
    }),
  };
}

function carouselBlock(doc: Record<string, unknown>, args: BlockArgs): PayloadData {
  const { locale, ctx, path } = args;
  assertHandled(doc, path, ["title", "description", "padding", "testimonial", "testimonials"], DEAD_COLOR_VARIANT);
  return {
    title: text(doc.title, locale) ?? null,
    description: text(doc.description, locale) ?? null,
    padding: padding(doc.padding, path) ?? {},
    testimonial: references(doc.testimonial ?? doc.testimonials, ctx, `${path}.testimonial`) ?? [],
  };
}

/** One entry in a `blocks` array — the `_type` decides which builder runs. */
function block(entry: unknown, args: BlockArgs, index: number): PayloadData | undefined {
  if (!isRecord(entry)) return undefined;
  const sanityType = String(entry._type ?? "");
  const slug = BLOCK_SLUGS[sanityType];
  if (!slug) {
    throw new ImportTransformError(
      `${args.path}[${index}]: Sanity block "${sanityType}" has no Payload block. ` +
        `The ported set is ${Object.keys(BLOCK_SLUGS).join(", ")}.`,
    );
  }
  const path = `${args.path}[${index}]`;
  const inner = { ...args, path };
  const id = rowId(args.sourceId, args.path, entry._key, index);
  return { id, blockType: slug, ...blockFields(slug, entry, inner) };
}

export function blockFields(slug: string, doc: Record<string, unknown>, args: BlockArgs): PayloadData {
  const { locale, ctx, path } = args;
  switch (slug) {
    case "hero1":
    case "cta1":
      return heroOrCta(slug, doc, args);
    case "sectionHeader":
      assertHandled(doc, path, ["padding", "sectionWidth", "stackAlign", "tagLine", "title", "description"], DEAD_COLOR_VARIANT);
      return {
        padding: padding(doc.padding, path) ?? {},
        sectionWidth: sectionWidth(doc.sectionWidth) ?? null,
        stackAlign: (doc.stackAlign as string) ?? null,
        tagLine: text(doc.tagLine, locale) ?? null,
        title: text(doc.title, locale) ?? null,
        description: text(doc.description, locale) ?? null,
      };
    case "splitRow":
      return splitRowBlock(doc, args);
    case "splitContent":
      return splitContentBlock(doc, args);
    case "splitImage":
      assertHandled(doc, path, ["image"], []);
      return { image: image(doc.image, locale, ctx, `${path}.image`) };
    case "gridRow":
      return gridRowBlock(doc, args);
    case "gridCard":
      assertHandled(doc, path, ["title", "excerpt", "image", "link"], []);
      return {
        title: text(doc.title, locale) ?? null,
        excerpt: text(doc.excerpt, locale) ?? null,
        image: image(doc.image, locale, ctx, `${path}.image`),
        link: link(doc.link, locale, path) ?? {},
      };
    case "gridAgenda":
      assertHandled(doc, path, ["agenda", "showTags", "showDownloadButtons", "showMetadata"], []);
      return {
        agenda: reference(doc.agenda, ctx, `${path}.agenda`) ?? null,
        showTags: doc.showTags === true,
        showDownloadButtons: doc.showDownloadButtons === true,
        showMetadata: doc.showMetadata === true,
      };
    case "gridNews":
      assertHandled(doc, path, ["newsPost", "showTags", "showAuthor", "showMetadata", "showLocation", "customExcerpt"], []);
      return {
        newsPost: reference(doc.newsPost, ctx, `${path}.newsPost`) ?? null,
        showTags: doc.showTags === true,
        showAuthor: doc.showAuthor === true,
        showMetadata: doc.showMetadata === true,
        showLocation: doc.showLocation === true,
        customExcerpt: text(doc.customExcerpt, locale) ?? null,
      };
    case "gridCaseStudy":
      assertHandled(
        doc,
        path,
        ["caseStudy", "showTags", "showAuthors", "showMetadata", "showStudyPeriod", "showLocation", "customExcerpt", "customLayout", "priority"],
        [],
      );
      return {
        caseStudy: reference(doc.caseStudy, ctx, `${path}.caseStudy`) ?? null,
        showTags: doc.showTags === true,
        showAuthors: doc.showAuthors === true,
        showMetadata: doc.showMetadata === true,
        showStudyPeriod: doc.showStudyPeriod === true,
        showLocation: doc.showLocation === true,
        customExcerpt: text(doc.customExcerpt, locale) ?? null,
        customLayout: (doc.customLayout as string) ?? null,
        priority: (doc.priority as number) ?? null,
      };
    case "logoCloud1":
      return logoCloudBlock(doc, args);
    case "carousel2":
      return carouselBlock(doc, args);
    default:
      throw new ImportTransformError(`${path}: no builder for Payload block "${slug}"`);
  }
}

function blockArray(value: unknown, args: BlockArgs): PayloadData[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, i) => block(entry, args, i))
    .filter((row): row is PayloadData => row !== undefined);
}

/**
 * A **named slot** — Sanity's `homepage.heroWelcome` / `regionalCommunityPage.welcomeHero`,
 * a single block stored in a named field rather than in an array
 * (payload/fields/block-slot.ts).
 *
 * The stored `_type` is deliberately ignored: all 28 `whyJoinCTA` values say
 * `cta-1` while carrying hero-1's field set (`image` on 24, `imagePosition` on
 * 20), and spec §7.1 rules that the declaration, not the stored tag, is right.
 */
export function slot(slug: string, value: unknown, args: BlockArgs): PayloadData {
  // `{}`, not `null` — a block slot is a Payload `group` (payload/fields/block-slot.ts).
  if (!isRecord(value)) return blockFields(slug, {}, args);
  return blockFields(slug, value, args);
}

/* ------------------------------------------------------- schema-shaped fill */

/**
 * Copies a stored object into a declared Payload field list, keeping only what
 * the declaration actually has a home for.
 *
 * Written for `onboardingContent`, whose stored data has drifted badly from
 * its schema. Six fields — `basicInfoFieldHints`, `workInfoFieldHints`,
 * `recentWorkFieldHints`, `privacyFieldHints`, `visibilityOptions` and
 * `welcomeSteps` — are stored as **scalars** where the global declares a
 * `group` or an array, on all four documents, and roughly 35 further stored
 * sub-keys have no declared home at all.
 *
 * Those values are already dead in production: every consumer reads
 * `content?.basicInfoFieldHints?.usernameHint || t("usernameHint")`, and a
 * *string* has no `usernameHint` property, so the expression has always
 * evaluated to `undefined` and always fallen through to the i18n translation.
 * The CMS has never driven those hints.
 *
 * So the rule is neither "import everything" nor "guess a mapping": a stored
 * value is kept only where the declared field at that exact path can hold its
 * type. A scalar against a `group` is dropped; an unknown sub-key is dropped;
 * everything that lines up is imported, which is more than Sanity ever
 * delivered. The dropped paths are returned rather than swallowed.
 */
export function fillDeclaredShape(
  stored: unknown,
  fields: readonly unknown[],
  where: string,
  sourceId: string,
  unplaced: string[],
): PayloadData | undefined {
  if (!isRecord(stored)) return undefined;
  const out: PayloadData = {};
  const claimed = new Set<string>();

  for (const raw of fields) {
    const field = raw as { name?: string; type?: string; fields?: unknown[] };
    if (!field.name) continue;
    claimed.add(field.name);
    const value = stored[field.name];
    if (value === undefined || value === null) continue;
    const path = `${where}.${field.name}`;

    switch (field.type) {
      case "text":
      case "textarea":
      case "email":
      case "select":
        if (typeof value === "string") out[field.name] = value;
        else unplaced.push(`${path} (stored ${typeName(value)}, declared ${field.type})`);
        break;
      case "checkbox":
        if (typeof value === "boolean") out[field.name] = value;
        else unplaced.push(`${path} (stored ${typeName(value)}, declared checkbox)`);
        break;
      case "number":
        if (typeof value === "number") out[field.name] = value;
        else unplaced.push(`${path} (stored ${typeName(value)}, declared number)`);
        break;
      case "group": {
        if (!isRecord(value)) {
          unplaced.push(`${path} (stored ${typeName(value)}, declared group)`);
          break;
        }
        const nested = fillDeclaredShape(value, field.fields ?? [], path, sourceId, unplaced);
        if (nested && Object.keys(nested).length > 0) out[field.name] = nested;
        break;
      }
      case "array": {
        if (!Array.isArray(value)) {
          unplaced.push(`${path} (stored ${typeName(value)}, declared array)`);
          break;
        }
        const rows = value
          .map((row, i) => {
            const built = fillDeclaredShape(row, field.fields ?? [], `${path}[${i}]`, sourceId, unplaced);
            if (!built || Object.keys(built).length === 0) return undefined;
            return { id: rowId(sourceId, path, isRecord(row) ? row._key : undefined, i), ...built };
          })
          .filter((row): row is PayloadData & { id: string } => row !== undefined);
        if (rows.length > 0) out[field.name] = rows;
        break;
      }
      default:
        unplaced.push(`${path} (declared ${field.type ?? "?"}, not filled by the importer)`);
    }
  }

  for (const key of Object.keys(stored)) {
    if (SANITY_META.has(key) || claimed.has(key)) continue;
    unplaced.push(`${where}.${key} (no declared field)`);
  }
  return out;
}

function typeName(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

/* --------------------------------------------------------------- documents */

/**
 * How the four Sanity documents of a Lane-A group reach one Payload document.
 *
 * `single` — one Sanity document holds every language in `{en,es,fr,ar}`
 * field objects (Lane B). `perLocale` — one Sanity document per language
 * (Lane A: `page`, `regionalCommunityPage`, `homepage`, `onboardingContent`).
 */
export type SourceGroup =
  | { kind: "single"; canonical: SanityDoc }
  | { kind: "perLocale"; canonical: SanityDoc; docs: Partial<Record<Locale, SanityDoc>> };

export interface DocumentTarget {
  kind: "collection" | "global";
  /** Payload collection or global slug. */
  slug: string;
  /** Payload id. Empty for globals, which have no id. */
  id: string;
  sanityType: string;
  /** Every Sanity `_id` that fed this target. */
  sources: string[];
  /** locale -> the data to write. `en` is always present. */
  data: Partial<Record<Locale, PayloadData>>;
  /** Fields the import deliberately did not place (onboardingContent only). */
  unplaced: string[];
}

type DocBuilder = (
  doc: SanityDoc,
  canonical: SanityDoc,
  locale: Locale,
  ctx: TransformContext,
  unplaced: string[],
) => PayloadData;

interface TypeSpec {
  kind: "collection" | "global";
  slug: string;
  /** Lane A types collapse four documents into one, grouped by slug. */
  lane: "single" | "perLocale";
  /** Collections with `versions.drafts` need an explicit published status. */
  drafts?: boolean;
  build: DocBuilder;
}

/** Common trailer: Sanity's own timestamps, kept so ordering survives. */
function timestamps(canonical: SanityDoc): PayloadData {
  return {
    ...(typeof canonical._createdAt === "string" ? { createdAt: canonical._createdAt } : {}),
    ...(typeof canonical._updatedAt === "string" ? { updatedAt: canonical._updatedAt } : {}),
  };
}

/* ---- taxonomy ---- */

const buildTag: DocBuilder = (doc, _c, locale) => {
  assertHandled(doc, "tag", ["label", "value", "description", "category", "color", "useAsTheme", "orderRank"], []);
  return {
    label: text(doc.label, locale) ?? null,
    // `value` is Sanity's `slug` object, not a string — the field Task 2 named
    // as the "model on the stored data, not the declaration" case.
    value: slugOf(doc.value) ?? null,
    description: text(doc.description, locale) ?? null,
    category: (doc.category as string) ?? null,
    color: (doc.color as string) ?? null,
    useAsTheme: doc.useAsTheme === true,
    orderRank: (doc.orderRank as string) ?? null,
  };
};

const buildKeyedTaxonomy: DocBuilder = (doc, _c, locale) => {
  assertHandled(doc, "workType/expertiseArea", ["key", "label", "description", "order", "isActive"], []);
  return {
    key: (doc.key as string) ?? null,
    // The only two types that use Sanity's `internationalizedArray`
    // (`[{_key:"en", value}]`) rather than an `{en,…}` object.
    label: text(doc.label, locale) ?? null,
    description: text(doc.description, locale) ?? null,
    order: (doc.order as number) ?? null,
    isActive: doc.isActive === true,
  };
};

/* ---- people and places ---- */

const buildOrganization: DocBuilder = (doc) => {
  assertHandled(doc, "organization", ["name", "slug", "type", "verified"], []);
  return {
    name: (doc.name as string) ?? null,
    slug: slugOf(doc.slug) ?? null,
    type: (doc.type as string) ?? null,
    verified: doc.verified === true,
  };
};

const buildRegionalCommunity: DocBuilder = (doc, _c, locale) => {
  assertHandled(doc, "regionalCommunity", ["name", "slug", "region", "featured", "active", "orderRank"], []);
  return {
    name: text(doc.name, locale) ?? null,
    slug: slugOf(doc.slug) ?? null,
    region: (doc.region as string) ?? null,
    featured: doc.featured === true,
    active: doc.active === true,
    orderRank: (doc.orderRank as string) ?? null,
  };
};

/**
 * `author.bio` holds Portable Text on 2 of 95 documents and `authors` has no
 * rich-text field (Task 4 modelled the collection on the other 93). Recorded
 * here rather than quietly dropped: the two bodies are preserved in the Phase 0
 * archive, and adding an `authors.bio` field later is a schema change with its
 * own migration, not something an importer should invent.
 */
const AUTHOR_DROPPED = ["bio"] as const;

const buildAuthor: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(
    doc,
    "author",
    ["name", "slug", "image", "organizationalAffiliation", "communityMemberships", "orderRank"],
    AUTHOR_DROPPED,
  );
  const memberships = Array.isArray(doc.communityMemberships) ? doc.communityMemberships : [];
  const sourceId = String(doc._id);
  return {
    name: (doc.name as string) ?? null,
    slug: slugOf(doc.slug) ?? null,
    image: image(doc.image, locale, ctx, "author.image"),
    organizationalAffiliation: (doc.organizationalAffiliation as string) ?? null,
    communityMemberships: memberships.map((row, i) => {
      const entry = isRecord(row) ? row : {};
      assertHandled(entry, `author.communityMemberships[${i}]`, ["community", "role"], []);
      return {
        id: rowId(sourceId, "communityMemberships", entry._key, i),
        community: reference(entry.community, ctx, `author.communityMemberships[${i}].community`) ?? null,
        role: (entry.role as string) ?? null,
      };
    }),
    orderRank: (doc.orderRank as string) ?? null,
  };
};

/* ---- content ---- */

/**
 * `_pdfUrls` sits on 4 of 29 agendas, is declared by no schema and read
 * nowhere in the codebase. Its values are Supabase storage URLs left over from
 * the pre-Sanity migration.
 */
const AGENDA_DROPPED = ["_pdfUrls"] as const;

const buildAgenda: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(
    doc,
    "agenda",
    ["title", "slug", "subtitle", "description", "coverImage", "files", "agendaType", "publishDate", "year", "regionalCommunities", "organizations", "tags", "totalDownloadCount", "featured", "accessLevel", "orderRank"],
    AGENDA_DROPPED,
  );
  const sourceId = String(doc._id);
  const files = Array.isArray(doc.files) ? doc.files : [];
  return {
    title: text(doc.title, locale) ?? null,
    slug: slugOf(doc.slug) ?? null,
    subtitle: text(doc.subtitle, locale) ?? null,
    description: text(doc.description, locale) ?? null,
    coverImage: image(doc.coverImage, locale, ctx, "agenda.coverImage"),
    files: files.map((row, i) => {
      const entry = isRecord(row) ? row : {};
      assertHandled(entry, `agenda.files[${i}]`, ["language", "file", "downloadCount", "lastDownloaded"], []);
      return {
        id: rowId(sourceId, "files", entry._key, i),
        language: (entry.language as string) ?? null,
        // Resolves to `files`, not `media` — the id prefix decides, and every
        // one of these is a `file-…` asset.
        file: upload(entry.file, ctx, `agenda.files[${i}].file`) ?? null,
        downloadCount: (entry.downloadCount as number) ?? null,
        lastDownloaded: dateOf(entry.lastDownloaded),
      };
    }),
    agendaType: (doc.agendaType as string) ?? null,
    publishDate: dateOf(doc.publishDate),
    year: (doc.year as number) ?? null,
    regionalCommunities: references(doc.regionalCommunities, ctx, "agenda.regionalCommunities") ?? [],
    organizations: references(doc.organizations, ctx, "agenda.organizations") ?? [],
    tags: references(doc.tags, ctx, "agenda.tags") ?? [],
    totalDownloadCount: (doc.totalDownloadCount as number) ?? null,
    featured: doc.featured === true,
    accessLevel: (doc.accessLevel as string) ?? null,
    orderRank: (doc.orderRank as string) ?? null,
  };
};

const buildCaseStudy: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(
    doc,
    "caseStudy",
    ["title", "slug", "excerpt", "content", "image", "tags", "topic", "layout", "region", "themes", "populations", "submittedBy", "submittedAt", "authors", "studyPeriod", "locationText", "studyLocation", "locationDisplayText", "locationPrecision", "locationCountryCode", "studyAreas", "organizations", "relatedCommunity", "status", "featured", "publishedAt", "reviewNotes", "reviewedBy", "reviewedAt", "notifiedStatus", "seoTitle", "seoDescription", "canonicalUrl"],
    [],
  );
  const sourceId = String(doc._id);
  const authors = Array.isArray(doc.authors) ? doc.authors : [];
  const period = isRecord(doc.studyPeriod) ? doc.studyPeriod : {};
  const locationText = isRecord(doc.locationText) ? doc.locationText : {};
  const areas = Array.isArray(doc.studyAreas) ? doc.studyAreas : [];
  return {
    title: text(doc.title, locale) ?? null,
    slug: slugOf(doc.slug) ?? null,
    excerpt: text(doc.excerpt, locale) ?? null,
    content: richText(doc.content, locale, ctx, "caseStudy.content") ?? null,
    image: image(doc.image, locale, ctx, "caseStudy.image", {
      caption: isRecord(doc.image) ? (text(doc.image.caption, locale) ?? null) : null,
    }) ?? null,
    tags: references(doc.tags, ctx, "caseStudy.tags") ?? [],
    topic: (doc.topic as string) ?? null,
    layout: (doc.layout as string) ?? null,
    region: (doc.region as string) ?? null,
    themes: (doc.themes as string[]) ?? [],
    populations: (doc.populations as string[]) ?? [],
    submittedBy: (doc.submittedBy as string) ?? null,
    submittedAt: dateOf(doc.submittedAt),
    authors: authors.map((row, i) => {
      const entry = isRecord(row) ? row : {};
      assertHandled(entry, `caseStudy.authors[${i}]`, ["userId", "name", "email", "role", "affiliation", "clerkUserId", "clerkUsername", "clerkImageUrl"], []);
      return {
        id: rowId(sourceId, "authors", entry._key, i),
        userId: (entry.userId as string) ?? null,
        name: (entry.name as string) ?? null,
        email: (entry.email as string) ?? null,
        role: (entry.role as string) ?? null,
        affiliation: reference(entry.affiliation, ctx, `caseStudy.authors[${i}].affiliation`) ?? null,
        clerkUserId: (entry.clerkUserId as string) ?? null,
        clerkUsername: (entry.clerkUsername as string) ?? null,
        clerkImageUrl: (entry.clerkImageUrl as string) ?? null,
      };
    }),
    // Empty string is not a date: one published case study and the single
    // draft both store `startDate: ""`.
    studyPeriod: groupValue({ startDate: dateOf(period.startDate), endDate: dateOf(period.endDate) }),
    locationText: groupValue({
      country: (locationText.country as string) ?? null,
      city: (locationText.city as string) ?? null,
    }),
    studyLocation: pointOf(doc.studyLocation),
    locationDisplayText: (doc.locationDisplayText as string) ?? null,
    locationPrecision: (doc.locationPrecision as string) ?? null,
    locationCountryCode: (doc.locationCountryCode as string) ?? null,
    studyAreas: areas.map((row, i) => {
      const entry = isRecord(row) ? row : {};
      assertHandled(entry, `caseStudy.studyAreas[${i}]`, ["location", "name", "description"], []);
      return {
        id: rowId(sourceId, "studyAreas", entry._key, i),
        location: pointOf(entry.location),
        name: (entry.name as string) ?? null,
        description: (entry.description as string) ?? null,
      };
    }),
    organizations: references(doc.organizations, ctx, "caseStudy.organizations") ?? [],
    relatedCommunity: reference(doc.relatedCommunity, ctx, "caseStudy.relatedCommunity") ?? null,
    // Sanity's `status` could not keep its name: Payload's drafts feature owns
    // `_status`. `lib/content/case-studies.ts` still exposes `status` publicly,
    // so Phase 3's reader maps back the other way.
    moderationStatus: (doc.status as string) ?? null,
    featured: doc.featured === true,
    publishedAt: dateOf(doc.publishedAt),
    reviewNotes: (doc.reviewNotes as string) ?? null,
    reviewedBy: reference(doc.reviewedBy, ctx, "caseStudy.reviewedBy") ?? null,
    reviewedAt: dateOf(doc.reviewedAt),
    notifiedStatus: (doc.notifiedStatus as string) ?? null,
    seoTitle: (doc.seoTitle as string) ?? null,
    seoDescription: (doc.seoDescription as string) ?? null,
    canonicalUrl: (doc.canonicalUrl as string) ?? null,
  };
};

/**
 * `language` (document-level) was dropped by Task 5, not by this importer:
 * Payload's own `localized: true` supersedes it, and the two documents that
 * carry real Lane-B content set no `language` at all.
 */
const LANE_LANGUAGE_DROPPED = ["language"] as const;

const buildLivedExperience: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(
    doc,
    "livedExperience",
    ["format", "title", "slug", "description", "issue", "personContext", "body", "videoSource", "videoLink", "videoUrl", "videoFile", "thumbnail", "duration", "publishedAt", "author", "relatedCommunity", "region", "layout", "themes", "populations", "location", "place", "organizations", "tags", "featured", "status", "submittedBy", "reviewNotes", "meta_title", "meta_description", "noindex", "ogImage"],
    LANE_LANGUAGE_DROPPED,
  );
  const place = isRecord(doc.place) ? doc.place : {};
  return {
    format: (doc.format as string) ?? null,
    title: text(doc.title, locale) ?? null,
    slug: slugOf(doc.slug) ?? null,
    description: text(doc.description, locale) ?? null,
    issue: text(doc.issue, locale) ?? null,
    personContext: text(doc.personContext, locale) ?? null,
    body: richText(doc.body, locale, ctx, "livedExperience.body") ?? null,
    videoSource: (doc.videoSource as string) ?? null,
    videoLink: (doc.videoLink as string) ?? null,
    // Undeclared in the Sanity schema, populated on 56 of 56 documents and
    // projected by five `lib/content/*` modules. Dropping it breaks all five.
    videoUrl: (doc.videoUrl as string) ?? null,
    videoFile: upload(doc.videoFile, ctx, "livedExperience.videoFile") ?? null,
    thumbnail: image(doc.thumbnail, locale, ctx, "livedExperience.thumbnail"),
    duration: (doc.duration as string) ?? null,
    publishedAt: dateOf(doc.publishedAt),
    author: reference(doc.author, ctx, "livedExperience.author") ?? null,
    relatedCommunity: reference(doc.relatedCommunity, ctx, "livedExperience.relatedCommunity") ?? null,
    // A `regionalCommunity` reference on 42 of the 42 populated documents,
    // never the fixed-7 code the Sanity schema declares.
    region: reference(doc.region, ctx, "livedExperience.region") ?? null,
    layout: (doc.layout as string) ?? null,
    themes: (doc.themes as string[]) ?? [],
    populations: (doc.populations as string[]) ?? [],
    location: pointOf(doc.location),
    place: groupValue({
      point: pointOf(place.point),
      text: (place.text as string) ?? null,
      precision: (place.precision as string) ?? null,
      countryCode: (place.countryCode as string) ?? null,
    }),
    organizations: references(doc.organizations, ctx, "livedExperience.organizations") ?? [],
    tags: references(doc.tags, ctx, "livedExperience.tags") ?? [],
    featured: doc.featured === true,
    moderationStatus: (doc.status as string) ?? null,
    submittedBy: (doc.submittedBy as string) ?? null,
    reviewNotes: (doc.reviewNotes as string) ?? null,
    meta_title: (doc.meta_title as string) ?? null,
    meta_description: (doc.meta_description as string) ?? null,
    noindex: doc.noindex === true,
    ogImage: image(doc.ogImage, locale, ctx, "livedExperience.ogImage"),
  };
};

const buildResearchOutput: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(
    doc,
    "researchOutput",
    ["title", "slug", "excerpt", "outputType", "layout", "coverImage", "body", "versions", "region", "themes", "populations", "relatedCommunities", "organizations", "tags", "status", "submittedBy", "reviewNotes", "place", "publishDate", "year", "featured", "totalDownloadCount", "migratedFromReport", "orderRank"],
    [],
  );
  const sourceId = String(doc._id);
  const versions = Array.isArray(doc.versions) ? doc.versions : [];
  const place = isRecord(doc.place) ? doc.place : {};
  return {
    title: text(doc.title, locale) ?? null,
    slug: slugOf(doc.slug) ?? null,
    excerpt: text(doc.excerpt, locale) ?? null,
    outputType: (doc.outputType as string) ?? null,
    layout: (doc.layout as string) ?? null,
    coverImage: image(doc.coverImage, locale, ctx, "researchOutput.coverImage"),
    body: richText(doc.body, locale, ctx, "researchOutput.body") ?? null,
    versions: versions.map((row, i) => {
      const entry = isRecord(row) ? row : {};
      assertHandled(entry, `researchOutput.versions[${i}]`, ["kind", "lang", "label", "file", "body", "pages", "downloadCount", "lastDownloaded"], []);
      return {
        id: rowId(sourceId, "versions", entry._key, i),
        kind: (entry.kind as string) ?? null,
        lang: (entry.lang as string) ?? null,
        label: (entry.label as string) ?? null,
        file: upload(entry.file, ctx, `researchOutput.versions[${i}].file`) ?? null,
        body: richText(entry.body, locale, ctx, `researchOutput.versions[${i}].body`) ?? null,
        pages: (entry.pages as number) ?? null,
        downloadCount: (entry.downloadCount as number) ?? null,
        lastDownloaded: dateOf(entry.lastDownloaded),
      };
    }),
    region: (doc.region as string) ?? null,
    themes: (doc.themes as string[]) ?? [],
    populations: (doc.populations as string[]) ?? [],
    relatedCommunities: references(doc.relatedCommunities, ctx, "researchOutput.relatedCommunities") ?? [],
    organizations: references(doc.organizations, ctx, "researchOutput.organizations") ?? [],
    tags: references(doc.tags, ctx, "researchOutput.tags") ?? [],
    moderationStatus: (doc.status as string) ?? null,
    submittedBy: (doc.submittedBy as string) ?? null,
    reviewNotes: (doc.reviewNotes as string) ?? null,
    place: groupValue({
      point: pointOf(place.point),
      text: (place.text as string) ?? null,
      precision: (place.precision as string) ?? null,
      countryCode: (place.countryCode as string) ?? null,
    }),
    publishDate: dateOf(doc.publishDate),
    year: (doc.year as number) ?? null,
    featured: doc.featured === true,
    totalDownloadCount: (doc.totalDownloadCount as number) ?? null,
    migratedFromReport: (doc.migratedFromReport as string) ?? null,
    orderRank: (doc.orderRank as string) ?? null,
  };
};

const buildNewsPost: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(
    doc,
    "newsPost",
    ["title", "subtitle", "slug", "excerpt", "content", "author", "publishedAt", "image", "organizations", "relatedCommunity", "region", "themes", "populations", "location", "place", "locationDetails", "tags", "sources", "featured", "meta_title", "meta_description", "noindex", "ogImage"],
    LANE_LANGUAGE_DROPPED,
  );
  const sourceId = String(doc._id);
  const sources = Array.isArray(doc.sources) ? doc.sources : [];
  const place = isRecord(doc.place) ? doc.place : {};
  const details = isRecord(doc.locationDetails) ? doc.locationDetails : {};
  return {
    title: text(doc.title, locale) ?? null,
    subtitle: text(doc.subtitle, locale) ?? null,
    slug: slugOf(doc.slug) ?? null,
    excerpt: text(doc.excerpt, locale) ?? null,
    content: richText(doc.content, locale, ctx, "newsPost.content") ?? null,
    author: reference(doc.author, ctx, "newsPost.author") ?? null,
    publishedAt: dateOf(doc.publishedAt),
    image: image(doc.image, locale, ctx, "newsPost.image"),
    organizations: references(doc.organizations, ctx, "newsPost.organizations") ?? [],
    relatedCommunity: reference(doc.relatedCommunity, ctx, "newsPost.relatedCommunity") ?? null,
    region: (doc.region as string) ?? null,
    themes: (doc.themes as string[]) ?? [],
    populations: (doc.populations as string[]) ?? [],
    location: pointOf(doc.location),
    place: groupValue({
      point: pointOf(place.point),
      text: (place.text as string) ?? null,
      precision: (place.precision as string) ?? null,
      countryCode: (place.countryCode as string) ?? null,
    }),
    locationDetails: groupValue({
      city: (details.city as string) ?? null,
      country: (details.country as string) ?? null,
      region: (details.region as string) ?? null,
    }),
    tags: references(doc.tags, ctx, "newsPost.tags") ?? [],
    sources: sources.map((row, i) => {
      const entry = isRecord(row) ? row : {};
      assertHandled(entry, `newsPost.sources[${i}]`, ["title", "url", "publisher", "date"], []);
      return {
        id: rowId(sourceId, "sources", entry._key, i),
        title: (entry.title as string) ?? null,
        url: (entry.url as string) ?? null,
        publisher: (entry.publisher as string) ?? null,
        date: dateOf(entry.date),
      };
    }),
    featured: doc.featured === true,
    meta_title: (doc.meta_title as string) ?? null,
    meta_description: (doc.meta_description as string) ?? null,
    noindex: doc.noindex === true,
    ogImage: image(doc.ogImage, locale, ctx, "newsPost.ogImage"),
  };
};

const buildDocsChapter: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(doc, "docsChapter", ["collection", "title", "slug", "order", "body"], []);
  return {
    collection: (doc.collection as string) ?? null,
    title: (doc.title as string) ?? null,
    slug: slugOf(doc.slug) ?? null,
    order: (doc.order as number) ?? null,
    body: richText(doc.body, locale, ctx, "docsChapter.body") ?? null,
  };
};

const buildTestimonial: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(doc, "testimonial", ["name", "jobTitle", "title", "image", "quote", "body", "rating", "relatedCommunity", "organization", "featured", "orderRank"], []);
  return {
    name: (doc.name as string) ?? null,
    jobTitle: text(doc.jobTitle, locale) ?? null,
    title: (doc.title as string) ?? null,
    image: image(doc.image, locale, ctx, "testimonial.image"),
    // The only localized rich-text field in the dataset: `{en: [...blocks]}`.
    quote: richText(doc.quote, locale, ctx, "testimonial.quote") ?? null,
    body: richText(doc.body, locale, ctx, "testimonial.body") ?? null,
    rating: (doc.rating as number) ?? null,
    relatedCommunity: reference(doc.relatedCommunity, ctx, "testimonial.relatedCommunity") ?? null,
    organization: reference(doc.organization, ctx, "testimonial.organization") ?? null,
    featured: doc.featured === true,
    orderRank: (doc.orderRank as string) ?? null,
  };
};

const buildProfilePrompt: DocBuilder = (doc, _c, locale) => {
  assertHandled(doc, "profilePrompt", ["prompt", "category", "active", "orderRank"], []);
  return {
    prompt: text(doc.prompt, locale) ?? null,
    category: (doc.category as string) ?? null,
    active: doc.active === true,
    orderRank: (doc.orderRank as string) ?? null,
  };
};

const buildExternalSource: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(doc, "externalSource", ["title", "sourceUrl", "publisher", "publishedAt", "excerpt", "image", "tags", "organizations", "relatedCommunity", "authors", "language", "sourceType", "featured", "approved", "addedBy", "addedAt"], []);
  const sourceId = String(doc._id);
  const authors = Array.isArray(doc.authors) ? doc.authors : [];
  return {
    title: text(doc.title, locale) ?? null,
    sourceUrl: (doc.sourceUrl as string) ?? null,
    publisher: (doc.publisher as string) ?? null,
    publishedAt: dateOf(doc.publishedAt),
    excerpt: text(doc.excerpt, locale) ?? null,
    image: image(doc.image, locale, ctx, "externalSource.image"),
    tags: references(doc.tags, ctx, "externalSource.tags") ?? [],
    organizations: references(doc.organizations, ctx, "externalSource.organizations") ?? [],
    relatedCommunity: reference(doc.relatedCommunity, ctx, "externalSource.relatedCommunity") ?? null,
    // Stored as bare strings; Payload models them as `{name}` rows.
    authors: authors.map((name, i) => ({
      id: rowId(sourceId, "authors", undefined, i),
      name: typeof name === "string" ? name : null,
    })),
    // Unlike livedExperience/newsPost, `externalSource.language` IS a declared
    // field with a Payload home — it says what language the source is in.
    language: (doc.language as string) ?? null,
    sourceType: (doc.sourceType as string) ?? null,
    featured: doc.featured === true,
    approved: doc.approved === true,
    addedBy: reference(doc.addedBy, ctx, "externalSource.addedBy") ?? null,
    addedAt: dateOf(doc.addedAt),
  };
};

/**
 * `caseStudyDraft.layout` ("story") has no Payload field: `caseStudyDrafts` is
 * the in-progress submission form's autosave, and `layout` is a presentation
 * choice the published `caseStudies` collection owns.
 */
const CASE_STUDY_DRAFT_DROPPED = ["layout"] as const;

const buildCaseStudyDraft: DocBuilder = (doc, _c, locale, ctx) => {
  assertHandled(
    doc,
    "caseStudyDraft",
    ["userId", "lastSaved", "title", "excerpt", "topic", "contentLanguage", "content", "image", "tags", "selectedTags", "authors", "studyPeriod", "locationText", "studyLocation", "studyAreas", "organizations", "relatedCommunity", "formMetadata", "organizationName"],
    CASE_STUDY_DRAFT_DROPPED,
  );
  const sourceId = String(doc._id);
  const period = isRecord(doc.studyPeriod) ? doc.studyPeriod : {};
  const locationText = isRecord(doc.locationText) ? doc.locationText : {};
  const authors = Array.isArray(doc.authors) ? doc.authors : [];
  const areas = Array.isArray(doc.studyAreas) ? doc.studyAreas : [];
  const meta = isRecord(doc.formMetadata) ? doc.formMetadata : {};
  const stringRows = (value: unknown, field: string) =>
    (Array.isArray(value) ? value : []).map((v, i) => ({
      id: rowId(sourceId, field, undefined, i),
      value: typeof v === "string" ? v : null,
    }));
  return {
    userId: (doc.userId as string) ?? null,
    lastSaved: dateOf(doc.lastSaved),
    title: text(doc.title, locale) ?? null,
    excerpt: text(doc.excerpt, locale) ?? null,
    topic: (doc.topic as string) ?? null,
    contentLanguage: (doc.contentLanguage as string) ?? null,
    content: richText(doc.content, locale, ctx, "caseStudyDraft.content") ?? null,
    image: image(doc.image, locale, ctx, "caseStudyDraft.image", {
      caption: isRecord(doc.image) ? (text(doc.image.caption, locale) ?? null) : null,
    }) ?? null,
    tags: stringRows(doc.tags, "tags"),
    selectedTags: stringRows(doc.selectedTags, "selectedTags"),
    authors: authors.map((row, i) => {
      const entry = isRecord(row) ? row : {};
      assertHandled(entry, `caseStudyDraft.authors[${i}]`, ["userId", "name", "email", "role", "affiliation"], []);
      return {
        id: rowId(sourceId, "authors", entry._key, i),
        userId: (entry.userId as string) ?? null,
        name: (entry.name as string) ?? null,
        email: (entry.email as string) ?? null,
        role: (entry.role as string) ?? null,
        affiliation: reference(entry.affiliation, ctx, `caseStudyDraft.authors[${i}].affiliation`) ?? null,
      };
    }),
    // `{startDate: "", endDate: ""}` and `{}` — the two shapes that make empty
    // strings a date column's problem.
    studyPeriod: groupValue({ startDate: dateOf(period.startDate), endDate: dateOf(period.endDate) }),
    locationText: groupValue({
      country: (locationText.country as string) ?? null,
      city: (locationText.city as string) ?? null,
    }),
    studyLocation: pointOf(doc.studyLocation),
    studyAreas: areas.map((row, i) => {
      const entry = isRecord(row) ? row : {};
      assertHandled(entry, `caseStudyDraft.studyAreas[${i}]`, ["location", "name", "description"], []);
      return {
        id: rowId(sourceId, "studyAreas", entry._key, i),
        location: pointOf(entry.location),
        name: (entry.name as string) ?? null,
        description: (entry.description as string) ?? null,
      };
    }),
    organizations: references(doc.organizations, ctx, "caseStudyDraft.organizations") ?? [],
    // Deliberately `text`, not a relationship: the draft stores whatever the
    // half-finished form held.
    relatedCommunity: (doc.relatedCommunity as string) ?? null,
    formMetadata: groupValue({
      currentStep: (meta.currentStep as string) ?? null,
      completedSections: stringRows(meta.completedSections, "formMetadata.completedSections"),
      organizationName: (meta.organizationName as string) ?? null,
    }),
    organizationName: (doc.organizationName as string) ?? null,
  };
};

/* ---- pages, regional pages, globals ---- */

const buildPage: DocBuilder = (doc, canonical, locale, ctx) => {
  assertHandled(doc, "page", ["title", "slug", "blocks", "meta_title", "meta_description", "noindex", "ogImage", "orderRank"], LANE_LANGUAGE_DROPPED);
  const sourceId = String(doc._id);
  return {
    // Localized: each language document carries its own plain-string title.
    title: text(doc.title, locale) ?? null,
    // NOT localized — the grouping key, identical across all four documents.
    slug: slugOf(canonical.slug) ?? null,
    blocks: blockArray(doc.blocks, { locale, ctx, sourceId, path: "blocks" }),
    meta_title: text(doc.meta_title, locale) ?? null,
    meta_description: text(doc.meta_description, locale) ?? null,
    noindex: canonical.noindex === true,
    ogImage: image(canonical.ogImage, "en", ctx, "page.ogImage"),
    orderRank: (canonical.orderRank as string) ?? null,
  };
};

/**
 * The six grid slots, in the order
 * `components/templates/regional-community-template.tsx` renders them, then
 * testimonials — which the template does not render at all today, so it has no
 * position to preserve and goes last.
 */
const CONTENT_GRID_SLOTS: { field: string; contentType: string }[] = [
  { field: "agendasGrid", contentType: "agendas" },
  { field: "caseStudiesGrid", contentType: "caseStudies" },
  { field: "newsGrid", contentType: "news" },
  { field: "livedExperiencesCarousel", contentType: "livedExperiences" },
  { field: "teamGrid", contentType: "team" },
  { field: "testimonialsBlock", contentType: "testimonials" },
];

/**
 * `showSection` is `true` on all 17 documents that have a `testimonialsBlock`,
 * so it encodes nothing that the block's presence in the array does not
 * already say — the same reasoning that dropped `useTemplate`.
 */
const CONTENT_GRID_DROPPED = ["showSection", "contentFlow"] as const;

function contentGridSection(
  field: string,
  contentType: string,
  value: unknown,
  args: BlockArgs,
): PayloadData | undefined {
  if (!isRecord(value)) return undefined;
  const path = `${field}`;
  assertHandled(
    value,
    path,
    ["mode", "gridColumns", "maxItems", "initialDisplayCount", "showTitle", "title", "subtitle", "showDescription", "description", "headerImage", "manualItems", "manualMembers", "testimonials", "displayRole", "displayAffiliation"],
    CONTENT_GRID_DROPPED,
  );
  const { locale, ctx, sourceId } = args;
  return {
    id: rowId(sourceId, "sections", field, 0),
    blockType: "contentGrid",
    contentType,
    mode: (value.mode as string) ?? null,
    gridColumns: (value.gridColumns as string) ?? null,
    maxItems: (value.maxItems as number) ?? null,
    initialDisplayCount: (value.initialDisplayCount as number) ?? null,
    showTitle: value.showTitle === true,
    title: text(value.title, locale) ?? null,
    subtitle: text(value.subtitle, locale) ?? null,
    showDescription: value.showDescription === true,
    description: richText(value.description, locale, ctx, `${path}.description`) ?? null,
    headerImage: image(value.headerImage, locale, ctx, `${path}.headerImage`),
    manualItems: blockArray(value.manualItems, { ...args, path: `${path}.manualItems` }),
    manualMembers: references(value.manualMembers, ctx, `${path}.manualMembers`) ?? [],
    manualTestimonials: references(value.testimonials, ctx, `${path}.testimonials`) ?? [],
    displayRole: value.displayRole === true,
    displayAffiliation: value.displayAffiliation === true,
  };
}

/** `useTemplate` is `true` on all 28 documents, so its false branch is dead. */
const REGIONAL_PAGE_DROPPED = ["useTemplate", "contentFlow", ...LANE_LANGUAGE_DROPPED] as const;

const buildRegionalCommunityPage: DocBuilder = (doc, canonical, locale, ctx) => {
  assertHandled(
    doc,
    "regionalCommunityPage",
    ["title", "slug", "regionalCommunity", "welcomeHero", "whyJoinCTA", "atlasEmbed", "logoCloud", "meta_title", "meta_description", "noindex", "ogImage", "orderRank", ...CONTENT_GRID_SLOTS.map((s) => s.field)],
    REGIONAL_PAGE_DROPPED,
  );
  const sourceId = String(doc._id);
  const args: BlockArgs = { locale, ctx, sourceId, path: "" };
  const atlas = isRecord(doc.atlasEmbed) ? doc.atlasEmbed : undefined;
  return {
    title: text(doc.title, locale) ?? null,
    slug: slugOf(canonical.slug) ?? null,
    regionalCommunity: reference(canonical.regionalCommunity, ctx, "regionalCommunityPage.regionalCommunity") ?? null,
    welcomeHero: slot("hero1", doc.welcomeHero, { ...args, path: "welcomeHero" }),
    // Every document stores `_type: "cta-1"` here and every one of them is
    // wrong — the stored field set is hero-1's. Spec §7.1: the declaration
    // wins, the stored tag is ignored.
    whyJoinCTA: slot("hero1", doc.whyJoinCTA, { ...args, path: "whyJoinCTA" }),
    sections: CONTENT_GRID_SLOTS.map(({ field, contentType }) =>
      contentGridSection(field, contentType, doc[field], { ...args, path: field }),
    ).filter((s): s is PayloadData => s !== undefined),
    atlasEmbed: { enabled: atlas?.enabled === true, showBreakdown: atlas?.showBreakdown !== false },
    logoCloud: slot("logoCloud1", doc.logoCloud, { ...args, path: "logoCloud" }),
    meta_title: text(doc.meta_title, locale) ?? null,
    meta_description: text(doc.meta_description, locale) ?? null,
    noindex: canonical.noindex === true,
    ogImage: image(canonical.ogImage, "en", ctx, "regionalCommunityPage.ogImage"),
    orderRank: (canonical.orderRank as string) ?? null,
  };
};

/**
 * The eleven homepage slots stay slots (payload/globals/homepage.ts records
 * why: turning them into a block array would force a front-end rewrite this
 * phase does not do). Each slot is typed on the block it holds.
 */
const HOMEPAGE_SLOTS: { field: string; block: string }[] = [
  { field: "heroWelcome", block: "hero1" },
  { field: "globalAgenda", block: "splitRow" },
  { field: "howToUse", block: "splitRow" },
  { field: "agendasModule", block: "gridRow" },
  { field: "livedExperiences", block: "carousel2" },
  { field: "regionalCommunities", block: "gridRow" },
  { field: "collaboration", block: "splitRow" },
  { field: "news", block: "gridRow" },
  { field: "projectInfo", block: "splitRow" },
  { field: "mentalHealthDefinition", block: "cta1" },
  { field: "partnerLogos", block: "logoCloud1" },
];

/**
 * `slug` is `{current: "index"}` on all four homepage documents. A global has
 * no route of its own and no slug field; the value said "this is the index
 * page", which being the homepage global already says.
 *
 * `blocks` — Sanity's homepage also declares a freeform block array beside the
 * eleven slots — is null on all four documents (Task 6 checked).
 */
const HOMEPAGE_DROPPED = ["slug", "blocks", ...LANE_LANGUAGE_DROPPED] as const;

const buildHomepage: DocBuilder = (doc, canonical, locale, ctx) => {
  assertHandled(
    doc,
    "homepage",
    ["title", "meta_title", "meta_description", "noindex", "ogImage", ...HOMEPAGE_SLOTS.map((s) => s.field)],
    HOMEPAGE_DROPPED,
  );
  const sourceId = String(doc._id);
  const out: PayloadData = {
    title: text(doc.title, locale) ?? null,
    meta_title: text(doc.meta_title, locale) ?? null,
    meta_description: text(doc.meta_description, locale) ?? null,
    noindex: canonical.noindex === true,
    ogImage: image(canonical.ogImage, "en", ctx, "homepage.ogImage"),
  };
  for (const { field, block: blockSlug } of HOMEPAGE_SLOTS) {
    out[field] = slot(blockSlug, doc[field], { locale, ctx, sourceId, path: field });
  }
  return out;
};

const buildSiteAnnouncement: DocBuilder = (doc, _c, locale) => {
  assertHandled(doc, "siteAnnouncement", ["enabled", "message", "variant", "link", "dismissible", "startsAt", "endsAt"], []);
  const announcementLink = isRecord(doc.link) ? doc.link : {};
  return {
    enabled: doc.enabled === true,
    message: text(doc.message, locale) ?? null,
    variant: (doc.variant as string) ?? null,
    link: groupValue({
      url: (announcementLink.url as string) ?? null,
      label: text(announcementLink.label, locale) ?? null,
    }),
    dismissible: doc.dismissible === true,
    startsAt: dateOf(doc.startsAt),
    endsAt: dateOf(doc.endsAt),
  };
};

/**
 * `onboardingContent` is imported through `fillDeclaredShape` rather than a
 * hand-written field list, because its stored data and its schema disagree in
 * ~41 places (see that function). `slug` is on 1 of the 4 documents
 * (`onboarding-content-english`), and the global has no slug.
 */
const ONBOARDING_DROPPED = ["slug", ...LANE_LANGUAGE_DROPPED] as const;

function buildOnboardingContent(
  doc: SanityDoc,
  locale: Locale,
  fields: readonly unknown[],
  unplaced: string[],
): PayloadData {
  const sourceId = String(doc._id);
  const source: SanityDoc = { ...doc };
  for (const key of ONBOARDING_DROPPED) delete source[key];
  void locale;
  return fillDeclaredShape(source, fields, "onboardingContent", sourceId, unplaced) ?? {};
}

/* ------------------------------------------------------------------ driver */

const TYPE_SPECS: Record<string, TypeSpec> = {
  tag: { kind: "collection", slug: "tags", lane: "single", drafts: true, build: buildTag },
  workType: { kind: "collection", slug: "workTypes", lane: "single", build: buildKeyedTaxonomy },
  expertiseArea: { kind: "collection", slug: "expertiseAreas", lane: "single", build: buildKeyedTaxonomy },
  organization: { kind: "collection", slug: "organizations", lane: "single", build: buildOrganization },
  regionalCommunity: { kind: "collection", slug: "regionalCommunities", lane: "single", build: buildRegionalCommunity },
  docsChapter: { kind: "collection", slug: "docsChapters", lane: "single", build: buildDocsChapter },
  profilePrompt: { kind: "collection", slug: "profilePrompts", lane: "single", build: buildProfilePrompt },
  author: { kind: "collection", slug: "authors", lane: "single", drafts: true, build: buildAuthor },
  agenda: { kind: "collection", slug: "agendas", lane: "single", build: buildAgenda },
  caseStudy: { kind: "collection", slug: "caseStudies", lane: "single", drafts: true, build: buildCaseStudy },
  livedExperience: { kind: "collection", slug: "livedExperiences", lane: "single", drafts: true, build: buildLivedExperience },
  researchOutput: { kind: "collection", slug: "researchOutputs", lane: "single", build: buildResearchOutput },
  newsPost: { kind: "collection", slug: "newsPosts", lane: "single", drafts: true, build: buildNewsPost },
  testimonial: { kind: "collection", slug: "testimonials", lane: "single", drafts: true, build: buildTestimonial },
  externalSource: { kind: "collection", slug: "externalSources", lane: "single", build: buildExternalSource },
  caseStudyDraft: { kind: "collection", slug: "caseStudyDrafts", lane: "single", build: buildCaseStudyDraft },
  page: { kind: "collection", slug: "pages", lane: "perLocale", build: buildPage },
  regionalCommunityPage: { kind: "collection", slug: "regionalCommunityPages", lane: "perLocale", drafts: true, build: buildRegionalCommunityPage },
  siteAnnouncement: { kind: "global", slug: "siteAnnouncement", lane: "single", build: buildSiteAnnouncement },
  onboardingContent: {
    kind: "global",
    slug: "onboardingContent",
    lane: "perLocale",
    build: (doc, _canonical, locale, _ctx, unplaced) =>
      buildOnboardingContent(doc, locale, OnboardingContent.fields, unplaced),
  },
  homepage: { kind: "global", slug: "homepage", lane: "perLocale", build: buildHomepage },
};

/**
 * Dependency order. Every reference in the dataset was traced (21 distinct
 * reference paths, 0 dangling) and this order satisfies all of them:
 * taxonomy and places first, then authors (which reference communities),
 * then content, then the two page collections that reference content, then
 * the globals. `reference()` turns a violation of this order into an error
 * instead of a null.
 */
export const IMPORT_ORDER: readonly string[] = [
  "tag",
  "workType",
  "expertiseArea",
  "organization",
  "regionalCommunity",
  "docsChapter",
  "profilePrompt",
  "author",
  "agenda",
  "caseStudy",
  "livedExperience",
  "researchOutput",
  "newsPost",
  "testimonial",
  "externalSource",
  "caseStudyDraft",
  "page",
  "regionalCommunityPage",
  "siteAnnouncement",
  "onboardingContent",
  "homepage",
];

/**
 * Sanity types that exist in the archive and are not content.
 * `translation.metadata` is Sanity's own cross-language link table — 8
 * documents that link 2 of 4 languages for 1 of the 9 page groups, which is
 * exactly why this import groups by slug instead.
 */
const NON_CONTENT_TYPES = new Set(["translation.metadata", "sanity.previewUrlSecret"]);

export interface GroupedSources {
  /** Sanity type -> the groups to import, in a stable order. */
  groups: Map<string, SourceGroup[]>;
  /** `_id`s deliberately not imported here (drafts belong to Task 13). */
  skipped: string[];
}

/**
 * Groups the archive's published documents into one entry per Payload
 * document.
 *
 * The four Lane-A types are grouped **by slug, never by
 * `translation.metadata`**. Measured: only 1 of the 9 page groups has that
 * metadata and it links 2 of the 4 languages, while all 9 page slugs and all 7
 * region slugs have a complete `ar/en/es/fr` set. The two singleton globals
 * (`homepage`, `onboardingContent`) group on the type itself.
 */
export function groupSources(docs: SanityDoc[]): GroupedSources {
  const groups = new Map<string, SourceGroup[]>();
  const skipped: string[] = [];
  const perLocale = new Map<string, Map<string, Partial<Record<Locale, SanityDoc>>>>();

  for (const doc of docs) {
    const id = String(doc._id ?? "");
    const type = String(doc._type ?? "");
    if (id.startsWith("drafts.") || NON_CONTENT_TYPES.has(type)) {
      skipped.push(id);
      continue;
    }
    const spec = TYPE_SPECS[type];
    if (!spec) {
      throw new ImportTransformError(
        `${id}: Sanity type "${type}" has no Payload target. Add it to TYPE_SPECS or to NON_CONTENT_TYPES.`,
      );
    }
    if (spec.lane === "single") {
      const list = groups.get(type) ?? [];
      list.push({ kind: "single", canonical: doc });
      groups.set(type, list);
      continue;
    }
    // Lane A: the group key is the slug, or the type itself for a global.
    const key = spec.kind === "global" ? type : (slugOf(doc.slug) ?? "");
    if (!key) throw new ImportTransformError(`${id}: a ${type} with no slug cannot be grouped by slug.`);
    const language = doc.language;
    if (typeof language !== "string" || !(LOCALES as readonly string[]).includes(language)) {
      throw new ImportTransformError(`${id}: language "${String(language)}" is not one of ${LOCALES.join(", ")}.`);
    }
    const byKey = perLocale.get(type) ?? new Map();
    const bucket = byKey.get(key) ?? {};
    if (bucket[language as Locale]) {
      throw new ImportTransformError(`Two ${type} documents claim slug "${key}" in ${language}.`);
    }
    bucket[language as Locale] = doc;
    byKey.set(key, bucket);
    perLocale.set(type, byKey);
  }

  for (const [type, byKey] of perLocale) {
    const list: SourceGroup[] = [];
    for (const [key, bucket] of byKey) {
      const canonical = bucket.en;
      if (!canonical) {
        throw new ImportTransformError(
          `${type} group "${key}" has no English document. The English id is the one kept as the Payload id.`,
        );
      }
      list.push({ kind: "perLocale", canonical, docs: bucket });
    }
    groups.set(type, list);
  }

  return { groups, skipped };
}

/**
 * Builds every Payload document, in dependency order, adding each id to
 * `ctx.known` as it goes — which is what lets `reference()` reject a forward
 * reference before a single row is written.
 */
export function documentTargets(docs: SanityDoc[], ctx: TransformContext): {
  targets: DocumentTarget[];
  skipped: string[];
} {
  const { groups, skipped } = groupSources(docs);
  const targets: DocumentTarget[] = [];

  // Every id this run will produce, seeded before anything is built: a
  // reference is legal if its target is imported EARLIER, and `known` is
  // filled type by type below to enforce exactly that.
  for (const type of IMPORT_ORDER) {
    for (const group of groups.get(type) ?? []) {
      targets.push(buildTarget(type, group, ctx));
      const last = targets[targets.length - 1];
      if (last.id) ctx.known.add(last.id);
    }
  }

  const unknownTypes = [...groups.keys()].filter((t) => !IMPORT_ORDER.includes(t));
  if (unknownTypes.length > 0) {
    throw new ImportTransformError(`IMPORT_ORDER is missing: ${unknownTypes.join(", ")}`);
  }
  return { targets, skipped };
}

export function buildTarget(type: string, group: SourceGroup, ctx: TransformContext): DocumentTarget {
  const spec = TYPE_SPECS[type];
  if (!spec) throw new ImportTransformError(`No Payload target for Sanity type "${type}"`);
  const canonical = group.canonical;
  const id = spec.kind === "global" ? "" : String(canonical._id);
  const unplaced: string[] = [];
  const data: Partial<Record<Locale, PayloadData>> = {};
  const sources: string[] = [];

  const status = spec.drafts ? { _status: "published" } : {};

  if (group.kind === "single") {
    sources.push(String(canonical._id));
    const base = { ...spec.build(canonical, canonical, "en", ctx, unplaced), ...timestamps(canonical), ...status };
    data.en = base;
    const baseline = JSON.stringify(base);
    for (const locale of LOCALES) {
      if (locale === "en") continue;
      const built = { ...spec.build(canonical, canonical, locale, ctx, unplaced), ...timestamps(canonical), ...status };
      // Only locales that actually differ are written. A Lane-B document whose
      // fields are all `{en}` gets one write, not four — and Payload's
      // `fallback: true` serves es/fr/ar from `en` exactly as Sanity did.
      if (JSON.stringify(built) !== baseline) data[locale] = built;
    }
  } else {
    for (const locale of LOCALES) {
      const source = group.docs[locale];
      if (!source) continue;
      sources.push(String(source._id));
      data[locale] = { ...spec.build(source, canonical, locale, ctx, unplaced), ...timestamps(canonical), ...status };
    }
  }

  return { kind: spec.kind, slug: spec.slug, id, sanityType: type, sources, data, unplaced };
}
