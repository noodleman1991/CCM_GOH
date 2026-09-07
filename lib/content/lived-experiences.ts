import { activeBackend } from "@/lib/content/internal/backend";
import { safe } from "@/lib/content/internal/safe";
import { toRegion, toTag, type RawRegion, type RawTag } from "@/lib/content/internal/normalize";
import { createDocument, query, queryPreviewable, queryRaw, updateDocument, uploadFileAsset } from "@/lib/content/internal/sanity-source";
import {
  uploadFileAsset as payloadUploadFileAsset,
} from "@/lib/content/internal/payload-source";
import * as payloadLivedExperiences from "@/lib/content/internal/payload/lived-experiences";
import type { SubmissionDraft, SubmissionField } from "@/lib/content/internal/payload/lived-experiences";
import type { ContentRegion, ContentTag, Localized, RichText } from "@/lib/content/types";
import { prisma, safeQuery } from "@/lib/prisma";
import { generateLivedExperienceSlug } from "@/lib/validation/lived-experience";

/** The module's own name, as `CONTENT_BACKEND_LIVED_EXPERIENCES` spells it. */
const onPayload = (): boolean => activeBackend("lived-experiences") === "payload";

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

// `"value": value.current`, not a bare `value`. A tag's `value` is a slug
// OBJECT in Sanity (`{_type:"slug", current:"climate-change"}`) and a flat
// string in Payload, while `ContentTag.value` has always been declared
// `string` — so the bare binding here was the lie Phase-2 obligation 4 names,
// and this module (not `taxonomy.ts`, which already projects `value.current`)
// is where it is actually produced. Two consumers read it:
// `page-client.tsx:82` compares it against a URL filter param — which an
// object can never equal, so tag filtering on `/lived-experiences` has never
// worked — and `:210` uses it as a `ContentFilters` option value and React
// key. Flattening makes both correct AND makes the two backends agree; without
// it, the swap alone would change the shape under those two lines.
const INDEX_QUERY = `{
    "videos": *[_type == "livedExperience" && (status == "approved" || !defined(status))] | order(_createdAt desc) {
      _id,
      title,
      format,
      videoUrl,
      tags[]->{ _id, label, "value": value.current, color },
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
      | order(label.en asc) { _id, label, "value": value.current, color }
  }`;

export async function getLivedExperienceIndex(): Promise<LivedExperienceIndex> {
  return safe("lived-experiences", EMPTY_INDEX, async () => {
    // Inside `safe()`: a Payload failure has to degrade to the same empty index
    // the Sanity one does, or the page throws on one backend and renders an
    // empty state on the other.
    if (onPayload()) return payloadLivedExperiences.getLivedExperienceIndex();
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
    if (onPayload()) return payloadLivedExperiences.getLivedExperiencesCarousel(filters);
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
  if (onPayload()) return payloadLivedExperiences.getAvailableLivedExperienceTags();
  // `"value": value.current` for the same reason INDEX_QUERY flattens it:
  // `LivedExperienceTagOption.value` is declared `string` and Sanity stores a
  // slug object. `components/forms/lived-experience-form.tsx` types its own
  // copy as `{current: string}` and never reads it — grepped — so nothing
  // depends on the object shape.
  return query<LivedExperienceTagOption[]>(
    `*[_type == "tag"] | order(label.en asc) { _id, label, "value": value.current }`,
  );
}

export async function getActiveRegionalCommunities(): Promise<LivedExperienceCommunityOption[]> {
  if (onPayload()) return payloadLivedExperiences.getActiveRegionalCommunities();
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
  // Only the READ is chosen by backend. Everything below this line — the status
  // test, the ownership test, the workspace-membership test and the mapping —
  // is written once and runs identically on both. This is a write-time
  // authorization gate of exactly the shape the Phase-1 bypass had, and a gate
  // implemented twice is a gate that can disagree with itself.
  //
  // On Payload there is no `drafts.` id to match: a draft is a version of this
  // same id, and `queryRaw` (draft: true) is what overlays it. The prefix is
  // still stripped above, because an id minted while Sanity was the backend can
  // still be sitting in a bookmarked `?edit=` URL.
  const doc = onPayload()
    ? await payloadLivedExperiences.loadEditableDoc(id)
    : // Raw perspective: drafts.* docs are invisible to the public read client,
      // and edit mode is exactly about reopening drafts.
      await queryRaw<RawEditableDoc | null>(
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
  // Sanity's `status` conflates a moderation state with a draft state; Payload
  // splits them into `moderationStatus` and `_status`, and `doc.status` is
  // `moderationStatus` on BOTH backends. `"draft"` is therefore vestigial —
  // 0/56 documents carry any status at all, on either store, so this test
  // always passes today and the real work is the ownership check below. It is
  // left inert rather than "fixed": the property worth keeping is that IF an
  // editor ever sets the field, an approved or rejected document stops being
  // reopenable. No `defaultValue` was imported, so the gate does not flip shut.
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

/**
 * The Sanity document shape, built from the neutral draft.
 *
 * The intricate part of a resubmission is not either store's field names — it
 * is deciding which fields carry a value and which are cleared. That decision
 * is made once, below, in this module's own vocabulary (`SubmissionDraft`),
 * and each backend then does nothing but name its own fields. Two copies of
 * the decision would be two chances to disagree about whether an edit deletes
 * someone's uploaded video.
 */
function sanitySubmissionDoc(draft: SubmissionDraft): Record<string, unknown> {
  const lang = draft.language;
  const localized = (value?: string) => (value ? { [lang]: value } : undefined);
  const doc: Record<string, unknown> = {
    language: lang,
    status: "pending", // never trust client; always pending on submit
    title: { [lang]: draft.title },
    description: localized(draft.description),
    issue: localized(draft.issue),
    personContext: localized(draft.personContext),
    featured: false,
  };
  if (draft.videoSource) doc.videoSource = draft.videoSource;
  if (draft.videoLink) doc.videoLink = draft.videoLink;
  if (draft.body) doc.body = draft.body;
  if (draft.community) doc.relatedCommunity = { _type: "reference", _ref: draft.community };
  if (draft.tags) doc.tags = draft.tags.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  if (draft.videoAsset) doc.videoFile = { _type: "file", asset: { _type: "reference", _ref: draft.videoAsset } };
  return doc;
}

/** The neutral field names, as Sanity's own. */
const SANITY_SUBMISSION_FIELD: Record<SubmissionField, string> = {
  description: "description",
  issue: "issue",
  personContext: "personContext",
  videoSource: "videoSource",
  videoLink: "videoLink",
  body: "body",
  community: "relatedCommunity",
  tags: "tags",
  videoAsset: "videoFile",
};

export async function submitLivedExperience(
  input: LivedExperienceSubmissionInput,
): Promise<{ id: string }> {
  // Upload the video to the asset store first, then reference it. On Payload
  // this lands in `files`, not `media` — `media` is images-only and a video is
  // not an image.
  let videoAsset: string | undefined;
  if (input.videoSource === "upload" && input.videoFile) {
    const upload = onPayload() ? payloadUploadFileAsset : uploadFileAsset;
    const asset = await upload(input.videoFile.buffer, {
      filename: input.videoFile.filename,
      contentType: input.videoFile.contentType,
    });
    videoAsset = asset.id;
  }

  const draft: SubmissionDraft = {
    language: input.language,
    title: input.title,
    description: input.description || undefined,
    issue: input.issue || undefined,
    // The original wrapped `input.personContext || ""`, so an empty string has
    // always meant "unset" here rather than "an empty value".
    personContext: input.personContext || undefined,
    videoSource: input.videoSource,
    videoLink: input.videoSource !== "upload" && input.videoLink ? input.videoLink : undefined,
    body: Array.isArray(input.body) && input.body.length > 0 ? input.body : undefined,
    community: input.regionalCommunityId || undefined,
    tags: input.tagIds && input.tagIds.length > 0 ? input.tagIds : undefined,
    videoAsset,
  };

  if (input.editId) {
    const existing = onPayload()
      ? await payloadLivedExperiences.loadExistingSubmission(input.editId)
      // `queryRaw`, not `queryLive` and not `query`: this read decides whether
      // a write is allowed, so it must see the caller's own unpublished
      // document and must not be answered from an hour-old cache. The two
      // return the same shape, which is why the tests assert the primitive
      // rather than the result.
      : await queryRaw<RawExistingSubmission | null>(
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

    // JSON drops undefined, so cleared optional fields must be unset explicitly;
    // a video-source switch also has to drop the now-stale counterpart field.
    // Note what is NOT here: `videoAsset` is only cleared when the submission
    // is no longer an upload, so keeping an existing upload (upload source, no
    // new file) leaves `videoFile` out of both halves of the patch — set to
    // nothing, unset by nothing.
    const unset: SubmissionField[] = [];
    if (!draft.description) unset.push("description");
    if (!draft.issue) unset.push("issue");
    if (!draft.personContext) unset.push("personContext");
    if (input.videoSource === "upload") unset.push("videoLink");
    else unset.push("videoAsset");
    if (!draft.body) unset.push("body");
    if (!draft.community) unset.push("community");
    if (!draft.tags) unset.push("tags");

    if (onPayload()) {
      await payloadLivedExperiences.updateSubmission(existing._id, draft, unset);
      return { id: existing._id };
    }

    const doc = sanitySubmissionDoc(draft);
    const set = Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined));
    await updateDocument(existing._id, {
      ...set,
      ...Object.fromEntries(unset.map((field) => [SANITY_SUBMISSION_FIELD[field], null])),
    });
    return { id: existing._id };
  }

  const meta = {
    slug: generateLivedExperienceSlug(input.title),
    submittedBy: input.userId,
    publishedAt: new Date().toISOString(),
  };
  if (onPayload()) return payloadLivedExperiences.createSubmission(draft, meta);

  const created = await createDocument({
    _type: "livedExperience",
    ...sanitySubmissionDoc(draft),
    submittedBy: meta.submittedBy,
    publishedAt: meta.publishedAt,
    slug: { _type: "slug", current: meta.slug },
  });
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
    tags[]->{ _id, label, "value": value.current, color },
    ${RELATED_CONTENT_PROJECTION}
  }
`;

const SLUGS_QUERY = `
  *[_type == "livedExperience"
    && defined(slug.current)
    && (status == "approved" || !defined(status))]{ "slug": slug.current }
`;

export async function getLivedExperienceBySlug(slug: string): Promise<LivedExperienceDetail | null> {
  if (onPayload()) return payloadLivedExperiences.getLivedExperienceBySlug(slug);
  return query<LivedExperienceDetail | null>(DETAIL_QUERY, { slug });
}

export async function getLivedExperienceSlugs(): Promise<{ slug: string }[]> {
  if (onPayload()) return payloadLivedExperiences.getLivedExperienceSlugs();
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
    if (onPayload()) return payloadLivedExperiences.getLivedExperienceOgData(slug);
    const doc = await query<LivedExperienceOgData | null>(
      `*[_type == "livedExperience" && slug.current == $slug][0]{ title, "region": relatedCommunity->name.en }`,
      { slug },
    );
    return doc ?? null;
  });
}
