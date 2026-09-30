/**
 * The Payload half of `lib/content/case-studies.ts`.
 *
 * Thirty callable exports above the seam, the most write-heavy module in the
 * layer, and the one whose public contract is spelled differently from what
 * Payload stores. `case-studies.ts` picks between this file and its own GROQ
 * through `activeBackend("case-studies")`; the `safe()` wrappers, the Prisma
 * workspace-membership checks and the two typed errors all stay in the domain
 * module, so a failure degrades — or throws — in the same place on either
 * backend.
 *
 * Measured 2026-09-07 against `production_2` (published perspective, a control
 * count on every query — `count(*[_type=="tag"])` = **67**, the 68th being the
 * never-published draft tag) and the development Payload database:
 *
 * | | Sanity | Payload |
 * |---|---|---|
 * | `caseStudy` published | 27 | 27 |
 * | `approved` | **25** | 25, all `_status: published` |
 * | `pending` | **2** | 2 (one `published`, one draft-latest) |
 * | `caseStudyDraft` | 1 | 1 |
 * | distinct `publishedAt` among approved | **1** | 1 |
 * | `featured == true` | **0** | 0 |
 * | distinct `_updatedAt` | 27 of 27 | `sanityUpdatedAt`, same values |
 * | with `organizations` | 1 | 1 |
 * | with `projects` / `relatedContent` / `studyAreas` / `translations` / `baseDocument` / `language` / `layout` / `seoTitle` / `seoDescription` / `canonicalUrl` / `reviewNotes` / `reviewedBy` | **0** each | not modelled, or null |
 * | `regionalCommunity.order` | **null on all 7** | no such field |
 *
 * ---------------------------------------------------------------------------
 * 1. The status mapping runs BOTH ways
 * ---------------------------------------------------------------------------
 *
 * Payload stores **`moderationStatus`**; the public contract is **`status`**
 * (`CaseStudyStatus`, `getCaseStudiesByStatus()`), and it does not change. The
 * name had to differ: a field literally called `status` on a drafts-enabled
 * collection collides with Payload's own `_status` at the Postgres enum level
 * (`payload/collections/case-studies.ts` carries the failed migration).
 *
 * - **Read:** every projection below emits `status: row.moderationStatus`, and
 *   every filter that says `status == "approved"` becomes
 *   `moderationStatus: {equals: "approved"}`.
 * - **Write:** `case-studies.ts:1297` writes `{...updatable, status: "pending"}`
 *   on a resubmission. On this arm that is `moderationStatus: "pending"`, set
 *   by `payloadData()` below rather than by a caller handing in a field name —
 *   a `status` key would have written a column Payload does not have, and
 *   Payload drops unknown data keys silently, so the resubmission would have
 *   looked like it worked while staying in whatever state it was already in.
 *
 * ---------------------------------------------------------------------------
 * 2. Two published documents are `pending`, so publish state alone is a leak
 * ---------------------------------------------------------------------------
 *
 * `2U42vBhgRaBYxnTE6w726U` and `pbVPtgVbwyH6oOhWZ3wD3a` are `pending` and
 * published. Every read here that returns a case-study **document** to a public
 * surface therefore filters on `APPROVED` **as well as** on the published-only
 * perspective `query()`/`queryLive()` already apply — never on `_status` alone.
 * Both documents carry a `submittedBy` and one carries an `organizations` entry;
 * `reviewNotes`, `submittedBy`, `reviewedBy`, `reviewedAt`, `notifiedStatus` and
 * the identity sub-fields of `authors[]` are additionally field-gated to editors
 * by `isEditorField` on the collection, which guards `/payload-api`. This file
 * runs through the Local API (`overrideAccess: true`), so the field gate is not
 * what protects these reads — the `APPROVED` clause is.
 *
 * **The two deliberate exceptions, both measured, both reproducing Sanity
 * exactly rather than tightening it:**
 *
 * - `getCaseStudyFilterTags` / `getCaseStudyFilterCommunities` count
 *   `count(*[_type == "caseStudy" && references(^._id)])` — every *published*
 *   case study, approved or not. Restricting them to approved is a **visible**
 *   change: measured, five tag chips disappear from the list page's filter
 *   (29 → 24) and `mental-health-support` drops 18 → 16, `eastern-and-south-
 *   eastern-asia` 5 → 4. Neither read returns any case-study field — only a
 *   tag/community row and an aggregate — so this is today's live behaviour
 *   preserved, not a new exposure. Flagged in the task report for a decision;
 *   changing it is not an implementer's call.
 * - `getCaseStudyOgData`'s GROQ names **no** status filter at all
 *   (`*[_type == "caseStudy" && slug.current == $slug][0]`), and projects two
 *   fields: the title and the related community's English name. Reproduced
 *   verbatim — published-only, no moderation filter. Also flagged.
 *
 * Every other document-returning read either filters on `approved` or is
 * deliberately owner/editor-facing (`getCaseStudiesByStatus`,
 * `getUserSubmissionsAndDrafts`, `getCaseStudyRevisions`,
 * `loadEditableCaseStudyDoc`, the two Algolia by-id reads).
 *
 * ---------------------------------------------------------------------------
 * 3. `_id` ascending reproduces Sanity's order on every ordering this uses
 * ---------------------------------------------------------------------------
 *
 * `publishedAt` is a **total** tie on the 25 approved case studies (one distinct
 * value, `2024-01-01T00:00:00Z`) and `featured` is `false` on all 27, so
 * `order(publishedAt desc, featured desc)`, `order(featured desc, publishedAt
 * desc)`, `order(publishedAt desc)` and `order(publishedAt asc, featured desc)`
 * are all completely unordered. Measured: **each of the four returns exactly the
 * `_id`-ascending sequence** (`sequence === [...sequence].sort()` is true for
 * every one; `_id` descending is false). So the plan's first candidate is the
 * one that reproduces today's output, and `_id asc` is appended as the final
 * tie-break on **both** backends.
 *
 * `order(_updatedAt desc)` — `getCaseStudiesByUser` and `getCaseStudiesByStatus`,
 * both dead code — has no tie at all (27 distinct values). Payload answers it
 * from `sanityUpdatedAt`, which the import preserved verbatim, falling back to
 * its own `updatedAt`.
 *
 * Payload cannot compose "by instant, then by code-point id" in one `sort`, so
 * the reads are unpaginated and the ordering is applied here — the same shape
 * `payload/outputs.ts` uses.
 *
 * ---------------------------------------------------------------------------
 * 4. Filtering happens here, not in the `where` clause
 * ---------------------------------------------------------------------------
 *
 * `getFilteredCaseStudies` and `searchCaseStudies` search **four locales at
 * once** (`lower(title.en) match … || lower(title.es) match … || …`). A Payload
 * `where` resolves a localized field against the query's single `locale`, so no
 * one `find` can express that. With 25 approved documents the honest answer is
 * to read them all at `locale: "all"` and apply the predicate here, where the
 * four-locale disjunction is written out exactly as the GROQ writes it.
 *
 * One genuine approximation, stated rather than hidden: GROQ's `match` is
 * **token**-based (`*foo*` matches a word containing `foo`), and this is a
 * plain case-insensitive substring test. For a single-word needle the two agree;
 * for a needle spanning a word boundary the substring test is the looser of the
 * two. No live surface passes a multi-word `search` today — the list page's
 * filter input is a single free-text box — and the parity harness renders the
 * unfiltered list, so this is a difference in a code path neither store is
 * currently asked to walk.
 *
 * ---------------------------------------------------------------------------
 * 5. Datetimes: Sanity omits a zero millisecond suffix, Postgres does not
 * ---------------------------------------------------------------------------
 *
 * Measured across every datetime this module reads:
 *
 * | | Sanity | Payload |
 * |---|---|---|
 * | `publishedAt` | `2024-01-01T00:00:00Z` | `…00.000Z` |
 * | `submittedAt` | `2026-07-15T13:56:09.571Z`, `2026-03-27T19:51:16.584Z` | same |
 * | `_updatedAt` | `2026-07-29T11:16:21Z` (seconds precision) | `sanityUpdatedAt`, `.000Z` |
 * | `studyPeriod.{start,end}Date` | `2024-11-21` (`dateOnly`) | `…T00:00:00.000Z` |
 * | `caseStudyDraft.lastSaved` | `2026-08-11T10:54:47.530Z` | same |
 *
 * **No `caseStudy` value in Sanity carries a literal `.000Z`**, so trimming a
 * zero-millisecond suffix reproduces every observed spelling and leaves the two
 * real sub-second values alone — the same rule, and the same caveat, Task 10
 * recorded for `newsPost`. `studyPeriod` is `dateOnly` in Sanity and truncates
 * to `YYYY-MM-DD`.
 *
 * `publishedAt` is the one that matters: it is rendered on the detail page and
 * travels into the JSON-LD, so three extra characters would be a real diff.
 *
 * ---------------------------------------------------------------------------
 * 6. Shapes Payload spells differently
 * ---------------------------------------------------------------------------
 *
 * - **`studyLocation`** is a Payload `point` — `[lng, lat]`. Sanity returns
 *   `{_type: "geopoint", lat, lng}`, and `lib/case-study-utils.ts` reads
 *   `.lat`/`.lng`. Rebuilt.
 * - **`studyPeriod` / `locationText`** are Payload `group`s, which always come
 *   back spelled out (`{startDate: null, endDate: null}`) even on the 25
 *   documents that set neither. GROQ returns `null` for the whole object.
 *   Collapsed by `groupOrNull`.
 * - **`image.alt`** is `localizedText` in Payload and a plain `string` in
 *   Sanity's `caseStudy` schema. Collapsed to the `en` arm, as
 *   `payload/outputs.ts` does.
 * - **`tags[]->{…, value, …}` binds a BARE `value`**, so Sanity hands back
 *   `{_type: "slug", current: "…"}` — verified on the pinned parity document.
 *   `CaseStudyTagRef.value` is declared `unknown`, so unlike `news.ts:189` and
 *   `outputs.ts:181` there is no type lie to correct here: the honest
 *   reproduction is the slug object, and that is what is emitted. The three
 *   projections that write `"value": value.current` (`getCaseStudyFilterTags`,
 *   `getAvailableCaseStudyTags`, `getUserSubmissionsAndDrafts`) get the flat
 *   string, exactly as their GROQ asks.
 * - **`authors` projected vs. bare.** `CASE_STUDY_PROJECTION_FRAGMENT` names
 *   `authors[]{userId, name, email, role, affiliation->{…}}`, so GROQ emits all
 *   five keys with `null` for the unset ones and **no `_key`**.
 *   `getFilteredCaseStudies` binds `authors` **bare**, so GROQ returns the
 *   stored object — `{_key, name, role}` on the live data, with no key for a
 *   field the document never set. Both are reproduced; they are different
 *   shapes for the same array and conflating them is a visible diff, because
 *   the list page hands the bare one to a **client** component.
 * - **`slug`** bare is `{_type: "slug", current}`. `organization.slug` is the
 *   one place the two stores cannot agree: the single organization in this
 *   dataset was created by this very module's submit path, which writes
 *   `slug: {current}` with **no `_type`**, and Payload stores a flat string that
 *   remembers neither. `{_type: "slug", current}` is emitted — the shape 23 of
 *   the 24 organizations really have. It reaches no rendered surface: the only
 *   case study carrying an organization is one of the two `pending` ones.
 *
 * ---------------------------------------------------------------------------
 * 7. What Payload does not model, and what that costs
 * ---------------------------------------------------------------------------
 *
 * `projects`, `relatedContent`, `language`, `translations`, `baseDocument` and
 * `caseStudyDraft._rev` have **no Payload column**, and all of them are
 * **0-populated in Sanity** (`project` has 0 live documents of its own). Each is
 * answered `null` — which is exactly what a GROQ projection of an unset field
 * returns — and nothing is reconstructed. **No migration is needed**; adding
 * columns for six fields no document sets would invent schema, not content.
 *
 * `_rev` is the one that is not merely unset but unanswerable: it is a Sanity
 * mutation id. `getLatestCaseStudyDraft` returns the whole draft document, so
 * the Sanity arm includes `_rev` and this one does not. The only consumer,
 * `components/forms/case-study-form.tsx`, reads `_id` and the form fields.
 * Recorded for Phase 4 alongside `onboarding._rev`.
 *
 * ---------------------------------------------------------------------------
 * 8. Which primitive each write-feeding read calls
 * ---------------------------------------------------------------------------
 *
 * Six `queryRaw` sites move with this module, and `queryRaw` returns the same
 * shape as `query`/`queryLive`, so nothing about a returned document can tell
 * them apart. `lib/__tests__/content-case-studies.test.ts` mocks
 * `payload-source` — not this reader — and asserts **which primitive was
 * called** at each:
 *
 * | site | primitive | why |
 * |---|---|---|
 * | `getCaseStudyRevisions` | `queryRaw` | a `revision` document may exist only as a draft, and an hour-cached read would show a member stale moderation feedback |
 * | `loadEditableCaseStudyDoc` | `queryRaw` | the edit gate: it decides an authorization question about the document about to be written |
 * | `loadExistingCaseStudy` | `queryRaw` | the resubmission gate, same reason |
 * | `findOrganizationByName` | `queryRaw` | a find-or-create; a cached miss would create a duplicate organization |
 * | `findOwnedDraftId` ×2 (save, delete) | `queryRaw` | ownership checks feeding an update and a delete |
 *
 * There is no `queryLive` site in this module on either backend — all five in
 * the layer belong to `outputs.ts` and `discovery.ts`.
 *
 * `caseStudyDrafts` is a separate collection whose `read` **and**
 * `create`/`update`/`delete` are all `ownerOrEditor`, deliberately widened in
 * Phase 2 so a `community_member` can autosave and reopen their own submission.
 * Nothing here changes that, and nothing here relies on it: the Local API runs
 * with `overrideAccess: true` and the ownership check is the explicit
 * `userId`-scoped lookup below, exactly as the Sanity arm does it.
 */
import "server-only";
import type { Where } from "payload";
import { portableTextToLexical } from "@/lib/content/internal/lexical";
import {
  imageGroup,
  mediaOf,
  type AssetField,
  type ImageGroupKey,
} from "@/lib/content/internal/image-shape";
import { groqObject, localized, orNull } from "@/lib/content/internal/localized";
import type { LocalizedRaw } from "@/lib/content/internal/localized";
import { portableText } from "@/lib/content/internal/payload/rich-text";
import {
  createDocument,
  deleteDocument,
  query,
  queryLive,
  queryPreviewable,
  queryRaw,
  updateDocument,
  escapeContains,
} from "@/lib/content/internal/payload-source";
import type {
  CaseStudy,
  CaseStudyCommunityOption,
  CaseStudyFilterCommunity,
  CaseStudyFilterTag,
  CaseStudyIndexDoc,
  CaseStudyListFilters,
  CaseStudyListItem,
  CaseStudyOgData,
  CaseStudyRegionListItem,
  CaseStudyRevision,
  CaseStudySearchOptions,
  CaseStudySearchResult,
  CaseStudyStatus,
  CaseStudyTagOption,
  CaseStudyTranslations,
  UserSubmissionsAndDrafts,
} from "@/lib/content/case-studies";
import type { RichText } from "@/lib/content/types";

interface Paginated<T> {
  docs: T[];
}

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The moderation half of the public gate. See note 2. */
const APPROVED: Where = { moderationStatus: { equals: "approved" } };

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** GROQ's string ordering: by code point, not by locale collation. */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A Payload `date` column, spelled the way Sanity spells this collection's
 *  datetimes. See note 5. */
function isoDate(value: unknown): string | undefined {
  const raw = value instanceof Date ? value.toISOString() : text(value);
  return raw?.replace(/\.000Z$/, "Z");
}

/** A `dateOnly` field — `studyPeriod.startDate`/`endDate`. See note 5. */
function isoDay(value: unknown): string | undefined {
  const raw = value instanceof Date ? value.toISOString() : text(value);
  return raw?.slice(0, 10);
}

/** An unset Payload container, as the `null` a GROQ projection returns. */
function listOrNull<T>(rows: T[] | undefined | null): T[] | null {
  return Array.isArray(rows) && rows.length > 0 ? rows : null;
}

/** A Payload `group`, which is spelled out even when every field inside it is
 *  unset, as the `null` GROQ returns for the object as a whole. See note 6. */
function groupOrNull<T extends Row>(value: T): T | null {
  return Object.values(value).some((v) => v !== null && v !== undefined) ? groqObject(value) : null;
}

/** Sanity's `slug` field, as the object a bare `slug` projection returns. */
function slugObject(value: unknown): { current: string } | undefined {
  const slug = text(value);
  return slug ? ({ _type: "slug", current: slug } as unknown as { current: string }) : undefined;
}

/** A relationship, whether Payload populated it or left the id behind. */
function relationId(value: unknown): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (isRow(value)) return text(value.id) ?? (value.id === undefined ? undefined : String(value.id));
  return undefined;
}

/** A Payload array row's `_key`, which the import minted as the suffix of the
 *  row id (`case-study-15:authors:author-1`). */
function arrayKey(id: unknown): string {
  const raw = String(id ?? "");
  const colon = raw.lastIndexOf(":");
  return colon >= 0 ? raw.slice(colon + 1) : raw;
}

/** A Payload `point` column (`[lng, lat]`) as Sanity's geopoint. See note 6. */
function geopoint(value: unknown): Row | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const [lng, lat] = value;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return groqObject({ _type: "geopoint", lat, lng });
}

/** An array of `{value}` rows — how the draft collection models a plain
 *  string list — as the string array it stores. */
function stringList(rows: unknown): string[] | undefined {
  if (!Array.isArray(rows)) return undefined;
  const values = rows
    .map((row) => (isRow(row) ? text(row.value) : text(row)))
    .filter((value): value is string => Boolean(value));
  return values.length > 0 ? values : undefined;
}

// ---------------------------------------------------------------------------
// Sub-projections
// ---------------------------------------------------------------------------

/** How much of `asset->{…}` a given projection asks for, as the field lists
 *  `internal/image-shape.ts` speaks. */
const ASSET_SHAPES = {
  full: ["_id", "url", "mimeType", "lqip", "dimensions"],
  idUrl: ["_id", "url"],
  url: ["url"],
} as const satisfies Record<string, readonly AssetField[]>;

type AssetShape = keyof typeof ASSET_SHAPES;

/** `image{ asset->{…}, alt, caption[, hotspot, crop] }`. `keys` names exactly
 *  what the caller's GROQ projects — a key a projection does not name must be
 *  absent, not null. The shape itself, the flattened media row beside it and
 *  the reason both are emitted at once all live in `internal/image-shape.ts`. */
function imageProjection(
  group: unknown,
  shape: AssetShape,
  keys: readonly ImageGroupKey[],
): Row | null {
  return imageGroup(group, { asset: ASSET_SHAPES[shape], keys });
}

interface TagRow {
  id?: unknown;
  label?: LocalizedRaw;
  value?: string | null;
  color?: string | null;
  category?: string | null;
}

/** `tags[]->{ _id, label, value, color }` — a **bare** `value`, so the slug
 *  object rather than the flat string. See note 6. */
function tagProjection(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const tags = rows.filter(isRow).map((raw) => {
    const tag = raw as TagRow;
    return groqObject({
      _id: String(tag.id ?? ""),
      category: orNull(text(tag.category)),
      color: orNull(text(tag.color)),
      label: orNull(localized(tag.label)),
      value: orNull(slugObject(tag.value)),
    });
  });
  return listOrNull(tags);
}

/**
 * `tags` left **un**-dereferenced (`getCaseStudiesByRegion`,
 * `searchCaseStudies`) — a plain Sanity reference array, `CaseStudyRawTagRef`.
 *
 * `_key` is **omitted**, and that is a deliberate absence rather than an
 * oversight: Sanity's is a random uuid minted when the editor added the row
 * (measured: `e9e4db14-5c3a-4e6f-a339-4a8d3dddd97e`), and Payload models a
 * `hasMany` relationship as join-table rows with no per-row key to preserve.
 * Fabricating one would be a value that looks reproducible and is not. Both
 * callers are dead code — zero call sites, no rendered route — so nothing
 * observes the difference.
 */
function rawTagRefs(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const refs = rows
    .map(relationId)
    .filter((id): id is string => Boolean(id))
    .map((id) => groqObject({ _ref: id, _type: "reference" }));
  return listOrNull(refs);
}

interface OrganizationRow {
  id?: unknown;
  name?: string | null;
  slug?: string | null;
  acronym?: string | null;
  logo?: unknown;
}

/** `organizations[]->{ _id, name, slug, acronym, logo{ asset->{_id,url}, alt } }`
 *  and its two narrower twins. */
function organizationProjection(rows: unknown, fields: readonly string[]): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const orgs = rows.filter(isRow).map((raw) => {
    const org = raw as OrganizationRow;
    const all: Row = {
      _id: String(org.id ?? ""),
      acronym: orNull(text(org.acronym)),
      logo: imageProjection(org.logo, "idUrl", ["alt"]),
      name: orNull(text(org.name)),
      slug: orNull(slugObject(org.slug)),
    };
    return groqObject(Object.fromEntries(fields.map((key) => [key, all[key]])));
  });
  return listOrNull(orgs);
}

interface AuthorRow {
  id?: unknown;
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  affiliation?: unknown;
  clerkUserId?: string | null;
  clerkUsername?: string | null;
  clerkImageUrl?: string | null;
}

/** `authors[]{ userId, name, email, role, affiliation->{…} }` — a projection,
 *  so every named key is present and `_key` is not. See note 6. */
function authorProjection(rows: unknown, fields: readonly string[]): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const authors = rows.filter(isRow).map((raw) => {
    const author = raw as AuthorRow;
    const affiliation = organizationProjection(
      author.affiliation === null || author.affiliation === undefined ? [] : [author.affiliation],
      ["_id", "name", "slug", "acronym", "logo"],
    );
    const narrowAffiliation = organizationProjection(
      author.affiliation === null || author.affiliation === undefined ? [] : [author.affiliation],
      ["name", "acronym"],
    );
    const indexAffiliation = organizationProjection(
      author.affiliation === null || author.affiliation === undefined ? [] : [author.affiliation],
      ["name"],
    );
    const all: Row = {
      affiliation: affiliation ? affiliation[0] : null,
      affiliationNarrow: narrowAffiliation ? narrowAffiliation[0] : null,
      affiliationIndex: indexAffiliation ? indexAffiliation[0] : null,
      email: orNull(text(author.email)),
      name: orNull(text(author.name)),
      role: orNull(text(author.role)),
      userId: orNull(text(author.userId)),
    };
    return groqObject(
      Object.fromEntries(
        fields.map((key) => [
          key === "affiliationNarrow" || key === "affiliationIndex" ? "affiliation" : key,
          all[key],
        ]),
      ),
    );
  });
  return listOrNull(authors);
}

/** `authors` bound **bare**, so the stored object: `_key` plus only the fields
 *  the document actually set. See note 6. */
function rawAuthors(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const authors = rows.filter(isRow).map((raw) => {
    const author = raw as AuthorRow;
    const stored: Row = { _key: arrayKey(author.id) };
    const put = (key: string, value: string | undefined) => {
      if (value !== undefined) stored[key] = value;
    };
    put("clerkImageUrl", text(author.clerkImageUrl));
    put("clerkUserId", text(author.clerkUserId));
    put("clerkUsername", text(author.clerkUsername));
    put("email", text(author.email));
    put("name", text(author.name));
    put("role", text(author.role));
    put("userId", text(author.userId));
    const affiliationId = relationId(author.affiliation);
    if (affiliationId) {
      stored.affiliation = groqObject({ _ref: affiliationId, _type: "reference" });
    }
    return groqObject(stored);
  });
  return listOrNull(authors);
}

interface CommunityRow {
  id?: unknown;
  name?: LocalizedRaw;
  slug?: string | null;
  active?: boolean | null;
  orderRank?: string | null;
  region?: string | null;
}

/** `studyAreas[]{ location, name, description }` — 0/27 populated in both
 *  stores, implemented against the schema rather than the data. */
function studyAreas(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const areas = rows.filter(isRow).map((raw) =>
    groqObject({
      description: orNull(text(raw.description)),
      location: geopoint(raw.location),
      name: orNull(text(raw.name)),
    }),
  );
  return listOrNull(areas);
}

// ---------------------------------------------------------------------------
// The case-study row
// ---------------------------------------------------------------------------

interface CaseStudyRow {
  id?: unknown;
  title?: LocalizedRaw;
  excerpt?: LocalizedRaw;
  content?: Partial<Record<string, unknown>> | null;
  slug?: string | null;
  topic?: string | null;
  layout?: string | null;
  region?: string | null;
  themes?: string[] | null;
  populations?: string[] | null;
  moderationStatus?: string | null;
  publishedAt?: string | null;
  submittedAt?: string | null;
  submittedBy?: string | null;
  featured?: boolean | null;
  image?: unknown;
  authors?: unknown;
  organizations?: unknown;
  tags?: unknown;
  relatedCommunity?: unknown;
  studyPeriod?: Row | null;
  locationText?: Row | null;
  studyLocation?: unknown;
  locationPrecision?: string | null;
  locationCountryCode?: string | null;
  locationDisplayText?: string | null;
  originalLanguage?: string | null;
  suggestedTags?: unknown;
  studyAreas?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  reviewNotes?: string | null;
  reviewedBy?: unknown;
  reviewedAt?: string | null;
  sanityUpdatedAt?: string | null;
  updatedAt?: string | null;
}

/** `_updatedAt` — Sanity's own system timestamp, which the import preserved in
 *  `sanityUpdatedAt`. */
function updatedAt(row: CaseStudyRow): string | undefined {
  return isoDate(row.sanityUpdatedAt) ?? isoDate(row.updatedAt);
}

/** `order(<date> desc, _id asc)` — see note 3. Compared by instant, not by
 *  string: the two stores spell the same instant differently. A row with no
 *  date sorts last, as GROQ's descending order puts it. */
function byDateThenId(
  a: { date?: string; id: string },
  b: { date?: string; id: string },
  direction: "asc" | "desc" = "desc",
): number {
  const left = a.date ? Date.parse(a.date) : Number.NaN;
  const right = b.date ? Date.parse(b.date) : Number.NaN;
  if (!Number.isNaN(left) || !Number.isNaN(right)) {
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    if (right !== left) return direction === "desc" ? right - left : left - right;
  }
  return byCodePoint(a.id, b.id);
}

function byPublishedAt(rows: CaseStudyRow[], direction: "asc" | "desc" = "desc"): CaseStudyRow[] {
  return [...rows].sort((a, b) =>
    byDateThenId(
      { date: isoDate(a.publishedAt), id: String(a.id ?? "") },
      { date: isoDate(b.publishedAt), id: String(b.id ?? "") },
      direction,
    ),
  );
}

/** `CASE_STUDY_PROJECTION_FRAGMENT`, key for key. */
function caseStudyFragment(row: CaseStudyRow): Row {
  return {
    _id: String(row.id ?? ""),
    authors: authorProjection(row.authors, ["userId", "name", "email", "role", "affiliation"]),
    excerpt: orNull(localized(row.excerpt)),
    featured: row.featured ?? null,
    image: imageProjection(row.image, "full", ["hotspot", "crop", "alt", "caption"]),
    locationDisplayText: orNull(text(row.locationDisplayText)),
    locationText: groupOrNull({
      city: orNull(text(row.locationText?.city)),
      country: orNull(text(row.locationText?.country)),
    }),
    organizations: organizationProjection(row.organizations, ["_id", "name", "slug", "acronym", "logo"]),
    originalLanguage: orNull(text(row.originalLanguage)),
    // `projects` has no Payload column and 0 Sanity documents. See note 7.
    projects: null,
    publishedAt: orNull(isoDate(row.publishedAt)),
    slug: orNull(slugObject(row.slug)),
    status: orNull(text(row.moderationStatus)),
    studyAreas: studyAreas(row.studyAreas),
    studyLocation: geopoint(row.studyLocation),
    studyPeriod: groupOrNull({
      endDate: orNull(isoDay(row.studyPeriod?.endDate)),
      startDate: orNull(isoDay(row.studyPeriod?.startDate)),
    }),
    submittedAt: orNull(isoDate(row.submittedAt)),
    submittedBy: orNull(text(row.submittedBy)),
    tags: tagProjection(row.tags),
    title: orNull(localized(row.title)),
  };
}

/** `CASE_STUDY_DETAIL_PROJECTION_FRAGMENT` — the fragment plus the eight keys
 *  the detail page adds. */
function caseStudyDetail(row: CaseStudyRow): CaseStudy {
  const locales = ["originalLanguage" in row && typeof row.originalLanguage === "string" ? row.originalLanguage : "en", "en", "es", "fr", "ar"];
  const contentLanguage = row.content ? locales.find((l) => (row.content as Record<string, unknown>)[l]) ?? null : null;
  const body = contentLanguage ? (row.content as Record<string, unknown>)[contentLanguage] : undefined;
  return groqObject({
    ...caseStudyFragment(row),
    canonicalUrl: orNull(text(row.canonicalUrl)),
    content: body ? portableText(body) : null,
    contentLanguage: orNull(contentLanguage),
    layout: orNull(text(row.layout)),
    // `relatedContent` has no Payload column and 0 Sanity documents. Note 7.
    relatedContent: null,
    reviewNotes: orNull(text(row.reviewNotes)),
    reviewedAt: orNull(isoDate(row.reviewedAt)),
    reviewedBy: orNull(relationId(row.reviewedBy)),
    seoDescription: orNull(text(row.seoDescription)),
    seoTitle: orNull(text(row.seoTitle)),
  }) as unknown as CaseStudy;
}

// ---------------------------------------------------------------------------
// Reads: the detail page
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Push-down (2026-09-17)
// ---------------------------------------------------------------------------
//
// Every list reader below used to fetch the whole collection at depth 2 in all
// four locales with no `select` — about 2 MB of Lexical `content` per read on
// a table where no card renders it — and then filter, sort and slice in
// JavaScript. Each reader now names the rows, the order, the slice and the
// columns it renders.
//
// Ordering: `sort: ["-publishedAt", …, "id"]`. The `id` tie-break is explicit
// because Payload's adapter otherwise appends `-createdAt`, which is not
// Sanity's `_id asc`. Whether `ORDER BY id` is code-point order depends on the
// database collation (`C.UTF-8` on dev, where it is; unverified on prod) —
// scripts/parity/order-check.ts proves SQL order == the previous JavaScript
// order on the real rows, and must be re-run against production before the
// flag flips there.
//
// `select` is include-mode and pushed to SQL columns, including the `_locales`
// join, so leaving `content` out really avoids reading it.

/** `CASE_STUDY_PROJECTION_FRAGMENT`'s inputs — everything `caseStudyFragment` reads. */
const FRAGMENT_SELECT = {
  title: true,
  excerpt: true,
  slug: true,
  featured: true,
  publishedAt: true,
  moderationStatus: true,
  submittedAt: true,
  submittedBy: true,
  image: true,
  authors: true,
  organizations: true,
  tags: true,
  studyAreas: true,
  studyLocation: true,
  locationDisplayText: true,
  locationText: true,
  originalLanguage: true,
  studyPeriod: true,
} as const;

/** What the list page's item projection reads. */
const LIST_SELECT = {
  title: true,
  excerpt: true,
  slug: true,
  featured: true,
  publishedAt: true,
  topic: true,
  image: true,
  authors: true,
  organizations: true,
  relatedCommunity: true,
  tags: true,
  // The case study's own region code — 9 of 25 have a region but no community.
  region: true,
} as const;

/** `CASE_STUDY_INDEX_FIELDS`'s inputs — everything `caseStudyIndexProjection` reads. */
const INDEX_SELECT = {
  title: true,
  excerpt: true,
  slug: true,
  featured: true,
  publishedAt: true,
  moderationStatus: true,
  region: true,
  themes: true,
  populations: true,
  image: true,
  authors: true,
  organizations: true,
  tags: true,
  studyLocation: true,
  locationDisplayText: true,
  locationText: true,
  originalLanguage: true,
  studyPeriod: true,
  sanityUpdatedAt: true,
  updatedAt: true,
} as const;

/** `title match $q || excerpt match $q`, approximated as GROQ did: a
 *  case-insensitive substring over every locale arm (`contains` at
 *  `locale: "all"` joins `_locales` without a locale predicate, so it matches
 *  any arm). Wildcards in the term are escaped. */
function searchClause(term: string): Where {
  const needle = escapeContains(term);
  return { or: [{ title: { contains: needle } }, { excerpt: { contains: needle } }] };
}

function andAll(...clauses: (Where | null | undefined | false)[]): Where {
  const kept = clauses.filter((c): c is Where => Boolean(c));
  return kept.length === 1 ? kept[0] : { and: kept };
}

/**
 * One approved case study by slug — **`queryPreviewable`**, matching the Sanity
 * twin, whose `sanityFetch` omitted `perspective`/`stega` so `draftMode()`
 * decided. That is what lets an editor previewing this case study see their own
 * unpublished changes; `query()` would silently end that.
 *
 * The `approved` filter is applied on **both** perspectives, exactly as the
 * GROQ's `status == "approved"` is: a preview of a pending case study returns
 * nothing on either backend.
 */
export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  const result = await queryPreviewable<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { and: [APPROVED, { slug: { equals: slug } }] },
    limit: 1,
    locale: "all",
    depth: 2,
  });
  const row = result.docs[0];
  return row ? caseStudyDetail(row) : null;
}

export async function getCaseStudySlugs(): Promise<string[]> {
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { and: [APPROVED, { slug: { exists: true } }] },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  // The GROQ names no `order()`, so neither does this.
  return result.docs.map((row) => text(row.slug)).filter((slug): slug is string => Boolean(slug));
}

/**
 * The OG card's two fields.
 *
 * The GROQ names **no** status filter, so neither does this — see note 2's
 * second exception. `query()`'s published-only perspective is the whole gate on
 * both backends.
 */
export async function getCaseStudyOgData(slug: string): Promise<CaseStudyOgData | null> {
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { slug: { equals: slug } },
    limit: 1,
    locale: "all",
    depth: 1,
  });
  const row = result.docs[0];
  if (!row) return null;
  const community = isRow(row.relatedCommunity) ? (row.relatedCommunity as CommunityRow) : undefined;
  return groqObject({
    region: orNull(localized(community?.name)?.en),
    title: orNull(localized(row.title)),
  }) as unknown as CaseStudyOgData;
}

// ---------------------------------------------------------------------------
// Reads: the eleven moved helpers
// ---------------------------------------------------------------------------

export async function getApprovedCaseStudies(limit: number): Promise<CaseStudy[]> {
  // GROQ: `order(publishedAt desc, featured desc)[0...$limit]`.
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: APPROVED,
    sort: ["-publishedAt", "-featured", "id"],
    limit,
    pagination: false,
    locale: "all",
    depth: 1,
    select: FRAGMENT_SELECT,
  });
  return result.docs.map((row) => groqObject(caseStudyFragment(row)) as unknown as CaseStudy);
}

export async function getFeaturedCaseStudies(limit: number): Promise<CaseStudy[]> {
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: andAll(APPROVED, { featured: { equals: true } }),
    sort: ["-publishedAt", "id"],
    limit,
    pagination: false,
    locale: "all",
    depth: 1,
    select: FRAGMENT_SELECT,
  });
  return result.docs.map((row) => groqObject(caseStudyFragment(row)) as unknown as CaseStudy);
}

/** The narrower projection `getCaseStudiesByUser` and `getCaseStudiesByStatus`
 *  share — `image` without `hotspot`/`crop`, `authors` narrowed per caller. */
function submissionProjection(row: CaseStudyRow, authorFields: readonly string[], extra: Row = {}): CaseStudy {
  return groqObject({
    _id: String(row.id ?? ""),
    authors: authorProjection(row.authors, authorFields),
    excerpt: orNull(localized(row.excerpt)),
    featured: row.featured ?? null,
    image: imageProjection(row.image, "full", ["alt", "caption"]),
    // `language` has no Payload column and 0 Sanity documents. Note 7.
    language: null,
    publishedAt: orNull(isoDate(row.publishedAt)),
    slug: orNull(slugObject(row.slug)),
    status: orNull(text(row.moderationStatus)),
    submittedAt: orNull(isoDate(row.submittedAt)),
    title: orNull(localized(row.title)),
    ...extra,
  }) as unknown as CaseStudy;
}

/** `order(_updatedAt desc)` — no tie on this data (27 distinct), `_id asc`
 *  appended anyway so the ordering is total. See note 3. */
function byUpdatedAt(rows: CaseStudyRow[]): CaseStudyRow[] {
  return [...rows].sort((a, b) =>
    byDateThenId({ date: updatedAt(a), id: String(a.id ?? "") }, { date: updatedAt(b), id: String(b.id ?? "") }),
  );
}

export async function getCaseStudiesByUser(userId: string, limit: number): Promise<CaseStudy[]> {
  const result = await queryPreviewable<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { submittedBy: { equals: userId } },
    pagination: false,
    locale: "all",
    depth: 2,
  });
  return byUpdatedAt(result.docs)
    .slice(0, limit)
    .map((row) => submissionProjection(row, ["name", "role"]));
}

export async function getCaseStudiesByStatus(status: CaseStudyStatus, limit: number): Promise<CaseStudy[]> {
  const result = await queryPreviewable<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    // The write direction of note 1, in a filter: the public vocabulary
    // `status` selects on the stored `moderationStatus`.
    where: { moderationStatus: { equals: status } },
    pagination: false,
    locale: "all",
    depth: 2,
  });
  return byUpdatedAt(result.docs)
    .slice(0, limit)
    .map((row) =>
      submissionProjection(row, ["name", "role", "email"], {
        submittedBy: orNull(text(row.submittedBy)),
        reviewNotes: orNull(text(row.reviewNotes)),
        reviewedAt: orNull(isoDate(row.reviewedAt)),
        // `reviewedBy->{name}` — 0/27 populated in both stores.
        reviewedBy: isRow(row.reviewedBy)
          ? groqObject({ name: orNull(text((row.reviewedBy as Row).name)) })
          : null,
      }),
    );
}

/**
 * `language`, `baseDocument` and `translations` have no Payload column and 0
 * Sanity documents, so the whole projection is nulls around the id. See note 7.
 */
export async function getCaseStudyTranslations(caseStudyId: string): Promise<CaseStudyTranslations | null> {
  const row = await query<CaseStudyRow | null>({
    type: "findByID",
    collection: "caseStudies",
    id: caseStudyId,
    locale: "all",
    depth: 0,
  });
  if (!row) return null;
  return groqObject({
    _id: String(row.id ?? caseStudyId),
    baseDocument: null,
    language: null,
    translations: null,
  }) as unknown as CaseStudyTranslations;
}

/** `getCaseStudiesByRegion` — `references(*[_type == "regionalCommunity" &&
 *  slug.current == $slug][0]._id)`, which on this content means the
 *  `relatedCommunity` reference. `tags` is left un-dereferenced. */
export async function getCaseStudiesByRegion(
  rcSlug: string,
  orderDirection: "asc" | "desc",
  limit: number,
): Promise<CaseStudyRegionListItem[]> {
  // GROQ: `order(publishedAt ${dir}, featured desc)[0...$limit]`. Depth 2 stays
  // because `organizations[].logo` is a second hop; `content` stays out.
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { and: [APPROVED, { "relatedCommunity.slug": { equals: rcSlug } }] },
    sort: [orderDirection === "desc" ? "-publishedAt" : "publishedAt", "-featured", "id"],
    limit,
    pagination: false,
    locale: "all",
    depth: 2,
    select: FRAGMENT_SELECT,
  });
  return result.docs
    .map((row) => {
      return groqObject({
        _id: String(row.id ?? ""),
        authors: authorProjection(row.authors, ["userId", "name", "email", "role", "affiliation"]),
        excerpt: orNull(localized(row.excerpt)),
        featured: row.featured ?? null,
        image: imageProjection(row.image, "full", ["alt", "caption"]),
        language: null,
        organizations: organizationProjection(row.organizations, ["_id", "name", "slug", "acronym", "logo"]),
        projects: null,
        publishedAt: orNull(isoDate(row.publishedAt)),
        slug: orNull(slugObject(row.slug)),
        status: orNull(text(row.moderationStatus)),
        studyAreas: studyAreas(row.studyAreas),
        studyLocation: geopoint(row.studyLocation),
        studyPeriod: groupOrNull({
          endDate: orNull(isoDay(row.studyPeriod?.endDate)),
          startDate: orNull(isoDay(row.studyPeriod?.startDate)),
        }),
        tags: rawTagRefs(row.tags),
        title: orNull(localized(row.title)),
      }) as unknown as CaseStudyRegionListItem;
    });
}

/** The four-locale disjunction of note 4, written out. */
function matchesAnyLocale(value: LocalizedRaw, needle: string): boolean {
  if (!value) return false;
  return Object.values(value).some(
    (arm) => typeof arm === "string" && arm.toLowerCase().includes(needle),
  );
}

export async function searchCaseStudies(
  term: string | undefined,
  options: CaseStudySearchOptions,
): Promise<CaseStudySearchResult[]> {
  const { language, tags, limit = 20 } = options;
  // `language` is 0/27 populated in Sanity and has no Payload column, so a
  // caller passing one gets nothing on either backend — reproduced, not fixed,
  // and now answered before the query rather than after reading everything.
  if (language) return [];

  // `count((tags.<locale>[]->value.current)[@ in $tags]) > 0` — `tags` is not
  // a localized field in either store, so all four arms of the original ask
  // the same question. Depth 2 stays for `authors[].affiliation` (narrow).
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: andAll(
      APPROVED,
      term ? searchClause(term) : null,
      tags && tags.length > 0 ? { "tags.value": { in: tags } } : null,
    ),
    sort: ["-featured", "-publishedAt", "id"],
    limit,
    pagination: false,
    locale: "all",
    depth: 2,
    select: { title: true, excerpt: true, slug: true, featured: true, publishedAt: true, image: true, authors: true, tags: true },
  });

  return result.docs
    .map((row) =>
      groqObject({
        _id: String(row.id ?? ""),
        authors: authorProjection(row.authors, ["name", "role", "affiliationNarrow"]),
        excerpt: orNull(localized(row.excerpt)),
        featured: row.featured ?? null,
        image: imageProjection(row.image, "full", ["alt", "caption"]),
        language: null,
        publishedAt: orNull(isoDate(row.publishedAt)),
        slug: orNull(slugObject(row.slug)),
        tags: rawTagRefs(row.tags),
        title: orNull(localized(row.title)),
      }) as unknown as CaseStudySearchResult,
    );
}

// ---------------------------------------------------------------------------
// Reads: the list page
// ---------------------------------------------------------------------------

export async function getFilteredCaseStudies(filters: CaseStudyListFilters): Promise<CaseStudyListItem[]> {
  // GROQ: `order(featured desc, publishedAt desc)[0...50]`, every filter in
  // the `where`. The list item reads one hop of each relationship, so depth 1.
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: andAll(
      APPROVED,
      filters.topics && filters.topics.length > 0 ? { topic: { in: filters.topics } } : null,
      filters.tags && filters.tags.length > 0 ? { "tags.value": { in: filters.tags } } : null,
      filters.communities && filters.communities.length > 0
        ? { "relatedCommunity.slug": { in: filters.communities } }
        : null,
      filters.search ? searchClause(filters.search) : null,
    ),
    sort: ["-featured", "-publishedAt", "id"],
    limit: 50,
    pagination: false,
    locale: "all",
    depth: 1,
    select: LIST_SELECT,
  });

  return result.docs
    .map((row) => {
      const community = isRow(row.relatedCommunity) ? (row.relatedCommunity as CommunityRow) : undefined;
      return groqObject({
        _id: String(row.id ?? ""),
        // `authors` bound BARE — the stored object, not a projection. Note 6.
        authors: rawAuthors(row.authors),
        communitySlug: orNull(text(community?.slug)),
        excerpt: orNull(localized(row.excerpt)),
        featured: row.featured ?? null,
        image: imageProjection(row.image, "idUrl", ["alt"]),
        organizations: organizationProjection(row.organizations, ["_id", "name"]),
        publishedAt: orNull(isoDate(row.publishedAt)),
        regionCode: orNull(text(row.region)),
        relatedCommunity: orNull(localized(community?.name)),
        slug: text(row.slug) ?? null,
        tags: tagProjection(row.tags),
        title: orNull(localized(row.title)),
        topic: orNull(text(row.topic)),
      }) as unknown as CaseStudyListItem;
    });
}

// ---------------------------------------------------------------------------
// Reads: the filter and option lists
// ---------------------------------------------------------------------------

/**
 * How many **published** case studies reference each tag / community.
 *
 * `references(^._id)` counts across the whole published dataset, approved or
 * not — see note 2's first exception. Verified for tags: the `references()`
 * count equals the `tags[]` count on all 67 tags, so the reverse lookup can be
 * answered by reading the case studies' own tag ids rather than by a join.
 */
async function publishedCaseStudyReferences(): Promise<{ tags: Map<string, number>; communities: Map<string, number> }> {
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    pagination: false,
    locale: "all",
    depth: 0,
    // Only the two relationship columns are counted; the per-request memo in
    // payload-source dedupes the second caller on the same page.
    select: { tags: true, relatedCommunity: true },
  });
  const tags = new Map<string, number>();
  const communities = new Map<string, number>();
  for (const row of result.docs) {
    for (const tag of Array.isArray(row.tags) ? row.tags : []) {
      const id = relationId(tag);
      if (id) tags.set(id, (tags.get(id) ?? 0) + 1);
    }
    const community = relationId(row.relatedCommunity);
    if (community) communities.set(community, (communities.get(community) ?? 0) + 1);
  }
  return { tags, communities };
}

export async function getCaseStudyFilterTags(): Promise<CaseStudyFilterTag[]> {
  const [{ tags: counts }, all] = await Promise.all([
    publishedCaseStudyReferences(),
    query<Paginated<TagRow>>({ type: "find", collection: "tags", pagination: false, locale: "all", depth: 0 }),
  ]);
  return all.docs
    .filter((tag) => (counts.get(String(tag.id ?? "")) ?? 0) > 0)
    .sort((a, b) => byCodePoint(localized(a.label)?.en ?? "", localized(b.label)?.en ?? ""))
    .map((tag) =>
      groqObject({
        _id: String(tag.id ?? ""),
        caseStudyCount: counts.get(String(tag.id ?? "")) ?? 0,
        category: orNull(text(tag.category)),
        color: orNull(text(tag.color)),
        label: orNull(localized(tag.label)),
        // `"value": value.current` — the flat string this projection asks for.
        value: orNull(text(tag.value)),
      }),
    ) as unknown as CaseStudyFilterTag[];
}

export async function getCaseStudyFilterCommunities(): Promise<CaseStudyFilterCommunity[]> {
  const [{ communities: counts }, all] = await Promise.all([
    publishedCaseStudyReferences(),
    query<Paginated<CommunityRow>>({
      type: "find",
      collection: "regionalCommunities",
      pagination: false,
      locale: "all",
      depth: 0,
    }),
  ]);
  // `order(order asc, name.en asc)`. `regionalCommunity.order` is null on all
  // seven documents in Sanity and has no Payload column at all, so the primary
  // key is inert on both backends and the ordering is `name.en asc`.
  return [...all.docs]
    .sort((a, b) => byCodePoint(localized(a.name)?.en ?? "", localized(b.name)?.en ?? ""))
    .map((community) =>
      groqObject({
        _id: String(community.id ?? ""),
        caseStudyCount: counts.get(String(community.id ?? "")) ?? 0,
        name: orNull(localized(community.name)),
        slug: text(community.slug) ?? null,
      }),
    ) as unknown as CaseStudyFilterCommunity[];
}

export async function getAvailableCaseStudyTags(): Promise<CaseStudyTagOption[]> {
  const result = await query<Paginated<TagRow>>({
    type: "find",
    collection: "tags",
    pagination: false,
    locale: "all",
    depth: 0,
  });
  return [...result.docs]
    .sort((a, b) => byCodePoint(localized(a.label)?.en ?? "", localized(b.label)?.en ?? ""))
    .map((tag) =>
      groqObject({
        _id: String(tag.id ?? ""),
        category: orNull(text(tag.category)),
        label: orNull(localized(tag.label)),
        // A BARE `value` here too — `*[_type == "tag"] … { _id, label, value }`.
        value: orNull(slugObject(tag.value)),
      }),
    ) as unknown as CaseStudyTagOption[];
}

export async function getActiveCaseStudyCommunities(): Promise<CaseStudyCommunityOption[]> {
  const result = await query<Paginated<CommunityRow>>({
    type: "find",
    collection: "regionalCommunities",
    where: { active: { equals: true } },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  return [...result.docs]
    .sort((a, b) => byCodePoint(localized(a.name)?.en ?? "", localized(b.name)?.en ?? ""))
    .map((community) =>
      groqObject({
        _id: String(community.id ?? ""),
        name: orNull(localized(community.name)),
        region: orNull(text(community.region)),
        slug: orNull(slugObject(community.slug)),
      }),
    ) as unknown as CaseStudyCommunityOption[];
}

// ---------------------------------------------------------------------------
// Reads: the dashboard
// ---------------------------------------------------------------------------

interface DraftRow {
  id?: unknown;
  userId?: string | null;
  lastSaved?: string | null;
  title?: LocalizedRaw;
  excerpt?: LocalizedRaw;
  topic?: string | null;
  contentLanguage?: string | null;
  content?: unknown;
  image?: unknown;
  tags?: unknown;
  selectedTags?: unknown;
  suggestedTags?: unknown;
  layout?: string | null;
  authors?: unknown;
  studyPeriod?: Row | null;
  locationText?: Row | null;
  studyLocation?: unknown;
  locationDisplayText?: string | null;
  locationPrecision?: string | null;
  locationCountryCode?: string | null;
  studyAreas?: unknown;
  organizations?: unknown;
  relatedCommunity?: string | null;
  formMetadata?: Row | null;
  organizationName?: string | null;
  sanityUpdatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** `formMetadata{ currentStep, completedSections }` — `completedSections` is an
 *  array of `{value}` rows in Payload and a string array in Sanity. */
function formMetadata(value: Row | null | undefined): Row | null {
  if (!value) return null;
  return groupOrNull({
    completedSections: orNull(stringList(value.completedSections)),
    currentStep: orNull(text(value.currentStep)),
    organizationName: orNull(text(value.organizationName)),
  });
}

export async function getUserSubmissionsAndDrafts(userId: string): Promise<UserSubmissionsAndDrafts> {
  const [submissions, drafts] = await Promise.all([
    queryPreviewable<Paginated<CaseStudyRow>>({
      type: "find",
      collection: "caseStudies",
      where: { submittedBy: { equals: userId } },
      pagination: false,
      locale: "all",
      depth: 2,
    }),
    queryPreviewable<Paginated<DraftRow>>({
      type: "find",
      collection: "caseStudyDrafts",
      where: { userId: { equals: userId } },
      pagination: false,
      locale: "all",
      // depth 1 (was 0): Task 13 dereferences `tags` here too, so a draft
      // card can show a main theme — everything else this reads is scalar.
      depth: 1,
    }),
  ]);

  const orderedSubmissions = [...submissions.docs].sort((a, b) =>
    byDateThenId(
      { date: isoDate(a.submittedAt), id: String(a.id ?? "") },
      { date: isoDate(b.submittedAt), id: String(b.id ?? "") },
    ),
  );
  const orderedDrafts = [...drafts.docs].sort((a, b) =>
    byDateThenId(
      { date: isoDate(a.lastSaved), id: String(a.id ?? "") },
      { date: isoDate(b.lastSaved), id: String(b.id ?? "") },
    ),
  );

  return {
    submissions: orderedSubmissions.map((row) => {
      const media = mediaOf(row.image);
      return groqObject({
        _id: String(row.id ?? ""),
        authors: authorProjection(row.authors, ["name", "role"]),
        excerpt: orNull(localized(row.excerpt)),
        featured: row.featured ?? null,
        // `"image": image.asset->url` — a bare URL string, not a group.
        image: orNull(text(media?.url)),
        publishedAt: orNull(isoDate(row.publishedAt)),
        reviewNotes: orNull(text(row.reviewNotes)),
        slug: text(row.slug) ?? null,
        status: orNull(text(row.moderationStatus)),
        submittedAt: orNull(isoDate(row.submittedAt)),
        // Task 13: real `label`/`category` (was `{ _id, title: null, value }` —
        // `tag` has no `title` field in either store, so that was always null).
        tags: tagProjection(row.tags),
        title: orNull(localized(row.title)),
        topic: orNull(text(row.topic)),
      });
    }),
    drafts: orderedDrafts.map((row) =>
      groqObject({
        _id: String(row.id ?? ""),
        excerpt: orNull(localized(row.excerpt)),
        formMetadata: formMetadata(row.formMetadata),
        lastSaved: orNull(isoDate(row.lastSaved)),
        // Task 13: same theme tags as a submission, so a draft card can show a main theme too.
        tags: tagProjection(row.tags),
        title: orNull(localized(row.title)),
        topic: orNull(text(row.topic)),
      }),
    ),
  } as unknown as UserSubmissionsAndDrafts;
}

// ---------------------------------------------------------------------------
// Reads that feed a write — every one of them `queryRaw`. See note 8.
// ---------------------------------------------------------------------------

/**
 * A member's case studies awaiting revision — **`queryRaw`**.
 *
 * Not `query`: a `revision` document may exist only as a draft version, which
 * the published perspective cannot see, and an hour-long cache would show a
 * member stale moderation feedback. Not `queryLive` either: same draft problem.
 */
export async function getCaseStudyRevisions(userId: string): Promise<CaseStudyRevision[]> {
  const result = await queryRaw<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { and: [{ submittedBy: { equals: userId } }, { moderationStatus: { equals: "revision" } }] },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  // The GROQ names no `order()`, so neither does this.
  return result.docs.map((row) =>
    groqObject({
      _id: String(row.id ?? ""),
      reviewNotes: orNull(text(row.reviewNotes)),
      status: orNull(text(row.moderationStatus)),
      submittedAt: orNull(isoDate(row.submittedAt)),
      title: orNull(localized(row.title)),
    }),
  ) as unknown as CaseStudyRevision[];
}

/** What `loadEditableCaseStudy` needs, in the domain module's own vocabulary. */
export interface RawEditableCaseStudy {
  _id: string;
  title?: Record<string, string>;
  excerpt?: Record<string, string>;
  content?: RichText;
  topic?: string;
  layout?: string;
  submittedBy?: string;
  status?: string | null;
  reviewNotes?: string | null;
  studyPeriod?: { startDate?: string; endDate?: string };
  locationText?: { country?: string; city?: string };
  locationDisplayText?: string;
  relatedCommunity?: string;
  tags?: string[];
  organizationName?: string;
  /** Everything below is what the form needs to reopen the story as it was
   *  sent, so an autosave doesn't write defaults back over it. */
  originalLanguage?: string;
  authors?: Array<{ name?: string; email?: string; role?: string; userId?: string }>;
  /** The form's place, rebuilt from the location columns; null when none was chosen. */
  place?: Row | null;
  imageAssetId?: string;
  imageUrl?: string;
  suggestedTags?: string[];
}

/**
 * The edit gate — **`queryRaw`**, and the exact shape of the Phase-1 bypass.
 *
 * The Sanity twin strips a `drafts.` prefix and matches both `$id` and
 * `"drafts." + $id`. **Payload has no `drafts.`-prefixed ids** — a draft is a
 * version of the same id — so that id-juggling collapses into one lookup with
 * drafts visible, exactly as Task 9 decided for `livedExperience`.
 *
 * `moderationStatus` is returned as `status` **verbatim and unmapped**. The
 * caller's allow-list is `["pending", "revision", "draft", null, undefined]`;
 * the `"draft"` literal is Sanity conflating a moderation state with a draft
 * state, and Payload splits the two. Nothing synthesises `"draft"` onto
 * `moderationStatus` here — an approved document must stay non-reopenable.
 */
export async function loadEditableCaseStudyDoc(id: string): Promise<RawEditableCaseStudy | null> {
  const row = await queryRaw<CaseStudyRow | null>({
    type: "findByID",
    collection: "caseStudies",
    id,
    locale: "all",
    fallbackLocale: false,
    depth: 1,
  });
  if (!row) return null;

  // The story is stored in the language it was written in; read that locale
  // first, then any other that holds one.
  const originalLanguage = text(row.originalLanguage);
  const contents = (row.content ?? {}) as Record<string, unknown>;
  const body = (originalLanguage ? contents[originalLanguage] : undefined) ?? Object.values(contents).find(Boolean);
  const asset = isRow(row.image) ? row.image.asset : undefined;
  const period = groupOrNull({
    endDate: orNull(isoDay(row.studyPeriod?.endDate)),
    startDate: orNull(isoDay(row.studyPeriod?.startDate)),
  });
  const location = groupOrNull({
    city: orNull(text(row.locationText?.city)),
    country: orNull(text(row.locationText?.country)),
  });
  return {
    _id: String(row.id ?? id),
    title: localized(row.title) as Record<string, string> | undefined,
    excerpt: localized(row.excerpt) as Record<string, string> | undefined,
    content: body ? portableText(body) : undefined,
    topic: text(row.topic),
    layout: text(row.layout),
    submittedBy: text(row.submittedBy),
    status: row.moderationStatus ?? null,
    reviewNotes: row.reviewNotes ?? null,
    studyPeriod: (period ?? undefined) as RawEditableCaseStudy["studyPeriod"],
    locationText: (location ?? undefined) as RawEditableCaseStudy["locationText"],
    locationDisplayText: text(row.locationDisplayText),
    relatedCommunity: relationId(row.relatedCommunity),
    tags: Array.isArray(row.tags)
      ? row.tags.map(relationId).filter((tagId): tagId is string => Boolean(tagId))
      : undefined,
    // Measured: `count(*[_type=="caseStudy" && defined(organizationName)])` is
    // **0** — `caseStudy` has no such field in either store (the submit path
    // writes an `organizations` reference instead), so this projected key has
    // always resolved to undefined. Reproduced, not invented.
    organizationName: undefined,
    originalLanguage,
    authors: Array.isArray(row.authors)
      ? row.authors.filter(isRow).map((raw) => {
          const author = raw as AuthorRow;
          return { name: text(author.name), email: text(author.email), role: text(author.role), userId: text(author.userId) };
        })
      : undefined,
    place: draftPlace(row),
    imageAssetId: relationId(asset),
    imageUrl: isRow(asset) ? text(asset.url) : undefined,
    suggestedTags: stringList(row.suggestedTags),
  };
}

/** The three facts the resubmission gate reads. */
export interface ExistingCaseStudy {
  _id: string;
  submittedBy?: string;
  status?: string | null;
  slug?: { current: string };
  /** The stored authors' identity columns, so an in-review autosave can carry
   *  the submitter's Clerk details over instead of blanking them. */
  authors?: Array<{
    userId?: string;
    name?: string;
    clerkUserId?: string;
    clerkUsername?: string;
    clerkImageUrl?: string;
  }>;
  /** The stored writing language, so an autosave that does not name one keeps
   *  writing into the story's own locale rather than into English. */
  originalLanguage?: string;
  /** The stored community, so an autosave that moves only the place keeps the
   *  community's region. */
  relatedCommunity?: string;
}

/** The narrower gate `submitCaseStudy` runs before a resubmission —
 *  **`queryRaw`** again, same reason, same consequence if it were `query`. */
export async function loadExistingCaseStudy(id: string): Promise<ExistingCaseStudy | null> {
  const row = await queryRaw<CaseStudyRow | null>({
    type: "findByID",
    collection: "caseStudies",
    id,
    depth: 0,
  });
  if (!row) return null;
  return {
    _id: String(row.id ?? id),
    submittedBy: text(row.submittedBy),
    status: row.moderationStatus ?? null,
    slug: slugObject(row.slug),
    originalLanguage: text(row.originalLanguage),
    relatedCommunity: relationId(row.relatedCommunity),
    authors: Array.isArray(row.authors)
      ? row.authors.filter(isRow).map((raw) => {
          const author = raw as AuthorRow;
          return {
            userId: text(author.userId),
            name: text(author.name),
            clerkUserId: text(author.clerkUserId),
            clerkUsername: text(author.clerkUsername),
            clerkImageUrl: text(author.clerkImageUrl),
          };
        })
      : undefined,
  };
}

/** Find-or-create's read half — **`queryRaw`**, because a cached miss creates a
 *  duplicate organization. */
export async function findOrganizationByName(name: string): Promise<{ _id: string } | null> {
  const result = await queryRaw<Paginated<OrganizationRow>>({
    type: "find",
    collection: "organizations",
    where: { name: { equals: name } },
    limit: 1,
    depth: 0,
  });
  const row = result.docs[0];
  return row ? { _id: String(row.id ?? "") } : null;
}

export async function createOrganization(input: { id: string; name: string; slug: string }): Promise<{ id: string }> {
  return createDocument({
    collection: "organizations",
    locale: "en",
    data: { id: input.id, name: input.name, slug: input.slug, type: "other" },
  });
}

// ---------------------------------------------------------------------------
// Writes: the submission
// ---------------------------------------------------------------------------

/** A submission's field values, decided once in the domain module so the two
 *  backends cannot disagree about what a resubmission keeps and what it clears. */
export interface CaseStudyDraft {
  title: Record<string, string | undefined>;
  excerpt?: Record<string, string | undefined>;
  content: RichText;
  /** Retired: accepted for the Sanity arm's sake, never written to Payload. */
  topic?: string;
  layout: string;
  tagIds: string[];
  suggestedTags?: string[];
  relatedCommunity?: string;
  organizationIds?: string[];
  studyPeriod?: { startDate?: string; endDate?: string };
  locationText?: { country?: string; city?: string };
  studyLocation?: { lat: number; lng: number };
  locationDisplayText?: string;
  locationPrecision?: string;
  locationCountryCode?: string;
  /** The language the story was written in; its title, summary and story are
   *  stored in that locale. Defaults to English. */
  originalLanguage?: string;
  /** Fixed-7 region code, from the community or the place's country. */
  region?: string;
  /** The place's own country and city names, stored as `locationText`. */
  placeCountry?: string;
  placeCity?: string;
  /** `null` clears the cover; absent leaves it as it is. */
  imageAssetId?: string | null;
  imageAlt?: string;
  authors: Array<{
    userId?: string;
    name: string;
    email?: string;
    role?: string;
    clerkUserId?: string;
    clerkUsername?: string | null;
    clerkImageUrl?: string;
  }>;
}

/** A Payload `point` column takes `[lng, lat]`. */
function toPoint(value: { lat: number; lng: number } | undefined): number[] | undefined {
  return value ? [value.lng, value.lat] : undefined;
}

/** The form starts both dates as "", which Postgres refuses as a timestamp. */
function studyPeriodData(value: unknown): { startDate: string | null; endDate: string | null } | undefined {
  if (!isRow(value)) return undefined;
  const date = (entry: unknown) => (typeof entry === "string" && entry.trim() ? entry : null);
  return { startDate: date(value.startDate), endDate: date(value.endDate) };
}

const PAYLOAD_LOCALES = ["en", "es", "fr", "ar"] as const;
type PayloadLocale = (typeof PAYLOAD_LOCALES)[number];

/** The writer's language as a Payload locale; anything else is English. */
function writingLocale(value: string | undefined): PayloadLocale {
  return (PAYLOAD_LOCALES as readonly string[]).includes(value ?? "") ? (value as PayloadLocale) : "en";
}

/**
 * The Payload field names for a submission's **unlocalized** fields.
 *
 * **`moderationStatus`, never `status`** — the write direction of note 1. It is
 * set here rather than by a caller handing in a field name, so a resubmission
 * cannot write a column Payload does not have. `{ keepStatus: true }` (the
 * in-review autosave) leaves both `moderationStatus` and `featured` alone.
 *
 * Title, summary and story are localized and written by the callers, one
 * locale per call (`writeSubmission` below). A key the draft leaves
 * `undefined` is not written at all, so a partial autosave never clears what
 * it did not carry; a full submission defines every required key, so for it
 * this is the same object it always was. `topic` is retired and never written.
 */
function payloadData(draft: Partial<CaseStudyDraft>, options: { keepStatus?: boolean } = {}): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (draft.layout !== undefined) data.layout = draft.layout;
  if (draft.authors !== undefined) {
    data.authors = draft.authors.map((author) => ({
      userId: author.userId ?? null,
      name: author.name,
      email: author.email ?? null,
      role: author.role ?? "coauthor",
      clerkUserId: author.clerkUserId ?? null,
      clerkUsername: author.clerkUsername ?? null,
      clerkImageUrl: author.clerkImageUrl ?? null,
    }));
  }
  if (draft.tagIds !== undefined) data.tags = draft.tagIds;
  if (!options.keepStatus) {
    data.moderationStatus = "pending";
    data.featured = false;
  }
  if (draft.originalLanguage) data.originalLanguage = writingLocale(draft.originalLanguage);
  if (draft.region) data.region = draft.region;
  if (draft.suggestedTags && draft.suggestedTags.length > 0) data.suggestedTags = draft.suggestedTags;
  const studyPeriod = studyPeriodData(draft.studyPeriod);
  if (studyPeriod) data.studyPeriod = studyPeriod;
  if (draft.locationText) data.locationText = draft.locationText;
  const point = toPoint(draft.studyLocation);
  if (point) data.studyLocation = point;
  if (draft.locationDisplayText) {
    // A place was chosen: its own country and city names win over the legacy
    // free-text pair, which only fills in what the place did not name.
    data.locationDisplayText = draft.locationDisplayText;
    data.locationText = {
      country: draft.placeCountry ?? draft.locationText?.country ?? null,
      city: draft.placeCity ?? draft.locationText?.city ?? null,
    };
  }
  if (draft.locationPrecision) data.locationPrecision = draft.locationPrecision;
  if (draft.locationCountryCode) data.locationCountryCode = draft.locationCountryCode;
  if (draft.relatedCommunity) data.relatedCommunity = draft.relatedCommunity;
  if (draft.organizationIds && draft.organizationIds.length > 0) data.organizations = draft.organizationIds;
  if (draft.imageAssetId) data.image = { asset: draft.imageAssetId, alt: draft.imageAlt ?? null };
  else if (draft.imageAssetId === null) data.image = { asset: null, alt: null };
  return data;
}

/** The localized half of a submission, in one locale: title and summary, plus
 *  the story when `withContent` (only ever the original's locale). An autosave
 *  (`keepTitle`) never writes a blank title — the title is required, and a
 *  field cleared mid-edit must not make the whole save fail. */
function localizedData(
  draft: Partial<CaseStudyDraft>,
  locale: PayloadLocale,
  withContent: boolean,
  keepTitle = false,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (draft.title !== undefined && !(keepTitle && !draft.title[locale])) data.title = draft.title[locale] ?? "";
  const excerpt = draft.excerpt?.[locale];
  if (excerpt) data.excerpt = excerpt;
  if (withContent && draft.content !== undefined) data.content = portableTextToLexical(draft.content);
  return data;
}

/** Payload writes one locale at a time; the Sanity path writes the whole
 *  `{en, es, fr, ar}` object in a single patch. Reproduced with one extra write
 *  per non-empty locale, so the stored document is the same on both backends
 *  rather than merely rendering the same through `fallback: true`. The
 *  original's locale (and English, which `writeSubmission` wrote already) is
 *  skipped: title and summary only, the story lives in the original's locale. */
async function mirrorSubmissionLocales(id: string, draft: Partial<CaseStudyDraft>, skip: PayloadLocale): Promise<void> {
  for (const locale of PAYLOAD_LOCALES) {
    if (locale === skip || locale === "en") continue;
    const title = draft.title?.[locale];
    const excerpt = draft.excerpt?.[locale];
    if (!title && !excerpt) continue;
    const data: Record<string, unknown> = {};
    if (title) data.title = title;
    if (excerpt) data.excerpt = excerpt;
    await updateDocument({ collection: "caseStudies", id, locale, data });
  }
}

/** After the original-locale write: the English title and summary (every case
 *  study has them, whatever it was written in), then the other translations. */
async function writeOtherLocales(
  id: string,
  draft: Partial<CaseStudyDraft>,
  lang: PayloadLocale,
  keepTitle = false,
): Promise<void> {
  if (lang !== "en") {
    const english: Record<string, unknown> = {};
    if (draft.title !== undefined && !(keepTitle && !draft.title.en)) english.title = draft.title.en ?? "";
    if (draft.excerpt?.en) english.excerpt = draft.excerpt.en;
    if (Object.keys(english).length > 0) {
      await updateDocument({ collection: "caseStudies", id, locale: "en", data: english });
    }
  }
  await mirrorSubmissionLocales(id, draft, lang);
}

/**
 * Create a submission.
 *
 * Published, not a draft: the Sanity original calls `writeClient.create` with a
 * plain id, so it makes a live document whose invisibility comes entirely from
 * `status: "pending"` failing the read filter. Creating a Payload draft instead
 * would hide it a second way and put a brand-new submission somewhere the
 * moderation queue does not look — the same judgment Task 9 recorded.
 *
 * Created in the writer's language, so the story, title and summary land in
 * that locale; an English original is exactly the old single `locale: "en"`
 * create.
 */
export async function createCaseStudy(
  draft: CaseStudyDraft,
  meta: { id: string; slug: string; submittedBy: string; submittedAt: string },
): Promise<{ id: string }> {
  const lang = writingLocale(draft.originalLanguage);
  const created = await createDocument({
    collection: "caseStudies",
    locale: lang,
    draft: false,
    data: {
      ...payloadData(draft),
      ...localizedData(draft, lang, true),
      // Payload's `id` is a text column carrying Sanity's document id; a new
      // document needs one, and the slug is what every route addresses it by.
      id: meta.id,
      slug: meta.slug,
      submittedBy: meta.submittedBy,
      submittedAt: meta.submittedAt,
    },
  });
  await writeOtherLocales(created.id, draft, lang);
  return created;
}

/**
 * Resubmit an existing submission — `case-studies.ts`'s
 * `{...updatable, status: "pending"}`, with the field renamed. `slug` and
 * `submittedBy` are preserved, as the Sanity arm preserves them, and this is a
 * plain set: keys `payloadData` does not name are left untouched, matching the
 * original's own `.set()` rather than lived-experiences' clearing patch.
 *
 * `{ keepStatus: true }` is the in-review autosave (`saveSubmissionEdits`): the
 * same writes, with `moderationStatus` and `featured` left as they are.
 */
export async function updateCaseStudySubmission(
  id: string,
  draft: Partial<CaseStudyDraft>,
  options: { keepStatus?: boolean } = {},
): Promise<void> {
  const lang = writingLocale(draft.originalLanguage);
  await updateDocument({
    collection: "caseStudies",
    id,
    locale: lang,
    data: { ...payloadData(draft, options), ...localizedData(draft, lang, true, options.keepStatus) },
  });
  await writeOtherLocales(id, draft, lang, options.keepStatus);
}

/** A regional community's fixed-7 region code — `queryRaw`, because the answer
 *  is written onto the submission. */
export async function findCommunityRegion(id: string): Promise<string | null> {
  // Fail soft: a missing region is an editor's one-click fix, a failed
  // submission is lost work.
  try {
    const result = await queryRaw<Paginated<{ id?: unknown; region?: unknown }>>({
      type: "find",
      collection: "regionalCommunities",
      where: { id: { equals: id } },
      limit: 1,
      depth: 0,
    });
    return text(result?.docs?.[0]?.region) ?? null;
  } catch (error) {
    console.warn(`Could not read the region of community ${id}; saving without one.`, error);
    return null;
  }
}

/** The generic patch primitive behind `updateCaseStudy` — used by
 *  `lib/case-study-emails.ts`'s `notifiedStatus` bookkeeping. A caller passing
 *  the public `status` gets it renamed here; nothing else is touched. */
export async function patchCaseStudy(id: string, patch: Record<string, unknown>): Promise<void> {
  const { status, ...rest } = patch;
  const data: Record<string, unknown> = { ...rest };
  if (status !== undefined) data.moderationStatus = status;
  await updateDocument({ collection: "caseStudies", id, data });
}

// ---------------------------------------------------------------------------
// Writes: the autosave drafts
// ---------------------------------------------------------------------------

/**
 * The fields `caseStudyDrafts` models.
 *
 * `saveCaseStudyDraft` writes `{...draftData, _type, userId, lastSaved}` —
 * whatever shape the client-side form sends, with no schema validation at all
 * on the Sanity side. Payload validates, so the client's object is narrowed to
 * the columns that exist; a key the collection does not declare is dropped
 * rather than sent, which is what Sanity effectively did with it anyway (it
 * stored it, and nothing ever read it back).
 */
const DRAFT_FIELDS = [
  "title",
  "excerpt",
  "topic",
  "contentLanguage",
  "content",
  "image",
  "tags",
  "selectedTags",
  "authors",
  "studyPeriod",
  "locationText",
  "studyLocation",
  "studyAreas",
  "organizations",
  "relatedCommunity",
  "formMetadata",
  "organizationName",
  // After `locationText`/`studyLocation`, so a chosen place wins over the
  // legacy pair, and after `image`, so a drafted cover wins too.
  "place",
  "originalLanguage",
  "imageAssetId",
  "layout",
  "suggestedTags",
] as const;

const DRAFT_LAYOUTS = ["story", "feature", "report"];

const PLACE_PRECISIONS = ["exact", "city", "country", "region"];

/** The form's place (possibly half-filled — a draft requires nothing) as the
 *  draft collection's location columns. `null` clears them all. */
function draftPlaceData(value: unknown): Record<string, unknown> {
  if (!isRow(value)) {
    return {
      studyLocation: null,
      locationDisplayText: null,
      locationPrecision: null,
      locationCountryCode: null,
      locationText: { country: null, city: null },
    };
  }
  const data: Record<string, unknown> = {
    locationDisplayText: text(value.text) ?? null,
    locationPrecision: PLACE_PRECISIONS.includes(String(value.precision)) ? value.precision : null,
    locationCountryCode: text(value.countryCode3) ?? null,
    locationText: { country: text(value.country) ?? null, city: text(value.city) ?? null },
  };
  if (typeof value.lat === "number" && typeof value.lng === "number") {
    data.studyLocation = toPoint({ lat: value.lat, lng: value.lng });
  }
  return data;
}

/** A plain string list, as the `{value}` rows the collection models. */
function toValueRows(value: unknown): { value: string }[] | undefined {
  const list = stringList(value);
  return list?.map((entry) => ({ value: entry }));
}

function draftPayloadData(draftData: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of DRAFT_FIELDS) {
    const value = draftData[field];
    if (value === undefined) continue;
    switch (field) {
      case "title":
      case "excerpt":
        data[field] = isRow(value) ? (text(value.en) ?? null) : value;
        break;
      case "content":
        data.content = value ? portableTextToLexical(value as RichText) : null;
        break;
      case "tags":
      case "selectedTags":
      case "suggestedTags":
        data[field] = toValueRows(value) ?? [];
        break;
      case "studyPeriod": {
        const studyPeriod = studyPeriodData(value);
        if (studyPeriod) data.studyPeriod = studyPeriod;
        break;
      }
      case "studyLocation": {
        const point = isRow(value) ? toPoint(value as { lat: number; lng: number }) : undefined;
        if (point) data.studyLocation = point;
        break;
      }
      case "formMetadata": {
        if (!isRow(value)) break;
        const meta = value;
        data.formMetadata = {
          currentStep: meta.currentStep ?? null,
          completedSections: toValueRows(meta.completedSections) ?? [],
          organizationName: meta.organizationName ?? null,
        };
        break;
      }
      case "place":
        if (value === null || isRow(value)) Object.assign(data, draftPlaceData(value));
        break;
      case "originalLanguage":
        data.contentLanguage = text(value) ?? null;
        break;
      case "imageAssetId":
        // null = the cover was removed; undefined never gets here (not sent = unchanged).
        data.image = { asset: text(value) ?? null };
        break;
      case "layout":
        data.layout = DRAFT_LAYOUTS.includes(String(value)) ? value : null;
        break;
      default:
        data[field] = value;
    }
  }
  return data;
}

/** The most recently saved draft, whole — **`queryRaw`**: it feeds an update,
 *  and an hour-cached read would hand the form a stale autosave to overwrite. */
export async function getLatestCaseStudyDraft(userId: string): Promise<Record<string, unknown> | null> {
  const result = await queryRaw<Paginated<DraftRow>>({
    type: "find",
    collection: "caseStudyDrafts",
    where: { userId: { equals: userId } },
    pagination: false,
    locale: "all",
    // Depth 1 populates `image.asset`, so a cover uploaded while drafting comes
    // back with its URL for the preview (the same depth the edit gate reads
    // at). The other relationships are read back through `relationId`, which
    // takes a populated row or a bare id alike.
    depth: 1,
  });
  const row = [...result.docs].sort((a, b) =>
    byDateThenId(
      { date: isoDate(a.lastSaved), id: String(a.id ?? "") },
      { date: isoDate(b.lastSaved), id: String(b.id ?? "") },
    ),
  )[0];
  if (!row) return null;
  return draftDocument(row);
}

/** One draft by id, **`queryRaw`** and scoped to `userId` — the dashboard's
 *  Continue button reopens a specific draft, and the answer feeds the same
 *  autosave update as `getLatestCaseStudyDraft`. A guessed id owned by
 *  someone else yields null, exactly as the Sanity GROQ does. */
export async function getCaseStudyDraftById(
  userId: string,
  draftId: string,
): Promise<Record<string, unknown> | null> {
  const result = await queryRaw<Paginated<DraftRow>>({
    type: "find",
    collection: "caseStudyDrafts",
    where: { and: [{ id: { equals: draftId } }, { userId: { equals: userId } }] },
    limit: 1,
    locale: "all",
    // Depth 1 populates `image.asset`, so a cover uploaded while drafting comes
    // back with its URL for the preview (the same depth the edit gate reads
    // at). The other relationships are read back through `relationId`, which
    // takes a populated row or a bare id alike.
    depth: 1,
  });
  const row = result.docs[0];
  return row ? draftDocument(row) : null;
}

/** The form's place, rebuilt from a draft's (or a submitted case study's)
 *  location columns — only when a place was actually chosen (a point and its
 *  display text). */
function draftPlace(
  row: Pick<DraftRow, "studyLocation" | "locationDisplayText" | "locationText" | "locationPrecision" | "locationCountryCode">,
): Row | null {
  const point = geopoint(row.studyLocation);
  const label = text(row.locationDisplayText);
  if (!point || !label) return null;
  const country = text(row.locationText?.country);
  const city = text(row.locationText?.city);
  return {
    lat: point.lat,
    lng: point.lng,
    text: label,
    precision: text(row.locationPrecision) ?? "exact",
    countryCode3: text(row.locationCountryCode) ?? null,
    ...(country ? { country } : {}),
    ...(city ? { city } : {}),
  };
}

/** A `caseStudyDraft` row in the whole-document shape the Sanity arm returns,
 *  plus the form's own `place`, `originalLanguage` and drafted cover. */
function draftDocument(row: DraftRow): Record<string, unknown> {
  const body = row.content;
  const asset = isRow(row.image) ? row.image.asset : undefined;
  return groqObject({
    // `_rev` is a Sanity mutation id and has no Payload equivalent. See note 7.
    _createdAt: orNull(isoDate(row.sanityUpdatedAt ?? row.createdAt)),
    _id: String(row.id ?? ""),
    _type: "caseStudyDraft",
    _updatedAt: orNull(isoDate(row.sanityUpdatedAt ?? row.updatedAt)),
    authors: rawAuthors(row.authors),
    content: body ? portableText(body) : null,
    contentLanguage: orNull(text(row.contentLanguage)),
    excerpt: orNull(localized(row.excerpt)),
    formMetadata: formMetadata(row.formMetadata),
    image: imageProjection(row.image, "full", ["alt", "caption"]),
    imageAssetId: orNull(relationId(asset)),
    imageUrl: orNull(isRow(asset) ? text(asset.url) : undefined),
    lastSaved: orNull(isoDate(row.lastSaved)),
    locationText: groupOrNull({
      city: orNull(text(row.locationText?.city)),
      country: orNull(text(row.locationText?.country)),
    }),
    organizationName: orNull(text(row.organizationName)),
    originalLanguage: orNull(text(row.contentLanguage)),
    place: draftPlace(row),
    organizations: orNull(
      Array.isArray(row.organizations)
        ? listOrNull(row.organizations.map(relationId).filter((id): id is string => Boolean(id)))
        : undefined,
    ),
    relatedCommunity: orNull(text(row.relatedCommunity)),
    selectedTags: orNull(stringList(row.selectedTags)),
    suggestedTags: orNull(stringList(row.suggestedTags)),
    layout: orNull(text(row.layout)),
    studyAreas: studyAreas(row.studyAreas),
    studyLocation: geopoint(row.studyLocation),
    studyPeriod: groupOrNull({
      endDate: orNull(isoDay(row.studyPeriod?.endDate)),
      startDate: orNull(isoDay(row.studyPeriod?.startDate)),
    }),
    tags: orNull(stringList(row.tags)),
    title: orNull(localized(row.title)),
    topic: orNull(text(row.topic)),
    userId: orNull(text(row.userId)),
  });
}

/** The ownership check behind `saveCaseStudyDraft`/`deleteCaseStudyDraft` —
 *  **`queryRaw`**, because its answer authorizes a write. */
export async function findOwnedDraftId(userId: string, draftId: string): Promise<string | null> {
  const result = await queryRaw<Paginated<DraftRow>>({
    type: "find",
    collection: "caseStudyDrafts",
    where: { and: [{ id: { equals: draftId } }, { userId: { equals: userId } }] },
    limit: 1,
    depth: 0,
  });
  const row = result.docs[0];
  return row ? String(row.id ?? "") : null;
}

/** The form sends `title`/`excerpt` as `{en, es, fr, ar}`; Payload writes one
 *  locale per call. On an update a blanked language is cleared, not kept. */
async function writeDraftLocales(id: string, draftData: Record<string, unknown>, clearEmpty: boolean): Promise<void> {
  for (const locale of ["es", "fr", "ar"] as const) {
    const data: Record<string, unknown> = {};
    for (const field of ["title", "excerpt"] as const) {
      const value = draftData[field];
      if (!isRow(value) || !(locale in value)) continue;
      const translated = text(value[locale]);
      if (translated) data[field] = translated;
      else if (clearEmpty) data[field] = null;
    }
    if (Object.keys(data).length > 0) await updateDocument({ collection: "caseStudyDrafts", id, locale, data });
  }
}

export async function createCaseStudyDraft(
  userId: string,
  id: string,
  draftData: Record<string, unknown>,
  lastSaved: string,
): Promise<{ id: string }> {
  const created = await createDocument({
    collection: "caseStudyDrafts",
    locale: "en",
    data: { ...draftPayloadData(draftData), id, userId, lastSaved },
  });
  await writeDraftLocales(created.id, draftData, false);
  return created;
}

export async function updateCaseStudyDraft(
  draftId: string,
  draftData: Record<string, unknown>,
  lastSaved: string,
): Promise<void> {
  await updateDocument({
    collection: "caseStudyDrafts",
    id: draftId,
    locale: "en",
    data: { ...draftPayloadData(draftData), lastSaved },
  });
  await writeDraftLocales(draftId, draftData, true);
}

export async function deleteCaseStudyDraft(draftId: string): Promise<void> {
  await deleteDocument({ collection: "caseStudyDrafts", id: draftId });
}

// ---------------------------------------------------------------------------
// Reads: search records and the Algolia index
// ---------------------------------------------------------------------------

export interface CaseStudySearchRecordDoc {
  _id: string;
  language?: string;
  title?: Record<string, string> | string;
  excerpt?: Record<string, string> | string;
  slug: string;
}

export async function getCaseStudySearchRecordDocs(): Promise<CaseStudySearchRecordDoc[]> {
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { and: [APPROVED, { slug: { exists: true } }] },
    pagination: false,
    locale: "all",
    depth: 0,
    select: { title: true, excerpt: true, slug: true },
  });
  return result.docs
    .filter((row) => text(row.slug))
    .map((row) => ({
      _id: String(row.id ?? ""),
      // `language` is unmodelled and 0-populated; the caller falls back to
      // "en", which is what it already does on Sanity. Note 7.
      language: undefined,
      title: localized(row.title) as Record<string, string> | undefined,
      excerpt: localized(row.excerpt) as Record<string, string> | undefined,
      slug: text(row.slug) as string,
    }));
}

/** `CASE_STUDY_INDEX_FIELDS`, key for key. Read only — the index is written by
 *  the two routes, never from here. */
function caseStudyIndexProjection(row: CaseStudyRow): CaseStudyIndexDoc {
  return groqObject({
    _id: String(row.id ?? ""),
    _updatedAt: orNull(updatedAt(row)),
    authors: authorProjection(row.authors, ["name", "role", "affiliationIndex"]),
    excerpt: orNull(localized(row.excerpt)),
    featured: row.featured ?? null,
    image: imageProjection(row.image, "url", []),
    locationDisplayText: orNull(text(row.locationDisplayText)),
    locationText: groupOrNull({
      city: orNull(text(row.locationText?.city)),
      country: orNull(text(row.locationText?.country)),
    }),
    organizations: organizationProjection(row.organizations, ["name"]),
    populations: orNull(listOrNull(row.populations ?? undefined)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    region: orNull(text(row.region)),
    slug: orNull(slugObject(row.slug)),
    status: orNull(text(row.moderationStatus)),
    studyLocation: geopoint(row.studyLocation),
    studyPeriod: groupOrNull({
      endDate: orNull(isoDay(row.studyPeriod?.endDate)),
      startDate: orNull(isoDay(row.studyPeriod?.startDate)),
    }),
    // Every language's label plus the slug, so the search record can carry
    // them all (tag audit 2026-09-17; the old `tags[]->{name}` projected a
    // field a tag never had and the live index held no tags at all).
    tags: Array.isArray(row.tags)
      ? listOrNull(
          row.tags.filter(isRow).map((raw) => {
            const tag = raw as TagRow;
            return groqObject({ _id: String(tag.id ?? ""), label: orNull(localized(tag.label)), value: orNull(text(tag.value)) });
          }),
        )
      : null,
    themes: orNull(listOrNull(row.themes ?? undefined)),
    title: orNull(localized(row.title)),
  }) as unknown as CaseStudyIndexDoc;
}

/**
 * `fresh` bypasses the hour-long `query()` cache in favour of `queryLive` —
 * same read, published-only, uncached. The Algolia sync hook needs it: it runs
 * immediately after a write and a cached projection would index the document as
 * it was before the edit. `unstable_cache` also throws outside a request
 * (`Invariant: incrementalCache missing`), so `fresh` is what makes these
 * readers callable from a script at all.
 */
export async function getApprovedCaseStudyIndexDocs(
  options: { fresh?: boolean } = {},
): Promise<CaseStudyIndexDoc[]> {
  const read = options.fresh ? queryLive : query;
  const result = await read<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: APPROVED,
    pagination: false,
    locale: "all",
    depth: 2,
    select: INDEX_SELECT,
  });
  // The GROQ names no `order()`, so neither does this.
  return result.docs.map(caseStudyIndexProjection);
}

export async function getCaseStudyIndexDocsByIds(
  ids: string[],
  options: { fresh?: boolean } = {},
): Promise<CaseStudyIndexDoc[]> {
  if (ids.length === 0) return [];
  const read = options.fresh ? queryLive : query;
  const result = await read<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { id: { in: ids } },
    pagination: false,
    locale: "all",
    depth: 2,
    select: INDEX_SELECT,
  });
  return result.docs.map(caseStudyIndexProjection);
}

export async function getCaseStudyIndexDocById(id: string): Promise<CaseStudyIndexDoc | null> {
  const row = await query<CaseStudyRow | null>({
    type: "findByID",
    collection: "caseStudies",
    id,
    locale: "all",
    depth: 2,
  });
  return row ? caseStudyIndexProjection(row) : null;
}

export async function getApprovedCaseStudyCount(): Promise<number> {
  return query<number>({ type: "count", collection: "caseStudies", where: APPROVED });
}

// ---------------------------------------------------------------------------
// Reads: community contribution rows
// ---------------------------------------------------------------------------

export async function getApprovedCaseStudyCountsBySubmitter(userIds: string[]): Promise<Record<string, number>> {
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: { and: [APPROVED, { submittedBy: { in: userIds } }] },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  const counts: Record<string, number> = {};
  for (const row of result.docs) {
    const uid = text(row.submittedBy);
    if (uid) counts[uid] = (counts[uid] ?? 0) + 1;
  }
  return counts;
}

export interface CaseStudyContributionDoc {
  _id: string;
  title?: unknown;
  slug?: { current: string };
  publishedAt?: string | null;
}

/**
 * A user's approved case studies — submitted by them, **or** listing them as an
 * author. Payload cannot ask "is `$uid` in `authors[].userId`" and "is
 * `submittedBy` `$uid`" as one indexed `or` across an array relationship
 * cleanly, and there are 25 documents, so the disjunction is applied here — the
 * same choice note 4 makes for the four-locale search.
 */
export async function getApprovedCaseStudiesByContributor(userId: string): Promise<CaseStudyContributionDoc[]> {
  // The live path with the biggest win: from the whole collection at depth 2
  // to four columns at depth 0. `authors.userId` is an array sub-field path,
  // which the adapter joins through `case_studies_authors`.
  const result = await query<Paginated<CaseStudyRow>>({
    type: "find",
    collection: "caseStudies",
    where: andAll(APPROVED, { or: [{ submittedBy: { equals: userId } }, { "authors.userId": { equals: userId } }] }),
    sort: ["-publishedAt", "id"],
    limit: 50,
    pagination: false,
    locale: "all",
    depth: 0,
    select: { title: true, slug: true, publishedAt: true },
  });
  return result.docs.map((row) =>
    groqObject({
      _id: String(row.id ?? ""),
      publishedAt: orNull(isoDate(row.publishedAt)),
      slug: orNull(slugObject(row.slug)),
      title: orNull(localized(row.title)),
    }),
  ) as unknown as CaseStudyContributionDoc[];
}
