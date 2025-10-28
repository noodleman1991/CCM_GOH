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

async function createNewsPosts() {
  console.log('\n📰 Creating news posts...');

  // Get the first author to use as the author reference
  const author = await client.fetch(`*[_type == "author"][0]._id`);

  if (!author) {
    console.log('⚠️  No authors found. Please create an author first.');
    return [];
  }

  const newsPosts = [
    {
      _type: 'newsPost',
      _id: 'news-cop28',
      language: 'en',
      title: {
        en: 'COP28: Centring Mental Health in the Health Response to Climate Change',
      },
      subtitle: {
        en: 'A turning point for human health in climate negotiations',
      },
      excerpt: {
        en: 'The 28th UN Climate Change Conference (COP28) was a turning point for the centring of human health in climate negotiations.',
      },
      content: createBlockContent(
        'The 28th UN Climate Change Conference (COP28) was a turning point for the centring of human health in climate negotiations. For the first time, health took centre stage with dedicated programming and commitments to address the health impacts of climate change, including mental health.'
      ),
      slug: {
        _type: 'slug',
        current: 'cop28-centring-mental-health',
      },
      author: {
        _type: 'reference',
        _ref: author,
      },
      publishedAt: '2024-01-15T00:00:00Z',
      featured: true,
    },
    {
      _type: 'newsPost',
      _id: 'news-regional-dialogues',
      language: 'en',
      title: {
        en: "Climate Change and Mental Health: Insights from Connecting Climate Minds' First Regional Dialogues",
      },
      subtitle: {
        en: 'Understanding mental health impacts across global regions',
      },
      excerpt: {
        en: 'As climate change continues to reshape our world, it\'s not just landscapes that are transforming; the mental health of communities worldwide is also on the line.',
      },
      content: createBlockContent(
        'As climate change continues to reshape our world, it\'s not just landscapes that are transforming; the mental health of communities worldwide is also on the line. Our first regional dialogues brought together experts from seven global regions to discuss the unique mental health challenges and solutions emerging from climate change.'
      ),
      slug: {
        _type: 'slug',
        current: 'insights-from-regional-dialogues',
      },
      author: {
        _type: 'reference',
        _ref: author,
      },
      publishedAt: '2024-03-20T00:00:00Z',
      featured: true,
    },
    {
      _type: 'newsPost',
      _id: 'news-climate-distress-study',
      language: 'en',
      title: {
        en: 'Study shows climate distress related to anxiety and action in young people',
      },
      subtitle: {
        en: 'Imperial research on youth climate anxiety',
      },
      excerpt: {
        en: 'Imperial researchers have carried out a study to understand the psycho-social impacts of climate crisis on young people in the UK.',
      },
      content: createBlockContent(
        'Imperial researchers have carried out a study to understand the psycho-social impacts of climate crisis on young people in the UK. The research reveals important connections between climate anxiety, distress, and pro-environmental action among youth.'
      ),
      slug: {
        _type: 'slug',
        current: 'climate-distress-anxiety-action-youth',
      },
      author: {
        _type: 'reference',
        _ref: author,
      },
      publishedAt: '2024-05-10T00:00:00Z',
      featured: false,
    },
  ];

  const createdPosts = [];
  for (const post of newsPosts) {
    try {
      const result = await client.createOrReplace(post);
      console.log(`  ✓ Created: ${post.title.en}`);
      createdPosts.push(result);
    } catch (error) {
      console.error(`  ✗ Failed to create ${post.title.en}:`, error.message);
    }
  }

  return createdPosts;
}

async function createTestimonials() {
  console.log('\n💬 Creating testimonials...');

  const testimonials = [
    {
      _type: 'testimonial',
      _id: 'testimonial-1',
      name: 'Maria Santos',
      title: 'Community Health Worker',
      body: createBlockContent(
        'Climate change has deeply affected our community. Through sharing our experiences and connecting with others facing similar challenges, we\'ve found strength and resilience we didn\'t know we had.'
      ),
      featured: true,
    },
    {
      _type: 'testimonial',
      _id: 'testimonial-2',
      name: 'James Okonkwo',
      title: 'Environmental Researcher',
      body: createBlockContent(
        'The intersection of climate change and mental health is crucial. Our lived experiences inform the research and help create solutions that truly address community needs.'
      ),
      featured: true,
    },
    {
      _type: 'testimonial',
      _id: 'testimonial-3',
      name: 'Li Wei',
      title: 'Youth Climate Activist',
      body: createBlockContent(
        'Seeing the direct impacts of climate change on my community has been overwhelming. But finding this supportive network has given me hope and the tools to advocate for both environmental and mental health action.'
      ),
      featured: true,
    },
  ];

  const createdTestimonials = [];
  for (const testimonial of testimonials) {
    try {
      const result = await client.createOrReplace(testimonial);
      console.log(`  ✓ Created: ${testimonial.name}`);
      createdTestimonials.push(result);
    } catch (error) {
      console.error(`  ✗ Failed to create ${testimonial.name}:`, error.message);
    }
  }

  return createdTestimonials;
}

async function updateHomepage() {
  console.log('\n🏠 Updating homepage...');

  // Fetch references we need
  const globalAgenda = await client.fetch(`*[_type == "agenda" && title.en match "Global Research and Action Agenda"][0]._id`);
  const youthAgenda = await client.fetch(`*[_type == "agenda" && title.en match "Youth Research*"][0]._id`);
  const indigenousAgenda = await client.fetch(`*[_type == "agenda" && title.en match "Indigenous*"][0]._id`);

  const communities = await client.fetch(`*[_type == "regionalCommunity"] | order(orderRank) {_id}`);
  const newsPosts = await client.fetch(`*[_type == "newsPost"] | order(publishedAt desc) [0...3] {_id}`);
  const testimonials = await client.fetch(`*[_type == "testimonial" && featured == true] [0...3] {_id}`);

  const homepage = {
    _type: 'homepage',
    _id: 'homepage-en',
    title: 'Homepage',
    language: 'en',
    slug: {
      _type: 'slug',
      current: 'index',
    },

    // Section 1: Hero Welcome
    heroWelcome: {
      _type: 'hero-1',
      title: 'Welcome to the Connecting Climate Minds Hub, where the worlds of mental health and climate change research unite.',
      tagLine: null,
      body: null,
      links: [
        {
          _type: 'link',
          _key: 'hero-link-1',
          title: 'View our Research',
          href: '/research',
          buttonVariant: 'primary',
        },
      ],
      imagePosition: 'right',
    },

    // Section 2: Global Agenda
    globalAgenda: {
      _type: 'split-row',
      colorVariant: 'light',
      splitColumns: [
        {
          _type: 'split-content',
          _key: 'global-content',
          title: 'Prioritizing Global Research and Action for Climate Change and Mental Health',
          body: createBlockContent(
            'The Global Research and Action Agenda for climate change and mental health sets out priorities for research and action that have been developed from dialogues and consultation with 960+ experts in research, policy, practice, and lived experience in 90 countries.'
          ),
          link: {
            _type: 'link',
            title: 'Read the Global Agenda',
            href: '/agendas/global-research-and-action-agenda',
            variant: 'secondary',
          },
        },
      ],
    },

    // Section 3: How to Use Hub
    howToUse: {
      _type: 'split-row',
      colorVariant: 'default',
      splitColumns: [
        {
          _type: 'split-content',
          _key: 'how-to-use-content',
          title: 'Your collaborative space for ideas, dialogue, and connection',
          body: createBlockContent(
            'Whether you want to delve into priority areas for research and action, seek inspiration and understanding from case studies, personal experiences and insights, learn from "how to" toolkits, or are looking to join our growing global community and form new connections, this hub is for you.'
          ),
          link: {
            _type: 'link',
            title: 'Create an Account',
            href: '/sign-up',
            variant: 'primary',
          },
        },
      ],
    },

    // Section 4: Agendas Module
    agendasModule: {
      _type: 'grid-row',
      title: 'Catalysing interdisciplinary research to inform action in policy and practice',
      description: createBlockContent(
        'Explore our rich repository of co-created research and action agendas, reports, case studies, lived experience insights and toolkits. All have been designed to support collaboration between disciplines and many different forms of expertise and accelerate and align the growing field of climate change and mental health.'
      ),
      gridColumns: 'grid-cols-3',
      columns: [
        {
          _type: 'grid-card',
          _key: 'agenda-populations',
          title: 'Agendas for populations facing amplified climate mental health impacts',
          excerpt: 'Research and Action Agendas created through dialogues with youth, small farmers and fisher people and Indigenous communities.',
          link: {
            _type: 'link',
            title: 'View Agendas',
            href: '/agendas',
          },
        },
        {
          _type: 'grid-card',
          _key: 'agenda-regional',
          title: 'Regional Agendas',
          excerpt: 'The Regional Agendas set out aligned and inclusive priorities for research and action in seven global regions.',
          link: {
            _type: 'link',
            title: 'View Agendas',
            href: '/agendas',
          },
        },
        ...(globalAgenda ? [{
          _type: 'grid-agenda',
          _key: 'agenda-global',
          agenda: {
            _type: 'reference',
            _ref: globalAgenda,
          },
          showTags: true,
          showDownloadButtons: true,
          showMetadata: true,
        }] : []),
        {
          _type: 'grid-card',
          _key: 'impact-reports',
          title: 'Impact Reports',
          excerpt: 'Impact reports outline the demonstrable diversity and impact of activities and collaboration fostered through Connecting Climate Minds.',
          link: {
            _type: 'link',
            title: 'View Impact Reports',
            href: '/reports',
          },
        },
        {
          _type: 'grid-card',
          _key: 'toolkits',
          title: 'Toolkits',
          excerpt: 'The toolkits are practical guides that help researchers and actors from diverse backgrounds to come into the climate and mental health field.',
          link: {
            _type: 'link',
            title: 'View Toolkits',
            href: '/toolkits',
          },
        },
        {
          _type: 'grid-card',
          _key: 'case-studies',
          title: 'Case Studies',
          excerpt: 'Case studies showcase existing research, interventions, and policies with implications for the climate-mental health nexus.',
          link: {
            _type: 'link',
            title: 'View Case Studies',
            href: '/case-studies',
          },
        },
      ],
    },

    // Section 5: Lived Experiences
    livedExperiences: {
      _type: 'carousel-2',
      title: 'Stories of grief, resilience and hope',
      description: 'Understanding and learning from lived experience is essential to navigating the relationship between mental health and climate change. Browse our library of lived experience insights shared by people across the globe, providing invaluable insights into impacts and solutions.',
      colorVariant: 'accent',
      testimonial: testimonials.map((t, i) => ({
        _type: 'reference',
        _key: `testimonial-${i}`,
        _ref: t._id,
      })),
    },

    // Section 6: Regional Communities
    regionalCommunities: {
      _type: 'grid-row',
      title: 'Regional communities driving global research',
      description: createBlockContent(
        'Our 7 Regional Communities of Practice are at the heart of the Connecting Climate Minds Project, connecting people across countries, disciplines, sectors and experiences. They all bring their unique insights to a thriving community of practice in climate change and mental health research, that is deeply connected to and engages with lived experience needs, and linking out to policy and practice.'
      ),
      gridColumns: 'grid-cols-3',
      columns: communities.map((community, i) => ({
        _type: 'grid-card',
        _key: `community-${i}`,
        title: community._id.includes('sub-saharan') ? 'Sub-Saharan Africa' :
               community._id.includes('northern-africa') ? 'Northern Africa and Western Asia' :
               community._id.includes('central') ? 'Central and Southern Asia' :
               community._id.includes('eastern') ? 'Eastern and South-Eastern Asia' :
               community._id.includes('latin') ? 'Latin America and the Caribbean' :
               community._id.includes('oceania') ? 'Oceania' :
               'Europe and Northern America',
        excerpt: 'Regional Community of Practice',
        link: {
          _type: 'link',
          title: 'View',
          href: `/communities/${community._id}`,
        },
      })),
    },

    // Section 7: Collaboration
    collaboration: {
      _type: 'split-row',
      colorVariant: 'default',
      splitColumns: [
        {
          _type: 'split-content',
          _key: 'collaboration-content',
          title: 'Facilitating meaningful connection and collaboration',
          body: createBlockContent(
            'Whether you\'re seeking expertise for a project, looking to join forces on research, or wanting to share innovative ideas, our Collaborate area is a meeting place for individuals and organizations from various fields to connect and collaborate.'
          ),
          link: {
            _type: 'link',
            title: 'View Collaborate Area',
            href: '/collaborate',
            variant: 'primary',
          },
        },
      ],
    },

    // Section 8: News
    news: {
      _type: 'grid-row',
      title: 'Latest news in the field',
      description: createBlockContent(
        'Keeping you up-to-date with the latest developments in the intersection of mental health and climate change research, policy and practice.'
      ),
      gridColumns: 'grid-cols-3',
      columns: newsPosts.map((post, i) => ({
        _type: 'grid-news',
        _key: `news-${i}`,
        newsPost: {
          _type: 'reference',
          _ref: post._id,
        },
        showTags: true,
        showAuthor: true,
        showMetadata: true,
      })),
    },

    // Section 9: Project Info
    projectInfo: {
      _type: 'split-row',
      colorVariant: 'light',
      splitColumns: [
        {
          _type: 'split-content',
          _key: 'project-info-content',
          title: 'Funded by Wellcome, hosted by Climate Cares Centre',
          body: createBlockContent(
            'Learn more about Wellcome\'s work in climate change and health and in mental health.'
          ),
          link: {
            _type: 'link',
            title: 'About Project',
            href: '/about',
            variant: 'secondary',
          },
        },
      ],
    },

    // Section 10: Mental Health Definition
    mentalHealthDefinition: {
      _type: 'cta-1',
      title: 'What do we mean by mental health?',
      body: createBlockContent(
        'Climate change, mental health, and their intersection are complex and wide-ranging fields, understood through a range of diverse perspectives, framings and terminologies. Mental health challenges (which encompass mental health conditions/illnesses) are defined in Connecting Climate Minds as thoughts, feelings, and behaviours that affect a person\'s ability to function in one or more areas of life and often involve significant levels of psychological distress. Ways mental health could be affected by climate change include: How climate change may lead to a worsening of pre-existing mental health problems; How climate change may contribute to the prevalence or impact of existing mental health problems; How climate change may impact on treatment access or effectiveness for those with mental health problems; How climate change may lead to new mental health problems.'
      ),
      sectionWidth: 'default',
      stackAlign: 'left',
    },

    // Section 11: Partner Logos
    partnerLogos: {
      _type: 'logo-cloud-1',
      title: 'Funded by Wellcome, hosted by Climate Cares Centre',
      description: null,
      colorVariant: 'default',
      images: [],
    },

    // SEO
    meta_title: 'Connecting Climate Minds Hub - Mental Health & Climate Change Research',
    meta_description: 'Join the global community advancing research and action on climate change and mental health. Access agendas, toolkits, case studies, and lived experience insights.',
    noindex: false,
  };

  try {
    const result = await client.createOrReplace(homepage);
    console.log('  ✓ Homepage updated successfully!');
    return result;
  } catch (error) {
    console.error('  ✗ Failed to update homepage:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Populating Sanity with homepage content...');

  const newsPosts = await createNewsPosts();
  const testimonials = await createTestimonials();
  const homepage = await updateHomepage();

  console.log('\n✨ All done!');
  console.log(`   - Created ${newsPosts.length} news posts`);
  console.log(`   - Created ${testimonials.length} testimonials`);
  console.log(`   - Updated homepage with all sections`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
