/**
 * Create All Outputs Pages Script
 *
 * Combines blocks from three agenda pages into a single "all outputs" page
 * for each supported language (en, es, fr, ar).
 *
 * Source Pages:
 * - research-and-action/global-agenda
 * - research-and-action/regional-agendas
 * - research-and-action/community-agendas
 *
 * Target:
 * - research-and-action/all-outputs (4 language versions)
 *
 * Usage:
 *   node scripts/create-all-outputs-pages.mjs [--dry-run]
 *
 * Options:
 *   --dry-run    Preview changes without creating pages
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

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

// Configuration
const LANGUAGES = ['en', 'es', 'fr', 'ar'];
const SOURCE_PAGES = [
  'research-and-action/global-agenda',
  'research-and-action/regional-agendas',
  'research-and-action/community-agendas'
];
const TARGET_SLUG = 'research-and-action/all-outputs';

const TITLES = {
  en: 'All Outputs',
  es: 'Todos los resultados',
  fr: 'Tous les résultats',
  ar: 'جميع المخرجات'
};

const META_TITLES = {
  en: 'All Outputs - Climate and Mental Health',
  es: 'Todos los resultados - Clima y Salud Mental',
  fr: 'Tous les résultats - Climat et Santé Mentale',
  ar: 'جميع المخرجات - المناخ والصحة النفسية'
};

const META_DESCRIPTIONS = {
  en: 'Browse all research and action outputs including global agendas, regional agendas, and community agendas.',
  es: 'Explore todos los resultados de investigación y acción, incluidas las agendas globales, regionales y comunitarias.',
  fr: 'Parcourez tous les résultats de recherche et d\'action, y compris les agendas mondiaux, régionaux et communautaires.',
  ar: 'تصفح جميع نتائج البحث والعمل بما في ذلك الأجندات العالمية والإقليمية والمجتمعية.'
};

const LANG_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic'
};

/**
 * Fetch blocks from a specific page
 */
async function fetchPageBlocks(slug, language) {
  const page = await client.fetch(`
    *[_type == "page" && slug.current == $slug && language == $language][0]{
      _id,
      title,
      language,
      blocks
    }
  `, { slug, language });

  if (!page) {
    return null;
  }

  return {
    id: page._id,
    title: page.title,
    blocks: page.blocks || []
  };
}

/**
 * Ensure all block keys are unique
 */
function ensureUniqueKeys(blocks) {
  const usedKeys = new Set();
  return blocks.map((block, index) => {
    let key = block._key;

    // Generate new key if missing or duplicate
    if (!key || usedKeys.has(key)) {
      key = `block-${randomUUID()}`;
    }

    usedKeys.add(key);
    return { ...block, _key: key };
  });
}

/**
 * Combine blocks from multiple pages
 */
function combineBlocks(...blockArrays) {
  const allBlocks = [];

  for (const blocks of blockArrays) {
    if (Array.isArray(blocks)) {
      allBlocks.push(...blocks);
    }
  }

  // Ensure all keys are unique
  return ensureUniqueKeys(allBlocks);
}

/**
 * Create or update all outputs page for a specific language
 */
async function createAllOutputsPage(language, combinedBlocks, dryRun = false) {
  const pageData = {
    _id: `page-all-outputs-${language}`,
    _type: 'page',
    title: TITLES[language],
    language: language,
    slug: {
      _type: 'slug',
      current: TARGET_SLUG
    },
    blocks: combinedBlocks,
    meta_title: META_TITLES[language],
    meta_description: META_DESCRIPTIONS[language],
    noindex: false
  };

  if (dryRun) {
    console.log(`   [DRY RUN] Would create page with ${combinedBlocks.length} blocks`);
    return { success: true, language, dryRun: true };
  }

  try {
    await client.createOrReplace(pageData);
    return { success: true, language };
  } catch (error) {
    return { success: false, language, error: error.message };
  }
}

/**
 * Process a single language
 */
async function processLanguage(language, dryRun = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing language: ${LANG_NAMES[language]} (${language})`);
  console.log('='.repeat(60));

  const pagesData = [];

  // Fetch all three source pages
  for (const slug of SOURCE_PAGES) {
    const pageData = await fetchPageBlocks(slug, language);

    if (!pageData) {
      console.log(`⚠️  Page not found: ${slug}`);
      pagesData.push({ slug, blocks: [] });
    } else {
      const blockCount = pageData.blocks.length;
      console.log(`✓ Fetched ${slug.split('/').pop()}: ${blockCount} blocks`);
      pagesData.push({ slug, blocks: pageData.blocks });
    }
  }

  // Combine all blocks
  const combinedBlocks = combineBlocks(
    pagesData[0].blocks, // global-agenda
    pagesData[1].blocks, // regional-agendas
    pagesData[2].blocks  // community-agendas
  );

  console.log(`✓ Combined ${combinedBlocks.length} total blocks`);

  // Create the page
  const result = await createAllOutputsPage(language, combinedBlocks, dryRun);

  if (result.success) {
    if (dryRun) {
      console.log(`✓ Validated page structure`);
    } else {
      console.log(`✅ Created page: ${TARGET_SLUG} (${language})`);
    }
  } else {
    console.log(`❌ Error creating page: ${result.error}`);
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🚀 Create All Outputs Pages');
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }
  console.log('\n' + '='.repeat(60));
  console.log('Configuration:');
  console.log('='.repeat(60));
  console.log(`Languages: ${LANGUAGES.join(', ')}`);
  console.log(`Target slug: ${TARGET_SLUG}`);
  console.log(`Source pages:`);
  SOURCE_PAGES.forEach(slug => console.log(`  - ${slug}`));

  const results = [];

  // Process each language
  for (const language of LANGUAGES) {
    const result = await processLanguage(language, dryRun);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Languages processed: ${LANGUAGES.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);

  if (results.some(r => !r.success)) {
    console.log('\n❌ Failed languages:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${LANG_NAMES[r.language]}: ${r.error}`);
    });
  }

  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n✨ Dry run complete! Run without --dry-run to create pages.');
  } else {
    console.log('\n✨ Pages created!');
    console.log('\n🌐 Test URLs:');
    LANGUAGES.forEach(lang => {
      console.log(`   /${lang}/${TARGET_SLUG}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
