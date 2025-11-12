// #!/usr/bin/env tsx
// /**
//  * Phase 4 (Improved): PDF Grouping Script
//  * Groups 59 PDFs into ~15-20 multilingual agenda documents
//  * - Groups Full and Summary versions together
//  * - Groups multilingual versions together
//  * - Properly normalizes names
//  */
//
// import fs from 'fs-extra';
// import path from 'path';
// import { fileURLToPath } from 'url';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const DATA_DIR = path.join(__dirname, '..', 'data');
// const OUTPUT_DIR = path.join(__dirname, '..', 'output');
//
// interface PDFEntry {
//   url: string;
//   filename: string;
//   baseName: string;
//   language: string;
//   region?: string;
//   type: 'regional' | 'global' | 'community' | 'toolkit' | 'report';
//   variant?: 'full' | 'summary';
// }
//
// interface PDFGroup {
//   groupId: string;
//   baseName: string;
//   title: string;
//   type: 'regional' | 'global' | 'community' | 'toolkit' | 'report';
//   region?: string;
//   versions: {
//     full?: Array<{ language: string; url: string; filename: string }>;
//     summary?: Array<{ language: string; url: string; filename: string }>;
//   };
// }
//
// /**
//  * Extract all PDF URLs from scraped JSON files
//  */
// async function extractAllPDFs(): Promise<PDFEntry[]> {
//   console.log('📑 Extracting PDF URLs from scraped content...\n');
//
//   const allPDFs: PDFEntry[] = [];
//   const files = await fs.readdir(DATA_DIR);
//
//   for (const file of files) {
//     if (!file.endsWith('.json')) continue;
//
//     const filePath = path.join(DATA_DIR, file);
//     const data = await fs.readJson(filePath);
//
//     // Extract PDFs from content HTML
//     const content = data.content || '';
//     const pdfMatches = content.match(/https?:\/\/[^"\s]+\.pdf/gi);
//
//     if (pdfMatches) {
//       for (const url of pdfMatches) {
//         const cleanUrl = url.replace(/[")]/g, '');
//         const filename = decodeURIComponent(cleanUrl.split('/').pop() || '');
//
//         if (filename && !allPDFs.some(p => p.url === cleanUrl)) {
//           allPDFs.push({
//             url: cleanUrl,
//             filename,
//             baseName: '', // Will be computed
//             language: 'en', // Will be detected
//             type: 'report', // Will be classified
//           });
//         }
//       }
//     }
//   }
//
//   console.log(`  Found ${allPDFs.length} unique PDF URLs\n`);
//   return allPDFs;
// }
//
// /**
//  * Normalize filename to extract base agenda name
//  */
// function normalizeAgendaName(filename: string): { baseName: string; variant: 'full' | 'summary' } {
//   let normalized = filename
//     .replace(/\.pdf$/i, '')
//     .replace(/_compressed/gi, '')
//     .replace(/-compressed/gi, '')
//     .replace(/\s+compressed/gi, '')
//     .replace(/Full\s+RRAA\s+/gi, '')
//     .replace(/Full\s+TRAA\s+/gi, '')
//     .replace(/\s+Full$/gi, '')
//     .replace(/\(1\)$/g, '')
//     .replace(/\(1$/g, '') // Handle truncated (1
//     .replace(/_/g, ' ')
//     .replace(/\s+/g, ' ')
//     .trim();
//
//   // Detect variant (full vs summary)
//   const isSummary = /summary|slide deck/i.test(normalized);
//   const variant: 'full' | 'summary' = isSummary ? 'summary' : 'full';
//
//   // Remove variant indicators
//   normalized = normalized
//     .replace(/\s+Summary\s+Slide\s+Deck$/gi, '')
//     .replace(/\s+Summary$/gi, '')
//     .replace(/\s+\(summary[^)]*\)/gi, '')
//     .replace(/\s+Regional\s+Research\s+and\s+Action\s+Agenda\s+Summary$/gi, ' Regional Agenda')
//     .replace(/\s+Research\s+and\s+Action\s+Agenda\s+Summary$/gi, ' Agenda')
//     .replace(/\s+Regional\s+Research\s+and\s+Action\s+Agenda$/gi, ' Regional Agenda')
//     .replace(/\s+Research\s+and\s+Action\s+Agenda$/gi, ' Agenda')
//     .trim();
//
//   // Remove language suffixes
//   normalized = normalized
//     .replace(/-EN$/i, '')
//     .replace(/-ES$/i, '')
//     .replace(/-FR$/i, '')
//     .replace(/-PT$/i, '')
//     .replace(/-AR$/i, '')
//     .replace(/\s+\(English\)$/i, '')
//     .replace(/\s+\(Spanish\)$/i, '')
//     .replace(/\s+\(French\)$/i, '')
//     .replace(/\s+\(Portuguese\)$/i, '')
//     .replace(/\s+\(Arabic\)$/i, '')
//     .trim();
//
//   // Standardize region names
//   normalized = normalized
//     .replace(/Latin America And The Caribbean/gi, 'Latin America and the Caribbean')
//     .replace(/Sub Saharan Africa/gi, 'Sub-Saharan Africa')
//     .replace(/Northern Africa And Western Asia/gi, 'Northern Africa and Western Asia')
//     .replace(/Eastern And South Eastern Asia/gi, 'Eastern and South-Eastern Asia')
//     .replace(/Central And Southern Asia/gi, 'Central and Southern Asia')
//     .replace(/^(LAC|SSA|ESEA|CSA|NAWA|ENA|OCE)\s+/i, ''); // Remove acronyms
//
//   return { baseName: normalized, variant };
// }
//
// /**
//  * Extract language from filename
//  */
// function extractLanguage(filename: string): string {
//   const lower = filename.toLowerCase();
//
//   // Check for explicit language in filename
//   if (/\(arabic\)|arabic/i.test(filename)) return 'ar';
//   if (/\(spanish\)|spanish/i.test(filename)) return 'es';
//   if (/\(french\)|french|francais/i.test(filename)) return 'fr';
//   if (/\(portuguese\)|portuguese/i.test(filename)) return 'pt';
//   if (/\(english\)|english/i.test(filename)) return 'en';
//
//   // Check for language codes
//   if (/-ar\.pdf$/i.test(filename) || /\sar\.pdf$/i.test(filename)) return 'ar';
//   if (/-es\.pdf$/i.test(filename) || /\ses\.pdf$/i.test(filename)) return 'es';
//   if (/-fr\.pdf$/i.test(filename) || /\sfr\.pdf$/i.test(filename)) return 'fr';
//   if (/-pt\.pdf$/i.test(filename) || /\spt\.pdf$/i.test(filename)) return 'pt';
//   if (/-en\.pdf$/i.test(filename) || /\sen\.pdf$/i.test(filename)) return 'en';
//
//   // Default to English
//   return 'en';
// }
//
// /**
//  * Classify PDF type and region
//  */
// function classifyPDF(pdf: PDFEntry): void {
//   const lowerFilename = pdf.filename.toLowerCase();
//
//   // Regional agendas
//   if (/latin america|lac|caribbean/i.test(lowerFilename)) {
//     pdf.type = 'regional';
//     pdf.region = 'latin-america-and-the-caribbean';
//   } else if (/sub-saharan africa|ssa/i.test(lowerFilename)) {
//     pdf.type = 'regional';
//     pdf.region = 'sub-saharan-africa';
//   } else if (/central.*southern asia|csa/i.test(lowerFilename)) {
//     pdf.type = 'regional';
//     pdf.region = 'central-and-southern-asia';
//   } else if (/eastern.*south.*asia|esea/i.test(lowerFilename)) {
//     pdf.type = 'regional';
//     pdf.region = 'eastern-and-south-eastern-asia';
//   } else if (/northern africa|western asia|nawa|mena/i.test(lowerFilename)) {
//     pdf.type = 'regional';
//     pdf.region = 'northern-africa-and-western-asia';
//   } else if (/oceania|oce/i.test(lowerFilename)) {
//     pdf.type = 'regional';
//     pdf.region = 'oceania';
//   } else if (/europe|northern america|ena/i.test(lowerFilename)) {
//     pdf.type = 'regional';
//     pdf.region = 'europe-and-northern-america';
//   }
//   // Community agendas (Youth, Indigenous, Farmers)
//   else if (/youth/i.test(lowerFilename)) {
//     pdf.type = 'community';
//   } else if (/indigenous/i.test(lowerFilename)) {
//     pdf.type = 'community';
//   } else if (/farmer|fisher/i.test(lowerFilename)) {
//     pdf.type = 'community';
//   }
//   // Toolkits
//   else if (/toolkit/i.test(lowerFilename)) {
//     pdf.type = 'toolkit';
//   }
//   // Impact Reports
//   else if (/impact report|event report/i.test(lowerFilename)) {
//     pdf.type = 'report';
//   }
//   // Global agendas
//   else if (/global/i.test(lowerFilename)) {
//     pdf.type = 'global';
//   }
//   // Default to report
//   else {
//     pdf.type = 'report';
//   }
// }
//
// /**
//  * Group PDFs by base name, variant, and language
//  */
// function groupPDFs(pdfs: PDFEntry[]): PDFGroup[] {
//   console.log('🔗 Grouping PDFs by agenda, variant, and language...\n');
//
//   // Process PDFs
//   for (const pdf of pdfs) {
//     const { baseName, variant } = normalizeAgendaName(pdf.filename);
//     pdf.baseName = baseName;
//     pdf.variant = variant;
//     pdf.language = extractLanguage(pdf.filename);
//     classifyPDF(pdf);
//   }
//
//   // Group by base name + type + region
//   const groupsMap = new Map<string, PDFEntry[]>();
//
//   for (const pdf of pdfs) {
//     // Skip RetentionSchedule and other irrelevant PDFs
//     if (/retention|workshop|declaration/i.test(pdf.filename)) {
//       continue;
//     }
//
//     const key = `${pdf.type}-${pdf.region || 'global'}-${pdf.baseName}`;
//
//     if (!groupsMap.has(key)) {
//       groupsMap.set(key, []);
//     }
//
//     groupsMap.get(key)!.push(pdf);
//   }
//
//   // Convert to PDFGroup objects
//   const groups: PDFGroup[] = [];
//
//   for (const [key, groupPdfs] of groupsMap.entries()) {
//     const firstPdf = groupPdfs[0];
//
//     // Generate group title
//     let title = firstPdf.baseName;
//
//     // Create versions object
//     const versions: {
//       full?: Array<{ language: string; url: string; filename: string }>;
//       summary?: Array<{ language: string; url: string; filename: string }>;
//     } = {};
//
//     // Organize by variant and language
//     for (const pdf of groupPdfs) {
//       const pdfData = {
//         language: pdf.language,
//         url: pdf.url,
//         filename: pdf.filename,
//       };
//
//       if (pdf.variant === 'full') {
//         if (!versions.full) versions.full = [];
//         versions.full.push(pdfData);
//       } else {
//         if (!versions.summary) versions.summary = [];
//         versions.summary.push(pdfData);
//       }
//     }
//
//     const group: PDFGroup = {
//       groupId: key.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
//       baseName: firstPdf.baseName,
//       title,
//       type: firstPdf.type,
//       region: firstPdf.region,
//       versions,
//     };
//
//     groups.push(group);
//
//     // Log the group
//     const fullLangs = versions.full?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     const summaryLangs = versions.summary?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     console.log(`  ✓ ${group.type.toUpperCase()}: "${group.title}"`);
//     console.log(`    Full: [${fullLangs}] | Summary: [${summaryLangs}]`);
//   }
//
//   return groups;
// }
//
// /**
//  * Main execution
//  */
// async function groupAllPDFs() {
//   console.log('📊 Phase 4 (Improved): PDF Grouping\n');
//   console.log('=' .repeat(60) + '\n');
//
//   // Extract PDFs
//   const allPDFs = await extractAllPDFs();
//
//   // Group PDFs
//   const groups = groupPDFs(allPDFs);
//
//   // Save results
//   await fs.ensureDir(OUTPUT_DIR);
//   await fs.writeJson(path.join(OUTPUT_DIR, 'pdf-groups-improved.json'), groups, { spaces: 2 });
//
//   // Count by type
//   const byType = {
//     regional: groups.filter(g => g.type === 'regional').length,
//     global: groups.filter(g => g.type === 'global').length,
//     community: groups.filter(g => g.type === 'community').length,
//     toolkit: groups.filter(g => g.type === 'toolkit').length,
//     report: groups.filter(g => g.type === 'report').length,
//   };
//
//   // Generate report
//   const report = `# Improved PDF Grouping Report
//
// **Generated:** ${new Date().toISOString()}
//
// ## Summary
//
// - **Total PDFs Found:** ${allPDFs.length}
// - **Grouped into:** ${groups.length} agenda documents
// - **Improvement:** Reduced from 61 groups to ${groups.length} by merging full/summary versions
//
// ## Groups by Type
//
// ### Regional Agendas (${byType.regional})
//
// ${groups
//   .filter(g => g.type === 'regional')
//   .map(g => {
//     const fullLangs = g.versions.full?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     const summaryLangs = g.versions.summary?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     return `- **${g.title}**
//   - Region: ${g.region}
//   - Full versions: ${fullLangs}
//   - Summary versions: ${summaryLangs}`;
//   })
//   .join('\n\n')}
//
// ### Global Agendas (${byType.global})
//
// ${groups
//   .filter(g => g.type === 'global')
//   .map(g => {
//     const fullLangs = g.versions.full?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     const summaryLangs = g.versions.summary?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     return `- **${g.title}**
//   - Full versions: ${fullLangs}
//   - Summary versions: ${summaryLangs}`;
//   })
//   .join('\n\n')}
//
// ### Community Agendas (${byType.community})
//
// ${groups
//   .filter(g => g.type === 'community')
//   .map(g => {
//     const fullLangs = g.versions.full?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     const summaryLangs = g.versions.summary?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     return `- **${g.title}**
//   - Full versions: ${fullLangs}
//   - Summary versions: ${summaryLangs}`;
//   })
//   .join('\n\n')}
//
// ### Toolkits (${byType.toolkit})
//
// ${groups
//   .filter(g => g.type === 'toolkit')
//   .map(g => {
//     const fullLangs = g.versions.full?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     return `- **${g.title}**
//   - Versions: ${fullLangs}`;
//   })
//   .join('\n\n')}
//
// ### Reports (${byType.report})
//
// ${groups
//   .filter(g => g.type === 'report')
//   .map(g => {
//     const fullLangs = g.versions.full?.map(p => p.language.toUpperCase()).join(', ') || 'none';
//     return `- **${g.title}**
//   - Versions: ${fullLangs}`;
//   })
//   .join('\n\n')}
//
// ## Next Steps
//
// 1. Review grouping in \`pdf-groups-improved.json\`
// 2. Verify full/summary versions are correctly grouped
// 3. Proceed to Phase 5: Generate NDJSON files
//
// ---
//
// **Note:** Successfully consolidated ${61 - groups.length} duplicate groups by merging full and summary versions.
// `;
//
//   await fs.writeFile(path.join(OUTPUT_DIR, 'pdf-grouping-improved-report.md'), report);
//
//   console.log('\n' + '='.repeat(60));
//   console.log('\n✅ Improved PDF Grouping Complete!');
//   console.log(`   Total PDFs: ${allPDFs.length}`);
//   console.log(`   Groups: ${groups.length} (down from 61)`);
//   console.log(`   Regional: ${byType.regional}`);
//   console.log(`   Global: ${byType.global}`);
//   console.log(`   Community: ${byType.community}`);
//   console.log(`   Toolkit: ${byType.toolkit}`);
//   console.log(`   Reports: ${byType.report}`);
//   console.log('\n📄 Output:');
//   console.log(`   - ${OUTPUT_DIR}/pdf-groups-improved.json`);
//   console.log(`   - ${OUTPUT_DIR}/pdf-grouping-improved-report.md`);
// }
//
// // Run if called directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   groupAllPDFs().catch(console.error);
// }
//
// export { groupAllPDFs };
