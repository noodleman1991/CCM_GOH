// #!/usr/bin/env tsx
// /**
//  * Script 2: Download PDFs from Agenda Groups
//  *
//  * Downloads all PDFs referenced in final-agenda-groups.json
//  * Skips images (can be added manually in Sanity Studio later)
//  */
//
// import fs from 'fs-extra';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import PQueue from 'p-queue';
// import crypto from 'crypto';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const OUTPUT_DIR = path.join(__dirname, '..', 'output');
// const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
// const AGENDA_GROUPS = path.join(OUTPUT_DIR, 'final-agenda-groups.json');
//
// const MAX_CONCURRENT = 3; // Lower for large PDFs
// const RETRY_ATTEMPTS = 3;
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
//   type: string;
//   region?: string;
//   full: PDFDocument[];
//   summary: PDFDocument[];
// }
//
// interface DownloadRecord {
//   originalUrl: string;
//   filename: string;
//   localPath: string;
//   size: number;
//   hash: string;
//   downloadedAt: string;
//   agendaId: string;
//   version: 'full' | 'summary';
//   language: string;
// }
//
// const downloadRegistry: DownloadRecord[] = [];
//
// async function downloadFile(url: string, outputPath: string, retries = RETRY_ATTEMPTS): Promise<number> {
//   try {
//     console.log(`  📥 Downloading: ${path.basename(outputPath)}`);
//
//     const response = await fetch(url);
//
//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//     }
//
//     const arrayBuffer = await response.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);
//
//     await fs.ensureDir(path.dirname(outputPath));
//     await fs.writeFile(outputPath, buffer);
//
//     return buffer.length;
//
//   } catch (error) {
//     if (retries > 0) {
//       console.log(`  ⚠️  Retry ${RETRY_ATTEMPTS - retries + 1}/${RETRY_ATTEMPTS}`);
//       await new Promise(resolve => setTimeout(resolve, 2000));
//       return downloadFile(url, outputPath, retries - 1);
//     }
//     throw error;
//   }
// }
//
// function getFileHash(buffer: Buffer): string {
//   return crypto.createHash('md5').update(buffer).digest('hex');
// }
//
// function sanitizeFilename(filename: string): string {
//   // Keep original filename but sanitize problematic characters
//   return filename
//     .replace(/[<>:"/\\|?*]/g, '_')
//     .replace(/\s+/g, '_')
//     .substring(0, 200); // Limit length
// }
//
// async function downloadPDFs() {
//   console.log('📥 Starting PDF Download\n');
//   console.log('='.repeat(70) + '\n');
//
//   // Check if agenda groups file exists
//   if (!await fs.pathExists(AGENDA_GROUPS)) {
//     console.error('❌ final-agenda-groups.json not found');
//     console.error('   Run: pnpm exec tsx scripts/5-final-pdf-grouping.ts');
//     process.exit(1);
//   }
//
//   const agendaGroups: AgendaGroup[] = await fs.readJson(AGENDA_GROUPS);
//
//   // Collect all unique PDFs
//   const pdfMap = new Map<string, { pdf: PDFDocument; agendaId: string; version: 'full' | 'summary' }>();
//
//   for (const group of agendaGroups) {
//     for (const pdf of group.full) {
//       pdfMap.set(pdf.url, { pdf, agendaId: group._id, version: 'full' });
//     }
//     for (const pdf of group.summary) {
//       pdfMap.set(pdf.url, { pdf, agendaId: group._id, version: 'summary' });
//     }
//   }
//
//   const totalPDFs = pdfMap.size;
//
//   console.log(`📊 PDFs to download: ${totalPDFs}\n`);
//
//   // Setup download queue
//   const queue = new PQueue({ concurrency: MAX_CONCURRENT });
//
//   let successCount = 0;
//   let failCount = 0;
//   let skipCount = 0;
//
//   for (const [url, { pdf, agendaId, version }] of pdfMap.entries()) {
//     queue.add(async () => {
//       try {
//         const filename = sanitizeFilename(pdf.filename);
//         const outputPath = path.join(DOWNLOADS_DIR, 'pdfs', filename);
//
//         // Skip if already downloaded
//         if (await fs.pathExists(outputPath)) {
//           skipCount++;
//           console.log(`  ⏭️  Skipped (exists): ${filename}`);
//
//           // Still add to registry
//           const buffer = await fs.readFile(outputPath);
//           const stats = await fs.stat(outputPath);
//           downloadRegistry.push({
//             originalUrl: url,
//             filename: pdf.filename,
//             localPath: outputPath,
//             size: stats.size,
//             hash: getFileHash(buffer),
//             downloadedAt: new Date().toISOString(),
//             agendaId,
//             version,
//             language: pdf.language,
//           });
//
//           return;
//         }
//
//         const size = await downloadFile(url, outputPath);
//         const buffer = await fs.readFile(outputPath);
//         const hash = getFileHash(buffer);
//
//         downloadRegistry.push({
//           originalUrl: url,
//           filename: pdf.filename,
//           localPath: outputPath,
//           size,
//           hash,
//           downloadedAt: new Date().toISOString(),
//           agendaId,
//           version,
//           language: pdf.language,
//         });
//
//         successCount++;
//         console.log(`  ✅ Downloaded: ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`);
//
//       } catch (error) {
//         failCount++;
//         console.error(`  ❌ Failed: ${pdf.filename}`);
//         console.error(`     URL: ${url}`);
//         console.error(`     Error: ${error instanceof Error ? error.message : String(error)}`);
//       }
//     });
//   }
//
//   await queue.onIdle();
//
//   // Save download registry
//   const registryPath = path.join(OUTPUT_DIR, 'pdf-download-registry.json');
//   await fs.writeJson(registryPath, downloadRegistry, { spaces: 2 });
//
//   // Generate summary
//   const totalSize = downloadRegistry.reduce((sum, rec) => sum + rec.size, 0);
//
//   // Group by language
//   const byLanguage: Record<string, number> = {};
//   downloadRegistry.forEach(rec => {
//     byLanguage[rec.language] = (byLanguage[rec.language] || 0) + 1;
//   });
//
//   console.log('\n' + '='.repeat(70));
//   console.log('\n✅ PDF Download Complete!');
//   console.log(`\n📊 Summary:`);
//   console.log(`   Downloaded: ${successCount} PDFs`);
//   console.log(`   Skipped: ${skipCount} PDFs (already exist)`);
//   console.log(`   Failed: ${failCount} PDFs`);
//   console.log(`   Total: ${downloadRegistry.length} PDFs`);
//   console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
//
//   console.log(`\n🌍 By Language:`);
//   Object.entries(byLanguage)
//     .sort(([, a], [, b]) => b - a)
//     .forEach(([lang, count]) => {
//       console.log(`   ${lang.toUpperCase()}: ${count} PDFs`);
//     });
//
//   console.log(`\n💾 Registry saved to: ${registryPath}`);
//   console.log(`📁 PDFs saved to: ${path.join(DOWNLOADS_DIR, 'pdfs')}`);
//
//   if (failCount > 0) {
//     console.log(`\n⚠️  ${failCount} PDFs failed to download. Check errors above.`);
//   }
//
//   console.log(`\n💡 Next Step: Run Script 13 to upload PDFs to Sanity\n`);
// }
//
// if (import.meta.url === `file://${process.argv[1]}`) {
//   downloadPDFs().catch(console.error);
// }
//
// export { downloadPDFs };
