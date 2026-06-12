import { groq } from "next-sanity";
import { hero1Query } from "./hero/hero-1";
import { splitRowQuery } from "./split/split-row";
import { gridRowQuery } from "./grid/grid-row";
import { carousel2Query } from "./carousel/carousel-2";
import { cta1Query } from "./cta/cta-1";
import { logoCloud1Query } from "./logo-cloud/logo-cloud-1";

export const HOMEPAGE_QUERY = groq`
  *[_type == "homepage" && slug.current == $slug && language == $language][0]{
    _id,
    title,
    slug,
    language,

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
