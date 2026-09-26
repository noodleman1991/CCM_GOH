/**
 * The image half of the Payload seam, sitting beside `image-source.ts`.
 *
 * `lib/content/images.ts` exposes one function, `imageUrl(image, opts)`, and
 * every `<Image src=…>` in the app goes through it. Today it resolves against
 * Sanity's URL builder, which is *parametric*: any width, any height, any
 * quality, computed at request time by the CDN. Payload cannot do that. It
 * writes a fixed set of derivatives at upload time — the eleven `imageSizes`
 * on `payload/collections/media.ts`, each derived call-site by call-site from
 * this very function — and serves them as static files. So the whole job of
 * this module is turning a parametric request into a choice among eleven, and
 * deciding honestly what to do when none of them fits.
 *
 * ---------------------------------------------------------------------------
 * What happens on a miss
 * ---------------------------------------------------------------------------
 *
 * Four tiers, in order:
 *
 *   1. **Exact.** The key `${crop|max}${width}[x${height}]` names one of the
 *      eleven. This is every one of the 23 dimensioned call sites today.
 *   2. **Nearest size up.** The smallest derivative that *covers* the request:
 *      at least as wide and at least as tall, and for a crop, the same aspect
 *      ratio. Never nearest-size-down — scaling a derivative back up loses
 *      detail the original still has — and never a crop of a different aspect,
 *      which is a different picture, not a smaller one.
 *   3. **A dimension-less request resolves to the original, deliberately.**
 *      Sanity's `fit("max")` with no width returns the asset at full size, so
 *      the original *is* the faithful answer; no derivative reproduces full
 *      resolution. This is not a miss and is not reported as one.
 *   4. **Anything left over falls through to the original and is recorded.**
 *      `getImageSizeMisses()` lists them and each distinct one warns once.
 *
 * Silently returning the original was ruled out, and this does not do that:
 * tier 4 is loud, and tier 3 is a documented equivalence rather than a
 * fallback. What made the question sharp was `sanity/lib/image.ts:19`, which
 * returns `.format("webp").fit("max")` unconditionally for every non-SVG — so
 * every image on the site is WebP on the wire today, and a stored PNG served
 * in its place would be a transfer-size regression, not a storage detail.
 *
 * (2026-09-21: the paragraph below predates lib/images/next-image-loader.ts.
 * A generated size now bypasses the optimizer and is served as stored, so the
 * thirteen call sites it lists were given explicit sizes, and an original
 * still goes through the optimizer. Tier 3 remains the rule for a call site
 * that asks for nothing.)
 *
 * That worry turns out to be bounded, and the measurement is why tier 3 is
 * acceptable. Twelve of the thirteen dimension-less call sites
 * (`components/blocks/post-hero.tsx:43,58`, `split/split-info-item.tsx:67`,
 * `carousel/carousel-1.tsx:130`, `grid/grid-section-header.tsx:78`,
 * `logo-cloud/logo-cloud-1.tsx:46,152`, `ui/news-post-card.tsx:83,154`,
 * `ui/case-study-card.tsx:165`, `ui/external-source-card.tsx:71`,
 * `ui/post-card.tsx:41`) render through `next/image` with the default loader,
 * none passing `unoptimized`, and `next.config.ts` sets
 * `images.formats: ['image/avif','image/webp']`. The optimizer re-encodes per
 * `Accept` header, so what reaches the browser is AVIF or WebP whatever the
 * origin stores. The bytes that change are the ones between the optimizer and
 * the object store, on a path that caches.
 *
 * The thirteenth is `lib/content/metadata.ts:72` — the Open Graph image,
 * `imageUrl(page.ogImage, { quality: 100 })` — and it has no optimizer in
 * front of it, because crawlers fetch the URL directly. `quality` is
 * unrepresentable here, so it is recorded as an explicit
 * `unsupported-quality` miss every time. **That call site needs its own
 * decision in Task 7**, and it needs a second one anyway: Payload serves
 * `/payload-api/media/file/…`, a same-origin *relative* URL, and an `og:image`
 * must be absolute. Both are the domain module's to make — this module returns
 * what Payload stores and does not guess a host.
 *
 * ---------------------------------------------------------------------------
 * Two behaviours preserved verbatim from the Sanity builders
 * ---------------------------------------------------------------------------
 *
 * **SVGs bypass transforms entirely.** `sanity/lib/image.ts` returns the bare
 * builder for `image/svg+xml` because routing a vector through
 * width/height/format/fit rasterizes it. Payload reaches the same place from
 * the other end: `canResizeImage` excludes SVG, so an uploaded SVG has no
 * `sizes` at all. Here that is one rule — an asset carrying no derivatives
 * resolves to its original URL, unmodified, for any options — which also
 * covers the `image/heif` case and a flat `ContentImage` that is already just
 * a URL.
 *
 * **The cropped and uncropped paths use different formats, deliberately.**
 * `urlFor` forces `.format("webp").fit("max")`; `urlForCropped` uses
 * `.fit("crop").auto("format")`, a per-browser AVIF/WebP choice. Payload
 * cannot content-negotiate a static file, so `media`'s `max*` sizes pin webp
 * and its `crop*` sizes pin no format and keep the source's (verified in the
 * dev database: a PNG's crops are `.png` and its maxes `.webp`; the one AVIF
 * asset's crops are `.avif`). This module does not unify them: `opts.crop`
 * picks the family, exactly as it picks which builder ran before.
 */
import { MEDIA_IMAGE_SIZES } from "@/payload/collections/media";
import type { ImageUrlOptions } from "@/lib/content/images";
import type { ContentImage } from "@/lib/content/types";

// ---------------------------------------------------------------------------
// The shapes this accepts
// ---------------------------------------------------------------------------

interface MediaSize {
  url?: string | null;
  width?: number | null;
  height?: number | null;
}

/** Only the parts of a `media` document this module reads. Deliberately not
 *  `payload-types.ts`'s `Media`: a reader may hand in a `select`ed subset, and
 *  requiring the full row would make that a type error rather than a
 *  degradation. */
interface MediaLike {
  url?: string | null;
  mimeType?: string | null;
  lqip?: string | null;
  sizes?: Record<string, MediaSize | null | undefined> | null;
}

/**
 * Sanity's spelling. `_id` / `_ref` / `_type` are underscore-prefixed by
 * convention in every Sanity document and reference, and Payload's `media`
 * row carries none of them — its id field is `id`.
 *
 * This distinction is load-bearing, and it was found by the parity harness
 * rather than reasoned out in advance. A *dereferenced* Sanity image is
 * `{asset: {_id, url: "https://cdn.sanity.io/…", mimeType}}` — it has a `url`,
 * so the unwrap below happily accepted it as a media row. It then found no
 * `sizes` (Sanity has none), took the "an asset with no derivatives resolves
 * to its original" branch meant for SVGs, and returned the CDN URL **stripped
 * of its `?fm=webp&fit=max` transform**. Measured on the homepage with
 * `CONTENT_BACKEND=payload`: 56 differing lines, every one of them a
 * `cdn.sanity.io` URL that had silently lost its transform. Thirteen domain
 * modules still hand this seam Sanity shapes until Task 14, so refusing them
 * outright — rather than half-answering — is what keeps the fall-through in
 * `lib/content/images.ts` able to do its job.
 */
function isSanityShaped(object: Record<string, unknown>): boolean {
  return "_id" in object || "_ref" in object || "_type" in object;
}

/**
 * Unwrap whatever a domain reader passes to the media document underneath.
 *
 * Three shapes reach here, and all three are real: a bare `media` document; an
 * `imageField()` group (`{ asset, alt }` — `payload/blocks/shared.ts`), which
 * is what every image field in the schema actually is; and a flat
 * `ContentImage` (`{ url, alt?, caption? }`), the seam's own backend-neutral
 * type. A fourth is real too and is not resolvable: at `depth: 0` Payload
 * leaves `asset` as a bare id string, and there is no URL to be built from an
 * id — that resolves to `""` like any other unresolvable input.
 *
 * A fifth is real for as long as the swap is in progress, and is refused
 * rather than half-answered: a Sanity image, from one of the thirteen domain
 * modules that has not moved yet. See `isSanityShaped`.
 */
function resolveMedia(image: unknown): MediaLike | undefined {
  if (!image || typeof image !== "object") return undefined;
  const object = image as Record<string, unknown>;
  if (isSanityShaped(object)) return undefined;
  if (typeof object.url === "string" && object.url.length > 0) return object as MediaLike;
  if (object.asset && typeof object.asset === "object") return resolveMedia(object.asset);
  return undefined;
}

// ---------------------------------------------------------------------------
// The eleven, read off the collection itself
// ---------------------------------------------------------------------------

/**
 * `media.ts` names its sizes mechanically (`crop`/`max` + the requested box)
 * precisely so this file can build the key from its own arguments instead of
 * carrying a lookup table that can drift. The list is imported rather than
 * restated for the same reason; `payload/collections/media.ts` imports nothing
 * but types and `payload/access` (which itself imports only types), so this
 * costs no database pool and no config evaluation.
 */
interface Derivative {
  name: string;
  crop: boolean;
  /** The *requested* box, not the produced pixels: `fit: inside` shrinks to
   *  the source's aspect, and `withoutEnlargement` shrinks further for a small
   *  source, so `max1100` on an 810px-wide asset is stored at 810px. Sanity's
   *  `fit("max")` behaves the same way, so matching on the requested box is
   *  what keeps the two backends choosing the same derivative. */
  width: number;
  height: number;
}

/** An axis the size does not constrain. `max800` bounds width only, so any
 *  height covers it — and, conversely, a request that names no height can
 *  only be answered by a size that bounds none either. */
const UNBOUNDED = Number.POSITIVE_INFINITY;

const DERIVATIVES: Derivative[] = MEDIA_IMAGE_SIZES.map((size) => ({
  name: String(size.name),
  crop: String(size.name).startsWith("crop"),
  width: size.width ?? UNBOUNDED,
  height: size.height ?? UNBOUNDED,
}));

function sizeKey(crop: boolean, width: number, height: number): string {
  return `${crop ? "crop" : "max"}${width}${height === UNBOUNDED ? "" : `x${height}`}`;
}

/**
 * Does `candidate` answer `request` without losing anything?
 *
 * Both axes must be at least as large — a smaller derivative scaled back up is
 * softer than the original, which is always available. For a crop the aspect
 * must match exactly as well: `crop800x450` is not a bigger `crop800x600`, it
 * is a different photograph. (Cross-multiplied rather than divided, so no
 * floating-point tolerance has to be invented.)
 */
function covers(candidate: Derivative, request: Derivative): boolean {
  if (candidate.crop !== request.crop) return false;
  if (candidate.width < request.width || candidate.height < request.height) return false;
  if (!request.crop) return true;
  if (request.width === UNBOUNDED || request.height === UNBOUNDED) return false;
  return candidate.width * request.height === candidate.height * request.width;
}

/**
 * Candidate derivatives, cheapest first.
 *
 * "Cheapest" is bounding-box area, then width, then height. Area first because
 * an unbounded axis is unbounded: for a 1000x563 request both `max1100` (width
 * 1100, height unconstrained) and `max1200x675` cover it, and `max1100` is the
 * narrower box but the larger picture — on a tall source it is 1100px by
 * whatever the source's height scales to. Ordering by width alone would pick
 * it. Width and height break ties among boxes that are equally unbounded,
 * which is how a width-only request lands on the narrowest width-only box.
 */
function candidatesFor(request: Derivative): Derivative[] {
  return DERIVATIVES.filter((candidate) => covers(candidate, request)).sort((a, b) => {
    // Compared, not subtracted: an unbounded box's area is Infinity, and
    // `Infinity - 810000` is Infinity rather than a usable ordering.
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    if (areaA !== areaB) return areaA < areaB ? -1 : 1;
    if (a.width !== b.width) return a.width - b.width;
    return a.height - b.height;
  });
}

// ---------------------------------------------------------------------------
// Misses
// ---------------------------------------------------------------------------

export type ImageSizeMissReason = "no-covering-size" | "unsupported-quality";

export interface ImageSizeMiss {
  reason: ImageSizeMissReason;
  /** `undefined` where the caller named no such option. */
  width?: number;
  height?: number;
  crop: boolean;
  quality?: number;
  /** How many times this exact request has been made since the last clear. */
  count: number;
}

/**
 * Every distinct request the eleven could not answer.
 *
 * Kept rather than only logged so a miss is *inspectable* — by a test, by the
 * parity harness in Task 5, by a script auditing a new call site before it
 * ships. Keyed by the request, so a page rendering the same unserved image
 * three hundred times is one entry and one warning rather than three hundred,
 * and capped so a pathological caller cannot grow it without bound.
 */
const misses = new Map<string, ImageSizeMiss>();
const MISS_LIMIT = 100;

function recordMiss(reason: ImageSizeMissReason, opts: ImageUrlOptions, crop: boolean): void {
  const key = `${reason}|${crop}|${opts.width ?? ""}|${opts.height ?? ""}|${opts.quality ?? ""}`;
  const existing = misses.get(key);
  if (existing) {
    existing.count += 1;
    return;
  }
  if (misses.size >= MISS_LIMIT) return;
  misses.set(key, {
    reason,
    width: opts.width,
    height: opts.height,
    crop,
    quality: opts.quality,
    count: 1,
  });
  // Warned once per distinct request, in every environment. This is the only
  // signal that a new call site has asked for a transform `media` does not
  // generate; the fix is to add the size to MEDIA_IMAGE_SIZES and re-run the
  // import, and nobody can do that without first being told.
  const detail =
    reason === "unsupported-quality"
      ? `quality: ${String(opts.quality)} cannot be expressed by a stored derivative`
      : `no generated size covers ${crop ? "crop " : ""}${String(opts.width)}x${String(opts.height ?? "auto")}`;
  console.warn(
    `[payload-image-source] ${detail}; serving the original. ` +
      `Add the size to MEDIA_IMAGE_SIZES in payload/collections/media.ts if this call site is here to stay.`,
  );
}

/** The distinct misses recorded so far, newest last. */
export function getImageSizeMisses(): ImageSizeMiss[] {
  return [...misses.values()];
}

/** Forget every recorded miss. For tests and long-lived scripts. */
export function clearImageSizeMisses(): void {
  misses.clear();
}

// ---------------------------------------------------------------------------
// The two exports the seam promises
// ---------------------------------------------------------------------------

/** Does this asset carry any derivative at all? An SVG does not (Payload's
 *  `canResizeImage` excludes it), nor does a flat `ContentImage`, and neither
 *  is a gap worth reporting — having no derivatives is the rule for them. */
function hasDerivatives(media: MediaLike): boolean {
  const sizes = media.sizes;
  if (!sizes) return false;
  return Object.values(sizes).some((size) => typeof size?.url === "string" && size.url.length > 0);
}

/**
 * A resolved image: the URL, and the pixel box the thing behind it actually
 * occupies when that is knowable.
 *
 * The dimensions exist for exactly one caller. `lib/content/metadata.ts`
 * declares `og:image:width`/`height` beside the URL, and on Sanity those two
 * numbers come from the asset's own metadata and describe the bytes, because
 * `fit("max")` with no width serves the asset at full size. Under Payload the
 * OG image resolves to a *derivative* — a bounded box, not the original — so
 * reading the source's metadata would declare 3840x2160 while serving
 * 1200x675. Reporting what was chosen is what keeps the declaration honest.
 *
 * `undefined` where the answer is not knowable: a `select` may omit the size's
 * width/height, and an original (an SVG, a dimension-less request) is whatever
 * was uploaded. A caller that has its own dimensions keeps using them.
 */
export interface ResolvedImage {
  /** `""` for a null, missing or otherwise unresolvable image. */
  url: string;
  width?: number;
  height?: number;
}

/**
 * Resolve a Payload media reference to a URL string.
 *
 * The signature is `lib/content/images.ts`'s, down to the options type, which
 * is imported from it rather than restated so the two cannot drift. Never
 * throws: a null, missing, or otherwise unresolvable image resolves to `""` —
 * an image is never worth a 500.
 */
export function imageUrl(image: ContentImage | unknown, opts: ImageUrlOptions = {}): string {
  return imageSource(image, opts).url;
}

/**
 * `imageUrl`, plus the chosen derivative's own pixel box.
 *
 * The two share one body rather than one calling the other twice: picking a
 * derivative and reporting which one was picked must not be able to disagree.
 */
export function imageSource(image: ContentImage | unknown, opts: ImageUrlOptions = {}): ResolvedImage {
  if (!image) return { url: "" };

  try {
    const media = resolveMedia(image);
    const original = typeof media?.url === "string" ? media.url : "";
    if (!media || !original) return { url: "" };

    /** The original's own box, for the tiers that resolve to it. */
    const source: ResolvedImage = {
      url: original,
      width: typeof (media as { width?: unknown }).width === "number" ? (media as { width: number }).width : undefined,
      height: typeof (media as { height?: unknown }).height === "number" ? (media as { height: number }).height : undefined,
    };

    // The SVG rule, and everything that shares its shape.
    if (!hasDerivatives(media)) return source;

    // `quality` is recorded whether or not a size is found: the caller asked
    // for something no stored derivative carries, and that stays true even
    // when the box matches one.
    if (opts.quality !== undefined) recordMiss("unsupported-quality", opts, opts.crop === true);

    // `crop` needs both axes to mean anything, exactly as in the function this
    // mirrors: `if (crop && width && height)`.
    const crop = opts.crop === true && Boolean(opts.width) && Boolean(opts.height);

    // Tier 3: nothing was asked for, so the original is the answer. Sanity's
    // `fit("max")` with no width returns the asset at full size.
    if (!opts.width && !opts.height) return source;

    const request: Derivative = {
      name: "",
      crop,
      width: opts.width ?? UNBOUNDED,
      height: opts.height ?? UNBOUNDED,
    };

    // Tier 1 then tier 2. The exact key is tried first and is also the first
    // covering candidate, so this is one ordered walk: the first name whose
    // derivative is actually present on the row wins. (A present name with a
    // null URL is not hypothetical — a `select` can omit it, and a future
    // `withoutEnlargement` change could emit one.)
    const names = [sizeKey(crop, request.width, request.height), ...candidatesFor(request).map((c) => c.name)];
    for (const name of names) {
      const size = media.sizes?.[name];
      const url = typeof size?.url === "string" && size.url.length > 0 ? size.url : undefined;
      if (url) {
        return {
          url,
          width: typeof size?.width === "number" ? size.width : undefined,
          height: typeof size?.height === "number" ? size.height : undefined,
        };
      }
    }

    // Tier 4.
    recordMiss("no-covering-size", opts, crop);
    return source;
  } catch {
    return { url: "" };
  }
}

/**
 * The blurred placeholder for an image, or `undefined` when there is none.
 *
 * `media.lqip` is Sanity's `metadata.lqip`, carried across at import because
 * Payload generates no equivalent and nothing regenerates it: 347/347 rows
 * hold one and 25 components pass it to `next/image` as `blurDataURL`. If this
 * returned null they would all silently lose their placeholders — a
 * degradation no test would notice and no error would report.
 *
 * `undefined` rather than `""`, because `placeholder="blur"` with an empty
 * `blurDataURL` is a `next/image` error, and `?? undefined` / `|| undefined` is
 * what the call sites already write.
 */
export function blurDataURL(image: ContentImage | unknown): string | undefined {
  const media = resolveMedia(image);
  const lqip = media?.lqip;
  if (typeof lqip !== "string" || lqip.trim().length === 0) return undefined;
  return lqip;
}
