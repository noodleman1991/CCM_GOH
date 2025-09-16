// Shared types and metadata for dynamic queries (client-safe)

export const QUERY_TYPES = {
  recentNews: "recentNews",
  recentCaseStudies: "recentCaseStudies",
  recentLivedExperiences: "recentLivedExperiences",
  featuredNews: "featuredNews",
  featuredCaseStudies: "featuredCaseStudies",
  featuredLivedExperiences: "featuredLivedExperiences",
} as const;

export type QueryType = keyof typeof QUERY_TYPES;

export interface DynamicQueryParams {
  communitySlug: string;
  count: number;
}

/**
 * Get query metadata for display purposes
 */
export function getQueryMetadata(queryType: QueryType) {
  const metadata = {
    recentNews: {
      title: "Recent News & Posts",
      description: "Latest news and posts from this regional community",
      contentType: "newsPost",
    },
    recentCaseStudies: {
      title: "Recent Case Studies",
      description: "Latest case studies related to this regional community",
      contentType: "caseStudy",
    },
    recentLivedExperiences: {
      title: "Recent Lived Experiences",
      description: "Latest lived experience videos from this community",
      contentType: "livedExperience",
    },
    featuredNews: {
      title: "Featured News & Posts",
      description: "Featured news and posts, followed by recent content",
      contentType: "newsPost",
    },
    featuredCaseStudies: {
      title: "Featured Case Studies",
      description: "Featured case studies, followed by recent content",
      contentType: "caseStudy",
    },
    featuredLivedExperiences: {
      title: "Featured Lived Experiences",
      description: "Featured lived experience videos, followed by recent content",
      contentType: "livedExperience",
    },
  };

  return metadata[queryType] || { title: queryType, description: "", contentType: "unknown" };
}

/**
 * Validate query parameters
 */
export function validateQueryParams(params: Partial<DynamicQueryParams>): params is DynamicQueryParams {
  return !!(
    params.communitySlug &&
    typeof params.communitySlug === "string" &&
    params.count &&
    typeof params.count === "number" &&
    params.count > 0 &&
    params.count <= 12
  );
}