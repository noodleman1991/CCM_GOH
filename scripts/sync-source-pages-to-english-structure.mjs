/**
 * Sync Source Pages to English Structure
 *
 * This script rebuilds the Spanish, French, and Arabic versions of the three
 * source pages to match the English block structure while preserving existing translations.
 *
 * Source Pages:
 * - research-and-action/global-agenda
 * - research-and-action/regional-agendas
 * - research-and-action/community-agendas
 *
 * Usage:
 *   node scripts/sync-source-pages-to-english-structure.mjs [--dry-run]
 *
 * Options:
 *   --dry-run    Preview changes without updating pages
 */

import { createClient } from '@sanity/client';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration
const LANGUAGES = ['es', 'fr', 'ar'];
const SOURCE_PAGES = [
  'research-and-action/global-agenda',
  'research-and-action/regional-agendas',
  'research-and-action/community-agendas'
];

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic'
};

// Manual translations for common terms
const MANUAL_TRANSLATIONS = {
  // Global Agenda page translations
  'Accessible Reader Version': {
    es: 'Versión de Lectura Accesible',
    fr: 'Version Lecteur Accessible',
    ar: 'نسخة القارئ الميسر'
  },
  'Click here to access an online version of the Global Research and Action Agenda.': {
    es: 'Haga clic aquí para acceder a una versión en línea de la Agenda Global de Investigación y Acción.',
    fr: 'Cliquez ici pour accéder à une version en ligne du Programme mondial de recherche et d\'action.',
    ar: 'انقر هنا للوصول إلى النسخة الإلكترونية من الأجندة العالمية للبحث والعمل.'
  },
  'View Accessible Reader': {
    es: 'Ver Lectura Accesible',
    fr: 'Voir le Lecteur Accessible',
    ar: 'عرض القارئ الميسر'
  },
  '1-minute Explainer': {
    es: 'Explicación de 1 minuto',
    fr: 'Explication d\'1 minute',
    ar: 'شرح دقيقة واحدة'
  },
  'Check out this video for a 1-minute explainer of the Global Agenda.': {
    es: 'Consulte este video para una explicación de 1 minuto de la Agenda Global.',
    fr: 'Regardez cette vidéo pour une explication d\'1 minute du Programme mondial.',
    ar: 'شاهد هذا الفيديو للحصول على شرح لمدة دقيقة واحدة عن الأجندة العالمية.'
  },
  'View 1-minute Explainer': {
    es: 'Ver Explicación de 1 minuto',
    fr: 'Voir l\'Explication d\'1 minute',
    ar: 'عرض شرح دقيقة واحدة'
  },
  // Regional Agendas page translations
  'Agendas summary': {
    es: 'Resumen de Agendas',
    fr: 'Résumé des Programmes',
    ar: 'ملخص الأجندات'
  },
  'Agendas': {
    es: 'Agendas',
    fr: 'Programmes',
    ar: 'الأجندات'
  },
  // Community Agendas page translations
  'Youth Research and Action Agenda': {
    es: 'Agenda de Investigación y Acción para la Juventud',
    fr: 'Programme de recherche et d\'action pour la jeunesse',
    ar: 'أجندة البحث والعمل للشباب'
  },
  'This agenda sets out priorities for research that can support youth mental health in the context of climate change, and priority actions to enact and translate that research, informed by insights shared by young people around the world.': {
    es: 'Esta agenda establece prioridades de investigación que pueden apoyar la salud mental de los jóvenes en el contexto del cambio climático, y acciones prioritarias para promulgar y traducir esa investigación, informada por las perspectivas compartidas por jóvenes de todo el mundo.',
    fr: 'Ce programme établit des priorités de recherche qui peuvent soutenir la santé mentale des jeunes dans le contexte du changement climatique, et des actions prioritaires pour promulguer et traduire cette recherche, éclairées par les perspectives partagées par les jeunes du monde entier.',
    ar: 'تحدد هذه الأجندة أولويات البحث التي يمكن أن تدعم الصحة النفسية للشباب في سياق تغير المناخ، والإجراءات ذات الأولوية لتفعيل وترجمة هذا البحث، بناءً على الأفكار المشتركة من قبل الشباب حول العالم.'
  },
  'Indigenous Communities Research and Action Agenda': {
    es: 'Agenda de Investigación y Acción para Comunidades Indígenas',
    fr: 'Programme de recherche et d\'action pour les communautés autochtones',
    ar: 'أجندة البحث والعمل لمجتمعات السكان الأصليين'
  },
  'This agenda sets out priorities for research that can inform action to meet the needs of Indigenous People experiencing and responding to the mental health impacts of climate change, informed by insights shared by Indigenous People and communities around the world.': {
    es: 'Esta agenda establece prioridades de investigación que pueden informar acciones para satisfacer las necesidades de los Pueblos Indígenas que experimentan y responden a los impactos del cambio climático en la salud mental, informada por las perspectivas compartidas por Pueblos y comunidades Indígenas de todo el mundo.',
    fr: 'Ce programme établit des priorités de recherche qui peuvent éclairer l\'action pour répondre aux besoins des peuples autochtones qui vivent et réagissent aux impacts du changement climatique sur la santé mentale, éclairées par les perspectives partagées par les peuples et communautés autochtones du monde entier.',
    ar: 'تحدد هذه الأجندة أولويات البحث التي يمكن أن توجه العمل لتلبية احتياجات الشعوب الأصلية التي تعاني وتستجيب لتأثيرات تغير المناخ على الصحة النفسية، بناءً على الأفكار المشتركة من قبل الشعوب والمجتمعات الأصلية حول العالم.'
  },
  'Small Farmer and Fisher Peoples Research and Action Agenda': {
    es: 'Agenda de Investigación y Acción para Pequeños Agricultores y Pescadores',
    fr: 'Programme de recherche et d\'action pour les petits agriculteurs et pêcheurs',
    ar: 'أجندة البحث والعمل لصغار المزارعين والصيادين'
  },
  'This agenda sets out priorities for research that can inform action to meet the needs of small farmers and fisher people experiencing and responding to the mental health impacts of climate change, informed by insights shared by small farmers and fisher people around the world.': {
    es: 'Esta agenda establece prioridades de investigación que pueden informar acciones para satisfacer las necesidades de pequeños agricultores y pescadores que experimentan y responden a los impactos del cambio climático en la salud mental, informada por las perspectivas compartidas por pequeños agricultores y pescadores de todo el mundo.',
    fr: 'Ce programme établit des priorités de recherche qui peuvent éclairer l\'action pour répondre aux besoins des petits agriculteurs et pêcheurs qui vivent et réagissent aux impacts du changement climatique sur la santé mentale, éclairées par les perspectives partagées par les petits agriculteurs et pêcheurs du monde entier.',
    ar: 'تحدد هذه الأجندة أولويات البحث التي يمكن أن توجه العمل لتلبية احتياجات صغار المزارعين والصيادين الذين يعانون ويستجيبون لتأثيرات تغير المناخ على الصحة النفسية، بناءً على الأفكار المشتركة من قبل صغار المزارعين والصيادين حول العالم.'
  }
};

/**
 * Fetch a page from Sanity
 */
async function fetchPage(slug, language) {
  const page = await client.fetch(`
    *[_type == "page" && slug.current == $slug && language == $language][0]{
      _id,
      title,
      blocks
    }
  `, { slug, language });

  return page;
}

/**
 * Extract text from Portable Text blocks
 */
function extractPortableText(portableTextArray) {
  if (!Array.isArray(portableTextArray)) return '';

  return portableTextArray
    .map(block => {
      if (block._type === 'block' && Array.isArray(block.children)) {
        return block.children
          .map(child => child.text || '')
          .join('');
      }
      return '';
    })
    .filter(text => text.trim())
    .join('\n\n');
}

/**
 * Replace text in Portable Text blocks
 */
function replacePortableText(portableTextArray, newText) {
  if (!Array.isArray(portableTextArray) || !newText) return portableTextArray;

  // Split new text by double newlines to match paragraph structure
  const paragraphs = newText.split('\n\n').filter(p => p.trim());

  return portableTextArray.map((block, index) => {
    if (block._type === 'block' && Array.isArray(block.children)) {
      const newParagraph = paragraphs[index] || paragraphs[0] || '';
      return {
        ...block,
        children: block.children.map((child, childIndex) => {
          // Replace first child's text, keep others as empty to maintain structure
          if (childIndex === 0) {
            return { ...child, text: newParagraph };
          }
          return child;
        })
      };
    }
    return block;
  });
}

/**
 * Extract translations from existing page
 */
function extractTranslations(page, pageName) {
  const translations = {};

  if (!page || !page.blocks) return translations;

  for (const block of page.blocks) {
    // Extract hero titles
    if (block._type === 'hero-1' && block.title) {
      translations[`${pageName}_hero_title`] = block.title;
    }

    // Extract hero body
    if (block._type === 'hero-1' && block.body) {
      const bodyText = extractPortableText(block.body);
      if (bodyText) {
        translations[`${pageName}_hero_body`] = bodyText;
      }
    }

    // Extract split-row titles and excerpts
    if (block._type === 'split-row') {
      if (block.title) {
        translations[`split_row_${block._key}_title`] = block.title;
      }
      if (block.excerpt) {
        translations[`split_row_${block._key}_excerpt`] = block.excerpt;
      }
      // Extract body text from split-content
      if (block.splitColumns && Array.isArray(block.splitColumns)) {
        block.splitColumns.forEach(col => {
          if (col._type === 'split-content' && col.body) {
            const bodyText = extractPortableText(col.body);
            if (bodyText) {
              translations[`split_content_${col._key}_body`] = bodyText;
            }
          }
        });
      }
    }

    // Extract grid-card excerpts and titles
    if (block._type === 'grid-row' && block.columns) {
      block.columns.forEach(col => {
        if (col._type === 'grid-card') {
          if (col.title) {
            translations[`grid_card_${col._key}_title`] = col.title;
          }
          if (col.excerpt) {
            translations[`grid_card_${col._key}_excerpt`] = col.excerpt;
          }
          if (col.link && col.link.title) {
            translations[`link_${col._key}_title`] = col.link.title;
          }
        }
      });
    }
  }

  return translations;
}

/**
 * Get translation from manual dictionary or Claude API
 */
async function getTranslation(text, targetLanguage) {
  // First check manual translations
  if (MANUAL_TRANSLATIONS[text] && MANUAL_TRANSLATIONS[text][targetLanguage]) {
    return MANUAL_TRANSLATIONS[text][targetLanguage];
  }

  // Fall back to Claude API
  return await translateWithClaude(text, targetLanguage);
}

/**
 * Translate text using Claude API
 */
async function translateWithClaude(text, targetLanguage) {
  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  const languageMap = {
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic'
  };

  const targetLangName = languageMap[targetLanguage];

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Translate the following text from English to ${targetLangName}.
Maintain the same tone, formality, and meaning.
For climate and mental health terminology, use appropriate technical terms.
This is for a climate change and mental health research agenda website.
Preserve any markdown or formatting.
Return ONLY the translation, no explanations.

Text to translate:
${text}`
      }]
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error(`     Translation API error: ${error.message}`);
    return null;
  }
}

/**
 * Apply translations to English blocks
 */
async function applyTranslations(englishBlocks, translations, language, pageName) {
  const translatedBlocks = JSON.parse(JSON.stringify(englishBlocks)); // Deep clone

  for (const block of translatedBlocks) {
    // Translate hero title
    if (block._type === 'hero-1') {
      const heroTitleKey = `${pageName}_hero_title`;
      if (translations[heroTitleKey]) {
        block.title = translations[heroTitleKey];
      } else {
        // Fallback to translation
        console.log(`   ⚠️  Missing translation for hero title, checking translation dictionary...`);
        const translated = await getTranslation(block.title, language);
        if (translated) {
          block.title = translated;
        } else {
          console.log(`     → Keeping English text: "${block.title}"`);
        }
      }

      // Translate hero body
      const heroBodyKey = `${pageName}_hero_body`;
      if (translations[heroBodyKey]) {
        block.body = replacePortableText(block.body, translations[heroBodyKey]);
      } else {
        // Fallback to Claude API
        const bodyText = extractPortableText(block.body);
        if (bodyText) {
          console.log(`   ⚠️  Missing translation for hero body, checking translation dictionary...`);
          const translated = await getTranslation(bodyText, language);
          if (translated) {
            block.body = replacePortableText(block.body, translated);
          } else {
            console.log(`     → Keeping English text`);
          }
        }
      }
    }

    // Translate grid-row titles
    if (block._type === 'grid-row' && block.title) {
      // Try to find translation (might be from split-row in original)
      const gridTitleKey = `grid_row_${block._key}_title`;
      if (translations[gridTitleKey]) {
        block.title = translations[gridTitleKey];
      } else {
        // Fallback to translation
        console.log(`   ⚠️  Missing translation for grid-row title, checking translation dictionary...`);
        const translated = await getTranslation(block.title, language);
        if (translated) {
          block.title = translated;
        } else {
          console.log(`     → Keeping English text: "${block.title}"`);
        }
      }
    }

    // Translate grid-row descriptions
    if (block._type === 'grid-row' && block.description) {
      const descText = extractPortableText(block.description);
      if (descText) {
        console.log(`   ⚠️  Translating grid-row description, checking translation dictionary...`);
        const translated = await getTranslation(descText, language);
        if (translated) {
          block.description = replacePortableText(block.description, translated);
        } else {
          console.log(`     → Keeping English text`);
        }
      }
    }

    // Translate grid-card content
    if (block._type === 'grid-row' && block.columns) {
      for (const col of block.columns) {
        if (col._type === 'grid-card') {
          // Translate card title
          if (col.title) {
            // Prioritize manual translations over extracted ones
            const manualTranslation = await getTranslation(col.title, language);
            if (manualTranslation) {
              col.title = manualTranslation;
            } else {
              const cardTitleKey = `grid_card_${col._key}_title`;
              if (translations[cardTitleKey]) {
                col.title = translations[cardTitleKey];
              } else {
                console.log(`     → Keeping English text: "${col.title}"`);
              }
            }
          }

          // Translate card excerpt
          if (col.excerpt) {
            // Prioritize manual translations over extracted ones
            const manualTranslation = await getTranslation(col.excerpt, language);
            if (manualTranslation) {
              col.excerpt = manualTranslation;
            } else {
              const cardExcerptKey = `grid_card_${col._key}_excerpt`;
              if (translations[cardExcerptKey]) {
                col.excerpt = translations[cardExcerptKey];
              } else {
                console.log(`     → Keeping English text`);
              }
            }
          }

          // Translate link title
          if (col.link && col.link.title) {
            // Prioritize manual translations over extracted ones
            const manualTranslation = await getTranslation(col.link.title, language);
            if (manualTranslation) {
              col.link.title = manualTranslation;
            } else {
              const linkTitleKey = `link_${col._key}_title`;
              if (translations[linkTitleKey]) {
                col.link.title = translations[linkTitleKey];
              } else {
                console.log(`     → Keeping English text: "${col.link.title}"`);
              }
            }
          }
        }
      }
    }
  }

  return translatedBlocks;
}

/**
 * Update a page in Sanity
 */
async function updatePage(slug, language, title, blocks, dryRun = false) {
  const pageId = `page-${slug.split('/').pop()}-${language}`;

  const pageData = {
    _id: pageId,
    _type: 'page',
    title: title,
    language: language,
    slug: {
      _type: 'slug',
      current: slug
    },
    blocks: blocks
  };

  if (dryRun) {
    console.log(`   [DRY RUN] Would update page ${pageId} with ${blocks.length} blocks`);
    return { success: true, language, dryRun: true };
  }

  try {
    await client.createOrReplace(pageData);
    return { success: true, language };
  } catch (error) {
    return { success: false, language, error: error.message };
  }
}

/**
 * Process a single page across all languages
 */
async function processPage(slug, dryRun = false) {
  const pageName = slug.split('/').pop();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Processing: ${slug}`);
  console.log('='.repeat(80));

  // Fetch English version
  console.log(`\nFetching English version...`);
  const englishPage = await fetchPage(slug, 'en');

  if (!englishPage) {
    console.log(`❌ English page not found for ${slug}`);
    return [];
  }

  console.log(`✓ English page found with ${englishPage.blocks.length} blocks`);

  const results = [];

  // Process each target language
  for (const lang of LANGUAGES) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`Language: ${LANGUAGE_NAMES[lang]} (${lang})`);
    console.log('-'.repeat(80));

    // Fetch existing page to extract translations
    console.log(`Fetching existing ${lang} page for translation extraction...`);
    const existingPage = await fetchPage(slug, lang);

    if (!existingPage) {
      console.log(`⚠️  No existing ${lang} page found, will use Claude API for all translations`);
    }

    // Extract translations
    const translations = existingPage ? extractTranslations(existingPage, pageName) : {};
    console.log(`✓ Extracted ${Object.keys(translations).length} translations from existing page`);

    // Apply translations to English structure
    console.log(`Applying translations to English block structure...`);
    const translatedBlocks = await applyTranslations(
      englishPage.blocks,
      translations,
      lang,
      pageName
    );

    // Get translated title
    let translatedTitle = englishPage.title;
    const heroTitleKey = `${pageName}_hero_title`;
    if (translations[heroTitleKey]) {
      translatedTitle = translations[heroTitleKey];
    } else {
      console.log(`⚠️  Missing page title translation, checking translation dictionary...`);
      const translated = await getTranslation(englishPage.title, lang);
      if (translated) {
        translatedTitle = translated;
      } else {
        console.log(`  → Keeping English title: "${englishPage.title}"`);
      }
    }

    console.log(`✓ Translation complete: ${translatedBlocks.length} blocks prepared`);

    // Update page
    const result = await updatePage(slug, lang, translatedTitle, translatedBlocks, dryRun);

    if (result.success) {
      if (dryRun) {
        console.log(`✓ Validated page structure`);
      } else {
        console.log(`✅ Updated page: ${slug} (${lang})`);
      }
    } else {
      console.log(`❌ Error updating page: ${result.error}`);
    }

    results.push(result);
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🚀 Sync Source Pages to English Structure');
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }
  console.log('\n' + '='.repeat(80));
  console.log('Configuration:');
  console.log('='.repeat(80));
  console.log(`Target languages: ${LANGUAGES.join(', ')}`);
  console.log(`Source pages:`);
  SOURCE_PAGES.forEach(slug => console.log(`  - ${slug}`));

  const allResults = [];

  // Process each page
  for (const slug of SOURCE_PAGES) {
    const results = await processPage(slug, dryRun);
    allResults.push(...results);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Pages processed: ${SOURCE_PAGES.length}`);
  console.log(`Languages per page: ${LANGUAGES.length}`);
  console.log(`Total updates: ${allResults.length}`);
  console.log(`Successful: ${allResults.filter(r => r.success).length}`);
  console.log(`Failed: ${allResults.filter(r => !r.success).length}`);

  if (allResults.some(r => !r.success)) {
    console.log('\n❌ Failed updates:');
    allResults.filter(r => !r.success).forEach(r => {
      console.log(`   - ${LANGUAGE_NAMES[r.language]}: ${r.error}`);
    });
  }

  console.log('='.repeat(80));

  if (dryRun) {
    console.log('\n✨ Dry run complete! Run without --dry-run to update pages.');
  } else {
    console.log('\n✨ Sync complete!');
    console.log('\n📝 Next step: Run the following to rebuild /all-outputs pages:');
    console.log('   node scripts/create-all-outputs-pages.mjs');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
