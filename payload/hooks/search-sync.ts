/**
 * Algolia sync, moved from Sanity webhooks into Payload's own write path.
 *
 * ---------------------------------------------------------------------------
 * What is being replaced
 * ---------------------------------------------------------------------------
 *
 * Three of the five `app/api/search/*` route groups were fed by a Sanity
 * webhook: a document changed in Sanity, Sanity posted `{_id, _type, action}`
 * to `app/api/search/{case-studies,news,agendas}/webhook`, the route re-read
 * the document through `lib/content/` and either saved one Algolia object or
 * deleted it. Sanity is going away, so that trigger has to become an
 * `afterChange` / `afterDelete` hook on the three Payload collections.
 *
 * The other two route groups are **not** in scope, and that is a measurement,
 * not an omission:
 *
 *   - `users` is fed from **Prisma**, by profile updates and Clerk — never by
 *     Sanity and never by Payload. `payload/collections/users.ts` is the
 *     admin-auth collection, a different population entirely. Giving it a
 *     Payload hook would invent a coupling that has never existed.
 *   - `counts` and `token` only ever read.
 *
 * ---------------------------------------------------------------------------
 * The record shape is the contract
 * ---------------------------------------------------------------------------
 *
 * The three `transform*ForIndex` functions below are the record builders, moved
 * here verbatim from the sync routes so there is exactly one copy of each. They
 * were duplicated five ways — once per sync route and once per webhook — and
 * the copies had already drifted: `agendas/sync` emitted `files`, and
 * `agendas/webhook` did not. Since `saveObjects` replaces the whole object,
 * every webhook-driven agenda update silently stripped `files` off the live
 * record until the next full sync put it back.
 *
 * This file resolves that drift **towards the sync route** — the record keeps
 * `files` — for one reason: the live index is written by `sync:search` (the
 * `postbuild` full sync), so the sync route's shape is what the live index
 * actually holds. A hook that emitted the webhook's narrower shape would make
 * every single write a divergence from the index it is meant to maintain.
 *
 * Nothing else about any record changes. `scripts/search-sync-parity-check.ts`
 * diffs these records field-for-field against the live index's current
 * contents.
 *
 * ---------------------------------------------------------------------------
 * The network call does NOT run inside the write's transaction
 * ---------------------------------------------------------------------------
 *
 * Task 16 found the hazard the hard way: Payload runs `afterChange` **inside
 * the write's Postgres transaction**, so an outbound HTTPS call there holds
 * that transaction open for the duration. Its Resend call hung, Neon killed the
 * connection with `25P03 idle-in-transaction`, and the editorial write went
 * down with it. A 10s ceiling bounds that; it does not remove it.
 *
 * Algolia sync is the same shape of call on a far hotter path — every save of a
 * case study, news post or agenda — so it does not repeat the pattern. The hook
 * **schedules** the work and returns; the work runs after the transaction has
 * committed. Four reasons, in order of weight:
 *
 * 1. **Search indexing was always asynchronous and out-of-band.** The Sanity
 *    webhook arrived over the network, after the write, best-effort, and its
 *    failure mode was "the index is briefly stale". Deferring reproduces that
 *    contract exactly. Awaiting it inside the transaction would make the index
 *    *more* tightly coupled to the write than it has ever been — a regression
 *    dressed as a port.
 * 2. **An index write must never be able to fail a content write.** If Algolia
 *    is down, rate-limited or slow, the document must still save.
 * 3. **Reading after commit is the more correct read.** The deferred worker
 *    re-reads the document once the transaction has landed, so the index
 *    reflects committed state and can never hold a row that rolled back.
 * 4. **A transaction held open across a third-party API call is a
 *    connection-pool leak under load**, quite apart from the hang Task 16 hit.
 *
 * The deferral uses `after()` from `next/server` when there is a request — the
 * platform's own answer, which keeps the serverless invocation alive until the
 * callback settles, so the work actually completes on Vercel rather than being
 * frozen mid-flight. Outside a request (import scripts, `payload migrate`, the
 * parity check) `after()` throws, exactly as `revalidateTag` did for Task 16;
 * there the work is detached, bounded by a ceiling, error-logged, and
 * registered so `flushSearchSync()` can await it deterministically.
 *
 * What this costs: a window of a few hundred milliseconds where the index is
 * stale. That is the window the webhook always had, and it is smaller now
 * because there is no network delivery in front of it.
 *
 * ---------------------------------------------------------------------------
 * Indexability: published AND approved, decided from the published row
 * ---------------------------------------------------------------------------
 *
 * `caseStudies` and `newsPosts` are drafts-enabled. `afterChange` fires for a
 * draft save too, and on a draft save the published row is untouched — so
 * deciding indexability from the `doc` the hook is handed would drop a live,
 * approved case study out of search the moment someone opened a draft of it.
 *
 * The decision is therefore made from a **re-read of the published state**:
 *
 *   - the row must be published (`_status === "published"`; collections without
 *     drafts have no `_status` and are published by definition), and
 *   - `caseStudies` — `moderationStatus === "approved"`, surfaced by the
 *     reader as `status`, which is what the webhook checked;
 *   - `newsPosts` — `publishedAt <= now`, which is what the webhook checked;
 *   - `agendas` — no further condition, which is what the webhook checked.
 *
 * The `_status` clause is new and is deliberately belt-and-braces: today every
 * `caseStudies` / `newsPosts` / `agendas` row in the main table is
 * `_status: "published"` (the three never-published drafts in the import are on
 * `tags`, `authors` and `testimonials`), so it changes no record today. It
 * exists because `draft: false` does not publish and a main-table row can carry
 * `_status: "draft"` — the defect Task 16 found, applied here before it can
 * put an unpublished document into a public search index.
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { defer, flushDeferred, pendingDeferredCount, runAfterCommit, track, withTimeout } from "@/payload/hooks/after-commit";

import { deriveAgendaLanguages } from "@/lib/agenda-languages";
import type {
  AgendaSearchRecord,
  CaseStudySearchRecord,
  NewsSearchRecord,
} from "@/lib/algolia";
import type { CaseStudyIndexDoc } from "@/lib/content/case-studies";
import type { NewsIndexDoc } from "@/lib/content/news";
import type { AgendaIndexDoc } from "@/lib/content/outputs";
import { tagSearchFields } from "@/lib/search/tag-search-fields";

// ---------------------------------------------------------------------------
// The three collections that feed an index
// ---------------------------------------------------------------------------

export const SEARCH_SYNCED_COLLECTIONS = ["caseStudies", "newsPosts", "agendas"] as const;

export type SearchSyncedCollection = (typeof SEARCH_SYNCED_COLLECTIONS)[number];

export function isSearchSyncedCollection(value: unknown): value is SearchSyncedCollection {
  return (SEARCH_SYNCED_COLLECTIONS as readonly unknown[]).includes(value);
}

/** The index each collection writes to, by its `ALGOLIA_INDICES` key. */
export const SEARCH_INDEX_KEY = {
  caseStudies: "CASE_STUDIES",
  newsPosts: "NEWS",
  agendas: "AGENDAS",
} as const satisfies Record<SearchSyncedCollection, "CASE_STUDIES" | "NEWS" | "AGENDAS">;

/** Set on a write's `context` to suppress the sync for that write only. */
export const SKIP_SEARCH_SYNC = "skipSearchSync";

// ---------------------------------------------------------------------------
// The record builders — one copy, shared with the sync and webhook routes
// ---------------------------------------------------------------------------

/** The `file` shape `transformAgendaForIndex` narrows to before emitting it. */
type DereferencedAgendaFile = NonNullable<AgendaIndexDoc["files"]>[number] & {
  file: { asset: { url: string; originalFilename?: string } };
};

export function transformAgendaForIndex(agenda: AgendaIndexDoc): AgendaSearchRecord | null {
  try {
    return {
      objectID: agenda._id,
      contentId: agenda._id,
      title: agenda.title || { en: "Untitled Agenda" },
      subtitle: agenda.subtitle || ({} as NonNullable<AgendaSearchRecord["subtitle"]>),
      description: agenda.description || ({} as NonNullable<AgendaSearchRecord["description"]>),
      slug: agenda.slug?.current || "",
      agendaType: agenda.agendaType || "other",
      year: agenda.year || new Date().getFullYear(),
      publishDate: agenda.publishDate ? new Date(agenda.publishDate).getTime() : Date.now(),
      totalDownloadCount: agenda.totalDownloadCount || 0,
      featured: agenda.featured || false,
      organizations: (agenda.organizations || [])
        .map((org) => org.name)
        .filter((name): name is string => Boolean(name)),
      regionalCommunities: (agenda.regionalCommunities || [])
        .map((community) => community.name)
        .filter((name): name is string => Boolean(name)),
      ...tagSearchFields(agenda.tags),
      accessLevel: agenda.accessLevel || "public",
      language: "en", // deprecated; kept for back-compat
      languages: deriveAgendaLanguages(agenda.files, agenda.title),
      files: (agenda.files || [])
        .filter((f): f is DereferencedAgendaFile => Boolean(f.file?.asset?.url))
        .map((f) => ({
          language: f.language,
          url: f.file.asset.url,
          filename: f.file.asset.originalFilename,
        })),
    };
  } catch (error) {
    console.warn(`Failed to transform agenda ${agenda._id}:`, error);
    return null;
  }
}

export function transformCaseStudyForIndex(
  caseStudy: CaseStudyIndexDoc,
): CaseStudySearchRecord | null {
  try {
    return {
      objectID: caseStudy._id,
      contentId: caseStudy._id,
      title: caseStudy.title || { en: "Untitled Case Study" },
      excerpt: caseStudy.excerpt || ({} as NonNullable<CaseStudySearchRecord["excerpt"]>),
      slug: caseStudy.slug?.current || "",
      status: caseStudy.status || "pending",
      featured: caseStudy.featured || false,
      publishedAt: caseStudy.publishedAt ? new Date(caseStudy.publishedAt).getTime() : Date.now(),
      updatedAt: caseStudy._updatedAt ? new Date(caseStudy._updatedAt).getTime() : Date.now(),
      authors: (caseStudy.authors || []).map((author) => ({
        name: author.name || "Unknown Author",
        role: author.role || "author",
        affiliation: author.affiliation?.name,
      })),
      ...tagSearchFields(caseStudy.tags),
      studyLocation: caseStudy.studyLocation
        ? {
            lat: caseStudy.studyLocation.lat,
            lng: caseStudy.studyLocation.lng,
            name: `${caseStudy.studyLocation.lat}, ${caseStudy.studyLocation.lng}`,
          }
        : undefined,
      studyPeriod: caseStudy.studyPeriod
        ? {
            startDate: caseStudy.studyPeriod.startDate,
            endDate: caseStudy.studyPeriod.endDate,
          }
        : undefined,
      organizations: (caseStudy.organizations || [])
        .map((org) => org.name)
        .filter((name): name is string => Boolean(name)),
      language: "en", // Default to English, could be enhanced with language detection
      accessLevel: "public", // All approved case studies are public for now
      region: caseStudy.region || undefined,
      themes: caseStudy.themes || [],
      populations: caseStudy.populations || [],
    };
  } catch (error) {
    console.warn(`Failed to transform case study ${caseStudy._id}:`, error);
    return null;
  }
}

export function transformNewsForIndex(newsPost: NewsIndexDoc): NewsSearchRecord | null {
  try {
    // Ensure required fields exist
    if (!newsPost._id || !newsPost.title || !newsPost.slug) {
      console.warn(`Skipping news post: missing required fields`);
      return null;
    }

    return {
      objectID: newsPost._id,
      contentId: newsPost._id,
      title: newsPost.title || { en: "Untitled News Post" },
      subtitle: newsPost.subtitle || ({} as NonNullable<NewsSearchRecord["subtitle"]>),
      excerpt: newsPost.excerpt || ({} as NonNullable<NewsSearchRecord["excerpt"]>),
      slug: newsPost.slug?.current || "",
      publishedAt: newsPost.publishedAt ? new Date(newsPost.publishedAt).getTime() : Date.now(),
      updatedAt: newsPost._updatedAt ? new Date(newsPost._updatedAt).getTime() : Date.now(),
      author: {
        name: newsPost.author?.name || "Unknown Author",
        id: newsPost.author?._id || "",
      },
      featured: newsPost.featured || false,
      ...tagSearchFields(newsPost.tags),
      organizations: (newsPost.organizations || [])
        .map((org) => org.name)
        .filter((name): name is string => Boolean(name)),
      projects: (newsPost.projects || [])
        .map((project) => project.name)
        .filter((name): name is string => Boolean(name)),
      location: {
        city: newsPost.locationDetails?.city,
        country: newsPost.locationDetails?.country,
        lat: newsPost.location?.lat,
        lng: newsPost.location?.lng,
      },
      accessLevel: "public", // News is always public
      language: newsPost.language || "en",
      region: newsPost.region || undefined,
      themes: newsPost.themes || [],
      populations: newsPost.populations || [],
    };
  } catch (error) {
    console.warn(`Failed to transform news post ${newsPost._id}:`, error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// The decision, as a pure function
// ---------------------------------------------------------------------------

export type SearchIndexRecord = AgendaSearchRecord | CaseStudySearchRecord | NewsSearchRecord;

/** The source document for one collection, as its index-doc reader returns it. */
export type SearchIndexSource<C extends SearchSyncedCollection = SearchSyncedCollection> =
  C extends "caseStudies"
    ? CaseStudyIndexDoc
    : C extends "newsPosts"
      ? NewsIndexDoc
      : AgendaIndexDoc;

/** What a re-read of the published state found. */
export interface SearchSyncSource {
  /**
   * `_status === "published"`. A collection without drafts has no `_status`,
   * and is published by definition — its reader passes `true`.
   */
  published: boolean;
  doc: SearchIndexSource;
}

export interface SearchIndexOperation {
  op: "save" | "delete";
  objectID: string;
  record?: SearchIndexRecord;
  /** Why, in one line — carried into the result so a caller can assert it. */
  reason: string;
}

/**
 * Save or delete, and why. Pure: no I/O, no clock beyond the `publishedAt`
 * comparison the news webhook has always made.
 *
 * `source` is `null` when the document no longer exists (a delete, or a read
 * that came back empty) — which the webhooks answered with a delete, so this
 * does too.
 */
export function planSearchSync(
  collection: SearchSyncedCollection,
  objectID: string,
  source: SearchSyncSource | null,
  now: Date = new Date(),
): SearchIndexOperation {
  if (!source) return { op: "delete", objectID, reason: "document does not exist" };
  if (!source.published) return { op: "delete", objectID, reason: "document is not published" };

  if (collection === "caseStudies") {
    const doc = source.doc as CaseStudyIndexDoc;
    // The webhook's own condition, unchanged. `status` is the reader's
    // rendering of Payload's `moderationStatus`.
    if (doc.status !== "approved") {
      return { op: "delete", objectID, reason: `moderationStatus is ${doc.status ?? "unset"}` };
    }
    const record = transformCaseStudyForIndex(doc);
    return record
      ? { op: "save", objectID, record, reason: "published and approved" }
      : { op: "delete", objectID, reason: "record could not be built" };
  }

  if (collection === "newsPosts") {
    const doc = source.doc as NewsIndexDoc;
    // The webhook's own condition, unchanged.
    if (!doc.publishedAt || new Date(doc.publishedAt) > now) {
      return { op: "delete", objectID, reason: "publishedAt is unset or in the future" };
    }
    const record = transformNewsForIndex(doc);
    return record
      ? { op: "save", objectID, record, reason: "published" }
      : { op: "delete", objectID, reason: "record could not be built" };
  }

  const doc = source.doc as AgendaIndexDoc;
  // The agenda webhook applied no condition beyond "it exists", and the full
  // sync's GROQ was `*[_type == "agenda"]` with no filter either.
  const record = transformAgendaForIndex(doc);
  return record
    ? { op: "save", objectID, record, reason: "exists" }
    : { op: "delete", objectID, reason: "record could not be built" };
}

// ---------------------------------------------------------------------------
// Applying it
// ---------------------------------------------------------------------------

/**
 * The slice of the Algolia v5 client this file uses. Narrow on purpose: it is
 * what a fake in a test has to implement, and it is what keeps `lib/algolia`
 * (which constructs two clients and runs dotenv at module load) out of
 * `payload.config.ts`'s import graph.
 */
export interface SearchIndexClient {
  saveObjects(args: { indexName: string; objects: Record<string, unknown>[] }): Promise<unknown>;
  deleteObject(args: { indexName: string; objectID: string }): Promise<unknown>;
}

export async function applySearchSync(
  operation: SearchIndexOperation,
  indexName: string,
  index: SearchIndexClient,
): Promise<SearchIndexOperation> {
  if (operation.op === "save" && operation.record) {
    await index.saveObjects({ indexName, objects: [operation.record] });
  } else {
    // `deleteObject` on an absent objectID is a no-op in Algolia, which is why
    // every webhook branch could reach for it unconditionally.
    await index.deleteObject({ indexName, objectID: operation.objectID });
  }
  return operation;
}

/** The slice of Payload's Local API the published-state re-read needs. */
export interface PayloadReader {
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>;
}

export interface SearchSyncDeps {
  index: SearchIndexClient;
  /** Re-read the published state. `null` when the document is gone. */
  resolve: (
    collection: SearchSyncedCollection,
    id: string,
  ) => Promise<SearchSyncSource | null>;
  indexNameFor: (collection: SearchSyncedCollection) => string;
  now?: Date;
  onError?: (message: string, error: unknown) => void;
}

/**
 * Re-read, decide, write. This is the whole of what the webhook route did,
 * minus the HTTP envelope and minus Sanity.
 */
export async function runSearchSync(
  target: { collection: SearchSyncedCollection; id: string; deleted?: boolean },
  deps: SearchSyncDeps,
): Promise<SearchIndexOperation> {
  const source = target.deleted ? null : await deps.resolve(target.collection, target.id);
  const operation = planSearchSync(target.collection, target.id, source, deps.now);
  return applySearchSync(operation, deps.indexNameFor(target.collection), deps.index);
}

/** The plan's named entry points, for readability at the call sites. */
export const onCaseStudyChange = (id: string, deps: SearchSyncDeps) =>
  runSearchSync({ collection: "caseStudies", id }, deps);
export const onNewsChange = (id: string, deps: SearchSyncDeps) =>
  runSearchSync({ collection: "newsPosts", id }, deps);
export const onAgendaChange = (id: string, deps: SearchSyncDeps) =>
  runSearchSync({ collection: "agendas", id }, deps);

// ---------------------------------------------------------------------------
// Deferral — the part that keeps the network call out of the transaction
// ---------------------------------------------------------------------------

/** Ceiling on one deferred sync, so a hung transport cannot leak an invocation. */
const SYNC_TIMEOUT_MS = 15_000;

/**
 * Documents whose sync is queued but has not begun reading yet. A second write
 * to the same document in that window is redundant — the queued read has not
 * happened, so it will still see the later write's state. The key is removed
 * the instant the read starts, so a write that lands afterwards queues again.
 */
const queued = new Set<string>();

/**
 * The deferral itself — `after()` inside a request, detached outside one, and
 * tracked so `flushSearchSync()` can await it — lives in
 * `payload/hooks/after-commit.ts`, shared with the cache-revalidation hook.
 * These two names are kept for the callers and tests that already use them.
 */
export const flushSearchSync = flushDeferred;
export const pendingSearchSyncCount = pendingDeferredCount;

// ---------------------------------------------------------------------------
// The collection hooks
// ---------------------------------------------------------------------------

/**
 * Exported for the guard's test only; live callers reach it through
 * `scheduleSearchSync`.
 *
 * `lib/algolia` is imported dynamically and only when a sync actually runs: it
 * runs `dotenv.config()` and constructs two Algolia clients at module load, and
 * `payload.config.ts` is loaded by `payload migrate`, by every `tsx` import
 * script and by the Next build, none of which should pay for that — or should
 * be able to fail on it.
 */
export async function liveDeps(
  payload: PayloadReader | undefined,
  collection: SearchSyncedCollection,
): Promise<SearchSyncDeps | null> {
  const { ALGOLIA_INDICES, liveIndexWritesAllowed, writeIndexName } = await import("@/lib/algolia-indices");
  // Decided before `lib/algolia` is even imported, so a refused environment
  // never constructs a client. Outside Vercel production an unprefixed write
  // would hit the live index the site searches — from `next dev`, a preview,
  // or an import into the dev database. See `liveIndexWritesAllowed`.
  if (!liveIndexWritesAllowed()) {
    console.warn(
      `[search-sync:${collection}] not Vercel production and ALGOLIA_INDEX_PREFIX is unset — ` +
        "refusing to write to the live index. Set a prefix to sync to a scratch index.",
    );
    return null;
  }
  const { algoliaClient } = await import("@/lib/algolia");
  if (!algoliaClient) {
    // Same posture as the webhook: not configured is not an error.
    console.warn(`[search-sync:${collection}] Algolia not configured — skipping`);
    return null;
  }
  return {
    index: algoliaClient as unknown as SearchIndexClient,
    indexNameFor: (c) => writeIndexName(ALGOLIA_INDICES[SEARCH_INDEX_KEY[c]]),
    resolve: (c, id) => resolvePublishedSource(payload, c, id),
    onError: (message, error) => console.error(`[search-sync:${collection}] ${message}:`, error),
  };
}

/**
 * The published-state re-read, in two parts.
 *
 * 1. `payload.find` with **no `draft` flag**, which reads the main table. On a
 *    drafts-enabled collection that row is the last *published* state — saving
 *    a draft writes only to `_versions` — so this is exactly the document an
 *    anonymous visitor sees, which is what the index should mirror.
 * 2. the index-doc reader, which builds the projection the record is made from.
 *
 * Both run through `payload`'s own instance rather than through `req`, because
 * `req`'s transaction is finished by the time this runs. Reading after the
 * commit is the point: the index can never hold a row that rolled back.
 */
async function resolvePublishedSource(
  payload: PayloadReader | undefined,
  collection: SearchSyncedCollection,
  id: string,
): Promise<SearchSyncSource | null> {
  if (!payload) return null;

  const found = await payload.find({
    collection,
    where: { id: { equals: id } },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const row = found.docs[0] as { _status?: string } | undefined;
  if (!row) return null;
  // A collection without `versions.drafts` carries no `_status` at all; that is
  // published by definition. `agendas` is the one here.
  const published = row._status === undefined || row._status === "published";

  const doc = await readIndexDoc(collection, id);
  if (!doc) return null;
  return { published, doc };
}

/**
 * The index-doc readers, imported dynamically for the same reason as
 * `lib/algolia` — and read from the **Payload arm directly**, not through the
 * `CONTENT_BACKEND` seam. A Payload hook must reflect what Payload just wrote;
 * it must not read Sanity because a flag says `sanity`. Task 16 settled the
 * same question for the moderation bookkeeping write.
 *
 * `...ByIds([id])` rather than `...ById(id)` deliberately: for agendas those
 * two readers differ — `ByIds` dereferences `files` and `ById` does not — and
 * `files` is the shape the live index holds. See the header.
 *
 * `{ fresh: true }` is not optional either. The default `query()` primitive
 * caches for an hour under the blanket content tag, so a sync running moments
 * after a write would index the document **as it was before the edit**. `fresh`
 * routes through `queryLive` — same published-only read, no cache. It is also
 * what lets a script call these at all: `unstable_cache` throws
 * `Invariant: incrementalCache missing` outside a request.
 */
async function readIndexDoc(
  collection: SearchSyncedCollection,
  id: string,
): Promise<SearchIndexSource | null> {
  if (collection === "caseStudies") {
    const { getCaseStudyIndexDocsByIds } = await import("@/lib/content/internal/payload/case-studies");
    return (await getCaseStudyIndexDocsByIds([id], { fresh: true }))[0] ?? null;
  }
  if (collection === "newsPosts") {
    const { getNewsIndexDocsByIds } = await import("@/lib/content/internal/payload/news");
    return (await getNewsIndexDocsByIds([id], { fresh: true }))[0] ?? null;
  }
  const { getAgendaIndexDocsByIds } = await import("@/lib/content/internal/payload/outputs");
  return (await getAgendaIndexDocsByIds([id], { fresh: true }))[0] ?? null;
}

// ---------------------------------------------------------------------------
// Tag fan-out (tag audit 2026-09-17)
// ---------------------------------------------------------------------------

/**
 * A tag's labels and slug are copied into every search record of the content
 * that carries it, so a rename has to re-index that content. Bounded: no tag
 * is on more than a few dozen documents today, and the ceiling keeps a
 * runaway from pinning an invocation.
 */
export const TAG_FANOUT_LIMIT = 500;

export async function findTagReferences(
  payload: PayloadReader,
  tagId: string,
): Promise<Array<{ collection: SearchSyncedCollection; id: string }>> {
  const refs: Array<{ collection: SearchSyncedCollection; id: string }> = [];
  for (const collection of SEARCH_SYNCED_COLLECTIONS) {
    const found = await payload.find({
      collection,
      where: { tags: { in: [tagId] } },
      select: { id: true },
      depth: 0,
      limit: TAG_FANOUT_LIMIT,
      pagination: false,
      overrideAccess: true,
    });
    for (const row of found.docs) {
      const id = (row as { id?: unknown }).id;
      if (typeof id === "string" || typeof id === "number") refs.push({ collection, id: String(id) });
    }
  }
  return refs;
}

/** After the tag's own write commits: find what carries it and queue each sync. */
export function scheduleTagReindex(
  tagId: string,
  payload: PayloadReader | undefined,
  options: { deps?: SearchSyncDeps | null } = {},
): void {
  if (!payload) return;
  runAfterCommit(async () => {
    const refs = await findTagReferences(payload, tagId);
    for (const ref of refs) scheduleSearchSync(ref.collection, ref.id, { payload, deps: options.deps });
  });
}

function queueKey(collection: SearchSyncedCollection, id: string): string {
  return `${collection}:${id}`;
}

/**
 * Schedule one document's sync. Shared by `afterChange` and `afterDelete`.
 *
 * Returns nothing: the caller must not be able to await it by accident. That is
 * the whole design — see the header.
 */
export function scheduleSearchSync(
  collection: SearchSyncedCollection,
  id: string,
  options: {
    deleted?: boolean;
    payload?: PayloadReader;
    /** Injected by tests; live callers leave it out and get the real client. */
    deps?: SearchSyncDeps | null;
  } = {},
): void {
  const key = queueKey(collection, id);
  if (!options.deleted && queued.has(key)) return;
  if (!options.deleted) queued.add(key);

  const run = async () => {
    // Cleared before the read, not after: a write landing while this one is
    // reading must be able to queue its own sync.
    queued.delete(key);
    const deps =
      options.deps !== undefined ? options.deps : await liveDeps(options.payload, collection);
    if (!deps) return;
    return runSearchSync({ collection, id, deleted: options.deleted }, deps);
  };

  const bounded = () =>
    withTimeout(run(), SYNC_TIMEOUT_MS, `the search sync for ${collection} ${id}`).catch((error) => {
      queued.delete(key);
      console.error(`[search-sync:${collection}] ${id} failed:`, error);
    });

  // `track` runs now, synchronously, so the work is observable to
  // `flushSearchSync()` the moment it is scheduled. Nothing awaits it here.
  void track(defer(bounded));
}

export function searchSyncAfterChange(
  collection: SearchSyncedCollection,
  deps?: SearchSyncDeps | null,
): CollectionAfterChangeHook {
  return ({ doc, req, operation }) => {
    if (req?.context?.[SKIP_SEARCH_SYNC]) return doc;
    if (operation !== "create" && operation !== "update") return doc;
    const id = (doc as { id?: unknown })?.id;
    if (typeof id !== "string" || id.length === 0) return doc;
    // Scheduling only — nothing here is awaited, so the write's transaction is
    // not held open behind an Algolia round trip. See the header.
    scheduleSearchSync(collection, id, { payload: req?.payload as never, deps });
    return doc;
  };
}

export function searchSyncAfterDelete(
  collection: SearchSyncedCollection,
  deps?: SearchSyncDeps | null,
): CollectionAfterDeleteHook {
  return ({ doc, id, req }) => {
    if (req?.context?.[SKIP_SEARCH_SYNC]) return doc;
    const objectID = typeof id === "string" ? id : (doc as { id?: unknown })?.id;
    if (typeof objectID !== "string" || objectID.length === 0) return doc;
    scheduleSearchSync(collection, objectID, { deleted: true, payload: req?.payload as never, deps });
    return doc;
  };
}
