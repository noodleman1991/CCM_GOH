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
    language,
    titleHero {
      ${hero1Query}
    },
    listHero {
      ${hero1Query}
    },
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
    // Get related regional community for reports
    "regionalCommunity": *[_type == "regionalCommunity" && slug.current == $slug][0]{
      _id,
      name,
      code,
      slug
    },
    // Get latest reports for this regional community
    "latestReports": *[_type == "report" && references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id)] | order(publishDate desc)[0...6]{
      _id,
      title,
      subtitle,
      description,
      slug,
      reportType,
      year,
      publishDate,
      downloadCount,
      featured,
      accessLevel,
      coverImage{
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
      files[]{
        language,
        file{
          asset->{
            _id,
            url,
            originalFilename,
            size,
            mimeType
          }
        },
        fileUrl,
        fileSize,
        pages
      },
      tags[]->{
        _id,
        label,
        value,
        color,
        category
      },
      organizations[]->{
        _id,
        name,
        slug,
        logo{
          asset->{
            _id,
            url
          }
        }
      },
      authors[]{
        name,
        organization->{
          name,
          slug
        }
      }
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

// Query specifically for reports in a regional community
// Add this function to your existing sanity/lib/fetch.ts file:

export const fetchRegionalCommunityReports = async ({
                                                        slug,
                                                        limit = 6
                                                    }: {
    slug: string;
    limit?: number;
}) => {
    const { data } = await sanityFetch({
        query: `*[_type == "report" && references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id)] | order(publishDate desc, featured desc)[0...${limit}]{
            _id,
            title,
            subtitle,
            description,
            slug,
            reportType,
            year,
            publishDate,
            downloadCount,
            featured,
            accessLevel,
            coverImage{
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
            files[]{
                language,
                file{
                    asset->{
                        _id,
                        url,
                        originalFilename,
                        size,
                        mimeType
                    }
                },
                fileUrl,
                fileSize,
                pages
            },
            tags[]->{
                _id,
                label,
                value,
                color,
                category
            },
            organizations[]->{
                _id,
                name,
                slug,
                logo{
                    asset->{
                        _id,
                        url
                    }
                }
            },
            authors[]{
                name,
                organization->{
                    name,
                    slug
                }
            }
        }`,
        params: { slug },
        perspective: "published",
        stega: false,
    });

    return data;
};
