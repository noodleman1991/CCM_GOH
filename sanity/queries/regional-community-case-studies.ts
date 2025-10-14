import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

export const REGIONAL_COMMUNITY_CASE_STUDIES_QUERY = groq`
  *[_type == "caseStudy" &&
    (!defined($regionalCommunityId) || references($regionalCommunityId)) &&
    (!$featured || featured == true) &&
    status == "approved"
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    subtitle,
    excerpt,
    slug,
    status,
    publishedAt,
    featured,
    image{
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
    studyPeriod,
    primaryLocation,
    methodology,
    participants,
    findings,
    recommendations,
    authors[]{
      name,
      role,
      organization->{
        name,
        slug
      }
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
    tags[]->{
      _id,
      label,
      value,
      color,
      category
    },
    relatedCommunities[]->{
      _id,
      name,
      slug
    },
    downloads,
    views
  }
`;

export const fetchRegionalCommunityCaseStudies = async ({
  regionalCommunityId,
  limit = 6,
  featured = false
}: {
  regionalCommunityId?: string;
  limit?: number;
  featured?: boolean;
}) => {
  const { data } = await sanityFetch({
    query: REGIONAL_COMMUNITY_CASE_STUDIES_QUERY,
    params: {
      regionalCommunityId,
      limit,
      featured
    },
    perspective: "published",
    stega: false,
  });

  return data;
};

// Query specifically for case studies by community slug
export const REGIONAL_COMMUNITY_CASE_STUDIES_BY_SLUG_QUERY = groq`
  *[_type == "caseStudy" &&
    references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id) &&
    (!$featured || featured == true) &&
    status == "approved"
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    subtitle,
    excerpt,
    slug,
    status,
    publishedAt,
    featured,
    image{
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
    studyPeriod,
    primaryLocation,
    methodology,
    participants,
    findings,
    recommendations,
    authors[]{
      name,
      role,
      organization->{
        name,
        slug
      }
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
    tags[]->{
      _id,
      label,
      value,
      color,
      category
    },
    relatedCommunities[]->{
      _id,
      name,
      slug
    },
    downloads,
    views
  }
`;

export const fetchRegionalCommunityCaseStudiesBySlug = async ({
  slug,
  limit = 6,
  featured = false
}: {
  slug: string;
  limit?: number;
  featured?: boolean;
}) => {
  const { data } = await sanityFetch({
    query: REGIONAL_COMMUNITY_CASE_STUDIES_BY_SLUG_QUERY,
    params: {
      slug,
      limit,
      featured
    },
    perspective: "published",
    stega: false,
  });

  return data;
};