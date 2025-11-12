// #!/usr/bin/env tsx
// /**
//  * Script 10: Generate Agendas NDJSON
//  *
//  * Creates TWO Sanity documents per agenda group:
//  * 1. Summary version (with summary PDFs)
//  * 2. Full version (with full PDFs)
//  *
//  * Note: Files array will be populated after PDF upload (Script 13)
//  * This script generates metadata structure only
//  */
//
// import fs from 'fs-extra';
// import path from 'path';
// import { fileURLToPath } from 'url';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const OUTPUT_DIR = path.join(__dirname, '..', 'output');
// const AGENDA_GROUPS = path.join(OUTPUT_DIR, 'final-agenda-groups.json');
//
// interface PDFDocument {
//   language: string;
//   url: string;
//   filename: string;
// }
//
// interface AgendaGroup {
//   _id: string;
//   name: string;
//   type: 'regional' | 'global' | 'community' | 'toolkit' | 'report';
//   region?: string;
//   full: PDFDocument[];
//   summary: PDFDocument[];
// }
//
// interface Agenda {
//   _type: 'agenda';
//   _id: string;
//   title: {
//     en: string;
//     es?: string;
//     fr?: string;
//     ar?: string;
//   };
//   slug: {
//     _type: 'slug';
//     current: string;
//   };
//   agendaType: string;
//   publishDate: string;
//   year: number;
//   accessLevel: 'public';
//   featured: boolean;
//   totalDownloadCount: number;
//   regionalCommunities?: Array<{
//     _type: 'reference';
//     _ref: string;
//   }>;
//   _pdfUrls?: PDFDocument[]; // Temporary field for PDF URLs (will be converted to files array in Script 13)
// }
//
// // Map region slugs to community IDs
// const REGION_TO_COMMUNITY: Record<string, string> = {
//   'central-and-southern-asia': 'regional-community-central-and-southern-asia',
//   'eastern-and-south-eastern-asia': 'regional-community-eastern-and-south-eastern-asia',
//   'europe-and-northern-america': 'regional-community-europe-and-northern-america',
//   'latin-america-and-the-caribbean': 'regional-community-latin-america-and-the-caribbean',
//   'northern-africa-and-western-asia': 'regional-community-northern-africa-and-western-asia',
//   'oceania': 'regional-community-oceania',
//   'sub-saharan-africa': 'regional-community-sub-saharan-africa',
// };
//
// function slugify(text: string): string {
//   return text
//     .toLowerCase()
//     .replace(/[^\w\s-]/g, '')
//     .replace(/\s+/g, '-')
//     .replace(/-+/g, '-')
//     .trim();
// }
//
// function mapAgendaType(type: string): string {
//   const typeMap: Record<string, string> = {
//     'regional': 'research',
//     'global': 'research',
//     'community': 'research',
//     'toolkit': 'guidelines',
//     'report': 'annual',
//   };
//   return typeMap[type] || 'other';
// }
//
// async function generateAgendasNDJSON() {
//   console.log('📅 Generating Agendas NDJSON\n');
//   console.log('='.repeat(70) + '\n');
//
//   // Read agenda groups
//   const agendaGroups: AgendaGroup[] = await fs.readJson(AGENDA_GROUPS);
//
//   console.log(`Found ${agendaGroups.length} agenda groups\n`);
//
//   const agendas: Agenda[] = [];
//
//   for (const group of agendaGroups) {
//     const baseSlug = slugify(group.name);
//     const agendaType = mapAgendaType(group.type);
//     const regionalRef = group.region ? REGION_TO_COMMUNITY[group.region] : undefined;
//
//     // Create SUMMARY agenda if summary PDFs exist
//     if (group.summary.length > 0) {
//       const summaryId = `agenda-${baseSlug}-summary`;
//       agendas.push({
//         _type: 'agenda',
//         _id: summaryId,
//         title: {
//           en: `${group.name} - Summary`,
//         },
//         slug: {
//           _type: 'slug',
//           current: `${baseSlug}-summary`,
//         },
//         agendaType,
//         publishDate: '2024-03-18', // Default date from PDF filenames (18-03)
//         year: 2024,
//         accessLevel: 'public',
//         featured: group.type === 'global', // Feature global agendas
//         totalDownloadCount: 0,
//         ...(regionalRef && {
//           regionalCommunities: [
//             {
//               _type: 'reference',
//               _ref: regionalRef,
//             },
//           ],
//         }),
//         _pdfUrls: group.summary, // Store PDF URLs for Script 13
//       });
//     }
//
//     // Create FULL agenda if full PDFs exist
//     if (group.full.length > 0) {
//       const fullId = `agenda-${baseSlug}-full`;
//       agendas.push({
//         _type: 'agenda',
//         _id: fullId,
//         title: {
//           en: `${group.name}`,
//         },
//         slug: {
//           _type: 'slug',
//           current: baseSlug,
//         },
//         agendaType,
//         publishDate: '2024-03-18',
//         year: 2024,
//         accessLevel: 'public',
//         featured: group.type === 'global',
//         totalDownloadCount: 0,
//         ...(regionalRef && {
//           regionalCommunities: [
//             {
//               _type: 'reference',
//               _ref: regionalRef,
//             },
//           ],
//         }),
//         _pdfUrls: group.full, // Store PDF URLs for Script 13
//       });
//     }
//   }
//
//   console.log('📊 Statistics:\n');
//   console.log(`  Total agenda documents: ${agendas.length}`);
//   console.log(`  Summary versions: ${agendas.filter(a => a._id.includes('-summary')).length}`);
//   console.log(`  Full versions: ${agendas.filter(a => !a._id.includes('-summary')).length}\n`);
//
//   const byType: Record<string, number> = {};
//   agendas.forEach(a => {
//     byType[a.agendaType] = (byType[a.agendaType] || 0) + 1;
//   });
//
//   console.log('📋 By Type:\n');
//   Object.entries(byType)
//     .sort(([, a], [, b]) => b - a)
//     .forEach(([type, count]) => {
//       console.log(`  ${type.padEnd(15)}: ${count} agendas`);
//     });
//
//   console.log('\n📑 Agendas:\n');
//   agendas.forEach(agenda => {
//     const pdfCount = agenda._pdfUrls?.length || 0;
//     const languages = [...new Set(agenda._pdfUrls?.map(p => p.language.toUpperCase()))].join(', ') || 'none';
//     console.log(`  ${agenda.title.en.padEnd(60)} [${languages}] (${pdfCount} PDFs)`);
//   });
//
//   // Convert to NDJSON format
//   const ndjson = agendas
//     .map(agenda => JSON.stringify(agenda))
//     .join('\n');
//
//   // Save to file
//   const outputPath = path.join(OUTPUT_DIR, 'agendas.ndjson');
//   await fs.writeFile(outputPath, ndjson);
//
//   console.log('\n' + '='.repeat(70));
//   console.log('\n✅ Agendas NDJSON Generated!');
//   console.log(`\n📄 Output: ${outputPath}`);
//   console.log(`📊 Total: ${agendas.length} agenda documents`);
//   console.log('\n⚠️  Note: PDF files array will be populated in Script 13 after asset upload');
//   console.log('💡 Next Steps:');
//   console.log('   1. Generate homepage and regional pages NDJSON');
//   console.log('   2. Download PDFs (Script 2)');
//   console.log('   3. Upload PDFs to Sanity and update references (Script 13)\n');
// }
//
// if (import.meta.url === `file://${process.argv[1]}`) {
//   generateAgendasNDJSON().catch(console.error);
// }
//
// export { generateAgendasNDJSON };
