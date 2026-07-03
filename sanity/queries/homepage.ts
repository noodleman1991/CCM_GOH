import { groq } from "next-sanity";
import { hero1Query } from "./hero/hero-1";
import { hero2Query } from "./hero/hero-2";
import { sectionHeaderQuery } from "./section-header";
import { splitRowQuery } from "./split/split-row";
import { gridRowQuery } from "./grid/grid-row";
import { carousel1Query } from "./carousel/carousel-1";
import { carousel2Query } from "./carousel/carousel-2";
import { livedExperiencesCarouselBlockQuery } from "./carousel/lived-experiences-carousel";
import { timelineQuery } from "./timeline";
import { cta1Query } from "./cta/cta-1";
import { logoCloud1Query } from "./logo-cloud/logo-cloud-1";
import { faqsQuery } from "./faqs";
import { formNewsletterQuery } from "./forms/newsletter";
import { regionMapQuery } from "./maps/region-map";
import { peopleWidgetQuery } from "./people/people-widget";
import { eventsCalendarQuery } from "./events/events-calendar";
import { submitStoryBannerQuery } from "./cta/submit-story-banner";

// Reusable blocks[] projection shared by both homepage queries (mirrors PAGE_QUERY).
const homepageBlocksProjection = groq`
  blocks[]{
    ${hero1Query},
    ${hero2Query},
    ${sectionHeaderQuery},
    ${splitRowQuery},
    ${gridRowQuery},
    ${carousel1Query},
    ${carousel2Query},
    ${livedExperiencesCarouselBlockQuery},
    ${timelineQuery},
    ${cta1Query},
    ${logoCloud1Query},
    ${faqsQuery},
    ${formNewsletterQuery},
    ${regionMapQuery},
    ${peopleWidgetQuery},
    ${eventsCalendarQuery},
    ${submitStoryBannerQuery},
  }
`;

export const HOMEPAGE_QUERY = groq`
  *[_type == "homepage" && slug.current == $slug && language == $language][0]{
    _id,
    title,
    slug,
    language,

    // Freeform page-builder blocks (preferred; the fixed sections below are
    // legacy and removed post-migration).
    ${homepageBlocksProjection},

    // Template sections based on JSON structure
    heroWelcome {
      ${hero1Query}
    },
    globalAgenda {
      ${splitRowQuery}
    },
    howToUse {
      ${splitRowQuery}
    },
    agendasModule {
      mode,
      maxItems,
      ${gridRowQuery}
    },
    livedExperiences {
      ${carousel2Query}
    },
    regionalCommunities {
      ${gridRowQuery}
    },
    collaboration {
      ${splitRowQuery}
    },
    news {
      mode,
      maxItems,
      ${gridRowQuery}
    },
    projectInfo {
      ${splitRowQuery}
    },
    mentalHealthDefinition {
      ${cta1Query}
    },
    partnerLogos {
      ${logoCloud1Query}
    },

    meta_title,
    meta_description,
    noindex,
    ogImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
      alt
    }
  }
`;

export const INDEX_HOMEPAGE_QUERY = groq`
  *[_type == "homepage" && slug.current == "index" && language == $language][0]{
    _id,
    title,
    slug,
    language,

    heroWelcome {
      ${hero1Query}
    },
    globalAgenda {
      ${splitRowQuery}
    },
    howToUse {
      ${splitRowQuery}
    },
    agendasModule {
      mode,
      maxItems,
      ${gridRowQuery}
    },
    livedExperiences {
      ${carousel2Query}
    },
    regionalCommunities {
      ${gridRowQuery}
    },
    collaboration {
      ${splitRowQuery}
    },
    news {
      mode,
      maxItems,
      ${gridRowQuery}
    },
    projectInfo {
      ${splitRowQuery}
    },
    mentalHealthDefinition {
      ${cta1Query}
    },
    partnerLogos {
      ${logoCloud1Query}
    },

    meta_title,
    meta_description,
    noindex,
    ogImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
      alt
    }
  }
`;
