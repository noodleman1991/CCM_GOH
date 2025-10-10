#!/usr/bin/env tsx
/**
 * Script 14: Import All NDJSON to Sanity
 *
 * Imports all generated NDJSON files to Sanity in correct order
 * to resolve references properly
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@sanity/client';
import PQueue from 'p-queue';
import dotenv from 'dotenv';

// Load environment variables
const envPath = path.join(process.cwd(), '..', '.env');
dotenv.config({ path: envPath });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Import order matters for reference resolution!
const IMPORT_ORDER = [
  'organizations.ndjson',
  'regional-communities.ndjson',
  'authors.ndjson',
  'agendas.ndjson',
  'homepage.ndjson',
  'regional-community-pages.ndjson',
];

interface ImportStats {
  file: string;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ docId: string; error: string }>;
}

const importStats: ImportStats[] = [];

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.replace(/"/g, '') || '',
  token: process.env.SANITY_API_EDITOR_TOKEN || '',
  apiVersion: '2024-10-31',
  useCdn: false,
});

async function importDocument(doc: any, skipExisting: boolean = true): Promise<'success' | 'skipped' | 'failed'> {
  try {
    // Check if document exists
    if (skipExisting) {
      const existing = await client.getDocument(doc._id);
      if (existing) {
        return 'skipped';
      }
    }

    // Create or update document
    await client.createOrReplace(doc);
    return 'success';

  } catch (error) {
    // If document doesn't exist, create it
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      try {
        await client.create(doc);
        return 'success';
      } catch (createError) {
        throw createError;
      }
    }
    throw error;
  }
}

async function importNDJSONFile(filename: string, skipExisting: boolean = true): Promise<ImportStats> {
  const filePath = path.join(OUTPUT_DIR, filename);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📥 Importing: ${filename}`);
  console.log('='.repeat(70));

  if (!await fs.pathExists(filePath)) {
    console.error(`❌ File not found: ${filename}\n`);
    return {
      file: filename,
      total: 0,
      succeeded: 0,
      failed: 1,
      skipped: 0,
      errors: [{ docId: 'file', error: 'File not found' }],
    };
  }

  // Read and parse NDJSON
  const ndjsonContent = await fs.readFile(filePath, 'utf-8');
  const documents = ndjsonContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  console.log(`📊 Documents to import: ${documents.length}\n`);

  const stats: ImportStats = {
    file: filename,
    total: documents.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Import documents one by one (to preserve order and handle errors)
  for (const doc of documents) {
    try {
      const docTitle = doc.title?.en || doc.title || doc.name?.en || doc.name || doc._id;
      process.stdout.write(`  Processing: ${docTitle}...`);

      const result = await importDocument(doc, skipExisting);

      if (result === 'success') {
        stats.succeeded++;
        console.log(' ✅');
      } else if (result === 'skipped') {
        stats.skipped++;
        console.log(' ⏭️  (exists)');
      }

    } catch (error) {
      stats.failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      stats.errors.push({ docId: doc._id, error: errorMsg });
      console.log(` ❌`);
      console.error(`     Error: ${errorMsg}`);
    }
  }

  console.log(`\n📊 ${filename} Summary:`);
  console.log(`   Succeeded: ${stats.succeeded}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Failed: ${stats.failed}`);

  return stats;
}

async function importAllToSanity() {
  console.log('📦 Importing All Documents to Sanity\n');
  console.log('='.repeat(70));

  // Verify environment variables
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    console.error('❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
    console.error('❌ Missing NEXT_PUBLIC_SANITY_DATASET');
    process.exit(1);
  }
  if (!process.env.SANITY_API_EDITOR_TOKEN) {
    console.error('❌ Missing SANITY_API_EDITOR_TOKEN');
    process.exit(1);
  }

  console.log(`\n📊 Sanity Configuration:`);
  console.log(`   Project ID: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`);
  console.log(`   Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET?.replace(/"/g, '')}`);
  console.log(`\n💡 Import Order (for reference resolution):`);
  IMPORT_ORDER.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file}`);
  });

  // Import each file in order
  for (const filename of IMPORT_ORDER) {
    const stats = await importNDJSONFile(filename, true);
    importStats.push(stats);
  }

  // Generate final summary
  console.log(`\n${'='.repeat(70)}`);
  console.log(`\n✅ Import Complete!\n`);

  const totalDocs = importStats.reduce((sum, s) => sum + s.total, 0);
  const totalSucceeded = importStats.reduce((sum, s) => sum + s.succeeded, 0);
  const totalSkipped = importStats.reduce((sum, s) => sum + s.skipped, 0);
  const totalFailed = importStats.reduce((sum, s) => sum + s.failed, 0);

  console.log(`📊 Overall Summary:`);
  console.log(`   Total Documents: ${totalDocs}`);
  console.log(`   Succeeded: ${totalSucceeded}`);
  console.log(`   Skipped: ${totalSkipped} (already exist)`);
  console.log(`   Failed: ${totalFailed}`);

  console.log(`\n📋 Breakdown by File:`);
  importStats.forEach(stat => {
    const status = stat.failed > 0 ? '⚠️ ' : '✅';
    console.log(`   ${status} ${stat.file}: ${stat.succeeded}/${stat.total} succeeded`);
  });

  // Save detailed report
  const reportPath = path.join(OUTPUT_DIR, 'import-report.json');
  await fs.writeJson(reportPath, importStats, { spaces: 2 });
  console.log(`\n💾 Detailed report: ${reportPath}`);

  if (totalFailed > 0) {
    console.log(`\n⚠️  ${totalFailed} documents failed to import. Check errors above.`);
    console.log(`\n🔍 Failed Documents:`);
    importStats.forEach(stat => {
      if (stat.errors.length > 0) {
        console.log(`\n   ${stat.file}:`);
        stat.errors.forEach(err => {
          console.log(`     - ${err.docId}: ${err.error}`);
        });
      }
    });
  }

  console.log(`\n💡 Next Steps:`);
  console.log(`   1. Open Sanity Studio: pnpm sanity dev`);
  console.log(`   2. Verify all documents imported correctly`);
  console.log(`   3. Complete placeholder sections in homepage`);
  console.log(`   4. Add missing content (images, bios, descriptions)`);
  console.log(`   5. Add translations (ES, FR, AR)\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  importAllToSanity().catch(console.error);
}

export { importAllToSanity };
