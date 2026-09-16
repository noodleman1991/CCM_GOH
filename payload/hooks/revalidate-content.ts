import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
} from "payload";
import { CONTENT_CACHE_TAG, collectionCacheTag, globalCacheTag } from "@/lib/cache/payload-tags";
import { flushDeferred, runAfterCommit, withTimeout } from "@/payload/hooks/after-commit";

/**
 * Cache revalidation for every Payload write.
 *
 * ---------------------------------------------------------------------------
 * The gap this closes
 * ---------------------------------------------------------------------------
 *
 * `lib/content/internal/payload-source.ts` caches every `queryLive` read for
 * an hour under `unstable_cache`, tagged `"payload"`. Until 2026-09-16 the
 * only code that revalidated that tag was `moderationAfterChange`, on four
 * collections, and only when a moderation status changed. So:
 *
 *   - editing a news post, a page, an agenda, a tag, an author, an
 *     organization or any global in `/admin` was invisible on the site for up
 *     to an hour;
 *   - the admin route `POST /api/cache/revalidate` did not know the tag, so an
 *     operator had no lever either;
 *   - the Sanity arm this replaces had a publish webhook
 *     (`app/api/webhooks/sanity/route.ts`) that revalidated on every publish.
 *
 * `withContentRevalidation` is applied to EVERY collection in
 * `payload.config.ts` (bar the two in `REVALIDATION_EXEMPT_COLLECTIONS`) and
 * `withGlobalRevalidation` to every global, by mapping over the arrays rather
 * than by editing each file — so a collection added next year cannot be
 * forgotten. `lib/__tests__/payload-content-revalidation.test.ts` checks the
 * resolved config.
 *
 * ---------------------------------------------------------------------------
 * What is revalidated, and when
 * ---------------------------------------------------------------------------
 *
 * Both the blanket tag and the collection's own — see `lib/cache/payload-tags.ts`
 * for why the blanket tag is still fired. It runs AFTER the transaction
 * commits, through `after-commit.ts`: revalidating inside the transaction
 * (which the moderation hook still does) lets a concurrent request refill the
 * cache with the pre-commit row and then serve that for an hour.
 *
 * `shouldRevalidateContent` skips writes that cannot change what an anonymous
 * reader sees: a draft-only save on a drafts-enabled collection, and a member
 * submission that is pending review. Everything else — a publish, an edit to
 * a published document, an unpublish, a moderation transition either way, any
 * write to a collection without drafts, any delete — evicts.
 *
 * `SKIP_CONTENT_REVALIDATION` on the write's `context` stands the hook down,
 * in the same family as `SKIP_SEARCH_SYNC` and `SKIP_MODERATION_SIDE_EFFECTS`;
 * the import scripts set all three (`IMPORT_WRITE_CONTEXT`). A re-import runs
 * outside a request scope anyway, where `revalidateTag` cannot work, so the
 * operator revalidates once afterwards through `/api/cache/revalidate`.
 */

/** Set on a write's `context` to suppress revalidation for that write only. */
export const SKIP_CONTENT_REVALIDATION = "skipContentRevalidation";

/**
 * Collections no anonymous reader is ever served from, so a write to them
 * has nothing to evict: `users` is the admin-auth mirror, `caseStudyDrafts`
 * is a member's private autosave — and the latter is written on every save
 * of the submission form, which would otherwise evict the whole site each
 * time a member pauses typing.
 */
export const REVALIDATION_EXEMPT_COLLECTIONS: ReadonlySet<string> = new Set(["users", "caseStudyDrafts"]);

/** Ceiling on one deferred revalidation; `revalidateTag` is local and fast. */
const REVALIDATE_TIMEOUT_MS = 5_000;

export interface ContentRevalidationDeps {
  revalidate: (tags: string[]) => Promise<void>;
}

const liveDeps: ContentRevalidationDeps = {
  revalidate: async (tags) => {
    const { revalidateTag } = await import("next/cache");
    for (const tag of tags) revalidateTag(tag, "max");
  },
};

type Doc = Record<string, unknown> & { _status?: unknown; moderationStatus?: unknown };

/**
 * Could an anonymous reader be served this row? Mirrors the public gates in
 * `payload/access`: not a draft, and either no moderation state or
 * `approved` (an unset status counts as visible — lived experiences carry
 * none and are public). Payload passes `previousDoc: {}` on create; an empty
 * object is "there was nothing", not "there was something visible".
 */
function publiclyVisible(doc: Doc | undefined): boolean {
  if (!doc || Object.keys(doc).length === 0) return false;
  if (doc._status === "draft") return false;
  const moderation = doc.moderationStatus;
  if (moderation != null && moderation !== "approved") return false;
  return true;
}

export function shouldRevalidateContent(change: {
  operation: "create" | "update" | "delete";
  doc?: Doc;
  previousDoc?: Doc;
}): boolean {
  if (change.operation === "delete") return true;
  return publiclyVisible(change.doc) || publiclyVisible(change.previousDoc);
}

/** Hooks this module created, so the wiring test can recognise them. */
const registry = new WeakSet<object>();

export function isContentRevalidationHook(fn: unknown): boolean {
  return typeof fn === "function" && registry.has(fn);
}

function schedule(tags: string[], deps: ContentRevalidationDeps, label: string): void {
  runAfterCommit(() =>
    withTimeout(deps.revalidate(tags), REVALIDATE_TIMEOUT_MS, `revalidating ${label}`).catch((error) => {
      // A tag that cannot be pushed must not fail the write that already
      // succeeded; the TTL is the backstop.
      console.error(`[revalidate:${label}] failed:`, error);
    }),
  );
}

export function contentRevalidationAfterChange(
  slug: string,
  deps: ContentRevalidationDeps = liveDeps,
): CollectionAfterChangeHook {
  const hook: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
    if (req?.context?.[SKIP_CONTENT_REVALIDATION]) return doc;
    if (shouldRevalidateContent({ operation, doc: doc as Doc, previousDoc: previousDoc as Doc | undefined })) {
      schedule([CONTENT_CACHE_TAG, collectionCacheTag(slug)], deps, slug);
    }
    return doc;
  };
  registry.add(hook);
  return hook;
}

export function contentRevalidationAfterDelete(
  slug: string,
  deps: ContentRevalidationDeps = liveDeps,
): CollectionAfterDeleteHook {
  const hook: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (req?.context?.[SKIP_CONTENT_REVALIDATION]) return doc;
    schedule([CONTENT_CACHE_TAG, collectionCacheTag(slug)], deps, slug);
    return doc;
  };
  registry.add(hook);
  return hook;
}

export function globalRevalidationAfterChange(
  slug: string,
  deps: ContentRevalidationDeps = liveDeps,
): GlobalAfterChangeHook {
  const hook: GlobalAfterChangeHook = async ({ doc, req }) => {
    if (req?.context?.[SKIP_CONTENT_REVALIDATION]) return doc;
    schedule([CONTENT_CACHE_TAG, globalCacheTag(slug)], deps, `global:${slug}`);
    return doc;
  };
  registry.add(hook);
  return hook;
}

/** Append the two revalidation hooks to a collection, keeping whatever it declared. */
export function withContentRevalidation(collection: CollectionConfig): CollectionConfig {
  if (REVALIDATION_EXEMPT_COLLECTIONS.has(collection.slug)) return collection;
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      afterChange: [...(collection.hooks?.afterChange ?? []), contentRevalidationAfterChange(collection.slug)],
      afterDelete: [...(collection.hooks?.afterDelete ?? []), contentRevalidationAfterDelete(collection.slug)],
    },
  };
}

/** Append the revalidation hook to a global, keeping whatever it declared. */
export function withGlobalRevalidation(global: GlobalConfig): GlobalConfig {
  return {
    ...global,
    hooks: {
      ...global.hooks,
      afterChange: [...(global.hooks?.afterChange ?? []), globalRevalidationAfterChange(global.slug)],
    },
  };
}

/** For tests: await every scheduled revalidation. */
export const flushContentRevalidation = flushDeferred;
