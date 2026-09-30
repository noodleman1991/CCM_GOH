import Hero1 from "@/components/blocks/hero/hero-1";
import { pageEditHref, sectionEditHref } from "@/lib/cms/edit-links";
import { getTranslations } from "next-intl/server";
import SplitRow from "@/components/blocks/split/split-row";
import GridRow from "@/components/blocks/grid/grid-row";
import Carousel2 from "@/components/blocks/carousel/carousel-2";
import LivedExperiencesCarousel from "@/components/blocks/carousel/lived-experiences-carousel";
import Cta1 from "@/components/blocks/cta/cta-1";
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
import Blocks from "@/components/blocks";
import type { ComponentProps } from "react";
import { isRTL } from "@/i18n/i18n-helpers";
import {
  getHomepageAgendas,
  getHomepageNews,
} from "@/lib/content/pages";
import { resolveLivedExperiencesSection } from "@/lib/content/homepage-lived-experiences";

type DynamicMode = "dynamic-recent" | "dynamic-featured";

/** A grid-row section as GridRow consumes it, plus the homepage-only dynamic
 *  fields (mode/maxItems) its query projection carries. */
type DynamicGridSection = ComponentProps<typeof GridRow> & {
  mode?: DynamicMode | "manual" | null;
  maxItems?: number | null;
};
type GridColumns = NonNullable<DynamicGridSection["columns"]>;

/**
 * The homepage document fields this component renders. Each section is typed
 * as the props of the block component it is spread into.
 */
interface HomepageDoc {
  sections?: ComponentProps<typeof Blocks>["blocks"] | null;
  heroWelcome?: ComponentProps<typeof Hero1> | null;
  globalAgenda?: ComponentProps<typeof SplitRow> | null;
  howToUse?: ComponentProps<typeof SplitRow> | null;
  agendasModule?: DynamicGridSection | null;
  livedExperiences?: ComponentProps<typeof Carousel2> | null;
  regionalCommunities?: ComponentProps<typeof GridRow> | null;
  collaboration?: ComponentProps<typeof SplitRow> | null;
  news?: DynamicGridSection | null;
  projectInfo?: ComponentProps<typeof SplitRow> | null;
  mentalHealthDefinition?: ComponentProps<typeof Cta1> | null;
  partnerLogos?: ComponentProps<typeof LogoCloud1> | null;
}

interface HomepageProps {
  homepage: HomepageDoc | null;
  locale: string;
  /** Signed-in viewer, threaded to the agenda download buttons so a
   *  non-public `accessLevel` can see who is asking (audit M4). */
  userId?: string;
  /** Staff see an "Edit this section" link on each section (CMS project 2). */
  canEdit?: boolean;
  editLabel?: string;
  /** The site path "Back to the page" returns to from the admin. */
  returnTo?: string;
}

/** The fields the dynamic-section fetchers' items are read by below. */
interface DynamicSectionItem {
  _id?: string;
  _type?: string;
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
  fetcher: (args: { limit: number; featured?: boolean }) => Promise<DynamicSectionItem[]>
): Promise<DynamicSectionItem[]> {
  let items: DynamicSectionItem[] =
    mode === "dynamic-featured"
      ? (await fetcher({ limit, featured: true })) || []
      : (await fetcher({ limit, featured: false })) || [];

  // Featured mode: fill remaining slots with most recent items
  if (mode === "dynamic-featured" && items.length < limit) {
    const recent = (await fetcher({ limit, featured: false })) || [];
    const seenIds = new Set(items.map((item) => item._id));
    items = [
      ...items,
      ...recent.filter((item) => item && !seenIds.has(item._id)),
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
async function resolveNewsSection(
  section: DynamicGridSection | null | undefined
): Promise<DynamicGridSection | null | undefined> {
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
      getHomepageNews
    );
    if (items.length === 0) return section; // fall back to manual columns

    return {
      ...section,
      // The generated column types model raw Sanity references, while these
      // synthesized columns carry the already-dereferenced query results that
      // GridRow renders at runtime — hence the assertion.
      columns: items
        .filter((news) => news && news._id)
        .slice(0, limit)
        .map((news) =>
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
        ) as unknown as GridColumns,
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
async function resolveAgendasSection(
  section: DynamicGridSection | null | undefined
): Promise<DynamicGridSection | null | undefined> {
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
      getHomepageAgendas
    );
    if (items.length === 0) return section;

    return {
      ...section,
      // Same as the news section: synthesized columns hold dereferenced data,
      // not the reference shapes the generated column types describe.
      columns: items
        .filter((agenda) => agenda && agenda._id)
        .slice(0, limit)
        .map((agenda) => ({
          _type: "grid-agenda",
          _key: `agenda-${agenda._id}`,
          agenda: agenda,
          showTags: true,
          showMetadata: true,
          showDownloadButtons: true,
        })) as unknown as GridColumns,
    };
  } catch (error) {
    console.error("[homepage] dynamic agendas resolution failed:", error);
    return section;
  }
}

export default async function Homepage({ homepage, locale, userId, canEdit = false, editLabel, returnTo }: HomepageProps) {
  const rtl = isRTL(locale);

  if (!homepage) {
    return null;
  }

  // The Sections list (CMS project 2) is the homepage; the fixed template below
  // renders only while it is empty — the backup the move script can fall back to.
  if (homepage.sections && homepage.sections.length > 0) {
    const pageEditLabel = canEdit ? (await getTranslations({ locale, namespace: "blocks" }))("editPage") : null;
    return (
      <div dir={rtl ? "rtl" : "ltr"}>
        <Blocks
          blocks={homepage.sections}
          locale={locale}
          userId={userId}
          editHref={canEdit ? (index) => sectionEditHref("/admin/globals/homepage", index, returnTo ?? `/${locale}`) : undefined}
          editLabel={editLabel}
          pageEdit={pageEditLabel ? { href: pageEditHref("/admin/globals/homepage", returnTo ?? `/${locale}`), label: pageEditLabel } : undefined}
        />
      </div>
    );
  }

  const [agendasModule, news, livedExperiences] = await Promise.all([
    resolveAgendasSection(homepage.agendasModule),
    resolveNewsSection(homepage.news),
    resolveLivedExperiencesSection(homepage.livedExperiences, locale),
  ]);

  return (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      {/* Section 1: Hero Welcome */}
      {homepage.heroWelcome && (
        <Hero1
          {...homepage.heroWelcome}
          locale={locale}
        />
      )}

      {/* Section 2: Global Research & Action Agenda */}
      {homepage.globalAgenda && (
        <SplitRow
          {...homepage.globalAgenda}
          locale={locale}
        />
      )}

      {/* Section 3: How to Use Hub */}
      {homepage.howToUse && (
        <SplitRow
          {...homepage.howToUse}
          locale={locale}
        />
      )}

      {/* Section 4: Research Agendas Module */}
      {agendasModule && (
        <GridRow
          {...agendasModule}
          locale={locale}
          userId={userId}
        />
      )}

      {/* Section 5: Lived Experiences Stories — hand-picked testimonials win
          when any are picked (today's behaviour); otherwise the latest
          published lived experiences fill the section, keeping its heading;
          with none at all, the section is hidden rather than showing an
          empty carousel (lib/content/homepage-lived-experiences.ts). */}
      {livedExperiences.mode === "manual" && (
        <Carousel2
          {...livedExperiences.section}
          locale={locale}
        />
      )}
      {livedExperiences.mode === "auto" && (
        <LivedExperiencesCarousel
          {...livedExperiences.section}
        />
      )}

      {/* Section 6: Regional Communities */}
      {homepage.regionalCommunities && (
        <GridRow
          {...homepage.regionalCommunities}
          locale={locale}
        />
      )}

      {/* Section 7: Collaboration Info */}
      {homepage.collaboration && (
        <SplitRow
          {...homepage.collaboration}
          locale={locale}
        />
      )}

      {/* Section 8: Latest News */}
      {news && (
        <GridRow
          {...news}
          locale={locale}
        />
      )}

      {/* Section 9: Project Info */}
      {homepage.projectInfo && (
        <SplitRow
          {...homepage.projectInfo}
          locale={locale}
        />
      )}

      {/* Section 10: Mental Health Definition */}
      {homepage.mentalHealthDefinition && (
        <Cta1
          {...homepage.mentalHealthDefinition}
          locale={locale}
        />
      )}

      {/* Section 11: Partner Logos */}
      {homepage.partnerLogos && (
        <LogoCloud1
          {...homepage.partnerLogos}
          locale={locale}
        />
      )}
    </div>
  );
}
