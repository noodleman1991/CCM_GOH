import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";
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
import { allPostsQuery } from "./all-posts";
import { manualContentInsertQuery } from "./inserts/manual-content-insert";
import { dynamicContentInsertQuery } from "./inserts/dynamic-content-insert";
import { separatorBlockQuery } from "./inserts/separator-block";

export const REGIONAL_COMMUNITY_PAGE_QUERY = groq`
  *[_type == "regionalCommunityPage" && slug.current == $slug && language == $language][0]{
    _id,
    title,
    slug,
    regionalCommunity->{
      _id,
      name,
      slug,
      coverImage{
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      }
    },
    language,
    useTemplate,

    // Template Components
    welcomeHero {
      ${hero1Query}
    },
    whyJoinCTA {
      ${cta1Query}
    },
    reportsGrid,
    newsGrid,
    caseStudiesGrid,
    livedExperiencesCarousel,
    testimonialsBlock,
    logoCloud {
      ${logoCloud1Query}
    },

    // Custom Content Flow (when not using template)
    contentFlow[]{
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
      ${allPostsQuery},
      ${manualContentInsertQuery},
      ${dynamicContentInsertQuery},
      ${separatorBlockQuery}
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

export const RCPAGES_SLUGS_QUERY = groq`
  *[_type == "regionalCommunityPage" && defined(slug)]{
    _id,
    slug,
    language
  }
`;

