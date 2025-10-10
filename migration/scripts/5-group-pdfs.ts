#!/usr/bin/env tsx
/**
 * Phase 4: PDF Grouping Script
 * Groups 59 PDFs into ~15-20 multilingual agenda documents
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

interface PDFEntry {
  url: string;
  filename: string;
  baseName: string;
  language?: string;
  region?: string;
  type: 'regional' | 'global' | 'community' | 'toolkit' | 'report' | 'other';
}

interface PDFGroup {
  groupId: string;
  baseName: string;
  title: string;
  type: 'regional' | 'global' | 'community' | 'toolkit' | 'report';
  region?: string;
  pdfs: Array<{
    language: string;
    url: string;
    filename: string;
  }>;
}

/**
 * Extract all PDF URLs from scraped JSON files
 */
async function extractAllPDFs(): Promise<PDFEntry[]> {
  console.log('📑 Extracting PDF URLs from scraped content...\n');

  const allPDFs: PDFEntry[] = [];
  const files = await fs.readdir(DATA_DIR);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filePath = path.join(DATA_DIR, file);
    const data = await fs.readJson(filePath);

    // Extract PDFs from content HTML
    const content = data.content || '';
    const pdfMatches = content.match(/https?:\/\/[^"\s]+\.pdf/gi);

    if (pdfMatches) {
      for (const url of pdfMatches) {
        const cleanUrl = url.replace(/[")]/g, '');
        const filename = decodeURIComponent(cleanUrl.split('/').pop() || '');

        if (filename && !allPDFs.some(p => p.url === cleanUrl)) {
          allPDFs.push({
            url: cleanUrl,
            filename,
            baseName: '', // Will be computed
            region: file.includes('_rc_') ? file.replace('page_rc_', '').replace('_.json', '').replace('.json', '') : undefined,
            type: 'other', // Will be classified
          });
        }
      }
    }
  }

  console.log(`  Found ${allPDFs.length} unique PDF URLs\n`);
  return allPDFs;
}

/**
 * Normalize filename to extract base name
 */
function normalizeFilename(filename: string): string {
  let normalized = filename
    .replace(/\.pdf$/i, '')
    .replace(/_compressed/gi, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove language suffixes
  normalized = normalized
    .replace(/-EN$/i, '')
    .replace(/-ES$/i, '')
    .replace(/-FR$/i, '')
    .replace(/-PT$/i, '')
    .replace(/-AR$/i, '')
    .replace(/\s+EN$/i, '')
    .replace(/\s+ES$/i, '')
    .replace(/\s+FR$/i, '')
    .replace(/\s+PT$/i, '')
    .replace(/\s+AR$/i, '');

  // Remove common variations
  normalized = normalized
    .replace(/\(summary\)/gi, 'Summary')
    .replace(/\s+Summary$/i, '')
    .replace(/Full\s+RRAA\s+/gi, '')
    .replace(/RRAA\s+/gi, '');

  return normalized.trim();
}

/**
 * Extract language from filename
 */
function extractLanguage(filename: string): string {
  const lower = filename.toLowerCase();

  if (/-en\.pdf$/i.test(filename) || /\sen\.pdf$/i.test(filename)) return 'en';
  if (/-es\.pdf$/i.test(filename) || /\ses\.pdf$/i.test(filename)) return 'es';
  if (/-fr\.pdf$/i.test(filename) || /\sfr\.pdf$/i.test(filename)) return 'fr';
  if (/-pt\.pdf$/i.test(filename) || /\spt\.pdf$/i.test(filename)) return 'pt';
  if (/-ar\.pdf$/i.test(filename) || /\sar\.pdf$/i.test(filename)) return 'ar';

  // Check for "Summary" variations
  if (/Summary-ES/i.test(filename)) return 'es';
  if (/Summary-FR/i.test(filename)) return 'fr';
  if (/Summary-PT/i.test(filename)) return 'pt';
  if (/Summary-AR/i.test(filename)) return 'ar';

  // Default to English if no language marker
  return 'en';
}

/**
 * Classify PDF type and region
 */
function classifyPDF(pdf: PDFEntry): void {
  const lowerFilename = pdf.filename.toLowerCase();
  const lowerBaseName = pdf.baseName.toLowerCase();

  // Regional agendas
  if (lowerFilename.includes('latin america') || lowerFilename.includes('lac')) {
    pdf.type = 'regional';
    pdf.region = 'latin-america-and-the-caribbean';
  } else if (lowerFilename.includes('sub-saharan africa') || lowerFilename.includes('ssa')) {
    pdf.type = 'regional';
    pdf.region = 'sub-saharan-africa';
  } else if (lowerFilename.includes('central') && lowerFilename.includes('southern asia')) {
    pdf.type = 'regional';
    pdf.region = 'central-and-southern-asia';
  } else if (lowerFilename.includes('eastern') && lowerFilename.includes('south') && lowerFilename.includes('asia')) {
    pdf.type = 'regional';
    pdf.region = 'eastern-and-south-eastern-asia';
  } else if (lowerFilename.includes('northern africa') || lowerFilename.includes('western asia') || lowerFilename.includes('nawa')) {
    pdf.type = 'regional';
    pdf.region = 'northern-africa-and-western-asia';
  } else if (lowerFilename.includes('oceania')) {
    pdf.type = 'regional';
    pdf.region = 'oceania';
  } else if (lowerFilename.includes('europe') || lowerFilename.includes('northern america')) {
    pdf.type = 'regional';
    pdf.region = 'europe-and-northern-america';
  }
  // Global agendas
  else if (lowerFilename.includes('global')) {
    pdf.type = 'global';
  }
  // Community agendas
  else if (lowerFilename.includes('community')) {
    pdf.type = 'community';
  }
  // Toolkits
  else if (lowerFilename.includes('toolkit')) {
    pdf.type = 'toolkit';
  }
  // Reports
  else if (lowerFilename.includes('report') || lowerFilename.includes('impact')) {
    pdf.type = 'report';
  }
}

/**
 * Group PDFs by base name and language
 */
function groupPDFs(pdfs: PDFEntry[]): PDFGroup[] {
  console.log('🔗 Grouping PDFs by base name and language...\n');

  // Process PDFs
  for (const pdf of pdfs) {
    pdf.baseName = normalizeFilename(pdf.filename);
    pdf.language = extractLanguage(pdf.filename);
    classifyPDF(pdf);
  }

  // Group by base name
  const groupsMap = new Map<string, PDFEntry[]>();

  for (const pdf of pdfs) {
    const key = `${pdf.type}-${pdf.region || 'global'}-${pdf.baseName}`;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }

    groupsMap.get(key)!.push(pdf);
  }

  // Convert to PDFGroup objects
  const groups: PDFGroup[] = [];

  for (const [key, groupPdfs] of groupsMap.entries()) {
    const firstPdf = groupPdfs[0];

    // Generate group title
    let title = firstPdf.baseName;

    if (firstPdf.type === 'regional' && firstPdf.region) {
      const regionName = firstPdf.region
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (!title.toLowerCase().includes(regionName.toLowerCase())) {
        title = `${regionName} ${title}`;
      }
    }

    // Clean up title
    title = title
      .replace(/CCM\s+/gi, '')
      .replace(/\s+compressed/gi, '')
      .trim();

    const group: PDFGroup = {
      groupId: key.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
      baseName: firstPdf.baseName,
      title,
      type: firstPdf.type,
      region: firstPdf.region,
      pdfs: groupPdfs.map(pdf => ({
        language: pdf.language || 'en',
        url: pdf.url,
        filename: pdf.filename,
      })),
    };

    groups.push(group);

    console.log(`  ✓ ${group.type.toUpperCase()}: "${group.title}" (${group.pdfs.length} languages: ${group.pdfs.map(p => p.language).join(', ')})`);
  }

  return groups;
}

/**
 * Main execution
 */
async function groupAllPDFs() {
  console.log('📊 Phase 4: PDF Grouping\n');
  console.log('=' .repeat(60) + '\n');

  // Extract PDFs
  const allPDFs = await extractAllPDFs();

  // Group PDFs
  const groups = groupPDFs(allPDFs);

  // Save results
  await fs.ensureDir(OUTPUT_DIR);
  await fs.writeJson(path.join(OUTPUT_DIR, 'pdf-groups.json'), groups, { spaces: 2 });

  // Generate report
  const report = `# PDF Grouping Report

**Generated:** ${new Date().toISOString()}

## Summary

- **Total PDFs Found:** ${allPDFs.length}
- **Grouped into:** ${groups.length} agenda documents
- **Average languages per agenda:** ${(allPDFs.length / groups.length).toFixed(1)}

## Groups by Type

### Regional Agendas (${groups.filter(g => g.type === 'regional').length})

${groups
  .filter(g => g.type === 'regional')
  .map(g => `- **${g.title}**\n  - Region: ${g.region}\n  - Languages: ${g.pdfs.map(p => p.language.toUpperCase()).join(', ')}`)
  .join('\n\n')}

### Global Agendas (${groups.filter(g => g.type === 'global').length})

${groups
  .filter(g => g.type === 'global')
  .map(g => `- **${g.title}**\n  - Languages: ${g.pdfs.map(p => p.language.toUpperCase()).join(', ')}`)
  .join('\n\n')}

### Community Agendas (${groups.filter(g => g.type === 'community').length})

${groups
  .filter(g => g.type === 'community')
  .map(g => `- **${g.title}**\n  - Languages: ${g.pdfs.map(p => p.language.toUpperCase()).join(', ')}`)
  .join('\n\n')}

### Toolkits (${groups.filter(g => g.type === 'toolkit').length})

${groups
  .filter(g => g.type === 'toolkit')
  .map(g => `- **${g.title}**\n  - Languages: ${g.pdfs.map(p => p.language.toUpperCase()).join(', ')}`)
  .join('\n\n')}

### Other Reports (${groups.filter(g => g.type === 'report' || g.type === 'other').length})

${groups
  .filter(g => g.type === 'report' || g.type === 'other')
  .map(g => `- **${g.title}**\n  - Languages: ${g.pdfs.map(p => p.language.toUpperCase()).join(', ')}`)
  .join('\n\n')}

## Next Steps

1. Review grouping in \`pdf-groups.json\`
2. Manually verify any ambiguous groupings
3. Proceed to Phase 5: Organization & People Parsing

---

**Note:** Some PDFs may need manual review for correct grouping.
`;

  await fs.writeFile(path.join(OUTPUT_DIR, 'pdf-grouping-report.md'), report);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n✅ PDF Grouping Complete!`);
  console.log(`   Total PDFs: ${allPDFs.length}`);
  console.log(`   Groups: ${groups.length}`);
  console.log(`   Regional: ${groups.filter(g => g.type === 'regional').length}`);
  console.log(`   Global: ${groups.filter(g => g.type === 'global').length}`);
  console.log(`   Community: ${groups.filter(g => g.type === 'community').length}`);
  console.log(`   Toolkit: ${groups.filter(g => g.type === 'toolkit').length}`);
  console.log(`   Other: ${groups.filter(g => g.type === 'report' || g.type === 'other').length}`);
  console.log(`\n📄 Output:`);
  console.log(`   - ${OUTPUT_DIR}/pdf-groups.json`);
  console.log(`   - ${OUTPUT_DIR}/pdf-grouping-report.md`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  groupAllPDFs().catch(console.error);
}

export { groupAllPDFs };
