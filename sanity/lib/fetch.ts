import { cachedFetch as sanityFetch } from "@/sanity/lib/cached-fetch";
import { SITE_ANNOUNCEMENT_QUERY } from "@/sanity/queries/site-announcement";

/** The singleton site announcement (or null). Locale-agnostic fetch; the bar
 *  component resolves the localized message itself. */
export const fetchSiteAnnouncement = async () => {
    const { data } = await sanityFetch({
        query: SITE_ANNOUNCEMENT_QUERY,
    });
    return data;
};

// The three dead re-export barrels that used to sit here (forwarding
// fetchRegionalCommunityCaseStudies(BySlug)/-News(BySlug)/-LivedExperiences(BySlug)
// from sanity/queries/regional-community-*.ts) are gone: zero consumers ever
// imported these names from "@/sanity/lib/fetch" (grepped repo-wide — Task
// 6b's report has the evidence), and their three source files are deleted as
// part of that task, having been converted into lib/content/pages.ts.
// fetchActiveProfilePrompts moved to lib/content/onboarding.ts's
// getActiveProfilePrompts (Task 8; queryPreviewable — a draft-aware helper).
// fetchDynamicCaseStudies/fetchDynamicLivedExperiences moved to
// lib/content/discovery.ts (Task 9, unchanged names; both `query` — the
// original called `cachedFetch` with an explicit `perspective: "published",
// stega: false`) — zero live importers either, kept for parity with the
// "move, don't delete" instruction rather than removed outright.
// This file's one remaining live helper is fetchSiteAnnouncement, whose
// `cachedFetch({ query })` call omits perspective/stega (a
// queryPreviewable-shaped read) — owned by Task 10, left untouched here.
