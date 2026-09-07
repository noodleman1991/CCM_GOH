/**
 * The Payload half of `lib/content/onboarding.ts`.
 *
 * Three answers, three unchanged shapes. `onboarding.ts` picks between this
 * file and its own GROQ through `activeBackend("onboarding")`; the `safe()`
 * wrapper on the community picker and the deliberate *absence* of one on the
 * other two both stay in the domain module, so a failure degrades — or keeps
 * throwing — in exactly the same place on either backend.
 *
 * ---------------------------------------------------------------------------
 * One object, six globals
 * ---------------------------------------------------------------------------
 *
 * `onboardingContent` was one Sanity document per language and is six Payload
 * globals. That split is not a modelling preference: flattened, the copy is
 * 194 localized columns, and Payload's Postgres adapter reads a localized
 * table through `json_agg(json_build_array(<every column>))`, which Postgres
 * refuses past 100 arguments (`FUNC_MAX_ARGS`, a compile-time constant).
 * Every `findGlobal` on the single global failed with SQLSTATE 54023. The copy
 * is therefore split along the flow's own steps — see
 * `payload/globals/onboarding-content.ts`.
 *
 * The merge back is **imported, not rewritten**: `composeOnboardingContent` is
 * declared beside the globals it merges, so a step that gains a field cannot
 * drift from the function that composes it. It is a deep merge rather than an
 * `Object.assign` because `fieldLabels` and `validationMessages` are declared
 * on several parts at once (`fieldLabels.basicInfo` on step 1,
 * `fieldLabels.workInfo` on step 2, …); every other key comes from exactly one
 * part, so for those the merge is an assignment.
 *
 * ---------------------------------------------------------------------------
 * Four differences against the Sanity read, each measured
 * ---------------------------------------------------------------------------
 *
 * **1. The locale fallback is per field instead of per document.** GROQ's
 * `coalesce(*[…language == $locale][0], *[…language == "en"][0])` picks a whole
 * document: ask for `ar`, get the Arabic document, or the English one if no
 * Arabic document exists. Payload holds ONE localized document, so the read
 * names a locale and Payload's own `fallback: true` (payload.config.ts) fills
 * each unset field from `en`. On this dataset the two agree exactly — all four
 * language documents exist (measured against `production_2`, control
 * `count(*[_type=="agenda"])` = 29: `onboardingContent` = 4, languages
 * `ar/en/es/fr`) — so the coalesce never fires today and the difference is only
 * in what would happen if a translation were deleted: Sanity would fall back
 * whole, Payload falls back field by field. The finer behaviour is Payload's,
 * and it is not reachable from the current data.
 *
 * **2. Four housekeeping keys are dropped.** `findGlobal` returns `id`,
 * `globalType`, `createdAt` and `updatedAt` beside the content. None is part of
 * the `OnboardingContent` contract, and each of the six globals carries its own
 * — merged, they would silently mean "the sixth global's row id", which is not
 * a fact about anything. They are removed at the top level only; an array row's
 * own `id` is left alone, because that is Payload's equivalent of the `_key`
 * Sanity already returns on every `welcomeFeatures` row today.
 *
 * **3. `_id` and `_rev` are not answered, and `language` is the requested
 * locale.** There is no single `_id` across six globals and Payload has no
 * `_rev` at all (the plan lists `onboarding._rev` among the four things
 * genuinely unanswerable from Payload). All three are optional on
 * `OnboardingContent`, and **no consumer reads any of them** — grepped across
 * `app/[locale]/onboarding`, `components/onboarding` and the two API routes.
 * `language` is still filled, with the locale that was asked for, because that
 * is what it means after the fallback above.
 *
 * **4. An unset field is `null` here and absent there.** Sanity omits a key it
 * has no value for; Payload returns the declared shape with `null` leaves. Both
 * are falsy, and every one of the 135 consumer reads is
 * `content?.x?.y || t("…")`, so nothing renders differently. It is visible in
 * `/api/onboarding/content`'s JSON body and nowhere else.
 *
 * ---------------------------------------------------------------------------
 * The stored Sanity copy has drifted, and the drift is dead
 * ---------------------------------------------------------------------------
 *
 * Measured leaf by leaf against `production_2`'s English document: it populates
 * 104 leaves, the six globals populate 66, and **every one of the 38 that
 * Payload does not carry is read by nothing**. They fall into three groups:
 *
 *   - Six fields that hold a *scalar* where the schema declares a container
 *     (`basicInfoFieldHints`, `workInfoFieldHints`, `recentWorkFieldHints`,
 *     `privacyFieldHints`, `visibilityOptions`, `welcomeSteps`). A string has no
 *     `.usernameHint`, so those reads have always been `undefined`. Phase 2
 *     deliberately kept the declared container shape rather than modelling the
 *     drift; this reader does not re-open that.
 *   - Keys under a container that the components never ask for
 *     (`navigationTexts.{finish,next,previous,skip}` — zero readers repo-wide;
 *     `fieldLabels.basicInfo.{displayName,email,location,website}`;
 *     `privacyFieldLabels.{contactable,searchable,showOrganization}`;
 *     `visibilityLabels.connections`; and the flat
 *     `validationMessages.{required,emailInvalid,…}`, which the wizard reads as
 *     `validationMessages.basicInfo.firstName`, i.e. one level deeper than
 *     Sanity stores it).
 *   - Names the components read under a different spelling than Sanity stores
 *     (`fieldLabels.recentWork.{title,link,isOngoing}` against the read
 *     `{workTitle,projectLink,ongoingProject}`).
 *
 * Turned around: for every path a component actually reads, **the two backends
 * resolve to the same string or both resolve to nothing**. The copy users see
 * comes overwhelmingly from `messages/*.json`, and this swap does not move it.
 *
 * `components/onboarding/types.ts` also declares `fieldPlaceholders`,
 * `privacyFieldLabels` and `reviewFieldLabels` as optional keys backing 46 read
 * chains. Two of those three exist; `fieldPlaceholders` and `reviewFieldLabels`
 * are held by neither store and never were — dead on arrival, not a regression
 * this swap introduces. Phase-2 obligation 8 settles them: neither served nor
 * deleted here, recorded for Phase 4's cleanup.
 */
import "server-only";
import type { GlobalSlug } from "payload";
import { query, queryPreviewable } from "@/lib/content/internal/payload-source";
import { ONBOARDING_GLOBAL_SLUGS, composeOnboardingContent } from "@/payload/globals/onboarding-content";
import type {
  OnboardingContent,
  OnboardingRegionalCommunity,
  ProfilePrompt,
} from "@/lib/content/onboarding";
import type { Locale, Localized } from "@/lib/content/types";

/** Payload's own bookkeeping on a `findGlobal` result — see note 2 above. */
const HOUSEKEEPING = new Set(["id", "globalType", "createdAt", "updatedAt"]);

function withoutHousekeeping(part: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!part) return null;
  return Object.fromEntries(Object.entries(part).filter(([key]) => !HOUSEKEEPING.has(key)));
}

/**
 * Does this tree hold a single authored value?
 *
 * A Payload global always answers, even when nobody has ever saved it, so
 * "there is no content" cannot be expressed as a missing document the way
 * `coalesce(…)[0]` expresses it. Without this, an unconfigured Payload would
 * hand back a hollow object of nulls where Sanity hands back `null` — and both
 * `app/api/onboarding/content/route.ts` (`data ?? null`) and
 * `welcome-panel.tsx`'s `hasSanityContent` guard are written for the `null`.
 *
 * It never fires on the real data: 66 leaves are populated in `en` alone.
 */
function hasAnyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.some(hasAnyValue);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(hasAnyValue);
  return true;
}

/**
 * The whole onboarding copy for one locale.
 *
 * `query`, not `queryPreviewable` — the Sanity twin calls `query()`, which
 * pins the published perspective, because both original call sites used
 * `client.fetch` directly. Widening this to drafts would be the mirror image of
 * the six Phase-1 bugs that silently narrowed a preview-aware read.
 *
 * The six reads are issued together rather than in sequence: they are
 * independent, each is separately cached by `query()`, and six serial round
 * trips would make a page that used to cost one read cost six.
 */
export async function getOnboardingContent(locale: Locale): Promise<OnboardingContent | null> {
  const parts = await Promise.all(
    ONBOARDING_GLOBAL_SLUGS.map((slug) =>
      query<Record<string, unknown> | null>({
        type: "global",
        slug: slug as GlobalSlug,
        locale,
        // Nothing in these six globals is a relationship or an upload; the
        // whole payload is text, groups of text, and two arrays of text.
        depth: 0,
      }),
    ),
  );

  const composed = composeOnboardingContent(parts.map(withoutHousekeeping));
  if (!hasAnyValue(composed)) return null;

  return { ...composed, language: locale } as OnboardingContent;
}

interface RawProfilePrompt {
  id?: unknown;
  prompt?: Localized | null;
  category?: string | null;
}

/**
 * The active prompt library, in editorial order.
 *
 * `queryPreviewable`, not `query` — and this is the one primitive choice here
 * that is easy to get wrong. The Sanity original called `sanityFetch` with only
 * a query and no `perspective`/`stega`, so it fell through to `cachedFetch`'s
 * own `draftMode()` check; converting it to `query()` would silently end draft
 * preview for profile prompts in the Presentation tool. `profilePrompts` has no
 * `versions.drafts` in Payload today, so in draft mode the two differ only by
 * the cache — but the distinction is the contract, not the current schema, and
 * a collection that later gains drafts must not need this line revisited.
 *
 * `pagination: false` because GROQ returns every match and Payload's `find`
 * otherwise stops at ten. `sort: "orderRank"` reproduces `order(orderRank asc)`
 * — verified to return the identical three ids in the identical order on both
 * stores (`climate-personal, proud-project, collaborate`).
 */
export async function getActiveProfilePrompts(): Promise<ProfilePrompt[]> {
  const result = await queryPreviewable<{ docs: RawProfilePrompt[] } | null>({
    type: "find",
    collection: "profilePrompts",
    where: { active: { equals: true } },
    sort: "orderRank",
    pagination: false,
    // `prompt` is `Localized`, i.e. all four locales at once — which is what
    // the Sanity projection's bare `prompt` returns and what the picker sends
    // to the browser to render in whichever locale it is showing.
    locale: "all",
    depth: 0,
  });

  return (result?.docs ?? []).map((doc) => ({
    id: String(doc.id),
    prompt: doc.prompt ?? {},
    category: doc.category ?? undefined,
  }));
}

interface RawRegionalCommunity {
  id?: unknown;
  slug?: string | null;
  name?: Localized | null;
  active?: boolean | null;
}

/**
 * The seven regional communities the onboarding picker offers.
 *
 * The third differently-shaped "regional communities" reader in `lib/content/`,
 * and deliberately so: `news.ts` owns one for the news filter (all communities,
 * ordered by `order asc, name.en asc`, with a `newsCount`) and
 * `lived-experiences.ts` owns another for the submit form (active only, ordered
 * by `name.en asc`). Neither matches this call site's filter, order and field
 * set. That distinction survives the swap unchanged.
 *
 * `query`, matching the Sanity twin's `client.fetch`. Ordering verified against
 * both stores: `sort: "orderRank"` returns the same seven slugs in the same
 * order as GROQ's `order(orderRank)`.
 */
export async function getOnboardingCommunities(): Promise<OnboardingRegionalCommunity[]> {
  const result = await query<{ docs: RawRegionalCommunity[] } | null>({
    type: "find",
    collection: "regionalCommunities",
    where: { active: { equals: true } },
    sort: "orderRank",
    pagination: false,
    // `name` is `Localized` — the Sanity projection asks for `name{en,es,fr,ar}`
    // explicitly and those are exactly the four locales `payload.config.ts`
    // declares, so `"all"` is the same four keys.
    locale: "all",
    // Depth 0 leaves `coverImage`, `members` and `contact` as bare ids. The
    // Sanity projection does not read them either; populating them would cost
    // three joins per row to build a field nobody returns.
    depth: 0,
  });

  return (result?.docs ?? []).map((doc) => ({
    id: String(doc.id),
    slug: doc.slug ?? "",
    name: doc.name ?? {},
    active: Boolean(doc.active),
  }));
}
