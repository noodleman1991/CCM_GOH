import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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

// Load translations
const translations = JSON.parse(readFileSync('/tmp/about-feedback-translations.json', 'utf8'));

// Helper to create block content
function createBlockContent(text) {
  return [
    {
      _type: 'block',
      _key: Math.random().toString(36).substring(7),
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(7),
          text: text,
          marks: []
        }
      ],
      markDefs: []
    }
  ];
}

// Helper for text with bold
function createBlockWithBold(parts) {
  return [
    {
      _type: 'block',
      _key: Math.random().toString(36).substring(7),
      style: 'normal',
      children: parts.map(part => ({
        _type: 'span',
        _key: Math.random().toString(36).substring(7),
        text: part.text,
        marks: part.bold ? ['strong'] : []
      })),
      markDefs: []
    }
  ];
}

async function createTranslatedAboutPage(lang, englishPage) {
  console.log(`\n🌍 Creating ABOUT page for ${lang.toUpperCase()}...`);

  const t = translations.about[lang];

  const translatedPage = {
    _type: 'page',
    _id: `page-about-${lang}`,
    title: t.title,
    language: lang,
    slug: {
      _type: 'slug',
      current: 'about',
    },
    meta_title: t.meta_title,
    meta_description: t.meta_description,
    noindex: false,

    blocks: [
      // Section Header
      {
        ...englishPage.blocks[0],
        title: t.section_header.title,
        description: t.section_header.description
      },

      // Hero 1 - Project
      {
        ...englishPage.blocks[1],
        title: t.hero1.title,
        body: createBlockContent(t.hero1.body)
      },

      // Hero 2 - Hub
      {
        ...englishPage.blocks[2],
        title: t.hero2.title,
        body: createBlockContent(t.hero2.body),
        links: [
          {
            ...englishPage.blocks[2].links[0],
            title: t.hero2.link
          }
        ]
      },

      // Logo Cloud
      {
        ...englishPage.blocks[3],
        title: t.logo_cloud.title,
        description: t.logo_cloud.description
      }
    ]
  };

  return translatedPage;
}

async function createTranslatedFeedbackPage(lang, englishPage) {
  console.log(`\n🌍 Creating FEEDBACK page for ${lang.toUpperCase()}...`);

  const t = translations.feedback[lang];

  const translatedPage = {
    _type: 'page',
    _id: `page-feedback-${lang}`,
    title: t.title,
    language: lang,
    slug: {
      _type: 'slug',
      current: 'feedback',
    },
    meta_title: t.meta_title,
    noindex: false,

    blocks: [
      // Hero
      {
        ...englishPage.blocks[0],
        title: t.hero.title,
        body: createBlockContent(t.hero.body)
      },

      // Split Content - Contact Info
      {
        ...englishPage.blocks[1],
        splitColumns: [
          {
            ...englishPage.blocks[1].splitColumns[0],
            title: t.split_content.title,
            body: [
              // Technical Support
              {
                _type: 'block',
                _key: Math.random().toString(36).substring(7),
                style: 'normal',
                children: [
                  {
                    _type: 'span',
                    _key: Math.random().toString(36).substring(7),
                    text: t.split_content.technical_support,
                    marks: ['strong']
                  },
                  {
                    _type: 'span',
                    _key: Math.random().toString(36).substring(7),
                    text: `\n${t.split_content.technical_text} `,
                    marks: []
                  },
                  {
                    _type: 'span',
                    _key: Math.random().toString(36).substring(7),
                    text: t.split_content.amit,
                    marks: ['strong']
                  },
                  {
                    _type: 'span',
                    _key: Math.random().toString(36).substring(7),
                    text: ` ${t.split_content.technical_email}`,
                    marks: []
                  }
                ],
                markDefs: []
              },
              // Feedback and Questions
              {
                _type: 'block',
                _key: Math.random().toString(36).substring(7),
                style: 'normal',
                children: [
                  {
                    _type: 'span',
                    _key: Math.random().toString(36).substring(7),
                    text: t.split_content.feedback_questions,
                    marks: ['strong']
                  },
                  {
                    _type: 'span',
                    _key: Math.random().toString(36).substring(7),
                    text: `\n${t.split_content.feedback_text} `,
                    marks: []
                  },
                  {
                    _type: 'span',
                    _key: Math.random().toString(36).substring(7),
                    text: t.split_content.emma,
                    marks: ['strong']
                  },
                  {
                    _type: 'span',
                    _key: Math.random().toString(36).substring(7),
                    text: ` ${t.split_content.feedback_email}`,
                    marks: []
                  }
                ],
                markDefs: []
              },
              // Closing
              createBlockContent(t.split_content.closing)[0]
            ]
          }
        ]
      },

      // CTA 1 - Spiro-Spero
      {
        ...englishPage.blocks[2],
        title: t.cta1.title,
        body: createBlockContent(t.cta1.body),
        links: [
          {
            ...englishPage.blocks[2].links[0],
            title: t.cta1.link
          }
        ]
      },

      // CTA 2 - Pip Batey
      {
        ...englishPage.blocks[3],
        title: t.cta2.title,
        body: createBlockContent(t.cta2.body),
        links: [
          {
            ...englishPage.blocks[3].links[0],
            title: t.cta2.link1
          },
          {
            ...englishPage.blocks[3].links[1],
            title: t.cta2.link2
          }
        ]
      }
    ]
  };

  return translatedPage;
}

async function deletePage(docId) {
  try {
    await sanityClient.delete(docId);
    console.log(`  ✓ Deleted existing page: ${docId}`);
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`  • No existing page to delete: ${docId}`);
    } else {
      console.error(`  ✗ Error deleting:`, error.message);
    }
  }
}

async function uploadPage(page) {
  try {
    await sanityClient.createOrReplace(page);
    console.log(`  ✅ Uploaded ${page.language} page successfully`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error uploading:`, error.message);
    console.error(error);
    return false;
  }
}

async function main() {
  console.log('📄 Page Translation Upload Script\n');
  console.log('='.repeat(70));

  // Fetch English pages
  console.log('Fetching English pages...\n');

  const aboutEn = await sanityClient.fetch(`
    *[_type == 'page' && slug.current == 'about' && language == 'en'][0]
  `);

  const feedbackEn = await sanityClient.fetch(`
    *[_type == 'page' && slug.current == 'feedback' && language == 'en'][0]
  `);

  if (!aboutEn) {
    console.error('❌ English about page not found!');
    process.exit(1);
  }

  if (!feedbackEn) {
    console.error('❌ English feedback page not found!');
    process.exit(1);
  }

  console.log('✓ English pages loaded');
  console.log('='.repeat(70));

  const languages = ['es', 'fr', 'ar'];
  let successCount = 0;
  let failCount = 0;

  // Process About page
  console.log('\n' + '='.repeat(70));
  console.log('TRANSLATING ABOUT PAGE');
  console.log('='.repeat(70));

  for (const lang of languages) {
    try {
      await deletePage(`page-about-${lang}`);
      const translatedPage = await createTranslatedAboutPage(lang, aboutEn);
      const success = await uploadPage(translatedPage);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`\n❌ Error processing about-${lang}:`, error.message);
      failCount++;
    }
  }

  // Process Feedback page
  console.log('\n' + '='.repeat(70));
  console.log('TRANSLATING FEEDBACK PAGE');
  console.log('='.repeat(70));

  for (const lang of languages) {
    try {
      await deletePage(`page-feedback-${lang}`);
      const translatedPage = await createTranslatedFeedbackPage(lang, feedbackEn);
      const success = await uploadPage(translatedPage);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`\n❌ Error processing feedback-${lang}:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total pages: 6 (2 pages × 3 languages)`);
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(70));

  console.log('\n✨ Page translation upload complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
