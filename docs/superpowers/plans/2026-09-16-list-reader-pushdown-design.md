# Query push-down design for the Payload list readers

Scope: `lib/content/internal/payload/{case-studies,discovery,page-feeds,news,outputs,system}.ts` + `payload-source.ts`. Nothing was edited. Everything measured below came from read-only greps and two read-only (`BEGIN READ ONLY … ROLLBACK`) `pg` probes of the **dev** database named by `.env.local`'s `PAYLOAD_DATABASE_URL`.

## 0. Facts that change the design (measured, not assumed)

| Fact | Evidence | Consequence |
|---|---|---|
| Dev DB collation is **`C.UTF-8`** (`datcollate`/`datctype`), PG 17.11 | probe: `[{"datcollate":"C.UTF-8","datctype":"C.UTF-8"}]` | In C collation `ORDER BY id` **is** byte order = code-point order for UTF-8 ASCII ids. Probe: `array_agg(id ORDER BY id) = array_agg(id ORDER BY id COLLATE "C")` is `true` on case_studies, news_posts, agendas, research_outputs, lived_experiences; and `ORDER BY published_at DESC, id` = `… id COLLATE "C"` is `true` for the 25 approved case studies. **The stated blocker ("Postgres collation on id differs from code-point order") does not hold on this database.** Mixed-case ids exist (research_outputs 29/29, lived_experiences 34/35, case_studies 2/27), so it *would* matter under `en_US`. |
| **Prod collation is unverified.** `.env` has no `PAYLOAD_DATABASE_URL` (only `DATABASE_URL`, `NEON_DEV_DB_STRING`) | `grep -o "^[A-Z_]*DATABASE[A-Z_]*=" .env` | Push-down must either assert `C` collation at runtime/in the parity script, or pin `COLLATE "C"` on the `id` columns by migration (§7). |
| Payload's adapter **always appends `-createdAt`** to any sort that lacks it | `@payloadcms/drizzle/dist/queries/buildOrderBy.js`: `let fallbackSort = '-id'; if (createdAt) fallbackSort = '-createdAt'; … sort.push(fallbackSort)` | Always pass the tie-break explicitly, e.g. `["-publishedAt","id"]`. A bare `"-publishedAt"` gets `created_at DESC` as tie-break, which is *not* Sanity's `_id asc`. |
| Postgres `DESC` = `NULLS FIRST`; drizzle `desc()` emits no `NULLS LAST`; JS comparators put undated rows **last** (`case-studies.ts:611-616`) | probe: `featured IS NULL` = 0 on all six tables; `published_at IS NULL` = 2 on case_studies (both the `pending` rows, excluded by `APPROVED`), 0 elsewhere | Sort push-down is exact today. Any `where` that admits a NULL date must use the two-step pattern in §1(b). |
| **`select` is pushed to SQL columns**, including the `_locales` join | `buildFindManyArgs.js:10-17,84`: `result.columns = { id: true }` … `_locales.columns = select ? { _locale: true } : …`; locales table joined only when `Object.keys(_locales.columns).length > 1` | Excluding `content` really avoids reading it. `case_studies_locales.content` = **2,032 kB across 104 rows**; `title+excerpt` = 49 kB. Every depth-2 `locale:"all"` case-study read today drags ~2 MB of Lexical JSON through Postgres → Node → JSON. |
| A localized `where` at `locale:"all"` joins `_locales` **without** a locale predicate | `getTableColumnFromPath.js:222-226`: `if (locale !== 'all') condition = and(condition, eq(_locale, locale))` | The "four-locale disjunction" (`case-studies.ts` note 4) **is** expressible: `{ title: { contains: q } }` at `locale:"all"` matches any arm. `selectDistinct.js` dedupes the join. |
| `contains` → `ILIKE '%v%'`; `like` → AND of `ILIKE '%word%'` per whitespace token | `operatorMap.js`: `contains: ilike, like: ilike`; `parseParams.js:184` | `contains` ≈ `toLowerCase().includes()`. Caveats: `%`/`_`/`\` in the needle are not escaped by the adapter; accent folding verified (`'É' ILIKE '%é%'` → `true`) but only for that one char. |
| `where` on `now()` is embedded as a **millisecond ISO string** | `news.ts:536-538`, `discovery.ts:790-792`, `page-feeds.ts:466,536` | The descriptor is the `unstable_cache` key (`payload-source.ts:316-328`), so **every call is a cache miss and a new cache entry**. These reads are effectively uncached today. Fix: truncate to the minute (or hour, matching `revalidate`), independent of push-down. |
| `unstable_cache` runs the callback for every concurrent miss and is bypassed entirely in draft mode | `next/dist/server/web/spec-extension/unstable-cache.js:160,224-232` (`!workStore.isDraftMode`; `pendingRevalidates` dedupes only the *write*) | Duplicate descriptors in one render cost duplicate DB reads on cold cache and always in preview (§8). |
| `sanityUpdatedAt`'s `index: true` produced `CREATE INDEX "<table>_sanity_updated_at_idx"` | `payload/fields/sanity-timestamps.ts:45`; `migrations/20260904_105415_sanity_updated_at.ts` | `index: true` generates single-column btree indexes on the next `payload migrate:create`. Compound indexes exist too: `indexes?: CompoundIndex[]` (`payload/dist/collections/config/types.d.ts:573`). |
| **No index** on `moderation_status`, `published_at`, `publish_date`, `featured`, `start_at` | probe of `pg_indexes` filtered on those columns → `[]`; migrations grep agrees | §7. `related_community_id` and `case_studies_rels.tags_id` **are** indexed. |
| Payload `populate` option exists (`PopulateType = Partial<TypedCollectionSelect>`) but `PayloadFindQuery` does not expose it | `payload/dist/types/index.d.ts:161`; `payload-source.ts:106-117` | Card projections need `populate` to trim populated `media`/`tags`/`organizations`/`regionalCommunities` rows; add the field to the descriptor (one line + `defined()` passthrough). |

---

## 1. `case-studies.ts` — highest impact (2 MB rich text per read, 3 live paths)

Live callers: `getFilteredCaseStudies` (list page, `app/[locale]/(main)/research-and-action/case-studies/page.tsx:66` and `:95` — second call with `communities: undefined` for the choropleth), `getApprovedCaseStudiesByContributor` (`lib/community/region-data.ts`, via `allApproved()`), `publishedCaseStudyReferences` (×2 per list page via `getCaseStudyFilterTags`/`getCaseStudyFilterCommunities`, `case-studies.ts:1066-1069, 1087-1096`), `getApprovedCaseStudyIndexDocs` (Algolia). `getApprovedCaseStudies`/`getFeaturedCaseStudies` (`lib/content/pages/feeds.ts:21` calls them "dead helpers"), `getCaseStudiesByRegion`, `searchCaseStudies` (the only hit in `components/search/search-interface.tsx:252` is a translation key), `getCaseStudiesByUser/ByStatus` are dead.

### (a) Descriptors

| Reader (today) | Push-down descriptor |
|---|---|
| `allApproved()` `:683-693` — `where: APPROVED, pagination:false, depth:2, locale:"all"`, then `byPublishedAt` | Delete the shared helper; each caller gets its own `where`/`sort`/`limit`/`select`. |
| `getApprovedCaseStudies(limit)` — GROQ `order(publishedAt desc, featured desc)` (`lib/content/case-studies.ts:348`) | `where: APPROVED, sort: ["-publishedAt","-featured","id"], limit, pagination:false, locale:"all", depth:1, select: FRAGMENT_SELECT` |
| `getFeaturedCaseStudies(limit)` `:764-767` (JS `filter(featured===true)`) | `where: {and:[APPROVED,{featured:{equals:true}}]}, sort:["-publishedAt","id"], limit, depth:1, select: FRAGMENT_SELECT` |
| `getFilteredCaseStudies(filters)` `:969-1041` — GROQ `order(featured desc, publishedAt desc)[0...50]` (`lib/content/case-studies.ts:828`) | `where: and(APPROVED, topics && {topic:{in:topics}}, tags && {"tags.value":{in:tags}}, communities && {"relatedCommunity.slug":{in:communities}}, search && {or:[{title:{contains:q}},{excerpt:{contains:q}}]})`, `sort:["-featured","-publishedAt","id"]`, `limit:50`, `pagination:false`, `locale:"all"`, `depth:1`, `select: LIST_SELECT`, `populate: LIST_POPULATE`. Note the current arm sorts by `publishedAt` only (note 3 argues `featured` is all-false); pushing `-featured` restores GROQ fidelity at no cost. `"tags.value"` and `"relatedCommunity.slug"` are already used as `where` paths elsewhere (`news.ts:565-566`, `discovery.ts:702-704`). |
| `searchCaseStudies(term, {language,tags,limit})` `:909-958` | Short-circuit `if (language) return []` **before** the query (today it reads the whole collection at depth 2 and then discards it, `:928`). Otherwise `where: and(APPROVED, term && {or:[{title:{contains}},{excerpt:{contains}}]}, tags && {"tags.value":{in:tags}})`, `sort:["-featured","-publishedAt","id"]`, `limit`, `depth:1`, `select: SEARCH_SELECT`. |
| `getCaseStudiesByRegion(slug, dir, limit)` `:861-899` — GROQ `order(publishedAt ${dir}, featured desc)` | keep `where`; `sort:[dir==="desc"?"-publishedAt":"publishedAt","-featured","id"], limit, depth:1` (`tags` is emitted as raw refs, `:894` → depth 0 for tags via `populate: { tags: {} }` is not possible per-field; keep depth 1). |
| `getApprovedCaseStudiesByContributor(userId)` `:1915-1930` | `where: {and:[APPROVED,{or:[{submittedBy:{equals:userId}},{"authors.userId":{equals:userId}}]}]}` (array sub-field `where` joins `case_studies_authors`, `getTableColumnFromPath.js` `case 'array'` — inferred from the adapter code, **not executed**), `sort:["-publishedAt","id"]`, `limit:50`, **`depth:0`**, `select:{title:true,slug:true,publishedAt:true}`. This is the single biggest win: a live path going from 2 MB/depth 2 to four columns. |
| `getCaseStudiesByUser/ByStatus` `:797-838` (dead; `order(_updatedAt desc)` = `sanityUpdatedAt ?? updatedAt`) | Leave the JS sort. `coalesce` is not expressible, and post-cutover rows have `sanityUpdatedAt = NULL`, which `DESC` would put **first**. Only add `limit`-less `select` excluding `content`. |
| `publishedCaseStudyReferences()` `:1045-1064` — depth 0 whole collection, reads only `tags` and `relatedCommunity` | `select: { tags: true, relatedCommunity: true }`, `depth:0`. Also dedupe the two calls per page (§8) or merge the two option readers into one. |
| `getApprovedCaseStudyIndexDocs` `:1832-1846`, `getCaseStudyIndexDocsByIds` | No order in GROQ; add `select` = INDEX_SELECT (everything the projection at `:1797-1829` reads; excludes `content`). |
| `getCaseStudySearchRecordDocs` `:1773-1795` | `select:{title:true,excerpt:true,slug:true}` (already depth 0). |

### (b) What cannot be pushed, and the compromise

- **The code-point tie-break.** For case studies it is *the whole ordering*: `publishedAt` is one distinct value across all 25 approved rows (probe: `n=1, nulls=0`; header note 3). So "keep the JS tie-break only among rows that tie" means re-sorting the entire result — and a `limit` cuts *inside* the tie group, so the DB's own `ORDER BY id` decides membership. There is no over-fetch compromise here; correctness rests entirely on `id` ordering being code-point. Recommended: rely on it, and **prove it** (§7 migration pinning `COLLATE "C"`, or the runtime/parity assertion in §9). Until prod collation is verified, ship push-down behind the existing per-domain flag with the assertion in place.
- **NULL dates.** Not present among rows any live `where` admits (`publishedAt` is set by the Approve action, `payload/collections/case-studies.ts:323`). Where a `where` can admit them (`getCaseStudiesByStatus("pending")`), use the two-step pattern: query 1 `{publishedAt:{exists:true}}` sorted+limited; if short, query 2 `{publishedAt:{exists:false}}` sorted by `["-createdAt","id"]` for the remainder. Exact, two cheap queries.
- **Search semantics.** `contains` is `ILIKE %q%`; the JS test is `toLowerCase().includes()`. Differences: unescaped `%`/`_`/`\` (escape them before building the `where`), and Unicode case folding beyond the one accented char verified. Both are strictly narrower than today's stated GROQ-vs-substring approximation (note 4). If that is unacceptable, push everything except `search`, then filter the (now `select`-trimmed) rows in JS and slice — still no rich text on the wire.
- **`unstable_cache` fan-out.** Today every filter combination shares one cache entry (`APPROVED, depth 2`); after push-down each `(topics,tags,communities,search)` tuple is its own hour-long entry and a cold DB hit. Bounded by traffic; the page already sets `revalidate = 60`. Acceptable, but say so in the commit.

### (c) Card projections (`select`), from the projection helpers

`caseStudyFragment` `:633-659` reads: `id, authors[] (userId,name,email,role,affiliation→{id,name,slug,acronym,logo→media}), excerpt, featured, image{asset→media, alt, caption, hotspot?, crop?}, organizations→{id,name,slug,acronym,logo}, publishedAt, slug, moderationStatus, studyAreas[], studyLocation, studyPeriod{startDate,endDate}, submittedAt, submittedBy, tags→{id,label,value,color}, title`.

```ts
const FRAGMENT_SELECT = { title:true, excerpt:true, slug:true, featured:true, publishedAt:true,
  moderationStatus:true, submittedAt:true, submittedBy:true, image:true, authors:true,
  organizations:true, tags:true, studyAreas:true, studyLocation:true, studyPeriod:true };
// excluded: content (2 MB), topic, layout, region, themes, populations, locationText,
// locationPrecision, locationCountryCode, locationDisplayText, seo*, canonicalUrl,
// review*, notifiedStatus, sanityUpdatedAt
```

`getFilteredCaseStudies` list item `:1021-1039` reads less: `id, authors (bare, all stored keys incl. clerk*, affiliation id), relatedCommunity→{slug,name}, excerpt, featured, image→{asset id,url; alt}, organizations→{id,name}, publishedAt, slug, tags→{id,label,value,color}, title, topic`.

```ts
const LIST_SELECT = { title:true, excerpt:true, slug:true, featured:true, publishedAt:true, topic:true,
  image:true, authors:true, organizations:true, relatedCommunity:true, tags:true };
const LIST_POPULATE = {           // needs `populate` added to PayloadFindQuery
  media: { url:true, alt:true, lqip:true, width:true, height:true, mimeType:true },
  organizations: { name:true }, tags: { label:true, value:true, color:true },
  regionalCommunities: { slug:true, name:true } };
```
`depth:1` suffices for the list item (nothing reads through a populated doc's own relationship; `rawAuthors` `:510-541` reads only `relationId(author.affiliation)`). `searchCaseStudies` `:942-956`: `LIST_SELECT` minus `topic/organizations/relatedCommunity`, but `authors[].affiliation→{name,acronym}` needs depth 2 (or `populate.organizations`). `caseStudyIndexProjection` `:1797-1829`: `title, excerpt, slug, featured, publishedAt, moderationStatus, region, themes, populations, image(url only), authors, organizations, tags, studyLocation, studyPeriod, sanityUpdatedAt, updatedAt`.

---

## 2. `discovery.ts` — same table at depth 2, once per grid slot

`getDynamicContent` `:566-588` is called per dynamic-insert slot via `lib/dynamic-queries.ts:34`; the regional community route has six grid slots (`scripts/parity/routes.ts` "six grid slots"). `getForYouCandidates` `:668-735` (live, `lib/follows/for-you.ts`), `findNewsPosts` `:794-804`/`getNewsPostsForBlock` (`components/blocks/all-posts.tsx`), `getEvents` `:1119-1150` (`lib/events.ts`), `findTemplateRows`/`fetchDynamicCaseStudies` `:1405-1457` (no callers found outside `lib/content`).

(a)
- `getDynamicContent`: keep `spec.where`; `sort: mode==="featured" ? ["-featured","-publishedAt","id"] : ["-publishedAt","id"]`, `limit: options.count`, `depth:1` + `populate`, `select` per kind: news card `:461-474` → `{title,excerpt,slug,publishedAt,featured,image,author,tags}`; case-study card `:476-489` → `{title,excerpt,slug,publishedAt,featured,image,authors,tags}` (authors' `affiliation` name is read by `cardAuthorsProjection` `:401-411` → `populate.organizations:{name:true}`); lived-experience card `:491-511` → `{title,description,duration,issue,personContext,publishedAt,featured,slug,tags,thumbnail,videoLink,author}`. `sortCards` `:513-523` becomes a no-op and can go.
- `getNewsPostsForBlock` featured-then-fill `:817-830`: query 1 `and({featured:{equals:true}}, publishedByNow())`, `sort:["-publishedAt","id"]`, `limit`; query 2 only if short: `and(notFeatured, publishedByNow(), {id:{not_in:featuredIds}})`, `limit: remaining`. Manual mode `:810-816`: `where:{id:{in:manualIds}}`, `sort:["id"]`, no limit.
- `getEvents` list `:1134-1149`: `where: APPROVED`, `sort:["startAt","id"]` (`startAt` is `required`, `payload/collections/events.ts:89`; ASC is NULLS LAST anyway), `limit: filter.limit ?? 50`, `depth:1`, `select` = the eleven keys of `eventListProjection` `:1080-1095`.
- `findTemplateRows`/`fetchDynamicCaseStudies`: same shape as `getDynamicContent` featured-then-fill; `select` = `templateCaseStudyProjection` `:1362-1387` keys.
- `getForYouCandidates`: the union sort must stay in JS (three collections), but each arm can be `sort:["-publishedAt","id"], limit: input.limit` (the global top-N is contained in the union of the per-arm top-N), and `select:{title:true,slug:true,region:true,relatedCommunity:true,tags:true,publishedAt:true,createdAt:true}` at depth 1 — today it is depth 1 with no `select`, so lived-experience/case-study bodies come along.

(b) `unionDate` `:740` is `coalesce(publishedAt, publishDate, _createdAt)`; only the `publishedAt exists:false` fill (two-step, §1b) reproduces it if an undated row ever appears (0 today). Replace `publishedByNow()` `:790-792` with a minute-truncated instant (§0).

---

## 3. `page-feeds.ts` — regional community and homepage feeds

(a)
- `regionalCommunityCaseStudies` `:359-382`: keep `where`; `sort:["-featured","-publishedAt","id"]`, `limit`, `depth:1`, `select` = `caseStudyCard` `:384-412` keys (`title, subtitle?, excerpt, featured, publishedAt, slug, moderationStatus, image, authors, studyPeriod`; `organizations/tags/relatedCommunities` are emitted as `nulledList` so only their *count* is needed — `select` them but `populate` nothing). Better: replace the `communityId(slug)` pre-read `:263-274` with `{"relatedCommunity.slug":{equals:slug}}`; the result is identical (a missing community matches nothing) and saves a round trip.
- `regionalCommunityLivedExperiences` `:444-468`: `sort:["-featured","-publishedAt","id"]`, `limit`, select = `livedExperienceCard` keys. The `or(region, relatedCommunity)` keeps needing the id (both are relationships; `"region.slug"` would also work as a join).
- `newsUnion` `:529-552`: per arm `sort:["-featured","-publishedAt","id"]` (or `["-publishedAt","id"]` for `homepageNews`), `limit`, then merge+sort+slice in JS — exact because top-N of a union ⊆ union of top-Ns. `external_sources` has 1 row.
- `homepageAgendas` `:606-634`: `sort:["-publishDate","id"]`, `limit`, `select` = `AGENDA_FIELDS` keys (`outputs.ts:442-461`).

(b) **Latent divergence worth flagging:** `byFeaturedThenDate`/`byDate` `:241-260` use `localeCompare` (ICU collation), not code-point `<`. With mixed-case ids (34/35 lived experiences) an ICU tie-break orders `a` before `B`; Sanity and every other Payload reader put `B` before `a`. SQL `ORDER BY id` under C collation *fixes* this, so expect parity diffs here to be improvements, and record them as such rather than as regressions.

---

## 4. `news.ts` — 4 rows, but currently uncached (the `now()` key)

(a) `listNewsPosts` `:600-616`: `sort: opts.featuredFirst ? ["-featured","-publishedAt","id"] : ["-publishedAt","id"]` (the `language` term at `:580-585` is constant-false and contributes nothing — drop), `limit: opts.limit` **only when `searchPattern` is absent**; with a search pattern keep `pagination:false` and the JS `matchesSearch` (GROQ `match` is token/glob based, `:265-306`; `like`'s per-word `ILIKE` is close but not the same — not worth the parity risk on 4 rows). `select` = `newsPostProjection` `:497-522` keys minus `content`: `{title,subtitle,excerpt,slug,publishedAt,sanityUpdatedAt,featured,image,author,organizations,locationDetails,tags,relatedCommunity}`; `depth:2` stays (author→image is the second hop, `:525-527`) or `depth:1` + `populate.authors:{name:true,image:true,…}`. `getDynamicNews.fetchRows` `:980-992` (dead): `sort:["-publishedAt","id"], limit`.

(b) Nothing else is unpushable. The real fix is `publishedByNow()` `:536-538` → truncate to the minute so the descriptor (and cache key) is stable within a revalidate window.

---

## 5. `outputs.ts` — agendas (29, files array at depth 2) and research outputs (29)

(a)
- `allAgendas` `:488-501` (`getAgendas` returns all 29, no slice): `sort:["-publishDate","id"]` (`publishDate` is `required`, `payload/collections/agendas.ts:101`, 0 NULL), no `limit`, `select` = `agendaProjection` keys (no rich text on agendas; `files[]` upload rows are small). Exact; `byDateThenId` `:212-224` goes.
- `getAgendasByRegion.page` `:531-560`: `sort:["-publishDate","id"]`, `limit: take`.
- `getResearchOutputs` `:812-838` — GROQ `order(coalesce(publishDate, _createdAt) desc, _id asc)`; `publishDate` is **not** `required` (`payload/collections/research-outputs.ts:226`) but 29/29 populated (probe `date_null=0`). Push `where: APPROVED, sort:["-publishDate","id"]` with the two-step fill for `publishDate exists:false` (`["-createdAt","id"]`), `select` = `researchOutputFragment` `:752-773` keys, excluding `body` (NULL on all rows but still a column read).

---

## 6. `system.ts` — already projected; push order + cap

`getFreshContentRowsForType` `:533-565` already has `select` (`selectFor` `:512-520`). Add `sort:[`-${shape.dates[0]}`,"id"]`, `limit: cap`, plus the two-step fill for rows without that date (`["-createdAt","id"]`) to keep `coalesce(…, _createdAt)`. Every `FRESH_SHAPES` entry has exactly one date arm, so the three-way coalesce is really two-way per collection. `depth:2` → `depth:1` + `populate.media:{url:true,lqip:true}` (`imageUrl`/`blurDataURL` are all it reads, `:552-553`).

---

## 7. Indexes

Add `index: true` (generates `<table>_<col>_idx`, proven by the `sanityUpdatedAt` migration) on: `caseStudies.moderationStatus`, `caseStudies.publishedAt`, `caseStudies.featured`; `newsPosts.publishedAt`, `newsPosts.featured`; `livedExperiences.moderationStatus/publishedAt/featured`; `researchOutputs.moderationStatus/publishDate`; `agendas.publishDate/featured`; `events.moderationStatus/startAt`; `externalSources.approved/featured/publishedAt`. Region relations are already indexed (`case_studies_related_community_idx`, `news_posts_related_community_idx`, `lived_experiences_region_idx`/`_related_community_idx`, `case_studies_rels_tags_id_idx`).

Compound, via the collection-level `indexes: [{ fields: [...] }]` (`CompoundIndex`, supported in 3.88): `caseStudies (moderationStatus, publishedAt, id)`, `livedExperiences (moderationStatus, publishedAt)`, `researchOutputs (moderationStatus, publishDate)`. Whether `migrate:create` emits `DESC` ordering for compound indexes I could not verify without running it; a plain ASC btree still serves `ORDER BY … DESC` via backward scan.

Honest sizing: with 25–35 rows per table the planner will seq-scan regardless; these indexes buy nothing measurable today and are for the plan at scale.

Collation pin (optional but recommended before prod): a hand-written migration `ALTER TABLE case_studies ALTER COLUMN id TYPE varchar COLLATE "C"` per content table (FK columns in `*_rels`/`payload_locked_documents_rels` would need the same treatment; not verified against Payload's snapshot diffing — if `migrate:create` later tries to revert it, fall back to the runtime assertion in §9).

---

## 8. React `cache()` on the payload-source primitives

Safe, with three rules:
1. Key on `stableKey(descriptor)` (already exists, `payload-source.ts:301-308`) plus the primitive name — never on the descriptor object (new object per call). Pattern: `const scope = cache(() => new Map<string, Promise<unknown>>())`, then `scope().get(key) ?? set(...)`. Outside a request (build, `generateStaticParams`, scripts) `cache()` yields a fresh Map per call — no memo, no crash; matches `query()`'s "never touch `draftMode()`" contract `:339-347`.
2. **Memoise `query` and `queryPreviewable` only.** `queryPreviewable` reads `draftMode()` per call `:359-366`; it is constant within a request, so memoising the whole function is safe, and it must not share a key with `query` (a draft row would leak into a `query()` caller when preview is on). **Do not memoise `queryRaw`** — it feeds find-or-create and ownership checks followed by writes in the same request (`findOrganizationByName`, `findOwnedDraftId`, header table §8). Leave `queryLive` alone too (moderation gates).
3. `publishedByNow()` must be made stable first (§0) or those descriptors never dedupe.

Duplicate reads per render it removes (verified call graphs): case-studies list page — `publishedCaseStudyReferences()` ×2 (filter tags + communities, `:1066-1069, 1087-1096`) and, on the map view with a region chip, `getFilteredCaseStudies` ×2 (identical descriptor **today**; after push-down they differ and no longer dedupe); regional community page — `communityId(slug)` ×3 (case studies, lived experiences, news feeds; `getAgendasByRegion`'s lookup differs by `locale` so it does not join them); `getApprovedCaseStudies`+`getFeaturedCaseStudies` share `allApproved()` (dead callers). Because `unstable_cache` is skipped in draft mode and does not dedupe concurrent misses, these are real DB reads in preview and on every cold hour.

---

## 9. Parity strategy (read-only on the dev DB)

1. **Unit suites** (`lib/__tests__/content-{case-studies,news,outputs,discovery,system}.test.ts`, 36 descriptor-style assertions already, e.g. `content-news.test.ts:905` `expect.objectContaining({ sort: "id", … })`). After push-down the reader trusts DB order, so tests that feed an unsorted fixture and expect a sorted result (e.g. `content-discovery.test.ts:1157`) must flip to asserting the descriptor: exact `where`, `sort` array, `limit`, `select` keys. Add one test per reader that the `select` contains every key its projection reads (derive from the projection helper) and never `content`/`body`.
2. **Ordering oracle script** `scripts/parity/order-check.ts` (tsx, `PAYLOAD_DATABASE_URL` from `.env.local`, `BEGIN READ ONLY`): for each reader in this document run (i) the legacy path — `payload.find({where, pagination:false})` + the module's current JS comparator, (ii) the new descriptor, (iii) raw SQL `array_agg(id ORDER BY <date> DESC, id COLLATE "C") FILTER (…)`; assert all three id sequences are identical. Preconditions asserted and printed: `datcollate = 'C.UTF-8'`, `count(featured IS NULL)=0`, `count(<date> IS NULL)=0` among rows each `where` admits, plus a known-nonzero control count (the repo's own rule, memory "Sanity unauth = silent zero"). Run it **before** the change (i vs iii proves the JS order equals SQL order on today's data) and **after** (ii vs iii). The three probe results above are that baseline for case studies: all `same:true`.
3. **Rendered parity**: `scripts/parity/render-diff.ts --domain case-studies|news|pages|discovery` unchanged; expect zero DOM diff, and expect flight-payload diffs only where §3(b)'s `localeCompare` bug is corrected.
4. **Runtime guard** until prod collation is verified: a one-time `SELECT datcollate` at Payload init (or in `scripts/payload-moderation-live-check.ts`) that logs loudly if not `C`; ship push-down under the existing `CONTENT_BACKEND_<DOMAIN>` flags so one domain can revert.

Not verified: production database collation (no URL in the repo env); `"authors.userId"` array-path `where` (inferred from adapter source, not executed); `migrate:create` output for compound indexes; ILIKE case folding beyond `É`/ASCII.