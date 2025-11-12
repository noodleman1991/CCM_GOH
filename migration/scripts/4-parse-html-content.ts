// #!/usr/bin/env tsx
// /**
//  * Phase 3: HTML Content Parser
//  * Extracts structured content from scraped Plasmic HTML
//  */
//
// import fs from 'fs-extra';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { JSDOM } from 'jsdom';
// import TurndownService from 'turndown';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const DATA_DIR = path.join(__dirname, '..', 'data');
// const OUTPUT_DIR = path.join(__dirname, '..', 'output');
//
// // Initialize Turndown for HTML → Markdown conversion
// const turndownService = new TurndownService({
//   headingStyle: 'atx',
//   codeBlockStyle: 'fenced',
// });
//
// interface ParsedContent {
//   homepage?: any;
//   regionalCommunityPages?: any[];
//   researchPages?: any[];
//   otherPages?: any[];
// }
//
// interface HomepageSection {
//   _type: string;
//   title?: string;
//   subtitle?: string;
//   description?: any; // Portable Text
//   image?: string;
//   buttons?: Array<{ text: string; link: string }>;
//   items?: any[];
// }
//
// /**
//  * Extract text content from HTML element
//  */
// function extractText(element: Element | null): string {
//   if (!element) return '';
//   return element.textContent?.trim() || '';
// }
//
// /**
//  * Convert HTML to Portable Text blocks (simplified version)
//  */
// function htmlToPortableText(html: string): any[] {
//   if (!html) return [];
//
//   // Convert HTML to markdown first
//   const markdown = turndownService.turndown(html);
//
//   // Simple conversion to Portable Text
//   // For production, use @sanity/block-content-to-markdown or similar
//   const blocks: any[] = [];
//
//   const paragraphs = markdown.split('\n\n').filter(p => p.trim());
//
//   for (const para of paragraphs) {
//     const trimmed = para.trim();
//
//     if (trimmed.startsWith('# ')) {
//       blocks.push({
//         _type: 'block',
//         style: 'h1',
//         children: [{ _type: 'span', text: trimmed.substring(2) }],
//       });
//     } else if (trimmed.startsWith('## ')) {
//       blocks.push({
//         _type: 'block',
//         style: 'h2',
//         children: [{ _type: 'span', text: trimmed.substring(3) }],
//       });
//     } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
//       blocks.push({
//         _type: 'block',
//         listItem: 'bullet',
//         children: [{ _type: 'span', text: trimmed.substring(2) }],
//       });
//     } else {
//       blocks.push({
//         _type: 'block',
//         style: 'normal',
//         children: [{ _type: 'span', text: trimmed }],
//       });
//     }
//   }
//
//   return blocks;
// }
//
// /**
//  * Extract button data from HTML
//  */
// function extractButtons(container: Element): Array<{ text: string; link: string }> {
//   const buttons: Array<{ text: string; link: string }> = [];
//   const buttonElements = container.querySelectorAll('a[href], button');
//
//   for (const btn of Array.from(buttonElements)) {
//     const text = extractText(btn);
//     const link = btn.getAttribute('href') || '#';
//
//     if (text && text.length > 2 && text.length < 100) {
//       buttons.push({ text, link });
//     }
//   }
//
//   return buttons.slice(0, 3); // Limit to 3 buttons
// }
//
// /**
//  * Parse Homepage (11 sections)
//  */
// function parseHomepage(pageData: any): any {
//   console.log('\n📄 Parsing Homepage...');
//
//   const content = pageData.content || '';
//   const dom = new JSDOM(content);
//   const document = dom.window.document;
//
//   const homepage: any = {
//     _type: 'homepage',
//     _id: 'homepage-en',
//     language: 'en',
//     title: { en: pageData.title || 'Connecting Climate Minds Hub' },
//     sections: {},
//   };
//
//   // Extract sections by searching for common patterns
//   console.log('  Extracting sections...');
//
//   // Section 1: Hero Welcome
//   const heroSection = document.querySelector('[class*="hero"], [class*="Hero"]');
//   if (heroSection) {
//     const title = extractText(heroSection.querySelector('h1, [class*="title"]'));
//     const subtitle = extractText(heroSection.querySelector('h2, [class*="subtitle"]'));
//     const description = extractText(heroSection.querySelector('p, [class*="description"]'));
//
//     homepage.sections.heroWelcome = {
//       _type: 'hero-1',
//       title: { en: title || 'Welcome to Connecting Climate Minds Hub' },
//       subtitle: { en: subtitle || 'Catalysing a global research community' },
//       description: htmlToPortableText(description),
//       buttons: extractButtons(heroSection).slice(0, 2),
//     };
//
//     console.log(`    ✓ Hero Welcome: "${title}"`);
//   }
//
//   // Section 2-11: Dynamic extraction based on headings
//   const mainHeadings = document.querySelectorAll('h2, h3, [class*="section-title"]');
//   const sectionKeywords = {
//     'global': 'globalAgenda',
//     'how to use': 'howToUse',
//     'research agenda': 'agendasModule',
//     'lived experience': 'livedExperiences',
//     'regional communit': 'regionalCommunities',
//     'collaboration': 'collaboration',
//     'news': 'news',
//     'project': 'projectInfo',
//     'mental health': 'mentalHealthDefinition',
//     'partner': 'partnerLogos',
//   };
//
//   let sectionsFound = 1; // Already found hero
//
//   for (const heading of Array.from(mainHeadings)) {
//     const headingText = extractText(heading).toLowerCase();
//
//     for (const [keyword, fieldName] of Object.entries(sectionKeywords)) {
//       if (headingText.includes(keyword)) {
//         // Find section container
//         let container = heading.parentElement;
//         while (container && !container.classList.contains('section') && container.tagName !== 'SECTION') {
//           container = container.parentElement;
//           if (container === document.body) break;
//         }
//
//         if (container) {
//           const sectionText = extractText(container);
//           const sectionDescription = Array.from(container.querySelectorAll('p')).map(p => p.textContent).join('\n\n');
//
//           homepage.sections[fieldName] = {
//             _type: fieldName.includes('Grid') || fieldName.includes('Carousel') ? 'grid-row' : 'split-row',
//             title: { en: extractText(heading) },
//             description: htmlToPortableText(sectionDescription),
//             items: [],
//           };
//
//           sectionsFound++;
//           console.log(`    ✓ Section ${sectionsFound}: ${fieldName} - "${extractText(heading)}"`);
//         }
//
//         break;
//       }
//     }
//
//     if (sectionsFound >= 11) break;
//   }
//
//   console.log(`  ✅ Extracted ${sectionsFound}/11 sections`);
//
//   return homepage;
// }
//
// /**
//  * Parse Regional Community Page
//  */
// function parseRegionalCommunityPage(pageData: any, slug: string): any {
//   console.log(`\n🌍 Parsing Regional Community: ${slug}`);
//
//   const content = pageData.content || '';
//   const dom = new JSDOM(content);
//   const document = dom.window.document;
//
//   const page: any = {
//     _type: 'regionalCommunityPage',
//     title: pageData.title || slug,
//     slug: { current: slug },
//     language: 'en',
//     useTemplate: true,
//   };
//
//   // Extract Welcome Hero
//   const heroHeading = document.querySelector('h1');
//   if (heroHeading) {
//     const heroParagraph = heroHeading.nextElementSibling;
//     page.welcomeHero = {
//       _type: 'hero-1',
//       title: { en: extractText(heroHeading) },
//       description: htmlToPortableText(extractText(heroParagraph)),
//     };
//
//     console.log(`  ✓ Welcome Hero: "${extractText(heroHeading).substring(0, 50)}..."`);
//   }
//
//   // Extract Why Join CTA (look for bullet points)
//   const bulletLists = document.querySelectorAll('ul');
//   for (const ul of Array.from(bulletLists)) {
//     const items = Array.from(ul.querySelectorAll('li')).map(li => extractText(li));
//
//     if (items.length >= 2 && items.some(item => item.toLowerCase().includes('join') || item.toLowerCase().includes('connect'))) {
//       page.whyJoinCTA = {
//         _type: 'cta-1',
//         title: { en: 'Why join our regional community?' },
//         description: items.map(item => ({
//           _type: 'block',
//           listItem: 'bullet',
//           children: [{ _type: 'span', text: item }],
//         })),
//       };
//
//       console.log(`  ✓ Why Join CTA: ${items.length} bullet points`);
//       break;
//     }
//   }
//
//   // Extract team member mentions (for later manual matching)
//   const teamMentions: string[] = [];
//   const textContent = content.toLowerCase();
//
//   const namePatterns = [
//     /([A-Z][a-z]+ [A-Z][a-z]+)/g, // First Last
//     /(?:Dr\.|Professor|Prof\.) ([A-Z][a-z]+ [A-Z][a-z]+)/g, // Dr. First Last
//   ];
//
//   for (const pattern of namePatterns) {
//     const matches = content.match(pattern);
//     if (matches) {
//       teamMentions.push(...matches.slice(0, 10)); // Limit to first 10
//     }
//   }
//
//   if (teamMentions.length > 0) {
//     page._teamMentions = [...new Set(teamMentions)]; // Deduplicate
//     console.log(`  ⚠️  Found ${page._teamMentions.length} potential team member names (requires manual verification)`);
//   }
//
//   return page;
// }
//
// /**
//  * Main parsing function
//  */
// async function parseAllContent() {
//   console.log('🔍 Starting HTML Content Parsing...\n');
//
//   const parsedContent: ParsedContent = {
//     regionalCommunityPages: [],
//     researchPages: [],
//     otherPages: [],
//   };
//
//   // Parse Homepage
//   const homepageFile = path.join(DATA_DIR, 'page_default.json');
//   if (await fs.pathExists(homepageFile)) {
//     const homePageData = await fs.readJson(homepageFile);
//     parsedContent.homepage = parseHomepage(homePageData);
//   }
//
//   // Parse Regional Community Pages
//   const rcFiles = (await fs.readdir(DATA_DIR))
//     .filter(f => f.startsWith('page_rc_') && !f.includes('404') && f.endsWith('.json'));
//
//   for (const file of rcFiles) {
//     const slug = file.replace('page_rc_', '').replace('_.json', '').replace('.json', '');
//     const pageData = await fs.readJson(path.join(DATA_DIR, file));
//
//     if (pageData.content && pageData.content.length > 1000) { // Skip 404s
//       const parsed = parseRegionalCommunityPage(pageData, slug);
//       parsedContent.regionalCommunityPages!.push(parsed);
//     }
//   }
//
//   // Parse Research & Action Pages
//   const researchFiles = (await fs.readdir(DATA_DIR))
//     .filter(f => f.startsWith('page_') && !f.startsWith('page_rc_') && f !== 'page_default.json');
//
//   for (const file of researchFiles) {
//     const pageData = await fs.readJson(path.join(DATA_DIR, file));
//
//     if (pageData.content && pageData.content.length > 500) {
//       parsedContent.otherPages!.push({
//         _type: 'page',
//         title: pageData.title,
//         slug: { current: file.replace('page_', '').replace('.json', '').replace(/_/g, '-') },
//         language: 'en',
//         _rawContent: pageData.content.substring(0, 5000), // Store first 5000 chars for reference
//       });
//     }
//   }
//
//   // Save parsed content
//   await fs.ensureDir(OUTPUT_DIR);
//   await fs.writeJson(path.join(OUTPUT_DIR, 'parsed-content.json'), parsedContent, { spaces: 2 });
//
//   // Generate report
//   const report = `# HTML Parsing Report
//
// **Generated:** ${new Date().toISOString()}
//
// ## Summary
//
// - ✅ Homepage: ${parsedContent.homepage ? 'Parsed' : 'Not found'}
// - ✅ Regional Community Pages: ${parsedContent.regionalCommunityPages!.length} pages
// - ✅ Other Pages: ${parsedContent.otherPages!.length} pages
//
// ## Homepage Sections
//
// ${parsedContent.homepage ? Object.keys(parsedContent.homepage.sections).map((key, i) => `${i + 1}. ${key}`).join('\n') : 'Not parsed'}
//
// ## Regional Community Pages
//
// ${parsedContent.regionalCommunityPages!.map(p => `- ${p.title} (${p.slug.current})`).join('\n')}
//
// ## Next Steps
//
// 1. Review parsed content in \`output/parsed-content.json\`
// 2. Manually verify team member names in \`_teamMentions\` fields
// 3. Add missing sections to homepage (target: 11 sections)
// 4. Proceed to Phase 4: PDF Grouping
//
// ---
//
// **Note:** Some sections may require manual extraction due to Plasmic HTML complexity.
// `;
//
//   await fs.writeFile(path.join(OUTPUT_DIR, 'parsing-report.md'), report);
//
//   console.log(`\n✅ Parsing Complete!`);
//   console.log(`   Homepage: ${parsedContent.homepage ? 'OK' : 'MISSING'}`);
//   console.log(`   Regional Pages: ${parsedContent.regionalCommunityPages!.length}`);
//   console.log(`   Other Pages: ${parsedContent.otherPages!.length}`);
//   console.log(`\n📄 Output:`);
//   console.log(`   - ${OUTPUT_DIR}/parsed-content.json`);
//   console.log(`   - ${OUTPUT_DIR}/parsing-report.md`);
// }
//
// // Run if called directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   parseAllContent().catch(console.error);
// }
//
// export { parseAllContent };
