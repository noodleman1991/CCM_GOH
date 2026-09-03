import { safe } from "@/lib/content/internal/safe";
import { createDocument, query, queryLive, queryRaw, updateDocument } from "@/lib/content/internal/sanity-source";
import type { ContentKind } from "@/lib/content/types";
import type { SanityPlace } from "@/types/case-study";
import type { CommentTargetType } from "@/generated/prisma";
import { generateEventSlug } from "@/lib/validation/event";

// ---------------------------------------------------------------------------
// Dynamic content inserts (lib/dynamic-queries.ts)
// ---------------------------------------------------------------------------

/** A loosely-shaped row from one of the dynamic-content queries below — the
 *  projection differs per content kind, and every known consumer (dashboard
 *  recent-news list, the /api/dynamic-content route) already treats the
 *  result as a loosely-typed record rather than a strict interface. */
export interface DiscoveryItem {
  _id: string;
  [key: string]: unknown;
}

export type DynamicContentMode = "recent" | "featured";

export interface DynamicOptions {
  communitySlug: string;
  /** The raw `$count` GROQ param, already adjusted by the caller. */
  count: number;
  mode: DynamicContentMode;
}

const RECENT_NEWS_QUERY = `
    *[_type == "newsPost" &&
      defined(relatedCommunity) &&
      relatedCommunity->slug.current == $communitySlug
    ] | order(publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      image {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      author->{
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `;

const RECENT_CASE_STUDIES_QUERY = `
    *[_type == "caseStudy" &&
      status == "approved" &&
      references(*[_type == "regionalCommunity" && slug.current == $communitySlug][0]._id)
    ] | order(publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      image {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      authors[]{
        name,
        affiliation->{
          name,
          slug
        }
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `;

const RECENT_LIVED_EXPERIENCES_QUERY = `
    *[_type == "livedExperience" &&
      (status == "approved" || !defined(status)) &&
      defined(relatedCommunity) &&
      relatedCommunity->slug.current == $communitySlug
    ] | order(publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      description,
      issue,
      personContext,
      publishedAt,
      videoLink,
      duration,
      thumbnail {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      author->{
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `;

const FEATURED_NEWS_QUERY = `
    *[_type == "newsPost" &&
      defined(relatedCommunity) &&
      relatedCommunity->slug.current == $communitySlug
    ] | order(featured desc, publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      featured,
      image {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      author->{
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `;

const FEATURED_CASE_STUDIES_QUERY = `
    *[_type == "caseStudy" &&
      status == "approved" &&
      references(*[_type == "regionalCommunity" && slug.current == $communitySlug][0]._id)
    ] | order(featured desc, publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      featured,
      image {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      authors[]{
        name,
        affiliation->{
          name,
          slug
        }
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `;

const FEATURED_LIVED_EXPERIENCES_QUERY = `
    *[_type == "livedExperience" &&
      (status == "approved" || !defined(status)) &&
      defined(relatedCommunity) &&
      relatedCommunity->slug.current == $communitySlug
    ] | order(featured desc, publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      description,
      issue,
      personContext,
      publishedAt,
      featured,
      videoLink,
      duration,
      thumbnail {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      author->{
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `;

const DYNAMIC_CONTENT_QUERIES: Partial<Record<ContentKind, Record<DynamicContentMode, string>>> = {
  newsPost: { recent: RECENT_NEWS_QUERY, featured: FEATURED_NEWS_QUERY },
  caseStudy: { recent: RECENT_CASE_STUDIES_QUERY, featured: FEATURED_CASE_STUDIES_QUERY },
  livedExperience: { recent: RECENT_LIVED_EXPERIENCES_QUERY, featured: FEATURED_LIVED_EXPERIENCES_QUERY },
};

/**
 * Predefined "dynamic content insert" query for a regional-community page —
 * recent or featured-first news/case studies/lived experiences for that
 * community. Kinds outside the three above (researchOutput/agenda/event)
 * have no dynamic-insert query and resolve to `[]`.
 *
 * Not wrapped in `safe()`: the two call sites that fed this (dynamic-queries.ts's
 * `executePredefinedQuery`, the /api/dynamic-content route indirectly through
 * it) already carry their own try/catch, so this lets errors propagate and
 * preserves their existing degrade-to-null behaviour rather than doubling it.
 */
export async function getDynamicContent(
  kind: ContentKind,
  options: DynamicOptions,
): Promise<DiscoveryItem[]> {
  const groq = DYNAMIC_CONTENT_QUERIES[kind]?.[options.mode];
  if (!groq) return [];
  const result = await query<DiscoveryItem[] | null>(groq, {
    communitySlug: options.communitySlug,
    count: options.count,
  });
  return result ?? [];
}

// ---------------------------------------------------------------------------
// Discovery filter options (lib/discovery/options.ts)
// ---------------------------------------------------------------------------

export interface DiscoveryRegionOption {
  slug: string;
  name: Record<string, string> | string | null;
}

export interface DiscoveryTagOption {
  value: string;
  label: Record<string, string> | string | null;
}

export interface DiscoveryFacets {
  regions: DiscoveryRegionOption[];
  tags: DiscoveryTagOption[];
}

/**
 * Raw region + tag option rows for the discovery/collaborate filter bars.
 * The two reads degrade independently (matching the original's two separate
 * try/catches) so a region-fetch failure doesn't also blank out tags.
 */
export async function getDiscoveryOptions(): Promise<DiscoveryFacets> {
  const [regions, tags] = await Promise.all([
    safe("discovery-regions", [] as DiscoveryRegionOption[], () =>
      query<DiscoveryRegionOption[]>(
        `*[_type == "regionalCommunity" && defined(slug.current)] | order(name asc){ "slug": slug.current, name }`,
      ),
    ),
    safe("discovery-tags", [] as DiscoveryTagOption[], () =>
      query<DiscoveryTagOption[]>(
        `*[_type == "tag" && defined(value)] | order(value asc){ value, label }`,
      ),
    ),
  ]);
  return { regions, tags };
}

// ---------------------------------------------------------------------------
// "For you" candidates (lib/follows/for-you.ts)
// ---------------------------------------------------------------------------

export interface ForYouCandidateRow {
  _id: string;
  _type: string;
  title: string | null;
  slug: string | null;
  region: string | null;
  rcSlug: string | null;
  tagSlugs: (string | null)[] | null;
}

/**
 * Not wrapped in `safe()` — the one call site (lib/follows/for-you.ts's
 * `getForYou`) already wraps this in its own try/catch and logs a distinct
 * `[for-you]` warning; preserving that rather than doubling the degrade.
 */
export async function getForYouCandidates(input: {
  regionCodes: string[];
  regionSlugs: string[];
  themeSlugs: string[];
  limit: number;
}): Promise<ForYouCandidateRow[]> {
  return query<ForYouCandidateRow[]>(
    `*[_type in ["caseStudy", "livedExperience", "newsPost"]
         && (status == "approved" || (!defined(status) && _type == "newsPost"))
         && defined(slug.current)
         && (region in $regionCodes
             || relatedCommunity->slug.current in $regionSlugs
             || count((tags[]->value.current)[@ in $themeSlugs]) > 0)
       ] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...$limit]{
         _id, _type,
         "title": coalesce(title.en, title),
         "slug": slug.current,
         region,
         "rcSlug": relatedCommunity->slug.current,
         "tagSlugs": tags[]->value.current
       }`,
    {
      regionCodes: input.regionCodes,
      regionSlugs: input.regionSlugs,
      themeSlugs: input.themeSlugs,
      limit: input.limit,
    },
  );
}

// ---------------------------------------------------------------------------
// All-posts block (components/blocks/all-posts.tsx)
// ---------------------------------------------------------------------------

type LocalizedText = string | Record<string, string> | null;

export interface NewsPostBlockItem {
  _id: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  slug: string | null;
  publishedAt: string;
  image?: {
    asset?: {
      _id: string;
      url: string | null;
      mimeType?: string | null;
      metadata?: { lqip?: string | null } | null;
    } | null;
    alt?: string | null;
  } | null;
  author?: { _id: string; name?: string | null } | null;
  tags?: Array<{
    _id: string;
    label: LocalizedText;
    color?: string | null;
  }> | null;
}

const NEWS_POST_BLOCK_FIELDS = `
  _id,
  _type,
  title,
  subtitle,
  excerpt,
  "slug": slug.current,
  publishedAt,
  _updatedAt,
  featured,
  image{
    asset->{
      _id,
      url,
      mimeType,
      metadata {
        lqip,
        dimensions {
          width,
          height
        }
      }
    },
    alt,
    caption
  },
  author->{
    _id,
    name,
    image,
    bio
  },
  tags[]->{
    _id,
    label,
    value,
    color,
    category
  },
  language
`;

export type AllPostsMode = "manual" | "featured" | "recent";

/**
 * News posts for the "all-posts" homepage/section block. Not wrapped in
 * `safe()` — the original threw straight out of the (async) component on a
 * fetch failure, and this preserves that.
 */
export async function getNewsPostsForBlock(
  mode: AllPostsMode,
  limit: number,
  manualIds?: string[],
): Promise<NewsPostBlockItem[]> {
  if (mode === "manual") {
    if (!manualIds || manualIds.length === 0) return [];
    return query<NewsPostBlockItem[]>(
      `*[_type == "newsPost" && _id in $ids] {
        ${NEWS_POST_BLOCK_FIELDS}
      }`,
      { ids: manualIds },
    );
  }

  if (mode === "featured") {
    const featured = await query<NewsPostBlockItem[]>(
      `*[_type == "newsPost" &&
        featured == true &&
        publishedAt <= now()
      ] | order(publishedAt desc)[0...${limit}] {
        ${NEWS_POST_BLOCK_FIELDS}
      }`,
    );

    if (featured.length >= limit) {
      return featured.slice(0, limit);
    }

    const remaining = limit - featured.length;
    const recent = await query<NewsPostBlockItem[]>(
      `*[_type == "newsPost" &&
        (!defined(featured) || featured == false) &&
        publishedAt <= now()
      ] | order(publishedAt desc)[0...${remaining}] {
        ${NEWS_POST_BLOCK_FIELDS}
      }`,
    );

    return [...featured, ...recent];
  }

  return query<NewsPostBlockItem[]>(
    `*[_type == "newsPost" &&
      publishedAt <= now()
    ] | order(publishedAt desc)[0...${limit}] {
      ${NEWS_POST_BLOCK_FIELDS}
    }`,
  );
}

// ---------------------------------------------------------------------------
// Collaboration output enrichment (lib/collaboration/public.ts, lib/collaboration/service.ts)
// ---------------------------------------------------------------------------

/** Public-project output slugs (lib/collaboration/public.ts's `getPublicProject`).
 *  Read-only display enrichment; the call site's own try/catch degrades to an
 *  empty map on failure, so this is left unwrapped. */
export async function getDocSlugs(ids: string[]): Promise<{ _id: string; slug: string | null }[]> {
  return query<{ _id: string; slug: string | null }[]>(
    `*[_id in $ids]{ _id, "slug": slug.current }`,
    { ids },
  );
}

/** Live title/status/slug for a workspace's linked outputs
 *  (lib/collaboration/service.ts's `getOutputs`) — display enrichment only,
 *  the cached Prisma row remains the fallback. Left unwrapped: the call
 *  site's own try/catch already degrades on failure. */
export async function getOutputSummaries(
  ids: string[],
): Promise<{ _id: string; title: string | null; status: string | null; slug: string | null }[]> {
  return query<{ _id: string; title: string | null; status: string | null; slug: string | null }[]>(
    `*[_id in $ids || ("drafts." + _id) in $ids]{ _id, "title": coalesce(title.en, title), status, "slug": slug.current }`,
    { ids },
  );
}

/**
 * Live title/status for a workspace's linked outputs, used to REFRESH the
 * cached Prisma rows (lib/collaboration/service.ts's `refreshOutputStatuses`)
 * — a read that feeds a write (and drives notification fan-out), so this
 * uses `queryRaw` rather than the cached `query()` the sibling read above
 * uses: a stale cached title/status here would persist a stale value into
 * Postgres and could fire (or skip) an X3/X5 notification on phantom data.
 */
export async function getOutputStatuses(
  ids: string[],
): Promise<{ _id: string; title?: string; status?: string }[]> {
  return queryRaw<{ _id: string; title?: string; status?: string }[]>(
    `*[_id in $ids || ("drafts." + _id) in $ids]{ _id, "title": coalesce(title.en, title), status }`,
    { ids },
  );
}

// ---------------------------------------------------------------------------
// Workspace output draft creation (lib/actions/workspace-outputs.ts) — a write.
// ---------------------------------------------------------------------------

/**
 * Create a Sanity DRAFT of a workspace output type (`addOutput`'s "create"
 * mode). Enters the existing review pipeline (status "pending" by default
 * for the moderated types). A write: never wrapped in `safe()`.
 */
export async function createWorkspaceOutputDraft(
  sanityType: string,
  title: string,
): Promise<{ id: string }> {
  return createDocument({
    _type: sanityType,
    _id: `drafts.${crypto.randomUUID()}`,
    title: { en: title },
    status: "pending",
  });
}

// ---------------------------------------------------------------------------
// Comment target resolution (lib/comments/target.ts)
// ---------------------------------------------------------------------------

export interface CommentTarget {
  type: CommentTargetType;
  id: string;
}

/** Re-asserts the public predicate for each Sanity-backed comment target type
 *  (e.g. caseStudy must be `status == "approved"`) — guards the ISR staleness
 *  window and a client aiming the polymorphic targetId at an arbitrary doc. */
const SANITY_COMMENT_PREDICATE: Partial<Record<CommentTargetType, string>> = {
  caseStudy: '_type == "caseStudy" && status == "approved"',
  newsPost: '_type == "newsPost"',
  livedExperience: '_type == "livedExperience" && (status == "approved" || !defined(status))',
  researchOutput: '_type == "researchOutput" && status == "approved"',
  event: '_type == "event" && status == "approved"',
};

/**
 * Resolve a Sanity-backed comment target: null if `type` isn't Sanity-backed
 * (workspace thread/file/doc targets are Postgres-only and stay entirely in
 * lib/comments/target.ts) or the document doesn't exist / doesn't satisfy
 * its public predicate. This is the boundary Prisma's polymorphic
 * `Comment.targetId` reaches content through — Phase 3 swaps the backend
 * beneath it, so its signature must not change.
 *
 * Uses `queryLive`, not `query`: this is a write-time authorization gate
 * (it decides whether a comment write is allowed), and `id` is
 * client-supplied (`lib/comments/target.ts`'s own doc comment: this guards
 * against "a client aiming the polymorphic targetId at an arbitrary
 * document"), so a document withdrawn or un-approved must stop validating
 * immediately, not up to an hour later via `query()`'s cache. Same
 * caching reasoning as `getApprovedEventForRsvp`.
 *
 * NOT `queryRaw`: an earlier revision used `queryRaw` to fix exactly that
 * caching problem, but `queryRaw` also switches to the write client's `raw`
 * perspective, which sees documents that only exist as unpublished drafts
 * (`drafts.<id>`). Because `id` here is attacker-controllable, that let a
 * client submit a `drafts.`-prefixed target id for a document whose *draft*
 * satisfies the predicate (e.g. a draft edit with `status: "approved"`) even
 * though nothing with that id has ever been published — an authorization
 * bypass the original `client.fetch` (published perspective, per
 * `git show 87ef869bc:lib/comments/target.ts`) could not have had. `queryLive`
 * is both live (no cache) and published-only (no draft visibility), so it is
 * the more faithful restoration of the original, not just a caching fix.
 *
 * Degrades to null on failure (mirrors the original's try/catch → ok=false),
 * matching every other public-facing existence check.
 */
export async function resolveCommentTarget(
  type: CommentTargetType,
  id: string,
): Promise<CommentTarget | null> {
  const predicate = SANITY_COMMENT_PREDICATE[type];
  if (!predicate) return null;
  return safe(`comment-target-${type}`, null, async () => {
    const count = await queryLive<number>(`count(*[${predicate} && _id == $id])`, { id });
    return count > 0 ? { type, id } : null;
  });
}

// ---------------------------------------------------------------------------
// Comment moderation settings (lib/comments/moderation.ts)
// ---------------------------------------------------------------------------

export interface ModerationSettings {
  enabled: boolean;
  blockTerms: string[];
  reviewTerms: string[];
}

const DEFAULT_MODERATION_SETTINGS: ModerationSettings = { enabled: true, blockTerms: [], reviewTerms: [] };

/**
 * The CMS-managed comment wordlists. Fails open (filtering effectively off)
 * for availability — anonymous comments are still held for review
 * regardless, per the original's own comment.
 *
 * `queryLive`, not `query` — the original (`lib/comments/moderation.ts`) was
 * a bare `client.fetch`, with no `next.revalidate`: the only staleness was
 * the module's own 60-second in-process TTL below. `moderateBody()` is the
 * gate that decides whether a comment is blocked, held, or published; a
 * `query()`-style hour-long cache stacked on top of that TTL would mean an
 * admin's new blocklist term might not take effect for up to an hour.
 */
export async function getModerationSettings(): Promise<ModerationSettings> {
  return safe("moderation-settings", DEFAULT_MODERATION_SETTINGS, async () => {
    const raw = await queryLive<Partial<ModerationSettings> | null>(
      `*[_type == "moderationSettings"][0]{ enabled, blockTerms, reviewTerms }`,
    );
    if (!raw) return DEFAULT_MODERATION_SETTINGS;
    return {
      enabled: raw.enabled ?? true,
      blockTerms: Array.isArray(raw.blockTerms) ? raw.blockTerms : [],
      reviewTerms: Array.isArray(raw.reviewTerms) ? raw.reviewTerms : [],
    };
  });
}

// ---------------------------------------------------------------------------
// Events (lib/events.ts) — the public events list + detail.
// ---------------------------------------------------------------------------

export interface ContentEvent {
  _id: string;
  title: string | null;
  description: string | null;
  scope: "community" | "project" | null;
  startAt: string | null;
  endAt: string | null;
  mode: "online" | "in_person" | "hybrid" | null;
  locationName: string | null;
  url: string | null;
  linkedProject: string | null;
  place?: SanityPlace | null;
  slug: string | null;
  recordingUrl?: string | null;
  relatedCollaboration?: string | null;
  coverImage?: { asset?: { url?: string | null } | null } | null;
  body?: unknown[] | null;
}

export interface EventFilter {
  /** List mode (default): cap the approved, soonest-first list. Default 50. */
  limit?: number;
  /** Detail mode: one approved event by slug — returns 0 or 1 items. */
  slug?: string;
}

const APPROVED_EVENTS_QUERY = `*[_type == "event" && status == "approved"] | order(startAt asc)[0...$limit]{
      _id, title, description, scope, startAt, endAt, mode, locationName, url, linkedProject,
      "slug": slug.current
    }`;

const EVENT_BY_SLUG_QUERY = `*[_type == "event" && status == "approved" && slug.current == $slug][0]{
      _id, title, description, scope, startAt, endAt, mode, locationName, url,
      "linkedProject": linkedProject, place,
      "slug": slug.current,
      recordingUrl,
      relatedCollaboration,
      coverImage{ asset->{ url } },
      body
    }`;

/**
 * Approved events, soonest-first (default), or one approved event by slug
 * when `filter.slug` is given. Only `status == "approved"` is public (the
 * moderation gate, mirroring case studies / lived experiences). Not wrapped
 * in `safe()` — both original functions (`fetchApprovedEvents`,
 * `fetchEventBySlug`) called `client.fetch` directly with no try/catch,
 * letting failures throw to their callers.
 */
export async function getEvents(filter: EventFilter = {}): Promise<ContentEvent[]> {
  if (filter.slug) {
    const event = await query<ContentEvent | null>(EVENT_BY_SLUG_QUERY, { slug: filter.slug });
    return event ? [event] : [];
  }
  return query<ContentEvent[]>(APPROVED_EVENTS_QUERY, { limit: filter.limit ?? 50 });
}

// ---------------------------------------------------------------------------
// Editable event (lib/events/edit.ts) — X7 tail, a gated drafts-visible read.
// ---------------------------------------------------------------------------

export interface RawEditableEventDoc {
  _id: string;
  title?: string;
  description?: string;
  scope?: string;
  startAt?: string;
  endAt?: string;
  mode?: string;
  locationName?: string;
  url?: string;
  submittedBy?: string;
  status?: string | null;
  reviewNotes?: string | null;
}

/**
 * Load an event (draft or published) by id for the edit form. Raw
 * perspective: drafts.* docs are invisible to the public read client, and
 * edit mode is exactly about reopening drafts. A read, not a write — but
 * gated and drafts-visible, so it throws on failure like the write paths
 * below rather than degrading via `safe()` (mirrors
 * lived-experiences.ts's `loadEditableLivedExperience`).
 */
export async function getEditableEventDoc(id: string): Promise<RawEditableEventDoc | null> {
  return queryRaw<RawEditableEventDoc | null>(
    `*[_type == "event" && (_id == $id || _id == "drafts." + $id)][0]{
      _id, title, description, scope, startAt, endAt, mode, locationName, url,
      submittedBy, status, reviewNotes
    }`,
    { id },
  );
}

// ---------------------------------------------------------------------------
// Event submission + edit-resubmission (app/api/events/submit/route.ts) —
// write paths. Writes throw, not degrade.
// ---------------------------------------------------------------------------

export interface EventInput {
  submittedBy: string;
  title: string;
  description: string | null;
  scope: "community" | "project";
  startAt: string;
  endAt: string | null;
  mode: "online" | "in_person" | "hybrid";
  locationName: string | null;
  url: string | null;
  linkedProject: string | null;
  /** Only set (as a reference) when present; never cleared on edit if omitted
   *  — mirrors the original route's `if (data.regionalCommunityId) doc.relatedCommunity = ...`. */
  regionalCommunityId?: string;
  /** Only set when present; never cleared on edit if omitted — mirrors the
   *  original route's `if (data.collaborationId) doc.relatedCollaboration = ...`. */
  relatedCollaboration?: string;
}

/** The minimal existence+ownership gate the submit route checks before
 *  allowing an edit-mode resubmission — a read that feeds the `updateEvent`
 *  write below, so it uses `queryRaw`. Distinct from `getEditableEventDoc`
 *  above: a different literal projection (no drafts-id fallback, 3 fields
 *  only) for a different call site (the submit route vs. the edit form). */
export async function getEventEditGate(
  id: string,
): Promise<{ _id: string; submittedBy: string | null; status: string | null } | null> {
  return queryRaw<{ _id: string; submittedBy: string | null; status: string | null } | null>(
    `*[_type == "event" && _id == $id][0]{ _id, submittedBy, status }`,
    { id },
  );
}

/** Create a PENDING `event` doc (brand-new submission). Status is forced to
 *  "pending" regardless of input — never trust the client. */
export async function submitEvent(input: EventInput): Promise<{ id: string }> {
  const doc: Record<string, unknown> = {
    _type: "event",
    status: "pending",
    submittedBy: input.submittedBy,
    title: input.title,
    slug: { _type: "slug", current: generateEventSlug(input.title) },
    description: input.description ?? undefined,
    scope: input.scope,
    startAt: input.startAt,
    endAt: input.endAt ?? undefined,
    mode: input.mode,
    locationName: input.locationName ?? undefined,
    url: input.url ?? undefined,
    linkedProject: input.scope === "project" ? input.linkedProject ?? undefined : undefined,
  };
  if (input.regionalCommunityId) {
    doc.relatedCommunity = { _type: "reference", _ref: input.regionalCommunityId };
  }
  if (input.relatedCollaboration) doc.relatedCollaboration = input.relatedCollaboration;

  return createDocument(doc);
}

/**
 * Patch an existing event doc for an X7 edit-mode resubmission — status
 * returns to "pending" for re-review, slug and submittedBy are untouched.
 * Every editable field the resubmission leaves blank is explicitly UNSET
 * (mirrors the original's `cleared`/`set` split), except `relatedCommunity`/
 * `relatedCollaboration`, which are only ever set, never cleared, when
 * omitted — same asymmetry as `submitEvent` and the original route.
 */
export async function updateEvent(id: string, patch: Partial<EventInput>): Promise<void> {
  const fields: Record<string, unknown> = {
    title: patch.title,
    description: patch.description ?? undefined,
    scope: patch.scope,
    startAt: patch.startAt,
    endAt: patch.endAt ?? undefined,
    mode: patch.mode,
    locationName: patch.locationName ?? undefined,
    url: patch.url ?? undefined,
    linkedProject: patch.scope === "project" ? patch.linkedProject ?? undefined : undefined,
  };
  const data: Record<string, unknown> = { status: "pending" };
  for (const [key, value] of Object.entries(fields)) {
    data[key] = value === undefined ? null : value;
  }
  if (patch.regionalCommunityId) {
    data.relatedCommunity = { _type: "reference", _ref: patch.regionalCommunityId };
  }
  if (patch.relatedCollaboration) data.relatedCollaboration = patch.relatedCollaboration;

  await updateDocument(id, data);
}

// ---------------------------------------------------------------------------
// RSVP event gate (lib/actions/rsvp.ts)
// ---------------------------------------------------------------------------

export interface EventRsvpMeta {
  _id: string;
  title: string | null;
  startAt: string | null;
  slug: string | null;
  submittedBy: string | null;
}

/**
 * The approved event's receipt fields — only approved events take RSVPs.
 * A read that feeds a write (`setRsvp`'s upsert is gated on this existing),
 * so this uses `queryRaw` rather than the cached `query()`.
 */
export async function getApprovedEventForRsvp(eventId: string): Promise<EventRsvpMeta | null> {
  return queryRaw<EventRsvpMeta | null>(
    `*[_type == "event" && _id == $id && status == "approved"][0]{
      _id, title, startAt, "slug": slug.current, submittedBy
    }`,
    { id: eventId },
  );
}

// ---------------------------------------------------------------------------
// Event reminders cron (app/api/cron/event-reminders/route.ts)
// ---------------------------------------------------------------------------

export interface UpcomingReminderEvent {
  _id: string;
  title: string | null;
}

/**
 * Approved events starting within [now, windowEnd) — feeds the T-24h
 * reminder cron's RSVP notification fan-out (a Prisma write), so this uses
 * `queryRaw`: the original bare `client.fetch` was never cached, and a
 * cached read here could send reminders against a stale event-time window.
 */
export async function getEventsStartingWithin(
  nowIso: string,
  endIso: string,
): Promise<UpcomingReminderEvent[]> {
  return queryRaw<UpcomingReminderEvent[]>(
    `*[_type == "event" && status == "approved" && dateTime(startAt) > dateTime($now) && dateTime(startAt) < dateTime($end)]{ _id, title }`,
    { now: nowIso, end: endIso },
  );
}

// ---------------------------------------------------------------------------
// Dynamic template fetchers (sanity/lib/fetch.ts) — moved out per Task 9's
// dispatch note. Zero importers anywhere in app/components/lib (grepped
// repo-wide): the regional-community template now gets its case
// studies/lived experiences from lib/content/pages.ts's
// getRegionalCommunityCaseStudiesBySlug/getRegionalCommunityLivedExperiencesBySlug
// instead. Kept (not deleted) and converted per the explicit "move out"
// instruction, in case something re-wires to them later. Each GROQ literal
// below is copied character-exact from the original (including its
// idiosyncratic indentation) — only the `sanityFetch({...})` call shape
// changes to `query(...)`.
// ---------------------------------------------------------------------------

export interface DynamicTemplateFetchOptions {
  regionalCommunityId: string;
  mode?: "dynamic-featured" | "dynamic-recent";
  maxItems?: number;
}

/**
 * Fetch dynamic case studies for regional community template
 * @param regionalCommunityId - Regional community ID
 * @param mode - Fetching mode (featured-first or recent)
 * @param maxItems - Maximum number of items to return
 * @returns Array of case studies (approved only) with featured items first when applicable
 */
export const fetchDynamicCaseStudies = async ({
    regionalCommunityId,
    mode = "dynamic-featured",
    maxItems = 6
}: DynamicTemplateFetchOptions) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw GROQ string query returns untyped data; downstream templates depend on the loose shape (typegen is off-limits here)
        let items: any[] = [];

        if (mode === "dynamic-featured") {
            // First get featured case studies (approved only)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the file-level eslint-disable above 'let items: any[]'
            const featuredCaseStudies = await query<any[]>(
                `*[_type == "caseStudy" && status == "approved" && featured == true && references($regionalCommunityId)] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
                    title,
                    excerpt,
                    slug,
                    status,
                    publishedAt,
                    featured,
                    image{
                        asset->{
                            _id,
                            url,
                            mimeType,
                            metadata {
                                lqip,
                                dimensions {
                                    width,
                                    height
                                }
                            }
                        },
                        alt,
                        caption
                    },
                    authors[]{
                        userId,
                        name,
                        email,
                        role,
                        affiliation->{
                            _id,
                            name,
                            slug,
                            acronym,
                            logo{
                                asset->{
                                    _id,
                                    url
                                },
                                alt
                            }
                        }
                    },
                    organizations[]->{
                        _id,
                        name,
                        slug,
                        acronym,
                        logo{
                            asset->{
                                _id,
                                url
                            },
                            alt
                        }
                    },
                    tags[]->{
                        _id,
                        label,
                        value,
                        color
                    },
                    studyPeriod,
                    studyLocation
                }`,
                { regionalCommunityId },
            );

            items = featuredCaseStudies || [];

            // If we need more items, get recent non-featured case studies
            if (items.length < maxItems) {
                const remainingCount = maxItems - items.length;
                const featuredIds = items.map((item) => item._id);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the file-level eslint-disable above 'let items: any[]'
                const recentCaseStudies = await query<any[]>(
                    `*[_type == "caseStudy" && status == "approved" && !(_id in $featuredIds) && references($regionalCommunityId)] | order(publishedAt desc)[0...${remainingCount}]{
                        _id,
                        title,
                        excerpt,
                        slug,
                        status,
                        publishedAt,
                        featured,
                        image{
                            asset->{
                                _id,
                                url,
                                mimeType,
                                metadata {
                                    lqip,
                                    dimensions {
                                        width,
                                        height
                                    }
                                }
                            },
                            alt,
                            caption
                        },
                        authors[]{
                            userId,
                            name,
                            email,
                            role,
                            affiliation->{
                                _id,
                                name,
                                slug,
                                acronym,
                                logo{
                                    asset->{
                                        _id,
                                        url
                                    },
                                    alt
                                }
                            }
                        },
                        organizations[]->{
                            _id,
                            name,
                            slug,
                            acronym,
                            logo{
                                asset->{
                                    _id,
                                    url
                                },
                                alt
                            }
                        },
                        tags[]->{
                            _id,
                            label,
                            value,
                            color
                        },
                        studyPeriod,
                        studyLocation
                    }`,
                    { featuredIds, regionalCommunityId },
                );

                items = [...items, ...(recentCaseStudies || [])];
            }
        } else {
            // Just get recent case studies (approved only)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the file-level eslint-disable above 'let items: any[]'
            const data = await query<any[]>(
                `*[_type == "caseStudy" && status == "approved" && references($regionalCommunityId)] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
                    title,
                    excerpt,
                    slug,
                    status,
                    publishedAt,
                    featured,
                    image{
                        asset->{
                            _id,
                            url,
                            mimeType,
                            metadata {
                                lqip,
                                dimensions {
                                    width,
                                    height
                                }
                            }
                        },
                        alt,
                        caption
                    },
                    authors[]{
                        userId,
                        name,
                        email,
                        role,
                        affiliation->{
                            _id,
                            name,
                            slug,
                            acronym,
                            logo{
                                asset->{
                                    _id,
                                    url
                                },
                                alt
                            }
                        }
                    },
                    organizations[]->{
                        _id,
                        name,
                        slug,
                        acronym,
                        logo{
                            asset->{
                                _id,
                                url
                            },
                            alt
                        }
                    },
                    tags[]->{
                        _id,
                        label,
                        value,
                        color
                    },
                    studyPeriod,
                    studyLocation
                }`,
                { regionalCommunityId },
            );

            items = data || [];
        }

        return items;
    } catch (error) {
        console.error('Error fetching dynamic case studies:', error);
        return [];
    }
};

/**
 * Fetch dynamic lived experiences for regional community template
 * @param regionalCommunityId - Regional community ID
 * @param mode - Fetching mode (featured-first or recent)
 * @param maxItems - Maximum number of items to return
 * @returns Array of lived experiences with featured items first when applicable
 */
export const fetchDynamicLivedExperiences = async ({
    regionalCommunityId,
    mode = "dynamic-featured",
    maxItems = 10
}: DynamicTemplateFetchOptions) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw GROQ string query returns untyped data; downstream templates depend on the loose shape (typegen is off-limits here)
        let items: any[] = [];

        if (mode === "dynamic-featured") {
            // First get featured lived experiences
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the file-level eslint-disable above 'let items: any[]'
            const featuredExperiences = await query<any[]>(
                `*[_type == "livedExperience" && featured == true && relatedCommunity._ref == $regionalCommunityId] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
                    title,
                    excerpt,
                    slug,
                    thumbnail{
                        asset->{
                            _id,
                            url,
                            mimeType,
                            metadata {
                                lqip,
                                dimensions {
                                    width,
                                    height
                                }
                            }
                        },
                        alt
                    },
                    videoUrl,
                    duration,
                    publishedAt,
                    relatedCommunity->{
                        _id,
                        name,
                        slug
                    },
                    organizations[]->{
                        _id,
                        name,
                        slug,
                        acronym
                    },
                    tags[]->{
                        _id,
                        label,
                        value,
                        color
                    },
                    featured
                }`,
                { regionalCommunityId },
            );

            items = featuredExperiences || [];

            // If we need more items, get recent non-featured experiences
            if (items.length < maxItems) {
                const remainingCount = maxItems - items.length;
                const featuredIds = items.map((item) => item._id);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the file-level eslint-disable above 'let items: any[]'
                const recentExperiences = await query<any[]>(
                    `*[_type == "livedExperience" && !(_id in $featuredIds) && relatedCommunity._ref == $regionalCommunityId] | order(publishedAt desc)[0...${remainingCount}]{
                        _id,
                        title,
                        excerpt,
                        slug,
                        thumbnail{
                            asset->{
                                _id,
                                url,
                                mimeType,
                                metadata {
                                    lqip,
                                    dimensions {
                                        width,
                                        height
                                    }
                                }
                            },
                            alt
                        },
                        videoUrl,
                        duration,
                        publishedAt,
                        relatedCommunity->{
                            _id,
                            name,
                            slug
                        },
                        organizations[]->{
                            _id,
                            name,
                            slug,
                            acronym
                        },
                        tags[]->{
                            _id,
                            label,
                            value,
                            color
                        },
                        featured
                    }`,
                    { featuredIds, regionalCommunityId },
                );

                items = [...items, ...(recentExperiences || [])];
            }
        } else {
            // Just get recent lived experiences
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the file-level eslint-disable above 'let items: any[]'
            const data = await query<any[]>(
                `*[_type == "livedExperience" && relatedCommunity._ref == $regionalCommunityId] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
                    title,
                    excerpt,
                    slug,
                    thumbnail{
                        asset->{
                            _id,
                            url,
                            mimeType,
                            metadata {
                                lqip,
                                dimensions {
                                    width,
                                    height
                                }
                            }
                        },
                        alt
                    },
                    videoUrl,
                    duration,
                    publishedAt,
                    relatedCommunity->{
                        _id,
                        name,
                        slug
                    },
                    organizations[]->{
                        _id,
                        name,
                        slug,
                        acronym
                    },
                    tags[]->{
                        _id,
                        label,
                        value,
                        color
                    },
                    featured
                }`,
                { regionalCommunityId },
            );

            items = data || [];
        }

        return items;
    } catch (error) {
        console.error('Error fetching dynamic lived experiences:', error);
        return [];
    }
};
