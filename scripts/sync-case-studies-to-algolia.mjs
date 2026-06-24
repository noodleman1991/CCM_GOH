import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { algoliasearch } from 'algoliasearch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

// Initialize Algolia client
const algoliaAppId = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const algoliaAdminKey = process.env.ALGOLIA_API_KEY;

if (!algoliaAppId || !algoliaAdminKey) {
  console.error('❌ Missing Algolia credentials');
  console.error('ALGOLIA_APP_ID:', !!algoliaAppId);
  console.error('ALGOLIA_API_KEY:', !!algoliaAdminKey);
  process.exit(1);
}

const algoliaClient = algoliasearch(algoliaAppId, algoliaAdminKey);

// Index name is env-overridable so we can reindex a STAGING index
// (e.g. case_studies_staging) without touching the production search index.
const CASE_STUDIES_INDEX = process.env.ALGOLIA_CASE_STUDIES_INDEX || 'case_studies';

// Phase 6: faceting attributes pushed before reindex so region/themes/populations
// are filterable. Kept in sync with INDEX_SETTINGS.case_studies in lib/algolia.ts.
const FACETING = [
  'filterOnly(status)', 'filterOnly(accessLevel)', 'featured', 'tags',
  'organizations', 'language', 'authors.role', 'region', 'themes', 'populations',
];

// Sanity query to get approved case studies
const CASE_STUDIES_QUERY = `*[_type == "caseStudy" && status == "approved"] {
  _id,
  title,
  slug,
  excerpt,
  status,
  featured,
  publishedAt,
  _updatedAt,
  topic,
  region,
  themes,
  populations,
  authors[] {
    name,
    role,
    affiliation->{name}
  },
  tags[]->{
    _id,
    label,
    value,
    color
  },
  studyLocation,
  studyPeriod,
  organizations[]->{name},
  relatedCommunity->{
    _id,
    name
  },
  image {
    asset->{url}
  }
}`;

function transformCaseStudyForIndex(caseStudy) {
  try {
    return {
      objectID: caseStudy._id,
      contentId: caseStudy._id,
      title: caseStudy.title || { en: 'Untitled Case Study' },
      excerpt: caseStudy.excerpt || {},
      slug: caseStudy.slug?.current || '',
      topic: caseStudy.topic || 'other',
      status: caseStudy.status || 'pending',
      featured: caseStudy.featured || false,
      publishedAt: caseStudy.publishedAt ? new Date(caseStudy.publishedAt).getTime() : Date.now(),
      updatedAt: caseStudy._updatedAt ? new Date(caseStudy._updatedAt).getTime() : Date.now(),
      authors: (caseStudy.authors || []).map((author) => ({
        name: author.name || 'Unknown Author',
        role: author.role || 'author',
        affiliation: author.affiliation?.name
      })),
      tags: (caseStudy.tags || []).map((tag) => tag.label?.en || tag.value || '').filter(Boolean),
      studyLocation: caseStudy.studyLocation ? {
        lat: caseStudy.studyLocation.lat,
        lng: caseStudy.studyLocation.lng,
        name: `${caseStudy.studyLocation.lat}, ${caseStudy.studyLocation.lng}`
      } : undefined,
      studyPeriod: caseStudy.studyPeriod ? {
        startDate: caseStudy.studyPeriod.startDate,
        endDate: caseStudy.studyPeriod.endDate
      } : undefined,
      organizations: (caseStudy.organizations || []).map((org) => org.name).filter(Boolean),
      relatedCommunity: caseStudy.relatedCommunity?.name,
      // Phase 6 fixed taxonomy facets.
      region: caseStudy.region || undefined,
      themes: caseStudy.themes || [],
      populations: caseStudy.populations || [],
      language: 'en',
      accessLevel: 'public'
    };
  } catch (error) {
    console.warn(`Failed to transform case study ${caseStudy._id}:`, error);
    return null;
  }
}

async function syncCaseStudiesToAlgolia() {
  console.log('🚀 Starting Case Studies Sync to Algolia\n');

  try {
    // Fetch all approved case studies from Sanity
    console.log('📥 Fetching approved case studies from Sanity...');
    const caseStudies = await sanityClient.fetch(CASE_STUDIES_QUERY);

    console.log(`✅ Found ${caseStudies.length} approved case studies\n`);

    if (caseStudies.length === 0) {
      console.log('No case studies to index.');
      return;
    }

    // Transform case studies for indexing
    console.log('🔄 Transforming case studies for Algolia...');
    const records = caseStudies
      .map(transformCaseStudyForIndex)
      .filter(Boolean);

    console.log(`✅ Transformed ${records.length} case studies\n`);

    console.log(`🎛️  Setting faceting on "${CASE_STUDIES_INDEX}" (region/themes/populations)...`);
    await algoliaClient.setSettings({
      indexName: CASE_STUDIES_INDEX,
      indexSettings: { attributesForFaceting: FACETING },
    });

    // Clear existing index and add new records
    console.log(`🗑️  Clearing "${CASE_STUDIES_INDEX}"...`);
    await algoliaClient.clearObjects({
      indexName: CASE_STUDIES_INDEX
    });

    console.log('📤 Uploading case studies to Algolia...');
    const response = await algoliaClient.saveObjects({
      indexName: CASE_STUDIES_INDEX,
      objects: records
    });

    // Wait for indexing to complete
    if (response && response.taskID) {
      console.log('⏳ Waiting for indexing to complete...');
      await algoliaClient.waitForTask({
        indexName: CASE_STUDIES_INDEX,
        taskID: response.taskID
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Successfully synced case studies to Algolia!');
    console.log('='.repeat(50));
    console.log(`📊 Total indexed: ${records.length}`);
    console.log(`⏭️  Skipped: ${caseStudies.length - records.length}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncCaseStudiesToAlgolia().catch(console.error);
