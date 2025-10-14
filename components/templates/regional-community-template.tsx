import React from 'react';
import Blocks from '@/components/blocks/index';
import TeamGrid from '@/components/blocks/grid/team-grid';
import { fetchRegionalCommunityAgendas } from '@/sanity/lib/fetch';
import { fetchRegionalCommunityCaseStudiesBySlug } from '@/sanity/queries/regional-community-case-studies';
import { fetchRegionalCommunityLivedExperiencesBySlug } from '@/sanity/queries/regional-community-lived-experiences';
import { fetchRegionalCommunityNewsBySlug } from '@/sanity/queries/regional-community-news';

interface GridConfig {
  mode?: 'manual' | 'dynamic-featured' | 'dynamic-recent';
  gridColumns?: string;
  maxItems?: number;
  showTitle?: boolean;
  title?: string;
  showDescription?: boolean;
  description?: any;
  manualItems?: any[];
}

interface CarouselConfig {
  mode?: 'manual' | 'dynamic-featured' | 'dynamic-recent';
  maxItems?: number;
  showTitle?: boolean;
  title?: string;
  showDescription?: boolean;
  description?: any;
  manualItems?: any[];
}

interface RegionalCommunity {
  _id: string;
  name: any;
  slug: {
    current: string;
  };
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
  if (!regionalCommunity || !regionalCommunity.slug?.current) {
    console.error('Regional community template: Invalid regional community data');
    return null;
  }

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
  const [
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
      title: agendasGrid?.title || 'Agendas',
      description: agendasGrid?.showDescription ? agendasGrid.description : undefined,
      gridColumns: agendasGrid?.gridColumns || 'grid-cols-3',
      background: { type: 'none' },
      padding: { top: 'lg', bottom: 'lg' },
      columns: agendasData?.length ? agendasData.slice(0, agendasLimit).map((agenda: any) => ({
        _type: 'grid-agenda',
        _key: `agenda-${agenda._id}`,
        agenda: agenda,
        showTags: true,
        showMetadata: true,
        showDownloadCount: true
      })) : []
    });
  }

  // Add News Grid - render if configured, show empty state if no data
  if (newsGrid?.showTitle !== false) {
    templateBlocks.push({
      _type: 'grid-row',
      _key: 'template-news-grid',
      title: newsGrid?.title || 'News & Updates',
      description: newsGrid?.showDescription ? newsGrid.description : undefined,
      gridColumns: newsGrid?.gridColumns || 'grid-cols-3',
      background: { type: 'none' },
      padding: { top: 'lg', bottom: 'lg' },
      columns: newsData?.length ? newsData.slice(0, newsLimit).map((news: any) => ({
        _type: 'grid-news',
        _key: `news-${news._id}`,
        post: news,
        showTags: true,
        showMetadata: true
      })) : []
    });
  }

  // Add Case Studies Grid - render if configured, show empty state if no data
  if (caseStudiesGrid?.showTitle !== false) {
    templateBlocks.push({
      _type: 'grid-row',
      _key: 'template-case-studies-grid',
      title: caseStudiesGrid?.title || 'Case Studies',
      description: caseStudiesGrid?.showDescription ? caseStudiesGrid.description : undefined,
      gridColumns: caseStudiesGrid?.gridColumns || 'grid-cols-3',
      background: { type: 'none' },
      padding: { top: 'lg', bottom: 'lg' },
      columns: caseStudiesData?.length ? caseStudiesData.slice(0, caseStudiesLimit).map((caseStudy: any) => ({
        _type: 'grid-case-study',
        _key: `case-study-${caseStudy._id}`,
        caseStudy: caseStudy,
        showTags: true,
        showAuthors: true,
        showMetadata: true
      })) : []
    });
  }

  // Add Lived Experiences Carousel - only if lived experiences exist and carousel is configured to show
  if (livedExperiencesData && livedExperiencesData.length > 0 && livedExperiencesCarousel?.showTitle !== false) {
    templateBlocks.push({
      _type: 'lived-experiences-carousel',
      _key: 'template-lived-experiences',
      title: livedExperiencesCarousel?.title || 'Community Voices',
      description: livedExperiencesCarousel?.showDescription ? livedExperiencesCarousel.description : undefined,
      subtitle: 'Hear directly from community members about their experiences',
      background: { type: 'muted' },
      padding: { top: 'xl', bottom: 'xl' },
      filterBy: {
        communities: [regionalCommunity._id],
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
      regionalCommunity: {
        _id: regionalCommunity._id,
        name: regionalCommunity.name,
        slug: regionalCommunity.slug
      },
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

  return (
    <div className="regional-community-template">
      {/* Render all template blocks in order */}
      {templateBlocks.length > 0 && (
        <Blocks
          blocks={templateBlocks}
          locale={locale}
          userId={userId}
        />
      )}
    </div>
  );
}