import { createClient } from '@sanity/client';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Translation cache
const translationCache = {};

/**
 * Translate text using Claude AI
 */
async function translateWithClaude(text, targetLang, contentType = 'text') {
  if (!text || text.trim() === '') return text;

  const cacheKey = `${text}_${targetLang}_${contentType}`;

  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  const langNames = {
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic'
  };

  const contextGuide = contentType === 'title'
    ? 'This is a page title or heading. Keep it clear and engaging.'
    : contentType === 'button'
    ? 'This is button or link text. Keep it concise (1-3 words).'
    : contentType === 'alt'
    ? 'This is image alt text for accessibility. Keep it descriptive but concise.'
    : contentType === 'meta'
    ? 'This is SEO meta description. Keep it informative and within 160 characters.'
    : 'This is body text. Maintain the tone and meaning accurately.';

  const prompt = `Translate the following ${contentType} from English to ${langNames[targetLang]}.

${contextGuide}

Key terminology to maintain consistency:
- "Connecting Climate Minds" - keep as is (proper name)
- "Climate Change and Mental Health" should be consistently translated
- "Research and Action Agenda" should be consistently translated
- Regional names should use standard UN translations
- Maintain professional, accessible tone

English text:
${text}

Provide ONLY the ${langNames[targetLang]} translation, without any explanation or additional text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const translation = message.content[0].text.trim();
    translationCache[cacheKey] = translation;

    return translation;
  } catch (error) {
    console.error(`    ✗ Translation error for ${targetLang}:`, error.message);
    return text; // Fallback to English
  }
}

/**
 * Translate block content (rich text)
 */
async function translateBlockContent(blockContent, targetLang) {
  if (!blockContent || !Array.isArray(blockContent)) return blockContent;

  const translatedBlocks = [];

  for (const block of blockContent) {
    if (block._type === 'block') {
      const translatedChildren = [];

      for (const child of block.children) {
        if (child._type === 'span' && child.text) {
          const translatedText = await translateWithClaude(child.text, targetLang, 'text');
          translatedChildren.push({
            ...child,
            text: translatedText
          });
          await delay(300);
        } else {
          translatedChildren.push(child);
        }
      }

      translatedBlocks.push({
        ...block,
        children: translatedChildren
      });
    } else {
      translatedBlocks.push(block);
    }
  }

  return translatedBlocks;
}

/**
 * Translate link object
 */
async function translateLink(link, targetLang) {
  if (!link) return link;

  const translatedTitle = await translateWithClaude(link.title, targetLang, 'button');
  await delay(300);

  return {
    ...link,
    title: translatedTitle
  };
}

/**
 * Translate links array
 */
async function translateLinks(links, targetLang) {
  if (!links || !Array.isArray(links)) return links;

  const translatedLinks = [];
  for (const link of links) {
    translatedLinks.push(await translateLink(link, targetLang));
  }
  return translatedLinks;
}

/**
 * Translate split-row section
 */
async function translateSplitRow(splitRow, targetLang, sectionName) {
  console.log(`    Translating ${sectionName}...`);

  if (!splitRow || !splitRow.splitColumns) return splitRow;

  const translatedColumns = [];

  for (const column of splitRow.splitColumns) {
    if (column._type === 'split-content') {
      const translatedTitle = await translateWithClaude(column.title, targetLang, 'title');
      await delay(300);

      const translatedBody = column.body ?
        await translateBlockContent(column.body, targetLang) : null;

      const translatedLink = column.link ?
        await translateLink(column.link, targetLang) : null;

      translatedColumns.push({
        ...column,
        title: translatedTitle,
        body: translatedBody,
        link: translatedLink
      });
    } else {
      translatedColumns.push(column);
    }
  }

  return {
    ...splitRow,
    splitColumns: translatedColumns
  };
}

/**
 * Translate hero-1 section
 */
async function translateHero(hero, targetLang) {
  console.log(`    Translating hero section...`);

  const translatedTitle = await translateWithClaude(hero.title, targetLang, 'title');
  await delay(300);

  const translatedTagLine = hero.tagLine ?
    await translateWithClaude(hero.tagLine, targetLang, 'text') : null;
  if (translatedTagLine) await delay(300);

  const translatedBody = hero.body ?
    await translateBlockContent(hero.body, targetLang) : null;

  const translatedLinks = hero.links ?
    await translateLinks(hero.links, targetLang) : null;

  return {
    ...hero,
    title: translatedTitle,
    tagLine: translatedTagLine,
    body: translatedBody,
    links: translatedLinks
  };
}

/**
 * Translate grid-row section
 */
async function translateGridRow(gridRow, targetLang, sectionName) {
  console.log(`    Translating ${sectionName}...`);

  const translatedTitle = await translateWithClaude(gridRow.title, targetLang, 'title');
  await delay(300);

  const translatedDescription = gridRow.description ?
    await translateBlockContent(gridRow.description, targetLang) : null;

  // Translate columns
  const translatedColumns = [];
  if (gridRow.columns && Array.isArray(gridRow.columns)) {
    for (const column of gridRow.columns) {
      if (column._type === 'grid-card') {
        const translatedCardTitle = await translateWithClaude(column.title, targetLang, 'title');
        await delay(300);

        const translatedExcerpt = column.excerpt ?
          await translateWithClaude(column.excerpt, targetLang, 'text') : null;
        if (translatedExcerpt) await delay(300);

        const translatedLink = column.link ?
          await translateLink(column.link, targetLang) : null;

        translatedColumns.push({
          ...column,
          title: translatedCardTitle,
          excerpt: translatedExcerpt,
          link: translatedLink
        });
      } else {
        // grid-agenda, grid-news, etc. - keep references as is
        translatedColumns.push(column);
      }
    }
  }

  return {
    ...gridRow,
    title: translatedTitle,
    description: translatedDescription,
    columns: translatedColumns
  };
}

/**
 * Translate carousel-2 section
 */
async function translateCarousel(carousel, targetLang) {
  console.log(`    Translating carousel section...`);

  const translatedTitle = await translateWithClaude(carousel.title, targetLang, 'title');
  await delay(300);

  const translatedDescription = carousel.description ?
    await translateWithClaude(carousel.description, targetLang, 'text') : null;
  if (translatedDescription) await delay(300);

  return {
    ...carousel,
    title: translatedTitle,
    description: translatedDescription,
    // testimonial references stay the same
  };
}

/**
 * Translate cta-1 section
 */
async function translateCta(cta, targetLang) {
  console.log(`    Translating CTA section...`);

  const translatedTitle = await translateWithClaude(cta.title, targetLang, 'title');
  await delay(300);

  const translatedBody = cta.body ?
    await translateBlockContent(cta.body, targetLang) : null;

  const translatedTagLine = cta.tagLine ?
    await translateWithClaude(cta.tagLine, targetLang, 'text') : null;
  if (translatedTagLine) await delay(300);

  const translatedLinks = cta.links ?
    await translateLinks(cta.links, targetLang) : null;

  return {
    ...cta,
    title: translatedTitle,
    body: translatedBody,
    tagLine: translatedTagLine,
    links: translatedLinks
  };
}

/**
 * Translate logo-cloud-1 section
 */
async function translateLogoCloud(logoCloud, targetLang) {
  console.log(`    Translating logo cloud section...`);

  const translatedTitle = await translateWithClaude(logoCloud.title, targetLang, 'title');
  await delay(300);

  const translatedDescription = logoCloud.description ?
    await translateWithClaude(logoCloud.description, targetLang, 'text') : null;
  if (translatedDescription) await delay(300);

  return {
    ...logoCloud,
    title: translatedTitle,
    description: translatedDescription,
    // images stay the same
  };
}

/**
 * Translate entire homepage
 */
async function translateHomepage(homepage, targetLang) {
  console.log(`\n🌍 Translating homepage to ${targetLang.toUpperCase()}...`);

  const langNames = {
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic'
  };

  console.log(`  Language: ${langNames[targetLang]}`);

  const translatedHomepage = {
    _type: 'homepage',
    _id: `homepage-${targetLang}`,
    title: 'Homepage',
    language: targetLang,
    slug: {
      _type: 'slug',
      current: 'index',
    },
  };

  // Translate each section
  if (homepage.heroWelcome) {
    translatedHomepage.heroWelcome = await translateHero(homepage.heroWelcome, targetLang);
  }

  if (homepage.globalAgenda) {
    translatedHomepage.globalAgenda = await translateSplitRow(homepage.globalAgenda, targetLang, 'globalAgenda');
  }

  if (homepage.howToUse) {
    translatedHomepage.howToUse = await translateSplitRow(homepage.howToUse, targetLang, 'howToUse');
  }

  if (homepage.agendasModule) {
    translatedHomepage.agendasModule = await translateGridRow(homepage.agendasModule, targetLang, 'agendasModule');
  }

  if (homepage.livedExperiences) {
    translatedHomepage.livedExperiences = await translateCarousel(homepage.livedExperiences, targetLang);
  }

  if (homepage.regionalCommunities) {
    translatedHomepage.regionalCommunities = await translateGridRow(homepage.regionalCommunities, targetLang, 'regionalCommunities');
  }

  if (homepage.collaboration) {
    translatedHomepage.collaboration = await translateSplitRow(homepage.collaboration, targetLang, 'collaboration');
  }

  if (homepage.news) {
    translatedHomepage.news = await translateGridRow(homepage.news, targetLang, 'news');
  }

  if (homepage.projectInfo) {
    translatedHomepage.projectInfo = await translateSplitRow(homepage.projectInfo, targetLang, 'projectInfo');
  }

  if (homepage.mentalHealthDefinition) {
    translatedHomepage.mentalHealthDefinition = await translateCta(homepage.mentalHealthDefinition, targetLang);
  }

  if (homepage.partnerLogos) {
    translatedHomepage.partnerLogos = await translateLogoCloud(homepage.partnerLogos, targetLang);
  }

  // Translate SEO fields
  console.log(`    Translating SEO metadata...`);
  if (homepage.meta_title) {
    translatedHomepage.meta_title = await translateWithClaude(homepage.meta_title, targetLang, 'meta');
    await delay(300);
  }

  if (homepage.meta_description) {
    translatedHomepage.meta_description = await translateWithClaude(homepage.meta_description, targetLang, 'meta');
    await delay(300);
  }

  translatedHomepage.noindex = homepage.noindex || false;

  console.log(`  ✅ Translation complete for ${langNames[targetLang]}`);

  return translatedHomepage;
}

/**
 * Delete existing translated homepage
 */
async function deleteTranslatedHomepage(lang) {
  const docId = `homepage-${lang}`;

  try {
    await sanityClient.delete(docId);
    console.log(`  ✓ Deleted existing ${lang} homepage`);
  } catch (error) {
    // Document might not exist, which is fine
    if (error.statusCode === 404) {
      console.log(`  • No existing ${lang} homepage to delete`);
    } else {
      console.error(`  ✗ Error deleting ${lang} homepage:`, error.message);
    }
  }
}

/**
 * Upload translated homepage to Sanity
 */
async function uploadHomepage(homepage) {
  try {
    await sanityClient.createOrReplace(homepage);
    console.log(`  ✅ Uploaded ${homepage.language} homepage to Sanity`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error uploading ${homepage.language} homepage:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🏠 Homepage Translation Script\n');
  console.log('='.repeat(70));
  console.log('Fetching English homepage from Sanity...\n');

  // Fetch English homepage
  const englishHomepage = await sanityClient.fetch(`
    *[_type == "homepage" && language == "en"][0] {
      ...,
      "heroWelcome": heroWelcome,
      "globalAgenda": globalAgenda,
      "howToUse": howToUse,
      "agendasModule": agendasModule,
      "livedExperiences": livedExperiences,
      "regionalCommunities": regionalCommunities,
      "collaboration": collaboration,
      "news": news,
      "projectInfo": projectInfo,
      "mentalHealthDefinition": mentalHealthDefinition,
      "partnerLogos": partnerLogos
    }
  `);

  if (!englishHomepage) {
    console.error('❌ English homepage not found!');
    process.exit(1);
  }

  console.log('✓ English homepage loaded');
  console.log('='.repeat(70));

  const languages = ['es', 'fr', 'ar'];
  let successCount = 0;
  let failCount = 0;

  for (const lang of languages) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Processing ${lang.toUpperCase()} translation...`);
    console.log('='.repeat(70));

    try {
      // Delete existing translated homepage
      await deleteTranslatedHomepage(lang);

      // Translate
      const translatedHomepage = await translateHomepage(englishHomepage, lang);

      // Upload
      const success = await uploadHomepage(translatedHomepage);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Rate limiting between languages
      await delay(2000);

    } catch (error) {
      console.error(`\n❌ Error processing ${lang} translation:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 TRANSLATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total languages: ${languages.length}`);
  console.log(`✅ Successfully translated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(70));

  console.log('\n✨ Homepage translation complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review translations in Sanity Studio');
  console.log('   2. Test homepage in each language');
  console.log('   3. Verify all sections render correctly');

  console.log('\n💾 Translation cache size:', Object.keys(translationCache).length, 'entries');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
