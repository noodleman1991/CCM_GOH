import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import {
  createSanityClient,
  downloadImage,
  uploadToSanity,
  saveImageToFile,
  loadRegistry,
  saveRegistry,
  generateAltText,
  createImageReference,
  generateHash,
  cleanUrl,
} from './lib/image-utils.mjs';
import {
  htmlToPortableText,
  createBlockContent,
  createParagraph,
} from '../lib/html-to-portable-text.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const MIGRATION_DATA_DIR = join(__dirname, '../migration/data');
const DOWNLOADS_DIR = join(__dirname, '../downloads/images');
const REGISTRY_FILE = join(__dirname, '../image-asset-mapping.json');

/**
 * Extract images from page data
 */
function extractPageImages(pageData) {
  const images = new Set();

  // From images array
  if (Array.isArray(pageData.images)) {
    pageData.images.forEach(url => {
      if (url && typeof url === 'string' &&
          (url.startsWith('http://') || url.startsWith('https://')) &&
          !url.startsWith('data:') &&
          !url.includes('/_next/image') &&
          !url.includes('/_next/static')) {
        images.add(url);
      }
    });
  }

  // Recursively find in nested objects
  const findUrls = (obj) => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && (
        value.startsWith('http://') || value.startsWith('https://')
      ) && (
        value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
        value.includes('/images/') ||
        value.includes('plasmic')
      ) && !value.startsWith('data:') &&
          !value.includes('/_next/image') &&
          !value.includes('/_next/static')) {
        images.add(value);
      } else if (typeof value === 'object') {
        findUrls(value);
      }
    }
  };

  findUrls(pageData);
  return Array.from(images);
}

/**
 * Process images for a page
 */
async function processPageImages(client, imageUrls, registry, hashMap) {
  console.log(`\n📸 Processing ${imageUrls.length} images for this page...`);

  const results = {
    uploaded: 0,
    skipped: 0,
    errors: 0,
  };

  for (const url of imageUrls) {
    const cleanedUrl = cleanUrl(url);
    const filename = path.basename(cleanedUrl);

    try {
      // Check if already in registry
      if (registry[cleanedUrl]) {
        console.log(`  ⏭  Cached: ${filename}`);
        results.skipped++;
        continue;
      }

      // Download
      console.log(`  📥 ${filename}`);
      const { buffer, contentType } = await downloadImage(cleanedUrl);

      // Check for duplicate by hash
      const hash = generateHash(buffer);
      if (hashMap[hash]) {
        registry[cleanedUrl] = {
          ...hashMap[hash],
          duplicateOf: hashMap[hash].url,
        };
        results.skipped++;
        continue;
      }

      // Save locally
      const localPath = join(DOWNLOADS_DIR, filename);
      await saveImageToFile(buffer, localPath);

      // Upload to Sanity
      const assetInfo = await uploadToSanity(client, buffer, {
        filename,
        alt: generateAltText(cleanedUrl),
      });

      console.log(`  ✅ ${assetInfo.assetId}`);

      // Update registry
      const registryEntry = {
        assetId: assetInfo.assetId,
        url: assetInfo.url,
        alt: assetInfo.alt,
        filename,
        localPath,
        originalUrl: cleanedUrl,
        contentType,
        hash,
        uploadedAt: new Date().toISOString(),
      };

      registry[cleanedUrl] = registryEntry;
      hashMap[hash] = registryEntry;
      results.uploaded++;

    } catch (error) {
      console.error(`  ❌ ${filename}: ${error.message}`);
      results.errors++;
    }
  }

  // Save registry
  await saveRegistry(REGISTRY_FILE, registry);

  console.log(`\n📊 Images: ${results.uploaded} uploaded, ${results.skipped} cached, ${results.errors} errors`);
  return results;
}

/**
 * Parse homepage data from migration file
 */
function parseHomepageData(pageData, registry) {
  console.log('\n🏠 Parsing homepage data...');

  // Helper to get image reference
  const getImageRef = (url) => {
    if (!url) return null;
    const cleanedUrl = cleanUrl(url);
    const entry = registry[cleanedUrl];
    if (!entry) return null;
    return createImageReference(entry.assetId, entry.alt);
  };

  // Extract sections (this is a simplified version - you'll need to customize based on actual structure)
  const homepage = {
    _type: 'homepage',
    _id: 'homepage-en',
    title: 'Homepage',
    language: 'en',
    slug: {
      _type: 'slug',
      current: 'index',
    },
  };

  // Add sections as they're found in the data
  // This is where you'd map specific sections from your page data

  return homepage;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const pageFile = args[0];

  if (!pageFile) {
    console.error('❌ Usage: node scripts/populate-page.mjs <page-file>');
    console.error('   Example: node scripts/populate-page.mjs page_about.json');
    console.error('   Example: node scripts/populate-page.mjs page_default.json --images-only');
    console.error('\nOptions:');
    console.error('   --images-only    Only download and upload images, don\'t create Sanity documents');
    console.error('   --dry-run        Preview what would be done without making changes');
    process.exit(1);
  }

  const imagesOnly = args.includes('--images-only');
  const dryRun = args.includes('--dry-run');

  console.log('🚀 Page-by-Page Content Population');
  console.log(`📄 Processing: ${pageFile}`);
  if (imagesOnly) console.log('🖼️  Mode: Images only');
  if (dryRun) console.log('🏃 Mode: Dry run\n');

  // Load page data
  const pagePath = join(MIGRATION_DATA_DIR, pageFile);
  if (!await fs.pathExists(pagePath)) {
    console.error(`❌ File not found: ${pagePath}`);
    process.exit(1);
  }

  console.log('📖 Loading page data...');
  const pageData = await fs.readJson(pagePath);
  console.log(`✓ Loaded ${Object.keys(pageData).length} data fields`);

  // Initialize Sanity client
  const client = createSanityClient();
  console.log('✓ Sanity client initialized');

  // Load image registry
  const registry = await loadRegistry(REGISTRY_FILE);
  const hashMap = {};
  Object.values(registry).forEach(entry => {
    if (entry.hash && !entry.duplicateOf) {
      hashMap[entry.hash] = entry;
    }
  });

  // Extract and process images
  const imageUrls = extractPageImages(pageData);
  const imageResults = await processPageImages(client, imageUrls, registry, hashMap);

  if (imagesOnly) {
    console.log('\n✨ Images processed! (Skipping document creation)');
    return;
  }

  // Parse and create Sanity documents
  if (!dryRun) {
    console.log('\n📝 Creating Sanity documents...');

    // Determine document type based on filename
    if (pageFile.includes('default') || pageFile.includes('homepage')) {
      const homepage = parseHomepageData(pageData, registry);
      console.log('🏠 Creating/updating homepage...');
      // await client.createOrReplace(homepage);
      console.log('⚠️  Homepage creation commented out - needs custom mapping');
    } else {
      console.log('ℹ️  Document creation not yet implemented for this page type');
      console.log('   You can use the parsed data and image registry to create documents');
    }
  }

  console.log('\n✨ Done!');
  console.log(`\n📊 Summary:`);
  console.log(`   Images uploaded: ${imageResults.uploaded}`);
  console.log(`   Images cached: ${imageResults.skipped}`);
  console.log(`   Errors: ${imageResults.errors}`);
  console.log(`\n📁 Registry: ${REGISTRY_FILE}`);
  console.log(`📂 Downloads: ${DOWNLOADS_DIR}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
