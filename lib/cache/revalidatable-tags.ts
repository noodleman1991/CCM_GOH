import { CONTENT_CACHE_TAG } from "@/lib/cache/payload-tags";

/**
 * The tags `POST /api/cache/revalidate` will invalidate on request.
 *
 * A module of its own rather than a constant in the route file: Next
 * type-checks a route module's exports against the handler signature, so the
 * list cannot be exported from there for a test to read.
 *
 * `CONTENT_CACHE_TAG` joined the list on 2026-09-16. Until then nothing
 * outside the moderation hook could evict a Payload read — an operator who
 * had just re-imported content had no lever but the one-hour TTL.
 */
export const REVALIDATABLE_CACHE_TAGS = [
  "onboarding-content",
  "work-types",
  "expertise-areas",
  "user-management",
  "general-content",
  CONTENT_CACHE_TAG,
] as const;

export type RevalidatableCacheTag = (typeof REVALIDATABLE_CACHE_TAGS)[number];
