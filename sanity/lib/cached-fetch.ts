import { draftMode } from "next/headers";
import type {
  ClientPerspective,
  ClientReturn,
  ContentSourceMap,
  QueryParams,
} from "@sanity/client";

import { client } from "./client";
import { sanityFetch } from "./live";

/**
 * Drop-in replacement for next-sanity's `sanityFetch` that costs one upstream
 * request instead of two on public traffic.
 *
 * `sanityFetch` issues TWO `client.fetch` calls per invocation — one to read
 * `syncTags`, then one for the actual result (see next-sanity/dist/live.js).
 * That doubling is only worth paying for when the extra machinery is used:
 * draft-mode perspective resolution, stega encoding for the Presentation tool's
 * click-to-edit, and per-document `sanity:<id>` cache tags.
 *
 * None of that applies to a published page render, so:
 *
 *   - draft mode ON  -> delegate to `sanityFetch` unchanged. Editors get
 *                       identical behaviour in Presentation; nothing regresses.
 *   - draft mode OFF -> a single `client.fetch` through the API CDN, tagged
 *                       "sanity" so the publish webhook still invalidates it
 *                       (app/api/webhooks/sanity/route.ts revalidates that tag).
 *
 * The trade-off: without `syncTags` the cache entry carries the blanket
 * "sanity" tag rather than per-document tags, so a publish invalidates all
 * cached Sanity reads rather than just the affected ones. That is coarser but
 * strictly cheaper — the alternative was paying double on every read to earn
 * finer-grained invalidation the webhook does not currently use anyway.
 *
 * Every existing caller destructures only `{ data }`, so `sourceMap`/`tags` are
 * returned for signature compatibility rather than because anything reads them.
 */

const DEFAULT_REVALIDATE = Number(process.env.SANITY_REVALIDATE_SECONDS) || 3600;

/**
 * `draftMode()` throws when there is no request to read cookies from — static
 * generation, sitemap.ts, build-time calls. Outside a request there is no draft
 * session, so "not draft" is the correct answer rather than a crash.
 */
async function draftModeEnabled(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}

/**
 * Mirrors next-sanity's `DefinedSanityFetchType`: the `const QueryString`
 * generic is what lets `ClientReturn<QueryString>` resolve a `defineQuery`
 * string to its generated result type from sanity.types.ts. Widening `query` to
 * plain `string` collapses every caller's return type to `unknown`.
 */
export async function cachedFetch<const QueryString extends string>({
  query,
  params,
  tags = ["sanity"],
  perspective,
  stega,
}: {
  query: QueryString;
  params?: QueryParams | Promise<QueryParams>;
  tags?: string[];
  perspective?: Exclude<ClientPerspective, "raw">;
  stega?: boolean;
}): Promise<{
  data: ClientReturn<QueryString>;
  sourceMap: ContentSourceMap | null;
  tags: string[];
}> {
  // Editors in Presentation need the full path — drafts perspective and stega.
  //
  // Resolving that must NOT reach for draftMode() unconditionally. next-sanity
  // only consults it to fill in an absent `perspective`/`stega` (the `??` in
  // live.js), which is why callers in fetch.ts pass `perspective: "published",
  // stega: false` — that keeps them out of Next's dynamic APIs so the page can
  // still be statically rendered. Calling draftMode() regardless made every one
  // of those renders throw `draftMode was called outside a request scope`.
  const decidedUpFront = perspective !== undefined && stega !== undefined;
  const isDraft = decidedUpFront
    ? perspective !== "published" || stega
    : await draftModeEnabled();

  if (isDraft) {
    return sanityFetch({ query, params, tags, perspective, stega });
  }

  const data = await client.fetch(query, ((await params) ?? {}) as QueryParams, {
    useCdn: true,
    // "noStale" matches what next-sanity uses for published CDN reads.
    cacheMode: "noStale",
    perspective: "published",
    stega: false,
    next: { revalidate: DEFAULT_REVALIDATE, tags },
  });

  return { data, sourceMap: null, tags };
}
