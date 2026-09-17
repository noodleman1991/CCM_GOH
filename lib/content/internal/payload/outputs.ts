/**
 * The Payload half of `lib/content/outputs.ts`.
 *
 * Nineteen callable exports above the seam; this file answers eighteen of them
 * and **refuses** the nineteenth out loud. `outputs.ts` picks between this file
 * and its own GROQ through `activeBackend("outputs")`; the `safe()` wrappers and
 * the deliberate absence of one on the write paths all stay in the domain
 * module, so a failure degrades — or throws — in exactly the same place on
 * either backend.
 *
 * Measured 2026-09-07 against `production_2` (published perspective, a control
 * count on every query — `count(*[_type=="tag"])` = **67**; the plan's 68 counts
 * the never-published draft tag, which the published perspective correctly
 * omits) and the development Payload database:
 *
 * | | Sanity | Payload |
 * |---|---|---|
 * | `agenda` | 29 | 29 |
 * | `researchOutput` | 29 | 29, `moderationStatus` `['approved']` and nothing else |
 * | **`report`** | **0** | **no collection** — see 1 |
 * | agendas with `regionalCommunities` | 14 | 14 |
 * | agendas `featured` | 2 | 2 |
 * | agendas with `tags` / `organizations` | 0 / 0 | `[]` / `[]` |
 * | **distinct `publishDate`, either type** | **1** | 1 |
 * | ro with `content`, `body`, `relatedContent`, `themes`, `populations`, `tags`, `organizations`, `submittedBy`, `reviewNotes` | 0 each | null / `[]` |
 *
 * ---------------------------------------------------------------------------
 * 1. `report` is a dead end, and this file says so instead of pretending
 * ---------------------------------------------------------------------------
 *
 * `trackReportDownload` is live — `app/api/reports/download/track/route.ts`
 * calls it — and there is **nothing on the Payload side to write to**. Payload
 * has 23 content collections and none of them is `reports`; the type it
 * superseded left 0 documents behind in Sanity, and every one of them was
 * migrated into `researchOutputs` (29/29 carry `migratedFromReport`).
 *
 * So `refuseReportDownloadTracking` throws `ReportsNotModelledError`. It does
 * **not** quietly resolve: a tracker that returns `void` having written nothing
 * is indistinguishable from a tracker that worked, and this one can never work.
 * The route already wraps the call in its own try/catch, so the throw is logged
 * and the download proceeds exactly as before — the user-facing flow is
 * unchanged either way, because on Sanity the same call has always fallen into
 * the "Report not found" branch (0 documents) and written nothing either.
 *
 * **For Phase 4 deletion:** `app/api/reports/download/track/route.ts`,
 * `trackReportDownload` in `lib/content/outputs.ts`, and this file's
 * `ReportsNotModelledError` / `refuseReportDownloadTracking` pair.
 *
 * ---------------------------------------------------------------------------
 * 2. The agenda download counter starts working — on both backends
 * ---------------------------------------------------------------------------
 *
 * `outputs.ts` records that the original `.patch().commit()` ran against a
 * **read-token** client and swallowed its own failure, so `totalDownloadCount`
 * and `file.downloadCount` have almost certainly never incremented in
 * production. Both seams' `updateDocument` use a writing credential — Sanity's
 * editor token, Payload's Local API — so routing through the seam fixes the
 * counter on either backend. The download was never gated on that write
 * succeeding, so no user flow changes; the count simply starts reflecting
 * reality. The Payload arm carries the same behaviour deliberately.
 *
 * Neither `grid-agenda.tsx` nor `grid-report.tsx` references `downloadCount`
 * any more (grepped: zero hits), so nothing renders the number today. The
 * in-code comment claiming it renders publicly is stale on both files.
 *
 * ---------------------------------------------------------------------------
 * 3. `queryLive` is not `queryRaw`, and both of the module's `queryLive` sites
 *    are the two trackers
 * ---------------------------------------------------------------------------
 *
 * `loadTrackedAgenda` reads through **`queryLive`**: uncached (a cached read
 * would make a read-modify-write counter read identical stale numbers for an
 * hour and write them back, silently undoing the fix in 2) and published-only
 * (`agendaId` comes straight from a request body, so `queryRaw`'s draft
 * visibility would let a caller increment — and read back — an unpublished
 * document's counters). In Payload the second half is `draft: false`, which
 * `payload-source` turns into "the published revision, and on a
 * drafts-enabled collection `_status: published` as well". `agendas` enables
 * no drafts, so the `_status` half is inert here — but it is inert because the
 * collection says so, not because this file chose the loose primitive.
 *
 * The write-feeding reads on the research-output side (`loadEditableDoc`,
 * `loadExistingSubmission`) use **`queryRaw`**, matching their Sanity twins:
 * they exist to reopen a document that may not be public, and their answer
 * decides an authorization question about the very document about to be
 * written.
 *
 * The two return the same shape, so nothing about a returned document can tell
 * them apart. `lib/__tests__/content-outputs.test.ts` therefore mocks
 * `payload-source` itself and asserts **which primitive was called**, for both
 * trackers and both gates.
 *
 * ---------------------------------------------------------------------------
 * 4. `order(publishDate desc)` is a total tie on both types
 * ---------------------------------------------------------------------------
 *
 * Measured: `publishDate` has **one distinct value across all 29 agendas** and
 * **one across all 29 research outputs** (`2024-03-18`). So both orderings are
 * completely unordered, and Sanity's answer is decided entirely by its
 * tie-break — which, measured, is **`_id` ascending by code point** for both
 * (agendas: the returned sequence equals the sorted id list exactly).
 *
 * That is the plan's first candidate, so it reproduces today's output rather
 * than changing it. `_id asc` is appended to every ordering in `outputs.ts` and
 * applied here, on both backends, so the harness is not blinded on any
 * date-ordered agenda or research-output surface.
 *
 * ---------------------------------------------------------------------------
 * 5. Dates are spelled differently by collection, again
 * ---------------------------------------------------------------------------
 *
 * `agenda.publishDate` is stored in Sanity as a **bare `YYYY-MM-DD`** (its
 * schema uses `dateOnly`), and Postgres hands back `2024-03-18T00:00:00.000Z`.
 * `researchOutput.publishDate` is stored as a full ISO instant in Sanity and
 * comes back byte-identical from Postgres. So the agenda reader truncates to
 * the date and the research-output reader does not — the same
 * per-collection rule Task 10 recorded for `newsPost`, measured rather than
 * assumed.
 *
 * ---------------------------------------------------------------------------
 * 6. Images: the group carries the media row as well as the Sanity asset
 * ---------------------------------------------------------------------------
 *
 * Task 10's finding applies unchanged. `grid-agenda.tsx:97` and
 * `grid-report.tsx:95` call `imageUrl(agenda.coverImage, {width: 800, height:
 * …, crop: true})` and gate on `coverImage?.asset?.url`; the research-output
 * detail page calls `imageUrl(ro.image, {width: 1200, height: 675})` and gates
 * on `image?.asset?.url`. `payload-image-source.resolveMedia` refuses any
 * object carrying `_id`, so the group is emitted as **both** shapes at once —
 * Sanity's `asset` projection for the renderers, and the `media` row's own
 * `url`/`sizes`/`lqip` flattened onto the group for `resolveMedia`, which
 * unwraps that first and never reaches `asset._id`.
 *
 * **`grid-agenda.tsx` is a client component**, so an `Agenda` reaches the RSC
 * flight payload verbatim and those extra keys are visible there. That is the
 * same divergence Task 10 recorded as its concern 5, now with a second
 * instance; the fix belongs to whoever owns `payload-image-source`, not here.
 *
 * ---------------------------------------------------------------------------
 * 7. `ContentTag.value` is flattened
 * ---------------------------------------------------------------------------
 *
 * `outputs.ts:181` and `AGENDA_FIELDS` bound a bare `value` inside
 * `tags[]->{…}`, so those two projections handed consumers
 * `{_type:"slug", current:"…"}` while `AgendaTag.value` promised a `string`.
 * Both now project `"value": value.current`, matching Payload's flat `text`
 * column and the type's own declaration. **Nothing rendered changes**: agendas
 * carry 0 tags and research outputs carry 0 tags in this dataset, so the two
 * projections have never produced a tag at all.
 *
 * `getResearchOutputTags` is the deliberate exception — its GROQ reads `value`
 * off an **undereferenced** `tag` document, and `ResearchOutputTagOption.value`
 * is declared `{current: string}` to match what `research-output-form.tsx`
 * consumes. That one is rebuilt here as `{_type: "slug", current}`, which is
 * what Sanity really returns.
 */
import "server-only";
import {
  assetShape,
  imageGroup,
  mediaOf,
  type PayloadMediaRow,
} from "@/lib/content/internal/image-shape";
import { groqObject, localized, orNull } from "@/lib/content/internal/localized";
import type { LocalizedRaw } from "@/lib/content/internal/localized";
import { portableText } from "@/lib/content/internal/payload/rich-text";
import {
  createDocument,
  query,
  queryLive,
  queryRaw,
  updateDocument,
} from "@/lib/content/internal/payload-source";
import type {
  Agenda,
  AgendaIndexDoc,
  ResearchOutput,
  ResearchOutputCommunityOption,
  ResearchOutputTagOption,
} from "@/lib/content/outputs";
import type { RichText } from "@/lib/content/types";

interface Paginated<T> {
  docs: T[];
}

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/** GROQ's string ordering: by code point, not by locale collation. */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * `order(<date> desc, _id asc)` — see note 4.
 *
 * The date comparison is by **instant**, not by string, because the two stores
 * spell the same instant differently (note 5). A row with no date sorts last,
 * as GROQ's descending order puts it.
 */
function byDateThenId(
  a: { date?: string; id: string },
  b: { date?: string; id: string },
): number {
  const left = a.date ? Date.parse(a.date) : Number.NaN;
  const right = b.date ? Date.parse(b.date) : Number.NaN;
  if (!Number.isNaN(left) || !Number.isNaN(right)) {
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    if (right !== left) return right - left;
  }
  return byCodePoint(a.id, b.id);
}

/** An unset Payload container, as the `null` a GROQ projection returns. */
function listOrNull<T>(rows: T[] | undefined | null): T[] | null {
  return Array.isArray(rows) && rows.length > 0 ? rows : null;
}

/** A Payload `date` column as a full ISO instant — `researchOutput.publishDate`
 *  and `_updatedAt`'s spelling. See note 5. */
function isoDate(value: unknown): string | undefined {
  return value instanceof Date ? value.toISOString() : text(value);
}

/** A Payload `date` column as the bare `YYYY-MM-DD` Sanity stores for
 *  `agenda.publishDate`. See note 5. */
function isoDay(value: unknown): string | undefined {
  return isoDate(value)?.slice(0, 10);
}

/** Sanity's `slug` field, as the object a bare `slug` projection returns. */
function slugObject(value: unknown): { current: string } | undefined {
  const slug = text(value);
  return slug ? ({ _type: "slug", current: slug } as unknown as { current: string }) : undefined;
}

/** A relationship, whether Payload populated it or left the id. */
function relationId(value: unknown): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (isRow(value)) return text(value.id) ?? (value.id === undefined ? undefined : String(value.id));
  return undefined;
}

// ---------------------------------------------------------------------------
// Sub-projections
// ---------------------------------------------------------------------------


/**
 * `coverImage{ asset->{_id,url,mimeType,metadata{lqip,dimensions{…}}}, hotspot, crop, alt }`.
 *
 * `alt` collapses to a bare string: Sanity declares it `type: "string"` on
 * `agenda` and on `researchOutput`, so a GROQ read of it is a string. The
 * shape, the flattened media row emitted beside it and why `hotspot`/`crop` are
 * `null` all live in `internal/image-shape.ts`.
 */
function coverImageProjection(group: unknown): Agenda["coverImage"] {
  return imageGroup(group, {
    asset: ["_id", "url", "mimeType", "lqip", "dimensions"],
    keys: ["alt", "crop", "hotspot"],
  }) as unknown as Agenda["coverImage"];
}

/** `"image": coverImage{ asset->{_id, url}, alt, caption }` — the narrower
 *  asset projection the research-output fragment writes, with the same
 *  flattened media row for the same reason. `caption` is projected by the GROQ
 *  and declared by neither schema, so it is `null` on every document. */
function researchOutputImage(group: unknown): ResearchOutput["image"] {
  return imageGroup(group, {
    asset: ["_id", "url"],
    keys: ["alt", "caption"],
  }) as unknown as ResearchOutput["image"];
}

interface FileRow {
  language?: string | null;
  file?: unknown;
  downloadCount?: number | null;
  lastDownloaded?: string | null;
}

/** `files[]{ language, file{ asset->{_id,url,originalFilename,size,mimeType} }, downloadCount, lastDownloaded }`.
 *
 *  Agenda PDFs live in the `files` collection, not `media` — `media` is
 *  images-only. Payload's upload row spells the two size/name fields
 *  `filesize`/`filename`; Sanity spells them `size`/`originalFilename`. */
function fileAttachments(rows: unknown): Agenda["files"] | null {
  if (!Array.isArray(rows)) return null;
  const files = rows.filter(isRow).map((raw) => {
    const row = raw as FileRow;
    const asset = isRow(row.file) ? (row.file as PayloadMediaRow) : undefined;
    const url = text(asset?.url);
    return groqObject({
      downloadCount: orNull(num(row.downloadCount)),
      file: groqObject({
        asset:
          asset && url
            ? assetShape(asset, ["_id", "url", "originalFilename", "size", "mimeType"])
            : null,
      }),
      language: orNull(text(row.language)),
      lastDownloaded: orNull(isoDate(row.lastDownloaded)),
    });
  });
  return listOrNull(files) as Agenda["files"] | null;
}

interface TagRow {
  id?: unknown;
  label?: LocalizedRaw;
  value?: string | null;
  color?: string | null;
  category?: string | null;
}

/** `tags[]->{ _id, label, "value": value.current, color, category }`.
 *  `fields` names which keys the caller's GROQ actually projects — a key a
 *  projection does not name must be absent, not null. */
function tagProjection(rows: unknown, fields: readonly string[]): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const tags = rows.filter(isRow).map((raw) => {
    const tag = raw as TagRow;
    const all: Row = {
      _id: String(tag.id ?? ""),
      label: orNull(localized(tag.label)),
      value: orNull(text(tag.value)),
      color: orNull(text(tag.color)),
      category: orNull(text(tag.category)),
      // `tag` has no `name` field in either store; `AGENDA_INDEX_FIELDS`
      // projects one anyway, so GROQ emits null for it.
      name: null,
    };
    return groqObject(Object.fromEntries(fields.map((key) => [key, all[key]])));
  });
  return listOrNull(tags);
}

interface OrganizationRow {
  id?: unknown;
  name?: string | null;
  slug?: string | null;
  acronym?: string | null;
  logo?: unknown;
}

/** `organizations[]->{ _id, name, slug, acronym, logo{ asset->{_id,url}, alt } }`.
 *  0/29 agendas and 0/29 research outputs carry one, so this is `null`
 *  throughout the live dataset — implemented against the schema, not the data,
 *  because an editor can populate it tomorrow. */
function organizationProjection(rows: unknown, fields: readonly string[]): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const orgs = rows.filter(isRow).map((raw) => {
    const org = raw as OrganizationRow;
    const all: Row = {
      _id: String(org.id ?? ""),
      name: orNull(text(org.name)),
      slug: orNull(slugObject(org.slug)),
      acronym: orNull(text(org.acronym)),
      logo: imageGroup(org.logo, { asset: ["_id", "url"], keys: ["alt"] }),
    };
    return groqObject(Object.fromEntries(fields.map((key) => [key, all[key]])));
  });
  return listOrNull(orgs);
}

interface CommunityRow {
  id?: unknown;
  name?: LocalizedRaw;
  slug?: string | null;
}

/**
 * `regionalCommunities[]->{ _id, name, slug, code }`.
 *
 * **`code` is `null` on every regional community in Sanity** (measured: the
 * field is declared and 0/7 populated; the populated one is `region`, which
 * this projection does not name). Payload models `region` and no `code` at all,
 * so both stores answer `null` — for different reasons that happen to agree.
 */
function communityProjection(rows: unknown, shape: "agenda" | "researchOutput" | "indexName"): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const communities = rows.filter(isRow).map((raw) => {
    const community = raw as CommunityRow;
    if (shape === "indexName") return groqObject({ name: orNull(localized(community.name)) });
    if (shape === "researchOutput") {
      return groqObject({
        _id: String(community.id ?? ""),
        name: orNull(localized(community.name)),
        // `"slug": slug.current` — a plain string here, unlike the agenda
        // projection's bare `slug`.
        slug: orNull(text(community.slug)),
      });
    }
    return groqObject({
      _id: String(community.id ?? ""),
      code: null,
      name: orNull(localized(community.name)),
      slug: orNull(slugObject(community.slug)),
    });
  });
  return listOrNull(communities);
}

// ---------------------------------------------------------------------------
// Agendas
// ---------------------------------------------------------------------------

interface AgendaRow {
  id?: unknown;
  title?: LocalizedRaw;
  subtitle?: LocalizedRaw;
  description?: LocalizedRaw;
  slug?: string | null;
  agendaType?: string | null;
  year?: number | null;
  publishDate?: string | null;
  totalDownloadCount?: number | null;
  featured?: boolean | null;
  accessLevel?: string | null;
  coverImage?: unknown;
  files?: unknown;
  tags?: unknown;
  organizations?: unknown;
  regionalCommunities?: unknown;
  sanityUpdatedAt?: string | null;
  updatedAt?: string | null;
}

/** `AGENDA_FIELDS`, key for key. */
function agendaProjection(row: AgendaRow): Agenda {
  return groqObject({
    _id: String(row.id ?? ""),
    accessLevel: orNull(text(row.accessLevel)),
    agendaType: orNull(text(row.agendaType)),
    coverImage: coverImageProjection(row.coverImage),
    description: orNull(localized(row.description)),
    featured: row.featured ?? null,
    files: fileAttachments(row.files),
    organizations: organizationProjection(row.organizations, ["_id", "name", "slug", "acronym", "logo"]),
    publishDate: orNull(isoDay(row.publishDate)),
    regionalCommunities: communityProjection(row.regionalCommunities, "agenda"),
    slug: orNull(slugObject(row.slug)),
    subtitle: orNull(localized(row.subtitle)),
    tags: tagProjection(row.tags, ["_id", "label", "value", "color", "category"]),
    title: orNull(localized(row.title)),
    totalDownloadCount: orNull(num(row.totalDownloadCount)),
    year: orNull(num(row.year)),
  }) as unknown as Agenda;
}

/**
 * `AGENDA_FIELDS` for a caller outside this module.
 *
 * Task 14c's `grid-agenda` block dereferences an agenda with **the same sixteen
 * keys in the same order** — compared field by field against
 * `lib/content/pages/fragments/grid.ts`'s `GRID_AGENDA_PROJECTION`, the two
 * projections differ in exactly one character: `AGENDA_FIELDS` writes
 * `"value": value.current` on a tag and the grid's writes a bare `value`, which
 * GROQ answers with the raw `{_type: "slug", current}` object (Phase-2
 * obligation 4's declared-string-that-is-really-a-slug).
 *
 * That difference is **latent, not live**: `count(*[_type=="agenda" &&
 * count(tags)>0])` is **0/29** on `production_2` at the published perspective
 * (control `count(*[_type=="agenda"])` = 29), so `tags` is `null` on every
 * agenda either projection can reach today. Exported as-is rather than
 * parameterised, because a `value` shape option would be a branch nothing
 * exercises; the day an editor tags an agenda, this is where it is fixed.
 */
export function agendaCardProjection(row: unknown): Agenda | null {
  return isRow(row) ? agendaProjection(row as AgendaRow) : null;
}

/** Every agenda, ordered as note 4 decided. Payload cannot sort by an instant
 *  and a code-point id in one `sort` the way GROQ's `order()` composes them, so
 *  the read is unpaginated and the ordering is applied here. */
async function allAgendas(): Promise<AgendaRow[]> {
  // Push-down (2026-09-17): the order and the slice are asked of the database
// (`sort` with an explicit `id` tie-break; `limit`), and the rich-text column
// is excluded. The JavaScript comparator below is kept as a documented no-op
// safety net for rows with a NULL date (none admitted today — see
// scripts/parity/order-check.ts), not as the ordering mechanism.
  const result = await query<Paginated<AgendaRow>>({
    type: "find",
    collection: "agendas",
    pagination: false,
    locale: "all",
    depth: 2,
    sort: ["-publishDate", "id"],
  });
  return [...result.docs].sort((a, b) =>
    byDateThenId(
      { date: isoDate(a.publishDate), id: String(a.id ?? "") },
      { date: isoDate(b.publishDate), id: String(b.id ?? "") },
    ),
  );
}

export async function getAgendas(): Promise<Agenda[]> {
  return (await allAgendas()).map(agendaProjection);
}

export async function getAgendaBySlug(slug: string): Promise<Agenda | null> {
  const result = await query<Paginated<AgendaRow>>({
    type: "find",
    collection: "agendas",
    where: { slug: { equals: slug } },
    limit: 1,
    locale: "all",
    depth: 2,
  });
  const row = result.docs[0];
  return row ? agendaProjection(row) : null;
}

/**
 * Featured agendas for one regional community, then recent ones to fill.
 *
 * Three reads on Sanity — the community lookup, the featured page, the recent
 * page — and three here, in the same order and with the same short circuits, so
 * the "skips the recent fetch once featured fills the limit" contract holds on
 * both backends. `references($id)` becomes a `regionalCommunities contains`
 * filter: `agenda`'s only other relationships are `organizations` and `tags`,
 * neither of which can hold a `regionalCommunity` id.
 */
export async function getAgendasByRegion(rcSlug: string, limit: number): Promise<Agenda[]> {
  const community = await query<Paginated<{ id?: unknown }>>({
    type: "find",
    collection: "regionalCommunities",
    where: { slug: { equals: rcSlug } },
    limit: 1,
    depth: 0,
  });
  const regionalCommunityId = text(community.docs[0]?.id) ?? undefined;
  if (!regionalCommunityId) return [];

  const page = async (where: Record<string, unknown>, take: number): Promise<AgendaRow[]> => {
    if (take <= 0) return [];
    const result = await query<Paginated<AgendaRow>>({
      type: "find",
      collection: "agendas",
      where: where as never,
      pagination: false,
      locale: "all",
      depth: 2,
      sort: ["-publishDate", "id"],
      limit: take,
    });
    return [...result.docs]
      .sort((a, b) =>
        byDateThenId(
          { date: isoDate(a.publishDate), id: String(a.id ?? "") },
          { date: isoDate(b.publishDate), id: String(b.id ?? "") },
        ),
      )
      .slice(0, take);
  };

  const featured = await page(
    {
      and: [
        { featured: { equals: true } },
        { regionalCommunities: { contains: regionalCommunityId } },
      ],
    },
    limit,
  );
  let items = featured.map(agendaProjection);
  if (items.length >= limit) return items;

  const featuredIds = featured.map((row) => String(row.id ?? ""));
  const recent = await page(
    {
      and: [
        { id: { not_in: featuredIds } },
        { regionalCommunities: { contains: regionalCommunityId } },
      ],
    },
    limit - items.length,
  );
  items = [...items, ...recent.map(agendaProjection)];
  return items;
}

// ---------------------------------------------------------------------------
// Download tracking — the two `queryLive` sites, and the one dead end
// ---------------------------------------------------------------------------

/** The agenda's own file rows, as the tracker's read-modify-write needs them.
 *  `depth: 0` deliberately: the `file` upload stays an id string, which is
 *  exactly what has to go back into the array on write. */
export interface TrackedAgendaRow {
  _id: string;
  /** Structurally identical to `outputs.ts`'s own `TrackedAgendaFile`, so the
   *  two arms of the tracker's read are one type and the shared arithmetic
   *  below them cannot be written against only one of them. */
  files?: Array<{
    language?: string;
    downloadCount?: number;
    lastDownloaded?: string;
    [key: string]: unknown;
  }>;
  totalDownloadCount?: number;
}

/**
 * The read half of `trackAgendaDownload`. **`queryLive`** — note 3.
 */
export async function loadTrackedAgenda(agendaId: string): Promise<TrackedAgendaRow | null> {
  const row = await queryLive<{
    id?: unknown;
    files?: TrackedAgendaRow["files"] | null;
    totalDownloadCount?: number | null;
  } | null>({
    type: "findByID",
    collection: "agendas",
    id: agendaId,
    depth: 0,
  });
  if (!row) return null;
  return {
    _id: String(row.id ?? agendaId),
    files: Array.isArray(row.files) ? row.files : [],
    totalDownloadCount: num(row.totalDownloadCount) ?? 0,
  };
}

/** The write half. Note 2: this one really increments. */
export async function writeAgendaDownloadCounts(
  agendaId: string,
  files: Record<string, unknown>[],
  totalDownloadCount: number,
): Promise<void> {
  await updateDocument({
    collection: "agendas",
    id: agendaId,
    data: { files, totalDownloadCount },
  });
}

/** Thrown by `trackReportDownload`'s Payload arm. See note 1. */
export class ReportsNotModelledError extends Error {
  constructor(reportId: string) {
    super(
      `Cannot track a download for report "${reportId}": the legacy \`report\` type is not ` +
        `modelled in Payload. It left 0 documents behind in Sanity and every one of them was ` +
        `migrated into \`researchOutputs\`. Delete \`app/api/reports/download/track/route.ts\` ` +
        `and \`trackReportDownload\` in Phase 4.`,
    );
    this.name = "ReportsNotModelledError";
  }
}

/**
 * The Payload arm of `trackReportDownload`.
 *
 * Always throws. A tracker that resolves without writing is indistinguishable
 * from one that worked, and this one can never work — so it fails loudly
 * instead. The route's own try/catch keeps the download working, exactly as it
 * does on Sanity where the same call has always found no document.
 */
export function refuseReportDownloadTracking(reportId: string): never {
  throw new ReportsNotModelledError(reportId);
}

// ---------------------------------------------------------------------------
// Research outputs
// ---------------------------------------------------------------------------

/**
 * `status == "approved"`, strictly.
 *
 * Phase 2's review made `moderationApprovedOnly` strict for exactly this
 * collection — approved and nothing else, no exists-or-approved fallback, which
 * belongs to `livedExperience` alone — because all seven live GROQ filters on
 * this type are strict. This is that filter, expressed as a `where` because the
 * seam reads with `overrideAccess: true`.
 */
const APPROVED = { moderationStatus: { equals: "approved" } } as const;

interface VersionRow {
  id?: unknown;
  kind?: string | null;
  lang?: string | null;
  label?: string | null;
  pages?: number | null;
  downloadCount?: number | null;
  file?: unknown;
  body?: unknown;
}

/**
 * Payload's array-row id is `<documentId>:versions:<key>`; Sanity's `_key` is
 * the last segment. Measured: every version row in both stores keys as `v0`.
 */
function versionKey(id: unknown): string {
  const raw = String(id ?? "");
  const index = raw.lastIndexOf(":");
  return index >= 0 ? raw.slice(index + 1) : raw;
}

/** `"versions": versions[]{ _key, kind, lang, label, pages, downloadCount,
 *   "fileUrl": file.asset->url, "fileName": file.asset->originalFilename,
 *   body[]{…} }` */
function versionProjection(rows: unknown): ResearchOutput["versions"] | null {
  if (!Array.isArray(rows)) return null;
  const versions = rows.filter(isRow).map((raw) => {
    const row = raw as VersionRow;
    const file = isRow(row.file) ? (row.file as PayloadMediaRow) : undefined;
    return groqObject({
      _key: versionKey(row.id),
      body: orNull(row.body ? portableText(row.body) : undefined),
      downloadCount: orNull(num(row.downloadCount)),
      fileName: orNull(text(file?.filename)),
      fileUrl: orNull(text(file?.url)),
      kind: orNull(text(row.kind)),
      label: orNull(text(row.label)),
      lang: orNull(text(row.lang)),
      pages: orNull(num(row.pages)),
    });
  });
  return listOrNull(versions) as ResearchOutput["versions"] | null;
}

interface ResearchOutputRow {
  id?: unknown;
  title?: LocalizedRaw;
  excerpt?: LocalizedRaw;
  slug?: string | null;
  outputType?: string | null;
  layout?: string | null;
  moderationStatus?: string | null;
  featured?: boolean | null;
  publishDate?: string | null;
  year?: number | null;
  region?: string | null;
  themes?: string[] | null;
  populations?: string[] | null;
  coverImage?: unknown;
  organizations?: unknown;
  relatedCommunities?: unknown;
  tags?: unknown;
  versions?: unknown;
  body?: Partial<Record<string, unknown>> | null;
}

/** `RESEARCH_OUTPUT_FRAGMENT`, key for key. `status` is Payload's
 *  `moderationStatus` mapped back onto the public name the type declares. */
function researchOutputFragment(row: ResearchOutputRow): Record<string, unknown> {
  return {
    _id: String(row.id ?? ""),
    excerpt: orNull(localized(row.excerpt)),
    featured: row.featured ?? null,
    image: researchOutputImage(row.coverImage),
    layout: orNull(text(row.layout)),
    organizations: organizationProjection(row.organizations, ["_id", "name"]),
    outputType: orNull(text(row.outputType)),
    populations: listOrNull(row.populations),
    publishDate: orNull(isoDate(row.publishDate)),
    region: orNull(text(row.region)),
    relatedCommunities: communityProjection(row.relatedCommunities, "researchOutput"),
    slug: orNull(text(row.slug)),
    status: orNull(text(row.moderationStatus)),
    tags: tagProjection(row.tags, ["_id", "label", "value", "color"]),
    themes: listOrNull(row.themes),
    title: orNull(localized(row.title)),
    versions: versionProjection(row.versions),
    year: orNull(num(row.year)),
  };
}

function researchOutputProjection(row: ResearchOutputRow): ResearchOutput {
  return groqObject(researchOutputFragment(row)) as unknown as ResearchOutput;
}

/**
 * The detail projection: the fragment, plus `coalesce(content, body)` and
 * `relatedContent`.
 *
 * `content` is not a Payload field — the Sanity schema declares both `content`
 * and `body` and **0/29 documents populate either**, so the coalesce has always
 * resolved to `null`. Payload keeps only `body`, so this reads that and
 * converts; `relatedContent` is declared in Sanity, 0/29 populated, and not
 * ported (Phase 2 recorded the reason: its polymorphic target includes a
 * `project` type with no live documents anywhere), so it is `null`.
 */
function researchOutputDetail(row: ResearchOutputRow): ResearchOutput {
  const body = row.body ? Object.values(row.body).find(Boolean) : undefined;
  return groqObject({
    ...researchOutputFragment(row),
    content: orNull(body ? portableText(body) : undefined),
    relatedContent: null,
  }) as unknown as ResearchOutput;
}

export async function getResearchOutputBySlug(slug: string): Promise<ResearchOutput | null> {
  const result = await query<Paginated<ResearchOutputRow>>({
    type: "find",
    collection: "researchOutputs",
    where: { and: [APPROVED, { slug: { equals: slug } }] },
    limit: 1,
    locale: "all",
    depth: 2,
  });
  const row = result.docs[0];
  return row ? researchOutputDetail(row) : null;
}

export async function getResearchOutputs(): Promise<ResearchOutput[]> {
  // Push-down (2026-09-17): the order and the slice are asked of the database
// (`sort` with an explicit `id` tie-break; `limit`), and the rich-text column
// is excluded. The JavaScript comparator below is kept as a documented no-op
// safety net for rows with a NULL date (none admitted today — see
// scripts/parity/order-check.ts), not as the ordering mechanism.
  const result = await query<Paginated<ResearchOutputRow>>({
    type: "find",
    collection: "researchOutputs",
    where: APPROVED,
    pagination: false,
    locale: "all",
    depth: 2,
    sort: ["-publishDate", "id"],
    select: { body: false },
  });
  // `order(coalesce(publishDate, _createdAt) desc, _id asc)`. `publishDate` is
  // 29/29 populated, so the coalesce never reaches `_createdAt`; `createdAt` is
  // the fallback here for the same reason and with the same shape.
  return [...result.docs]
    .sort((a, b) =>
      byDateThenId(
        {
          date: isoDate(a.publishDate) ?? isoDate((a as { createdAt?: unknown }).createdAt),
          id: String(a.id ?? ""),
        },
        {
          date: isoDate(b.publishDate) ?? isoDate((b as { createdAt?: unknown }).createdAt),
          id: String(b.id ?? ""),
        },
      ),
    )
    .map(researchOutputProjection);
}

export async function getResearchOutputSlugs(): Promise<{ slug: string }[]> {
  const result = await query<Paginated<{ slug?: string | null }>>({
    type: "find",
    collection: "researchOutputs",
    where: { and: [APPROVED, { slug: { exists: true } }] },
    pagination: false,
    depth: 0,
    select: { slug: true },
  });
  return result.docs
    .map((row) => text(row.slug))
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
}

/** `*[_type == "tag"] | order(label.en asc) { _id, label, value }`, with `value`
 *  as the raw slug object the undereferenced projection returns. See note 7. */
export async function getResearchOutputTags(): Promise<ResearchOutputTagOption[]> {
  const result = await query<Paginated<TagRow>>({
    type: "find",
    collection: "tags",
    pagination: false,
    locale: "all",
    depth: 0,
  });
  return [...result.docs]
    .sort((a, b) => byCodePoint(localized(a.label)?.en ?? "", localized(b.label)?.en ?? ""))
    .map((row) =>
      groqObject({
        _id: String(row.id ?? ""),
        label: orNull(localized(row.label)),
        value: orNull(slugObject(row.value)),
      }),
    ) as unknown as ResearchOutputTagOption[];
}

/** `*[_type == "regionalCommunity" && active == true] | order(name.en asc) { _id, name, slug }` */
export async function getResearchOutputRegionalCommunities(): Promise<ResearchOutputCommunityOption[]> {
  const result = await query<Paginated<CommunityRow & { active?: boolean | null }>>({
    type: "find",
    collection: "regionalCommunities",
    where: { active: { equals: true } },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  return [...result.docs]
    .sort((a, b) => byCodePoint(localized(a.name)?.en ?? "", localized(b.name)?.en ?? ""))
    .map((row) =>
      groqObject({
        _id: String(row.id ?? ""),
        name: orNull(localized(row.name)),
        slug: orNull(slugObject(row.slug)),
      }),
    ) as unknown as ResearchOutputCommunityOption[];
}

// ---------------------------------------------------------------------------
// The edit gate and the write path
// ---------------------------------------------------------------------------

/** What `loadEditableResearchOutput` needs, in the domain module's own
 *  vocabulary — `RawEditableResearchOutputDoc`, which stays private there. */
export interface RawEditableResearchOutput {
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

/**
 * One research output, every version visible, uncached — **`queryRaw`**.
 *
 * No `drafts.` prefix to strip: Payload has no such ids, and `researchOutputs`
 * enables no drafts at all, so `queryRaw`'s `draft: true` is a no-op on the
 * data and a statement about the primitive. It is still the right one: this
 * read decides an authorization question about the document that is about to be
 * written, and `queryLive` would answer it from the published copy.
 *
 * `moderationStatus` is returned as `status`, verbatim and unmapped. The
 * `"draft"` literal in the caller's allow-list is **not** synthesised onto it —
 * Sanity's `status` conflates a moderation state with a draft state and Payload
 * splits the two, exactly as Task 9 decided for `livedExperience`.
 */
export async function loadEditableResearchOutputDoc(
  id: string,
): Promise<RawEditableResearchOutput | null> {
  const row = await queryRaw<
    | (ResearchOutputRow & {
        submittedBy?: string | null;
        reviewNotes?: string | null;
      })
    | null
  >({
    type: "findByID",
    collection: "researchOutputs",
    id,
    locale: "all",
    fallbackLocale: false,
    depth: 1,
  });
  if (!row) return null;

  const title = localized(row.title);
  const excerpt = localized(row.excerpt);
  const bodyState = row.body ? Object.values(row.body).find(Boolean) : undefined;

  return {
    _id: String(row.id ?? id),
    title: title as Record<string, string> | undefined,
    outputType: text(row.outputType),
    excerpt: excerpt as Record<string, string> | undefined,
    body: bodyState ? portableText(bodyState) : undefined,
    region: text(row.region),
    themes: Array.isArray(row.themes) ? row.themes : undefined,
    submittedBy: text(row.submittedBy),
    status: row.moderationStatus ?? null,
    reviewNotes: row.reviewNotes ?? null,
    tagIds: Array.isArray(row.tags)
      ? row.tags.map(relationId).filter((tagId): tagId is string => Boolean(tagId))
      : undefined,
    communityIds: Array.isArray(row.relatedCommunities)
      ? row.relatedCommunities.map(relationId).filter((cid): cid is string => Boolean(cid))
      : undefined,
    versions: Array.isArray(row.versions)
      ? row.versions.filter(isRow).map((raw) => {
          const version = raw as VersionRow;
          const file = isRow(version.file) ? (version.file as PayloadMediaRow) : undefined;
          return {
            _key: versionKey(version.id),
            kind: text(version.kind),
            lang: text(version.lang),
            fileName: text(file?.filename),
          };
        })
      : undefined,
  };
}

/** The rows a resubmission may keep, plus the three facts its gate reads.
 *  Each row carries both Sanity's `_key` (what `keptVersionKeys` names) and
 *  Payload's own `id` (what an array write has to hand back to keep the row). */
export interface ExistingResearchOutput {
  _id: string;
  submittedBy?: string;
  status?: string | null;
  versions?: Array<{ _key?: string; [key: string]: unknown }>;
}

/**
 * The narrower gate `submitResearchOutput` runs before a resubmission —
 * **`queryRaw`** again, for the same reason as above and with the same
 * consequence if it were `queryLive`.
 */
export async function loadExistingResearchOutput(id: string): Promise<ExistingResearchOutput | null> {
  const row = await queryRaw<{
    id?: unknown;
    submittedBy?: string | null;
    moderationStatus?: string | null;
    versions?: Record<string, unknown>[] | null;
  } | null>({
    type: "findByID",
    collection: "researchOutputs",
    id,
    depth: 0,
  });
  if (!row) return null;
  return {
    _id: String(row.id ?? id),
    submittedBy: text(row.submittedBy),
    status: row.moderationStatus ?? null,
    versions: Array.isArray(row.versions)
      ? row.versions.map((version) => ({ ...version, _key: versionKey(version.id) }))
      : undefined,
  };
}

/** A newly uploaded version, in neither store's vocabulary. */
export interface UploadedVersion {
  kind: string;
  lang: string;
  assetId: string;
}

/** A submission's field values, decided once in the domain module. */
export interface ResearchOutputDraft {
  language: "en" | "es" | "fr" | "ar";
  title: string;
  outputType: string;
  excerpt?: string;
  body?: RichText;
  region?: string;
  themes?: string[];
  tagIds?: string[];
  communityIds?: string[];
}

/** The Payload field names, which happen to match Sanity's for every field a
 *  submission touches — except the one that matters. */
function payloadData(draft: ResearchOutputDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {
    title: draft.title,
    outputType: draft.outputType,
    // Never trust the client: always pending on submit, exactly as the Sanity
    // path forces `status: "pending"`. `moderationStatus`, not `status` — the
    // name collides with Payload's `_status` enum.
    moderationStatus: "pending",
  };
  if (draft.excerpt) data.excerpt = draft.excerpt;
  if (draft.region) data.region = draft.region;
  if (draft.themes && draft.themes.length > 0) data.themes = draft.themes;
  if (draft.body && draft.body.length > 0) data.body = draft.body;
  if (draft.tagIds && draft.tagIds.length > 0) data.tags = draft.tagIds;
  if (draft.communityIds && draft.communityIds.length > 0) {
    data.relatedCommunities = draft.communityIds;
  }
  return data;
}

/** Payload writes one locale at a time; Sanity's `localized()` helper writes
 *  `{en: v, [lang]: v}` in a single patch. Reproduced with a second write of
 *  the localized fields alone, so the stored document is the same object on
 *  both backends rather than merely rendering the same through
 *  `fallback: true`. */
async function mirrorSubmissionLocale(
  id: string,
  draft: ResearchOutputDraft,
  isDraftVersion: boolean,
): Promise<void> {
  if (draft.language === "en") return;
  const data: Record<string, unknown> = { title: draft.title };
  if (draft.excerpt) data.excerpt = draft.excerpt;
  await updateDocument({
    collection: "researchOutputs",
    id,
    locale: draft.language,
    draft: isDraftVersion,
    data,
  });
}

/**
 * Create a submission. Published, not a draft: the Sanity original creates a
 * live document whose invisibility comes entirely from `status: "pending"`
 * failing the read filter, and `researchOutputs` enables no drafts anyway.
 *
 * `body` is Portable Text on the way in. `researchOutputs.body` is a Payload
 * `richText` (Lexical) field, and 0/29 documents populate it — the domain
 * module's own `input.body` is likewise empty on every live submission path
 * today, so the conversion is wired rather than exercised.
 */
export async function createResearchOutput(
  draft: ResearchOutputDraft,
  meta: { id: string; slug: string; submittedBy: string; year: number },
  versions: UploadedVersion[],
): Promise<{ id: string }> {
  const created = await createDocument({
    collection: "researchOutputs",
    locale: "en",
    data: {
      ...payloadData(draft),
      // Payload's `id` is a text column carrying Sanity's document id; a new
      // document needs one, and the slug is what every route addresses this
      // content by.
      id: meta.id,
      slug: meta.slug,
      submittedBy: meta.submittedBy,
      year: meta.year,
      ...(versions.length > 0
        ? { versions: versions.map((v) => ({ kind: v.kind, lang: v.lang, file: v.assetId })) }
        : {}),
    },
  });
  await mirrorSubmissionLocale(created.id, draft, false);
  return created;
}

/**
 * Patch an existing submission. `unset` names the neutral fields to clear;
 * `versions` is the whole array the domain module computed (kept rows first,
 * then the newly uploaded ones), so a kept row travels back with its own
 * Payload `id` and survives.
 */
export async function updateResearchOutputSubmission(
  id: string,
  draft: ResearchOutputDraft,
  unset: string[],
  versions: Array<Record<string, unknown> | UploadedVersion>,
): Promise<void> {
  await updateDocument({
    collection: "researchOutputs",
    id,
    locale: "en",
    data: {
      ...payloadData(draft),
      versions: versions.map((version) =>
        "assetId" in version
          ? { kind: version.kind, lang: version.lang, file: version.assetId }
          : version,
      ),
      ...Object.fromEntries(unset.map((field) => [field, null])),
    },
  });
  await mirrorSubmissionLocale(id, draft, false);
}

/** The generic patch primitive, mirroring `updateCaseStudy`. Zero call sites
 *  today; kept for parity with the documented Produces signature. */
export async function patchResearchOutput(id: string, data: Record<string, unknown>): Promise<void> {
  await updateDocument({ collection: "researchOutputs", id, data });
}

// ---------------------------------------------------------------------------
// Algolia index documents — read only, never written from here
// ---------------------------------------------------------------------------

/**
 * `AGENDA_INDEX_FIELDS` / `AGENDA_WEBHOOK_INDEX_FIELDS`.
 *
 * The webhook's projection is genuinely narrower — `files` carries only
 * `{language, downloadCount}`, no dereferenced asset — and that difference is
 * preserved rather than unified, exactly as `outputs.ts` preserves it: the
 * webhook's own transform reads nothing but `f.language`.
 *
 * `tags[]->{name}` and `organizations[]->{name}` project a field a `tag` does
 * not have; GROQ emits `null` for it, and so does `tagProjection`.
 * `_updatedAt` is Sanity's system timestamp, which the import preserved in
 * `sanityUpdatedAt`.
 */
function agendaIndexProjection(row: AgendaRow, opts: { dereferenceFiles: boolean }): AgendaIndexDoc {
  const files = Array.isArray(row.files)
    ? row.files.filter(isRow).map((raw) => {
        const file = raw as FileRow;
        const asset = isRow(file.file) ? (file.file as PayloadMediaRow) : undefined;
        const base = {
          language: text(file.language) ?? "",
          downloadCount: orNull(num(file.downloadCount)),
        };
        if (!opts.dereferenceFiles) return groqObject(base);
        const url = text(asset?.url);
        return groqObject({
          ...base,
          file: groqObject({
            asset: asset && url ? assetShape(asset, ["url", "originalFilename"]) : null,
          }),
        });
      })
    : null;

  const cover = isRow(row.coverImage) ? row.coverImage : undefined;
  const coverAsset = mediaOf(cover);
  const coverUrl = text(coverAsset?.url);

  return groqObject({
    _id: String(row.id ?? ""),
    _updatedAt: orNull(isoDate(row.sanityUpdatedAt) ?? isoDate(row.updatedAt)),
    accessLevel: orNull(text(row.accessLevel)),
    agendaType: orNull(text(row.agendaType)),
    coverImage: cover
      ? groqObject({ asset: coverAsset && coverUrl ? assetShape(coverAsset, ["url"]) : null })
      : null,
    description: orNull(localized(row.description)),
    featured: row.featured ?? null,
    files: listOrNull(files),
    organizations: organizationProjection(row.organizations, ["name"]),
    publishDate: orNull(isoDay(row.publishDate)),
    regionalCommunities: communityProjection(row.regionalCommunities, "indexName"),
    slug: orNull(slugObject(row.slug)),
    subtitle: orNull(localized(row.subtitle)),
    tags: tagProjection(row.tags, ["name"]),
    title: orNull(localized(row.title)),
    totalDownloadCount: orNull(num(row.totalDownloadCount)),
    year: orNull(num(row.year)),
  }) as unknown as AgendaIndexDoc;
}

/** See `getApprovedCaseStudyIndexDocs` for what `fresh` is for. */
export async function getPublishedAgendaIndexDocs(
  options: { fresh?: boolean } = {},
): Promise<AgendaIndexDoc[]> {
  const read = options.fresh ? queryLive : query;
  const result = await read<Paginated<AgendaRow>>({
    type: "find",
    collection: "agendas",
    pagination: false,
    locale: "all",
    depth: 2,
  });
  // The GROQ names no `order()`, so neither does this.
  return result.docs.map((row) => agendaIndexProjection(row, { dereferenceFiles: true }));
}

export async function getAgendaIndexDocsByIds(
  ids: string[],
  options: { fresh?: boolean } = {},
): Promise<AgendaIndexDoc[]> {
  if (ids.length === 0) return [];
  const read = options.fresh ? queryLive : query;
  const result = await read<Paginated<AgendaRow>>({
    type: "find",
    collection: "agendas",
    where: { id: { in: ids } },
    pagination: false,
    locale: "all",
    depth: 2,
  });
  return result.docs.map((row) => agendaIndexProjection(row, { dereferenceFiles: true }));
}

export async function getAgendaIndexDocById(id: string): Promise<AgendaIndexDoc | null> {
  const row = await query<AgendaRow | null>({
    type: "findByID",
    collection: "agendas",
    id,
    locale: "all",
    depth: 2,
  });
  return row ? agendaIndexProjection(row, { dereferenceFiles: false }) : null;
}

export async function getAgendaCount(): Promise<number> {
  return query<number>({ type: "count", collection: "agendas" });
}

// ---------------------------------------------------------------------------
// Search records — read, never written to the index
// ---------------------------------------------------------------------------

export interface AgendaSearchRecordDoc {
  _id: string;
  title?: Record<string, string>;
  description?: Record<string, string>;
  slug: string;
}

export async function getAgendaSearchRecordDocs(): Promise<AgendaSearchRecordDoc[]> {
  const result = await query<Paginated<AgendaRow>>({
    type: "find",
    collection: "agendas",
    where: { slug: { exists: true } },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  return result.docs
    .filter((row) => text(row.slug))
    .map((row) => ({
      _id: String(row.id ?? ""),
      title: localized(row.title) as Record<string, string> | undefined,
      description: localized(row.description) as Record<string, string> | undefined,
      slug: text(row.slug) as string,
    }));
}

export interface ResearchOutputSearchRecordDoc {
  _id: string;
  title?: Record<string, string>;
  excerpt?: Record<string, string>;
  slug: string;
}

export async function getResearchOutputSearchRecordDocs(): Promise<ResearchOutputSearchRecordDoc[]> {
  const result = await query<Paginated<ResearchOutputRow>>({
    type: "find",
    collection: "researchOutputs",
    where: { and: [APPROVED, { slug: { exists: true } }] },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  return result.docs
    .filter((row) => text(row.slug))
    .map((row) => ({
      _id: String(row.id ?? ""),
      title: localized(row.title) as Record<string, string> | undefined,
      excerpt: localized(row.excerpt) as Record<string, string> | undefined,
      slug: text(row.slug) as string,
    }));
}
