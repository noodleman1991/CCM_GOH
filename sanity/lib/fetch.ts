import { sanityFetch } from "@/sanity/lib/live";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { REGIONAL_COMMUNITY_PAGE_QUERY } from "@/sanity/queries/regional-community-page";
import {
    CASE_STUDY_BY_SLUG_QUERY,
    PUBLISHED_CASE_STUDIES_QUERY,
    FEATURED_CASE_STUDIES_QUERY,
    CASE_STUDIES_BY_LANGUAGE_QUERY,
    APPROVED_CASE_STUDIES_BY_RC_QUERY,
} from "@/sanity/queries/grid/grid-case-study";
import {
    POST_QUERY,
    POSTS_QUERY,
    POSTS_SLUGS_QUERY,
} from "@/sanity/queries/post";
import {
    PAGE_QUERYResult,
    // PAGES_SLUGS_QUERYResult,
    POST_QUERYResult,
    POSTS_QUERYResult,
    POSTS_SLUGS_QUERYResult,
} from "@/sanity.types";

// export const fetchSanityPageBySlug = async ({
//   slug,
// }: {
//   slug: string;
// }): Promise<PAGE_QUERYResult> => {
//   const { data } = await sanityFetch({
//     query: PAGE_QUERY,
//     params: { slug },
//   });
//
//   return data;
// };

export const fetchSanityPageBySlug = async ({
                                                slug,
                                                locale = 'en',
                                            }: {
    slug: string;
    locale?: string;
}): Promise<PAGE_QUERYResult> => {
    const { data } = await sanityFetch({
        query: PAGE_QUERY,
        params: {
            slug,
            language: locale
        },
    });

    return data;
};

export const fetchSanityRCPageBySlug = async ({
                                                  slug,
                                                  locale = 'en',
                                              }: {
    slug: string;
    locale?: string;
}) => {
    const { data } = await sanityFetch({
        query: REGIONAL_COMMUNITY_PAGE_QUERY,
        params: {
            slug,
            language: locale
        },
    });

    return data;
};

export const fetchSanityRCPagesStaticParams = async () => {
    const { data } = await sanityFetch({
        query: PAGES_SLUGS_QUERY,
        perspective: "published",
        stega: false,
    });

    return data;
};

// export const fetchSanityPagesStaticParams =
//   async (): Promise<PAGES_SLUGS_QUERYResult> => {
//     const { data } = await sanityFetch({
//       query: PAGES_SLUGS_QUERY,
//       perspective: "published",
//       stega: false,
//     });
//
//     return data;
//   };

export const fetchSanityPagesStaticParams = async () => {
    const { data } = await sanityFetch({
        query: `*[_type == "page" && defined(slug)]{
      _id,
      slug { current },
      language
    }`,
        perspective: "published",
        stega: false,
    });

    return data;
};

// export const fetchSanityRCPagesStaticParams = async () => { //regional community page
//     const { data } = await sanityFetch({
//         query: `*[_type == "regionalCommunityPage" && defined(slug)]{
//       _id,
//       slug { current },
//       language
//     }`,
//         perspective: "published",
//         stega: false,
//     });
//
//     return data;
// };

export const fetchTranslationsForPage = async (pageId: string) => {
    const { data } = await sanityFetch({
        query: `
      *[_type == "translation.metadata" && references($pageId)][0]{
        "translations": translations[].value->{
          _id,
          language,
          slug
        }
      }.translations`,
        params: { pageId },
        perspective: "published",
        stega: false,
    });

    return data;
};

export const fetchSanityPosts = async (): Promise<POSTS_QUERYResult> => {
    const { data } = await sanityFetch({
        query: POSTS_QUERY,
    });

    return data;
};

export const fetchSanityPostBySlug = async ({
                                                slug,
                                                locale = 'en',
                                            }: {
    slug: string;
    locale?: string;
}): Promise<POST_QUERYResult> => {
    const { data } = await sanityFetch({
        query: POST_QUERY,
        params: {
            slug,
            language: locale
        },
    });

    return data;
};

export const fetchSanityPostsStaticParams =
    async (): Promise<POSTS_SLUGS_QUERYResult> => {
        const { data } = await sanityFetch({
            query: POSTS_SLUGS_QUERY,
            perspective: "published",
            stega: false,
        });

        return data;
    };

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
            },
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
            },
            regionalCommunities[]->{
                _id,
                name,
                slug,
                code
            }
        }`,
        params: { slug },
        perspective: "published",
        stega: false,
    });

    return data;
};

export const fetchRegionalCommunityCaseStudies = async ({
                                                            slug,
                                                            limit = 6
                                                        }: {
    slug: string;
    limit?: number;
}) => {
    const { data } = await sanityFetch({
        query: APPROVED_CASE_STUDIES_BY_RC_QUERY,
        params: { slug, limit },
        perspective: "published",
        stega: false,
    });

    return data;
};

// ===== CASE STUDY FETCH FUNCTIONS =====

export const fetchCaseStudyBySlug = async ({
                                               slug,
                                               locale = 'en',
                                           }: {
    slug: string;
    locale?: string;
}) => {
    const { data } = await sanityFetch({
        query: CASE_STUDY_BY_SLUG_QUERY,
        params: {
            slug,
            language: locale
        },
    });

    return data;
};

export const fetchPublishedCaseStudies = async ({
                                                    limit = 12,
                                                    locale = 'en',
                                                }: {
    limit?: number;
    locale?: string;
} = {}) => {
    const { data } = await sanityFetch({
        query: PUBLISHED_CASE_STUDIES_QUERY,
        params: { limit },
        perspective: "published",
        stega: false,
    });

    return data;
};

export const fetchCaseStudiesByLanguage = async ({
                                                     language,
                                                     limit = 12,
                                                 }: {
    language: string;
    limit?: number;
}) => {
    const { data } = await sanityFetch({
        query: CASE_STUDIES_BY_LANGUAGE_QUERY,
        params: { language, limit },
        perspective: "published",
        stega: false,
    });

    return data;
};

export const fetchFeaturedCaseStudies = async ({
                                                   limit = 3,
                                               }: {
    limit?: number;
} = {}) => {
    const { data } = await sanityFetch({
        query: FEATURED_CASE_STUDIES_QUERY,
        params: { limit },
        perspective: "published",
        stega: false,
    });

    return data;
};

export const fetchCaseStudiesStaticParams = async () => {
    const { data } = await sanityFetch({
        query: `*[_type == "caseStudy" && status == "published" && defined(slug)]{
      _id,
      slug { current },
      language
    }`,
        perspective: "published",
        stega: false,
    });

    return data;
};

// Fetch case studies for a specific user (by userId)
export const fetchCaseStudiesByUser = async ({
                                                 userId,
                                                 limit = 12,
                                             }: {
    userId: string;
    limit?: number;
}) => {
    const { data } = await sanityFetch({
        query: `*[_type == "caseStudy" && submittedBy == $userId] | order(_updatedAt desc)[0...$limit]{
      _id,
      language,
      title,
      excerpt,
      slug,
      status,
      publishedAt,
      submittedAt,
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
      authors[]{
        name,
        role
      }
    }`,
        params: { userId, limit },
    });

    return data;
};

// Fetch case studies by status (for editorial workflow)
export const fetchCaseStudiesByStatus = async ({
                                                   status,
                                                   limit = 50,
                                               }: {
    status: string;
    limit?: number;
}) => {
    const { data } = await sanityFetch({
        query: `*[_type == "caseStudy" && status == $status] | order(_updatedAt desc)[0...$limit]{
      _id,
      language,
      title,
      excerpt,
      slug,
      status,
      publishedAt,
      submittedAt,
      submittedBy,
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
      authors[]{
        name,
        role,
        email
      },
      reviewNotes,
      reviewedBy->{
        name
      },
      reviewedAt
    }`,
        params: { status, limit },
    });

    return data;
};

// Fetch translations for a case study
export const fetchCaseStudyTranslations = async (caseStudyId: string) => {
    const { data } = await sanityFetch({
        query: `*[_type == "caseStudy" && _id == $caseStudyId][0]{
      _id,
      language,
      baseDocument->{
        _id,
        language,
        slug,
        title
      },
      translations[]{
        language,
        status,
        document->{
          _id,
          language,
          slug,
          title,
          status
        }
      }
    }`,
        params: { caseStudyId },
        perspective: "published",
        stega: false,
    });

    return data;
};

// Fetch approved case studies by regional community with RTL ordering support
export const fetchApprovedCaseStudiesByRC = async ({
                                                       slug,
                                                       limit = 12,
                                                       locale = 'en',
                                                   }: {
    slug: string;
    limit?: number;
    locale?: string;
}) => {
    // Determine ordering based on language (RTL vs LTR)
    const isRTL = locale === 'ar';
    const orderDirection = isRTL ? 'asc' : 'desc'; // RTL: oldest first (right to left), LTR: newest first (left to right)

    const { data } = await sanityFetch({
        query: `*[_type == "caseStudy" && status == "approved" && references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id)] | order(publishedAt ${orderDirection}, featured desc)[0...$limit]{
      _id,
      language,
      title,
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
        alt,
        caption
      },
      authors[]{
        userId,
        name,
        email,
        role,
        affiliation->{
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
        }
      },
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
      },
      projects[]->{
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
      },
      studyPeriod,
      studyLocation,
      studyAreas[]{
        location,
        name,
        description
      }
    }`,
        params: { slug, limit },
        perspective: "published",
        stega: false,
    });

    return data;
};

// Search case studies
export const searchCaseStudies = async ({
                                            searchTerm,
                                            language,
                                            tags,
                                            limit = 20,
                                        }: {
    searchTerm?: string;
    language?: string;
    tags?: string[];
    limit?: number;
}) => {
    let filters = [`_type == "caseStudy"`, `status == "published"`];

    if (language) {
        filters.push(`language == "${language}"`);
    }

    if (searchTerm) {
        filters.push(`(
      title.en match "${searchTerm}*" ||
      title.es match "${searchTerm}*" ||
      title.fr match "${searchTerm}*" ||
      title.ar match "${searchTerm}*" ||
      excerpt.en match "${searchTerm}*" ||
      excerpt.es match "${searchTerm}*" ||
      excerpt.fr match "${searchTerm}*" ||
      excerpt.ar match "${searchTerm}*"
    )`);
    }

    if (tags && tags.length > 0) {
        const tagFilter = tags.map(tag => `references(*[_type == "tag" && value == "${tag}"][0]._id)`).join(' || ');
        filters.push(`(${tagFilter})`);
    }

    const { data } = await sanityFetch({
        query: `*[${filters.join(' && ')}] | order(featured desc, publishedAt desc)[0...$limit]{
      _id,
      language,
      title,
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
        alt,
        caption
      },
      authors[]{
        name,
        role,
        affiliation->{
          name,
          acronym
        }
      },
      tags[]->{
        _id,
        label,
        value,
        color
      }
    }`,
        params: { limit },
        perspective: "published",
        stega: false,
    });

    return data;
};
