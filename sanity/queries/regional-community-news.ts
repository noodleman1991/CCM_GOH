import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

export const REGIONAL_COMMUNITY_NEWS_QUERY = groq`
  *[_type == "newsPost" &&
    (!defined($regionalCommunityId) || references($regionalCommunityId)) &&
    (!$featured || featured == true) &&
    publishedAt <= now()
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    subtitle,
    excerpt,
    slug,
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
      logo{
        asset->{
          _id,
          url
        }
      }
    }[_id != null],
    locationDetails{
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
    views
  }
`;

export const fetchRegionalCommunityNews = async ({
  regionalCommunityId,
  limit = 6,
  featured = false
}: {
  regionalCommunityId?: string;
  limit?: number;
  featured?: boolean;
}) => {
  const { data } = await sanityFetch({
    query: REGIONAL_COMMUNITY_NEWS_QUERY,
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

// Query specifically for news by community slug
export const REGIONAL_COMMUNITY_NEWS_BY_SLUG_QUERY = groq`
  *[_type == "newsPost" &&
    references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id) &&
    (!$featured || featured == true) &&
    publishedAt <= now()
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    subtitle,
    excerpt,
    slug,
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
      logo{
        asset->{
          _id,
          url
        }
      }
    }[_id != null],
    locationDetails{
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
    views
  }
`;

export const fetchRegionalCommunityNewsBySlug = async ({
  slug,
  limit = 6,
  featured = false
}: {
  slug: string;
  limit?: number;
  featured?: boolean;
}) => {
  const { data } = await sanityFetch({
    query: REGIONAL_COMMUNITY_NEWS_BY_SLUG_QUERY,
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