import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import { safe } from "@/lib/content/internal/safe";
import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import {
  getActiveProfilePrompts as payloadGetActiveProfilePrompts,
  getOnboardingCommunities as payloadGetOnboardingCommunities,
  getOnboardingContent as payloadGetOnboardingContent,
} from "@/lib/content/internal/payload/onboarding";
import type { Localized } from "@/lib/content/types";
import type { Locale } from "@/lib/content/types";

// ---------------------------------------------------------------------------
// Onboarding content (app/[locale]/onboarding/page.tsx,
// app/api/onboarding/content/route.ts) — moved from
// sanity/queries/onboarding-content.ts's onboardingContentQueryWithFallback.
// Both call sites used `client.fetch` directly → query() (forces published).
//
// A large flat bag of localized UI copy — field labels, hints, validation
// messages — driving the whole onboarding flow in four locales. Typed
// loosely (every field optional, no Sanity types) since a dropped field
// should surface as a blank label, not a crash.
//
// Failure behaviour differs by call site and is deliberately NOT baked in
// here — this function throws through on failure, matching page.tsx (no
// try/catch around the original read):
//   - page.tsx has no try/catch around this read at all — a failure must
//     keep throwing through to Next's error boundary.
//   - the API route already wraps ITS OWN call in try/catch, degrading to
//     `{ content: null }` with a 200 — left untouched, it still gets that
//     exact behaviour from a throwing getOnboardingContent() the same way
//     it did from a throwing client.fetch().
// ---------------------------------------------------------------------------

export interface OnboardingContent {
  _id?: string;
  _rev?: string;
  language?: string;
  title?: string;

  // Welcome step
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  welcomeDescription?: string;
  welcomeFeatures?: unknown;
  welcomeSteps?: unknown;
  gettingStartedTitle?: string;
  gettingStartedDescription?: string;
  getStartedText?: string;
  timeEstimate?: string;

  // Step descriptions and field hints
  basicInfoTitle?: string;
  basicInfoDescription?: string;
  basicInfoFieldHints?: unknown;
  workInfoTitle?: string;
  workInfoDescription?: string;
  workInfoFieldHints?: unknown;
  communityInfoTitle?: string;
  communityInfoDescription?: string;
  communityInfoFieldHints?: unknown;
  recentWorkTitle?: string;
  recentWorkDescription?: string;
  recentWorkFieldHints?: unknown;

  // Privacy settings content
  privacyTitle?: string;
  privacyDescription?: string;
  searchabilityTitle?: string;
  searchabilityDescription?: string;
  searchabilityHint?: string;
  visibilityTitle?: string;
  visibilityDescription?: string;
  visibilityOptions?: unknown;
  profileInfoTitle?: string;
  profileInfoDescription?: string;
  privacyFieldHints?: unknown;

  // Review & completion content
  reviewTitle?: string;
  reviewDescription?: string;
  reviewReadyTitle?: string;
  reviewReadyDescription?: string;
  completeOnboardingText?: string;

  // Redirect dialog content
  redirectDialogTitle?: string;
  redirectDialogMessage?: string;
  proceedToOnboardingText?: string;
  continueToHubText?: string;
  oneTimeWaiverText?: string;

  // Navigation texts
  navigationTexts?: unknown;

  // Validation messages
  validationMessages?: unknown;

  // Field labels and placeholders
  fieldLabels?: unknown;

  // Privacy field labels
  privacyFieldLabels?: unknown;

  // Visibility options labels
  visibilityLabels?: unknown;
}

const ONBOARDING_CONTENT_QUERY_WITH_FALLBACK = `
  coalesce(
    *[_type == "onboardingContent" && language == $locale][0],
    *[_type == "onboardingContent" && language == "en"][0]
  ) {
    _id,
    _rev,
    language,
    title,

    // Welcome Step
    welcomeTitle,
    welcomeSubtitle,
    welcomeDescription,
    welcomeFeatures,
    welcomeSteps,
    gettingStartedTitle,
    gettingStartedDescription,
    getStartedText,
    timeEstimate,

    // Step Descriptions and Hints
    basicInfoTitle,
    basicInfoDescription,
    basicInfoFieldHints,
    workInfoTitle,
    workInfoDescription,
    workInfoFieldHints,
    communityInfoTitle,
    communityInfoDescription,
    communityInfoFieldHints,
    recentWorkTitle,
    recentWorkDescription,
    recentWorkFieldHints,

    // Privacy Settings
    privacyTitle,
    privacyDescription,
    searchabilityTitle,
    searchabilityDescription,
    searchabilityHint,
    visibilityTitle,
    visibilityDescription,
    visibilityOptions,
    profileInfoTitle,
    profileInfoDescription,
    privacyFieldHints,

    // Review & Submit
    reviewTitle,
    reviewDescription,
    reviewReadyTitle,
    reviewReadyDescription,
    completeOnboardingText,

    // Redirect Dialog
    redirectDialogTitle,
    redirectDialogMessage,
    proceedToOnboardingText,
    continueToHubText,
    oneTimeWaiverText,

    // Navigation Texts
    navigationTexts,

    // Validation Messages
    validationMessages,

    // Field Labels and Placeholders
    fieldLabels,

    // Privacy Field Labels
    privacyFieldLabels,

    // Visibility Options Labels
    visibilityLabels
  }
`;

export async function getOnboardingContent(locale: Locale): Promise<OnboardingContent | null> {
  // Above the read, not inside a wrapper: this function has no `safe()` on
  // either arm, so a Payload failure must reach page.tsx's error boundary
  // exactly as a Sanity one does.
  if (activeBackend("onboarding") === "payload") return payloadGetOnboardingContent(locale);
  const data = await query<OnboardingContent | null>(ONBOARDING_CONTENT_QUERY_WITH_FALLBACK, { locale });
  return data ?? null;
}

// ---------------------------------------------------------------------------
// Active profile prompts (app/api/profile/prompts/available/route.ts,
// lib/community/profile-prompts.ts) — moved from sanity/lib/fetch.ts's
// fetchActiveProfilePrompts, one of only two remaining draft-aware helpers
// (the other, fetchSiteAnnouncement, belongs to a different task). Original
// called `sanityFetch` (== cachedFetch) with ONLY `query` — no
// `perspective`/`stega` — so it falls through to cachedFetch's own
// draftMode() check → queryPreviewable(), NOT query(). Verified directly
// against `git show cd7a5413e:sanity/lib/fetch.ts`. Converting this to
// query() would silently end draft preview for profile prompts in the
// Presentation tool, exactly as happened to nine other functions before that
// regression was caught (see the Task 6/7 reports).
//
// Neither call site wraps this in try/catch, so it keeps throwing on
// failure — no safe() here either.
// ---------------------------------------------------------------------------

export interface ProfilePrompt {
  id: string;
  prompt: Localized;
  category?: string;
}

const ACTIVE_PROFILE_PROMPTS_QUERY = `
  *[_type == "profilePrompt" && active == true] | order(orderRank asc){
    "id": _id,
    prompt,
    category
  }
`;

export async function getActiveProfilePrompts(): Promise<ProfilePrompt[]> {
  if (activeBackend("onboarding") === "payload") return payloadGetActiveProfilePrompts();
  const data = await queryPreviewable<ProfilePrompt[] | null>(ACTIVE_PROFILE_PROMPTS_QUERY);
  return data || [];
}

// ---------------------------------------------------------------------------
// Onboarding community picker (app/[locale]/onboarding/page.tsx,
// app/api/communities/route.ts) — moved from
// sanity/queries/regional-communities.ts's getRegionalCommunities(). Not one
// of the brief's named helpers; found while auditing app/[locale]/onboarding
// and (per the ambiguity-resolution rule) app/api/communities — which
// duplicates page.tsx's own Sanity+Prisma merge/fallback logic almost
// verbatim, is unclaimed by any other task-*.md brief (grepped all of them),
// and its own doc comment says it exists "for onboarding".
//
// A third, differently-shaped "regional communities" function is a
// deliberate choice, not an oversight: news.ts (Task 4) already owns
// `getRegionalCommunities()` (ALL communities, no `active` filter, ordered
// by `order asc, name.en asc`, plus a `newsCount`) for the news filter
// dropdown, and lived-experiences.ts (Task 2) already owns
// `getActiveRegionalCommunities()` (active only, ordered by `name.en asc`,
// no `active` field returned) for the lived-experience submit form. Neither
// matches this call site's filter + order + field set (`active == true`,
// ordered by `orderRank`, returning `active` itself) — Task 7's regions.ts
// explicitly declined to add a third `getRegionalCommunities()` for exactly
// this reason. Named distinctly here rather than colliding with either.
//
// The original getRegionalCommunities() had its own internal try/catch
// (swallow → []), so this degrades via safe(); it called `client.fetch`
// directly → query().
// ---------------------------------------------------------------------------

export interface OnboardingRegionalCommunity {
  id: string;
  slug: string;
  name: Localized;
  active: boolean;
}

interface RawOnboardingRegionalCommunity {
  _id: string;
  slug: string;
  name: Localized;
  active: boolean;
}

const ONBOARDING_REGIONAL_COMMUNITIES_QUERY = `
  *[_type == "regionalCommunity" && active == true] | order(orderRank){
    _id,
    "slug": slug.current,
    name {
      en,
      es,
      fr,
      ar
    },
    active
  }
`;

export async function getOnboardingCommunities(): Promise<OnboardingRegionalCommunity[]> {
  return safe("onboarding-communities", [], async () => {
    // Inside `safe()`, not above it: the original getRegionalCommunities()
    // swallowed its own errors into `[]`, and both call sites then treat an
    // empty list as "the CMS has nothing" and fall back to their hardcoded
    // seven. A Payload failure has to land in the same place or one backend
    // starts throwing into a page the other degrades.
    if (activeBackend("onboarding") === "payload") return payloadGetOnboardingCommunities();
    const rows = await query<RawOnboardingRegionalCommunity[]>(ONBOARDING_REGIONAL_COMMUNITIES_QUERY);
    return (rows ?? []).map((r) => ({ id: r._id, slug: r.slug, name: r.name, active: r.active }));
  });
}
