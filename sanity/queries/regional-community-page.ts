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
import { teamGridQuery } from "./team-grid";
import { regionMapQuery } from "./maps/region-map";

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
      _type,
      _key,
      background{
        ...,
      },
      tagLine,
      title,
      body[]{
        ...,
        _type == "image" => {
          ...,
          asset->{
            _id,
            url,
            mimeType,
            metadata {
              lqip,
              dimensions {
                width,
                height
              }
            }
          }
        }
      },
      image{
        ...,
        asset->{
          _id,
          url,
          mimeType,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      links[]{
        title,
        href,
        target,
        buttonVariant{
          variant,
          size,
          stroke
        }
      },
      padding,
      imagePosition,
    },
    whyJoinCTA {
      _type,
      _key,
      background{
        ...,
      },
      tagLine,
      title,
      body[]{
        ...,
        _type == "image" => {
          ...,
          asset->{
            _id,
            url,
            mimeType,
            metadata {
              lqip,
              dimensions {
                width,
                height
              }
            }
          }
        }
      },
      image{
        ...,
        asset->{
          _id,
          url,
          mimeType,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      links[]{
        title,
        href,
        target,
        buttonVariant{
          variant,
          size,
          stroke
        }
      },
      padding,
      imagePosition,
    },
    teamGrid {
      mode,
      manualMembers[]->{
        _id,
        name,
        slug,
        image {
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
        },
        organizationalAffiliation,
        communityMemberships[] {
          community->{
            _id,
            name
          },
          role
        }
      },
      gridColumns,
      showTitle,
      title,
      showDescription,
      description,
      displayRole,
      displayAffiliation
    },
    agendasGrid {
      mode,
      gridColumns,
      maxItems,
      initialDisplayCount,
      showTitle,
      title,
      subtitle,
      showDescription,
      description,
      headerImage {
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
      },
      manualItems[]->{
        _id,
        title,
        subtitle,
        description,
        slug,
        agendaType,
        year,
        publishDate,
        coverImage {
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
      }
    },
    newsGrid {
      mode,
      gridColumns,
      maxItems,
      initialDisplayCount,
      showTitle,
      title,
      subtitle,
      showDescription,
      description,
      headerImage {
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
      },
      manualItems[]->{
        _id,
        _type,
        title,
        subtitle,
        excerpt,
        slug,
        publishedAt,
        featured,
        image {
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
        },
        author->{
          _id,
          name,
          image,
          organizationalAffiliation
        },
        organizations[]->{
          _id,
          name,
          slug,
          logo {
            asset->{
              _id,
              url
            }
          }
        }[_id != null],
        locationDetails {
          city,
          country,
          region,
          coordinates
        },
        tags[]->{
          _id,
          label,
          value,
          color,
          category
        }[_id != null],
        relatedCommunities[]->{
          _id,
          name,
          slug
        }[_id != null],
        language,
        priority,
        views,
        sourceUrl,
        publisher,
        sourceType
      }
    },
    caseStudiesGrid {
      mode,
      gridColumns,
      maxItems,
      initialDisplayCount,
      showTitle,
      title,
      subtitle,
      showDescription,
      description,
      headerImage {
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
      },
      manualItems[]->{
        _id,
        title,
        excerpt,
        slug,
        publishedAt,
        image {
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
      }
    },
    livedExperiencesCarousel {
      mode,
      maxItems,
      showTitle,
      title,
      showDescription,
      description,
      manualItems[]->{
        _id,
        title,
        excerpt,
        slug,
        thumbnail {
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
        },
        videoUrl,
        duration,
        publishedAt
      }
    },
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
      ${teamGridQuery},
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
      ${separatorBlockQuery},
      ${regionMapQuery}
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

