import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import * as payloadOutputs from "@/lib/content/internal/payload/outputs";
import { uploadFileAsset as uploadPayloadFileAsset } from "@/lib/content/internal/payload-source";
import { safe } from "@/lib/content/internal/safe";
import { createDocument, query, queryLive, queryRaw, updateDocument, uploadFileAsset } from "@/lib/content/internal/sanity-source";
import type { Locale, Localized, RichText, SearchRecord } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { prisma, safeQuery } from "@/lib/prisma";
import { generateResearchOutputSlug } from "@/lib/validation/research-output";

/**
 * The module's own name, as `CONTENT_BACKEND_OUTPUTS` spells it.
 *
 * Every export below keeps its signature and gains one `if (onPayload())`
 * line; the Payload half lives in `lib/content/internal/payload/outputs.ts`,
 * whose header carries the measurements and the four decisions this swap
 * rests on — the `report` dead end, the download counter that starts working,
 * which read primitive each write-feeding read must call, and the total
 * `publishDate` tie that `_id asc` breaks.
 */
const DOMAIN = "outputs";

function onPayload(): boolean {
  return activeBackend(DOMAIN) === "payload";
}

// ---------------------------------------------------------------------------
// Agenda — shared shape for getAgendas / getAgendasByRegion / getAgendaBySlug.
//
// Normalizer decision: declined toTag/toRegion (lib/content/internal/
// normalize.ts) for this whole module. Two independent reasons:
//   1. The one REAL call site (getAgendasByRegion, below) feeds
//      components/blocks/grid/regional-agendas-grid.tsx → grid-report.tsx →
//      grid-report-download.tsx, which are SHARED with the still-untouched
//      page-builder path (sanity/queries/grid/grid-agenda.ts /
//      grid-report.ts, embedded in the page-builder's own PAGE_QUERY — out
//      of this task's file list, and not converted by any Task 2-10 brief).
//      Those components read the RAW nested `_id`-keyed shape
//      (tag.color/tag.category, org.acronym/org.logo, community.code,
//      file.file.asset.{url,originalFilename,size,mimeType}) directly.
//      Reshaping the projection — flattening to ContentTag/ContentRegion, or
//      to the flat lib/content/types.ts `ContentFile` — would silently break
//      that rendering without touching a single Sanity import, since nothing
//      in the boundary test would catch a shape change in a converted
//      module's own return type. Same judgment call as Tasks 3/4: the
//      projection doesn't fit the shared normalizer, so it's declined.
//   2. `Agenda.files` therefore is NOT `ContentFile[]` as originally
//      sketched in this task's brief — see the report for the full
//      reasoning. It is a locally-declared nested shape mirroring the
//      pre-existing (Sanity-free) `types/agenda.ts`.
// ---------------------------------------------------------------------------

export interface AgendaFileAttachment {
  language?: string;
  file?: {
    asset?: {
      _id: string;
      url: string;
      originalFilename?: string;
      size?: number;
      mimeType?: string;
    };
  };
  downloadCount?: number;
  lastDownloaded?: string;
}

export interface AgendaTag {
  _id: string;
  label?: Localized;
  value?: string;
  color?: string;
  category?: string;
}

export interface AgendaOrganization {
  _id: string;
  name?: string;
  slug?: { current: string };
  acronym?: string;
  logo?: { asset?: { _id: string; url: string } | null; alt?: string } | null;
}

export interface AgendaRegionalCommunity {
  _id: string;
  name?: Localized;
  slug?: { current: string };
  code?: string;
}

export interface Agenda {
  // Index signature: components/community/grid-items.ts's mergePinnedWithDynamic
  // (components/templates/regional-community-template.tsx's "dynamic-with-pinned"
  // grid mode) is generic over `WithId = { _id?; _key?; [k: string]: unknown }`,
  // mixing this dynamic fetch's results with editor-authored `manualItems`
  // (raw, untouched Sanity block data) in the same array.
  [key: string]: unknown;
  _id: string;
  title?: Localized;
  subtitle?: Localized;
  description?: Localized;
  slug?: { current: string };
  agendaType?: string;
  year?: number;
  publishDate?: string;
  totalDownloadCount?: number;
  featured?: boolean;
  accessLevel?: "public" | "registered" | "members";
  coverImage?: {
    asset?: {
      _id: string;
      url: string;
      mimeType?: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    hotspot?: unknown;
    crop?: unknown;
    alt?: string;
  } | null;
  files?: AgendaFileAttachment[];
  tags?: AgendaTag[];
  organizations?: AgendaOrganization[];
  regionalCommunities?: AgendaRegionalCommunity[];
}

// ---------------------------------------------------------------------------
// Regional-community agendas (app/[locale]/(main)/communities/[slug]/page.tsx,
// "legacy mode" branch → RegionalAgendasGrid) — moved from
// sanity/lib/fetch.ts's fetchRegionalCommunityAgendas, the one helper this
// task owns out of that file's 15. Featured-first, then recent, up to
// `limit`. Original wrapped the whole body in try/catch returning [], so
// this degrades via `safe()`. GROQ moved character-exact (the
// `[_id != null]` filters on dereferenced arrays included) — three separate
// `sanityFetch` calls (perspective "published", stega false) all map to
// `query()`.
// ---------------------------------------------------------------------------

export async function getAgendasByRegion(rcSlug: string, limit: number = 6): Promise<Agenda[]> {
  return safe("agendas-by-region", [], async () => {
    if (onPayload()) return payloadOutputs.getAgendasByRegion(rcSlug, limit);
    const community = await query<{ _id: string } | null>(
      `*[_type == "regionalCommunity" && slug.current == $slug][0]{_id}`,
      { slug: rcSlug },
    );

    if (!community?._id) {
      return [];
    }

    const regionalCommunityId = community._id;
    let items: Agenda[] = [];

    const featuredAgendas = await query<Agenda[] | null>(
      `*[_type == "agenda" && featured == true && references($regionalCommunityId)] | order(publishDate desc, _id asc)[0...${limit}]{
                _id,
                title,
                subtitle,
                description,
                slug,
                agendaType,
                year,
                publishDate,
                totalDownloadCount,
                featured,
                accessLevel,
                coverImage{
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
                    hotspot,
                    crop,
                    alt
                },
                files[]{
                    language,
                    file{
                        asset->{
                            _id,
                            url,
                            originalFilename,
                            size,
                            mimeType
                        }
                    },
                    downloadCount,
                    lastDownloaded
                },
                tags[]->{
                    _id,
                    label,
                    "value": value.current,
                    color,
                    category
                }[_id != null],
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
                }[_id != null],
                regionalCommunities[]->{
                    _id,
                    name,
                    slug,
                    code
                }[_id != null]
            }`,
      { regionalCommunityId },
    );

    items = featuredAgendas || [];

    if (items.length < limit) {
      const remainingCount = limit - items.length;
      const featuredIds = items.map((item) => item._id);

      const recentAgendas = await query<Agenda[] | null>(
        `*[_type == "agenda" && !(_id in $featuredIds) && references($regionalCommunityId)] | order(publishDate desc, _id asc)[0...${remainingCount}]{
                    _id,
                    title,
                    subtitle,
                    description,
                    slug,
                    agendaType,
                    year,
                    publishDate,
                    totalDownloadCount,
                    featured,
                    accessLevel,
                    coverImage{
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
                        hotspot,
                        crop,
                        alt
                    },
                    files[]{
                        language,
                        file{
                            asset->{
                                _id,
                                url,
                                originalFilename,
                                size,
                                mimeType
                            }
                        },
                        downloadCount,
                        lastDownloaded
                    },
                    tags[]->{
                        _id,
                        label,
                        "value": value.current,
                        color,
                        category
                    }[_id != null],
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
                    }[_id != null],
                    regionalCommunities[]->{
                        _id,
                        name,
                        slug,
                        code
                    }[_id != null]
                }`,
        { featuredIds, regionalCommunityId },
      );

      items = [...items, ...(recentAgendas || [])];
    }

    return items;
  });
}

// ---------------------------------------------------------------------------
// getAgendas / getAgendaBySlug — named in this task's Produces list, but
// dead code: no agenda listing or detail page exists yet (the sidebar links
// at /research-and-action/{global,regional,community}-agenda* 404 into the
// generic Sanity catch-all today, same situation research-outputs/page.tsx's
// own docstring described before that route existed). Implemented per the
// documented signature, mirroring Task 3/4's precedent for brief-named-but-
// dead helpers (getApprovedCaseStudies / getNewsPosts). `locale` is inert —
// agenda has no per-document language field (title/subtitle/description are
// all Localized objects), matching case-studies.ts's own `void locale`
// precedent for the same situation.
// ---------------------------------------------------------------------------

const AGENDA_FIELDS = `
  _id,
  title,
  subtitle,
  description,
  slug,
  agendaType,
  year,
  publishDate,
  totalDownloadCount,
  featured,
  accessLevel,
  coverImage{
    asset->{
      _id,
      url,
      mimeType,
      metadata { lqip, dimensions { width, height } }
    },
    hotspot,
    crop,
    alt
  },
  files[]{
    language,
    file{
      asset->{
        _id,
        url,
        originalFilename,
        size,
        mimeType
      }
    },
    downloadCount,
    lastDownloaded
  },
  tags[]->{
    _id,
    label,
    "value": value.current,
    color,
    category
  },
  organizations[]->{
    _id,
    name,
    slug,
    acronym,
    logo{
      asset->{ _id, url },
      alt
    }
  },
  regionalCommunities[]->{
    _id,
    name,
    slug,
    code
  }
`;

export async function getAgendas(locale?: Locale): Promise<Agenda[]> {
  void locale; // inert — agenda has no per-document language field
  if (onPayload()) return payloadOutputs.getAgendas();
  const rows = await query<Agenda[] | null>(
    `*[_type == "agenda"] | order(publishDate desc, _id asc){ ${AGENDA_FIELDS} }`,
  );
  return rows ?? [];
}

export async function getAgendaBySlug(slug: string): Promise<Agenda | null> {
  if (onPayload()) return payloadOutputs.getAgendaBySlug(slug);
  return query<Agenda | null>(
    `*[_type == "agenda" && slug.current == $slug][0]{ ${AGENDA_FIELDS} }`,
    { slug },
  );
}

// ---------------------------------------------------------------------------
// Download tracking (app/api/agendas/download/track/route.ts,
// app/api/reports/download/track/route.ts) — writes, so they don't degrade
// via `safe()`; they throw, and each route keeps its OWN local try/catch
// around the call (matching the original's own swallow-on-failure shape —
// see below) rather than letting a failure 500 the tracking endpoint.
//
// Read/write primitive note: the ORIGINAL code read AND wrote through
// `@/sanity/lib/client` (`client.fetch` then `client.patch(...).commit()`),
// not `writeClient`. `client` carries only `SANITY_API_READ_TOKEN` (see
// sanity/lib/client.ts's own comment: "Read token so reads keep working...").
// A `.patch().commit()` against a read-token client almost certainly fails
// at the Sanity API, and the original function's own try/catch swallows
// that failure silently — meaning `totalDownloadCount` / `file.downloadCount`
// (rendered publicly in components/blocks/grid/grid-agenda.tsx and
// grid-report.tsx) have likely never actually incremented in production.
// The seam's write primitive (`updateDocument`) always goes through
// `writeClient` (the editor token) — there is no "write with a read-only
// client" primitive to preserve that bug through. Routing this through
// `updateDocument` therefore incidentally FIXES the counter (it will now
// really increment) as an unavoidable side effect of using the seam as
// designed; the download itself was never gated on this write succeeding,
// so no user-facing flow changes, only the count catches up with reality.
// Flagged explicitly here and in the report rather than silently ignored.
//
// The READ must be `queryLive`, not `query`, even though it maps from a
// plain `client.fetch` elsewhere in this file. `query()` routes through
// `cachedFetch` with a 1-hour revalidate; `client.fetch` on Next 16.3.4 has
// no such caching — it's genuinely live. This read feeds a read-modify-write
// counter (fetch current counts, increment one, recompute the total, write
// the whole array back). A cached read means every download inside the same
// hour reads identical stale counts and writes back identical numbers —
// only the first download per hour would actually move the counter, silently
// undoing the write-side fix above.
//
// NOT `queryRaw`: an earlier revision used `queryRaw` to fix exactly that
// caching problem, but `queryRaw` also switches to the write client's `raw`
// perspective, which sees drafts — a mismatch from the original
// (`app/api/agendas/download/track/route.ts` and
// `app/api/reports/download/track/route.ts`, per `git show 87ef869bc`),
// which called `client.fetch` directly (read client, published
// perspective). `agendaId`/`reportId` come straight from the request body
// (client-supplied), so `queryRaw` would let a caller increment the
// download counter — and read back file/status fields — of an unpublished
// draft agenda/report with no published counterpart. `queryLive` restores
// the original's exact semantics: uncached (fixing the read-modify-write
// race above) AND published-only (no draft visibility), matching
// `client.fetch`.
// ---------------------------------------------------------------------------

interface TrackedAgendaFile {
  language?: string;
  downloadCount?: number;
  lastDownloaded?: string;
  [key: string]: unknown;
}

/**
 * What `trackAgendaDownload` did. The route maps these to 200 / 404 / 400;
 * a thrown error (the write failed) is still the caller's to catch.
 *
 * `language-not-found` exists so that a public, client-supplied
 * `(agendaId, fileLanguage)` pair can be checked against the document's real
 * file list BEFORE anything is written: previously an unknown language still
 * wrote the unchanged file array back — one pointless CMS write per hit, from
 * an unauthenticated route.
 */
export type TrackAgendaDownloadResult = "tracked" | "agenda-not-found" | "language-not-found";

export async function trackAgendaDownload(
  agendaId: string,
  fileLanguage: string,
): Promise<TrackAgendaDownloadResult> {
  // The read-modify-write arithmetic below is single-sourced on purpose: only
  // the read and the write have a backend, and two copies of "increment this
  // file, then recompute the total" would be two chances for the two backends
  // to count differently. The Payload read is `queryLive` for exactly the
  // reasons stated above — see `payload/outputs.ts`'s note 3.
  const agenda = onPayload()
    ? await payloadOutputs.loadTrackedAgenda(agendaId)
    : await queryLive<{ _id: string; files?: TrackedAgendaFile[]; totalDownloadCount?: number } | null>(
        `*[_type == "agenda" && _id == $agendaId][0]{
                _id,
                files,
                totalDownloadCount
            }`,
        { agendaId },
      );

  if (!agenda) return "agenda-not-found";

  const files = agenda.files ?? [];
  if (!files.some((file) => file.language === fileLanguage)) return "language-not-found";

  const updatedFiles = files.map((file) => {
    if (file.language === fileLanguage) {
      return {
        ...file,
        downloadCount: (file.downloadCount || 0) + 1,
        lastDownloaded: new Date().toISOString(),
      };
    }
    return file;
  });

  const newTotalCount = updatedFiles.reduce((total, file) => total + (file.downloadCount || 0), 0);

  if (onPayload()) {
    await payloadOutputs.writeAgendaDownloadCounts(agendaId, updatedFiles, newTotalCount);
    return "tracked";
  }

  await updateDocument(agendaId, {
    files: updatedFiles,
    totalDownloadCount: newTotalCount,
  });
  return "tracked";
}

interface TrackedReportFile {
  language?: string;
  downloadCount?: number;
  lastDownloaded?: string;
  [key: string]: unknown;
}

/**
 * DEAD END — delete in Phase 4, together with
 * `app/api/reports/download/track/route.ts`, its only caller.
 *
 * The legacy `report` type left **0 documents** in Sanity and every one of them
 * was migrated into `researchOutput` (29/29 carry `migratedFromReport`), so
 * Payload models no `reports` collection at all — 23 collections, none of them
 * this one. The Payload arm therefore **throws** rather than resolving: a
 * tracker that returns having written nothing is indistinguishable from one
 * that worked, and this one can never work. The route's own try/catch keeps the
 * download working, exactly as it does on Sanity, where this call has always
 * fallen into the "Report not found" branch below and written nothing either.
 *
 * The in-code comment above claiming `downloadCount` "renders publicly in
 * grid-report.tsx" is **stale**: neither `grid-report.tsx` nor `grid-agenda.tsx`
 * references `downloadCount` any more.
 */
export async function trackReportDownload(reportId: string, fileLanguage: string): Promise<void> {
  if (onPayload()) payloadOutputs.refuseReportDownloadTracking(reportId);
  const report = await queryLive<{ _id: string; files?: TrackedReportFile[]; totalDownloadCount?: number } | null>(
    `*[_type == "report" && _id == $reportId][0]{
                _id,
                files,
                totalDownloadCount
            }`,
    { reportId },
  );

  if (!report) {
    console.error("Report not found:", reportId);
    return;
  }

  const updatedFiles = (report.files ?? []).map((file) => {
    if (file.language === fileLanguage) {
      return {
        ...file,
        downloadCount: (file.downloadCount || 0) + 1,
        lastDownloaded: new Date().toISOString(),
      };
    }
    return file;
  });

  const newTotalCount = updatedFiles.reduce((total, file) => total + (file.downloadCount || 0), 0);

  await updateDocument(reportId, {
    files: updatedFiles,
    totalDownloadCount: newTotalCount,
  });
}

// ---------------------------------------------------------------------------
// ResearchOutput — shared shape for getResearchOutputs / getResearchOutputBySlug
// / getResearchOutputSlugs, moved from sanity/queries/research-output.ts
// (fetchApprovedResearchOutputs / fetchResearchOutputBySlug /
// fetchResearchOutputsStaticParams — the LIVE implementations
// research-outputs/page.tsx and research-outputs/[slug]/page.tsx actually
// called). STYLED_BODY_PROJECTION and RELATED_CONTENT_PROJECTION inlined
// verbatim from sanity/queries/shared/styled-body.ts and
// sanity/queries/grid/grid-case-study.ts, identical to the copies already
// inlined in lib/content/lived-experiences.ts, case-studies.ts and news.ts —
// this module's only Sanity contact stays sanity-source.ts.
//
// Normalizer decision: declined toTag/toRegion here too, for the same
// reason as Tasks 3/4 — the detail page
// (research-and-action/research-outputs/[slug]/page.tsx) consumes tags/
// organizations/relatedCommunities in their raw `_id`-keyed shape directly
// (tag.color, org.acronym-free plain `{_id,name}`, etc.) via
// types/case-study.ts's `Organization` and local casts; reshaping would
// require touching that page's render logic, which is out of scope here.
// ---------------------------------------------------------------------------

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

export interface ResearchOutputVersionItem {
  _key: string;
  kind?: string;
  lang?: string;
  label?: string;
  pages?: number;
  downloadCount?: number;
  fileUrl?: string;
  fileName?: string;
  body?: RichText;
}

export interface ResearchOutput {
  _id: string;
  title?: Localized;
  excerpt?: Localized;
  slug?: string;
  outputType?: string;
  layout?: string;
  status?: string;
  featured?: boolean;
  publishDate?: string;
  year?: number;
  region?: string;
  themes?: string[];
  populations?: string[];
  image?: {
    asset?: { _id: string; url: string } | null;
    alt?: string;
    caption?: string;
  } | null;
  organizations?: Array<{ _id: string; name?: string }>;
  relatedCommunities?: Array<{ _id: string; name?: Localized; slug?: string }>;
  tags?: Array<{ _id: string; label?: Localized; value?: string; color?: string }>;
  versions?: ResearchOutputVersionItem[];
  /** Detail-only (getResearchOutputBySlug). Portable Text today, Lexical after Phase 3. */
  content?: RichText;
  /** Polymorphic connection targets — opaque, per RELATED_CONTENT_PROJECTION. */
  relatedContent?: unknown;
}

const RESEARCH_OUTPUT_FRAGMENT = `
  _id,
  title,
  excerpt,
  "slug": slug.current,
  outputType,
  layout,
  status,
  featured,
  publishDate,
  year,
  region,
  themes,
  populations,
  "image": coverImage{ asset->{ _id, url }, alt, caption },
  organizations[]->{ _id, name },
  relatedCommunities[]->{ _id, name, "slug": slug.current },
  tags[]->{ _id, label, value, color },
  "versions": versions[]{ _key, kind, lang, label, pages, downloadCount, "fileUrl": file.asset->url, "fileName": file.asset->originalFilename, body[]{ ${STYLED_BODY_PROJECTION} } }
`;

const RESEARCH_OUTPUT_BY_SLUG_QUERY = `
  *[_type == "researchOutput" && slug.current == $slug && status == "approved"][0]{
    ${RESEARCH_OUTPUT_FRAGMENT},
    "content": coalesce(content, body)[]{ ${STYLED_BODY_PROJECTION} },
    ${RELATED_CONTENT_PROJECTION}
  }
`;

const APPROVED_RESEARCH_OUTPUTS_QUERY = `
  *[_type == "researchOutput" && status == "approved"] | order(coalesce(publishDate, _createdAt) desc, _id asc){
    ${RESEARCH_OUTPUT_FRAGMENT}
  }
`;

const RESEARCH_OUTPUTS_STATIC_PARAMS_QUERY = `
  *[_type == "researchOutput" && status == "approved" && defined(slug.current)]{ "slug": slug.current }
`;

export async function getResearchOutputBySlug(slug: string): Promise<ResearchOutput | null> {
  if (onPayload()) return payloadOutputs.getResearchOutputBySlug(slug);
  return query<ResearchOutput | null>(RESEARCH_OUTPUT_BY_SLUG_QUERY, { slug });
}

export async function getResearchOutputs(locale?: Locale): Promise<ResearchOutput[]> {
  void locale; // inert — mirrors the original fetchApprovedResearchOutputs, which never filtered on it
  if (onPayload()) return payloadOutputs.getResearchOutputs();
  const rows = await query<ResearchOutput[] | null>(APPROVED_RESEARCH_OUTPUTS_QUERY);
  return rows ?? [];
}

export async function getResearchOutputSlugs(): Promise<{ slug: string }[]> {
  if (onPayload()) return payloadOutputs.getResearchOutputSlugs();
  const rows = await query<{ slug: string }[] | null>(RESEARCH_OUTPUTS_STATIC_PARAMS_QUERY);
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// Submit form option lists (app/[locale]/(main)/research-and-action/
// research-outputs/submit/page.tsx's local fetchAvailableTags /
// fetchRegionalCommunities) — moved verbatim. `tag.value` and
// `regionalCommunity.slug` are Sanity `slug` fields, so the raw (undereferenced)
// projection returns `{ current: string }`, not a plain string — matches
// components/forms/research-output-form.tsx's own local `Tag`/`Community`
// types. No try/catch in the original, so these throw through.
// ---------------------------------------------------------------------------

export interface ResearchOutputTagOption {
  _id: string;
  label?: Localized;
  value?: { current: string };
}

export interface ResearchOutputCommunityOption {
  _id: string;
  name?: Localized;
  slug?: { current: string };
}

export async function getResearchOutputTags(): Promise<ResearchOutputTagOption[]> {
  if (onPayload()) return payloadOutputs.getResearchOutputTags();
  return query<ResearchOutputTagOption[]>(
    `*[_type == "tag"] | order(label.en asc) { _id, label, value }`,
  );
}

export async function getResearchOutputRegionalCommunities(): Promise<ResearchOutputCommunityOption[]> {
  if (onPayload()) return payloadOutputs.getResearchOutputRegionalCommunities();
  return query<ResearchOutputCommunityOption[]>(
    `*[_type == "regionalCommunity" && active == true] | order(name.en asc) { _id, name, slug }`,
  );
}

// ---------------------------------------------------------------------------
// Edit flow (lib/research-outputs/edit.ts, deleted — logic moved here) —
// loads a research output the current user may edit, mapped to the
// submission form's field shape. May edit = the original submitter, OR a
// member of a workspace that lists the doc as an output. Only draft/pending/
// revision docs are editable. A read, not a write — but gated and
// drafts-visible, so it throws on failure like the write paths below rather
// than degrading via `safe()` (same precedent as
// loadEditableLivedExperience / loadEditableCaseStudy).
// ---------------------------------------------------------------------------

export type EditableResearchOutput = {
  status: string;
  reviewNotes: string | null;
  _sanityId: string;
  language: "en" | "es" | "fr" | "ar";
  title: string;
  outputType: string;
  excerpt: string;
  body: RichText;
  region: string;
  themes: string[];
  tagIds: string[];
  communityIds: string[];
  versions: { _key: string; kind: string; lang: string; fileName: string | null }[];
};

interface RawEditableResearchOutputDoc {
  _id: string;
  title?: Record<string, string>;
  outputType?: string;
  excerpt?: Record<string, string>;
  body?: RichText;
  region?: string;
  themes?: string[];
  submittedBy?: string;
  status?: string | null;
  reviewNotes?: string | null;
  tagIds?: string[];
  communityIds?: string[];
  versions?: { _key: string; kind?: string; lang?: string; fileName?: string }[];
}

export async function loadEditableResearchOutput(
  sanityId: string,
  userId: string,
): Promise<EditableResearchOutput | null> {
  const id = sanityId.replace(/^drafts\./, "");
  // Raw perspective: drafts.* docs are invisible to the public read client,
  // and edit mode is exactly about reopening drafts. On Payload there is no
  // `drafts.` id to match — a draft is a version of the same id — so the
  // id-juggling collapses into one lookup, still through `queryRaw`.
  const doc = onPayload()
    ? await payloadOutputs.loadEditableResearchOutputDoc(id)
    : await queryRaw<RawEditableResearchOutputDoc | null>(
        `*[_type == "researchOutput" && (_id == $id || _id == "drafts." + $id)][0]{
      _id, title, outputType, excerpt, body, region, themes,
      submittedBy, status, reviewNotes,
      "tagIds": tags[]._ref,
      "communityIds": relatedCommunities[]._ref,
      "versions": versions[]{ _key, kind, lang, "fileName": file.asset->originalFilename }
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

  // English is the schema-required key, so it's the edit language of record;
  // fall back to whichever localization exists.
  const text = (v: Record<string, string> | undefined) =>
    v?.en ?? Object.values(v ?? {}).find(Boolean) ?? "";

  return {
    _sanityId: doc._id,
    status: doc.status ?? "draft",
    reviewNotes: doc.reviewNotes ?? null,
    language: "en",
    title: text(doc.title),
    outputType: doc.outputType ?? "report",
    excerpt: text(doc.excerpt),
    body: Array.isArray(doc.body) ? doc.body : [],
    region: doc.region ?? "",
    themes: Array.isArray(doc.themes) ? doc.themes : [],
    tagIds: Array.isArray(doc.tagIds) ? doc.tagIds.filter(Boolean) : [],
    communityIds: Array.isArray(doc.communityIds) ? doc.communityIds.filter(Boolean) : [],
    versions: Array.isArray(doc.versions)
      ? doc.versions.map((v) => ({
          _key: v._key,
          kind: v.kind ?? "full",
          lang: v.lang ?? "en",
          fileName: v.fileName ?? null,
        }))
      : [],
  };
}

// ---------------------------------------------------------------------------
// Submission (app/api/research-outputs/submit/route.ts) — a write path.
// Writes throw, not degrade. Multipart file uploads travel in as
// pre-validated buffers (size/mime checked in the route, same split as
// case-studies' image upload); workspace linking (`addOutput`) stays in the
// route, same as case-studies' and lived-experiences' submit routes.
// ---------------------------------------------------------------------------

export interface ResearchOutputVersionUpload {
  kind: string;
  lang: string;
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export interface ResearchOutputInput {
  userId: string;
  title: string;
  outputType: string;
  excerpt?: string;
  body?: RichText;
  region?: string;
  themes?: string[];
  tagIds?: string[];
  communityIds?: string[];
  language: "en" | "es" | "fr" | "ar";
  /** X7 edit mode: resubmit an existing draft/pending/revision doc. */
  editId?: string;
  /** X7 edit mode: _key values of existing version items to keep. */
  keptVersionKeys?: string[];
  newVersions?: ResearchOutputVersionUpload[];
}

interface RawExistingResearchOutput {
  _id: string;
  submittedBy?: string;
  status?: string | null;
  versions?: Array<{ _key?: string; [key: string]: unknown }>;
}

/**
 * Thrown when an edit-mode resubmission isn't allowed — the caller (the API
 * route) maps this to a 403 rather than a 500.
 */
export class ResearchOutputEditNotAllowedError extends Error {
  constructor() {
    super("You can't edit this submission.");
    this.name = "ResearchOutputEditNotAllowedError";
  }
}

export async function submitResearchOutput(input: ResearchOutputInput): Promise<{ id: string }> {
  const lang = input.language;
  // Localized objects: English is the schema-required key; the submission
  // language keeps its own copy when it isn't English.
  const localized = (value: string | undefined) =>
    value ? { en: value, ...(lang !== "en" ? { [lang]: value } : {}) } : undefined;

  // Minted once: `generateResearchOutputSlug` appends a random suffix, so
  // calling it twice would give the Sanity document and the Payload document
  // two different slugs for the same submission.
  const slug = generateResearchOutputSlug(input.title);

  const doc: { _type: string; [key: string]: unknown } = {
    _type: "researchOutput",
    status: "pending", // never trust client; always pending on submit
    submittedBy: input.userId,
    title: localized(input.title),
    slug: { _type: "slug", current: slug },
    outputType: input.outputType,
    excerpt: localized(input.excerpt || undefined),
    region: input.region || undefined,
    themes: input.themes && input.themes.length > 0 ? input.themes : undefined,
    year: new Date().getFullYear(),
  };
  if (Array.isArray(input.body) && input.body.length > 0) doc.body = input.body;
  if (input.tagIds && input.tagIds.length > 0) {
    doc.tags = input.tagIds.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  }
  if (input.communityIds && input.communityIds.length > 0) {
    doc.relatedCommunities = input.communityIds.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  }

  // Upload the documents first, then reference them as version items. The
  // upload is the one primitive whose two implementations agree on a
  // signature, so only the asset store differs: Sanity's `file` assets, or
  // Payload's `files` collection (never `media`, which is images-only).
  const uploaded: { kind: string; lang: string; assetId: string }[] = [];
  for (const version of input.newVersions ?? []) {
    const asset = onPayload()
      ? await uploadPayloadFileAsset(version.buffer, {
          filename: version.filename,
          contentType: version.contentType,
        })
      : await uploadFileAsset(version.buffer, {
          filename: version.filename,
          contentType: version.contentType,
        });
    uploaded.push({ kind: version.kind, lang: version.lang, assetId: asset.id });
  }
  const newVersionItems: Record<string, unknown>[] = uploaded.map((version) => ({
    _type: "documentVersion",
    _key: crypto.randomUUID(),
    kind: version.kind,
    lang: version.lang,
    file: { _type: "file", asset: { _type: "reference", _ref: version.assetId } },
  }));

  // The field values, in neither store's vocabulary. Computed once so the two
  // backends cannot disagree about what a resubmission keeps and what it
  // clears — the same split Task 9 established for lived experiences.
  const draft: payloadOutputs.ResearchOutputDraft = {
    language: lang,
    title: input.title,
    outputType: input.outputType,
    excerpt: input.excerpt || undefined,
    body: Array.isArray(input.body) && input.body.length > 0 ? input.body : undefined,
    region: input.region || undefined,
    themes: input.themes && input.themes.length > 0 ? input.themes : undefined,
    tagIds: input.tagIds,
    communityIds: input.communityIds,
  };

  if (input.editId) {
    const existing = onPayload()
      ? await payloadOutputs.loadExistingResearchOutput(input.editId)
      : await queryRaw<RawExistingResearchOutput | null>(
          `*[_type == "researchOutput" && _id == $id][0]{ _id, submittedBy, status, versions }`,
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
      throw new ResearchOutputEditNotAllowedError();
    }

    const keptVersionKeys = input.keptVersionKeys ?? [];
    const kept = Array.isArray(existing.versions)
      ? existing.versions.filter((v) => v._key && keptVersionKeys.includes(v._key))
      : [];

    const { _type: _t, slug: _slug, submittedBy: _sb, year: _y, ...updatable } = doc;
    // JSON drops undefined, so cleared optional fields must be unset explicitly.
    const cleared = Object.keys(updatable).filter(
      (k) => updatable[k as keyof typeof updatable] === undefined,
    );
    if (!Array.isArray(input.body) || input.body.length === 0) cleared.push("body");
    if (!input.tagIds || input.tagIds.length === 0) cleared.push("tags");
    if (!input.communityIds || input.communityIds.length === 0) cleared.push("relatedCommunities");

    if (onPayload()) {
      // Every name in `cleared` — excerpt, region, themes, body, tags,
      // relatedCommunities — is spelled identically on the Payload collection.
      // The one field that is NOT is `status`, which is `moderationStatus`
      // there; the Payload arm sets it itself rather than being handed a name
      // that would silently write a column Payload does not have.
      await payloadOutputs.updateResearchOutputSubmission(existing._id, draft, cleared, [
        ...kept,
        ...uploaded,
      ]);
      return { id: existing._id };
    }

    const versions = [...kept, ...newVersionItems];
    const set = Object.fromEntries(Object.entries(updatable).filter(([, v]) => v !== undefined));

    await updateDocument(existing._id, {
      ...set,
      versions,
      status: "pending",
      ...Object.fromEntries(cleared.map((k) => [k, null])),
    });
    // The workspace-output row (if any) already exists — no link-back.
    return { id: existing._id };
  }

  if (onPayload()) {
    return payloadOutputs.createResearchOutput(
      draft,
      { id: slug, slug, submittedBy: input.userId, year: new Date().getFullYear() },
      uploaded,
    );
  }

  if (newVersionItems.length > 0) doc.versions = newVersionItems;
  const created = await createDocument(doc);
  return { id: created.id };
}

/**
 * Generic patch primitive for research outputs, mirroring
 * lib/content/case-studies.ts's `updateCaseStudy` — not called by anything
 * in this task's own file list (submitResearchOutput's own edit branch
 * calls `updateDocument` directly, same split as case-studies.ts), kept for
 * parity with the documented Produces signature and future write flows
 * (e.g. moderation/notification bookkeeping, the same role updateCaseStudy
 * plays for lib/case-study-emails.ts).
 */
export async function updateResearchOutput(id: string, patch: Partial<ResearchOutputInput>): Promise<void> {
  if (onPayload()) {
    await payloadOutputs.patchResearchOutput(id, patch as Record<string, unknown>);
    return;
  }
  await updateDocument(id, patch as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Algolia search-index sync (app/api/search/agendas/sync/route.ts,
// app/api/search/agendas/webhook/route.ts) — a raw index-shaped doc distinct
// from `Agenda`. The full/partial sync queries selected an IDENTICAL field
// list (just re-indented by copy-paste at each call site — consolidated
// into one fragment here, same move as news.ts's NEWS_INDEX_FIELDS). The
// webhook's single-doc query is genuinely SMALLER (files projects only
// `{language, downloadCount}`, no dereferenced file asset) — its own
// transform never reads the asset fields, only `f.language` (via
// deriveAgendaLanguages), so that difference is preserved rather than
// unified. Both routes already wrap their whole handler body in try/catch,
// so these keep throwing (no safe()) — the route's existing catch is the
// original failure behaviour. `getAgendaCount` matches the sync route's GET
// status check (`count(*[_type == "agenda"])`, unfiltered — unlike
// news.ts's getPublishedNewsCount, the original never filtered by date).
// ---------------------------------------------------------------------------

export interface AgendaIndexDoc {
  _id: string;
  title?: { en: string; es?: string; fr?: string; ar?: string } | null;
  subtitle?: { en: string; es?: string; fr?: string; ar?: string } | null;
  description?: { en: string; es?: string; fr?: string; ar?: string } | null;
  slug?: { current?: string } | null;
  agendaType?: string | null;
  year?: number | null;
  publishDate?: string | null;
  totalDownloadCount?: number | null;
  featured?: boolean | null;
  accessLevel?: "public" | "registered" | "members" | null;
  organizations?: Array<{ name?: string | null }> | null;
  regionalCommunities?: Array<{ name?: string | null }> | null;
  tags?: Array<{ name?: string | null }> | null;
  coverImage?: { asset?: { url?: string } | null } | null;
  files?: Array<{
    language: string;
    downloadCount?: number;
    file?: { asset?: { url?: string; originalFilename?: string } | null } | null;
  }> | null;
  _updatedAt?: string;
}

const AGENDA_INDEX_FIELDS = `
  _id,
  title,
  subtitle,
  description,
  slug,
  agendaType,
  year,
  publishDate,
  totalDownloadCount,
  featured,
  accessLevel,
  organizations[]->{name},
  regionalCommunities[]->{name},
  tags[]->{name},
  coverImage {
    asset->{url}
  },
  files[] {
    language,
    downloadCount,
    file {
      asset->{
        url,
        originalFilename
      }
    }
  },
  _updatedAt
`;

export async function getPublishedAgendaIndexDocs(): Promise<AgendaIndexDoc[]> {
  if (onPayload()) return payloadOutputs.getPublishedAgendaIndexDocs();
  const rows = await query<AgendaIndexDoc[] | null>(`*[_type == "agenda"] { ${AGENDA_INDEX_FIELDS} }`);
  return rows ?? [];
}

export async function getAgendaIndexDocsByIds(ids: string[]): Promise<AgendaIndexDoc[]> {
  if (onPayload()) return payloadOutputs.getAgendaIndexDocsByIds(ids);
  const rows = await query<AgendaIndexDoc[] | null>(
    `*[_type == "agenda" && _id in $ids] { ${AGENDA_INDEX_FIELDS} }`,
    { ids },
  );
  return rows ?? [];
}

const AGENDA_WEBHOOK_INDEX_FIELDS = `
  _id,
  title,
  subtitle,
  description,
  slug,
  agendaType,
  year,
  publishDate,
  totalDownloadCount,
  featured,
  accessLevel,
  organizations[]->{name},
  regionalCommunities[]->{name},
  tags[]->{name},
  coverImage {
    asset->{url}
  },
  files[] {
    language,
    downloadCount
  },
  _updatedAt
`;

export async function getAgendaIndexDocById(id: string): Promise<AgendaIndexDoc | null> {
  if (onPayload()) return payloadOutputs.getAgendaIndexDocById(id);
  return query<AgendaIndexDoc | null>(
    `*[_type == "agenda" && _id == $id][0] { ${AGENDA_WEBHOOK_INDEX_FIELDS} }`,
    { id },
  );
}

export async function getAgendaCount(): Promise<number> {
  if (onPayload()) return payloadOutputs.getAgendaCount();
  return query<number>(`count(*[_type == "agenda"])`);
}

// ---------------------------------------------------------------------------
// Search index (consumed by Task 10's getSearchIndexRecords dispatcher — no
// call site exists yet, same status as news.ts's getNewsSearchRecords /
// case-studies.ts's getCaseStudySearchRecords). Degrades to an empty list on
// failure. Neither agenda nor researchOutput has a per-document language
// field, so locale always resolves to "en" (localize() still falls back
// through the other locale keys).
// ---------------------------------------------------------------------------

interface RawAgendaSearchRecordDoc {
  _id: string;
  title?: Localized | string;
  description?: Localized | string;
  slug: string;
}

const AGENDA_SEARCH_RECORDS_QUERY = `
  *[_type == "agenda" && defined(slug.current)]{
    _id,
    title,
    description,
    "slug": slug.current
  }
`;

export async function getAgendaSearchRecords(): Promise<SearchRecord[]> {
  return safe("agenda-search-records", [], async () => {
    const docs = onPayload()
      ? await payloadOutputs.getAgendaSearchRecordDocs()
      : await query<RawAgendaSearchRecordDoc[] | null>(AGENDA_SEARCH_RECORDS_QUERY);
    return (docs ?? []).map((d) => {
      const locale: Locale = "en";
      return {
        objectID: d._id,
        kind: "agenda" as const,
        title: localize(d.title, locale),
        excerpt: d.description ? localize(d.description, locale) : undefined,
        // Agendas have no detail route; the section page is where they live.
        url: `/${locale}/research-and-action/regional-agendas`,
        locale,
      };
    });
  });
}

interface RawResearchOutputSearchRecordDoc {
  _id: string;
  title?: Localized | string;
  excerpt?: Localized | string;
  slug: string;
}

const RESEARCH_OUTPUT_SEARCH_RECORDS_QUERY = `
  *[_type == "researchOutput" && status == "approved" && defined(slug.current)]{
    _id,
    title,
    excerpt,
    "slug": slug.current
  }
`;

export async function getResearchOutputSearchRecords(): Promise<SearchRecord[]> {
  return safe("research-output-search-records", [], async () => {
    const docs = onPayload()
      ? await payloadOutputs.getResearchOutputSearchRecordDocs()
      : await query<RawResearchOutputSearchRecordDoc[] | null>(RESEARCH_OUTPUT_SEARCH_RECORDS_QUERY);
    return (docs ?? []).map((d) => {
      const locale: Locale = "en";
      return {
        objectID: d._id,
        kind: "researchOutput" as const,
        title: localize(d.title, locale),
        excerpt: d.excerpt ? localize(d.excerpt, locale) : undefined,
        url: `/${locale}/research-and-action/research-outputs/${d.slug}`,
        locale,
      };
    });
  });
}
