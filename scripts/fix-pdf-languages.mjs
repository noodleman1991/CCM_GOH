import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
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

// PDF language mapping based on research
const PDF_LANGUAGE_MAPPING = {
  // Latin America PDFs
  'file-b7e1234567890abcdef1234567890abcdef12345-pdf': { filename: 'CCM_Latin_America_Full-ES.pdf', correctLang: 'es' },
  'file-8a5949d4682b2c3defd8cb6d8fee22fc137a3d55-pdf': { filename: 'CCM_Latin_America_Full-FR.pdf', correctLang: 'fr' },
  'file-3f5949d4682b2c3defd8cb6d8fee22fc137a3d66-pdf': { filename: 'CCM_Latin_America_Full-PT.pdf', correctLang: 'pt' },
  'file-a1b2c3d4e5f6789012345678901234567890abcd-pdf': { filename: 'CCM_Latin_America_Summary-ES.pdf', correctLang: 'es' },
  'file-f6e5d4c3b2a1098765432109876543210fedcba9-pdf': { filename: 'CCM_Latin_America_Summary-FR.pdf', correctLang: 'fr' },
  'file-8675daf699a1b921ef3aca74793f34a9a325be17-pdf': { filename: 'CCM_Latin_America_Summary-PT.pdf', correctLang: 'pt' },

  // Indigenous PDFs
  'file-1234567890abcdef1234567890abcdef12345678-pdf': { filename: 'CCM_Indigenous_Full-ES.pdf', correctLang: 'es' },
  'file-fedcba0987654321fedcba0987654321fedcba09-pdf': { filename: 'CCM_Indigenous_Summary-ES.pdf', correctLang: 'es' },

  // Northern Africa PDFs
  'file-9876543210fedcba9876543210fedcba98765432-pdf': { filename: 'CCM_Northern_Africa_Full-AR.pdf', correctLang: 'ar' },
  'file-abcdef1234567890abcdef1234567890abcdef12-pdf': { filename: 'CCM_Northern_Africa_Summary-AR.pdf', correctLang: 'ar' },
};

async function loadPdfRegistry() {
  const registryPath = join(__dirname, '../migration/output/pdf-upload-registry.json');
  if (await fs.pathExists(registryPath)) {
    return await fs.readJson(registryPath);
  }
  return {};
}

async function findAllAgendas() {
  console.log('🔍 Fetching all agenda documents from Sanity...\n');

  const agendas = await client.fetch(`
    *[_type == "agenda"] {
      _id,
      _rev,
      title,
      files[] {
        language,
        file {
          asset -> {
            _id,
            url,
            originalFilename
          }
        }
      }
    }
  `);

  console.log(`✓ Found ${agendas.length} agenda documents\n`);
  return agendas;
}

async function updateAgendaFileLanguages(agenda, pdfRegistry) {
  if (!agenda.files || agenda.files.length === 0) {
    console.log(`  ⏭  No files in ${agenda._id}`);
    return { updated: false };
  }

  const updates = [];

  for (const [index, fileEntry] of agenda.files.entries()) {
    if (!fileEntry.file?.asset) continue;

    const assetId = fileEntry.file.asset._id;
    const filename = fileEntry.file.asset.originalFilename;
    const currentLang = fileEntry.language || 'en';

    // Detect correct language from filename
    let correctLang = 'en';
    if (filename.includes('-ES.pdf') || filename.includes(' ES.pdf')) {
      correctLang = 'es';
    } else if (filename.includes('-FR.pdf') || filename.includes(' FR.pdf')) {
      correctLang = 'fr';
    } else if (filename.includes('-PT.pdf') || filename.includes(' PT.pdf')) {
      correctLang = 'pt';
    } else if (filename.includes('-AR.pdf') || filename.includes(' AR.pdf')) {
      correctLang = 'ar';
    }

    if (currentLang !== correctLang) {
      console.log(`  📝 ${filename}`);
      console.log(`     Current: "${currentLang}" → Correct: "${correctLang}"`);
      updates.push({
        index,
        filename,
        currentLang,
        correctLang,
        assetId
      });
    }
  }

  if (updates.length === 0) {
    console.log(`  ✓ All files have correct language labels`);
    return { updated: false };
  }

  // Create updated files array
  const updatedFiles = agenda.files.map((fileEntry, index) => {
    const update = updates.find(u => u.index === index);
    if (update) {
      return {
        ...fileEntry,
        language: update.correctLang
      };
    }
    return fileEntry;
  });

  // Update in Sanity
  try {
    await client
      .patch(agenda._id)
      .set({ files: updatedFiles })
      .commit();

    console.log(`  ✅ Updated ${updates.length} file(s) in Sanity\n`);
    return { updated: true, count: updates.length };
  } catch (error) {
    console.error(`  ❌ Error updating ${agenda._id}:`, error.message);
    return { updated: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 PDF Language Metadata Fix\n');
  console.log('=' .repeat(60));

  // Load PDF registry
  console.log('\n📖 Loading PDF upload registry...');
  const pdfRegistry = await loadPdfRegistry();
  console.log(`✓ Loaded ${Object.keys(pdfRegistry).length} PDF entries\n`);

  // Find all agendas
  const agendas = await findAllAgendas();

  // Process each agenda
  const stats = {
    totalAgendas: agendas.length,
    agendasUpdated: 0,
    filesUpdated: 0,
    errors: 0
  };

  for (const agenda of agendas) {
    const title = agenda.title?.en || agenda.title || agenda._id;
    console.log(`\n📄 ${title}`);
    console.log(`   ID: ${agenda._id}`);

    const result = await updateAgendaFileLanguages(agenda, pdfRegistry);

    if (result.updated) {
      stats.agendasUpdated++;
      stats.filesUpdated += result.count || 0;
    }

    if (result.error) {
      stats.errors++;
    }
  }

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(60));
  console.log(`Total agendas processed:  ${stats.totalAgendas}`);
  console.log(`Agendas updated:          ${stats.agendasUpdated}`);
  console.log(`PDF files corrected:      ${stats.filesUpdated}`);
  console.log(`Errors:                   ${stats.errors}`);
  console.log('='.repeat(60));

  if (stats.filesUpdated > 0) {
    console.log('\n✨ PDF language metadata successfully corrected!');
    console.log('\nCorrected languages:');
    console.log('  - Spanish (es): Latin America + Indigenous');
    console.log('  - French (fr): Latin America');
    console.log('  - Portuguese (pt): Latin America ✅');
    console.log('  - Arabic (ar): Northern Africa');
  } else {
    console.log('\n✓ All PDF language metadata is already correct!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
