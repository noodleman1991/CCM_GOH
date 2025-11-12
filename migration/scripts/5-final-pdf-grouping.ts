// #!/usr/bin/env tsx
// /**
//  * Final PDF Grouping - Merge Full & Summary into Single Documents
//  * Target: ~15-18 agenda groups (7 regional + 1 global + 3 community + toolkits/reports)
//  * Each agenda has: full[languages] and summary[languages]
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
// interface PDFDocument {
//   language: string;
//   url: string;
//   filename: string;
// }
//
// interface AgendaGroup {
//   _id: string;
//   name: string; // Clean, elegant name
//   type: 'regional' | 'global' | 'community' | 'toolkit' | 'report';
//   region?: string;
//   full: PDFDocument[];
//   summary: PDFDocument[];
// }
//
// async function extractAllPDFs(): Promise<Array<{ url: string; filename: string }>> {
//   const allPDFs: Array<{ url: string; filename: string }> = [];
//   const files = await fs.readdir(DATA_DIR);
//
//   for (const file of files) {
//     if (!file.endsWith('.json')) continue;
//
//     const data = await fs.readJson(path.join(DATA_DIR, file));
//     const content = data.content || '';
//     const pdfMatches = content.match(/https?:\/\/[^"\s]+\.pdf/gi);
//
//     if (pdfMatches) {
//       for (const url of pdfMatches) {
//         const cleanUrl = url.replace(/[")]/g, '');
//         const filename = decodeURIComponent(cleanUrl.split('/').pop() || '');
//         if (filename && !allPDFs.some(p => p.url === cleanUrl)) {
//           allPDFs.push({ url: cleanUrl, filename });
//         }
//       }
//     }
//   }
//
//   return allPDFs;
// }
//
// function detectLanguage(filename: string): string {
//   if (/\(arabic\)|arabic/i.test(filename)) return 'ar';
//   if (/\(spanish\)|spanish/i.test(filename)) return 'es';
//   if (/\(french\)|french|francais/i.test(filename)) return 'fr';
//   if (/\(portuguese\)|portuguese/i.test(filename)) return 'pt';
//   return 'en'; // default
// }
//
// function isFullVersion(filename: string): boolean {
//   const lower = filename.toLowerCase();
//   // Summary if: contains "summary" or "slide deck"
//   if (/summary|slide deck/i.test(filename)) return false;
//   // Full if: contains "full" OR is a numbered version (18-03, 17-03) OR is a translated agenda (Arabic, Spanish, etc without "summary")
//   return /full|18-03|17-03|\(arabic|\(spanish|\(french|\(portuguese|\(compressed/i.test(filename);
// }
//
// function classifyAndNormalize(filename: string): {
//   type: 'regional' | 'global' | 'community' | 'toolkit' | 'report';
//   region?: string;
//   baseName: string;
//   isFull: boolean;
//   language: string;
// } {
//   const lower = filename.toLowerCase();
//   let type: 'regional' | 'global' | 'community' | 'toolkit' | 'report' = 'report';
//   let region: string | undefined;
//   let baseName = '';
//
//   // FIRST: Check for Global Agenda (must come before regional checks!)
//   if (/connecting climate minds global|ccm global|global research and action agenda/i.test(filename)) {
//     type = 'global';
//     baseName = 'Global Research and Action Agenda';
//     return { type, baseName, isFull: isFullVersion(filename), language: detectLanguage(filename) };
//   }
//
//   // Regional Agendas
//   if (/latin america|lac|caribbean/.test(lower)) {
//     type = 'regional';
//     region = 'latin-america-and-the-caribbean';
//     baseName = 'Latin America and the Caribbean Regional Agenda';
//   } else if (/sub-saharan africa|ssa/.test(lower)) {
//     type = 'regional';
//     region = 'sub-saharan-africa';
//     baseName = 'Sub-Saharan Africa Regional Agenda';
//   } else if (/central.*southern asia|csa/.test(lower)) {
//     type = 'regional';
//     region = 'central-and-southern-asia';
//     baseName = 'Central and Southern Asia Regional Agenda';
//   } else if (/eastern.*south.*asia|esea/.test(lower)) {
//     type = 'regional';
//     region = 'eastern-and-south-eastern-asia';
//     baseName = 'Eastern and South-Eastern Asia Regional Agenda';
//   } else if (/northern africa|western asia|nawa|mena/.test(lower)) {
//     type = 'regional';
//     region = 'northern-africa-and-western-asia';
//     baseName = 'Northern Africa and Western Asia Regional Agenda';
//   } else if (/oceania/.test(lower)) {
//     type = 'regional';
//     region = 'oceania';
//     baseName = 'Oceania Regional Agenda';
//   } else if (/europe.*northern america|ena/.test(lower)) {
//     type = 'regional';
//     region = 'europe-and-northern-america';
//     baseName = 'Europe and Northern America Regional Agenda';
//   }
//   // Community Agendas
//   else if (/youth/i.test(lower)) {
//     type = 'community';
//     baseName = 'Youth Research and Action Agenda';
//   } else if (/indigenous/i.test(lower)) {
//     type = 'community';
//     baseName = 'Indigenous Communities Research and Action Agenda';
//   } else if (/farmer|fisher/i.test(lower)) {
//     type = 'community';
//     baseName = 'Small Farmers and Fisher Peoples Research and Action Agenda';
//   }
//   // Toolkits
//   else if (/toolkit/i.test(lower)) {
//     type = 'toolkit';
//     if (/humanitarian/i.test(lower)) {
//       baseName = 'Humanitarian Toolkit';
//     } else if (/lived experience|le toolkit/i.test(lower)) {
//       baseName = 'Lived Experience Toolkit';
//     } else if (/research/i.test(lower)) {
//       baseName = 'Research Toolkit';
//     } else {
//       baseName = 'Toolkit';
//     }
//   }
//   // Reports
//   else if (/impact report/i.test(lower)) {
//     type = 'report';
//     if (/global/i.test(lower)) {
//       baseName = 'Global Event Impact Report';
//     } else if (/regional/i.test(lower)) {
//       baseName = 'Regional Impact Report';
//     } else if (/thematic/i.test(lower)) {
//       baseName = 'Thematic Impact Report';
//     } else {
//       baseName = 'Impact Report';
//     }
//   }
//   // Skip irrelevant files
//   else if (/retention|workshop|declaration/i.test(lower)) {
//     type = 'report';
//     baseName = '_SKIP_';
//   }
//
//   return {
//     type,
//     region,
//     baseName,
//     isFull: isFullVersion(filename),
//     language: detectLanguage(filename),
//   };
// }
//
// async function groupPDFsFinal() {
//   console.log('📊 Final PDF Grouping - Merge Full & Summary\n');
//   console.log('='.repeat(70) + '\n');
//
//   const allPDFs = await extractAllPDFs();
//   console.log(`Found ${allPDFs.length} PDFs\n`);
//
//   // Group by base name
//   const groupsMap = new Map<string, AgendaGroup>();
//
//   for (const pdf of allPDFs) {
//     const classified = classifyAndNormalize(pdf.filename);
//
//     // Skip irrelevant files
//     if (classified.baseName === '_SKIP_') continue;
//     if (!classified.baseName) continue; // Unknown files
//
//     const groupKey = classified.region
//       ? `${classified.type}-${classified.region}`
//       : `${classified.type}-${classified.baseName.toLowerCase().replace(/\s+/g, '-')}`;
//
//     // Initialize group if doesn't exist
//     if (!groupsMap.has(groupKey)) {
//       groupsMap.set(groupKey, {
//         _id: groupKey,
//         name: classified.baseName,
//         type: classified.type,
//         region: classified.region,
//         full: [],
//         summary: [],
//       });
//     }
//
//     const group = groupsMap.get(groupKey)!;
//
//     // Add to full or summary array
//     const pdfDoc: PDFDocument = {
//       language: classified.language,
//       url: pdf.url,
//       filename: pdf.filename,
//     };
//
//     if (classified.isFull) {
//       group.full.push(pdfDoc);
//     } else {
//       group.summary.push(pdfDoc);
//     }
//   }
//
//   // Convert to array and sort
//   const groups = Array.from(groupsMap.values()).sort((a, b) => {
//     // Sort: Regional, Global, Community, Toolkit, Report
//     const typeOrder = { regional: 1, global: 2, community: 3, toolkit: 4, report: 5 };
//     if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
//     return a.name.localeCompare(b.name);
//   });
//
//   // Log results
//   console.log('📋 Grouped Agendas:\n');
//   for (const group of groups) {
//     const fullLangs = [...new Set(group.full.map(p => p.language.toUpperCase()))].join(', ') || 'none';
//     const summaryLangs = [...new Set(group.summary.map(p => p.language.toUpperCase()))].join(', ') || 'none';
//
//     console.log(`  ${group.type.toUpperCase()}: ${group.name}`);
//     console.log(`    Full: [${fullLangs}] (${group.full.length} files)`);
//     console.log(`    Summary: [${summaryLangs}] (${group.summary.length} files)`);
//     if (group.region) console.log(`    Region: ${group.region}`);
//     console.log('');
//   }
//
//   // Save results
//   await fs.ensureDir(OUTPUT_DIR);
//   await fs.writeJson(path.join(OUTPUT_DIR, 'final-agenda-groups.json'), groups, { spaces: 2 });
//
//   // Generate report
//   const byType = {
//     regional: groups.filter(g => g.type === 'regional').length,
//     global: groups.filter(g => g.type === 'global').length,
//     community: groups.filter(g => g.type === 'community').length,
//     toolkit: groups.filter(g => g.type === 'toolkit').length,
//     report: groups.filter(g => g.type === 'report').length,
//   };
//
//   const report = `# Final Agenda Grouping Report
//
// **Generated:** ${new Date().toISOString()}
//
// ## Summary
//
// - **Total Agenda Documents:** ${groups.length}
// - **Improvement:** Reduced from 61 → ${groups.length} by intelligent merging
//
// ## Breakdown by Type
//
// - Regional Agendas: ${byType.regional}
// - Global Agendas: ${byType.global}
// - Community Agendas: ${byType.community}
// - Toolkits: ${byType.toolkit}
// - Reports: ${byType.report}
//
// ---
//
// ## All Agendas
//
// ${groups
//   .map(g => {
//     const fullLangs = [...new Set(g.full.map(p => p.language.toUpperCase()))].join(', ') || 'none';
//     const summaryLangs = [...new Set(g.summary.map(p => p.language.toUpperCase()))].join(', ') || 'none';
//     return `### ${g.name}
//
// - **Type:** ${g.type}${g.region ? `\n- **Region:** ${g.region}` : ''}
// - **Full Versions:** ${fullLangs} (${g.full.length} files)
// - **Summary Versions:** ${summaryLangs} (${g.summary.length} files)
//
// **Full PDFs:**
// ${g.full.map(p => `  - [${p.language.toUpperCase()}] ${p.filename}`).join('\n') || '  _None_'}
//
// **Summary PDFs:**
// ${g.summary.map(p => `  - [${p.language.toUpperCase()}] ${p.filename}`).join('\n') || '  _None_'}
// `;
//   })
//   .join('\n---\n\n')}
//
// ---
//
// ## Next Steps
//
// 1. ✅ Review grouped agendas
// 2. Generate NDJSON for import to Sanity
// 3. Each agenda will be ONE Sanity document with:
//    - Multilingual PDF array for full versions
//    - Multilingual PDF array for summary versions
//    - Summary presented first in frontend (grid-agenda cards)
//
// ## Frontend Presentation Strategy
//
// **Two separate grid-agenda cards per agenda:**
//
// Card 1 (Summary):
// - Title: "{Agenda Name} - Summary"
// - PDF files: summary[languages]
// - CTA: "View Summary"
//
// Card 2 (Full Report):
// - Title: "{Agenda Name} - Full Report"
// - PDF files: full[languages]
// - CTA: "Download Full Report"
// `;
//
//   await fs.writeFile(path.join(OUTPUT_DIR, 'FINAL-AGENDA-GROUPS-REPORT.md'), report);
//
//   console.log('='.repeat(70));
//   console.log('\n✅ Final Grouping Complete!');
//   console.log(`\n📊 Results:`);
//   console.log(`   Total Agendas: ${groups.length}`);
//   console.log(`   Regional: ${byType.regional}`);
//   console.log(`   Global: ${byType.global}`);
//   console.log(`   Community: ${byType.community}`);
//   console.log(`   Toolkits: ${byType.toolkit}`);
//   console.log(`   Reports: ${byType.report}`);
//   console.log(`\n📄 Output:`);
//   console.log(`   - ${OUTPUT_DIR}/final-agenda-groups.json`);
//   console.log(`   - ${OUTPUT_DIR}/FINAL-AGENDA-GROUPS-REPORT.md`);
// }
//
// if (import.meta.url === `file://${process.argv[1]}`) {
//   groupPDFsFinal().catch(console.error);
// }
//
// export { groupPDFsFinal };
