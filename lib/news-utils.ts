// News-specific utilities and type definitions

import type { SanityPlace } from "@/types/case-study";

/**
 * Reserved value for the "Global" region pill: news/sources NOT tied to any
 * regional community (their optional `relatedCommunity` reference is unset).
 * Lives alongside — never instead of — the CMS-driven community slugs.
 */
export const GLOBAL_REGION = "global";

export interface NewsFilters {
  /** Topic tag values (multi-select). */
  tags?: string[];
  /** Regional community slugs (multi-select), plus the reserved GLOBAL_REGION. */
  communities?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface NewsPost {
  _id: string;
  _type: string;
  title: Record<string, string> | string;
  subtitle?: Record<string, string> | string;
  excerpt?: Record<string, string> | string;
  slug: string;
  publishedAt: string;
  _updatedAt?: string;
  featured?: boolean;
  image?: {
    asset?: {
      _id: string;
      url: string;
      mimeType?: string;
      metadata?: {
        lqip?: string;
        dimensions?: {
          width: number;
          height: number;
        };
      };
    };
    alt?: Record<string, string> | string;
    caption?: Record<string, string> | string;
  };
  author?: {
    _id: string;
    name: string;
    /** Sanity image reference — passed straight to urlFor, never inspected here. */
    image?: unknown;
    bio?: Record<string, string> | string;
    organizationalAffiliation?: string;
  };
  organizations?: Array<{
    _id: string;
    name: string;
    slug?: {
      current: string;
    };
    /** Sanity image reference — passed straight to urlFor, never inspected here. */
    logo?: unknown;
  }>;
  projects?: Array<{
    _id: string;
    name: string;
    description?: Record<string, string> | string;
    slug?: {
      current: string;
    };
  }>;
  locationDetails?: {
    city?: string;
    country?: string;
    region?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  place?: SanityPlace | null;
  tags?: Array<{
    _id: string;
    label: Record<string, string> | string;
    value: {
      current: string;
    };
    color?: string;
    category?: string;
  }>;
  relatedCommunity?: {
    _id: string;
    name: Record<string, string> | string;
    slug: string;
  } | null;
  content?: unknown; // PortableText content
  sources?: Array<{
    title: string;
    url: string;
    publisher?: string;
    date?: string;
  }>;
  language?: string;
  priority?: number;
  views?: number;
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  /** Sanity image reference — passed straight to urlFor, never inspected here. */
  ogImage?: unknown;
}

export interface NewsTag {
  _id: string;
  label: Record<string, string> | string;
  value: string;
  color?: string;
  category?: string;
  newsCount?: number;
}

export interface RegionalCommunity {
  _id: string;
  name: Record<string, string> | string;
  slug: string;
  newsCount?: number;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: NewsFilters): boolean {
  return !!(
    filters.tags?.length ||
    filters.communities?.length ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search
  );
}

/**
 * Get count of active filters
 */
export function getActiveFiltersCount(filters: NewsFilters): number {
  let count = 0;
  count += filters.tags?.length || 0;
  count += filters.communities?.length || 0;
  if (filters.dateFrom || filters.dateTo) count++; // Count date range as one filter
  if (filters.search) count++;
  return count;
}

/**
 * Format date for display
 */
export function formatNewsDate(date: string, locale: string = 'en'): string {
  const dateObj = new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return dateObj.toLocaleDateString(locale, options);
}

/**
 * Format date range for display
 */
export function formatDateRange(
  dateFrom?: string,
  dateTo?: string,
  locale: string = 'en'
): string | null {
  if (!dateFrom && !dateTo) return null;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (dateFrom && dateTo) {
    const from = new Date(dateFrom).toLocaleDateString(locale, options);
    const to = new Date(dateTo).toLocaleDateString(locale, options);
    return `${from} - ${to}`;
  } else if (dateFrom) {
    const from = new Date(dateFrom).toLocaleDateString(locale, options);
    return `From ${from}`;
  } else if (dateTo) {
    const to = new Date(dateTo).toLocaleDateString(locale, options);
    return `Until ${to}`;
  }

  return null;
}

/**
 * Get reading time estimate (in minutes)
 */
/** Loose PortableText block shape — only what the word/text extractors read. */
type PortableTextBlockLike = {
  _type?: string;
  children?: Array<{ text?: string }>;
};

export function getReadingTime(content: unknown): number {
  if (!content) return 0;

  // Approximate words per minute
  const wordsPerMinute = 200;

  // Count words in portable text content
  const countWords = (blocks: unknown): number => {
    if (!Array.isArray(blocks)) return 0;

    return (blocks as PortableTextBlockLike[]).reduce((count, block) => {
      if (block._type === 'block' && block.children) {
        const text = block.children
          .map((child) => child.text || '')
          .join(' ');
        return count + text.split(/\s+/).filter(Boolean).length;
      }
      return count;
    }, 0);
  };

  const wordCount = countWords(content);
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extract plain text from portable text content
 */
export function extractPlainText(content: unknown, maxLength?: number): string {
  if (!content || !Array.isArray(content)) return '';

  const text = (content as PortableTextBlockLike[])
    .filter((block) => block._type === 'block' && block.children)
    .map((block) =>
      (block.children || []).map((child) => child.text || '').join('')
    )
    .join(' ')
    .trim();

  if (maxLength && text.length > maxLength) {
    return text.substring(0, maxLength).trim() + '...';
  }

  return text;
}

/**
 * Build filter summary text
 */
export function getFilterSummary(filters: NewsFilters): string {
  const parts: string[] = [];

  if (filters.search) {
    parts.push(`"${filters.search}"`);
  }

  if (filters.tags?.length) {
    parts.push(filters.tags.join(", "));
  }

  if (filters.communities?.length) {
    parts.push(filters.communities.join(", "));
  }

  if (filters.dateFrom || filters.dateTo) {
    const range = formatDateRange(filters.dateFrom, filters.dateTo);
    if (range) {
      parts.push(range);
    }
  }

  return parts.join(' • ');
}

/**
 * Validate date range
 */
export function isValidDateRange(dateFrom?: string, dateTo?: string): boolean {
  if (!dateFrom || !dateTo) return true;

  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  return from <= to;
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: string, locale: string = 'en'): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(-interval, unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return 'just now';
}

/**
 * Sort news posts by date (descending)
 */
export function sortNewsByDate(news: NewsPost[]): NewsPost[] {
  return [...news].sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });
}

/**
 * Sort news posts by featured status, then date
 */
export function sortNewsByFeatured(news: NewsPost[]): NewsPost[] {
  return [...news].sort((a, b) => {
    // Featured items first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // Then by date
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });
}
