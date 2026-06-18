import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { styledBodyProjection } from "@/sanity/queries/shared/styled-body";

// Shared fragment for news post fields
const NEWS_POST_FIELDS = groq`
  _id,
  _type,
  title,
  subtitle,
  excerpt,
  "slug": slug.current,
  publishedAt,
  _updatedAt,
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
    alt,
    caption
  },
  author->{
    _id,
    name,
    image,
    bio,
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
  },
  projects[]->{
    _id,
    name,
    description,
    slug
  },
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
  },
  relatedCommunities[]->{
    _id,
    name,
    slug
  },
  language,
  priority,
  views
`;

// Query 1: Fetch Featured News (for hero section)
export async function fetchFeaturedNews(limit: number = 3, language?: string) {
  const conditions = [
    '_type == "newsPost"',
    'featured == true',
    'publishedAt <= now()',
  ];
  const orderClause = language
    ? `order(language == $language desc, publishedAt desc)`
    : `order(publishedAt desc)`;
  return await client.fetch(
    groq`
      *[${conditions.join(' && ')}] | ${orderClause}[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }
    `,
    language ? { language } : {}
  );
}

// Query 2: Fetch Regular News (non-featured, with optional filters)
export async function fetchRegularNews(filters?: {
  tag?: string;
  community?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  language?: string;
}) {
  const conditions: string[] = [
    '_type == "newsPost"',
    'publishedAt <= now()',
    '(!defined(featured) || featured == false)', // Exclude featured from regular grid
  ];
  const params: Record<string, unknown> = {};

  // Add filter conditions using parameterized values to prevent GROQ injection
  if (filters?.tag) {
    conditions.push(`$filterTag in tags[]->value.current`);
    params.filterTag = filters.tag;
  }

  if (filters?.community) {
    conditions.push(`relatedCommunity->slug.current == $filterCommunity`);
    params.filterCommunity = filters.community;
  }

  if (filters?.dateFrom) {
    conditions.push(`publishedAt >= $filterDateFrom`);
    params.filterDateFrom = filters.dateFrom;
  }

  if (filters?.dateTo) {
    conditions.push(`publishedAt <= $filterDateTo`);
    params.filterDateTo = filters.dateTo;
  }

  if (filters?.search) {
    conditions.push(`(
      lower(title.en) match $searchPattern ||
      lower(title.es) match $searchPattern ||
      lower(title.fr) match $searchPattern ||
      lower(title.ar) match $searchPattern ||
      lower(excerpt.en) match $searchPattern ||
      lower(excerpt.es) match $searchPattern ||
      lower(excerpt.fr) match $searchPattern ||
      lower(excerpt.ar) match $searchPattern
    )`);
    params.searchPattern = `*${filters.search.toLowerCase()}*`;
  }

  const limit = filters?.limit || 50;
  const orderClause = filters?.language
    ? `order(language == $language desc, publishedAt desc)`
    : `order(publishedAt desc)`;

  if (filters?.language) {
    params.language = filters.language;
  }

  const query = groq`
    *[${conditions.join(' && ')}] | ${orderClause}[0...${limit}] {
      ${NEWS_POST_FIELDS}
    }
  `;

  return await client.fetch(query, params);
}

// Query 3: Fetch All News (with filters, includes featured)
export async function fetchAllNews(filters?: {
  tag?: string;
  community?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  language?: string;
}) {
  const conditions: string[] = [
    '_type == "newsPost"',
    'publishedAt <= now()',
  ];
  const params: Record<string, unknown> = {};

  // Add filter conditions using parameterized values to prevent GROQ injection
  if (filters?.tag) {
    conditions.push(`$filterTag in tags[]->value.current`);
    params.filterTag = filters.tag;
  }

  if (filters?.community) {
    conditions.push(`relatedCommunity->slug.current == $filterCommunity`);
    params.filterCommunity = filters.community;
  }

  if (filters?.dateFrom) {
    conditions.push(`publishedAt >= $filterDateFrom`);
    params.filterDateFrom = filters.dateFrom;
  }

  if (filters?.dateTo) {
    conditions.push(`publishedAt <= $filterDateTo`);
    params.filterDateTo = filters.dateTo;
  }

  if (filters?.search) {
    conditions.push(`(
      lower(title.en) match $searchPattern ||
      lower(title.es) match $searchPattern ||
      lower(title.fr) match $searchPattern ||
      lower(title.ar) match $searchPattern ||
      lower(excerpt.en) match $searchPattern ||
      lower(excerpt.es) match $searchPattern ||
      lower(excerpt.fr) match $searchPattern ||
      lower(excerpt.ar) match $searchPattern
    )`);
    params.searchPattern = `*${filters.search.toLowerCase()}*`;
  }

  const limit = filters?.limit || 50;
  const orderClause = filters?.language
    ? `order(language == $language desc, featured desc, publishedAt desc)`
    : `order(featured desc, publishedAt desc)`;

  if (filters?.language) {
    params.language = filters.language;
  }

  const query = groq`
    *[${conditions.join(' && ')}] | ${orderClause}[0...${limit}] {
      ${NEWS_POST_FIELDS}
    }
  `;

  return await client.fetch(query, params);
}

// Query 4: Fetch News by Slug (for detail page)
export async function fetchNewsBySlug(slug: string) {
  return await client.fetch(
    groq`
      *[_type == "newsPost" && slug.current == $slug][0] {
        ${NEWS_POST_FIELDS},
        content[]{ ${styledBodyProjection} },
        sources[]{
          title,
          url,
          publisher,
          date
        },
        meta_title,
        meta_description,
        noindex,
        ogImage{
          asset->{
            _id,
            url
          }
        }
      }
    `,
    { slug }
  );
}

// Query 5: Fetch Available Tags (for filter dropdown)
export async function fetchNewsTags() {
  return await client.fetch(
    groq`
      *[_type == "tag" && count(*[_type == "newsPost" && references(^._id)]) > 0]
      | order(label.en asc) {
        _id,
        label,
        "value": value.current,
        color,
        category,
        "newsCount": count(*[_type == "newsPost" && references(^._id)])
      }
    `
  );
}

// Query 6: Fetch Regional Communities (for filter dropdown)
export async function fetchRegionalCommunities() {
  return await client.fetch(
    groq`
      *[_type == "regionalCommunity"]
      | order(order asc, name.en asc) {
        _id,
        name,
        "slug": slug.current,
        "newsCount": count(*[_type == "newsPost" && relatedCommunity._ref == ^._id])
      }
    `
  );
}

// Query 7: Fetch Related News (for detail page)
export async function fetchRelatedNews(newsId: string, tags: string[], limit: number = 3) {
  if (tags.length === 0) {
    return [];
  }

  return await client.fetch(
    groq`
      *[_type == "newsPost" &&
        _id != $newsId &&
        publishedAt <= now() &&
        count((tags[]->_id)[@ in $tags]) > 0
      ] | order(publishedAt desc)[0...${limit}] {
        _id,
        title,
        subtitle,
        excerpt,
        "slug": slug.current,
        publishedAt,
        featured,
        image{
          asset->{
            _id,
            url,
            metadata {
              lqip
            }
          },
          alt
        },
        tags[]->{
          _id,
          label,
          color
        }
      }
    `,
    { newsId, tags }
  );
}

// Query 8: Fetch Latest News (simple query for recent news)
export async function fetchLatestNews(limit: number = 10, language?: string) {
  const conditions = [
    '_type == "newsPost"',
    'publishedAt <= now()',
  ];
  if (language) {
    conditions.push('language == $language');
  }
  return await client.fetch(
    groq`
      *[${conditions.join(' && ')}]
      | order(publishedAt desc)[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }
    `,
    language ? { language } : {}
  );
}

// External Source fields fragment
const EXTERNAL_SOURCE_FIELDS = groq`
  _id,
  _type,
  title,
  excerpt,
  sourceUrl,
  publisher,
  publishedAt,
  featured,
  sourceType,
  language,
  image{
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
  organizations[]->{
    _id,
    name,
    slug
  },
  tags[]->{
    _id,
    label,
    title,
    value,
    color,
    category
  }
`;

// Query: Fetch approved external sources (for news page)
export async function fetchApprovedExternalSources(filters?: {
  tag?: string;
  community?: string;
  search?: string;
  limit?: number;
}) {
  const conditions: string[] = [
    '_type == "externalSource"',
    'approved == true',
  ];
  const params: Record<string, unknown> = {};

  if (filters?.tag) {
    conditions.push('$filterTag in tags[]->value.current');
    params.filterTag = filters.tag;
  }

  if (filters?.community) {
    conditions.push('relatedCommunity->slug.current == $filterCommunity');
    params.filterCommunity = filters.community;
  }

  if (filters?.search) {
    conditions.push(`(
      lower(title.en) match $searchPattern ||
      lower(title.es) match $searchPattern ||
      lower(title.fr) match $searchPattern ||
      lower(title.ar) match $searchPattern ||
      lower(excerpt.en) match $searchPattern ||
      lower(excerpt.es) match $searchPattern ||
      lower(excerpt.fr) match $searchPattern ||
      lower(excerpt.ar) match $searchPattern
    )`);
    params.searchPattern = `*${filters.search.toLowerCase()}*`;
  }

  const limit = filters?.limit || 20;

  return await client.fetch(
    groq`
      *[${conditions.join(' && ')}] | order(publishedAt desc)[0...${limit}] {
        ${EXTERNAL_SOURCE_FIELDS}
      }
    `,
    params
  );
}

// Query 9: Get News Count (useful for pagination)
export async function getNewsCount(filters?: {
  tag?: string;
  community?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  featured?: boolean;
}) {
  const conditions: string[] = [
    '_type == "newsPost"',
    'publishedAt <= now()',
  ];
  const params: Record<string, unknown> = {};

  if (filters?.featured !== undefined) {
    conditions.push(`featured == $filterFeatured`);
    params.filterFeatured = filters.featured;
  }

  // Use parameterized values to prevent GROQ injection
  if (filters?.tag) {
    conditions.push(`$filterTag in tags[]->value.current`);
    params.filterTag = filters.tag;
  }

  if (filters?.community) {
    conditions.push(`relatedCommunity->slug.current == $filterCommunity`);
    params.filterCommunity = filters.community;
  }

  if (filters?.dateFrom) {
    conditions.push(`publishedAt >= $filterDateFrom`);
    params.filterDateFrom = filters.dateFrom;
  }

  if (filters?.dateTo) {
    conditions.push(`publishedAt <= $filterDateTo`);
    params.filterDateTo = filters.dateTo;
  }

  if (filters?.search) {
    conditions.push(`(
      lower(title.en) match $searchPattern ||
      lower(title.es) match $searchPattern ||
      lower(title.fr) match $searchPattern ||
      lower(title.ar) match $searchPattern ||
      lower(excerpt.en) match $searchPattern ||
      lower(excerpt.es) match $searchPattern ||
      lower(excerpt.fr) match $searchPattern ||
      lower(excerpt.ar) match $searchPattern
    )`);
    params.searchPattern = `*${filters.search.toLowerCase()}*`;
  }

  return await client.fetch(
    groq`count(*[${conditions.join(' && ')}])`,
    params
  );
}
