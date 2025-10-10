#!/usr/bin/env tsx
/**
 * Script 10a: Update Agendas with File References
 *
 * Updates agendas.ndjson by replacing _pdfUrls with proper files array
 * containing references to uploaded Sanity file assets
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const AGENDAS_PATH = path.join(OUTPUT_DIR, 'agendas.ndjson');
const MAPPING_PATH = path.join(OUTPUT_DIR, 'pdf-asset-mapping.json');

interface PDFDocument {
  language: string;
  url: string;
  filename: string;
}

interface Agenda {
  _type: 'agenda';
  _id: string;
  title: any;
  slug: any;
  agendaType: string;
  publishDate: string;
  year: number;
  accessLevel: string;
  featured: boolean;
  totalDownloadCount: number;
  regionalCommunities?: any[];
  _pdfUrls?: PDFDocument[];
  files?: any[];
}

interface AssetMapping {
  [url: string]: {
    assetId: string;
    url: string;
  };
}

function generateKey(): string {
  return Math.random().toString(36).substring(2, 11);
}

async function updateAgendasWithFiles() {
  console.log('🔄 Updating Agendas with File References\n');
  console.log('='.repeat(70) + '\n');

  // Check if mapping file exists
  if (!await fs.pathExists(MAPPING_PATH)) {
    console.error('❌ pdf-asset-mapping.json not found');
    console.error('   Run: pnpm exec tsx scripts/13-upload-pdfs-to-sanity.ts');
    process.exit(1);
  }

  // Check if agendas file exists
  if (!await fs.pathExists(AGENDAS_PATH)) {
    console.error('❌ agendas.ndjson not found');
    console.error('   Run: pnpm exec tsx scripts/10-generate-agendas-ndjson.ts');
    process.exit(1);
  }

  // Load asset mapping
  const assetMapping: AssetMapping = await fs.readJson(MAPPING_PATH);
  console.log(`📋 Loaded ${Object.keys(assetMapping).length} asset mappings\n`);

  // Load agendas
  const ndjsonContent = await fs.readFile(AGENDAS_PATH, 'utf-8');
  const agendas: Agenda[] = ndjsonContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  console.log(`📄 Processing ${agendas.length} agenda documents\n`);

  let updateCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  const updatedAgendas = agendas.map(agenda => {
    if (!agenda._pdfUrls || agenda._pdfUrls.length === 0) {
      skipCount++;
      return agenda;
    }

    try {
      // Convert _pdfUrls to files array
      const files = agenda._pdfUrls.map((pdf) => {
        const mapping = assetMapping[pdf.url];

        if (!mapping) {
          console.warn(`  ⚠️  No asset found for: ${pdf.filename}`);
          return null;
        }

        return {
          _key: generateKey(),
          _type: 'object',
          language: pdf.language,
          file: {
            _type: 'file',
            asset: {
              _type: 'reference',
              _ref: mapping.assetId,
            },
          },
          downloadCount: 0,
        };
      }).filter(Boolean); // Remove nulls

      if (files.length > 0) {
        agenda.files = files;
        delete agenda._pdfUrls; // Remove temporary field
        updateCount++;
        console.log(`  ✅ Updated: ${agenda.title.en} (${files.length} files)`);
      } else {
        errorCount++;
        console.error(`  ❌ No files mapped for: ${agenda.title.en}`);
      }

    } catch (error) {
      errorCount++;
      console.error(`  ❌ Error processing: ${agenda.title.en}`);
      console.error(`     ${error instanceof Error ? error.message : String(error)}`);
    }

    return agenda;
  });

  // Save updated NDJSON
  const updatedNdjson = updatedAgendas
    .map(agenda => JSON.stringify(agenda))
    .join('\n');

  await fs.writeFile(AGENDAS_PATH, updatedNdjson);

  // Also save as JSON for review
  const jsonPath = path.join(OUTPUT_DIR, 'agendas-with-files.json');
  await fs.writeJson(jsonPath, updatedAgendas, { spaces: 2 });

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Agendas Updated!');
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updateCount} agendas`);
  console.log(`   Skipped: ${skipCount} agendas (no PDFs)`);
  console.log(`   Errors: ${errorCount} agendas`);
  console.log(`   Total: ${agendas.length} agendas`);

  console.log(`\n💾 Files saved:`);
  console.log(`   - ${AGENDAS_PATH} (updated for import)`);
  console.log(`   - ${jsonPath} (for review)`);

  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount} agendas had errors. Check warnings above.`);
  }

  console.log(`\n💡 Next Step: Run Script 14 to import all NDJSON to Sanity\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateAgendasWithFiles().catch(console.error);
}

export { updateAgendasWithFiles };
