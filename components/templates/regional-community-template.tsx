import React, { Suspense } from 'react';
import Blocks from '@/components/blocks/index';
import TeamGrid from '@/components/blocks/grid/team-grid';
import { RegionMembersBlock } from '@/components/blocks/community/region-members-block';
import { RegionSectionSpine } from '@/components/regions/region-section-spine';
import { getTranslations } from 'next-intl/server';
import { fetchRegionalCommunityAgendas } from '@/sanity/lib/fetch';
import { fetchRegionalCommunityCaseStudiesBySlug } from '@/sanity/queries/regional-community-case-studies';
import { fetchRegionalCommunityLivedExperiencesBySlug } from '@/sanity/queries/regional-community-lived-experiences';
import { fetchRegionalCommunityNewsBySlug } from '@/sanity/queries/regional-community-news';
import { mergePinnedWithDynamic, type WithId } from '@/lib/community/grid-items';
import { RC_SLUG_TO_REGION } from '@/lib/maps/region-codes';

/** A loosely-shaped CMS block config (hero, team grid, logo cloud, …) passed through to Blocks. */
type CmsBlockConfig = Record<string, unknown>;

interface GridConfig {
  mode?: 'manual' | 'dynamic-featured' | 'dynamic-recent' | 'dynamic-with-pinned';
  gridColumns?: string;
  maxItems?: number;
  initialDisplayCount?: number;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
  showDescription?: boolean;
  description?: unknown;
  headerImage?: unknown;
  manualItems?: WithId[];
}

interface CarouselConfig {
  mode?: 'manual' | 'dynamic-featured' | 'dynamic-recent' | 'dynamic-with-pinned';
  maxItems?: number;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
  showDescription?: boolean;
  description?: unknown;
  background?: unknown;
  padding?: unknown;
  manualItems?: WithId[];
}

interface RegionalCommunity {
  _id: string | null;
  name: unknown;
  slug: {
    current: string;
  } | null;
  coverImage?: unknown;
}

interface RegionalCommunityTemplateProps {
  regionalCommunity: RegionalCommunity;
  agendasGrid?: GridConfig;
  newsGrid?: GridConfig;
  caseStudiesGrid?: GridConfig;
  livedExperiencesCarousel?: CarouselConfig;
  welcomeHero?: CmsBlockConfig;
  whyJoinCTA?: CmsBlockConfig;
  logoCloud?: CmsBlockConfig;
  teamGrid?: CmsBlockConfig;
  teamMembers?: unknown[];
  atlasEmbed?: { enabled?: boolean; showBreakdown?: boolean };
  locale: string;
  userId: string;
}

export default async function RegionalCommunityTemplate({
  regionalCommunity,
  agendasGrid,
  newsGrid,
  caseStudiesGrid,
  livedExperiencesCarousel,
  welcomeHero,
  whyJoinCTA,
  logoCloud,
  teamGrid,
  teamMembers,
  atlasEmbed,
  locale,
  userId
}: RegionalCommunityTemplateProps) {
  // Validate regional community data
  if (!regionalCommunity || !regionalCommunity._id || !regionalCommunity.slug?.current) {
    console.error('Regional community template: Invalid regional community data', {
      hasRegionalCommunity: !!regionalCommunity,
      hasId: !!regionalCommunity?._id,
      hasSlug: !!regionalCommunity?.slug?.current,
      regionalCommunityId: regionalCommunity?._id
    });
    return null;
  }

  const t = await getTranslations({ locale, namespace: 'regional' });

  const communitySlug = regionalCommunity.slug.current;

  // Determine fetch modes and limits from grid configurations with safe defaults
  const agendasMode = agendasGrid?.mode || 'dynamic-featured';
  const agendasLimit = agendasGrid?.maxItems || 6;

  const caseStudiesMode = caseStudiesGrid?.mode || 'dynamic-featured';
  const caseStudiesLimit = caseStudiesGrid?.maxItems || 6;

  const livedExpMode = livedExperiencesCarousel?.mode || 'dynamic-featured';
  const livedExpLimit = livedExperiencesCarousel?.maxItems || 10;

  const newsMode = newsGrid?.mode || 'dynamic-recent';
  const newsLimit = newsGrid?.maxItems || 6;

  // Fetch dynamic content based on grid configuration
  let [
    agendasData,
    caseStudiesData,
    livedExperiencesData,
    newsData
  ] = await Promise.all([
    agendasGrid?.mode === 'manual' && agendasGrid?.manualItems?.length
      ? Promise.resolve(agendasGrid.manualItems)
      : fetchRegionalCommunityAgendas({
          slug: communitySlug,
          limit: agendasLimit
        }),
    caseStudiesGrid?.mode === 'manual' && caseStudiesGrid?.manualItems?.length
      ? Promise.resolve(caseStudiesGrid.manualItems)
      : fetchRegionalCommunityCaseStudiesBySlug({
          slug: communitySlug,
          limit: caseStudiesLimit,
          featured: caseStudiesMode === 'dynamic-featured'
        }),
    livedExperiencesCarousel?.mode === 'manual' && livedExperiencesCarousel?.manualItems?.length
      ? Promise.resolve(livedExperiencesCarousel.manualItems)
      : fetchRegionalCommunityLivedExperiencesBySlug({
          slug: communitySlug,
          limit: livedExpLimit,
          featured: livedExpMode === 'dynamic-featured'
        }),
    newsGrid?.mode === 'manual' && newsGrid?.manualItems?.length
      ? Promise.resolve(newsGrid.manualItems)
      : fetchRegionalCommunityNewsBySlug({
          slug: communitySlug,
          limit: newsLimit,
          featured: newsMode === 'dynamic-featured'
        })
  ]);

  // Intelligent fallback: if featured mode but no results, fetch recent items
  // This ensures grids never appear empty when data exists

  // Fallback for lived experiences
  if (livedExpMode === 'dynamic-featured' && (!livedExperiencesData || livedExperiencesData.length === 0)) {
    console.log('No featured lived experiences found, falling back to recent');
    livedExperiencesData = await fetchRegionalCommunityLivedExperiencesBySlug({
      slug: communitySlug,
      limit: livedExpLimit,
      featured: false
    });
  }

  // Fallback for case studies
  if (caseStudiesMode === 'dynamic-featured' && (!caseStudiesData || caseStudiesData.length === 0)) {
    console.log('No featured case studies found, falling back to recent');
    caseStudiesData = await fetchRegionalCommunityCaseStudiesBySlug({
      slug: communitySlug,
      limit: caseStudiesLimit,
      featured: false
    });
  }

  // Fallback for news
  if (newsMode === 'dynamic-featured' && (!newsData || newsData.length === 0)) {
    console.log('No featured news found, falling back to recent');
    newsData = await fetchRegionalCommunityNewsBySlug({
      slug: communitySlug,
      limit: newsLimit,
      featured: false
    });
  }

  // Fallback for agendas (if it uses featured mode)
  if (agendasMode === 'dynamic-featured' && (!agendasData || agendasData.length === 0)) {
    console.log('No featured agendas found, falling back to recent');
    agendasData = await fetchRegionalCommunityAgendas({
      slug: communitySlug,
      limit: agendasLimit
    });
  }

  // Hybrid "dynamic-with-pinned": editor-pinned manualItems render first, then
  // the dynamic results fill the rest (deduped, capped at maxItems). This lets
  // editors curate without losing the auto-updating regional feed.
  if (agendasMode === 'dynamic-with-pinned') {
    agendasData = mergePinnedWithDynamic(agendasGrid?.manualItems, agendasData, agendasLimit);
  }
  if (caseStudiesMode === 'dynamic-with-pinned') {
    caseStudiesData = mergePinnedWithDynamic(caseStudiesGrid?.manualItems, caseStudiesData, caseStudiesLimit);
  }
  if (livedExpMode === 'dynamic-with-pinned') {
    livedExperiencesData = mergePinnedWithDynamic(livedExperiencesCarousel?.manualItems, livedExperiencesData, livedExpLimit);
  }
  if (newsMode === 'dynamic-with-pinned') {
    newsData = mergePinnedWithDynamic(newsGrid?.manualItems, newsData, newsLimit);
  }

  // Create template blocks array for Blocks component. These are synthesized
  // CMS-shaped block objects; the Blocks renderer dispatches on `_type`.
  type TemplateBlock = { _type: string; _key: string } & Record<string, unknown>;
  const templateBlocks: TemplateBlock[] = [];

  // Add Welcome Hero if configured
  if (welcomeHero && (welcomeHero.title || welcomeHero.body)) {
    templateBlocks.push({
      ...welcomeHero,
      _type: 'hero-1',
      _key: 'template-welcome-hero'
    });
  }

  // Add Why Join Hero Block if configured (now supports images!)
  if (whyJoinCTA && (whyJoinCTA.title || whyJoinCTA.body)) {
    templateBlocks.push({
      ...whyJoinCTA,
      _type: 'hero-1',
      _key: 'template-why-join-hero'
    });
  }

  // Add Agendas Grid - render if configured, show empty state if no data
  // Only render the section when it actually has content — an empty grid would
  // show a heading over blank space, which looks broken to a visitor.
  if (agendasGrid?.showTitle !== false && agendasData?.length) {
    templateBlocks.push({
      _type: 'grid-row',
      _key: 'template-agendas-grid',
      title: agendasGrid?.title || t('sectionTitles.agendas'),
      subtitle: agendasGrid?.subtitle,
      headerImage: agendasGrid?.headerImage,
      description: agendasGrid?.showDescription ? agendasGrid.description : undefined,
      gridColumns: agendasGrid?.gridColumns || 'grid-cols-3',
      initialDisplayCount: agendasGrid?.initialDisplayCount,
      background: { type: 'none' },
      padding: { top: 'lg', bottom: 'lg' },
      columns: agendasData?.length ? agendasData
        .filter((agenda: WithId) => agenda && agenda._id)
        .slice(0, agendasLimit)
        .map((agenda: WithId) => ({
          _type: 'grid-agenda',
          _key: `agenda-${agenda._id}`,
          agenda: agenda,
          showTags: true,
          showMetadata: true,
          showDownloadCount: true
        })) : []
    });
  }

  // Add Case Studies Grid - only when there is content to show.
  if (caseStudiesGrid?.showTitle !== false && caseStudiesData?.length) {
    templateBlocks.push({
      _type: 'grid-row',
      _key: 'template-case-studies-grid',
      title: caseStudiesGrid?.title || t('sectionTitles.caseStudies'),
      subtitle: caseStudiesGrid?.subtitle,
      headerImage: caseStudiesGrid?.headerImage,
      description: caseStudiesGrid?.showDescription ? caseStudiesGrid.description : undefined,
      gridColumns: caseStudiesGrid?.gridColumns || 'grid-cols-3',
      initialDisplayCount: caseStudiesGrid?.initialDisplayCount,
      background: { type: 'none' },
      padding: { top: 'lg', bottom: 'lg' },
      columns: caseStudiesData?.length ? caseStudiesData
        .filter((caseStudy: WithId) => caseStudy && caseStudy._id)
        .slice(0, caseStudiesLimit)
        .map((caseStudy: WithId) => ({
          _type: 'grid-case-study',
          _key: `case-study-${caseStudy._id}`,
          caseStudy: caseStudy,
          showTags: true,
          showAuthors: true,
          showMetadata: true
        })) : []
    });
  }

  // Add News Grid - render if configured, show empty state if no data (includes both newsPost and externalSource)
  if (newsGrid?.showTitle !== false && newsData?.length) {
    templateBlocks.push({
      _type: 'grid-row',
      _key: 'template-news-grid',
      title: newsGrid?.title || t('sectionTitles.newsUpdates'),
      subtitle: newsGrid?.subtitle,
      headerImage: newsGrid?.headerImage,
      description: newsGrid?.showDescription ? newsGrid.description : undefined,
      gridColumns: newsGrid?.gridColumns || 'grid-cols-3',
      initialDisplayCount: newsGrid?.initialDisplayCount,
      background: { type: 'none' },
      padding: { top: 'lg', bottom: 'lg' },
      columns: newsData?.length ? newsData
        .filter((news: WithId) => news && news._id)
        .slice(0, newsLimit)
        .map((news: WithId) => {
          // Check if it's an external source or news post
          if (news._type === 'externalSource') {
            return {
              _type: 'grid-external-source',
              _key: `external-source-${news._id}`,
              externalSource: news,
              showTags: true,
              showMetadata: true
            };
          } else {
            return {
              _type: 'grid-news',
              _key: `news-${news._id}`,
              newsPost: news,
              showTags: true,
              showMetadata: true
            };
          }
        }) : []
    });
  }

  // Add Lived Experiences Carousel - render if configured (even if no data for empty state)
  if (livedExperiencesCarousel?.showTitle !== false) {
    templateBlocks.push({
      _type: 'lived-experiences-carousel',
      _key: 'template-lived-experiences',
      title: livedExperiencesCarousel?.title || t('sectionTitles.communityVoices'),
      subtitle: livedExperiencesCarousel?.subtitle || t('sectionTitles.communityVoicesSubtitle'),
      description: livedExperiencesCarousel?.showDescription ? livedExperiencesCarousel.description : undefined,
      background: livedExperiencesCarousel?.background || { type: 'muted' },
      padding: livedExperiencesCarousel?.padding || { top: 'xl', bottom: 'xl' },

      // ✅ FIX: Pass the fetched data to the carousel component
      experiences: livedExperiencesData || [],

      filterBy: {
        communities: regionalCommunity._id ? [regionalCommunity._id] : [],
        tags: [],
        authors: []
      },
      maxItems: livedExpLimit,
      featured: livedExpMode === 'dynamic-featured'
    });
  }

  // Add Team Grid as second-to-last component
  if (teamGrid && (teamGrid.showTitle !== false || teamGrid.manualMembers || teamGrid.mode === 'dynamic')) {
    templateBlocks.push({
      _type: 'team-grid',
      _key: 'template-team-grid',
      ...teamGrid,
      // Pass regionalCommunity reference for dynamic member fetching and role display
      regionalCommunity: regionalCommunity._id ? {
        _id: regionalCommunity._id,
        name: regionalCommunity.name,
        slug: regionalCommunity.slug
      } : null,
    });
  }

  // Region-scoped atlas embed (spec A4) — ON BY DEFAULT for the seven
  // canonical regions (opt-OUT via CMS, not opt-in): every regional page
  // carries its live atlas facet — map + compact spotlight (composition bar,
  // countries, cards) reacting to the shared filters. AtlasEmbedBlock
  // returns null for a slug with no region code, so non-canonical
  // communities are unaffected.
  if (atlasEmbed?.enabled !== false && RC_SLUG_TO_REGION[communitySlug]) {
    templateBlocks.push({
      _type: 'atlas-embed',
      _key: 'atlas-embed',
      region: RC_SLUG_TO_REGION[communitySlug],
      showBreakdown: atlasEmbed?.showBreakdown ?? true,
    } as never);
  }

  // Add Logo Cloud as last component
  if (logoCloud && (logoCloud.images || logoCloud.showTitle !== false)) {
    templateBlocks.push({
      _type: 'logo-cloud-1',
      _key: 'template-logo-cloud',
      ...logoCloud,
    });
  }

  // ── Anchor-spine grouping (Gate-2 §regional) ────────────────────────────
  // The page stays ONE scroll: blocks group into anchored <section>s in the
  // approved order (atlas joins Overview), and the sticky spine above them is
  // scroll-spied anchor nav — never content-switching tabs. Sections with no
  // blocks simply don't appear in the spine.
  const KEY_TO_SECTION: Record<string, string> = {
    'template-welcome-hero': 'overview',
    'template-why-join-hero': 'overview',
    'atlas-embed': 'overview',
    'template-agendas-grid': 'agendas',
    'template-case-studies-grid': 'case-studies',
    'template-news-grid': 'news',
    'template-lived-experiences': 'voices',
    'template-team-grid': 'members',
    'template-logo-cloud': 'partners',
  };
  const SECTION_ORDER = ['overview', 'agendas', 'case-studies', 'news', 'voices', 'members', 'partners'];
  const SECTION_LABEL: Record<string, string> = {
    overview: t('sectionTitles.overview'),
    agendas: t('sectionTitles.agendas'),
    'case-studies': t('sectionTitles.caseStudies'),
    news: t('sectionTitles.newsUpdates'),
    voices: t('sectionTitles.communityVoices'),
    members: t('sectionTitles.members'),
    partners: t('sectionTitles.partners'),
  };
  const SECTION_COUNT: Record<string, number | undefined> = {
    agendas: agendasData?.length || undefined,
    'case-studies': caseStudiesData?.length || undefined,
    news: newsData?.length || undefined,
    voices: livedExperiencesData?.length || undefined,
  };

  const grouped = new Map<string, typeof templateBlocks>();
  for (const block of templateBlocks) {
    const section = KEY_TO_SECTION[(block as { _key?: string })._key ?? ''] ?? 'overview';
    grouped.set(section, [...(grouped.get(section) ?? []), block]);
  }
  // Members always exists (RegionMembersBlock renders independently of config).
  if (!grouped.has('members')) grouped.set('members', []);

  const spineSections = SECTION_ORDER.filter(
    (id) => grouped.has(id) && (id === 'members' || (grouped.get(id)?.length ?? 0) > 0)
  ).map((id) => ({ id, label: SECTION_LABEL[id], count: SECTION_COUNT[id] }));

  return (
    <>
      {spineSections.length > 1 && <RegionSectionSpine sections={spineSections} />}
      {SECTION_ORDER.map((id) => {
        const blocks = grouped.get(id);
        if (!blocks || (blocks.length === 0 && id !== 'members')) return null;
        return (
          // scroll-mt clears the sticky spine when an anchor jumps.
          <section key={id} id={id} className="scroll-mt-14">
            {/* Reserved-height fallbacks: a null fallback let late-hydrating
                blocks grow the page after an anchor jump, stranding the
                viewport mid-section (and costing CLS). */}
            {blocks.length > 0 && (
              <Suspense fallback={<div className="min-h-[320px]" aria-hidden />}>
                {/* Synthesized blocks match the renderer's `_type` dispatch, not the
                    generated PAGE_QUERY block union — hence the cast. */}
                <Blocks blocks={blocks as React.ComponentProps<typeof Blocks>['blocks']} locale={locale} userId={userId} />
              </Suspense>
            )}
            {/* One people surface per section: when the CMS team-grid is
                configured it wins; the community-members graph renders only
                as the fallback so Members is never empty — two stacked
                people grids read as a duplicate block. */}
            {id === 'members' && blocks.length === 0 && (
              <Suspense fallback={<div className="min-h-[180px]" aria-hidden />}>
                <RegionMembersBlock slug={communitySlug} locale={locale} />
              </Suspense>
            )}
          </section>
        );
      })}
    </>
  );
}