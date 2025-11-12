// #!/usr/bin/env tsx
// /**
//  * Phase 1: Asset Downloader
//  * Downloads all images and PDFs from scraped content
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
// const DATA_DIR = path.join(__dirname, '..', 'data');
// const ASSETS_DIR = path.join(__dirname, '..', 'assets');
// const MAX_CONCURRENT = 5;
// const RETRY_ATTEMPTS = 3;
//
// interface AssetRecord {
//   originalUrl: string;
//   localPath: string;
//   type: 'image' | 'pdf' | 'file';
//   size: number;
//   hash: string;
//   downloadedAt: string;
// }
//
// const assetRegistry: AssetRecord[] = [];
//
// async function downloadFile(url: string, outputPath: string, retries = RETRY_ATTEMPTS): Promise<number> {
//   try {
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
//       console.log(`  ⚠️  Retry ${RETRY_ATTEMPTS - retries + 1}/${RETRY_ATTEMPTS}: ${url}`);
//       await new Promise(resolve => setTimeout(resolve, 1000));
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
// function getAssetType(url: string): 'image' | 'pdf' | 'file' {
//   const ext = path.extname(url).toLowerCase();
//
//   if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
//     return 'image';
//   }
//   if (ext === '.pdf') {
//     return 'pdf';
//   }
//   return 'file';
// }
//
// function sanitizeFilename(url: string): string {
//   const urlObj = new URL(url);
//   const pathname = urlObj.pathname;
//   let filename = path.basename(pathname);
//
//   // If no extension, try to get from URL or use default
//   if (!path.extname(filename)) {
//     const ext = getAssetType(url) === 'image' ? '.jpg' : '.pdf';
//     filename += ext;
//   }
//
//   // Sanitize
//   filename = filename.replace(/[^a-z0-9.-]/gi, '_');
//
//   // Add hash to prevent collisions
//   const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
//   const ext = path.extname(filename);
//   const base = path.basename(filename, ext);
//
//   return `${base}_${hash}${ext}`;
// }
//
// async function downloadAssets() {
//   console.log('📥 Starting asset download...\n');
//
//   // Load site inventory
//   const inventoryPath = path.join(DATA_DIR, 'site-inventory.json');
//
//   if (!await fs.pathExists(inventoryPath)) {
//     console.error('❌ site-inventory.json not found. Run scraper first.');
//     process.exit(1);
//   }
//
//   const inventory = await fs.readJSON(inventoryPath);
//
//   // Collect all unique asset URLs
//   const allImages = new Set<string>();
//   const allPDFs = new Set<string>();
//
//   // From homepage
//   if (inventory.homepage) {
//     inventory.homepage.images.forEach((url: string) => allImages.add(url));
//     (inventory.homepage.metadata.pdfs || []).forEach((url: string) => allPDFs.add(url));
//   }
//
//   // From regional pages
//   inventory.regionalPages.forEach((page: any) => {
//     page.images.forEach((url: string) => allImages.add(url));
//     (page.metadata.pdfs || []).forEach((url: string) => allPDFs.add(url));
//   });
//
//   // From other pages
//   inventory.otherPages.forEach((page: any) => {
//     page.images.forEach((url: string) => allImages.add(url));
//     (page.metadata.pdfs || []).forEach((url: string) => allPDFs.add(url));
//   });
//
//   console.log(`📊 Assets to download:`);
//   console.log(`   - Images: ${allImages.size}`);
//   console.log(`   - PDFs: ${allPDFs.size}`);
//   console.log(`   - Total: ${allImages.size + allPDFs.size}\n`);
//
//   // Setup download queue
//   const queue = new PQueue({ concurrency: MAX_CONCURRENT });
//
//   // Download images
//   let successCount = 0;
//   let failCount = 0;
//
//   for (const url of allImages) {
//     queue.add(async () => {
//       try {
//         const filename = sanitizeFilename(url);
//         const outputPath = path.join(ASSETS_DIR, 'images', filename);
//
//         // Skip if already downloaded
//         if (await fs.pathExists(outputPath)) {
//           console.log(`  ⏭️  Skipped (exists): ${filename}`);
//           return;
//         }
//
//         const size = await downloadFile(url, outputPath);
//         const buffer = await fs.readFile(outputPath);
//         const hash = getFileHash(buffer);
//
//         assetRegistry.push({
//           originalUrl: url,
//           localPath: outputPath,
//           type: 'image',
//           size,
//           hash,
//           downloadedAt: new Date().toISOString()
//         });
//
//         successCount++;
//         console.log(`  ✅ Downloaded: ${filename} (${(size / 1024).toFixed(2)} KB)`);
//
//       } catch (error) {
//         failCount++;
//         console.error(`  ❌ Failed: ${url}`, error);
//       }
//     });
//   }
//
//   // Download PDFs
//   for (const url of allPDFs) {
//     queue.add(async () => {
//       try {
//         const filename = sanitizeFilename(url);
//         const outputPath = path.join(ASSETS_DIR, 'pdfs', filename);
//
//         // Skip if already downloaded
//         if (await fs.pathExists(outputPath)) {
//           console.log(`  ⏭️  Skipped (exists): ${filename}`);
//           return;
//         }
//
//         const size = await downloadFile(url, outputPath);
//         const buffer = await fs.readFile(outputPath);
//         const hash = getFileHash(buffer);
//
//         assetRegistry.push({
//           originalUrl: url,
//           localPath: outputPath,
//           type: 'pdf',
//           size,
//           hash,
//           downloadedAt: new Date().toISOString()
//         });
//
//         successCount++;
//         console.log(`  ✅ Downloaded: ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`);
//
//       } catch (error) {
//         failCount++;
//         console.error(`  ❌ Failed: ${url}`, error);
//       }
//     });
//   }
//
//   await queue.onIdle();
//
//   // Save asset registry
//   await fs.writeJSON(
//     path.join(DATA_DIR, 'asset-registry.json'),
//     assetRegistry,
//     { spaces: 2 }
//   );
//
//   // Generate summary
//   const totalSize = assetRegistry.reduce((sum, asset) => sum + asset.size, 0);
//
//   console.log('\n✨ Asset download complete!');
//   console.log(`📊 Summary:`);
//   console.log(`   - Success: ${successCount}`);
//   console.log(`   - Failed: ${failCount}`);
//   console.log(`   - Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`\n💾 Asset registry saved to: ${DATA_DIR}/asset-registry.json`);
// }
//
// downloadAssets().catch(console.error);
