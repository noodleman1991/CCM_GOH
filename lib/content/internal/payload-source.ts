/**
 * The Payload half of the seam, sitting beside `sanity-source.ts`.
 *
 * This is the ONLY file under lib/content/ permitted to reach Payload's Local
 * API, the same way `sanity-source.ts` is the only one permitted to reach
 * Sanity. Domain modules pick between the two through
 * `lib/content/internal/backend.ts`; nothing above the seam learns which store
 * answered.
 *
 * ---------------------------------------------------------------------------
 * The four reads are not interchangeable
 * ---------------------------------------------------------------------------
 *
 * `sanity-source.ts` exports four read primitives whose differences cost real
 * bugs in Phase 1 — six from merging `query` with `queryPreviewable`, and an
 * authorization bypass from swapping `queryLive` for `queryRaw`. Those
 * differences are reproduced here in Payload's own vocabulary rather than
 * flattened:
 *
 *   | primitive          | Sanity                       | Payload                                   |
 *   |--------------------|------------------------------|-------------------------------------------|
 *   | query              | published, cached 1h         | draft:false + published-only, cached 1h    |
 *   | queryPreviewable   | draftMode() decides          | draftMode() decides both flags and caching |
 *   | queryRaw           | raw perspective, write client| draft:true, every version visible, uncached|
 *   | queryLive          | published, read client       | draft:false + published-only, uncached     |
 *
 * ---------------------------------------------------------------------------
 * "Published" is two things in Payload, not one
 * ---------------------------------------------------------------------------
 *
 * Sanity expresses draft-ness in the id (`drafts.<id>`), so its `published`
 * perspective is a single switch. Payload splits it in two, and BOTH halves
 * are needed to mean what Sanity's `published` means:
 *
 *   1. `draft: false` — do not overlay the newest version from `_versions`
 *      onto the row. On its own this is only about *which revision* is read.
 *   2. `_status: { equals: "published" }` — the row itself must be published.
 *      Payload's main table carries draft rows too (see
 *      `payload/dist/collections/operations/find.js`: with `draft` falsy it
 *      goes straight to `payload.db.find`, which filters nothing by status),
 *      so without this a never-published document is returned by a
 *      "published" read. That is precisely the shape of the Phase-1 bypass:
 *      a draft that says `moderationStatus: "approved"` answering a gate.
 *
 * The second half is applied ONLY to collections that actually enable
 * `versions.drafts` — read off the sanitized config at call time, so this
 * cannot drift as collections gain or lose drafts. On a collection without
 * versions there is no `_status` field at all, and Payload's
 * `validateQueryPaths` rejects a query naming one.
 *
 * ---------------------------------------------------------------------------
 * Access control
 * ---------------------------------------------------------------------------
 *
 * Every read here runs with Payload's Local API default, `overrideAccess:
 * true`. That is deliberate and matches what it replaces: Sanity's server-side
 * clients carry a token and see the whole dataset, and the moderation filters
 * the site actually renders (`status == "approved"`, …) live in the domain
 * modules' queries — which is why `getCaseStudiesByStatus("pending")` works at
 * all. The anonymous gate (`publishedAndApproved`, `moderationApprovedOnly` in
 * `payload/access/index.ts`) guards `/payload-api`, the public surface; it is
 * not this seam's job, and turning it on here would silently empty every
 * editor-facing read.
 */
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import type { CollectionSlug, GlobalSlug, SelectType, Sort, Where } from "payload";

// ---------------------------------------------------------------------------
// The Payload instance
// ---------------------------------------------------------------------------

type PayloadInstance = Awaited<ReturnType<typeof import("payload").getPayload>>;

let instance: Promise<PayloadInstance> | undefined;

/**
 * One Local API instance for the process.
 *
 * Both imports are dynamic for the same reason
 * `scripts/payload-import/lib/runtime.ts` makes them dynamic: `@payload-config`
 * pulls in the whole config — the Postgres pool, the R2 bucket resolution, and
 * transitively `@clerk/nextjs/server` — and none of that should be evaluated
 * merely because a domain module was imported. A failed initialisation is not
 * memoised, so a transient startup error does not poison the process.
 */
async function payloadClient(): Promise<PayloadInstance> {
  if (!instance) {
    instance = (async () => {
      const [{ getPayload }, { default: config }] = await Promise.all([
        import("payload"),
        import("@payload-config"),
      ]);
      return getPayload({ config });
    })().catch((error: unknown) => {
      instance = undefined;
      throw error;
    });
  }
  return instance;
}

// ---------------------------------------------------------------------------
// The query descriptor
// ---------------------------------------------------------------------------

/** The four configured locales. `"all"` returns every locale as an object,
 *  which is the shape `lib/content/types.ts`'s `Localized<T>` already models. */
export type PayloadLocale = "en" | "es" | "fr" | "ar";

interface CommonQuery {
  /** Defaults to `"all"`. */
  locale?: PayloadLocale | "all";
  /** `false` disables Payload's `fallback: true` for this read. */
  fallbackLocale?: PayloadLocale | false;
  /** Relationship population depth. Left to Payload's own default when unset. */
  depth?: number;
}

export interface PayloadFindQuery extends CommonQuery {
  type: "find";
  collection: CollectionSlug;
  where?: Where;
  sort?: Sort;
  limit?: number;
  page?: number;
  /** `false` returns every match and skips the count query. */
  pagination?: boolean;
  select?: SelectType;
}

export interface PayloadFindByIDQuery extends CommonQuery {
  type: "findByID";
  collection: CollectionSlug;
  id: string;
  select?: SelectType;
}

export interface PayloadCountQuery {
  type: "count";
  collection: CollectionSlug;
  where?: Where;
  /**
   * No `"all"` here, unlike the other three: `count` returns a number, not
   * documents, so there is nothing for `"all"` to widen — Payload's own
   * `CountOptions` accepts a single locale, for resolving a localized `where`
   * clause. Left unset unless the caller is filtering on a localized field.
   */
  locale?: PayloadLocale;
}

export interface PayloadGlobalQuery extends CommonQuery {
  type: "global";
  slug: GlobalSlug;
  select?: SelectType;
}

export type PayloadQuery =
  | PayloadFindQuery
  | PayloadFindByIDQuery
  | PayloadCountQuery
  | PayloadGlobalQuery;

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

/** Drop keys the caller did not set, so a descriptor that says nothing about
 *  `limit`/`sort`/`depth` leaves Payload's own defaults in place rather than
 *  overriding them with `undefined`. */
function defined<T extends Record<string, unknown>>(options: T): T {
  return Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)) as T;
}

const PUBLISHED: Where = { _status: { equals: "published" } };

/** Does this collection have an `_status` column to filter on at all? */
function hasDrafts(payload: PayloadInstance, collection: CollectionSlug): boolean {
  const config = payload.config.collections.find((c) => c.slug === collection);
  return Boolean(config?.versions?.drafts);
}

/** The caller's filter, narrowed to published rows where that is meaningful. */
function withPublished(
  payload: PayloadInstance,
  collection: CollectionSlug,
  where: Where | undefined,
  publishedOnly: boolean,
): Where | undefined {
  if (!publishedOnly || !hasDrafts(payload, collection)) return where;
  return where ? { and: [PUBLISHED, where] } : PUBLISHED;
}

/**
 * `draft` carries both halves of the perspective: `true` means "the newest
 * revision, published or not" (Sanity's `drafts`/`raw`), `false` means "the
 * published document and only the published document" (Sanity's `published`).
 */
async function execute<T>(descriptor: PayloadQuery, draft: boolean): Promise<T> {
  const payload = await payloadClient();

  switch (descriptor.type) {
    case "find": {
      const result = await payload.find(
        defined({
          collection: descriptor.collection,
          draft,
          locale: descriptor.locale ?? "all",
          fallbackLocale: descriptor.fallbackLocale,
          where: withPublished(payload, descriptor.collection, descriptor.where, !draft),
          sort: descriptor.sort,
          limit: descriptor.limit,
          page: descriptor.page,
          pagination: descriptor.pagination,
          depth: descriptor.depth,
          select: descriptor.select,
        }),
      );
      return result as T;
    }

    case "findByID": {
      // `disableErrors` so a missing document is `null`, matching GROQ's
      // `[0]` rather than Payload's default NotFound throw.
      const doc = await payload.findByID(
        defined({
          collection: descriptor.collection,
          id: descriptor.id,
          draft,
          disableErrors: true,
          locale: descriptor.locale ?? "all",
          fallbackLocale: descriptor.fallbackLocale,
          depth: descriptor.depth,
          select: descriptor.select,
        }),
      );
      if (!doc) return null as T;
      // findByID takes no `where`, so the published-only half of the
      // perspective has to be applied to the result. Same rule as
      // `withPublished`, and the same reason: an id read must not hand back a
      // draft to a caller that asked for the published document.
      if (!draft && hasDrafts(payload, descriptor.collection)) {
        const status = (doc as { _status?: string })._status;
        if (status !== "published") return null as T;
      }
      return doc as T;
    }

    case "count": {
      // Payload's count takes no `draft` — it counts rows, and there is no
      // version to overlay onto a number. The published/raw distinction is
      // therefore carried entirely by the `_status` filter.
      const { totalDocs } = await payload.count(
        defined({
          collection: descriptor.collection,
          locale: descriptor.locale,
          where: withPublished(payload, descriptor.collection, descriptor.where, !draft),
        }),
      );
      // Unwrapped to a plain number, matching GROQ's `count(*[…])`.
      return totalDocs as T;
    }

    case "global": {
      const result = await payload.findGlobal(
        defined({
          slug: descriptor.slug,
          draft,
          locale: descriptor.locale ?? "all",
          fallbackLocale: descriptor.fallbackLocale,
          depth: descriptor.depth,
          select: descriptor.select,
        }),
      );
      return result as T;
    }
  }
}

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------

/** The blanket revalidation tag, mirroring `cachedFetch`'s `"sanity"`. */
export const CONTENT_CACHE_TAG = "payload";

const DEFAULT_REVALIDATE = 3600;

function revalidateSeconds(): number {
  return Number(process.env.PAYLOAD_REVALIDATE_SECONDS) || DEFAULT_REVALIDATE;
}

/** A cache key that does not depend on the order the caller wrote the
 *  descriptor's keys in — `{type,collection}` and `{collection,type}` are the
 *  same read and must not occupy two cache entries. */
function stableKey(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
    }
    return v;
  });
}

/**
 * Note what `unstable_cache` does to a result: it round-trips through the
 * incremental cache, so a `Date` comes back as an ISO string. Every Sanity
 * read already returned ISO strings, and `lib/content/` types its own returns
 * accordingly, so this matches rather than diverges — but a Payload reader
 * must not assume `Date` instances survive a cached read.
 */
async function executeCached<T>(descriptor: PayloadQuery): Promise<T> {
  const key = stableKey(descriptor);
  // The descriptor is in `keyParts`, so the cached callback needs no
  // arguments of its own: two different reads already land on two different
  // cache entries.
  const run = unstable_cache(async () => execute<unknown>(descriptor, false), ["payload-source", key], {
    revalidate: revalidateSeconds(),
    tags: [CONTENT_CACHE_TAG],
  });
  return (await run()) as T;
}

// ---------------------------------------------------------------------------
// The four reads
// ---------------------------------------------------------------------------

/**
 * An ordinary read: the published document, cached for an hour.
 *
 * Deliberately never touches `draftMode()`. That is a Next.js dynamic API and
 * throws outside a request scope (build-time generation,
 * `generateStaticParams`, `sitemap.ts`), which is exactly why the Sanity twin
 * decides `perspective` up front. Use `queryPreviewable` when an editor must
 * be able to see their unpublished changes.
 */
export async function query<T>(descriptor: PayloadQuery): Promise<T> {
  return executeCached<T>(descriptor);
}

/**
 * A read that a preview can show. Identical to `query()` outside draft mode —
 * published, cached; inside it, the newest revision, uncached.
 *
 * The Sanity twin gets this by omitting `perspective`/`stega` and letting
 * `cachedFetch` consult `draftMode()`; here the consultation is explicit
 * because Payload has no equivalent fall-through. `draftMode()` throwing means
 * there is no request and therefore no draft session, so "not draft" is the
 * answer rather than a crash — the same `try`/`catch` that
 * `sanity/lib/cached-fetch.ts` carries.
 */
export async function queryPreviewable<T>(descriptor: PayloadQuery): Promise<T> {
  let isDraft = false;
  try {
    isDraft = (await draftMode()).isEnabled;
  } catch {
    isDraft = false;
  }
  return isDraft ? execute<T>(descriptor, true) : executeCached<T>(descriptor);
}

/**
 * A read that feeds a write: every version visible, nothing cached.
 *
 * The Sanity twin uses the write client's `raw` perspective, so it sees
 * drafts on purpose — "load my own unpublished submission to re-edit", "does
 * this document already exist before I create it". Those must throw on
 * failure like any write path, so callers do not wrap this in `safe()`.
 *
 * NOT interchangeable with `queryLive`. Handing a client-supplied id to this
 * primitive is how a draft claiming `moderationStatus: "approved"` passed an
 * authorization gate in Phase 1.
 */
export async function queryRaw<T>(descriptor: PayloadQuery): Promise<T> {
  return execute<T>(descriptor, true);
}

/**
 * A read that must be fresh AND published-only: no cache, no drafts.
 *
 * The five call sites this replaces are moderation and permission gates
 * (`lib/content/outputs.ts`, `lib/content/discovery.ts`) whose staleness
 * budget is already spent elsewhere and which must never validate against an
 * unpublished document. `query()` is wrong for them because of the hour-long
 * cache; `queryRaw` is wrong for them because it sees drafts.
 */
export async function queryLive<T>(descriptor: PayloadQuery): Promise<T> {
  return execute<T>(descriptor, false);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
//
// Present so the seam's two halves expose the same surface; the call sites
// move over in Tasks 9-15. Unlike Sanity's globally-unique ids, Payload
// addresses a document by (collection, id), so each of these takes the
// collection explicitly.

export interface DocumentRef {
  collection: CollectionSlug;
  id: string;
}

/** Create a document. Returns just the new document's id. */
export async function createDocument(input: {
  collection: CollectionSlug;
  data: Record<string, unknown>;
  locale?: PayloadLocale;
  draft?: boolean;
}): Promise<{ id: string }> {
  const payload = await payloadClient();
  const created = await payload.create(
    defined({
      collection: input.collection,
      data: input.data as never,
      locale: input.locale,
      draft: input.draft,
    }),
  );
  return { id: String(created.id) };
}

/**
 * Update a document. `null` means "unset this field" — everything else is set.
 *
 * The Sanity twin has to split that into a set/unset patch; Payload's update
 * already treats an explicit `null` as a clear, so the data object goes
 * through untouched. That is the vocabulary the seam promised, kept.
 */
export async function updateDocument(input: {
  collection: CollectionSlug;
  id: string;
  data: Record<string, unknown>;
  locale?: PayloadLocale;
  draft?: boolean;
}): Promise<void> {
  const payload = await payloadClient();
  await payload.update(
    defined({
      collection: input.collection,
      id: input.id,
      data: input.data as never,
      locale: input.locale,
      draft: input.draft,
    }),
  );
}

/** Delete a document outright (not a soft-delete/unpublish). */
export async function deleteDocument(ref: DocumentRef): Promise<void> {
  const payload = await payloadClient();
  await payload.delete({ collection: ref.collection, id: ref.id });
}

/**
 * Delete a batch of documents in one operation. A no-op (no store round-trip)
 * for an empty list.
 *
 * Payload's bulk delete reports per-document failures in `errors` instead of
 * throwing, which would let a partial erasure look like a complete one — the
 * wrong failure mode for the GDPR path this serves. So a non-empty `errors`
 * is turned into a throw, naming the ids that survived.
 */
export async function deleteDocuments(input: { collection: CollectionSlug; ids: string[] }): Promise<void> {
  if (input.ids.length === 0) return;
  const payload = await payloadClient();
  const result = await payload.delete({
    collection: input.collection,
    where: { id: { in: input.ids } },
  });
  const errors = (result as { errors?: { id?: unknown; message?: string }[] }).errors ?? [];
  if (errors.length > 0) {
    const detail = errors.map((e) => `${String(e.id)}: ${e.message ?? "unknown error"}`).join("; ");
    throw new Error(`Failed to delete ${errors.length} of ${input.ids.length} ${input.collection} documents — ${detail}`);
  }
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

const IMAGE_MIME_TYPES: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heif",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
};

function imageMimeType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = IMAGE_MIME_TYPES[extension];
  if (!mimeType) {
    // `media` declares `mimeTypes: ["image/*"]`, so a guess here becomes a
    // rejected upload with a confusing message. Refuse instead, and let the
    // caller pass `contentType` when it knows better than the filename.
    throw new Error(`Cannot infer an image content type from "${filename}". Pass contentType explicitly.`);
  }
  return mimeType;
}

/**
 * A ~20px WebP data URI, the stand-in for Sanity's `metadata.lqip`.
 *
 * Payload generates nothing equivalent, and `media.lqip` is load-bearing:
 * 347/347 imported rows carry one and 25 components pass it to `next/image` as
 * `blurDataURL`. Without this, every asset uploaded after the cutover would
 * silently lose its placeholder while every imported one kept it. Failure to
 * produce one is not fatal — a missing placeholder is a cosmetic loss, and
 * refusing the upload over it would be worse.
 */
async function generateLqip(buffer: Buffer): Promise<string | undefined> {
  try {
    const { default: sharp } = await import("sharp");
    const thumbnail = await sharp(buffer)
      .resize(20, 20, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 40 })
      .toBuffer();
    return `data:image/webp;base64,${thumbnail.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/** Upload a file to the asset store. Returns just the new asset's id. */
export async function uploadFileAsset(
  buffer: Buffer,
  options: { filename: string; contentType: string },
): Promise<{ id: string }> {
  const payload = await payloadClient();
  const created = await payload.create({
    collection: "files",
    data: {} as never,
    file: { data: buffer, mimetype: options.contentType, name: options.filename, size: buffer.length },
  });
  return { id: String(created.id) };
}

/**
 * Upload an image, returning what a caller needs to render it immediately:
 * id, url, pixel dimensions, and a blurred placeholder.
 *
 * `contentType` is optional here and required on `uploadFileAsset` because an
 * image's extension is a reliable signal and a document's is not; the one
 * caller (`app/api/uploads/image/route.ts`) already holds the browser's
 * `file.type` and should pass it once Task 15 re-points it.
 */
export async function uploadImageAsset(
  buffer: Buffer,
  options: { filename: string; contentType?: string },
): Promise<{ id: string; url: string; width?: number; height?: number; lqip?: string }> {
  const payload = await payloadClient();
  const lqip = await generateLqip(buffer);
  const created = await payload.create({
    collection: "media",
    data: defined({ lqip }) as never,
    file: {
      data: buffer,
      mimetype: options.contentType ?? imageMimeType(options.filename),
      name: options.filename,
      size: buffer.length,
    },
  });
  const media = created as { id: unknown; url?: string | null; width?: number | null; height?: number | null; lqip?: string | null };
  return {
    id: String(media.id),
    url: media.url ?? "",
    width: media.width ?? undefined,
    height: media.height ?? undefined,
    lqip: media.lqip ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/**
 * The identity function.
 *
 * Its Sanity twin strips stega — invisible metadata Sanity embeds in strings
 * for the Presentation tool's click-to-edit. Payload embeds nothing, so there
 * is nothing to strip; the export exists so call sites do not branch on which
 * backend answered.
 */
export function cleanText<T>(value: T): T {
  return value;
}
