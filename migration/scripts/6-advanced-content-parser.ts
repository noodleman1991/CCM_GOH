// #!/usr/bin/env tsx
// /**
//  * Advanced Content Parser - Plasmic to Sanity
//  * Uses Plasmic component class names for accurate extraction
//  * Confidence scoring for each extraction
//  * Best practices: Sanity v4 document-level translation
//  */
//
// import fs from 'fs-extra';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import * as cheerio from 'cheerio';
// import TurndownService from 'turndown';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const DATA_DIR = path.join(__dirname, '..', 'data');
// const OUTPUT_DIR = path.join(__dirname, '..', 'output');
//
// const turndownService = new TurndownService({
//   headingStyle: 'atx',
//   codeBlockStyle: 'fenced',
//   bulletListMarker: '-',
// });
//
// interface ConfidenceScore {
//   score: number; // 0-100
//   reason: string;
//   dataQuality: 'high' | 'medium' | 'low' | 'missing';
// }
//
// interface ExtractedSection {
//   _type: string;
//   title?: any;
//   subtitle?: any;
//   description?: any;
//   image?: string;
//   buttons?: Array<{ text: string; url: string }>;
//   confidence: ConfidenceScore;
// }
//
// /**
//  * Convert HTML to Sanity Portable Text (production-ready)
//  */
// function htmlToPortableText(html: string): any[] {
//   if (!html || html.trim() === '') return [];
//
//   const markdown = turndownService.turndown(html);
//   const blocks: any[] = [];
//   const lines = markdown.split('\n');
//
//   let currentList: any[] = [];
//   let isInList = false;
//
//   for (let line of lines) {
//     line = line.trim();
//     if (!line) {
//       if (isInList && currentList.length > 0) {
//         blocks.push(...currentList);
//         currentList = [];
//         isInList = false;
//       }
//       continue;
//     }
//
//     const createBlock = (style: string, text: string, listItem?: string) => ({
//       _type: 'block',
//       _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//       style,
//       ...(listItem && { listItem }),
//       children: [{ _type: 'span', text, marks: [] }],
//       markDefs: [],
//     });
//
//     if (line.startsWith('# ')) {
//       blocks.push(createBlock('h1', line.substring(2)));
//     } else if (line.startsWith('## ')) {
//       blocks.push(createBlock('h2', line.substring(3)));
//     } else if (line.startsWith('### ')) {
//       blocks.push(createBlock('h3', line.substring(4)));
//     } else if (line.startsWith('- ') || line.startsWith('* ')) {
//       isInList = true;
//       currentList.push(createBlock('normal', line.substring(2), 'bullet'));
//     } else if (/^\d+\.\s/.test(line)) {
//       isInList = true;
//       currentList.push(createBlock('normal', line.replace(/^\d+\.\s/, ''), 'number'));
//     } else {
//       if (isInList && currentList.length > 0) {
//         blocks.push(...currentList);
//         currentList = [];
//         isInList = false;
//       }
//       blocks.push(createBlock('normal', line));
//     }
//   }
//
//   if (currentList.length > 0) {
//     blocks.push(...currentList);
//   }
//
//   return blocks;
// }
//
// /**
//  * Calculate confidence score based on data completeness
//  */
// function calculateConfidence(
//   extracted: Record<string, any>,
//   required: string[],
//   optional: string[] = []
// ): ConfidenceScore {
//   const totalRequired = required.length;
//   const foundRequired = required.filter(key => extracted[key] && extracted[key] !== '').length;
//   const foundOptional = optional.filter(key => extracted[key] && extracted[key] !== '').length;
//
//   const requiredScore = (foundRequired / totalRequired) * 80; // 80% weight
//   const optionalScore = optional.length > 0 ? (foundOptional / optional.length) * 20 : 20; // 20% weight
//   const score = Math.round(requiredScore + optionalScore);
//
//   let dataQuality: 'high' | 'medium' | 'low' | 'missing';
//   let reason: string;
//
//   if (score >= 90) {
//     dataQuality = 'high';
//     reason = 'All required fields extracted with high confidence';
//   } else if (score >= 70) {
//     dataQuality = 'medium';
//     reason = `${foundRequired}/${totalRequired} required fields extracted`;
//   } else if (score >= 40) {
//     dataQuality = 'low';
//     reason = `Only ${foundRequired}/${totalRequired} required fields found - may need manual review`;
//   } else {
//     dataQuality = 'missing';
//     reason = `Extraction failed - ${foundRequired}/${totalRequired} required fields missing`;
//   }
//
//   return { score, reason, dataQuality };
// }
//
// /**
//  * Extract Homepage Sections using Plasmic class selectors
//  */
// async function parseHomepageAdvanced(pageData: any): Promise<any> {
//   console.log('\n📄 Parsing Homepage (Advanced)...\n');
//
//   const content = pageData.content || '';
//   const $ = cheerio.load(content);
//
//   const homepage: any = {
//     _type: 'homepage',
//     _id: 'homepage-en',
//     language: 'en',
//     title: { en: 'Connecting Climate Minds Hub' },
//     sections: {},
//     _metadata: {
//       extractedSections: 0,
//       totalSections: 11,
//       overallConfidence: 0,
//     },
//   };
//
//   const confidenceScores: number[] = [];
//
//   // Section 1: Hero Welcome
//   console.log('  Extracting Section 1: Hero Welcome...');
//   const heroHeader = $('[class*="hpheroheader"]').first();
//   const heroText = $('[class*="hpherotxt"]').first();
//   const heroButtons = $('[class*="hpherobtbn"]');
//
//   if (heroHeader.length || heroText.length) {
//     const title = heroHeader.text().trim() || 'Welcome to Connecting Climate Minds Hub';
//     const description = heroText.text().trim();
//     const buttons: any[] = [];
//
//     heroButtons.find('a, button').each((i, btn) => {
//       const text = $(btn).text().trim();
//       const url = $(btn).attr('href') || '#';
//       if (text) buttons.push({ text, url });
//     });
//
//     const extracted = { title, description, buttons };
//     const confidence = calculateConfidence(extracted, ['title'], ['description', 'buttons']);
//     confidenceScores.push(confidence.score);
//
//     homepage.sections.heroWelcome = {
//       _type: 'hero-1',
//       title: { en: title },
//       subtitle: { en: 'Catalysing a global research community' },
//       description: description ? htmlToPortableText(description) : [],
//       buttons,
//       _confidence: confidence,
//     };
//
//     console.log(`    ✅ Confidence: ${confidence.score}% - ${confidence.dataQuality}`);
//     homepage._metadata.extractedSections++;
//   } else {
//     console.log(`    ⚠️ Not found - adding placeholder`);
//     homepage.sections.heroWelcome = {
//       _type: 'hero-1',
//       title: { en: 'Placeholder for: Welcome Hero Section' },
//       description: htmlToPortableText('Content to be added manually'),
//       _confidence: { score: 0, reason: 'Section not found in HTML', dataQuality: 'missing' },
//     };
//   }
//
//   // Section 2: How to Use Hub
//   console.log('  Extracting Section 2: How to Use Hub...');
//   const howToUse = $('[class*="howToUseHub"]');
//
//   if (howToUse.length) {
//     const title = howToUse.find('h2, h3, [class*="header"]').first().text().trim();
//     const description = howToUse.find('p').text().trim();
//     const image = howToUse.find('img').first().attr('src');
//
//     const extracted = { title, description };
//     const confidence = calculateConfidence(extracted, ['title'], ['description', 'image']);
//     confidenceScores.push(confidence.score);
//
//     homepage.sections.howToUse = {
//       _type: 'split-row',
//       title: { en: title || 'How to Use the Hub' },
//       description: description ? htmlToPortableText(description) : [],
//       image,
//       _confidence: confidence,
//     };
//
//     console.log(`    ✅ Confidence: ${confidence.score}% - ${confidence.dataQuality}`);
//     homepage._metadata.extractedSections++;
//   } else {
//     console.log(`    ⚠️ Not found - adding placeholder`);
//     homepage.sections.howToUse = {
//       _type: 'split-row',
//       title: { en: 'Placeholder for: How to Use the Hub' },
//       description: htmlToPortableText('Content to be added manually'),
//       _confidence: { score: 0, reason: 'Section not found', dataQuality: 'missing' },
//     };
//   }
//
//   // Section 3: Global Agenda
//   console.log('  Extracting Section 3: Global Agenda...');
//   // Look for sections with "global" or "agenda" in text
//   let globalAgendaSection = null;
//   $('section, div[class*="section"]').each((i, elem) => {
//     const text = $(elem).text().toLowerCase();
//     if (text.includes('global') && text.includes('agenda')) {
//       globalAgendaSection = $(elem);
//       return false; // break
//     }
//   });
//
//   if (globalAgendaSection) {
//     const title = globalAgendaSection.find('h2, h3').first().text().trim();
//     const description = globalAgendaSection.find('p').first().text().trim();
//     const image = globalAgendaSection.find('img').first().attr('src');
//
//     const extracted = { title, description };
//     const confidence = calculateConfidence(extracted, ['title'], ['description', 'image']);
//     confidenceScores.push(confidence.score);
//
//     homepage.sections.globalAgenda = {
//       _type: 'split-row',
//       title: { en: title || 'Global Research and Action Agenda' },
//       description: description ? htmlToPortableText(description) : [],
//       image,
//       _confidence: confidence,
//     };
//
//     console.log(`    ✅ Confidence: ${confidence.score}% - ${confidence.dataQuality}`);
//     homepage._metadata.extractedSections++;
//   } else {
//     console.log(`    ⚠️ Not found - adding placeholder`);
//     homepage.sections.globalAgenda = {
//       _type: 'split-row',
//       title: { en: 'Placeholder for: Global Research and Action Agenda' },
//       description: htmlToPortableText('Content to be added manually'),
//       _confidence: { score: 0, reason: 'Section not found', dataQuality: 'missing' },
//     };
//   }
//
//   // Section 4: Research Agendas Module
//   console.log('  Extracting Section 4: Research Agendas Module...');
//   const agendaBtn = $('[class*="bxbtn1Agenda"]').first();
//   const agendaSection = agendaBtn.closest('section, div[class*="section"]');
//
//   if (agendaSection.length) {
//     const title = agendaSection.find('h2, h3').first().text().trim();
//     const description = agendaSection.find('p').first().text().trim();
//
//     const extracted = { title };
//     const confidence = calculateConfidence(extracted, ['title'], ['description']);
//     confidenceScores.push(confidence.score);
//
//     homepage.sections.agendasModule = {
//       _type: 'grid-row',
//       title: { en: title || 'Research Agendas' },
//       description: description ? htmlToPortableText(description) : [],
//       _confidence: confidence,
//     };
//
//     console.log(`    ✅ Confidence: ${confidence.score}% - ${confidence.dataQuality}`);
//     homepage._metadata.extractedSections++;
//   } else {
//     console.log(`    ⚠️ Not found - adding placeholder`);
//     homepage.sections.agendasModule = {
//       _type: 'grid-row',
//       title: { en: 'Placeholder for: Research Agendas' },
//       description: htmlToPortableText('Content to be added manually'),
//       _confidence: { score: 0, reason: 'Section not found', dataQuality: 'missing' },
//     };
//   }
//
//   // Section 5: Collaboration
//   console.log('  Extracting Section 5: Collaboration...');
//   const collabHeader = $('[class*="collabheader"]').first();
//   const collabText = $('[class*="collabtxt"]').first();
//   const collabBtn = $('[class*="collabbtn"]').first();
//
//   if (collabHeader.length || collabText.length) {
//     const title = collabHeader.text().trim();
//     const description = collabText.text().trim();
//     const buttonText = collabBtn.text().trim();
//     const buttonUrl = collabBtn.attr('href') || collabBtn.find('a').attr('href');
//
//     const extracted = { title, description };
//     const confidence = calculateConfidence(extracted, ['title'], ['description']);
//     confidenceScores.push(confidence.score);
//
//     homepage.sections.collaboration = {
//       _type: 'split-row',
//       title: { en: title || 'Collaborate with Us' },
//       description: description ? htmlToPortableText(description) : [],
//       buttons: buttonText ? [{ text: buttonText, url: buttonUrl || '#' }] : [],
//       _confidence: confidence,
//     };
//
//     console.log(`    ✅ Confidence: ${confidence.score}% - ${confidence.dataQuality}`);
//     homepage._metadata.extractedSections++;
//   } else {
//     console.log(`    ⚠️ Not found - adding placeholder`);
//     homepage.sections.collaboration = {
//       _type: 'split-row',
//       title: { en: 'Placeholder for: Collaboration Section' },
//       description: htmlToPortableText('Content to be added manually'),
//       _confidence: { score: 0, reason: 'Section not found', dataQuality: 'missing' },
//     };
//   }
//
//   // Sections 6-11: Search by text content
//   const remainingSections = [
//     { field: 'livedExperiences', type: 'carousel-2', keywords: ['lived experience', 'voices', 'stories'], title: 'Lived Experiences' },
//     { field: 'regionalCommunities', type: 'grid-row', keywords: ['regional communit'], title: 'Regional Communities' },
//     { field: 'news', type: 'grid-row', keywords: ['news', 'updates', 'latest'], title: 'News & Updates' },
//     { field: 'projectInfo', type: 'split-row', keywords: ['about', 'project', 'connecting climate minds'], title: 'About the Project' },
//     { field: 'mentalHealthDefinition', type: 'cta-1', keywords: ['mental health', 'what is mental health'], title: 'What is Mental Health?' },
//     { field: 'partnerLogos', type: 'logo-cloud-1', keywords: ['partner', 'supported by', 'collaboration'], title: 'Our Partners' },
//   ];
//
//   for (const section of remainingSections) {
//     console.log(`  Extracting Section: ${section.title}...`);
//     let found = false;
//
//     $('section, div[class*="section"]').each((i, elem) => {
//       const text = $(elem).text().toLowerCase();
//       const hasKeyword = section.keywords.some(kw => text.includes(kw));
//
//       if (hasKeyword) {
//         const title = $(elem).find('h2, h3').first().text().trim();
//         const description = $(elem).find('p').first().text().trim();
//
//         const extracted = { title };
//         const confidence = calculateConfidence(extracted, [], ['title', 'description']);
//         confidenceScores.push(confidence.score);
//
//         homepage.sections[section.field] = {
//           _type: section.type,
//           title: { en: title || section.title },
//           description: description ? htmlToPortableText(description) : [],
//           _confidence: confidence,
//         };
//
//         console.log(`    ✅ Confidence: ${confidence.score}% - ${confidence.dataQuality}`);
//         homepage._metadata.extractedSections++;
//         found = true;
//         return false; // break
//       }
//     });
//
//     if (!found) {
//       console.log(`    ⚠️ Not found - adding placeholder`);
//       homepage.sections[section.field] = {
//         _type: section.type,
//         title: { en: `Placeholder for: ${section.title}` },
//         description: htmlToPortableText('Content to be added manually'),
//         _confidence: { score: 0, reason: 'Section not found', dataQuality: 'missing' },
//       };
//     }
//   }
//
//   // Calculate overall confidence
//   homepage._metadata.overallConfidence = Math.round(
//     confidenceScores.reduce((a, b) => a + b, 0) / Math.max(confidenceScores.length, 1)
//   );
//
//   console.log(`\n  ✅ Homepage Extraction Complete:`);
//   console.log(`     Sections Found: ${homepage._metadata.extractedSections}/11`);
//   console.log(`     Overall Confidence: ${homepage._metadata.overallConfidence}%\n`);
//
//   return homepage;
// }
//
// /**
//  * Parse Regional Community Page (Advanced)
//  */
// function parseRegionalCommunityAdvanced(pageData: any, slug: string): any {
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
//     _confidence: {},
//   };
//
//   // Extract Welcome Hero using Plasmic SubpageHeader class
//   const headerSection = $('[class*="SubpageHeader"]').first();
//   if (headerSection.length) {
//     const title = headerSection.find('[class*="text"]:first, h1, h2').first().text().trim();
//     const description = headerSection.find('p, [class*="text"]').eq(1).text().trim();
//     const image = headerSection.find('img').attr('src');
//
//     const extracted = { title, description };
//     const confidence = calculateConfidence(extracted, ['title'], ['description', 'image']);
//
//     page.welcomeHero = {
//       _type: 'hero-1',
//       title: { en: title },
//       description: description ? htmlToPortableText(description) : [],
//       image,
//     };
//     page._confidence.welcomeHero = confidence;
//
//     console.log(`  ✅ Welcome Hero: ${confidence.score}% confidence`);
//   } else {
//     console.log(`  ⚠️ Welcome Hero: Not found - adding placeholder`);
//     page.welcomeHero = {
//       _type: 'hero-1',
//       title: { en: `Placeholder for: ${slug} Welcome Hero` },
//       description: htmlToPortableText('Content to be added manually'),
//     };
//     page._confidence.welcomeHero = { score: 0, reason: 'Section not found', dataQuality: 'missing' };
//   }
//
//   // Extract Why Join CTA using InfoModule class
//   const infoModule = $('[class*="InfoModule"]').first();
//   if (infoModule.length) {
//     const title = infoModule.find('h2, h3, [class*="header"]').first().text().trim();
//     const bullets: string[] = [];
//
//     infoModule.find('ul li, ol li').each((i, li) => {
//       const text = $(li).text().trim();
//       if (text) bullets.push(text);
//     });
//
//     if (bullets.length > 0) {
//       const extracted = { title, bullets };
//       const confidence = calculateConfidence(extracted, ['bullets'], ['title']);
//
//       page.whyJoinCTA = {
//         _type: 'cta-1',
//         title: { en: title || 'Why Join Our Regional Community?' },
//         description: bullets.map(text => ({
//           _type: 'block',
//           _key: `block-${Math.random().toString(36).substr(2, 9)}`,
//           style: 'normal',
//           listItem: 'bullet',
//           children: [{ _type: 'span', text, marks: [] }],
//           markDefs: [],
//         })),
//       };
//       page._confidence.whyJoinCTA = confidence;
//
//       console.log(`  ✅ Why Join CTA: ${confidence.score}% confidence (${bullets.length} points)`);
//     }
//   } else {
//     console.log(`  ⚠️ Why Join CTA: Not found - adding placeholder`);
//     page.whyJoinCTA = {
//       _type: 'cta-1',
//       title: { en: `Placeholder for: Why Join ${slug}` },
//       description: htmlToPortableText('Content to be added manually'),
//     };
//     page._confidence.whyJoinCTA = { score: 0, reason: 'Section not found', dataQuality: 'missing' };
//   }
//
//   return page;
// }
//
// /**
//  * Main execution
//  */
// async function parseAll() {
//   console.log('🔍 Advanced Content Parser - Plasmic to Sanity\n');
//   console.log('='.repeat(70) + '\n');
//
//   const results: any = {
//     homepage: null,
//     regionalCommunityPages: [],
//     _summary: {
//       homepageConfidence: 0,
//       rcPagesConfidence: [],
//       missingSections: [],
//     },
//   };
//
//   // Parse Homepage
//   const homepageFile = path.join(DATA_DIR, 'pagehomepage.json');
//   if (await fs.pathExists(homepageFile)) {
//     const homePageData = await fs.readJson(homepageFile);
//     results.homepage = await parseHomepageAdvanced(homePageData);
//     results._summary.homepageConfidence = results.homepage._metadata.overallConfidence;
//
//     // Track missing sections
//     for (const [key, section] of Object.entries(results.homepage.sections)) {
//       if ((section as any)._confidence?.dataQuality === 'missing') {
//         results._summary.missingSections.push(`Homepage: ${key}`);
//       }
//     }
//   }
//
//   // Parse Regional Community Pages
//   const rcFiles = (await fs.readdir(DATA_DIR))
//     .filter(f => f.startsWith('page_rc_') && f.includes('_.'));
//
//   for (const file of rcFiles) {
//     const slug = file.replace('page_rc_', '').replace('_.json', '');
//     const pageData = await fs.readJson(path.join(DATA_DIR, file));
//
//     if (pageData.content && pageData.content.length > 10000) {
//       const parsed = parseRegionalCommunityAdvanced(pageData, slug);
//       results.regionalCommunityPages.push(parsed);
//
//       // Calculate page confidence
//       const confidences = Object.values(parsed._confidence).map((c: any) => c.score);
//       const avgConfidence = Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length);
//       results._summary.rcPagesConfidence.push({ slug, confidence: avgConfidence });
//
//       // Track missing sections
//       for (const [key, conf] of Object.entries(parsed._confidence)) {
//         if ((conf as any).dataQuality === 'missing') {
//           results._summary.missingSections.push(`${slug}: ${key}`);
//         }
//       }
//     }
//   }
//
//   // Save results
//   await fs.ensureDir(OUTPUT_DIR);
//   await fs.writeJson(path.join(OUTPUT_DIR, 'advanced-parsed-content.json'), results, { spaces: 2 });
//
//   // Generate report
//   const report = generateReport(results);
//   await fs.writeFile(path.join(OUTPUT_DIR, 'CONTENT-EXTRACTION-REPORT.md'), report);
//
//   console.log('\n' + '='.repeat(70));
//   console.log('\n✅ Advanced Parsing Complete!');
//   console.log(`\n📊 Results:`);
//   console.log(`   Homepage Confidence: ${results._summary.homepageConfidence}%`);
//   console.log(`   RC Pages: ${results.regionalCommunityPages.length}`);
//   console.log(`   Missing Sections: ${results._summary.missingSections.length}`);
//   console.log(`\n📄 Output:`);
//   console.log(`   - ${OUTPUT_DIR}/advanced-parsed-content.json`);
//   console.log(`   - ${OUTPUT_DIR}/CONTENT-EXTRACTION-REPORT.md`);
// }
//
// function generateReport(results: any): string {
//   return `# Content Extraction Report - Advanced Parser
//
// **Generated:** ${new Date().toISOString()}
//
// ## Overall Results
//
// - **Homepage Confidence:** ${results._summary.homepageConfidence}%
// - **Sections Extracted:** ${results.homepage._metadata.extractedSections}/11
// - **Regional Pages:** ${results.regionalCommunityPages.length}
// - **Total Missing Sections:** ${results._summary.missingSections.length}
//
// ---
//
// ## Homepage Sections Breakdown
//
// ${Object.entries(results.homepage.sections)
//   .map(([key, section]: [string, any]) => {
//     const conf = section._confidence;
//     const icon = conf.dataQuality === 'high' ? '✅' : conf.dataQuality === 'medium' ? '⚠️' : conf.dataQuality === 'low' ? '❗' : '❌';
//     return `### ${icon} ${key}
// - **Confidence:** ${conf.score}%
// - **Quality:** ${conf.dataQuality}
// - **Reason:** ${conf.reason}
// - **Status:** ${conf.dataQuality === 'missing' ? '**PLACEHOLDER ADDED**' : 'Extracted'}
// `;
//   })
//   .join('\n')}
//
// ---
//
// ## Regional Community Pages
//
// ${results.regionalCommunityPages
//   .map((page: any) => {
//     const welcomeConf = page._confidence.welcomeHero;
//     const ctaConf = page._confidence.whyJoinCTA;
//     return `### ${page.title}
// - Welcome Hero: ${welcomeConf.score}% (${welcomeConf.dataQuality})
// - Why Join CTA: ${ctaConf.score}% (${ctaConf.dataQuality})
// `;
//   })
//   .join('\n')}
//
// ---
//
// ## Missing Sections Summary
//
// ${results._summary.missingSections.length > 0 ? results._summary.missingSections.map((s: string) => `- ${s}`).join('\n') : '_None - all sections extracted!_'}
//
// ---
//
// ## Next Steps
//
// 1. **Review placeholders** in \`advanced-parsed-content.json\`
// 2. **Manual entry required** for sections with "missing" status
// 3. **Verify confidence scores** - review sections with <70% confidence
// 4. Continue to PDF grouping and NDJSON generation
//
// ---
//
// ## Sanity v4 Translation Strategy
//
// Following best practices (October 2024):
// - Use **@sanity/document-internationalization** plugin
// - Each language = separate document
// - Documents linked via reference with "language" field
// - Configure in sanity.config.ts with supportedLanguages
//
// **Recommended structure:**
// \`\`\`typescript
// {
//   _id: 'homepage-en',
//   _type: 'homepage',
//   language: 'en',
//   // ... content
// }
// {
//   _id: 'homepage-es',
//   _type: 'homepage',
//   language: 'es',
//   // ... translated content
//   _translations: [{ _ref: 'homepage-en' }]
// }
// \`\`\`
// `;
// }
//
// if (import.meta.url === `file://${process.argv[1]}`) {
//   parseAll().catch(console.error);
// }
//
// export { parseAll };
