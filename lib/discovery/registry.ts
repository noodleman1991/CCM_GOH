/**
 * Content-type-aware discovery registry. Declares, per content type, which
 * filterable facets + sort options it supports, whether it shows the time-frame
 * pills, and where its data comes from. The single <DiscoveryBar> reads this so
 * every list page shares one behaviour but shows only the facets that type
 * actually supports ("sensitive to content type").
 *
 * Pure data — no server deps, unit-testable.
 */

export type DiscoveryType =
  | "caseStudy"
  | "newsPost"
  | "livedExperience"
  | "agenda"
  | "report"
  | "user";

export type SortId = "relevance" | "newest" | "oldest" | "az" | "region";

/** Where a facet's options come from. */
export type FacetSource = "taxonomy" | "enum" | "algolia" | "static";

export type FacetDef = {
  /** URL/state key, e.g. "region", "tags", "workType". */
  id: string;
  /** i18n key (under the `discovery` namespace) for the group legend. */
  legendKey: string;
  source: FacetSource;
  /** Taxonomy / enum name used to resolve the (localized) option labels. */
  optionsKey?: string;
  /** Multi-select pills (default true). */
  multi?: boolean;
};

export type SortDef = { id: SortId; labelKey: string };

export type DiscoveryConfig = {
  type: DiscoveryType;
  facets: FacetDef[];
  sorts: SortDef[];
  defaultSort: SortId;
  /** Show the Any-time / Past-year / 3y / 5y pills. */
  timeFrame: boolean;
  dataSource: "sanity" | "algolia" | "prisma";
};

const SORTS: Record<SortId, SortDef> = {
  relevance: { id: "relevance", labelKey: "sort.relevance" },
  newest: { id: "newest", labelKey: "sort.newest" },
  oldest: { id: "oldest", labelKey: "sort.oldest" },
  az: { id: "az", labelKey: "sort.az" },
  region: { id: "region", labelKey: "sort.region" },
};

const f = (id: string, legendKey: string, source: FacetSource, optionsKey?: string): FacetDef => ({
  id,
  legendKey,
  source,
  optionsKey,
  multi: true,
});

export const DISCOVERY_REGISTRY: Record<DiscoveryType, DiscoveryConfig> = {
  caseStudy: {
    type: "caseStudy",
    facets: [
      f("region", "facet.region", "taxonomy", "regionalCommunity"),
      f("topic", "facet.topic", "taxonomy", "topic"),
      f("tags", "facet.tags", "taxonomy", "tag"),
      f("language", "facet.language", "static"),
    ],
    sorts: [SORTS.relevance, SORTS.newest, SORTS.oldest, SORTS.region, SORTS.az],
    defaultSort: "newest",
    timeFrame: true,
    dataSource: "sanity",
  },
  newsPost: {
    type: "newsPost",
    facets: [
      f("source", "facet.source", "static"), // site vs external
      f("region", "facet.region", "taxonomy", "regionalCommunity"),
      f("tags", "facet.tags", "taxonomy", "tag"),
    ],
    sorts: [SORTS.newest, SORTS.oldest, SORTS.relevance],
    defaultSort: "newest",
    timeFrame: true,
    dataSource: "sanity",
  },
  livedExperience: {
    type: "livedExperience",
    facets: [
      f("region", "facet.region", "taxonomy", "regionalCommunity"),
      f("tags", "facet.tags", "taxonomy", "tag"),
    ],
    sorts: [SORTS.newest, SORTS.region],
    defaultSort: "newest",
    timeFrame: false,
    dataSource: "sanity",
  },
  agenda: {
    type: "agenda",
    facets: [
      f("language", "facet.language", "static"),
      f("agendaType", "facet.agendaType", "enum", "agendaType"),
    ],
    sorts: [SORTS.newest, SORTS.az],
    defaultSort: "newest",
    timeFrame: true,
    dataSource: "sanity",
  },
  report: {
    type: "report",
    facets: [f("language", "facet.language", "static")],
    sorts: [SORTS.newest, SORTS.az],
    defaultSort: "newest",
    timeFrame: true,
    dataSource: "sanity",
  },
  user: {
    type: "user",
    facets: [
      f("region", "facet.region", "algolia"),
      f("workType", "facet.workType", "enum", "workType"),
      f("expertise", "facet.expertise", "enum", "expertise"),
      f("openToTalk", "facet.openToTalk", "static"),
    ],
    sorts: [SORTS.relevance, SORTS.newest, SORTS.az],
    defaultSort: "relevance",
    timeFrame: false,
    dataSource: "algolia",
  },
};

export function getDiscoveryConfig(type: DiscoveryType): DiscoveryConfig {
  return DISCOVERY_REGISTRY[type];
}
