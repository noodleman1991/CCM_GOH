import { safe } from "@/lib/content/internal/safe";
import { toRegion, toTag, type RawRegion, type RawTag } from "@/lib/content/internal/normalize";
import { createDocument, query, queryPreviewable, queryRaw, updateDocument, uploadFileAsset } from "@/lib/content/internal/sanity-source";
import type { ContentRegion, ContentTag, Localized, RichText } from "@/lib/content/types";
import { prisma, safeQuery } from "@/lib/prisma";
import { generateLivedExperienceSlug } from "@/lib/validation/lived-experience";

export interface LivedExperience {
  id: string;
  title?: Localized | string;
  format?: "video" | "audio" | "written";
  videoUrl?: string;
  thumbnailUrl?: string;
  tags: ContentTag[];
  region: ContentRegion | null;
  /** Legacy docs stored region as a bare short code, so `region->` is null. */
  rawRegion?: unknown;
}

export interface LivedExperienceIndex {
  videos: LivedExperience[];
  regionalCommunities: ContentRegion[];
  allTags: ContentTag[];
}

const EMPTY_INDEX: LivedExperienceIndex = {
  videos: [],
  regionalCommunities: [],
  allTags: [],
};

const INDEX_QUERY = `{
    "videos": *[_type == "livedExperience" && (status == "approved" || !defined(status))] | order(_createdAt desc) {
      _id,
      title,
      format,
      videoUrl,
      tags[]->{ _id, label, value, color },
      "thumbnailUrl": thumbnail.asset->url,
      "region": region->{
        _id,
        name,
        "slug": slug.current
      },
      "rawRegion": region
    },
    "regionalCommunities": *[_type == "regionalCommunity"] | order(order asc, name asc) {
      _id,
      name,
      "slug": slug.current
    },
    "allTags": *[_type == "tag" && count(*[_type == "livedExperience" && references(^._id)]) > 0]
      | order(label.en asc) { _id, label, value, color }
  }`;

export async function getLivedExperienceIndex(): Promise<LivedExperienceIndex> {
  return safe("lived-experiences", EMPTY_INDEX, async () => {
    const raw = await query<{
      videos?: Array<Record<string, unknown>>;
      regionalCommunities?: RawRegion[];
      allTags?: RawTag[];
    } | null>(INDEX_QUERY);

    if (!raw) return EMPTY_INDEX;

    return {
      videos: (raw.videos ?? []).map((v) => ({
        id: v._id as string,
        title: v.title as Localized | string | undefined,
        format: v.format as LivedExperience["format"],
        videoUrl: v.videoUrl as string | undefined,
        thumbnailUrl: v.thumbnailUrl as string | undefined,
        tags: ((v.tags as RawTag[] | undefined) ?? []).map(toTag),
        region: v.region ? toRegion(v.region as RawRegion) : null,
        rawRegion: v.rawRegion,
      })),
      regionalCommunities: (raw.regionalCommunities ?? []).map(toRegion),
      allTags: (raw.allTags ?? []).map(toTag),
    };
  });
}

export async function getLivedExperiencesByRegion(regionSlug: string): Promise<LivedExperience[]> {
  const { videos } = await getLivedExperienceIndex();
  return videos.filter((v) => v.region?.slug === regionSlug);
}

// ---------------------------------------------------------------------------
// Carousel block (components/blocks/carousel/lived-experiences-carousel-block.tsx)
// ---------------------------------------------------------------------------

/**
 * Shape rendered by LivedExperiencesCarousel. Kept as the canonical type for
 * that raw (undereferenced-title-as-localized) projection — the carousel
 * component imports this rather than declaring its own copy.
 */
export interface LivedExperienceCarouselItem {
  _id: string;
  _type: string;
  title?: Localized;
  description?: Localized;
  issue?: Localized;
  personContext?: Localized;
  videoLink?: string;
  thumbnail?: {
    asset?: { _id?: string; url?: string | null; mimeType?: string | null } | null;
    alt?: string | null;
  } | null;
  duration?: string;
  publishedAt?: string;
  author?: {
    _id: string;
    name: string;
    image?: unknown;
    organizationalAffiliation?: string;
  };
  relatedCommunity?: {
    _id: string;
    name?: Localized;
    slug?: { current: string };
  };
  tags?: Array<{
    _id: string;
    label?: Localized;
    color?: string;
  }>;
  featured?: boolean;
  slug?: { current: string };
}

export interface LivedExperienceCarouselFilters {
  communities?: string[] | null;
  tags?: string[] | null;
  authors?: string[] | null;
  featured?: boolean;
  maxItems?: number;
}

const CAROUSEL_QUERY = `
  *[_type == "livedExperience" &&
    (status == "approved" || !defined(status)) &&
    (!defined($communities) || _id in *[_type == "regionalCommunity" && _id in $communities].members[].person._ref) &&
    (!defined($tags) || count(tags[]._ref[@ in $tags]) > 0) &&
    (!defined($authors) || author._ref in $authors) &&
    (!defined($featured) || $featured == false || featured == true)
  ] | order(publishedAt desc) [0...$maxItems] {
    _id,
    _type,
    title,
    description,
    issue,
    personContext,
    videoLink,
    thumbnail,
    duration,
    publishedAt,
    author -> {
      _id,
      name,
      image,
      organizationalAffiliation
    },
    relatedCommunity -> {
      _id,
      name,
      slug
    },
    tags[] -> {
      _id,
      label,
      color
    },
    featured,
    slug
  }
`;

// `queryPreviewable`, not `query` — the original
// `components/blocks/carousel/lived-experiences-carousel-block.tsx` called
// `sanityFetch({ query: livedExperiencesCarouselQuery, params: {...} })`
// (`git show 87ef869bc:components/blocks/carousel/lived-experiences-carousel-block.tsx`)
// with no `perspective`/`stega`, so it fell through to cachedFetch's own
// draftMode() check. `query()` would silently end draft preview for this
// carousel in Sanity's Presentation tool, inconsistent with the page it sits
// on (getHomepage/getRegionalCommunityPage are both queryPreviewable).
export async function getLivedExperiencesCarousel(
  filters: LivedExperienceCarouselFilters,
): Promise<LivedExperienceCarouselItem[]> {
  return safe("lived-experiences-carousel", [], async () => {
    const result = await queryPreviewable<LivedExperienceCarouselItem[] | null>(CAROUSEL_QUERY, {
      communities: filters.communities?.length ? filters.communities : null,
      tags: filters.tags?.length ? filters.tags : null,
      authors: filters.authors?.length ? filters.authors : null,
      featured: filters.featured ?? false,
      maxItems: filters.maxItems ?? 10,
    });
    return result ?? [];
  });
}

// ---------------------------------------------------------------------------
// Submit form option lists (app/[locale]/(main)/lived-experiences/submit/page.tsx)
// ---------------------------------------------------------------------------

export interface LivedExperienceTagOption {
  _id: string;
  label?: Localized;
  value?: string;
}

export interface LivedExperienceCommunityOption {
  _id: string;
  name: Localized | string;
  slug?: { current: string };
}

export async function getAvailableLivedExperienceTags(): Promise<LivedExperienceTagOption[]> {
  return query<LivedExperienceTagOption[]>(
    `*[_type == "tag"] | order(label.en asc) { _id, label, value }`,
  );
}

export async function getActiveRegionalCommunities(): Promise<LivedExperienceCommunityOption[]> {
  return query<LivedExperienceCommunityOption[]>(
    `*[_type == "regionalCommunity" && active == true] | order(name.en asc) { _id, name, slug }`,
  );
}

// ---------------------------------------------------------------------------
// Edit flow (lib/lived-experiences/edit.ts)
// ---------------------------------------------------------------------------

/**
 * X7 tail: load a lived experience the current user may edit, mapped to the
 * submission form's field shape (loadEditableCaseStudy pattern). Localized
 * fields collapse to the doc's submission language, which the form re-wraps
 * on resubmit.
 *
 * May edit = the original submitter, OR a member of a workspace that lists
 * the doc as an output. Only draft/pending/revision docs are editable —
 * approved content changes go through the editorial team.
 *
 * A read, not a write — but gated and drafts-visible, so it throws on
 * failure like the write paths below rather than degrading via `safe()`.
 */
export type EditableLivedExperience = {
  status: string;
  reviewNotes: string | null;
  _sanityId: string;
  language: "en" | "es" | "fr" | "ar";
  title: string;
  description: string;
  issue: string;
  personContext: string;
  videoSource: "youtube" | "vimeo" | "upload";
  videoLink: string;
  body: RichText;
  regionalCommunityId: string;
  tagIds: string[];
  /** An uploaded video already exists — the form doesn't require a new file. */
  hasVideoFile: boolean;
};

interface RawEditableDoc {
  _id: string;
  language?: string;
  title?: Localized;
  description?: Localized;
  issue?: Localized;
  personContext?: Localized;
  videoSource?: string;
  videoLink?: string;
  body?: RichText;
  submittedBy?: string;
  status?: string | null;
  reviewNotes?: string | null;
  regionalCommunityId?: string;
  tagIds?: string[];
  hasVideoFile?: boolean;
}

export async function loadEditableLivedExperience(
  sanityId: string,
  userId: string,
): Promise<EditableLivedExperience | null> {
  const id = sanityId.replace(/^drafts\./, "");
  // Raw perspective: drafts.* docs are invisible to the public read client,
  // and edit mode is exactly about reopening drafts.
  const doc = await queryRaw<RawEditableDoc | null>(
    `*[_type == "livedExperience" && (_id == $id || _id == "drafts." + $id)][0]{
      _id, language, title, description, issue, personContext,
      videoSource, videoLink, body, submittedBy, status, reviewNotes,
      "regionalCommunityId": relatedCommunity._ref,
      "tagIds": tags[]._ref,
      "hasVideoFile": defined(videoFile.asset)
    }`,
    { id },
  );
  if (!doc) return null;
  if (!["pending", "revision", "draft", null, undefined].includes(doc.status)) return null;

  let allowed = doc.submittedBy === userId;
  if (!allowed) {
    const membership = await safeQuery(() =>
      prisma.workspaceOutput.findFirst({
        where: {
          sanityId: { in: [id, `drafts.${id}`] },
          collaboration: { members: { some: { userId } } },
        },
        select: { id: true },
      }),
    );
    allowed = membership.success && !!membership.data;
  }
  if (!allowed) return null;

  const lang: EditableLivedExperience["language"] = ["en", "es", "fr", "ar"].includes(doc.language ?? "")
    ? (doc.language as EditableLivedExperience["language"])
    : "en";
  // Localized object → the submission language's string (fall back to any).
  const text = (v: Localized | undefined) => v?.[lang] ?? v?.en ?? Object.values(v ?? {})[0] ?? "";

  return {
    _sanityId: doc._id,
    status: doc.status ?? "draft",
    reviewNotes: doc.reviewNotes ?? null,
    language: lang,
    title: text(doc.title),
    description: text(doc.description),
    issue: text(doc.issue),
    personContext: text(doc.personContext),
    videoSource: doc.videoSource === "vimeo" || doc.videoSource === "upload" ? doc.videoSource : "youtube",
    videoLink: doc.videoLink ?? "",
    body: Array.isArray(doc.body) ? doc.body : [],
    regionalCommunityId: doc.regionalCommunityId ?? "",
    tagIds: Array.isArray(doc.tagIds) ? doc.tagIds.filter(Boolean) : [],
    hasVideoFile: !!doc.hasVideoFile,
  };
}

// ---------------------------------------------------------------------------
// Submission (app/api/lived-experiences/submit/route.ts) — a write path.
// Writes throw, not degrade: a submission that silently fails is worse than
// one that errors.
// ---------------------------------------------------------------------------

export interface LivedExperienceSubmissionInput {
  userId: string;
  language: "en" | "es" | "fr" | "ar";
  title: string;
  description?: string;
  issue?: string;
  personContext?: string;
  videoSource?: "youtube" | "vimeo" | "upload";
  videoLink?: string;
  body?: RichText;
  regionalCommunityId?: string;
  tagIds?: string[];
  /** X7 edit mode: resubmit an existing draft/pending/revision doc. */
  editId?: string;
  videoFile?: { buffer: Buffer; filename: string; contentType: string } | null;
}

interface RawExistingSubmission {
  _id: string;
  submittedBy?: string;
  status?: string | null;
  hasVideoFile?: boolean;
}

/**
 * Thrown when an edit-mode resubmission isn't allowed — the caller (the API
 * route) maps this to a 403 rather than a 500.
 */
export class LivedExperienceEditNotAllowedError extends Error {
  constructor() {
    super("You can't edit this submission.");
    this.name = "LivedExperienceEditNotAllowedError";
  }
}

/**
 * Thrown when an "upload" edit carries no new file and the existing doc has
 * none either — the caller maps this to a 400 rather than a 500.
 */
export class LivedExperienceMissingVideoError extends Error {
  constructor() {
    super("No video file provided");
    this.name = "LivedExperienceMissingVideoError";
  }
}

export async function submitLivedExperience(
  input: LivedExperienceSubmissionInput,
): Promise<{ id: string }> {
  const lang = input.language;
  const localized = (value?: string) => (value ? { [lang]: value } : undefined);

  const doc: { _type: string; [key: string]: unknown } = {
    _type: "livedExperience",
    language: lang,
    status: "pending", // never trust client; always pending on submit
    submittedBy: input.userId,
    publishedAt: new Date().toISOString(),
    slug: { _type: "slug", current: generateLivedExperienceSlug(input.title) },
    title: { [lang]: input.title },
    description: localized(input.description),
    issue: localized(input.issue),
    personContext: localized(input.personContext || ""),
    featured: false,
  };

  if (input.videoSource) doc.videoSource = input.videoSource;
  if (input.videoSource !== "upload" && input.videoLink) doc.videoLink = input.videoLink;
  if (Array.isArray(input.body) && input.body.length > 0) doc.body = input.body;
  if (input.regionalCommunityId) {
    doc.relatedCommunity = { _type: "reference", _ref: input.regionalCommunityId };
  }
  if (input.tagIds && input.tagIds.length > 0) {
    doc.tags = input.tagIds.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  }

  // Upload the video to the asset store first, then reference it.
  if (input.videoSource === "upload" && input.videoFile) {
    const asset = await uploadFileAsset(input.videoFile.buffer, {
      filename: input.videoFile.filename,
      contentType: input.videoFile.contentType,
    });
    doc.videoFile = { _type: "file", asset: { _type: "reference", _ref: asset.id } };
  }

  if (input.editId) {
    const existing = await queryRaw<RawExistingSubmission | null>(
      `*[_type == "livedExperience" && _id == $id][0]{
        _id, submittedBy, status, "hasVideoFile": defined(videoFile.asset)
      }`,
      { id: input.editId },
    );
    const editable = !!existing && ["pending", "revision", "draft", null].includes(existing.status ?? null);
    const isSubmitter = existing?.submittedBy === input.userId;
    let isWorkspaceMember = false;
    if (existing && !isSubmitter) {
      const row = await prisma.workspaceOutput.findFirst({
        where: {
          sanityId: { in: [existing._id, existing._id.replace(/^drafts\./, "")] },
          collaboration: { members: { some: { userId: input.userId } } },
        },
        select: { id: true },
      });
      isWorkspaceMember = !!row;
    }
    if (!existing || !editable || (!isSubmitter && !isWorkspaceMember)) {
      throw new LivedExperienceEditNotAllowedError();
    }
    if (input.videoSource === "upload" && !input.videoFile && !existing.hasVideoFile) {
      throw new LivedExperienceMissingVideoError();
    }

    const { _type: _t, slug: _slug, submittedBy: _sb, publishedAt: _pa, ...updatable } = doc;
    // JSON drops undefined, so cleared optional fields must be unset explicitly;
    // a video-source switch also has to drop the now-stale counterpart field.
    const cleared = Object.keys(updatable).filter(
      (k) => updatable[k as keyof typeof updatable] === undefined,
    );
    if (input.videoSource === "upload") cleared.push("videoLink");
    else cleared.push("videoFile");
    if (!Array.isArray(input.body) || input.body.length === 0) cleared.push("body");
    if (!input.regionalCommunityId) cleared.push("relatedCommunity");
    if (!input.tagIds || input.tagIds.length === 0) cleared.push("tags");
    const set = Object.fromEntries(Object.entries(updatable).filter(([, v]) => v !== undefined));
    // Keeping the existing upload: videoFile isn't in `set`, and must not be unset.
    const unsets = cleared.filter((k) => !(k === "videoFile" && input.videoSource === "upload"));

    await updateDocument(existing._id, {
      ...set,
      status: "pending",
      ...Object.fromEntries(unsets.map((k) => [k, null])),
    });
    return { id: existing._id };
  }

  const created = await createDocument(doc);
  return { id: created.id };
}

// ---------------------------------------------------------------------------
// Detail page (app/[locale]/(main)/lived-experiences/[slug]/page.tsx) — a
// call site the brief didn't list, found while auditing this domain.
// ---------------------------------------------------------------------------

/**
 * Fragments inlined verbatim from sanity/queries/shared/styled-body.ts and
 * sanity/queries/grid/grid-case-study.ts (RELATED_CONTENT_PROJECTION) at
 * conversion time, rather than imported, so this module's only Sanity
 * contact stays sanity-source.ts.
 */
const STYLED_BODY_PROJECTION = `
  ...,
  _type == "image" => {
    ...,
    asset->{
      _id,
      url,
      mimeType,
      metadata { lqip, dimensions { width, height } }
    }
  },
  markDefs[]{
    ...,
    _type == "internalLink" => {
      ...,
      reference->{ _type, "slug": slug.current }
    }
  }
`;

const RELATED_CONTENT_PROJECTION = `
  relatedContent[]{
    relation,
    "target": target->{
      _type,
      _id,
      "slug": slug.current,
      title,
      excerpt,
      "image": image{ asset->{ _id, url }, alt },
      // lived experience specifics
      videoUrl,
      // project specifics (title is plain string there)
      status
    }
  }
`;

export interface LivedExperienceDetail {
  _id: string;
  title?: Localized | string;
  format?: "video" | "audio" | "written";
  layout?: "story" | "feature" | "report";
  description?: Localized | string;
  issue?: Localized | string;
  personContext?: Localized | string;
  slug?: { current: string };
  videoLink?: string;
  videoSource?: "youtube" | "vimeo" | "upload";
  videoFileUrl?: string;
  body?: RichText;
  duration?: string;
  publishedAt?: string;
  thumbnail?: {
    asset?: {
      _id: string;
      url: string;
      mimeType?: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    alt?: string;
  } | null;
  author?: { _id: string; name?: string; organizationalAffiliation?: string } | null;
  relatedCommunity?: { _id: string; name?: Localized | string; slug?: { current: string } } | null;
  organizations?: Array<{ _id: string; name?: Localized | string; slug?: { current: string }; acronym?: string }>;
  tags?: Array<{ _id: string; label?: Localized | string | null; value?: string; color?: string }>;
  relatedContent?: unknown;
}

const DETAIL_QUERY = `
  *[_type == "livedExperience"
    && slug.current == $slug
    && (status == "approved" || !defined(status))][0]{
    _id,
    title,
    format,
    layout,
    description,
    issue,
    personContext,
    slug,
    videoLink,
    videoSource,
    "videoFileUrl": videoFile.asset->url,
    body[]{ ${STYLED_BODY_PROJECTION} },
    duration,
    publishedAt,
    thumbnail{
      asset->{ _id, url, mimeType, metadata { lqip, dimensions { width, height } } },
      alt
    },
    author->{ _id, name, organizationalAffiliation },
    relatedCommunity->{ _id, name, slug },
    organizations[]->{ _id, name, slug, acronym },
    tags[]->{ _id, label, value, color },
    ${RELATED_CONTENT_PROJECTION}
  }
`;

const SLUGS_QUERY = `
  *[_type == "livedExperience"
    && defined(slug.current)
    && (status == "approved" || !defined(status))]{ "slug": slug.current }
`;

export async function getLivedExperienceBySlug(slug: string): Promise<LivedExperienceDetail | null> {
  return query<LivedExperienceDetail | null>(DETAIL_QUERY, { slug });
}

export async function getLivedExperienceSlugs(): Promise<{ slug: string }[]> {
  return query<{ slug: string }[]>(SLUGS_QUERY);
}

// ---------------------------------------------------------------------------
// OG card (app/[locale]/(main)/lived-experiences/[slug]/og.png/route.tsx) —
// another call site the brief didn't list.
// ---------------------------------------------------------------------------

export interface LivedExperienceOgData {
  // Kept as a plain indexable record (not `Localized`) — the og route indexes
  // it with a runtime locale string, which needs a string index signature.
  title: Record<string, string> | string | null;
  region: string | null;
}

export async function getLivedExperienceOgData(slug: string): Promise<LivedExperienceOgData | null> {
  return safe("lived-experience-og", null, async () => {
    const doc = await query<LivedExperienceOgData | null>(
      `*[_type == "livedExperience" && slug.current == $slug][0]{ title, "region": relatedCommunity->name.en }`,
      { slug },
    );
    return doc ?? null;
  });
}
