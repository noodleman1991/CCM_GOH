import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import { toTag } from "@/lib/content/internal/normalize";
import type { RawTag } from "@/lib/content/internal/normalize";
import * as payloadTaxonomy from "@/lib/content/internal/payload/taxonomy";
import { query } from "@/lib/content/internal/sanity-source";
import type { ContentTag, Localized } from "@/lib/content/types";

// ---------------------------------------------------------------------------
// Which store answers
//
// Phase 3 moves this module to Payload behind `CONTENT_BACKEND` (or
// `CONTENT_BACKEND_TAXONOMY` for this module alone). Every export below keeps
// the signature it already had: the branch is one line at the top of each
// function, and the GROQ underneath it is untouched, so reverting this module
// is deleting six lines. `activeBackend()` is read per call, never cached in a
// module constant, so a test or a preview deployment can flip it after import.
// ---------------------------------------------------------------------------

const DOMAIN = "taxonomy";

function onPayload(): boolean {
  return activeBackend(DOMAIN) === "payload";
}

// ---------------------------------------------------------------------------
// Tags — a general-purpose "all tags" list. No single call site to copy
// verbatim (the app's existing tag pickers each have their own narrower,
// domain-scoped fetch — getAvailableCaseStudyTags/getAvailableLivedExperienceTags/
// outputs.ts's equivalent, all `{ _id, label, value }` with a bare `value` —
// no `.current`).
//
// Deliberately NOT copying that bare-`value` literal: verified live against
// production_2 (`*[_type=="tag"][0]{value}`) that `tag.value` is a `slug`
// field, so a bare `value` projection returns the raw
// `{ _type: "slug", current: "..." }` object, not a string — the same shape
// mismatch already present in the (reviewed, shipped) sibling literals this
// pattern was copied from, including lived-experiences.ts's own `allTags`
// aggregate. Those are preserved byte-identical because each has a real,
// already-reviewed call site; getTags() has none, so nothing binds it to
// reproduce that defect. Projects `"value": value.current` instead — the
// same fix getCaseStudyFilterTags (case-studies.ts) already applies for its
// own tag projection.
//
// Normalizer decision: ACCEPTED. With `value.current` projected as a plain
// string, this is exactly the `{ _id, label, value, color }` shape toTag()
// expects — a genuine match, not a shortcut.
// ---------------------------------------------------------------------------

const TAGS_QUERY = `*[_type == "tag"] | order(label.en asc) { _id, label, "value": value.current, color }`;

export async function getTags(): Promise<ContentTag[]> {
  if (onPayload()) return payloadTaxonomy.getTags();
  const rows = await query<RawTag[]>(TAGS_QUERY);
  return (rows ?? []).map(toTag);
}

// ---------------------------------------------------------------------------
// Work types / expertise areas — general taxonomy options for the onboarding
// and profile-edit forms' work-type/expertise pickers. `workType`/
// `expertiseArea` documents store `label` as Sanity's
// `internationalizedArrayString` (an array of `{ _key, value }` pairs), not
// the flat `{ en, es, fr, ar }` object `tag`/`regionalCommunity` use — so
// toTag/toRegion (lib/content/internal/normalize.ts) don't apply here; a
// genuine shape mismatch, handled by the small local
// fromInternationalizedArray() below instead.
//
// No existing call site fetches this exact shape (active-only, unlocalized,
// `{ id, label: Localized, value }`) — the one real consumer,
// fetchUserManagementOptionsWithLocale in lib/actions/sync-user-management.ts,
// needs locale-resolved strings, not Localized objects, and keeps its own
// query. Filter (`isActive == true`) and ordering (`order asc, key asc`)
// mirror every existing workType/expertiseArea query in the codebase
// (sanity/queries/work-types.ts's three queries).
// ---------------------------------------------------------------------------

export interface TaxonomyOption {
  id: string;
  label: Localized;
  value: string;
}

interface RawInternationalizedLabel {
  _key: string;
  value: string;
}

interface RawTaxonomyOption {
  _id: string;
  key: string;
  label?: RawInternationalizedLabel[] | null;
}

function fromInternationalizedArray(arr: RawInternationalizedLabel[] | null | undefined): Localized {
  const out: Record<string, string> = {};
  for (const item of arr ?? []) {
    if (item?._key && typeof item.value === "string") out[item._key] = item.value;
  }
  return out as Localized;
}

function toTaxonomyOption(r: RawTaxonomyOption): TaxonomyOption {
  return { id: r._id, value: r.key, label: fromInternationalizedArray(r.label) };
}

const WORK_TYPES_QUERY = `*[_type == "workType" && isActive == true] | order(order asc, key asc) {
  _id,
  key,
  label
}`;

export async function getWorkTypes(): Promise<TaxonomyOption[]> {
  if (onPayload()) return payloadTaxonomy.getWorkTypes();
  const rows = await query<RawTaxonomyOption[]>(WORK_TYPES_QUERY);
  return (rows ?? []).map(toTaxonomyOption);
}

const EXPERTISE_AREAS_QUERY = `*[_type == "expertiseArea" && isActive == true] | order(order asc, key asc) {
  _id,
  key,
  label
}`;

export async function getExpertiseAreas(): Promise<TaxonomyOption[]> {
  if (onPayload()) return payloadTaxonomy.getExpertiseAreas();
  const rows = await query<RawTaxonomyOption[]>(EXPERTISE_AREAS_QUERY);
  return (rows ?? []).map(toTaxonomyOption);
}

// ---------------------------------------------------------------------------
// Authors — the `author` document (sanity/schemas/documents/author.ts): a
// hub member or content contributor's byline identity, distinct from the
// `CaseStudyAuthor`/`NewsPostAuthor` embedded projections case-studies.ts/
// news.ts already declare for their own dereferenced `authors[]->`/
// `author->` fields. No current call site fetches the standalone author
// list or a single author by id — these exist to satisfy this task's
// brief-specified interface, forward-looking for Phase 2/3 consumers, the
// same way getAuthorBySanityId's own doc comment describes it.
//
// getAuthorBySanityId keeps that exact name through Phase 3: Prisma's
// `User.sanityPersonId` column (prisma/schema.prisma:75) references it by
// name, even though no application code reads that column yet.
// ---------------------------------------------------------------------------

export interface Author {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  organizationalAffiliation?: string;
  userId?: string;
}

interface RawAuthor {
  _id: string;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
  organizationalAffiliation?: string | null;
  userId?: string | null;
}

function toAuthor(r: RawAuthor): Author {
  return {
    id: r._id,
    name: r.name,
    slug: r.slug ?? undefined,
    imageUrl: r.imageUrl ?? undefined,
    organizationalAffiliation: r.organizationalAffiliation ?? undefined,
    userId: r.userId ?? undefined,
  };
}

const AUTHOR_PROJECTION = `
    _id,
    name,
    "slug": slug.current,
    "imageUrl": image.asset->url,
    organizationalAffiliation,
    userId
  `;

const AUTHORS_QUERY = `*[_type == "author"] | order(orderRank asc) {${AUTHOR_PROJECTION}}`;

export async function getAuthors(): Promise<Author[]> {
  if (onPayload()) return payloadTaxonomy.getAuthors();
  const rows = await query<RawAuthor[]>(AUTHORS_QUERY);
  return (rows ?? []).map(toAuthor);
}

const AUTHOR_BY_ID_QUERY = `*[_type == "author" && _id == $id][0]{${AUTHOR_PROJECTION}}`;

export async function getAuthorBySanityId(id: string): Promise<Author | null> {
  if (onPayload()) return payloadTaxonomy.getAuthorBySanityId(id);
  const row = await query<RawAuthor | null>(AUTHOR_BY_ID_QUERY, { id });
  return row ? toAuthor(row) : null;
}

// ---------------------------------------------------------------------------
// Organizations — the `organization` document
// (sanity/schemas/documents/organization.ts). No current call site fetches
// the standalone organization list; forward-looking, same rationale as
// getAuthors() above. `name` is a plain string on this document type (not
// Localized, unlike tag/regionalCommunity); `description` is the object's
// one genuinely localized field.
// ---------------------------------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  acronym?: string;
  type?: string;
  description?: Localized;
  logoUrl?: string;
  website?: string;
}

interface RawOrganization {
  _id: string;
  name: string;
  slug?: string | null;
  acronym?: string | null;
  type?: string | null;
  description?: Localized | null;
  logoUrl?: string | null;
  website?: string | null;
}

function toOrganization(r: RawOrganization): Organization {
  return {
    id: r._id,
    name: r.name,
    slug: r.slug ?? undefined,
    acronym: r.acronym ?? undefined,
    type: r.type ?? undefined,
    description: r.description ?? undefined,
    logoUrl: r.logoUrl ?? undefined,
    website: r.website ?? undefined,
  };
}

const ORGANIZATIONS_QUERY = `*[_type == "organization"] | order(orderRank asc) {
  _id,
  name,
  "slug": slug.current,
  acronym,
  type,
  description,
  "logoUrl": logo.asset->url,
  website
}`;

export async function getOrganizations(): Promise<Organization[]> {
  if (onPayload()) return payloadTaxonomy.getOrganizations();
  const rows = await query<RawOrganization[]>(ORGANIZATIONS_QUERY);
  return (rows ?? []).map(toOrganization);
}
