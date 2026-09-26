/**
 * The single seam between the content layer and Sanity.
 *
 * This is the ONLY file under lib/content/ permitted to import from @/sanity,
 * @sanity/*, or next-sanity; lib/__tests__/content-layer-boundary.test.ts
 * enforces that. Phase 3 adds payload-source.ts beside this file and
 * switches the domain modules over one at a time.
 */
import { cachedFetch } from "@/sanity/lib/cached-fetch";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";
import { stegaClean } from "next-sanity";

/**
 * Run a GROQ query. Callers pass a plain string rather than a `defineQuery`
 * literal: the generated result types are deliberately not used here, because
 * lib/content/ types its own returns and must not depend on sanity.types.ts.
 */
export async function query<T>(
  groq: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await cachedFetch({
    query: groq as never,
    params,
    perspective: "published",
    stega: false,
  });
  return data as T;
}

/**
 * Run a GROQ query WITHOUT deciding `perspective`/`stega` up front — unlike
 * `query()`, this omits both fields from the `cachedFetch` call so
 * `cachedFetch` falls through to its own `draftMode()` check (see
 * sanity/lib/cached-fetch.ts's `decidedUpFront` branch). That is what lets
 * an editor previewing a draft in Sanity's Presentation tool see their own
 * unpublished changes on a page that otherwise reads the published
 * perspective: a `draftMode()` cookie flips this read to drafts + stega
 * automatically, with no caller-side branching.
 *
 * This is deliberately NOT the default. `draftMode()` is a Next.js dynamic
 * API — calling it during a statically-rendered request (build-time
 * generation, `generateStaticParams`, anything outside an active request)
 * throws `draftMode was called outside a request scope`. `query()` avoids
 * that by always deciding `perspective`/`stega` up front (forcing
 * `published`), which is the right default for the many callers that must
 * still work outside a request. Use `queryPreviewable` only for reads that
 * back an editor-facing, always-in-request page where draft preview is a
 * requirement — the original sanity/lib/fetch.ts helpers that omitted
 * `perspective`/`stega` are exactly that set.
 */
export async function queryPreviewable<T>(
  groq: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await cachedFetch({
    query: groq as never,
    params,
  });
  return data as T;
}

/**
 * Run a GROQ query against the raw perspective with an authenticated
 * (editor-token) client, so drafts and unpublished documents are visible.
 * Used by gated reads such as "load my own draft to re-edit" — those must
 * throw on failure like any other write-adjacent path, so callers do not
 * wrap this in `safe()`.
 */
export async function queryRaw<T>(
  groq: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  return writeClient.withConfig({ perspective: "raw" }).fetch(groq as never, params) as Promise<T>;
}

/**
 * Run a GROQ query against the published perspective with the read client,
 * with NO Next.js data cache entry — the exact equivalent of a bare
 * `client.fetch(groq)` call, which is what every original of this shape did.
 *
 * Neither of the other two read primitives fits that shape: `query()` adds
 * `next: { revalidate: 3600 }` on top of published, and `queryRaw` trades
 * away the cache but also switches to the write client's `raw` perspective,
 * which sees drafts. `queryLive` is for reads that must be both
 * *live* (no hour-long cache sitting on top of the call site's own
 * freshness contract) and *published-only* (never draft-visible) —
 * typically a permission or moderation gate whose staleness budget is
 * already spoken for by an in-process TTL or a per-request cache, and which
 * must never validate against an unpublished document. Use `queryRaw`
 * instead when the read is drafts-visible on purpose (a write-time
 * authorization check against the author's own unpublished content).
 */
export async function queryLive<T>(
  groq: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  return client.fetch(groq as never, params) as Promise<T>;
}

/** Upload a file to the asset store. Returns just the new asset's id. */
export async function uploadFileAsset(
  buffer: Buffer,
  options: { filename: string; contentType: string },
): Promise<{ id: string }> {
  const asset = await writeClient.assets.upload("file", buffer, options);
  return { id: asset._id };
}

/**
 * Upload an image to the asset store, returning what a caller needs to
 * render it immediately without a separate URL-resolution step: the asset
 * id, its CDN url, pixel dimensions when the store could read them, and a
 * blurred placeholder to paint before the full image loads.
 *
 * Distinct from `uploadFileAsset`: that primitive fixes the asset kind to
 * "file" and returns only `{ id }`, which fits every existing lib/content/
 * call site (the id is embedded as an image/file reference on a document,
 * nothing else is needed). This route hands the asset straight to a
 * client-side renderer, so it needs the richer, image-specific shape —
 * neither existing primitive covers that, hence the addition. Payload's
 * Local API upload returns the same id/url/width/height/... shape for
 * media, so this survives the Phase 3 swap.
 */
export async function uploadImageAsset(
  buffer: Buffer,
  options: { filename: string },
): Promise<{ id: string; url: string; width?: number; height?: number; lqip?: string }> {
  const asset = await writeClient.assets.upload("image", buffer, options);
  return {
    id: asset._id,
    url: asset.url,
    width: asset.metadata?.dimensions?.width,
    height: asset.metadata?.dimensions?.height,
    lqip: asset.metadata?.lqip,
  };
}

/** Create a document. Returns just the new document's id. */
export async function createDocument(doc: Record<string, unknown>): Promise<{ id: string }> {
  const created = await writeClient.create(doc as never);
  return { id: created._id };
}

/**
 * Update a document. `null` means "unset this field" — everything else is
 * set. This is the seam's own update vocabulary, not Sanity's: internally it
 * splits `data` into a set/unset patch, but no caller needs to know that.
 * Payload's update takes a plain data object with the same null-clears
 * convention, so Phase 3 rewrites the body here and leaves every call site
 * alone.
 */
export async function updateDocument(id: string, data: Record<string, unknown>): Promise<void> {
  const set: Record<string, unknown> = {};
  const unset: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === null) unset.push(key);
    else set[key] = value;
  }

  let patch = writeClient.patch(id);
  if (Object.keys(set).length > 0) patch = patch.set(set);
  if (unset.length > 0) patch = patch.unset(unset);
  await patch.commit();
}

/** Delete a document outright (not a soft-delete/unpublish). Payload's Local
 *  API has the same delete-by-id shape, so this survives the Phase 3 swap. */
export async function deleteDocument(id: string): Promise<void> {
  await writeClient.delete(id);
}

/**
 * Delete a batch of documents as a single all-or-nothing operation — either
 * every id is gone or, on failure, none are. A no-op (no store round-trip)
 * for an empty list. Distinct from looping `deleteDocument`: a loop of
 * separate deletes could fail partway through and leave a mix of deleted and
 * retained documents, which is the wrong failure mode for a bulk erasure.
 * Payload's Local API deletes the same way — `payload.delete({ collection,
 * where: { id: { in: ids } } })` — so this survives the Phase 3 swap.
 */
export async function deleteDocuments(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  let tx = writeClient.transaction();
  for (const id of ids) tx = tx.delete(id);
  await tx.commit({ visibility: "async" });
}

/**
 * Strip Sanity's stega encoding — invisible metadata embedded in strings so
 * the Presentation tool can offer click-to-edit. Delegates to next-sanity's
 * `stegaClean` today; once Sanity is gone (Phase 3) there is no stega left to
 * strip and this becomes the identity function, so call sites never change.
 *
 * Generic rather than string-only: `stegaClean` itself is (`<Result =
 * unknown>(result: Result): Result`) and cleans recursively through whatever
 * it is given, not just strings — call sites in this codebase pass numbers
 * and `null`/`undefined` through it too (e.g. a numeric `limit` field), and
 * `cleanText` must return those unchanged exactly as `stegaClean` does,
 * rather than narrowing to a string signature that would silently misfit
 * those callers.
 */
export function cleanText<T>(value: T): T {
  return stegaClean(value);
}
