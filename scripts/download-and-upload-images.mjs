import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import {
  createSanityClient,
  generateHash,
  downloadImage,
  uploadToSanity,
  saveImageToFile,
  loadRegistry,
  saveRegistry,
  extractImageUrls,
  generateAltText,
  getExtensionFromContentType,
  cleanUrl,
} from './lib/image-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MIGRATION_DATA_DIR = join(__dirname, '../migration/data');
const DOWNLOADS_DIR = join(__dirname, '../downloads/images');
const REGISTRY_FILE = join(__dirname, '../image-asset-mapping.json');
const MAX_CONCURRENT = 3; // Download 3 images at a time
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = process.argv.includes('--limit')
  ? parseInt(process.argv[process.argv.indexOf('--limit') + 1])
  : null;

/**
 * Process a single image: download, save, upload to Sanity
 */
async function processImage(client, url, registry, hashMap) {
  const cleanedUrl = cleanUrl(url);

  // Check if already processed
  if (registry[cleanedUrl]) {
    console.log(`  ⏭  Already processed: ${path.basename(cleanedUrl)}`);
    return { status: 'skipped', url: cleanedUrl };
  }

  try {
    // Download image
    console.log(`  📥 Downloading: ${path.basename(cleanedUrl)}`);
    const { buffer, contentType } = await downloadImage(cleanedUrl);

    // Check for duplicate by hash
    const hash = generateHash(buffer);
    if (hashMap[hash]) {
      console.log(`  🔄 Duplicate of: ${hashMap[hash].url}`);
      registry[cleanedUrl] = {
        ...hashMap[hash],
        duplicateOf: hashMap[hash].url,
      };
      return { status: 'duplicate', url: cleanedUrl };
    }

    // Generate filename
    const ext = getExtensionFromContentType(contentType);
    const filename = path.basename(cleanedUrl, path.extname(cleanedUrl)) + ext;
    const localPath = join(DOWNLOADS_DIR, filename);

    // Save to local filesystem
    await saveImageToFile(buffer, localPath);
    console.log(`  💾 Saved locally: ${filename}`);

    // Upload to Sanity (skip if dry run)
    let assetInfo = null;
    if (!DRY_RUN) {
      console.log(`  ☁️  Uploading to Sanity...`);
      assetInfo = await uploadToSanity(client, buffer, {
        filename,
        alt: generateAltText(cleanedUrl),
      });
      console.log(`  ✅ Uploaded: ${assetInfo.assetId}`);
    } else {
      assetInfo = {
        assetId: `dry-run-${hash}`,
        url: localPath,
        alt: generateAltText(cleanedUrl),
      };
      console.log(`  🏃 Dry run: ${filename}`);
    }

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

    return { status: 'success', url: cleanedUrl, assetId: assetInfo.assetId };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { status: 'error', url: cleanedUrl, error: error.message };
  }
}

/**
 * Process images in batches
 */
async function processBatch(client, urls, registry, hashMap, stats) {
  const results = [];

  for (let i = 0; i < urls.length; i += MAX_CONCURRENT) {
    const batch = urls.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(url => processImage(client, url, registry, hashMap))
    );
    results.push(...batchResults);

    // Update stats
    batchResults.forEach(result => {
      stats[result.status] = (stats[result.status] || 0) + 1;
    });

    // Save registry after each batch
    await saveRegistry(REGISTRY_FILE, registry);

    // Progress update
    const processed = i + batch.length;
    const total = urls.length;
    const percentage = ((processed / total) * 100).toFixed(1);
    console.log(`\n📊 Progress: ${processed}/${total} (${percentage}%)`);
    console.log(`   ✅ Success: ${stats.success || 0}`);
    console.log(`   ⏭  Skipped: ${stats.skipped || 0}`);
    console.log(`   🔄 Duplicates: ${stats.duplicate || 0}`);
    console.log(`   ❌ Errors: ${stats.error || 0}\n`);
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Image Download and Upload System\n');

  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - Images will be downloaded but not uploaded to Sanity\n');
  }

  // Ensure directories exist
  await fs.ensureDir(DOWNLOADS_DIR);

  // Initialize Sanity client
  const client = createSanityClient();
  console.log('✓ Sanity client initialized\n');

  // Load existing registry
  console.log('📖 Loading registry...');
  const registry = await loadRegistry(REGISTRY_FILE);
  const existingCount = Object.keys(registry).length;
  console.log(`✓ Found ${existingCount} existing entries\n`);

  // Create hash map for deduplication
  const hashMap = {};
  Object.values(registry).forEach(entry => {
    if (entry.hash && !entry.duplicateOf) {
      hashMap[entry.hash] = entry;
    }
  });

  // Extract image URLs from migration data
  console.log('🔍 Extracting image URLs from migration data...');
  const allUrls = await extractImageUrls(MIGRATION_DATA_DIR);
  console.log(`✓ Found ${allUrls.length} unique image URLs\n`);

  // Filter URLs (remove already processed if not re-running)
  const urlsToProcess = LIMIT
    ? allUrls.slice(0, LIMIT)
    : allUrls;

  console.log(`📝 Processing ${urlsToProcess.length} images...\n`);

  // Statistics
  const stats = {
    success: 0,
    skipped: 0,
    duplicate: 0,
    error: 0,
  };

  // Process images in batches
  const results = await processBatch(client, urlsToProcess, registry, hashMap, stats);

  // Save final registry
  await saveRegistry(REGISTRY_FILE, registry);

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(60));
  console.log(`Total images found:    ${allUrls.length}`);
  console.log(`Images processed:      ${urlsToProcess.length}`);
  console.log(`✅ Successful uploads: ${stats.success || 0}`);
  console.log(`⏭  Skipped (existing): ${stats.skipped || 0}`);
  console.log(`🔄 Duplicates found:   ${stats.duplicate || 0}`);
  console.log(`❌ Errors:             ${stats.error || 0}`);
  console.log(`📁 Registry entries:   ${Object.keys(registry).length}`);
  console.log(`📂 Downloads dir:      ${DOWNLOADS_DIR}`);
  console.log(`📄 Registry file:      ${REGISTRY_FILE}`);
  console.log('='.repeat(60));

  // Show errors if any
  if (stats.error > 0) {
    console.log('\n❌ Failed URLs:');
    results
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`   - ${r.url}: ${r.error}`));
  }

  console.log('\n✨ Done!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
