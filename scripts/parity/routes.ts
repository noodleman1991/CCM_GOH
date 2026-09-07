/**
 * The routes the Phase-3 parity harness renders on both backends.
 *
 * One representative route per `lib/content/` domain, chosen for **structure**
 * rather than convenience: the point of each entry is the shape it forces the
 * reader to reproduce — a parameterised grid, a fixed slot list, a rich-text
 * body with footnotes — not that it happens to load. A route that renders a
 * title and three cards proves almost nothing about the module behind it.
 *
 * Slugs are real documents in the development dataset, verified 200 on
 * 2026-09-05. They are pinned rather than discovered at run time on purpose:
 * a harness that picks "the first case study" compares a different document
 * every time content changes, and a diff that moves cannot be trusted.
 *
 * `domain` names the `lib/content/` module the route is here to exercise, so
 * Tasks 6–14 can render only what their own swap touches
 * (`routesForDomain("news")`).
 */

export interface ParityRoute {
  /** Locale-prefixed, exactly as requested. `/` 307s to `/en`; the harness
   *  does not follow redirects, so every path names its locale. */
  path: string;
  /** The `lib/content/` module this route is the checkpoint for. */
  domain: string;
  /** Why this route and not another one from the same domain. */
  why: string;
}

export const PARITY_ROUTES: ParityRoute[] = [
  {
    path: "/en",
    domain: "pages",
    why:
      "The homepage, and the reason Task 14d exists: eleven fixed slots that " +
      "Payload models one at a time. Any slot that silently empties shows up " +
      "here as a missing section and nowhere else.",
  },
  {
    path: "/en/communities/central-and-southern-asia",
    domain: "pages",
    why:
      "regionalCommunityPage — six grid slots collapsed into one parameterised " +
      "`contentGrid` in Payload, discriminated by `contentGrid.contentType`. " +
      "The remodel is lossless only if all six slots come back in order, which " +
      "is exactly what this route's HTML says.",
  },
  {
    path:
      "/en/research-and-action/case-studies/" +
      "japan-s-shinrin-yoku-forest-bathing-as-a-mental-health-intervention-in-an-era-of-climate-change",
    domain: "case-studies",
    why:
      "The longest case-study body in the dataset (60 blocks), and the module " +
      "that maps Payload's `moderationStatus` back onto the public `status`. " +
      "No case study in the development dataset carries an `embed` block — " +
      "measured, `count(content[_type in [\"embed\",\"videoEmbed\",\"youtube\"]])` is 0 " +
      "on every one — so 'a case study with embeds' is not available to pin; " +
      "this is the richest body there is. Revisit if an embedded case study lands.",
  },
  {
    path: "/en/lived-experiences/lived-experience-3VTei68Svww",
    domain: "lived-experiences",
    why:
      "A published, approved lived experience carrying a `videoLink` — the field " +
      "that is real in the data and undeclared in the Sanity schema (Phase-2 " +
      "obligation 10). Also exercises the unset-means-approved moderation rule.",
  },
  {
    path: "/en/lived-experiences",
    domain: "lived-experiences",
    why:
      "The index, and the only surface `getLivedExperienceIndex` has. It is the " +
      "route that exercises all three of that read's sub-queries at once — the " +
      "35 videos, the seven communities and the tags any of them use — and it " +
      "hands every one of them to a client component, so the whole result also " +
      "travels through the RSC flight payload. `rawRegion` and `ContentTag.value` " +
      "are visible nowhere else.",
  },
  {
    path: "/es/lived-experiences",
    domain: "lived-experiences",
    why: "es. The same index, so a locale difference cannot hide behind a structural one.",
  },
  {
    path: "/fr/lived-experiences",
    domain: "lived-experiences",
    why: "fr, same index — three locales on one route, so a translation-fallback regression shows up as a difference between locales rather than between pages.",
  },
  {
    path: "/ar/lived-experiences",
    domain: "lived-experiences",
    why:
      "ar, same index — the RTL locale, where `dir` and the logical start/end " +
      "utility classes are part of the rendered output being compared.",
  },
  {
    path: "/es/lived-experiences/lived-experience-3VTei68Svww",
    domain: "lived-experiences",
    why:
      "es. The detail page reads every localized field through " +
      "`getLocalizedValue`, and this document populates only `en` — so this is " +
      "where a locale-fallback difference between the two stores would show.",
  },
  {
    path: "/fr/lived-experiences/lived-experience-3VTei68Svww",
    domain: "lived-experiences",
    why: "fr, same detail page — the third locale on the same document, for the same reason the index carries three.",
  },
  {
    path: "/ar/lived-experiences/lived-experience-3VTei68Svww",
    domain: "lived-experiences",
    why: "ar, same detail page, and the RTL locale — `dir` and the logical start/end utility classes are part of the compared output.",
  },
  {
    path: "/en/reader/background-context",
    domain: "system",
    why:
      "A docsChapter with everything the Lexical conversion can lose: h2 and h4 " +
      "headings (and therefore the minted `${slug}-${_key}` anchors of obligation 7), " +
      "list items, 15 link marks, an inline image, and a rendered footnotes " +
      "section. `getDocsChapters`/`getDocsChapter` live in system.ts.",
  },
  {
    path: "/en/news/cop28-centring-mental-health",
    domain: "news",
    why:
      "A single news post — body rich text, author and date. Also the only " +
      "route in the set that renders `article:published_time` and " +
      "`article:modified_time` from a raw date string, which is where the two " +
      "stores' ISO spellings would diverge if the reader did not reconcile them.",
  },
  {
    path: "/es/news/cop28-centring-mental-health",
    domain: "news",
    why:
      "es. The detail page reads every localized field through " +
      "`getLocalizedValue`, and this document populates only `en` — so this is " +
      "where a locale-fallback difference between the two stores would show.",
  },
  {
    path: "/fr/news/cop28-centring-mental-health",
    domain: "news",
    why: "fr, same document — the third locale, so a fallback regression shows as a difference between locales rather than between pages.",
  },
  {
    path: "/ar/news/cop28-centring-mental-health",
    domain: "news",
    why: "ar, same document, and the RTL locale — `dir` and the logical start/end utility classes are part of the compared output.",
  },
  {
    path: "/en/news",
    domain: "news",
    why:
      "The news index: a featured selection, a regular listing and the merged " +
      "external-source feed, i.e. three different queries over two collections. " +
      "A reader that gets ordering or the featured filter wrong renders the " +
      "same cards in the wrong section. It is also the only news route with a " +
      "CLIENT component — `NewsFilters` — so `getNewsTags`'s and " +
      "`getRegionalCommunities`'s localized `label`/`name` objects travel " +
      "through the RSC flight payload here and nowhere else. That is exactly " +
      "the surface the shared locale-key sort was extracted for.",
  },
  {
    path: "/es/news",
    domain: "news",
    why: "es. The same index, so a locale difference cannot hide behind a structural one.",
  },
  {
    path: "/fr/news",
    domain: "news",
    why: "fr, same index — the third locale on the same three queries, so a translation-fallback regression shows as a difference between locales rather than between pages.",
  },
  {
    path: "/ar/news",
    domain: "news",
    why: "ar, same index — the RTL locale, and the one where a mis-sorted Arabic tag label would show.",
  },
  {
    path: "/en/research-and-action/regional-agendas",
    domain: "outputs",
    why:
      "The agenda index. 29 agendas is the dataset's known-nonzero control, so " +
      "an empty listing here is unmistakable rather than plausible.",
  },
  {
    path: "/es/communities/central-and-southern-asia",
    domain: "pages",
    why: "es. The same regional page, so a locale difference cannot hide behind a structural one.",
  },
  {
    path: "/fr/communities/central-and-southern-asia",
    domain: "pages",
    why:
      "fr, same page — three locales on one route so a translation-fallback " +
      "regression shows up as a difference between locales, not between pages.",
  },
  {
    path: "/ar/communities/central-and-southern-asia",
    domain: "pages",
    why:
      "ar, same page — and the RTL locale, where `dir` and the logical " +
      "start/end utility classes are part of the rendered output being compared.",
  },
];

/**
 * Routes deliberately kept out of the rendered set, and why.
 *
 * These are not oversights. Each is written down so a later task does not
 * "helpfully" add one back and then spend an afternoon on a timeout.
 */
export const EXCLUDED_ROUTES: { path: string; reason: string }[] = [
  {
    path: "/en/atlas",
    reason:
      "Its server render's Sanity fetch times out at over 120 s on ESOCKETTIMEDOUT " +
      "in local dev — a recorded, reproduced issue (2026-07-17) whose APIs are " +
      "meanwhile fine. Including it would turn every parity run into a two-minute " +
      "hang ending in a failure that says nothing about parity. Atlas changes are " +
      "verified through its API routes instead.",
  },
  {
    path: "/en/search",
    reason:
      "Search renders from Algolia, not from lib/content, and the public search " +
      "key currently 403s on every index. Nothing about a content-backend swap " +
      "is observable here.",
  },
  {
    path: "/en/dashboard",
    reason:
      "Clerk-gated. Rendered signed-out it is a redirect, and rendered signed-in " +
      "it depends on Prisma rather than the content backend.",
  },
];

/** The routes belonging to one `lib/content/` module. */
export function routesForDomain(domain: string): ParityRoute[] {
  return PARITY_ROUTES.filter((route) => route.domain === domain);
}

/** Every domain the route list covers, in first-appearance order. */
export function coveredDomains(): string[] {
  return [...new Set(PARITY_ROUTES.map((r) => r.domain))];
}
