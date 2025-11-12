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

// Translation cache to avoid re-translating same content
const translationCache = {};

/**
 * Translate content using Claude AI
 */
async function translateWithClaude(content, targetLang, contentType = 'title') {
  const cacheKey = `${content}_${targetLang}_${contentType}`;

  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  const langNames = {
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic'
  };

  const contextGuide = contentType === 'title'
    ? 'This is a document title. Keep it concise and professional.'
    : contentType === 'subtitle'
    ? 'This is a subtitle/tagline. Keep it brief (5-10 words) and descriptive.'
    : 'This is a document description. Keep it informative and concise (1-2 sentences).';

  const prompt = `Translate the following ${contentType} from English to ${langNames[targetLang]}.

${contextGuide}

Key terminology to maintain consistency:
- "Research and Action Agenda" should be consistently translated
- "Climate Change and Mental Health" should be consistently translated
- Regional names should use standard UN translations
- Maintain professional, academic tone

English text:
${content}

Provide ONLY the ${langNames[targetLang]} translation, without any explanation or additional text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const translation = message.content[0].text.trim();
    translationCache[cacheKey] = translation;

    console.log(`    ✓ Translated ${contentType} to ${langNames[targetLang]}`);

    return translation;
  } catch (error) {
    console.error(`    ✗ Translation error for ${targetLang}:`, error.message);
    return content; // Fallback to English
  }
}

/**
 * Generate subtitle for agenda document
 */
function generateEnglishSubtitle(title) {
  // Extract patterns from title to create appropriate subtitle
  if (title.includes('Summary')) {
    return 'Executive summary';
  } else if (title.includes('Toolkit for decision-makers')) {
    return 'Practical tools for policymakers';
  } else if (title.includes('Toolkit for Researchers') || title.includes('Introductory Toolkit')) {
    return 'A practical guide for researchers';
  } else if (title.includes('Lived Experience Engagement')) {
    return 'Centering lived experience in research';
  } else if (title.includes('Youth Declaration')) {
    return 'A call to action from youth worldwide';
  } else if (title.includes('Indigenous Communities')) {
    return 'Centering Indigenous knowledge and leadership';
  } else if (title.includes('Youth Research and Action')) {
    return 'Youth-led solutions for climate mental health';
  } else if (title.includes('Small-Scale Farmers and Fisherfolk') || title.includes('Farmers and Fisher')) {
    return 'Supporting agricultural and fishing communities';
  } else if (title.includes('Global Research and Action')) {
    return 'A comprehensive framework for action';
  } else if (title.includes('Central and Southern Asia')) {
    return 'Regional priorities for Central and Southern Asia';
  } else if (title.includes('Eastern and South-Eastern Asia')) {
    return 'Regional priorities for Eastern and South-Eastern Asia';
  } else if (title.includes('Europe and Northern America')) {
    return 'Regional priorities for Europe and Northern America';
  } else if (title.includes('Latin America and the Caribbean')) {
    return 'Regional priorities for Latin America and the Caribbean';
  } else if (title.includes('Northern Africa and Western Asia')) {
    return 'Regional priorities for Northern Africa and Western Asia';
  } else if (title.includes('Oceania')) {
    return 'Regional priorities for Oceania';
  } else if (title.includes('Sub-Saharan Africa')) {
    return 'Regional priorities for Sub-Saharan Africa';
  }

  return 'Research and action for climate mental health';
}

/**
 * Generate description for agenda document
 */
function generateEnglishDescription(title, existingDescription) {
  if (existingDescription && existingDescription.trim()) {
    return existingDescription;
  }

  // Generate contextual descriptions based on document type
  if (title.includes('Toolkit for decision-makers')) {
    return 'The purpose of this Toolkit is to support decision-makers in understanding and addressing the mental health impacts of climate change through evidence-based policies and interventions.';
  } else if (title.includes('Toolkit for Researchers') || title.includes('Introductory Toolkit')) {
    return 'This toolkit is designed to support researchers in conducting rigorous, ethical, and impactful research on the intersection of climate change and mental health.';
  } else if (title.includes('Lived Experience Engagement')) {
    return 'This resource package supports researchers and practitioners in meaningfully engaging people with lived experience in climate change and mental health research and action.';
  } else if (title.includes('Youth Declaration')) {
    return 'A declaration from youth worldwide calling for urgent action to address the mental health impacts of climate change and center youth voices in climate policy.';
  } else if (title.includes('Summary')) {
    const baseTitle = title.replace(' - Summary', '').replace(' Summary', '');
    return `An executive summary of the ${baseTitle}, highlighting key priorities, recommendations, and action steps.`;
  } else if (title.includes('Indigenous Communities')) {
    return 'This agenda centers Indigenous knowledge, leadership, and self-determination in addressing the mental health impacts of climate change on Indigenous peoples worldwide.';
  } else if (title.includes('Youth Research and Action')) {
    return 'This agenda outlines youth-led priorities for research and action to address the mental health impacts of climate change, ensuring youth voices shape the field.';
  } else if (title.includes('Small-Scale Farmers and Fisherfolk')) {
    return 'This agenda addresses the unique mental health challenges faced by small-scale farmers and fisherfolk on the frontlines of climate change impacts.';
  } else if (title.includes('Global Research and Action')) {
    return 'The Global Research and Action Agenda sets a vision for the climate and mental health field to understand and respond to the mental health consequences of a changing climate.';
  } else if (title.match(/^(Central|Eastern|Europe|Latin|Northern|Oceania|Sub-Saharan)/)) {
    const region = title.split(' Research')[0];
    return `This regional agenda outlines priorities for research and action to address the mental health impacts of climate change in ${region}.`;
  }

  return 'A research and action agenda addressing the mental health impacts of climate change.';
}

/**
 * Translate a single agenda document
 */
async function translateAgendaDocument(doc) {
  console.log(`\n📄 Processing: ${doc.title.en}`);
  console.log(`   ID: ${doc._id}`);

  const updates = {
    title: { ...doc.title },
    subtitle: doc.subtitle || {},
    description: doc.description || {}
  };

  // Generate English subtitle if missing
  if (!updates.subtitle.en) {
    updates.subtitle.en = generateEnglishSubtitle(doc.title.en);
    console.log(`    + Generated English subtitle`);
  }

  // Generate English description if missing
  if (!updates.description.en) {
    updates.description.en = generateEnglishDescription(doc.title.en, doc.description?.en);
    console.log(`    + Generated English description`);
  }

  // Translate title to es, fr, ar
  for (const lang of ['es', 'fr', 'ar']) {
    if (!updates.title[lang]) {
      updates.title[lang] = await translateWithClaude(doc.title.en, lang, 'title');
      await delay(500); // Rate limiting
    }
  }

  // Translate subtitle to es, fr, ar
  for (const lang of ['es', 'fr', 'ar']) {
    if (!updates.subtitle[lang]) {
      updates.subtitle[lang] = await translateWithClaude(updates.subtitle.en, lang, 'subtitle');
      await delay(500); // Rate limiting
    }
  }

  // Translate description to es, fr, ar
  for (const lang of ['es', 'fr', 'ar']) {
    if (!updates.description[lang]) {
      updates.description[lang] = await translateWithClaude(updates.description.en, lang, 'description');
      await delay(500); // Rate limiting
    }
  }

  return updates;
}

/**
 * Update document in Sanity
 */
async function updateDocumentInSanity(docId, updates) {
  try {
    await sanityClient
      .patch(docId)
      .set({
        title: updates.title,
        subtitle: updates.subtitle,
        description: updates.description
      })
      .commit();

    console.log(`    ✅ Updated in Sanity`);
    return true;
  } catch (error) {
    console.error(`    ❌ Error updating in Sanity:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🌍 Agenda Translation Script\n');
  console.log('='.repeat(70));
  console.log('Fetching agenda documents from Sanity...\n');

  // Fetch all agenda documents
  const agendas = await sanityClient.fetch(`
    *[_type == "agenda"] | order(title.en asc) {
      _id,
      _rev,
      title,
      subtitle,
      description,
      "slug": slug.current
    }
  `);

  console.log(`Found ${agendas.length} agenda documents\n`);
  console.log('='.repeat(70));

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (let i = 0; i < agendas.length; i++) {
    const doc = agendas[i];

    console.log(`\n[${i + 1}/${agendas.length}] Processing...`);

    try {
      // Translate the document
      const updates = await translateAgendaDocument(doc);

      // Update in Sanity
      const success = await updateDocumentInSanity(doc._id, updates);

      if (success) {
        successCount++;
        results.push({ id: doc._id, title: doc.title.en, status: 'success' });
      } else {
        failCount++;
        results.push({ id: doc._id, title: doc.title.en, status: 'failed' });
      }

      // Rate limiting between documents
      await delay(2000);

    } catch (error) {
      console.error(`\n❌ Error processing ${doc.title.en}:`, error.message);
      failCount++;
      results.push({ id: doc._id, title: doc.title.en, status: 'error', error: error.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 TRANSLATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total documents: ${agendas.length}`);
  console.log(`✅ Successfully translated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(70));

  if (failCount > 0) {
    console.log('\n❌ Failed documents:');
    results
      .filter(r => r.status !== 'success')
      .forEach(r => console.log(`   - ${r.title} (${r.error || 'update failed'})`));
  }

  console.log('\n✨ Translation complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review translations in Sanity Studio');
  console.log('   2. Test agenda pages on the site');
  console.log('   3. Verify translations are displayed correctly');

  console.log('\n💾 Translation cache size:', Object.keys(translationCache).length, 'entries');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
