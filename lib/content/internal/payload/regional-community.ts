/**
 * `regionalCommunityPage`, against Payload — Task 14d's half of the remodel.
 *
 * Phase 2 collapsed this document type harder than any other, and this file is
 * where it is put back into the shape `communities/[slug]/page.tsx` and
 * `components/templates/regional-community-template.tsx` read. Nothing under
 * `app/` or `components/` changes in this phase, so the target is not "a
 * reasonable object" but "the object `REGIONAL_COMMUNITY_PAGE_QUERY` returns",
 * key for key.
 *
 * Every number below was measured on 2026-09-07 against `production_2` at the
 * **published** perspective (control `count(*[_type=="agenda"])` = 29) and
 * against the dev Payload database at `locale: "all"`, `depth: 3`.
 *
 * ---------------------------------------------------------------------------
 * 1. Six grid slots are one `contentGrid`, and `contentType` puts them back
 * ---------------------------------------------------------------------------
 *
 * `payload/blocks/content-grid.ts` folded `agendasGrid`, `caseStudiesGrid`,
 * `newsGrid`, `livedExperiencesCarousel`, `teamGrid` and `testimonialsBlock`
 * into one parameterised block repeated in an ordered `sections` array, and
 * `contentType` is the parameter that used to be the field name. Reading it
 * back is what makes the remodel lossless, and it is: **28 of 28 (slug,
 * language) pairs reconstruct the exact set of slots Sanity defines** —
 * including the twelve pairs with no `testimonialsBlock`, where Payload simply
 * has no `testimonials` section. `sections` is localized at the array level, so
 * the set genuinely differs per locale on two of the seven pages and is read
 * per locale here.
 *
 * The six were never identical fields, and the differences survive:
 * `livedExperiencesCarousel` has no `gridColumns`/`headerImage`/
 * `initialDisplayCount`, `teamGrid` has no `maxItems`/`subtitle`/`headerImage`
 * and speaks a different `mode` vocabulary (bare `"dynamic"`), and
 * `testimonialsBlock` has no `mode` at all. Each slot below projects exactly
 * the keys its own GROQ names.
 *
 * ---------------------------------------------------------------------------
 * 2. `manualItems` projects as a list of nulls, and that is not a bug here
 * ---------------------------------------------------------------------------
 *
 * See `dereferencedItems` in `internal/payload/blocks.ts`. The projection
 * dereferences (`manualItems[]->{…}`) entries that are stored as *objects*, so
 * GROQ answers `null` for every one of the 128 hand-picked items in the corpus.
 * The page renders no manual cards today and must not start.
 *
 * ---------------------------------------------------------------------------
 * 3. `useTemplate` and `contentFlow` are constants, and the constant is safe
 * ---------------------------------------------------------------------------
 *
 * `useTemplate` is `true` on all 28 documents and Payload dropped it, so it is
 * re-emitted as `true` — which is also the branch the route takes today
 * (`pageData.useTemplate && …` renders the template; the two `!useTemplate`
 * branches are dead). `contentFlow` is the body of that dead branch, 0/28
 * populated and not ported, so it is `null` — the same value GROQ returns.
 *
 * ---------------------------------------------------------------------------
 * 4. `atlasEmbed` is where a passed-through Payload checkbox would delete a
 *    section from every page
 * ---------------------------------------------------------------------------
 *
 * 0 of 28 documents store `atlasEmbed`, so GROQ answers `null` and the template
 * reads it as opt-**out**: `atlasEmbed?.enabled !== false` shows the Atlas.
 * Payload's group always exists and its `enabled` checkbox reads back **false**
 * even though `payload/collections/regional-community-pages.ts` deliberately
 * declares no `defaultValue`. Handing that through would have made
 * `false !== false` false and removed the Atlas embed from all seven regional
 * pages. So `enabled` goes through the same `false -> null` checkbox rule the
 * block mapper already applies, and the section keeps rendering.
 *
 * ---------------------------------------------------------------------------
 * 5. `testimonialsBlock` is a bare field, and one of its keys cannot come back
 * ---------------------------------------------------------------------------
 *
 * The GROQ names `testimonialsBlock` with no projection, so Sanity returns the
 * stored object verbatim: `{showSection, title}` on all 16 pairs that have one,
 * plus a `testimonials` array of raw references on 12 of them.
 * `showSection` is `true` on all 16 and was dropped by the remodel as encoding
 * nothing, so it is re-emitted as `true`. The reference `_key`s were not
 * imported — `manualTestimonials` is a `hasMany` relationship, which has no row
 * ids — so each entry comes back as `{_ref, _type: "reference"}` without one.
 *
 * That is safe to be imprecise about **only because nothing reads it**:
 * `communities/[slug]/page.tsx` does not pass `testimonialsBlock` to the
 * template and the template never renders it (`content-grid.ts` records the
 * same). It is carried rather than dropped because it is real authored data and
 * the projection names it.
 *
 * ---------------------------------------------------------------------------
 * 6. What the four locales share, and the id that survived
 * ---------------------------------------------------------------------------
 *
 * As with `pages` (see `internal/payload/pages.ts` note 1), four Sanity
 * documents are one Payload row and the **English** id is the one kept, so
 * `_id` is `regional-community-page-<slug>` in every locale where Sanity has a
 * per-language id. Nothing reads it: the route reads `title`,
 * `regionalCommunity._id`, `useTemplate`, the six slots and the two heroes.
 *
 * `slug` and `regionalCommunity` are not localized in Payload (verified
 * identical across the four language documents of every group before the
 * import), and `language` is Payload's locale rather than a stored field.
 */
import "server-only";
import { imageGroup } from "@/lib/content/internal/image-shape";
import { groqObject, localized, orNull, type LocalizedRaw } from "@/lib/content/internal/localized";
import { dereferencedItems, slotBlock, storedRichText } from "@/lib/content/internal/payload/blocks";
import { query, queryPreviewable } from "@/lib/content/internal/payload-source";
import type { Where } from "payload";
import type { RegionStats } from "@/lib/content/pages/regional-community";
import type { Locale } from "@/lib/content/types";
import { LOCALES } from "@/lib/content/types";
import { isRegionCode } from "@/lib/maps/region-codes";

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface Paginated<T> {
  docs: T[];
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Payload's `false` for a checkbox nobody touched, as the `null` GROQ returns
 *  for the unset field. The same rule `internal/payload/blocks.ts` applies, and
 *  note 4 above is what it is protecting. */
function checkbox(value: unknown): true | null {
  return value === true ? true : null;
}

/** One locale's arm of a localized column. */
function arm(value: unknown, locale: Locale): string | undefined {
  return localized(value as LocalizedRaw)?.[locale];
}

/** One locale's arm of a localized container (a slot, an array, a rich-text
 *  column) — the shape `blockSlot`'s default `localized: true` produces. */
function armOf<T = unknown>(value: unknown, locale: Locale): T | undefined {
  return isRow(value) ? (value[locale] as T | undefined) : undefined;
}

/** `slug` as the object Sanity stores. */
function slugObject(value: unknown): Row | null {
  const current = text(value);
  return current ? groqObject({ _type: "slug", current }) : null;
}

/**
 * Did a Sanity document exist for this locale?
 *
 * Same question `internal/payload/pages.ts` asks, and the same answer: the
 * import wrote each localized field only for the languages that had a document.
 * Measured complete today (28 = 7 x 4), so this exists to keep
 * `getRegionalCommunityPage`'s English fallback meaningful rather than dead.
 */
function carriesLocale(row: Row, locale: Locale): boolean {
  if (Array.isArray(armOf(row.sections, locale))) return true;
  return Boolean(
    arm(row.title, locale) ??
      arm(row.meta_title, locale) ??
      arm(row.meta_description, locale) ??
      armOf(row.welcomeHero, locale),
  );
}

// ---------------------------------------------------------------------------
// The six sections
// ---------------------------------------------------------------------------

type ContentType = "agendas" | "caseStudies" | "news" | "livedExperiences" | "team" | "testimonials";

function sectionsByType(rows: unknown): Partial<Record<ContentType, Row>> {
  const out: Partial<Record<ContentType, Row>> = {};
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    if (!isRow(row)) continue;
    const type = text(row.contentType) as ContentType | undefined;
    // A `contentType` outside the declared six cannot be mapped back onto a
    // slot, so it is dropped rather than guessed at — the same treatment
    // `blocks.ts` gives a block type it has not mapped.
    if (type && !(type in out)) out[type] = row;
  }
  return out;
}

/** The keys `agendasGrid`, `caseStudiesGrid` and `newsGrid` share, character
 *  for character across the three copies of the projection. */
function gridSection(row: Row | undefined): Row | null {
  if (!row) return null;
  return groqObject({
    description: storedRichText(row.description),
    gridColumns: orNull(text(row.gridColumns)),
    headerImage: imageGroup(row.headerImage, {
      asset: ["_id", "url", "lqip", "dimensions"],
      keys: ["alt"],
    }),
    initialDisplayCount: orNull(num(row.initialDisplayCount)),
    manualItems: dereferencedItems(row.manualItems),
    maxItems: orNull(num(row.maxItems)),
    mode: orNull(text(row.mode)),
    showDescription: row.showDescription === true,
    showTitle: row.showTitle === true,
    subtitle: orNull(text(row.subtitle)),
    title: orNull(text(row.title)),
  });
}

/** `livedExperiencesCarousel` — a carousel, so no columns, header image or
 *  initial count. */
function carouselSection(row: Row | undefined): Row | null {
  if (!row) return null;
  return groqObject({
    description: storedRichText(row.description),
    manualItems: dereferencedItems(row.manualItems),
    maxItems: orNull(num(row.maxItems)),
    mode: orNull(text(row.mode)),
    showDescription: row.showDescription === true,
    showTitle: row.showTitle === true,
    title: orNull(text(row.title)),
  });
}

/**
 * `teamGrid` — the one slot whose hand-picked items really are references, so
 * the one whose `[]->` dereference returns documents rather than nulls.
 *
 * `regionalCommunity->{…}` is projected by `TEAM_GRID_PROJECTION` (the
 * content-flow arm) but **not** by this document's own inline `teamGrid`
 * projection, so it is not emitted here.
 */
function teamSection(row: Row | undefined): Row | null {
  if (!row) return null;
  return groqObject({
    description: storedRichText(row.description),
    displayAffiliation: row.displayAffiliation === true,
    displayRole: row.displayRole === true,
    gridColumns: orNull(text(row.gridColumns)),
    manualMembers: Array.isArray(row.manualMembers)
      ? listOrNull(row.manualMembers.filter(isRow).map(teamMember))
      : null,
    mode: orNull(text(row.mode)),
    showDescription: row.showDescription === true,
    showTitle: row.showTitle === true,
    title: orNull(text(row.title)),
  });
}

/**
 * `manualMembers[]->{…}` — the author projection this slot names.
 *
 * `communityMemberships[]{community->{_id, name}, role}` is projected and is
 * `null` on every one of the 60 members in the corpus: the field lives on the
 * Sanity `author` document and Payload's `authors` collection does not carry
 * it. Emitted as `null`, which is what GROQ answers.
 */
function teamMember(row: Row): Row {
  return groqObject({
    _id: String(row.id ?? ""),
    communityMemberships: memberships(row.communityMemberships),
    image: imageGroup(row.image, {
      asset: ["_id", "url", "lqip", "dimensions"],
      keys: ["alt"],
    }),
    name: orNull(text(row.name)),
    organizationalAffiliation: orNull(text(row.organizationalAffiliation)),
    slug: slugObject(row.slug),
  });
}

/** `communityMemberships[]{community->{_id, name}, role}` — the sub-array
 *  `team-grid.tsx` reads to label a member with their role in *this* community.
 *  Populated on 79 of 99 authors and on 264 of the 320 member cards in the
 *  regional corpus, so dropping it would have blanked the role line on most of
 *  them. `role` is a plain string on both sides; `name` is localized in Payload
 *  and plain in Sanity's `regionalCommunity`, and both answer the same map. */
function memberships(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  return listOrNull(
    rows.filter(isRow).map((row) =>
      groqObject({
        community: isRow(row.community)
          ? groqObject({
              _id: String(row.community.id ?? ""),
              name: orNull(localized(row.community.name as LocalizedRaw)),
            })
          : null,
        role: orNull(text(row.role)),
      }),
    ),
  );
}

/** `testimonialsBlock` — a bare field reference, so the stored object. See note 5. */
function testimonialsSection(row: Row | undefined): Row | null {
  if (!row) return null;
  const title = text(row.title);
  const testimonials = Array.isArray(row.manualTestimonials)
    ? listOrNull(
        row.manualTestimonials.map((value) =>
          groqObject({ _ref: String(isRow(value) ? value.id : value), _type: "reference" }),
        ),
      )
    : null;
  const out: Row = { showSection: true };
  if (testimonials) out.testimonials = testimonials;
  if (title) out.title = title;
  return groqObject(out);
}

function listOrNull<T>(rows: T[]): T[] | null {
  return rows.length > 0 ? rows : null;
}

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

/** `regionalCommunity->{_id, name, slug, coverImage{asset->{…}, alt}}`. */
function regionalCommunity(value: unknown): Row | null {
  if (!isRow(value)) return null;
  return groqObject({
    _id: String(value.id ?? ""),
    coverImage: imageGroup(value.coverImage, {
      asset: ["_id", "url", "lqip", "dimensions"],
      keys: ["alt"],
    }),
    name: orNull(localized(value.name as LocalizedRaw)),
    slug: slugObject(value.slug),
  });
}

/**
 * One `regionalCommunityPage`, as `REGIONAL_COMMUNITY_PAGE_QUERY`'s row.
 *
 * `queryPreviewable`, matching the Sanity twin — `fetchSanityRCPageBySlug`
 * omitted `perspective`, so an editor previewing in the Presentation tool sees
 * their draft. Unlike `pages`, this collection really does carry a draft
 * (`regional-community-page-central-and-southern-asia`), so the two
 * perspectives differ on live data and the primitive choice is load-bearing.
 *
 * `depth: 3`, for the reason `pages.ts` records: Payload counts relationships
 * and uploads, not the blocks and groups they sit inside. The three hops here
 * are `regionalCommunity` / `manualMembers` / a slot image (1), the community's
 * own `coverImage` and a member's `image` (2), and a `grid-news`
 * `author.image.asset` inside `contentFlow`-shaped data (3).
 */
export async function findRegionalCommunityPage(
  slug: string,
  locale: Locale,
): Promise<Row | null> {
  const result = await queryPreviewable<Paginated<Row>>({
    type: "find",
    collection: "regionalCommunityPages",
    where: { slug: { equals: slug } },
    locale: "all",
    depth: 3,
    limit: 1,
    pagination: false,
  });
  const row = result?.docs?.[0];
  return row ? toRegionalCommunityPage(row, locale) : null;
}

/**
 * One Payload row, as `REGIONAL_COMMUNITY_PAGE_QUERY`'s result.
 *
 * Split from the read so the mapping can be exercised against a row taken
 * straight out of the Local API — the whole 28-document comparison behind the
 * numbers in this header ran through here, and a reader that owns its own query
 * cannot be checked that way outside a request.
 */
export function toRegionalCommunityPage(row: Row, locale: Locale): Row | null {
  // The English fallback `fetchSanityRCPageBySlug` performs.
  const chosen = carriesLocale(row, locale) ? locale : "en";
  if (!carriesLocale(row, chosen)) return null;

  const sections = sectionsByType(armOf(row.sections, chosen));
  const atlas = isRow(row.atlasEmbed) ? row.atlasEmbed : undefined;

  return groqObject({
    _id: String(row.id ?? ""),
    agendasGrid: gridSection(sections.agendas),
    atlasEmbed: groqObject({
      enabled: checkbox(atlas?.enabled),
      showBreakdown: atlas?.showBreakdown ?? null,
    }),
    caseStudiesGrid: gridSection(sections.caseStudies),
    // See note 3: the dead false branch of a switch that is `true` everywhere.
    contentFlow: null,
    language: chosen,
    livedExperiencesCarousel: carouselSection(sections.livedExperiences),
    logoCloud: slotBlock(armOf(row.logoCloud, chosen), "logoCloud1"),
    meta_description: orNull(arm(row.meta_description, chosen)),
    meta_title: orNull(arm(row.meta_title, chosen)),
    newsGrid: gridSection(sections.news),
    // Not localized in Payload, and `false` where Sanity holds `null` on the
    // documents that never set it — the same difference `pages.ts` records in
    // its note 4, and equally falsy everywhere it is read.
    noindex: row.noindex ?? null,
    ogImage: imageGroup(row.ogImage, { asset: ["_id", "url", "dimensions"] }),
    regionalCommunity: regionalCommunity(row.regionalCommunity),
    slug: slugObject(row.slug),
    teamGrid: teamSection(sections.team),
    testimonialsBlock: testimonialsSection(sections.testimonials),
    title: orNull(arm(row.title, chosen)),
    useTemplate: true,
    welcomeHero: slotBlock(armOf(row.welcomeHero, chosen), "hero1"),
    // `whyJoinCTA` stores `_type: "cta-1"` on all 28 while carrying hero-1's
    // field set — see `SlotOptions.type` in `blocks.ts`.
    whyJoinCTA: slotBlock(armOf(row.whyJoinCTA, chosen), "hero1", { type: "cta-1" }),
  });
}

/**
 * `*[_type == "regionalCommunityPage" && defined(slug)]{…}` for the slug rows —
 * already 14b's, in `internal/payload/pages.ts`. Nothing to add here.
 */

// ---------------------------------------------------------------------------
// The region hero's live counts
// ---------------------------------------------------------------------------

/**
 * `getRegionStats`'s two counts.
 *
 * Both halves of each GROQ filter are reproduced, and each carries one thing
 * worth stating:
 *
 * 1. **`caseStudy.region == $code`** is a Payload `select` backed by a Postgres
 *    enum holding exactly the seven region codes, and filtering an enum with a
 *    value outside its set **raises at the database** where GROQ simply matches
 *    nothing. `code` reaches this function from `region-hero.tsx` via a route
 *    slug, so it is checked against the declared set first and the clause is
 *    dropped when it does not belong — which produces the empty result GROQ
 *    produces rather than a 500.
 * 2. **`livedExperience.region == $code` matches nothing on either backend.**
 *    Phase 2's obligation 10: that field holds a `regionalCommunity`
 *    **reference**, not a code (measured: 42 references, 0 strings), so
 *    comparing it to a string is false for all 56 documents. Payload models it
 *    as a relationship, where the same comparison is not even expressible. The
 *    clause is therefore omitted, and the count is the `relatedCommunity` half
 *    alone — which is what Sanity answers today.
 * 3. **`status`.** `caseStudy` maps onto `moderationStatus == "approved"`
 *    (Phase 2's obligation 1). `livedExperience`'s `(status == "approved" ||
 *    !defined(status))` becomes "not rejected or pending", because
 *    `moderationStatus` is `null` on all 35 published rows and unset means
 *    approved — the `exists: false` arm is the one that does the work, exactly
 *    as in Sanity.
 *
 * `query`, matching the Sanity twin: the original ran an inline count on the
 * read-token client at the published perspective.
 */
export async function regionStats(code: string, slug: string): Promise<RegionStats> {
  const community = await query<Paginated<Row>>({
    type: "find",
    collection: "regionalCommunities",
    where: { slug: { equals: slug } },
    locale: "all",
    depth: 0,
    limit: 1,
    pagination: false,
  });
  const communityId = text(community?.docs?.[0]?.id);

  const [caseStudies, livedExperiences] = await Promise.all([
    countMatching("caseStudies", isRegionCode(code) ? { region: { equals: code } } : null, communityId, {
      moderationStatus: { equals: "approved" },
    }),
    countMatching("livedExperiences", null, communityId, {
      or: [
        { moderationStatus: { equals: "approved" } },
        { moderationStatus: { exists: false } },
      ],
    }),
  ]);

  return { caseStudies, livedExperiences };
}

/** `count(*[… && (<region clause> || relatedCommunity->slug.current == $slug)])`,
 *  with the region clause dropped when it cannot match. */
async function countMatching(
  collection: "caseStudies" | "livedExperiences",
  regionClause: Where | null,
  communityId: string | undefined,
  status: Where,
): Promise<number> {
  const either = [
    ...(regionClause ? [regionClause] : []),
    ...(communityId ? [{ relatedCommunity: { equals: communityId } }] : []),
  ];
  // Neither half can match: GROQ's `(false || false)` filters everything out.
  if (either.length === 0) return 0;
  const result = await query<{ totalDocs?: number } | number>({
    type: "count",
    collection,
    where: { and: [status, either.length === 1 ? either[0] : { or: either }] },
  });
  return typeof result === "number" ? result : (result?.totalDocs ?? 0);
}

/** The four configured locales, re-exported so the caller's fallback loop and
 *  this file's `carriesLocale` cannot drift apart. */
export const RC_LOCALES = LOCALES;
