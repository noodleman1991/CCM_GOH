import React from 'react';
import Blocks from '@/components/blocks/index';
import { fetchRegionalCommunityReports } from '@/sanity/lib/fetch';
import { fetchRegionalCommunityCaseStudiesBySlug } from '@/sanity/queries/regional-community-case-studies';
import { fetchRegionalCommunityLivedExperiencesBySlug } from '@/sanity/queries/regional-community-lived-experiences';

interface TemplateConfig {
  gridReportsConfig?: {
    showFeatured: boolean;
    maxItems: number;
    title: string;
  };
  gridCaseStudiesConfig?: {
    showFeatured: boolean;
    maxItems: number;
    title: string;
  };
  livedExperiencesConfig?: {
    showFeatured: boolean;
    maxItems: number;
    title: string;
  };
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
  templateConfiguration?: TemplateConfig;
  templateInserts?: any[];
  locale: string;
  userId: string;
}

export default async function RegionalCommunityTemplate({
  regionalCommunity,
  templateConfiguration,
  templateInserts = [],
  locale,
  userId
}: RegionalCommunityTemplateProps) {
  const communitySlug = regionalCommunity.slug.current;

  // Fetch dynamic content based on template configuration
  const [
    reportsData,
    caseStudiesData,
    livedExperiencesData
  ] = await Promise.all([
    fetchRegionalCommunityReports({
      slug: communitySlug,
      limit: templateConfiguration?.gridReportsConfig?.maxItems || 6
    }),
    fetchRegionalCommunityCaseStudiesBySlug({
      slug: communitySlug,
      limit: templateConfiguration?.gridCaseStudiesConfig?.maxItems || 6,
      featured: templateConfiguration?.gridCaseStudiesConfig?.showFeatured
    }),
    fetchRegionalCommunityLivedExperiencesBySlug({
      slug: communitySlug,
      limit: templateConfiguration?.livedExperiencesConfig?.maxItems || 10,
      featured: templateConfiguration?.livedExperiencesConfig?.showFeatured
    })
  ]);

  // Create template blocks array for Blocks component
  const templateBlocks = [];

  // Add Why Join CTA Block
  templateBlocks.push({
    _type: 'cta-1',
    _key: 'template-why-join-cta',
    title: 'Join Our Community',
    subtitle: 'Connect with like-minded individuals and make a difference',
    button: {
      text: 'Get Involved',
      link: '#',
      variant: 'primary'
    },
    background: { type: 'primary' },
    padding: { top: 'lg', bottom: 'lg' }
  });

  // Add Reports Grid
  if (reportsData && reportsData.length > 0) {
    templateBlocks.push({
      _type: 'grid-row',
      _key: 'template-reports-grid',
      title: templateConfiguration?.gridReportsConfig?.title || 'Recent Reports',
      gridColumns: 'grid-cols-3',
      background: { type: 'none' },
      padding: { top: 'lg', bottom: 'lg' },
      columns: reportsData.slice(0, templateConfiguration?.gridReportsConfig?.maxItems || 6).map((report: any) => ({
        _type: 'grid-report',
        _key: `report-${report._id}`,
        report: report,
        showTags: true,
        showAuthors: true,
        showMetadata: true,
        showDownloadCount: true
      }))
    });
  }

  // Add Case Studies Grid
  if (caseStudiesData && caseStudiesData.length > 0) {
    templateBlocks.push({
      _type: 'grid-row',
      _key: 'template-case-studies-grid',
      title: templateConfiguration?.gridCaseStudiesConfig?.title || 'Case Studies',
      gridColumns: 'grid-cols-3',
      background: { type: 'none' },
      padding: { top: 'lg', bottom: 'lg' },
      columns: caseStudiesData.slice(0, templateConfiguration?.gridCaseStudiesConfig?.maxItems || 6).map((caseStudy: any) => ({
        _type: 'grid-case-study',
        _key: `case-study-${caseStudy._id}`,
        caseStudy: caseStudy,
        showTags: true,
        showAuthors: true,
        showMetadata: true
      }))
    });
  }

  // Add Lived Experiences Carousel
  if (livedExperiencesData && livedExperiencesData.length > 0) {
    templateBlocks.push({
      _type: 'lived-experiences-carousel',
      _key: 'template-lived-experiences',
      title: templateConfiguration?.livedExperiencesConfig?.title || 'Community Voices',
      subtitle: 'Hear directly from community members about their experiences',
      background: { type: 'muted' },
      padding: { top: 'xl', bottom: 'xl' },
      filterBy: {
        communities: [regionalCommunity._id],
        tags: [],
        authors: []
      },
      maxItems: templateConfiguration?.livedExperiencesConfig?.maxItems || 10,
      featured: templateConfiguration?.livedExperiencesConfig?.showFeatured || false
    });
  }

  // Add Logo Cloud
  templateBlocks.push({
    _type: 'logo-cloud-1',
    _key: 'template-logo-cloud',
    title: 'Our Partners',
    subtitle: 'Organizations supporting this community',
    background: { type: 'muted' },
    padding: { top: 'lg', bottom: 'lg' },
    logos: [] // This would be populated with actual partner logos
  });

  // Combine template blocks with template inserts
  const allBlocks = [...templateBlocks, ...templateInserts];

  return (
    <div className="regional-community-template">
      <Blocks
        blocks={allBlocks}
        locale={locale}
        userId={userId}
      />
    </div>
  );
}