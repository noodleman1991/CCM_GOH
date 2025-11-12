// #!/usr/bin/env tsx
// /**
//  * Phase 1: Content Scraper
//  * Crawls hub.connectingclimateminds.org and extracts all content
//  */
//
// import { chromium, Browser, Page } from 'playwright';
// import * as cheerio from 'cheerio';
// import fs from 'fs-extra';
// import path from 'path';
// import { fileURLToPath } from 'url';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// interface PageData {
//   url: string;
//   title: string;
//   description: string;
//   content: string;
//   images: string[];
//   links: string[];
//   metadata: Record<string, any>;
// }
//
// interface SiteInventory {
//   homepage: PageData | null;
//   regionalPages: PageData[];
//   otherPages: PageData[];
//   totalPages: number;
//   totalImages: number;
//   totalPDFs: number;
//   scrapedAt: string;
// }
//
// const BASE_URL = 'http://hub.connectingclimateminds.org';
// const OUTPUT_DIR = path.join(__dirname, '..', 'data');
// const visitedUrls = new Set<string>();
//
// async function scrapeWithPlaywright(url: string, browser: Browser): Promise<PageData | null> {
//   console.log(`🔍 Scraping: ${url}`);
//
//   const page: Page = await browser.newPage();
//
//   try {
//     // Navigate with longer timeout for Plasmic
//     await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
//
//     // Wait for Plasmic to render - look for Plasmic-specific elements
//     try {
//       await page.waitForSelector('[data-plasmic-name], .plasmic-text, #__next', { timeout: 10000 });
//     } catch {
//       console.log('  ⚠️  No Plasmic elements found, continuing...');
//     }
//
//     // Extra wait for dynamic content
//     await page.waitForTimeout(3000);
//
//     // Get the fully rendered HTML
//     const html = await page.content();
//     const $ = cheerio.load(html);
//
//     // Extract title
//     const title = $('title').text() ||
//                   $('h1').first().text() ||
//                   $('meta[property="og:title"]').attr('content') ||
//                   '';
//
//     // Extract description
//     const description = $('meta[name="description"]').attr('content') ||
//                         $('meta[property="og:description"]').attr('content') ||
//                         '';
//
//     // Extract main content (try various selectors)
//     const contentSelectors = [
//       'main',
//       '[role="main"]',
//       'article',
//       '#__next',
//       '.content',
//       'body'
//     ];
//
//     let content = '';
//     for (const selector of contentSelectors) {
//       const element = $(selector);
//       if (element.length > 0) {
//         content = element.html() || '';
//         break;
//       }
//     }
//
//     // Extract all image URLs
//     const images: string[] = [];
//     $('img').each((_, el) => {
//       const src = $(el).attr('src');
//       if (src) {
//         const absoluteUrl = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
//         images.push(absoluteUrl);
//       }
//     });
//
//     // Extract all links
//     const links: string[] = [];
//     $('a[href]').each((_, el) => {
//       const href = $(el).attr('href');
//       if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
//         try {
//           const absoluteUrl = href.startsWith('http') ? href : new URL(href, BASE_URL).href;
//           if (absoluteUrl.startsWith(BASE_URL)) {
//             links.push(absoluteUrl);
//           }
//         } catch (e) {
//           // Skip invalid URLs
//         }
//       }
//     });
//
//     // Extract PDF links
//     const pdfs = $('a[href$=".pdf"]').map((_, el) => $(el).attr('href')).get();
//
//     // Extract metadata
//     const metadata: Record<string, any> = {};
//
//     $('meta').each((_, el) => {
//       const name = $(el).attr('name') || $(el).attr('property');
//       const content = $(el).attr('content');
//       if (name && content) {
//         metadata[name] = content;
//       }
//     });
//
//     await page.close();
//
//     return {
//       url,
//       title: title.trim(),
//       description: description.trim(),
//       content,
//       images,
//       links,
//       metadata: {
//         ...metadata,
//         pdfs,
//         scrapedAt: new Date().toISOString()
//       }
//     };
//
//   } catch (error) {
//     console.error(`❌ Error scraping ${url}:`, error);
//     await page.close();
//     return null;
//   }
// }
//
// async function crawlSite(): Promise<SiteInventory> {
//   console.log('🚀 Starting content scraper...\n');
//
//   // Ensure output directory exists
//   await fs.ensureDir(OUTPUT_DIR);
//
//   // Launch browser
//   const browser = await chromium.launch({ headless: true });
//
//   const inventory: SiteInventory = {
//     homepage: null,
//     regionalPages: [],
//     otherPages: [],
//     totalPages: 0,
//     totalImages: 0,
//     totalPDFs: 0,
//     scrapedAt: new Date().toISOString()
//   };
//
//   const urlQueue: string[] = [BASE_URL];
//
//   // Focus on Plasmic pages only (exclude Strapi case studies)
//   const plasmicPages = [
//     '/default', // Homepage
//     '/research-and-action',
//     '/collaborate',
//     '/about',
//     '/lived-experiences', // Try this
//     // We'll discover regional pages from links
//   ];
//
//   plasmicPages.forEach(path => {
//     urlQueue.push(`${BASE_URL}${path}`);
//   });
//
//   while (urlQueue.length > 0) {
//     const url = urlQueue.shift()!;
//
//     // Skip if already visited
//     if (visitedUrls.has(url)) {
//       continue;
//     }
//
//     visitedUrls.add(url);
//
//     const pageData = await scrapeWithPlaywright(url, browser);
//
//     if (pageData) {
//       inventory.totalPages++;
//       inventory.totalImages += pageData.images.length;
//       inventory.totalPDFs += (pageData.metadata.pdfs?.length || 0);
//
//       // Categorize page
//       if (url === BASE_URL || url === `${BASE_URL}/default`) {
//         inventory.homepage = pageData;
//         console.log(`  ✅ Homepage scraped (${pageData.images.length} images)`);
//       } else if (url.includes('/rc/')) {
//         inventory.regionalPages.push(pageData);
//         console.log(`  ✅ Regional page: ${pageData.title} (${pageData.images.length} images)`);
//       } else {
//         inventory.otherPages.push(pageData);
//         console.log(`  ✅ Other page: ${pageData.title} (${pageData.images.length} images)`);
//       }
//
//       // Save individual page data
//       const filename = url.replace(BASE_URL, '').replace(/\//g, '_') || 'homepage';
//       await fs.writeJSON(
//         path.join(OUTPUT_DIR, `page${filename}.json`),
//         pageData,
//         { spaces: 2 }
//       );
//
//       // Add new links to queue (limit crawl depth)
//       if (inventory.totalPages < 50) {
//         pageData.links
//           .filter(link => !visitedUrls.has(link))
//           .slice(0, 5) // Limit new links per page
//           .forEach(link => urlQueue.push(link));
//       }
//     }
//
//     // Small delay between requests
//     await new Promise(resolve => setTimeout(resolve, 1000));
//   }
//
//   await browser.close();
//
//   // Save complete inventory
//   await fs.writeJSON(
//     path.join(OUTPUT_DIR, 'site-inventory.json'),
//     inventory,
//     { spaces: 2 }
//   );
//
//   console.log('\n✨ Scraping complete!');
//   console.log(`📊 Summary:`);
//   console.log(`   - Total pages: ${inventory.totalPages}`);
//   console.log(`   - Regional pages: ${inventory.regionalPages.length}`);
//   console.log(`   - Other pages: ${inventory.otherPages.length}`);
//   console.log(`   - Total images found: ${inventory.totalImages}`);
//   console.log(`   - Total PDFs found: ${inventory.totalPDFs}`);
//   console.log(`\n💾 Data saved to: ${OUTPUT_DIR}/`);
//
//   return inventory;
// }
//
// // Run scraper
// crawlSite().catch(console.error);
