import React from 'react';
import Blocks from '@/components/blocks/index';
import TeamGrid from '@/components/blocks/grid/team-grid';
import { getTranslations } from 'next-intl/server';
import { fetchRegionalCommunityAgendas } from '@/sanity/lib/fetch';
import { fetchRegionalCommunityCaseStudiesBySlug } from '@/sanity/queries/regional-community-case-studies';
import { fetchRegionalCommunityLivedExperiencesBySlug } from '@/sanity/queries/regional-community-lived-experiences';
import { fetchRegionalCommunityNewsBySlug } from '@/sanity/queries/regional-community-news';

interface GridConfig {
  mode?: 'manual' | 'dynamic-featured' | 'dynamic-recent';
  gridColumns?: string;
  maxItems?: number;
  initialDisplayCount?: number;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
  showDescription?: boolean;
  description?: any;
  headerImage?: any;
  manualItems?: any[];
}

interface CarouselConfig {
  mode?: 'manual' | 'dynamic-featured' | 'dynamic-recent';
  maxItems?: number;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
  showDescription?: boolean;
  description?: any;
  background?: any;
  padding?: any;
  manualItems?: any[];
}

interface RegionalCommunity {
  _id: string | null;
  name: any;
  slug: {
    current: string;
  } | null;
  coverImage?: any;
}

interface RegionalCommunityTemplateProps {
  regionalCommunity: RegionalCommunity;
  agendasGrid?: GridConfig;
  newsGrid?: GridConfig;
  caseStudiesGrid?: GridConfig;
  livedExperiencesCarousel?: CarouselConfig;
  welcomeHero?: any;
  whyJoinCTA?: any;
  logoCloud?: any;
  teamGrid?: any;
  teamMembers?: any[];
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

  // Create template blocks array for Blocks component
  const templateBlocks = [];

  // Debug logging for troubleshooting
  console.log('Regional Community Template Debug:', {
    communitySlug,
    hasWelcomeHero: !!welcomeHero,
    hasWhyJoinCTA: !!whyJoinCTA,
    hasTeamGrid: !!teamGrid,
    teamGridMode: teamGrid?.mode,
    hasLogoCloud: !!logoCloud,
    agendasCount: agendasData?.length || 0,
    caseStudiesCount: caseStudiesData?.length || 0,
    livedExpCount: livedExperiencesData?.length || 0,
    newsCount: newsData?.length || 0,
  });

  // Add Welcome Hero if configured
  if (welcomeHero && (welcomeHero.title || welcomeHero.body)) {
    templateBlocks.push({
      ...welcomeHero,
      _type: 'hero-1',
      _key: 'template-welcome-hero'
    });
  }

  // Debug whyJoinCTA vs welcomeHero
  console.log('=== HERO COMPARISON DEBUG ===');
  console.log('welcomeHero:', JSON.stringify(welcomeHero, null, 2));
  console.log('whyJoinCTA:', JSON.stringify(whyJoinCTA, null, 2));
  console.log('welcomeHero.title:', welcomeHero?.title);
  console.log('welcomeHero.body:', welcomeHero?.body);
  console.log('whyJoinCTA.title:', whyJoinCTA?.title);
  console.log('whyJoinCTA.body:', whyJoinCTA?.body);
  console.log('whyJoinCTA condition result:', !!(whyJoinCTA && (whyJoinCTA.title || whyJoinCTA.body)));

  // Add Why Join Hero Block if configured (now supports images!)
  if (whyJoinCTA && (whyJoinCTA.title || whyJoinCTA.body)) {
    templateBlocks.push({
      ...whyJoinCTA,
      _type: 'hero-1',
      _key: 'template-why-join-hero'
    });
  }

  // Add Agendas Grid - render if configured, show empty state if no data
  if (agendasGrid?.showTitle !== false) {
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
        .filter((agenda: any) => agenda && agenda._id)
        .slice(0, agendasLimit)
        .map((agenda: any) => ({
          _type: 'grid-agenda',
          _key: `agenda-${agenda._id}`,
          agenda: agenda,
          showTags: true,
          showMetadata: true,
          showDownloadCount: true
        })) : []
    });
  }

  // Add Case Studies Grid - render if configured, show empty state if no data
  if (caseStudiesGrid?.showTitle !== false) {
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
        .filter((caseStudy: any) => caseStudy && caseStudy._id)
        .slice(0, caseStudiesLimit)
        .map((caseStudy: any) => ({
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
  if (newsGrid?.showTitle !== false) {
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
        .filter((news: any) => news && news._id)
        .slice(0, newsLimit)
        .map((news: any) => {
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
    // Debug: Check data before passing to carousel
    console.log('DEBUG: Lived Experiences Data Before Carousel:', {
      hasData: !!livedExperiencesData,
      count: livedExperiencesData?.length || 0,
      firstItem: livedExperiencesData?.[0]?._id || 'none',
      mode: livedExpMode,
      limit: livedExpLimit
    });

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

  // Add Logo Cloud as last component
  if (logoCloud && (logoCloud.images || logoCloud.showTitle !== false)) {
    templateBlocks.push({
      _type: 'logo-cloud-1',
      _key: 'template-logo-cloud',
      ...logoCloud,
    });
  }

  // Final debug: show what blocks are about to be rendered
  console.log('=== FINAL TEMPLATE BLOCKS ===');
  console.log('Total blocks:', templateBlocks.length);
  console.log('Block types and keys:', templateBlocks.map(b => ({ type: b._type, key: b._key })));

  return (
    <>
      {/* Render all template blocks in order */}
      {templateBlocks.length > 0 && (
        <Blocks
          blocks={templateBlocks}
          locale={locale}
          userId={userId}
        />
      )}
    </>
  );
}