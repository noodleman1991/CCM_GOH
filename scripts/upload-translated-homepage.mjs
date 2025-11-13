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
const translations = JSON.parse(readFileSync('/tmp/homepage-translations.json', 'utf8'));

// Helper to create block content from text
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

// Helper to create bullet list block content
function createBulletList(items) {
  return items.map(text => ({
    _type: 'block',
    _key: Math.random().toString(36).substring(7),
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(36).substring(7),
        text: text,
        marks: []
      }
    ],
    markDefs: []
  }));
}

async function createTranslatedHomepage(lang, englishHomepage) {
  console.log(`\n🌍 Creating ${lang.toUpperCase()} homepage...`);

  const t = translations[lang];

  const translatedHomepage = {
    _type: 'homepage',
    _id: `homepage-${lang}`,
    title: 'Home',
    language: lang,
    slug: {
      _type: 'slug',
      current: 'index',
    },

    // Hero Welcome
    heroWelcome: {
      ...englishHomepage.heroWelcome,
      title: t.heroWelcome.title,
      body: createBlockContent(t.heroWelcome.body_text),
      links: [
        {
          ...englishHomepage.heroWelcome.links[0],
          title: t.heroWelcome.link
        }
      ]
    },

    // Global Agenda
    globalAgenda: {
      ...englishHomepage.globalAgenda,
      splitColumns: [
        {
          ...englishHomepage.globalAgenda.splitColumns[0],
          title: t.globalAgenda.title,
          body: createBlockContent(t.globalAgenda.body_text),
          link: {
            ...englishHomepage.globalAgenda.splitColumns[0].link,
            title: t.globalAgenda.link
          }
        },
        englishHomepage.globalAgenda.splitColumns[1] // Keep image as is
      ]
    },

    // How To Use
    howToUse: {
      ...englishHomepage.howToUse,
      splitColumns: [
        englishHomepage.howToUse.splitColumns[0], // Keep image as is
        {
          ...englishHomepage.howToUse.splitColumns[1],
          title: t.howToUse.title,
          body: createBlockContent(t.howToUse.body_text),
          link: {
            ...englishHomepage.howToUse.splitColumns[1].link,
            title: t.howToUse.link
          }
        }
      ]
    },

    // Agendas Module
    agendasModule: {
      ...englishHomepage.agendasModule,
      title: t.agendasModule.title,
      description: createBlockContent(t.agendasModule.description),
      columns: [
        {
          ...englishHomepage.agendasModule.columns[0],
          title: t.agendasModule.cards.populations.title,
          excerpt: t.agendasModule.cards.populations.excerpt,
          link: {
            ...englishHomepage.agendasModule.columns[0].link,
            title: t.agendasModule.cards.populations.link
          }
        },
        {
          ...englishHomepage.agendasModule.columns[1],
          title: t.agendasModule.cards.regional.title,
          excerpt: t.agendasModule.cards.regional.excerpt,
          link: {
            ...englishHomepage.agendasModule.columns[1].link,
            title: t.agendasModule.cards.regional.link
          }
        },
        {
          ...englishHomepage.agendasModule.columns[2],
          title: t.agendasModule.cards.global.title,
          excerpt: t.agendasModule.cards.global.excerpt,
          link: {
            ...englishHomepage.agendasModule.columns[2].link,
            title: t.agendasModule.cards.global.link
          }
        },
        {
          ...englishHomepage.agendasModule.columns[3],
          title: t.agendasModule.cards.impact.title,
          excerpt: t.agendasModule.cards.impact.excerpt,
          link: {
            ...englishHomepage.agendasModule.columns[3].link,
            title: t.agendasModule.cards.impact.link
          }
        },
        {
          ...englishHomepage.agendasModule.columns[4],
          title: t.agendasModule.cards.toolkits.title,
          excerpt: t.agendasModule.cards.toolkits.excerpt,
          link: {
            ...englishHomepage.agendasModule.columns[4].link,
            title: t.agendasModule.cards.toolkits.link
          }
        },
        {
          ...englishHomepage.agendasModule.columns[5],
          title: t.agendasModule.cards.case_studies.title,
          excerpt: t.agendasModule.cards.case_studies.excerpt,
          link: {
            ...englishHomepage.agendasModule.columns[5].link,
            title: t.agendasModule.cards.case_studies.link
          }
        }
      ]
    },

    // Lived Experiences
    livedExperiences: {
      ...englishHomepage.livedExperiences,
      title: t.livedExperiences.title,
      description: t.livedExperiences.description
    },

    // Regional Communities
    regionalCommunities: {
      ...englishHomepage.regionalCommunities,
      title: t.regionalCommunities.title,
      description: createBlockContent(t.regionalCommunities.description),
      columns: [
        {
          ...englishHomepage.regionalCommunities.columns[0],
          title: t.regionalCommunities.links.sub_saharan,
          excerpt: t.regionalCommunities.card_excerpt,
          link: {
            ...englishHomepage.regionalCommunities.columns[0].link,
            title: t.regionalCommunities.view
          }
        },
        {
          ...englishHomepage.regionalCommunities.columns[1],
          title: t.regionalCommunities.links.northern_africa,
          excerpt: t.regionalCommunities.card_excerpt,
          link: {
            ...englishHomepage.regionalCommunities.columns[1].link,
            title: t.regionalCommunities.view
          }
        },
        {
          ...englishHomepage.regionalCommunities.columns[2],
          title: t.regionalCommunities.links.central_asia,
          excerpt: t.regionalCommunities.card_excerpt,
          link: {
            ...englishHomepage.regionalCommunities.columns[2].link,
            title: t.regionalCommunities.view
          }
        },
        {
          ...englishHomepage.regionalCommunities.columns[3],
          title: t.regionalCommunities.links.eastern_asia,
          excerpt: t.regionalCommunities.card_excerpt,
          link: {
            ...englishHomepage.regionalCommunities.columns[3].link,
            title: t.regionalCommunities.view
          }
        },
        {
          ...englishHomepage.regionalCommunities.columns[4],
          title: t.regionalCommunities.links.latin_america,
          excerpt: t.regionalCommunities.card_excerpt,
          link: {
            ...englishHomepage.regionalCommunities.columns[4].link,
            title: t.regionalCommunities.view
          }
        },
        {
          ...englishHomepage.regionalCommunities.columns[5],
          title: t.regionalCommunities.links.oceania,
          excerpt: t.regionalCommunities.card_excerpt,
          link: {
            ...englishHomepage.regionalCommunities.columns[5].link,
            title: t.regionalCommunities.view
          }
        },
        {
          ...englishHomepage.regionalCommunities.columns[6],
          title: t.regionalCommunities.links.europe,
          excerpt: t.regionalCommunities.card_excerpt,
          link: {
            ...englishHomepage.regionalCommunities.columns[6].link,
            title: t.regionalCommunities.view
          }
        }
      ]
    },

    // Collaboration
    collaboration: {
      ...englishHomepage.collaboration,
      splitColumns: [
        englishHomepage.collaboration.splitColumns[0], // Keep image as is
        {
          ...englishHomepage.collaboration.splitColumns[1],
          title: t.collaboration.title,
          body: createBlockContent(t.collaboration.body_text),
          link: {
            ...englishHomepage.collaboration.splitColumns[1].link,
            title: t.collaboration.link
          }
        }
      ]
    },

    // News
    news: {
      ...englishHomepage.news,
      title: t.news.title,
      description: createBlockContent(t.news.description)
      // Columns stay the same (references)
    },

    // Project Info
    projectInfo: {
      ...englishHomepage.projectInfo,
      splitColumns: [
        englishHomepage.projectInfo.splitColumns[0], // Keep image as is
        {
          ...englishHomepage.projectInfo.splitColumns[1],
          title: t.projectInfo.title,
          body: createBlockContent(t.projectInfo.body_text),
          link: {
            ...englishHomepage.projectInfo.splitColumns[1].link,
            title: t.projectInfo.link
          }
        }
      ]
    },

    // Mental Health Definition
    mentalHealthDefinition: {
      ...englishHomepage.mentalHealthDefinition,
      title: t.mentalHealthDefinition.title,
      body: [
        createBlockContent(t.mentalHealthDefinition.body_para1)[0],
        ...createBulletList([
          t.mentalHealthDefinition.bullet1,
          t.mentalHealthDefinition.bullet2,
          t.mentalHealthDefinition.bullet3,
          t.mentalHealthDefinition.bullet4
        ]),
        createBlockContent(t.mentalHealthDefinition.body_para2)[0]
      ]
    },

    // Partner Logos
    partnerLogos: {
      ...englishHomepage.partnerLogos,
      title: t.partnerLogos.title,
      description: t.partnerLogos.description
      // Images stay the same
    },

    // SEO
    meta_title: t.meta_title,
    meta_description: t.meta_description,
    noindex: false
  };

  return translatedHomepage;
}

async function deleteHomepage(lang) {
  const docId = `homepage-${lang}`;

  try {
    await sanityClient.delete(docId);
    console.log(`  ✓ Deleted existing ${lang} homepage`);
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`  • No existing ${lang} homepage to delete`);
    } else {
      console.error(`  ✗ Error deleting:`, error.message);
    }
  }
}

async function uploadHomepage(homepage) {
  try {
    await sanityClient.createOrReplace(homepage);
    console.log(`  ✅ Uploaded ${homepage.language} homepage successfully`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error uploading:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🏠 Homepage Translation Upload Script\n');
  console.log('='.repeat(70));
  console.log('Fetching English homepage...\n');

  // Fetch English homepage
  const englishHomepage = await sanityClient.fetch(`
    *[_type == "homepage" && language == "en"][0]
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
    console.log(`Processing ${lang.toUpperCase()}...`);
    console.log('='.repeat(70));

    try {
      // Delete existing
      await deleteHomepage(lang);

      // Create translated version
      const translatedHomepage = await createTranslatedHomepage(lang, englishHomepage);

      // Upload
      const success = await uploadHomepage(translatedHomepage);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

    } catch (error) {
      console.error(`\n❌ Error processing ${lang}:`, error.message);
      console.error(error.stack);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total languages: ${languages.length}`);
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(70));

  console.log('\n✨ Homepage translation upload complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
