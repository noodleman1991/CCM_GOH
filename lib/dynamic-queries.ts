import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

// Predefined query mapping for dynamic content inserts
const QUERY_MAPPING = {
  // Recent content queries
  recentNews: groq`
    *[_type == "newsPost" &&
      defined(relatedCommunity) &&
      relatedCommunity->slug.current == $communitySlug
    ] | order(publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      excerpt,
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
      },
      author->{
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `,

  recentCaseStudies: groq`
    *[_type == "caseStudy" &&
      status == "approved" &&
      references(*[_type == "regionalCommunity" && slug.current == $communitySlug][0]._id)
    ] | order(publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      excerpt,
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
      },
      authors[]{
        name,
        affiliation->{
          name,
          slug
        }
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `,

  recentLivedExperiences: groq`
    *[_type == "livedExperience" &&
      defined(relatedCommunity) &&
      relatedCommunity->slug.current == $communitySlug
    ] | order(publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      description,
      publishedAt,
      videoLink,
      duration,
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
      author->{
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `,

  // Featured content queries (featured first, then recent)
  featuredNews: groq`
    *[_type == "newsPost" &&
      defined(relatedCommunity) &&
      relatedCommunity->slug.current == $communitySlug
    ] | order(featured desc, publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      excerpt,
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
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `,

  featuredCaseStudies: groq`
    *[_type == "caseStudy" &&
      status == "approved" &&
      references(*[_type == "regionalCommunity" && slug.current == $communitySlug][0]._id)
    ] | order(featured desc, publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      excerpt,
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
      authors[]{
        name,
        affiliation->{
          name,
          slug
        }
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `,

  featuredLivedExperiences: groq`
    *[_type == "livedExperience" &&
      defined(relatedCommunity) &&
      relatedCommunity->slug.current == $communitySlug
    ] | order(featured desc, publishedAt desc)[0...$count] {
      _id,
      title,
      slug,
      description,
      publishedAt,
      featured,
      videoLink,
      duration,
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
      author->{
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }
  `,
} as const;

import type { QueryType, DynamicQueryParams } from "./dynamic-queries-types";

/**
 * Execute a predefined query for dynamic content inserts
 * @param queryType - The type of query to execute
 * @param params - Query parameters including community slug and count
 * @returns Promise with the query results
 */
export async function executePredefinedQuery(
  queryType: QueryType,
  params: DynamicQueryParams
) {
  const query = QUERY_MAPPING[queryType];
  if (!query) {
    console.warn(`Unknown query type: ${queryType}`);
    return null;
  }

  try {
    const { data } = await sanityFetch({
      query,
      params: {
        communitySlug: params.communitySlug,
        count: params.count - 1, // GROQ array slice is 0-indexed
      },
      perspective: "published",
      stega: false,
    });

    return data;
  } catch (error) {
    console.error(`Error executing query ${queryType}:`, error);
    return null;
  }
}

// Export from types file
export { getQueryMetadata, validateQueryParams } from "./dynamic-queries-types";