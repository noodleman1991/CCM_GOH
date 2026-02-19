import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATION_DATA_DIR = join(__dirname, '../migration/data');

async function main() {
  console.log('📚 Available Migration Pages\n');
  console.log('=' .repeat(60));

  const files = await fs.readdir(MIGRATION_DATA_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json')).sort();

  for (const file of jsonFiles) {
    try {
      const filePath = join(MIGRATION_DATA_DIR, file);
      const data = await fs.readJson(filePath);
      const stats = await fs.stat(filePath);

      // Extract basic info
      const imageCount = Array.isArray(data.images) ? data.images.length : 0;
      const httpImages = Array.isArray(data.images)
        ? data.images.filter(url =>
            typeof url === 'string' &&
            (url.startsWith('http://') || url.startsWith('https://')) &&
            !url.startsWith('data:') &&
            !url.includes('/_next/')
          ).length
        : 0;

      const sizeKB = (stats.size / 1024).toFixed(1);

      console.log(`\n📄 ${file}`);
      console.log(`   Size: ${sizeKB} KB`);
      console.log(`   Total images: ${imageCount}`);
      console.log(`   HTTP images: ${httpImages}`);
      console.log(`   Fields: ${Object.keys(data).length}`);

      // Show some key fields
      if (data.title) console.log(`   Title: ${data.title}`);
      if (data.path) console.log(`   Path: ${data.path}`);
      if (data.url) console.log(`   URL: ${data.url}`);

      // Command to process this page
      console.log(`   \n   To process images:`);
      console.log(`   $ node scripts/populate-page.mjs ${file} --images-only`);

    } catch (error) {
      console.error(`   ❌ Error reading ${file}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nTotal files: ${jsonFiles.length}`);
  console.log('\nUsage examples:');
  console.log('  node scripts/populate-page.mjs page_about.json --images-only');
  console.log('  node scripts/populate-page.mjs page_default.json --dry-run');
  console.log('  node scripts/download-and-upload-images.mjs --limit 20');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
