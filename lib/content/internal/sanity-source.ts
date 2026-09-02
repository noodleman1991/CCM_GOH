/**
 * The single seam between the content layer and Sanity.
 *
 * This is the ONLY file under lib/content/ permitted to import from @/sanity
 * or @sanity/*; lib/__tests__/content-layer-boundary.test.ts enforces that.
 * Phase 3 adds payload-source.ts beside this file and switches the domain
 * modules over one at a time.
 */
import { cachedFetch } from "@/sanity/lib/cached-fetch";
import { writeClient } from "@/sanity/lib/write-client";

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

/** Upload a file to the asset store. Returns just the new asset's id. */
export async function uploadFileAsset(
  buffer: Buffer,
  options: { filename: string; contentType: string },
): Promise<{ id: string }> {
  const asset = await writeClient.assets.upload("file", buffer, options);
  return { id: asset._id };
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
