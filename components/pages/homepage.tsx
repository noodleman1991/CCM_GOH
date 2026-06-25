import Hero1 from "@/components/blocks/hero/hero-1";
import SplitRow from "@/components/blocks/split/split-row";
import GridRow from "@/components/blocks/grid/grid-row";
import Carousel2 from "@/components/blocks/carousel/carousel-2";
import Cta1 from "@/components/blocks/cta/cta-1";
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
import RegionMapBlock from "@/components/blocks/maps/region-map";
import PeopleWidget from "@/components/blocks/people/people-widget";
import Blocks from "@/components/blocks";
import { FEATURES } from "@/lib/features";
import { isRTL } from "@/i18n/i18n-helpers";
import {
  fetchHomepageAgendas,
  fetchHomepageNews,
} from "@/sanity/queries/homepage-dynamic";

interface HomepageProps {
  homepage: any;
  locale: string;
}

type DynamicMode = "dynamic-recent" | "dynamic-featured";

interface DynamicGridSection {
  mode?: DynamicMode | "manual" | null;
  maxItems?: number | null;
  columns?: any[] | null;
  [key: string]: any;
}

function isDynamicMode(mode: unknown): mode is DynamicMode {
  return mode === "dynamic-recent" || mode === "dynamic-featured";
}

/**
 * Fetch items for a dynamic grid section: featured first, fill with recent.
 * Mirrors the regional community template's featured-with-recent-fallback.
 */
async function fetchDynamicItems(
  mode: DynamicMode,
  limit: number,
  fetcher: (args: { limit: number; featured?: boolean }) => Promise<any[]>
): Promise<any[]> {
  let items: any[] =
    mode === "dynamic-featured"
      ? (await fetcher({ limit, featured: true })) || []
      : (await fetcher({ limit, featured: false })) || [];

  // Featured mode: fill remaining slots with most recent items
  if (mode === "dynamic-featured" && items.length < limit) {
    const recent = (await fetcher({ limit, featured: false })) || [];
    const seenIds = new Set(items.map((item: any) => item._id));
    items = [
      ...items,
      ...recent.filter((item: any) => item && !seenIds.has(item._id)),
    ].slice(0, limit);
  }

  return items;
}

/**
 * Resolve the Latest News section. Dynamic modes replace the manually picked
 * columns with freshly fetched news posts / external sources, synthesized as
 * the same grid column item shapes GridRow already renders.
 * Manual mode (or no mode, for existing documents) returns the section as-is.
 */
async function resolveNewsSection(section: DynamicGridSection): Promise<any> {
  if (!section) return section;
  // Default to "latest news" when no mode is set, so the homepage shows fresh
  // posts instead of stale manually-picked columns. An explicit manual choice is
  // still honoured.
  const mode = isDynamicMode(section.mode)
    ? section.mode
    : section.mode === "manual"
      ? null
      : "dynamic-recent";
  if (!mode) return section;

  try {
    const limit = section.maxItems || 3;
    const items = await fetchDynamicItems(
      mode,
      limit,
      fetchHomepageNews
    );
    if (items.length === 0) return section; // fall back to manual columns

    return {
      ...section,
      columns: items
        .filter((news: any) => news && news._id)
        .slice(0, limit)
        .map((news: any) =>
          news._type === "externalSource"
            ? {
                _type: "grid-external-source",
                _key: `external-source-${news._id}`,
                externalSource: news,
                showTags: true,
                showMetadata: true,
              }
            : {
                _type: "grid-news",
                _key: `news-${news._id}`,
                newsPost: news,
                showTags: true,
                showMetadata: true,
              }
        ),
    };
  } catch (error) {
    console.error("[homepage] dynamic news resolution failed:", error);
    return section;
  }
}

/**
 * Resolve the Research Agendas section the same way, synthesizing grid-agenda
 * column items. Manual mode (or no mode) returns the section as-is.
 */
async function resolveAgendasSection(section: DynamicGridSection): Promise<any> {
  if (!section) return section;
  const mode = isDynamicMode(section.mode)
    ? section.mode
    : section.mode === "manual"
      ? null
      : "dynamic-recent";
  if (!mode) return section;

  try {
    const limit = section.maxItems || 3;
    const items = await fetchDynamicItems(
      mode,
      limit,
      fetchHomepageAgendas
    );
    if (items.length === 0) return section;

    return {
      ...section,
      columns: items
        .filter((agenda: any) => agenda && agenda._id)
        .slice(0, limit)
        .map((agenda: any) => ({
          _type: "grid-agenda",
          _key: `agenda-${agenda._id}`,
          agenda: agenda,
          showTags: true,
          showMetadata: true,
          showDownloadButtons: true,
        })),
    };
  } catch (error) {
    console.error("[homepage] dynamic agendas resolution failed:", error);
    return section;
  }
}

export default async function Homepage({ homepage, locale }: HomepageProps) {
  const rtl = isRTL(locale);

  if (!homepage) {
    return null;
  }

  // Preferred: render from the freeform blocks[] page-builder. The fixed-section
  // render below is the legacy fallback during the blocks[] migration.
  if (homepage.blocks && homepage.blocks.length > 0) {
    return (
      <div dir={rtl ? "rtl" : "ltr"}>
        <Blocks blocks={homepage.blocks} locale={locale} />
      </div>
    );
  }

  const [agendasModule, news] = await Promise.all([
    resolveAgendasSection(homepage.agendasModule),
    resolveNewsSection(homepage.news),
  ]);

  return (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      {/* Section 1: Hero Welcome */}
      {homepage.heroWelcome && (
        <Hero1
          {...homepage.heroWelcome}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 2: Global Research & Action Agenda */}
      {homepage.globalAgenda && (
        <SplitRow
          {...homepage.globalAgenda}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 3: How to Use Hub */}
      {homepage.howToUse && (
        <SplitRow
          {...homepage.howToUse}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 4: Research Agendas Module */}
      {agendasModule && (
        <GridRow
          {...agendasModule}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 5: Lived Experiences Stories */}
      {homepage.livedExperiences && (
        <Carousel2
          {...homepage.livedExperiences}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 6: Regional Communities */}
      {homepage.regionalCommunities && (
        <GridRow
          {...homepage.regionalCommunities}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 6b: Interactive region map — the "where is this happening"
          overview. The block above provides the region link targets; this adds
          the faceted choropleth + data panel. Hidden in the intermediate
          release (infra stays); re-enabled by the homepageMap flag. */}
      {FEATURES.homepageMap && (
        <RegionMapBlock locale={locale} defaultFacet="caseStudyCount" />
      )}

      {/* Section 7: Collaboration Info */}
      {homepage.collaboration && (
        <SplitRow
          {...homepage.collaboration}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 7b: People in your region (WIREFRAMES §4.1 "Collaborate" panel).
          Flag-gated until validated; prod stays clean. */}
      {FEATURES.homepagePeople && (
        <section className="container max-w-6xl py-8">
          <PeopleWidget locale={locale} limit={6} />
        </section>
      )}

      {/* Section 8: Latest News */}
      {news && (
        <GridRow
          {...news}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 9: Project Info */}
      {homepage.projectInfo && (
        <SplitRow
          {...homepage.projectInfo}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 10: Mental Health Definition */}
      {homepage.mentalHealthDefinition && (
        <Cta1
          {...homepage.mentalHealthDefinition}
          locale={locale}
          isRTL={rtl}
        />
      )}

      {/* Section 11: Partner Logos */}
      {homepage.partnerLogos && (
        <LogoCloud1
          {...homepage.partnerLogos}
          locale={locale}
          isRTL={rtl}
        />
      )}
    </div>
  );
}
