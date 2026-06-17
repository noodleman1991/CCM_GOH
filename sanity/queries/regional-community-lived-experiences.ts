import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

export const REGIONAL_COMMUNITY_LIVED_EXPERIENCES_QUERY = groq`
  *[_type == "livedExperience" &&
    (status == "approved" || !defined(status)) &&
    (!defined($regionalCommunityId) || references($regionalCommunityId)) &&
    (!$featured || featured == true) &&
    publishedAt <= now()
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    description,
    issue,
    personContext,
    videoLink,
    thumbnail{
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
    duration,
    publishedAt,
    featured,
    author->{
      _id,
      name,
      image,
      organizationalAffiliation
    },
    relatedCommunity->{
      _id,
      name,
      slug
    },
    tags[]->{
      _id,
      label,
      value,
      color,
      category
    }[_id != null],
    language,
    transcription,
    subtitles,
    views,
    slug
  }
`;

export const fetchRegionalCommunityLivedExperiences = async ({
  regionalCommunityId,
  limit = 10,
  featured = false
}: {
  regionalCommunityId?: string;
  limit?: number;
  featured?: boolean;
}) => {
  const { data } = await sanityFetch({
    query: REGIONAL_COMMUNITY_LIVED_EXPERIENCES_QUERY,
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

// Query specifically for lived experiences by community slug
export const REGIONAL_COMMUNITY_LIVED_EXPERIENCES_BY_SLUG_QUERY = groq`
  *[_type == "livedExperience" &&
    (status == "approved" || !defined(status)) &&
    references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id) &&
    (!$featured || featured == true) &&
    publishedAt <= now()
  ] | order(featured desc, publishedAt desc) [0...$limit] {
    _id,
    _type,
    title,
    description,
    issue,
    personContext,
    videoLink,
    thumbnail{
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
    duration,
    publishedAt,
    featured,
    author->{
      _id,
      name,
      image,
      organizationalAffiliation
    },
    relatedCommunity->{
      _id,
      name,
      slug
    },
    tags[]->{
      _id,
      label,
      value,
      color,
      category
    }[_id != null],
    language,
    transcription,
    subtitles,
    views,
    slug
  }
`;

export const fetchRegionalCommunityLivedExperiencesBySlug = async ({
  slug,
  limit = 10,
  featured = false
}: {
  slug: string;
  limit?: number;
  featured?: boolean;
}) => {
  const { data } = await sanityFetch({
    query: REGIONAL_COMMUNITY_LIVED_EXPERIENCES_BY_SLUG_QUERY,
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