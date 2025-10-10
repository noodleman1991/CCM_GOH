#!/usr/bin/env tsx
/**
 * Script 13: Upload PDFs to Sanity
 *
 * Uploads all downloaded PDFs to Sanity as file assets
 * Creates asset mapping for updating agenda documents
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@sanity/client';
import PQueue from 'p-queue';
import dotenv from 'dotenv';

// Load environment variables from parent directory
const envPath = path.join(process.cwd(), '..', '.env');
dotenv.config({ path: envPath });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
const REGISTRY_PATH = path.join(OUTPUT_DIR, 'pdf-download-registry.json');

const MAX_CONCURRENT = 2; // Conservative for large files
const RETRY_ATTEMPTS = 2;

interface DownloadRecord {
  originalUrl: string;
  filename: string;
  localPath: string;
  size: number;
  hash: string;
  downloadedAt: string;
  agendaId: string;
  version: 'full' | 'summary';
  language: string;
}

interface AssetUploadRecord extends DownloadRecord {
  sanityAssetId?: string;
  sanityUrl?: string;
  uploadedAt?: string;
  uploadError?: string;
}

const uploadRegistry: AssetUploadRecord[] = [];

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.replace(/"/g, '') || '',
  token: process.env.SANITY_API_EDITOR_TOKEN || '',
  apiVersion: '2024-10-31',
  useCdn: false,
});

async function uploadFile(
  filePath: string,
  filename: string,
  retries = RETRY_ATTEMPTS
): Promise<{ _id: string; url: string }> {
  try {
    console.log(`  📤 Uploading: ${filename}`);

    // Read file as buffer
    const fileBuffer = await fs.readFile(filePath);

    // Upload to Sanity
    const asset = await client.assets.upload('file', fileBuffer, {
      filename: filename,
      contentType: 'application/pdf',
    });

    return {
      _id: asset._id,
      url: asset.url,
    };

  } catch (error) {
    if (retries > 0) {
      console.log(`  ⚠️  Retry ${RETRY_ATTEMPTS - retries + 1}/${RETRY_ATTEMPTS}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return uploadFile(filePath, filename, retries - 1);
    }
    throw error;
  }
}

async function uploadPDFsToSanity() {
  console.log('📤 Uploading PDFs to Sanity\n');
  console.log('='.repeat(70) + '\n');

  // Check environment variables
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

  console.log(`📊 Sanity Configuration:`);
  console.log(`   Project ID: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`);
  console.log(`   Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET?.replace(/"/g, '')}\n`);

  // Load download registry
  if (!await fs.pathExists(REGISTRY_PATH)) {
    console.error('❌ pdf-download-registry.json not found');
    console.error('   Run: pnpm exec tsx scripts/2-download-pdfs.ts');
    process.exit(1);
  }

  const downloadRecords: DownloadRecord[] = await fs.readJson(REGISTRY_PATH);

  console.log(`📋 PDFs to upload: ${downloadRecords.length}\n`);

  // Setup upload queue
  const queue = new PQueue({ concurrency: MAX_CONCURRENT });

  let successCount = 0;
  let failCount = 0;

  for (const record of downloadRecords) {
    queue.add(async () => {
      const uploadRecord: AssetUploadRecord = { ...record };

      try {
        // Check if file exists
        if (!await fs.pathExists(record.localPath)) {
          throw new Error(`File not found: ${record.localPath}`);
        }

        // Upload to Sanity
        const { _id, url } = await uploadFile(record.localPath, record.filename);

        uploadRecord.sanityAssetId = _id;
        uploadRecord.sanityUrl = url;
        uploadRecord.uploadedAt = new Date().toISOString();

        uploadRegistry.push(uploadRecord);
        successCount++;

        console.log(`  ✅ Uploaded: ${record.filename}`);
        console.log(`     Asset ID: ${_id.substring(0, 30)}...`);

      } catch (error) {
        uploadRecord.uploadError = error instanceof Error ? error.message : String(error);
        uploadRegistry.push(uploadRecord);
        failCount++;

        console.error(`  ❌ Failed: ${record.filename}`);
        console.error(`     Error: ${uploadRecord.uploadError}`);
      }
    });
  }

  await queue.onIdle();

  // Save upload registry
  const uploadRegistryPath = path.join(OUTPUT_DIR, 'pdf-upload-registry.json');
  await fs.writeJson(uploadRegistryPath, uploadRegistry, { spaces: 2 });

  // Create asset mapping (for easy lookup)
  const assetMapping: Record<string, { assetId: string; url: string }> = {};
  uploadRegistry.forEach(record => {
    if (record.sanityAssetId && record.sanityUrl) {
      assetMapping[record.originalUrl] = {
        assetId: record.sanityAssetId,
        url: record.sanityUrl,
      };
    }
  });

  const mappingPath = path.join(OUTPUT_DIR, 'pdf-asset-mapping.json');
  await fs.writeJson(mappingPath, assetMapping, { spaces: 2 });

  // Generate summary
  const totalSize = uploadRegistry.reduce((sum, rec) => sum + rec.size, 0);
  const byLanguage: Record<string, number> = {};

  uploadRegistry.forEach(rec => {
    if (rec.sanityAssetId) {
      byLanguage[rec.language] = (byLanguage[rec.language] || 0) + 1;
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ PDF Upload Complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   Uploaded: ${successCount} PDFs`);
  console.log(`   Failed: ${failCount} PDFs`);
  console.log(`   Total: ${uploadRegistry.length} PDFs`);
  console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  if (successCount > 0) {
    console.log(`\n🌍 Uploaded by Language:`);
    Object.entries(byLanguage)
      .sort(([, a], [, b]) => b - a)
      .forEach(([lang, count]) => {
        console.log(`   ${lang.toUpperCase()}: ${count} PDFs`);
      });
  }

  console.log(`\n💾 Files saved:`);
  console.log(`   - ${uploadRegistryPath}`);
  console.log(`   - ${mappingPath} (asset ID lookup)`);

  if (failCount > 0) {
    console.log(`\n⚠️  ${failCount} PDFs failed to upload. Check errors above.`);
  }

  console.log(`\n💡 Next Step: Update agendas NDJSON with file references\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  uploadPDFsToSanity().catch(console.error);
}

export { uploadPDFsToSanity };
