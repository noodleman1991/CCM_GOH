import "server-only";

/**
 * The page domain's public surface: generic pages, regional community pages,
 * the homepage, and the four feeds those pages read.
 *
 * This file was 8,550 lines — more than half of `lib/content/` — because the
 * four document queries carried every block projection expanded inline, and
 * the two homepage queries carried the same eleven fixed slots as each other,
 * character for character. Task 14a split it by **document type**, restored
 * the block projections as the fragments they were before `fc7bc7c40` deleted
 * `sanity/queries/**`, and left this file as a barrel so that **no caller
 * changed**: the same 17 functions and 12 exported types, with the same names
 * and the same signatures.
 *
 *   ./shared.ts               types and the slug-row mapper used by more than
 *                             one document module
 *   ./fragments/*.ts          the block projections, one file per block family
 *   ./page.ts                 `page` documents
 *   ./regional-community.ts   `regionalCommunityPage` documents, and the
 *                             region hero's live counts
 *   ./homepage.ts             `homepage` documents (both query variants)
 *   ./feeds.ts                the feeds those pages read: a community's team,
 *                             case studies, lived experiences and news, and
 *                             the homepage's news and agenda modules
 *
 * Nothing else is re-exported. The GROQ constants, the raw row shapes and the
 * block fragments were private to this module before the split and stay
 * private to the package after it; Tasks 14b–14d swap the readers behind these
 * same signatures.
 */

export type { ContentBlock, PageTranslation } from "./pages/shared";

export { getPageBySlug, getPageSlugs, getPageTranslations } from "./pages/page";
export type { Page } from "./pages/page";

export {
  getRegionStats,
  getRegionalCommunityPage,
  getRegionalCommunityPageSlugs,
} from "./pages/regional-community";
export type { RegionStats, RegionalCommunityPage } from "./pages/regional-community";

export {
  getHomepage,
  getHomepageBySlug,
  getHomepageSlugs,
  getHomepageTranslations,
  getIndexHomepage,
} from "./pages/homepage";
export type { Homepage } from "./pages/homepage";

export {
  getHomepageAgendas,
  getHomepageNews,
  getRegionalCommunityCaseStudiesBySlug,
  getRegionalCommunityLivedExperiencesBySlug,
  getRegionalCommunityNewsBySlug,
  getRegionalCommunityTeamMembers,
} from "./pages/feeds";
export type {
  HomepageDynamicAgendaItem,
  HomepageDynamicNewsItem,
  RegionalCommunityCaseStudyItem,
  RegionalCommunityLivedExperienceItem,
  RegionalCommunityNewsItem,
  RegionalCommunityTeamMember,
} from "./pages/feeds";
