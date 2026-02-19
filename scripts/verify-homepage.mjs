import { createClient } from '@sanity/client';
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

async function main() {
  console.log('🔍 Verifying homepage structure...\n');

  const homepage = await client.fetch(`*[_type == "homepage" && language == "en"][0] {
    _id,
    title,
    language,
    heroWelcome {
      title,
      "links": links[].label
    },
    globalAgenda {
      "columns": splitColumns[] {
        _type,
        title
      }
    },
    howToUse {
      "columns": splitColumns[] {
        _type,
        title
      }
    },
    agendasModule {
      title,
      "columnCount": count(columns),
      "columnTypes": columns[]._type
    },
    livedExperiences {
      title,
      "testimonialCount": count(testimonial)
    },
    regionalCommunities {
      title,
      "columnCount": count(columns)
    },
    collaboration {
      "columns": splitColumns[] {
        title
      }
    },
    news {
      title,
      "newsCount": count(columns)
    },
    projectInfo {
      "columns": splitColumns[] {
        title
      }
    },
    mentalHealthDefinition {
      title
    },
    partnerLogos {
      title
    }
  }`);

  if (!homepage) {
    console.log('❌ No homepage found!');
    return;
  }

  console.log('✅ Homepage found:', homepage._id);
  console.log('   Language:', homepage.language);
  console.log('\n📋 Section Verification:\n');

  const sections = [
    { name: '1. Hero Welcome', data: homepage.heroWelcome, check: ['title'] },
    { name: '2. Global Agenda', data: homepage.globalAgenda, check: ['columns'] },
    { name: '3. How to Use', data: homepage.howToUse, check: ['columns'] },
    { name: '4. Agendas Module', data: homepage.agendasModule, check: ['title', 'columnCount'] },
    { name: '5. Lived Experiences', data: homepage.livedExperiences, check: ['title', 'testimonialCount'] },
    { name: '6. Regional Communities', data: homepage.regionalCommunities, check: ['title', 'columnCount'] },
    { name: '7. Collaboration', data: homepage.collaboration, check: ['columns'] },
    { name: '8. News', data: homepage.news, check: ['title', 'newsCount'] },
    { name: '9. Project Info', data: homepage.projectInfo, check: ['columns'] },
    { name: '10. Mental Health Definition', data: homepage.mentalHealthDefinition, check: ['title'] },
    { name: '11. Partner Logos', data: homepage.partnerLogos, check: ['title'] },
  ];

  sections.forEach(section => {
    const status = section.data ? '✅' : '❌';
    console.log(`${status} ${section.name}`);

    if (section.data) {
      section.check.forEach(field => {
        if (section.data[field]) {
          const value = section.data[field];
          if (typeof value === 'string') {
            console.log(`   - ${field}: ${value.substring(0, 60)}${value.length > 60 ? '...' : ''}`);
          } else {
            console.log(`   - ${field}: ${JSON.stringify(value)}`);
          }
        }
      });
    }
  });

  console.log('\n📊 Summary:');
  const populated = sections.filter(s => s.data).length;
  console.log(`   ${populated}/${sections.length} sections populated`);

  if (homepage.agendasModule) {
    console.log(`   Agendas module: ${homepage.agendasModule.columnCount} cards`);
    console.log(`   Card types: ${homepage.agendasModule.columnTypes.join(', ')}`);
  }

  if (homepage.livedExperiences) {
    console.log(`   Lived experiences: ${homepage.livedExperiences.testimonialCount} testimonials`);
  }

  if (homepage.regionalCommunities) {
    console.log(`   Regional communities: ${homepage.regionalCommunities.columnCount} regions`);
  }

  if (homepage.news) {
    console.log(`   News section: ${homepage.news.newsCount} posts`);
  }

  console.log('\n✨ Verification complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
