// #!/usr/bin/env tsx
// /**
//  * Phase 6: Complete HTML Content Parser
//  * Extracts ALL content from scraped Plasmic HTML:
//  * - All 11 homepage sections with proper content extraction
//  * - Regional community page sections (hero, CTA, team)
//  * - Team members and organizations
//  * - Converts to Portable Text format
//  */
//
// import fs from 'fs-extra';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { JSDOM } from 'jsdom';
// import TurndownService from 'turndown';
// import * as cheerio from 'cheerio';
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
//   bulletListMarker: '-',
// });
//
// // Configure Turndown to preserve certain elements
// turndownService.keep(['strong', 'em', 'a']);
//
// interface ParsedContent {
//   homepage: any;
//   regionalCommunityPages: any[];
//   organizations: Set<string>;
//   teamMembers: Array<{
//     name: string;
//     title?: string;
//     affiliation?: string;
//     region?: string;
//   }>;
// }
//
// /**
//  * Convert HTML to Sanity Portable Text
//  */
// function htmlToPortableText(html: string, $?: cheerio.CheerioAPI): any[] {
//   if (!html || html.trim() === '') return [];
//
//   // Clean HTML
//   const cleanHtml = html
//     .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
//     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
//     .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
//
//   // Convert to markdown first
//   const markdown = turndownService.turndown(cleanHtml);
//
//   const blocks: any[] = [];
//   const lines = markdown.split('\n');
//
//   let currentList: any[] = [];
//   let isInList = false;
//
//   for (let line of lines) {
//     line = line.trim();
//     if (!line) {
//       // Flush current list if we have one
//       if (isInList && currentList.length > 0) {
//         blocks.push(...currentList);
//         currentList = [];
//         isInList = false;
//       }
//       continue;
//     }
//
//     // Handle headings
//     if (line.startsWith('# ')) {
//       blocks.push({
//         _type: 'block',
//         _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//         style: 'h1',
//         children: [{ _type: 'span', text: line.substring(2), marks: [] }],
//         markDefs: [],
//       });
//     } else if (line.startsWith('## ')) {
//       blocks.push({
//         _type: 'block',
//         _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//         style: 'h2',
//         children: [{ _type: 'span', text: line.substring(3), marks: [] }],
//         markDefs: [],
//       });
//     } else if (line.startsWith('### ')) {
//       blocks.push({
//         _type: 'block',
//         _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//         style: 'h3',
//         children: [{ _type: 'span', text: line.substring(4), marks: [] }],
//         markDefs: [],
//       });
//     }
//     // Handle list items
//     else if (line.startsWith('- ') || line.startsWith('* ')) {
//       isInList = true;
//       currentList.push({
//         _type: 'block',
//         _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//         style: 'normal',
//         listItem: 'bullet',
//         children: [{ _type: 'span', text: line.substring(2), marks: [] }],
//         markDefs: [],
//       });
//     }
//     // Handle numbered lists
//     else if (/^\d+\.\s/.test(line)) {
//       isInList = true;
//       currentList.push({
//         _type: 'block',
//         _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//         style: 'normal',
//         listItem: 'number',
//         children: [{ _type: 'span', text: line.replace(/^\d+\.\s/, ''), marks: [] }],
//         markDefs: [],
//       });
//     }
//     // Regular paragraphs
//     else {
//       // Flush any pending list
//       if (isInList && currentList.length > 0) {
//         blocks.push(...currentList);
//         currentList = [];
//         isInList = false;
//       }
//
//       blocks.push({
//         _type: 'block',
//         _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//         style: 'normal',
//         children: [{ _type: 'span', text: line, marks: [] }],
//         markDefs: [],
//       });
//     }
//   }
//
//   // Flush any remaining list items
//   if (currentList.length > 0) {
//     blocks.push(...currentList);
//   }
//
//   return blocks;
// }
//
// /**
//  * Extract team members from HTML
//  */
// function extractTeamMembers(html: string, region?: string): Array<{
//   name: string;
//   title?: string;
//   affiliation?: string;
//   region?: string;
// }> {
//   const members: Array<{
//     name: string;
//     title?: string;
//     affiliation?: string;
//     region?: string;
//   }> = [];
//
//   // Pattern 1: "Dr./Professor FirstName LastName"
//   const titlePattern = /((?:Dr\.|Professor|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z']+)+)/g;
//   const matches = html.match(titlePattern);
//
//   if (matches) {
//     for (const match of matches) {
//       // Extract title and name
//       const parts = match.split(/\s+/);
//       const title = parts[0];
//       const name = parts.slice(1).join(' ');
//
//       if (name.length > 3 && !name.includes('Liberation') && !name.includes('View')) {
//         members.push({
//           name,
//           title,
//           region,
//         });
//       }
//     }
//   }
//
//   return members;
// }
//
// /**
//  * Extract organization names from HTML
//  */
// function extractOrganizations(html: string): string[] {
//   const orgs = new Set<string>();
//
//   // Common university/institution patterns
//   const patterns = [
//     /University of [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
//     /[A-Z][a-z]+\s+University/g,
//     /[A-Z][a-z]+\s+Institute(?:\s+of\s+[A-Z][a-z]+)?/g,
//     /World Health Organization/gi,
//     /Climate Cares Centre/gi,
//   ];
//
//   for (const pattern of patterns) {
//     const matches = html.match(pattern);
//     if (matches) {
//       matches.forEach(match => orgs.add(match.trim()));
//     }
//   }
//
//   return Array.from(orgs);
// }
//
// /**
//  * Parse Homepage - Extract all 11 sections
//  */
// async function parseHomepage(pageData: any): Promise<any> {
//   console.log('\n📄 Parsing Homepage...');
//
//   const content = pageData.content || '';
//   const $ = cheerio.load(content);
//
//   const homepage: any = {
//     _type: 'homepage',
//     _id: 'homepage-en',
//     language: 'en',
//     title: { en: pageData.title || 'Connecting Climate Minds Hub' },
//     sections: {},
//   };
//
//   // Section 1: Hero Welcome
//   // Look for main hero section with large headings
//   const heroText = $('h1, [class*="hero"] h2, [class*="Hero"] h2').first();
//   if (heroText.length) {
//     const title = heroText.text().trim();
//     const subtitle = heroText.next('h2, p').first().text().trim();
//     const description = heroText.parent().find('p').first().text().trim();
//
//     homepage.sections.heroWelcome = {
//       _type: 'hero-1',
//       title: { en: title || 'Welcome to Connecting Climate Minds Hub' },
//       subtitle: { en: subtitle || 'Catalysing a global research community' },
//       description: description ? htmlToPortableText(description) : [],
//     };
//
//     console.log(`  ✓ Section 1: Hero Welcome - "${title.substring(0, 50)}..."`);
//   }
//
//   // Section 2-11: Extract by searching for section headings
//   const sectionMappings = [
//     { keyword: 'global research', field: 'globalAgenda', type: 'split-row' },
//     { keyword: 'how to use', field: 'howToUse', type: 'split-row' },
//     { keyword: 'research agenda', field: 'agendasModule', type: 'grid-row' },
//     { keyword: 'lived experience', field: 'livedExperiences', type: 'carousel-2' },
//     { keyword: 'regional communit', field: 'regionalCommunities', type: 'grid-row' },
//     { keyword: 'collaborat', field: 'collaboration', type: 'split-row' },
//     { keyword: 'news', field: 'news', type: 'grid-row' },
//     { keyword: 'about', field: 'projectInfo', type: 'split-row' },
//     { keyword: 'mental health', field: 'mentalHealthDefinition', type: 'cta-1' },
//     { keyword: 'partner', field: 'partnerLogos', type: 'logo-cloud-1' },
//   ];
//
//   let sectionsFound = 1; // Already found hero
//
//   $('h2, h3, [class*="heading"], [class*="title"]').each((i, elem) => {
//     const headingText = $(elem).text().trim().toLowerCase();
//
//     for (const mapping of sectionMappings) {
//       if (headingText.includes(mapping.keyword)) {
//         // Find the section container
//         let container = $(elem).parent();
//
//         // Get section content
//         const sectionTitle = $(elem).text().trim();
//         const sectionParagraphs = container.find('p').toArray().map(p => $(p).text().trim()).join('\n\n');
//
//         homepage.sections[mapping.field] = {
//           _type: mapping.type,
//           title: { en: sectionTitle },
//           description: sectionParagraphs ? htmlToPortableText(sectionParagraphs) : [],
//         };
//
//         sectionsFound++;
//         console.log(`  ✓ Section ${sectionsFound}: ${mapping.field} - "${sectionTitle.substring(0, 40)}..."`);
//         break;
//       }
//     }
//   });
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
//   const $ = cheerio.load(content);
//
//   const page: any = {
//     _type: 'regionalCommunityPage',
//     title: pageData.title || slug,
//     slug: { current: slug },
//     language: 'en',
//     useTemplate: true,
//   };
//
//   // Extract Welcome Hero - look for main header section
//   const mainHeading = $('h1, [class*="header"] .text, [class*="Header"] .text').first();
//   if (mainHeading.length) {
//     const heroTitle = mainHeading.text().trim();
//     const heroParagraph = mainHeading.parent().find('p, div[class*="text"]').first().text().trim();
//
//     page.welcomeHero = {
//       _type: 'hero-1',
//       title: { en: heroTitle },
//       description: heroParagraph ? htmlToPortableText(heroParagraph) : [],
//     };
//
//     console.log(`  ✓ Welcome Hero: "${heroTitle.substring(0, 50)}..."`);
//   }
//
//   // Extract Why Join CTA - look for sections with "why" or bullet points
//   $('h2, h3').each((i, elem) => {
//     const heading = $(elem).text().trim().toLowerCase();
//     if (heading.includes('why') || heading.includes('join') || heading.includes('benefit')) {
//       const container = $(elem).parent();
//       const bullets = container.find('ul li, ol li').toArray().map(li => $(li).text().trim());
//
//       if (bullets.length > 0) {
//         page.whyJoinCTA = {
//           _type: 'cta-1',
//           title: { en: $(elem).text().trim() },
//           description: bullets.map(text => ({
//             _type: 'block',
//             _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//             style: 'normal',
//             listItem: 'bullet',
//             children: [{ _type: 'span', text, marks: [] }],
//             markDefs: [],
//           })),
//         };
//
//         console.log(`  ✓ Why Join CTA: ${bullets.length} bullet points`);
//       }
//     }
//   });
//
//   // Extract team members
//   const teamMembers = extractTeamMembers(content, slug);
//   if (teamMembers.length > 0) {
//     page._teamMembers = teamMembers;
//     console.log(`  ✓ Found ${teamMembers.length} team members`);
//   }
//
//   return page;
// }
//
// /**
//  * Main parsing function
//  */
// async function parseAllContent() {
//   console.log('🔍 Starting Complete HTML Content Parsing...\n');
//   console.log('='.repeat(60) + '\n');
//
//   const parsedContent: ParsedContent = {
//     homepage: null as any,
//     regionalCommunityPages: [],
//     organizations: new Set<string>(),
//     teamMembers: [],
//   };
//
//   // Parse Homepage
//   const homepageFile = path.join(DATA_DIR, 'page_default.json');
//   if (await fs.pathExists(homepageFile)) {
//     const homePageData = await fs.readJson(homepageFile);
//     parsedContent.homepage = await parseHomepage(homePageData);
//
//     // Extract organizations from homepage
//     const homeOrgs = extractOrganizations(homePageData.content);
//     homeOrgs.forEach(org => parsedContent.organizations.add(org));
//   }
//
//   // Parse Regional Community Pages
//   const rcFiles = (await fs.readdir(DATA_DIR))
//     .filter(f => f.startsWith('page_rc_') && !f.includes('404') && f.endsWith('.json'))
//     .filter(f => {
//       // Only take files ending with _.json (full pages, not 404s)
//       return f.includes('_.');
//     });
//
//   console.log(`\nFound ${rcFiles.length} regional community pages to parse\n`);
//
//   for (const file of rcFiles) {
//     const slug = file.replace('page_rc_', '').replace('_.json', '').replace('.json', '');
//     const pageData = await fs.readJson(path.join(DATA_DIR, file));
//
//     if (pageData.content && pageData.content.length > 10000) { // Skip 404s and empty pages
//       const parsed = parseRegionalCommunityPage(pageData, slug);
//       parsedContent.regionalCommunityPages.push(parsed);
//
//       // Extract organizations
//       const orgs = extractOrganizations(pageData.content);
//       orgs.forEach(org => parsedContent.organizations.add(org));
//
//       // Extract team members
//       const members = extractTeamMembers(pageData.content, slug);
//       parsedContent.teamMembers.push(...members);
//     }
//   }
//
//   // Convert Set to Array for JSON serialization
//   const finalContent = {
//     homepage: parsedContent.homepage,
//     regionalCommunityPages: parsedContent.regionalCommunityPages,
//     organizations: Array.from(parsedContent.organizations),
//     teamMembers: parsedContent.teamMembers,
//   };
//
//   // Save parsed content
//   await fs.ensureDir(OUTPUT_DIR);
//   await fs.writeJson(path.join(OUTPUT_DIR, 'complete-parsed-content.json'), finalContent, { spaces: 2 });
//
//   // Generate detailed report
//   const report = `# Complete Content Parsing Report
//
// **Generated:** ${new Date().toISOString()}
//
// ## Summary
//
// - ✅ Homepage: ${finalContent.homepage ? 'Parsed' : 'Not found'}
// - ✅ Homepage Sections: ${finalContent.homepage ? Object.keys(finalContent.homepage.sections).length : 0}/11
// - ✅ Regional Community Pages: ${finalContent.regionalCommunityPages.length} pages
// - ✅ Organizations Extracted: ${finalContent.organizations.length}
// - ✅ Team Members Extracted: ${finalContent.teamMembers.length}
//
// ## Homepage Sections Extracted
//
// ${finalContent.homepage ? Object.keys(finalContent.homepage.sections).map((key, i) => `${i + 1}. ${key}`).join('\n') : 'Not parsed'}
//
// ## Regional Community Pages
//
// ${finalContent.regionalCommunityPages.map(p => {
//   const teamCount = p._teamMembers ? p._teamMembers.length : 0;
//   return `- **${p.title}** (${p.slug.current})
//   - Welcome Hero: ${p.welcomeHero ? '✅' : '❌'}
//   - Why Join CTA: ${p.whyJoinCTA ? '✅' : '❌'}
//   - Team Members: ${teamCount}`;
// }).join('\n')}
//
// ## Organizations Extracted
//
// ${finalContent.organizations.map(org => `- ${org}`).join('\n')}
//
// ## Team Members by Region
//
// ${Object.entries(
//   finalContent.teamMembers.reduce((acc: any, member) => {
//     const region = member.region || 'Unknown';
//     if (!acc[region]) acc[region] = [];
//     acc[region].push(member);
//     return acc;
//   }, {})
// ).map(([region, members]: [string, any]) => {
//   return `### ${region}\n${members.map((m: any) => `- ${m.title || ''} ${m.name}${m.affiliation ? ` (${m.affiliation})` : ''}`).join('\n')}`;
// }).join('\n\n')}
//
// ## Next Steps
//
// 1. Review parsed content in \`complete-parsed-content.json\`
// 2. Verify team member names and affiliations
// 3. Match organizations to team members
// 4. Proceed to Phase 2: PDF Grouping Fix
// 5. Then Phase 3: Generate NDJSON files
//
// ---
//
// **Note:** Some homepage sections may still need manual review. The parser extracted all available content from the HTML structure.
// `;
//
//   await fs.writeFile(path.join(OUTPUT_DIR, 'complete-parsing-report.md'), report);
//
//   console.log('\n' + '='.repeat(60));
//   console.log('\n✅ Complete Parsing Finished!');
//   console.log(`   Homepage: ${finalContent.homepage ? 'OK' : 'MISSING'}`);
//   console.log(`   Homepage Sections: ${finalContent.homepage ? Object.keys(finalContent.homepage.sections).length : 0}/11`);
//   console.log(`   Regional Pages: ${finalContent.regionalCommunityPages.length}`);
//   console.log(`   Organizations: ${finalContent.organizations.length}`);
//   console.log(`   Team Members: ${finalContent.teamMembers.length}`);
//   console.log('\n📄 Output:');
//   console.log(`   - ${OUTPUT_DIR}/complete-parsed-content.json`);
//   console.log(`   - ${OUTPUT_DIR}/complete-parsing-report.md`);
// }
//
// // Run if called directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   parseAllContent().catch(console.error);
// }
//
// export { parseAllContent };
