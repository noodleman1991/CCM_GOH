#!/usr/bin/env tsx
/**
 * Consolidate individual page JSONs into site inventory
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data is in project root at /Users/amitlockshinski/WebstormProjects/turbo2/migration/data
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function consolidate() {
  console.log('📦 Consolidating scraped data...\n');

  await fs.ensureDir(OUTPUT_DIR);

  const files = await fs.readdir(DATA_DIR);
  const pageFiles = files.filter(f => f.startsWith('page_') && f.endsWith('.json'));

  console.log(`Found ${pageFiles.length} page files\n`);

  const inventory = {
    homepage: null as any,
    regionalPages: [] as any[],
    otherPages: [] as any[],
    totalPages: 0,
    totalImages: 0,
    totalPDFs: 0,
    scrapedAt: new Date().toISOString()
  };

  for (const file of pageFiles) {
    const pageData = await fs.readJSON(path.join(DATA_DIR, file));

    inventory.totalPages++;
    inventory.totalImages += pageData.images?.length || 0;
    inventory.totalPDFs += pageData.metadata?.pdfs?.length || 0;

    // Categorize
    if (file === 'pagehomepage.json' || file === 'page.json' || file === 'page_default.json') {
      inventory.homepage = pageData;
      console.log(`✅ Homepage: ${pageData.title} (${pageData.images?.length || 0} images)`);
    } else if (file.includes('_rc_')) {
      inventory.regionalPages.push(pageData);
      console.log(`✅ Regional: ${pageData.title} (${pageData.images?.length || 0} images)`);
    } else {
      inventory.otherPages.push(pageData);
      console.log(`✅ Other: ${pageData.title} (${pageData.images?.length || 0} images)`);
    }
  }

  // Save consolidated inventory
  await fs.writeJSON(
    path.join(DATA_DIR, 'site-inventory.json'),
    inventory,
    { spaces: 2 }
  );

  console.log('\n✨ Consolidation complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Total pages: ${inventory.totalPages}`);
  console.log(`   - Homepage: ${inventory.homepage ? '✅' : '❌'}`);
  console.log(`   - Regional pages: ${inventory.regionalPages.length}`);
  console.log(`   - Other pages: ${inventory.otherPages.length}`);
  console.log(`   - Total images: ${inventory.totalImages}`);
  console.log(`   - Total PDFs: ${inventory.totalPDFs}`);
  console.log(`\n💾 Saved to: ${DATA_DIR}/site-inventory.json`);

  return inventory;
}

consolidate().catch(console.error);
