#!/usr/bin/env tsx
/**
 * Script 12: Generate Regional Community Pages NDJSON
 *
 * Creates TWO document types per region:
 * 1. regionalCommunity (data entity with members)
 * 2. regionalCommunityPage (page template with content)
 *
 * Total: 14 documents (7 communities + 7 pages)
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const PARSED_CONTENT = path.join(OUTPUT_DIR, 'advanced-parsed-content.json');

interface RegionalCommunity {
  _type: 'regionalCommunity';
  _id: string;
  name: {
    en: string;
  };
  slug: {
    _type: 'slug';
    current: string;
  };
  active: boolean;
  featured: boolean;
}

interface RegionalCommunityPage {
  _type: 'regionalCommunityPage';
  _id: string;
  title: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  regionalCommunity: {
    _type: 'reference';
    _ref: string;
  };
  language: string;
  useTemplate: boolean;
  welcomeHero?: any;
  whyJoinCTA?: any;
  teamGrid?: any;
  agendasGrid?: any;
  newsGrid?: any;
  caseStudiesGrid?: any;
  livedExperiencesCarousel?: any;
}

function cleanSection(section: any) {
  const { _confidence, ...cleanedSection } = section;

  // Convert title object to string
  if (cleanedSection.title?.en) {
    cleanedSection.title = cleanedSection.title.en;
  }

  // Convert description to body
  if (cleanedSection.description && Array.isArray(cleanedSection.description)) {
    cleanedSection.body = cleanedSection.description.length > 0 ? cleanedSection.description : undefined;
    delete cleanedSection.description;
  }

  // Remove SVG placeholders
  if (cleanedSection.image && cleanedSection.image.startsWith('data:image/svg+xml')) {
    delete cleanedSection.image;
  }

  return cleanedSection;
}

async function generateRegionalPagesNDJSON() {
  console.log('🌍 Generating Regional Community Documents\n');
  console.log('='.repeat(70) + '\n');

  // Read parsed content
  const parsedData = await fs.readJson(PARSED_CONTENT);
  const regionalPages = parsedData.regionalCommunityPages;

  console.log(`Found ${regionalPages.length} regional community pages\n`);

  const communities: RegionalCommunity[] = [];
  const pages: RegionalCommunityPage[] = [];

  for (const pageData of regionalPages) {
    const slug = pageData.slug.current;
    const communityId = `regional-community-${slug}`;
    const pageId = `regional-community-page-${slug}`;

    // Create Regional Community document (data entity)
    communities.push({
      _type: 'regionalCommunity',
      _id: communityId,
      name: {
        en: pageData.title,
      },
      slug: {
        _type: 'slug',
        current: slug,
      },
      active: true,
      featured: false,
    });

    // Create Regional Community Page document (template)
    const page: RegionalCommunityPage = {
      _type: 'regionalCommunityPage',
      _id: pageId,
      title: pageData.title,
      slug: {
        _type: 'slug',
        current: slug,
      },
      regionalCommunity: {
        _type: 'reference',
        _ref: communityId,
      },
      language: pageData.language || 'en',
      useTemplate: true,
    };

    // Add extracted content sections
    if (pageData.welcomeHero) {
      page.welcomeHero = cleanSection(pageData.welcomeHero);
    }

    if (pageData.whyJoinCTA) {
      page.whyJoinCTA = cleanSection(pageData.whyJoinCTA);
    }

    // Add grid configurations with sensible defaults
    page.teamGrid = {
      mode: 'dynamic',
      gridColumns: 'grid-cols-4',
      showTitle: true,
      title: 'Our Team',
      showDescription: false,
      displayRole: true,
      displayAffiliation: true,
    };

    page.agendasGrid = {
      mode: 'dynamic-featured',
      gridColumns: 'grid-cols-3',
      maxItems: 6,
      showTitle: true,
      title: 'Agendas',
      showDescription: false,
    };

    page.newsGrid = {
      mode: 'dynamic-recent',
      gridColumns: 'grid-cols-3',
      maxItems: 6,
      showTitle: true,
      title: 'News & Updates',
      showDescription: false,
    };

    page.caseStudiesGrid = {
      mode: 'dynamic-featured',
      gridColumns: 'grid-cols-3',
      maxItems: 6,
      showTitle: true,
      title: 'Case Studies',
      showDescription: false,
    };

    page.livedExperiencesCarousel = {
      mode: 'dynamic-featured',
      maxItems: 10,
      showTitle: true,
      title: 'Community Voices',
      showDescription: false,
    };

    pages.push(page);
  }

  console.log('📊 Statistics:\n');
  console.log(`  Regional Communities: ${communities.length}`);
  console.log(`  Regional Community Pages: ${pages.length}`);
  console.log(`  Total Documents: ${communities.length + pages.length}\n`);

  console.log('🌍 Regional Communities:\n');
  communities.forEach(community => {
    console.log(`  ✓ ${community.name.en.padEnd(60)} [${community.slug.current}]`);
  });

  // Convert to NDJSON format
  const communitiesNdjson = communities
    .map(c => JSON.stringify(c))
    .join('\n');

  const pagesNdjson = pages
    .map(p => JSON.stringify(p))
    .join('\n');

  // Save to files
  const communitiesPath = path.join(OUTPUT_DIR, 'regional-communities.ndjson');
  const pagesPath = path.join(OUTPUT_DIR, 'regional-community-pages.ndjson');

  await fs.writeFile(communitiesPath, communitiesNdjson);
  await fs.writeFile(pagesPath, pagesNdjson);

  // Also save as JSON for review
  const communitiesJsonPath = path.join(OUTPUT_DIR, 'regional-communities.json');
  const pagesJsonPath = path.join(OUTPUT_DIR, 'regional-community-pages.json');

  await fs.writeJson(communitiesJsonPath, communities, { spaces: 2 });
  await fs.writeJson(pagesJsonPath, pages, { spaces: 2 });

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Regional Documents Generated!');
  console.log(`\n📄 Outputs:`);
  console.log(`   Communities (data):`);
  console.log(`     - ${communitiesPath} (for import)`);
  console.log(`     - ${communitiesJsonPath} (for review)`);
  console.log(`   Pages (templates):`);
  console.log(`     - ${pagesPath} (for import)`);
  console.log(`     - ${pagesJsonPath} (for review)`);
  console.log('\n💡 Next Steps:');
  console.log('   1. Review JSON files to verify extracted content');
  console.log('   2. After import, link authors to communities in Sanity Studio');
  console.log('   3. Add cover images and contact information');
  console.log('   4. Add translations for ES, FR, AR languages\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateRegionalPagesNDJSON().catch(console.error);
}

export { generateRegionalPagesNDJSON };
