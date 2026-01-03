import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";

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
export async function fetchFeaturedNews(limit: number = 3) {
  return await client.fetch(
    groq`
      *[_type == "newsPost" &&
        featured == true &&
        publishedAt <= now()
      ] | order(publishedAt desc)[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }
    `
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
}) {
  const conditions: string[] = [
    '_type == "newsPost"',
    'publishedAt <= now()',
    '(!defined(featured) || featured == false)', // Exclude featured from regular grid
  ];

  // Add filter conditions
  if (filters?.tag) {
    conditions.push(`"${filters.tag}" in tags[]->value.current`);
  }

  if (filters?.community) {
    conditions.push(`relatedCommunity->slug.current == "${filters.community}"`);
  }

  if (filters?.dateFrom) {
    conditions.push(`publishedAt >= "${filters.dateFrom}"`);
  }

  if (filters?.dateTo) {
    conditions.push(`publishedAt <= "${filters.dateTo}"`);
  }

  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase();
    conditions.push(`(
      lower(title.en) match "*${searchTerm}*" ||
      lower(title.es) match "*${searchTerm}*" ||
      lower(title.fr) match "*${searchTerm}*" ||
      lower(title.ar) match "*${searchTerm}*" ||
      lower(excerpt.en) match "*${searchTerm}*" ||
      lower(excerpt.es) match "*${searchTerm}*" ||
      lower(excerpt.fr) match "*${searchTerm}*" ||
      lower(excerpt.ar) match "*${searchTerm}*"
    )`);
  }

  const limit = filters?.limit || 50;

  const query = groq`
    *[${conditions.join(' && ')}] | order(publishedAt desc)[0...${limit}] {
      ${NEWS_POST_FIELDS}
    }
  `;

  return await client.fetch(query);
}

// Query 3: Fetch All News (with filters, includes featured)
export async function fetchAllNews(filters?: {
  tag?: string;
  community?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
}) {
  const conditions: string[] = [
    '_type == "newsPost"',
    'publishedAt <= now()',
  ];

  // Add filter conditions
  if (filters?.tag) {
    conditions.push(`"${filters.tag}" in tags[]->value.current`);
  }

  if (filters?.community) {
    conditions.push(`relatedCommunity->slug.current == "${filters.community}"`);
  }

  if (filters?.dateFrom) {
    conditions.push(`publishedAt >= "${filters.dateFrom}"`);
  }

  if (filters?.dateTo) {
    conditions.push(`publishedAt <= "${filters.dateTo}"`);
  }

  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase();
    conditions.push(`(
      lower(title.en) match "*${searchTerm}*" ||
      lower(title.es) match "*${searchTerm}*" ||
      lower(title.fr) match "*${searchTerm}*" ||
      lower(title.ar) match "*${searchTerm}*" ||
      lower(excerpt.en) match "*${searchTerm}*" ||
      lower(excerpt.es) match "*${searchTerm}*" ||
      lower(excerpt.fr) match "*${searchTerm}*" ||
      lower(excerpt.ar) match "*${searchTerm}*"
    )`);
  }

  const limit = filters?.limit || 50;

  const query = groq`
    *[${conditions.join(' && ')}] | order(featured desc, publishedAt desc)[0...${limit}] {
      ${NEWS_POST_FIELDS}
    }
  `;

  return await client.fetch(query);
}

// Query 4: Fetch News by Slug (for detail page)
export async function fetchNewsBySlug(slug: string) {
  return await client.fetch(
    groq`
      *[_type == "newsPost" && slug.current == $slug][0] {
        ${NEWS_POST_FIELDS},
        content,
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
export async function fetchLatestNews(limit: number = 10) {
  return await client.fetch(
    groq`
      *[_type == "newsPost" && publishedAt <= now()]
      | order(publishedAt desc)[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }
    `
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

  if (filters?.featured !== undefined) {
    conditions.push(`featured == ${filters.featured}`);
  }

  if (filters?.tag) {
    conditions.push(`"${filters.tag}" in tags[]->value.current`);
  }

  if (filters?.community) {
    conditions.push(`relatedCommunity->slug.current == "${filters.community}"`);
  }

  if (filters?.dateFrom) {
    conditions.push(`publishedAt >= "${filters.dateFrom}"`);
  }

  if (filters?.dateTo) {
    conditions.push(`publishedAt <= "${filters.dateTo}"`);
  }

  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase();
    conditions.push(`(
      lower(title.en) match "*${searchTerm}*" ||
      lower(title.es) match "*${searchTerm}*" ||
      lower(title.fr) match "*${searchTerm}*" ||
      lower(title.ar) match "*${searchTerm}*" ||
      lower(excerpt.en) match "*${searchTerm}*" ||
      lower(excerpt.es) match "*${searchTerm}*" ||
      lower(excerpt.fr) match "*${searchTerm}*" ||
      lower(excerpt.ar) match "*${searchTerm}*"
    )`);
  }

  return await client.fetch(
    groq`count(*[${conditions.join(' && ')}])`
  );
}
