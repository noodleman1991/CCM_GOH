import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Translations provided by Claude
const translations = {
  // This will be populated with actual translations
};

async function translateCaseStudies() {
  console.log('🚀 Starting Case Study Translation (Claude-powered)\n');

  // Fetch all approved case studies
  const caseStudies = await client.fetch(`
    *[_type == "caseStudy" && status == "approved"] | order(publishedAt desc) {
      _id,
      "slug": slug.current,
      title,
      excerpt
    }
  `);

  console.log(`Found ${caseStudies.length} approved case studies\n`);

  // First, let's collect all case studies that need translation
  const needsTranslation = [];

  for (const cs of caseStudies) {
    const hasAllTranslations =
      cs.title?.en && cs.title?.es && cs.title?.fr && cs.title?.ar &&
      cs.excerpt?.en && cs.excerpt?.es && cs.excerpt?.fr && cs.excerpt?.ar;

    if (!hasAllTranslations && cs.title?.en && cs.excerpt?.en) {
      needsTranslation.push({
        _id: cs._id,
        slug: cs.slug,
        title: cs.title,
        excerpt: cs.excerpt
      });
    }
  }

  console.log(`Found ${needsTranslation.length} case studies needing translation\n`);

  if (needsTranslation.length === 0) {
    console.log('✅ All case studies are already fully translated!');
    return;
  }

  // Output the case studies for manual translation
  console.log('📝 Case studies to translate:');
  console.log('====================================\n');

  needsTranslation.forEach((cs, index) => {
    console.log(`${index + 1}. ${cs.slug}`);
    console.log(`   Title (EN): ${cs.title.en}`);
    console.log(`   Excerpt (EN): ${cs.excerpt.en}`);
    console.log('');
  });

  console.log('\n⚠️  Please provide translations for these case studies.');
  console.log('You can use Claude or another translation service to translate the titles and excerpts.');
}

translateCaseStudies().catch(console.error);
