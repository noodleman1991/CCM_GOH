// #!/usr/bin/env tsx
// /**
//  * Phase 1: Generate Inventory Report
//  * Analyzes scraped data and creates detailed content mapping
//  */
//
// import fs from 'fs-extra';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { createObjectCsvWriter } from 'csv-writer';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const DATA_DIR = path.join(__dirname, '..', 'data');
// const OUTPUT_DIR = path.join(__dirname, '..', 'output');
//
// interface ContentInventory {
//   homepage: {
//     url: string;
//     title: string;
//     sections: number;
//     images: number;
//     links: number;
//   } | null;
//   regionalPages: Array<{
//     url: string;
//     title: string;
//     region: string;
//     images: number;
//     content: string;
//   }>;
//   researchPages: Array<{
//     url: string;
//     title: string;
//     type: string;
//     images: number;
//   }>;
//   livedExperiencesPages: Array<{
//     url: string;
//     title: string;
//     images: number;
//   }>;
//   otherPages: Array<{
//     url: string;
//     title: string;
//     images: number;
//   }>;
//   assets: {
//     totalImages: number;
//     totalPDFs: number;
//     uniqueImages: Set<string>;
//     uniquePDFs: Set<string>;
//   };
// }
//
// async function generateInventory() {
//   console.log('📊 Generating content inventory...\n');
//
//   await fs.ensureDir(OUTPUT_DIR);
//
//   const inventoryPath = path.join(DATA_DIR, 'site-inventory.json');
//
//   if (!await fs.pathExists(inventoryPath)) {
//     console.error('❌ site-inventory.json not found');
//     process.exit(1);
//   }
//
//   const rawInventory = await fs.readJSON(inventoryPath);
//
//   const inventory: ContentInventory = {
//     homepage: null,
//     regionalPages: [],
//     researchPages: [],
//     livedExperiencesPages: [],
//     otherPages: [],
//     assets: {
//       totalImages: 0,
//       totalPDFs: 0,
//       uniqueImages: new Set(),
//       uniquePDFs: new Set()
//     }
//   };
//
//   // Process homepage
//   if (rawInventory.homepage) {
//     const hp = rawInventory.homepage;
//     inventory.homepage = {
//       url: hp.url,
//       title: hp.title,
//       sections: (hp.content.match(/<section/g) || []).length,
//       images: hp.images.length,
//       links: hp.links.length
//     };
//
//     hp.images.forEach((img: string) => inventory.assets.uniqueImages.add(img));
//     (hp.metadata.pdfs || []).forEach((pdf: string) => inventory.assets.uniquePDFs.add(pdf));
//   }
//
//   // Process regional pages
//   rawInventory.regionalPages.forEach((page: any) => {
//     const region = page.url.split('/rc/')[1]?.replace('/', '') || 'unknown';
//
//     inventory.regionalPages.push({
//       url: page.url,
//       title: page.title,
//       region,
//       images: page.images.length,
//       content: page.content.substring(0, 200) + '...'
//     });
//
//     page.images.forEach((img: string) => inventory.assets.uniqueImages.add(img));
//     (page.metadata.pdfs || []).forEach((pdf: string) => inventory.assets.uniquePDFs.add(pdf));
//   });
//
//   // Process other pages - categorize them
//   rawInventory.otherPages.forEach((page: any) => {
//     const url = page.url.toLowerCase();
//
//     if (url.includes('research-and-action') || url.includes('global-agenda') ||
//         url.includes('regional-agendas') || url.includes('community-agendas') ||
//         url.includes('toolkits') || url.includes('impact-reports')) {
//
//       const type = url.includes('global-agenda') ? 'global-agenda' :
//                    url.includes('regional-agendas') ? 'regional-agendas' :
//                    url.includes('community-agendas') ? 'community-agendas' :
//                    url.includes('toolkits') ? 'toolkits' :
//                    url.includes('impact-reports') ? 'impact-reports' :
//                    'research-main';
//
//       inventory.researchPages.push({
//         url: page.url,
//         title: page.title,
//         type,
//         images: page.images.length
//       });
//     } else if (url.includes('lived-experience')) {
//       inventory.livedExperiencesPages.push({
//         url: page.url,
//         title: page.title,
//         images: page.images.length
//       });
//     } else {
//       inventory.otherPages.push({
//         url: page.url,
//         title: page.title,
//         images: page.images.length
//       });
//     }
//
//     page.images.forEach((img: string) => inventory.assets.uniqueImages.add(img));
//     (page.metadata.pdfs || []).forEach((pdf: string) => inventory.assets.uniquePDFs.add(pdf));
//   });
//
//   inventory.assets.totalImages = inventory.assets.uniqueImages.size;
//   inventory.assets.totalPDFs = inventory.assets.uniquePDFs.size;
//
//   // Generate CSV reports
//   const regionalCsvWriter = createObjectCsvWriter({
//     path: path.join(OUTPUT_DIR, 'regional-communities.csv'),
//     header: [
//       { id: 'region', title: 'Region' },
//       { id: 'title', title: 'Title' },
//       { id: 'url', title: 'URL' },
//       { id: 'images', title: 'Image Count' }
//     ]
//   });
//
//   await regionalCsvWriter.writeRecords(
//     inventory.regionalPages.map(p => ({
//       region: p.region,
//       title: p.title,
//       url: p.url,
//       images: p.images
//     }))
//   );
//
//   const researchCsvWriter = createObjectCsvWriter({
//     path: path.join(OUTPUT_DIR, 'research-pages.csv'),
//     header: [
//       { id: 'type', title: 'Type' },
//       { id: 'title', title: 'Title' },
//       { id: 'url', title: 'URL' },
//       { id: 'images', title: 'Image Count' }
//     ]
//   });
//
//   await researchCsvWriter.writeRecords(
//     inventory.researchPages.map(p => ({
//       type: p.type,
//       title: p.title,
//       url: p.url,
//       images: p.images
//     }))
//   );
//
//   // Generate markdown report
//   const reportLines: string[] = [
//     '# Connecting Climate Minds Hub - Content Inventory',
//     '',
//     `**Generated:** ${new Date().toISOString()}`,
//     '',
//     '## Summary',
//     '',
//     `- **Total Pages Scraped:** ${rawInventory.totalPages}`,
//     `- **Regional Community Pages:** ${inventory.regionalPages.length}`,
//     `- **Research & Action Pages:** ${inventory.researchPages.length}`,
//     `- **Lived Experiences Pages:** ${inventory.livedExperiencesPages.length}`,
//     `- **Other Pages:** ${inventory.otherPages.length}`,
//     `- **Unique Images:** ${inventory.assets.totalImages}`,
//     `- **Unique PDFs:** ${inventory.assets.totalPDFs}`,
//     '',
//     '---',
//     '',
//     '## Homepage',
//     ''
//   ];
//
//   if (inventory.homepage) {
//     reportLines.push(
//       `- **Title:** ${inventory.homepage.title}`,
//       `- **URL:** ${inventory.homepage.url}`,
//       `- **Sections:** ${inventory.homepage.sections}`,
//       `- **Images:** ${inventory.homepage.images}`,
//       `- **Links:** ${inventory.homepage.links}`,
//       ''
//     );
//   }
//
//   reportLines.push(
//     '## Regional Communities',
//     '',
//     '| Region | Title | Images |',
//     '|--------|-------|--------|'
//   );
//
//   inventory.regionalPages.forEach(page => {
//     reportLines.push(`| ${page.region} | ${page.title} | ${page.images} |`);
//   });
//
//   reportLines.push(
//     '',
//     '## Research & Action Pages',
//     '',
//     '| Type | Title | Images |',
//     '|------|-------|--------|'
//   );
//
//   inventory.researchPages.forEach(page => {
//     reportLines.push(`| ${page.type} | ${page.title} | ${page.images} |`);
//   });
//
//   reportLines.push(
//     '',
//     '## Content Mapping to Sanity',
//     '',
//     '### Homepage → `homepage` schema',
//     '- Maps to single homepage document with 11 sections',
//     '- All hero images, carousels, and grids extracted',
//     '',
//     '### Regional Communities → `regionalCommunity` + `regionalCommunityPage` schemas',
//     ''
//   );
//
//   inventory.regionalPages.forEach(page => {
//     reportLines.push(`- **${page.title}** → Two documents:`);
//     reportLines.push(`  - \`regionalCommunity\` document (metadata, members, boundaries)`);
//     reportLines.push(`  - \`regionalCommunityPage\` document (page content with template)`);
//   });
//
//   reportLines.push(
//     '',
//     '### Research Pages → `page` schema',
//     '- Flexible blocks array with various components',
//     '',
//     '---',
//     '',
//     '## Assets to Download',
//     '',
//     `**Total unique images:** ${inventory.assets.totalImages}`,
//     `**Total unique PDFs:** ${inventory.assets.totalPDFs}`,
//     ''
//   );
//
//   const report = reportLines.join('\n');
//
//   await fs.writeFile(
//     path.join(OUTPUT_DIR, 'content-inventory.md'),
//     report
//   );
//
//   await fs.writeJSON(
//     path.join(OUTPUT_DIR, 'content-inventory.json'),
//     {
//       ...inventory,
//       assets: {
//         totalImages: inventory.assets.totalImages,
//         totalPDFs: inventory.assets.totalPDFs,
//         uniqueImages: Array.from(inventory.assets.uniqueImages),
//         uniquePDFs: Array.from(inventory.assets.uniquePDFs)
//       }
//     },
//     { spaces: 2 }
//   );
//
//   console.log('✨ Inventory generated!');
//   console.log('\n📊 Summary:');
//   console.log(`   - Homepage: ✅`);
//   console.log(`   - Regional Communities: ${inventory.regionalPages.length}`);
//   console.log(`   - Research Pages: ${inventory.researchPages.length}`);
//   console.log(`   - Lived Experiences: ${inventory.livedExperiencesPages.length}`);
//   console.log(`   - Other Pages: ${inventory.otherPages.length}`);
//   console.log(`   - Total Images: ${inventory.assets.totalImages}`);
//   console.log(`   - Total PDFs: ${inventory.assets.totalPDFs}`);
//   console.log(`\n📄 Reports saved to: ${OUTPUT_DIR}/`);
//   console.log(`   - content-inventory.md (readable report)`);
//   console.log(`   - content-inventory.json (structured data)`);
//   console.log(`   - regional-communities.csv`);
//   console.log(`   - research-pages.csv`);
// }
//
// generateInventory().catch(console.error);
