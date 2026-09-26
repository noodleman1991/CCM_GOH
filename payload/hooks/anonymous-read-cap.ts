import type { CollectionBeforeOperationHook, CollectionConfig } from "payload";
import { hasEditorRole } from "@/payload/access";

/**
 * Bound what one anonymous REST read can ask for.
 *
 * Payload's `find` treats `limit=0` and `pagination=false` as "return every
 * row" (`payload/dist/collections/operations/find.js`), and `/payload-api` is
 * reachable without a session. Nothing public in this app reads Payload over
 * REST — the site uses the Local API — so an anonymous
 * `GET /payload-api/caseStudies?limit=0&locale=all` in a loop was pure cost
 * against Neon with no legitimate caller behind it.
 *
 * Only the anonymous REST path is capped:
 *
 *   - a REST request arrives with `overrideAccess` unset (the endpoint passes
 *     none) and the Local API sets it to `true` explicitly. Every reader under
 *     `lib/content/internal/payload` uses `pagination: false` deliberately and
 *     must not be touched.
 *   - editors keep the admin's full paging; the cap is for callers with no
 *     user at all, and for members, who have no business listing the CMS.
 *
 * Applied to every collection through `withAnonymousReadCap` in
 * `payload.config.ts`, by mapping, so none can be forgotten. Depth is capped
 * globally with `maxDepth` in the same config.
 */
export const ANONYMOUS_MAX_LIMIT = 100;

const registry = new WeakSet<object>();

export function isAnonymousReadCapHook(fn: unknown): boolean {
  return typeof fn === "function" && registry.has(fn);
}

export const capAnonymousReads: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== "read") return args;
  const a = args as { overrideAccess?: boolean; limit?: number; pagination?: boolean };
  // The Local API defaults `overrideAccess` to `true` explicitly
  // (`operations/local/find.js`); the REST endpoint passes nothing at all
  // (`collections/endpoints/find.js`), so it arrives here as `undefined`.
  // Anything that is not the explicit Local-API `true` is an external read.
  if (a.overrideAccess === true) return args;
  if (hasEditorRole(req?.user)) return args;

  if (a.pagination === false) a.pagination = true;
  if (a.limit === 0 || (typeof a.limit === "number" && a.limit > ANONYMOUS_MAX_LIMIT)) {
    a.limit = ANONYMOUS_MAX_LIMIT;
  }
  return args;
};
registry.add(capAnonymousReads);

/** Prepend the cap to a collection's `beforeOperation` hooks, keeping whatever it declared. */
export function withAnonymousReadCap(collection: CollectionConfig): CollectionConfig {
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeOperation: [capAnonymousReads, ...(collection.hooks?.beforeOperation ?? [])],
    },
  };
}
