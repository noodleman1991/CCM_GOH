import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

// Shared projection for global news items (newsPost + externalSource).
// Mirrors REGIONAL_COMMUNITY_NEWS_BY_SLUG_QUERY minus the community filter,
// producing the shape grid-news / grid-external-source column items expect.
const NEWS_PROJECTION = groq`{
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
    hotspot,
    crop,
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
  views,
  // External source specific fields
  sourceUrl,
  publisher,
  sourceType
}`;

export const RECENT_NEWS_QUERY = groq`
  *[
    (_type == "newsPost" || _type == "externalSource") &&
    (
      (_type == "newsPost" && publishedAt <= now()) ||
      (_type == "externalSource" && approved == true)
    )
  ] | order(publishedAt desc) [0...$limit] ${NEWS_PROJECTION}
`;

export const FEATURED_NEWS_QUERY = groq`
  *[
    (_type == "newsPost" || _type == "externalSource") &&
    featured == true &&
    (
      (_type == "newsPost" && publishedAt <= now()) ||
      (_type == "externalSource" && approved == true)
    )
  ] | order(publishedAt desc) [0...$limit] ${NEWS_PROJECTION}
`;

// Shared projection for global agendas, matching the shape grid-agenda
// column items expect (same fields as fetchRegionalCommunityAgendas).
const AGENDA_PROJECTION = groq`{
  _id,
  _type,
  title,
  subtitle,
  description,
  slug,
  agendaType,
  year,
  publishDate,
  totalDownloadCount,
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
    hotspot,
    crop,
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
    downloadCount,
    lastDownloaded
  },
  tags[]->{
    _id,
    label,
    value,
    color,
    category
  }[_id != null],
  organizations[]->{
    _id,
    name,
    slug,
    acronym,
    logo{
      asset->{
        _id,
        url
      },
      alt
    }
  }[_id != null],
  regionalCommunities[]->{
    _id,
    name,
    slug,
    code
  }[_id != null]
}`;

export const RECENT_AGENDAS_QUERY = groq`
  *[_type == "agenda"] | order(publishDate desc) [0...$limit] ${AGENDA_PROJECTION}
`;

export const FEATURED_AGENDAS_QUERY = groq`
  *[_type == "agenda" && featured == true] | order(publishDate desc) [0...$limit] ${AGENDA_PROJECTION}
`;

export const fetchHomepageNews = async ({
  limit = 3,
  featured = false,
}: {
  limit?: number;
  featured?: boolean;
}) => {
  const { data } = await sanityFetch({
    query: featured ? FEATURED_NEWS_QUERY : RECENT_NEWS_QUERY,
    params: { limit },
    perspective: "published",
    stega: false,
  });

  return data;
};

export const fetchHomepageAgendas = async ({
  limit = 3,
  featured = false,
}: {
  limit?: number;
  featured?: boolean;
}) => {
  const { data } = await sanityFetch({
    query: featured ? FEATURED_AGENDAS_QUERY : RECENT_AGENDAS_QUERY,
    params: { limit },
    perspective: "published",
    stega: false,
  });

  return data;
};
