import { sanityFetch } from "@/sanity/lib/live";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { REGIONAL_COMMUNITY_PAGE_QUERY } from "@/sanity/queries/regional-community-page";
import {
    CASE_STUDY_BY_SLUG_QUERY,
    APPROVED_CASE_STUDIES_QUERY,
    FEATURED_CASE_STUDIES_QUERY,
    APPROVED_CASE_STUDIES_BY_RC_QUERY,
} from "@/sanity/queries/grid/grid-case-study";
import {
    POST_QUERY,
    POSTS_QUERY,
    POSTS_SLUGS_QUERY,
} from "@/sanity/queries/post";
import {
  HOMEPAGE_QUERY,
  INDEX_HOMEPAGE_QUERY,
} from "@/sanity/queries/homepage";
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

    // Fall back to the English document if this locale has no translation yet,
    // so a missing translation degrades to English instead of a 404. (Mirrors
    // fetchSanityRCPageBySlug.)
    if (!data && locale !== 'en') {
        const { data: fallbackData } = await sanityFetch({
            query: PAGE_QUERY,
            params: {
                slug,
                language: 'en'
            },
        });
        return fallbackData;
    }

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

    // Fall back to English if no locale-specific document exists
    if (!data && locale !== 'en') {
        const { data: fallbackData } = await sanityFetch({
            query: REGIONAL_COMMUNITY_PAGE_QUERY,
            params: {
                slug,
                language: 'en'
            },
        });
        return fallbackData;
    }

    return data;
};

export const fetchSanityRCPagesStaticParams = async () => {
    const { data } = await sanityFetch({
        query: `*[_type == "regionalCommunityPage" && defined(slug)]{
      _id,
      slug { current },
      language
    }`,
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
    try {
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

        return data || [];
    } catch (error) {
        // Translation metadata schema doesn't exist or no translations found
        // This is expected if internationalization isn't fully set up
        console.warn(`No translation metadata found for page ${pageId}:`, error);
        return [];
    }
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

    // Fall back to English when this locale has no translation, so a missing
    // translation degrades to English instead of a 404.
    if (!data && locale !== 'en') {
        const { data: fallbackData } = await sanityFetch({
            query: POST_QUERY,
            params: { slug, language: 'en' },
        });
        return fallbackData;
    }

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

/**
 * Fetch agendas for a regional community using featured-first then recent logic
 * @param slug - Regional community slug
 * @param limit - Maximum number of agendas to return
 * @returns Array of agendas with featured items first, then recent items
 */
export const fetchRegionalCommunityAgendas = async ({
    slug,
    limit = 6
}: {
    slug: string;
    limit?: number;
}) => {
    try {
        // First, get the regional community ID
        const { data: community } = await sanityFetch({
            query: `*[_type == "regionalCommunity" && slug.current == $slug][0]{_id}`,
            params: { slug },
            perspective: "published",
            stega: false,
        });

        if (!community?._id) {
            return [];
        }

        const regionalCommunityId = community._id;
        let items: any[] = [];

        // First get featured agendas
        const { data: featuredAgendas } = await sanityFetch({
            query: `*[_type == "agenda" && featured == true && references($regionalCommunityId)] | order(publishDate desc)[0...${limit}]{
                _id,
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
            }`,
            params: { regionalCommunityId },
            perspective: "published",
            stega: false,
        });

        items = featuredAgendas || [];

        // If we need more items, get recent non-featured agendas
        if (items.length < limit) {
            const remainingCount = limit - items.length;
            const featuredIds = items.map((item: any) => item._id);

            const { data: recentAgendas } = await sanityFetch({
                query: `*[_type == "agenda" && !(_id in $featuredIds) && references($regionalCommunityId)] | order(publishDate desc)[0...${remainingCount}]{
                    _id,
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
                }`,
                params: { featuredIds, regionalCommunityId },
                perspective: "published",
                stega: false,
            });

            items = [...items, ...(recentAgendas || [])];
        }

        return items;
    } catch (error) {
        console.error('Error fetching regional community agendas:', error);
        return [];
    }
};


// ===== TEMPLATE-SPECIFIC DYNAMIC FETCH FUNCTIONS =====

/**
 * Fetch dynamic news for regional community template
 * @param regionalCommunityId - Regional community ID
 * @param mode - Fetching mode (featured-first or recent)
 * @param maxItems - Maximum number of items to return
 * @returns Array of news posts with featured items first when applicable
 */
export const fetchDynamicNews = async ({
    regionalCommunityId,
    mode = "dynamic-featured",
    maxItems = 6
}: {
    regionalCommunityId: string;
    mode?: "dynamic-featured" | "dynamic-recent";
    maxItems?: number;
}) => {
    try {
        let items: any[] = [];

        if (mode === "dynamic-featured") {
            // First get featured news
            const { data: featuredNews } = await sanityFetch({
                query: `*[_type == "newsPost" && featured == true && references($regionalCommunityId)] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
                    title,
                    subtitle,
                    excerpt,
                    slug,
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
                    author->{
                        _id,
                        name,
                        image{
                            asset->{
                                _id,
                                url
                            }
                        }
                    },
                    publishedAt,
                    organizations[]->{
                        _id,
                        name
                    },
                    locationDetails,
                    tags[]->{
                        _id,
                        label,
                        color
                    },
                    featured
                }`,
                params: { regionalCommunityId },
                perspective: "published",
                stega: false,
            });

            items = featuredNews || [];

            // If we need more items, get recent non-featured news
            if (items.length < maxItems) {
                const remainingCount = maxItems - items.length;
                const featuredIds = items.map((item: any) => item._id);

                const { data: recentNews } = await sanityFetch({
                    query: `*[_type == "newsPost" && !(_id in $featuredIds) && references($regionalCommunityId)] | order(publishedAt desc)[0...${remainingCount}]{
                        _id,
                        title,
                        subtitle,
                        excerpt,
                        slug,
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
                        author->{
                            _id,
                            name,
                            image{
                                asset->{
                                    _id,
                                    url
                                }
                            }
                        },
                        publishedAt,
                        organizations[]->{
                            _id,
                            name
                        },
                        locationDetails,
                        tags[]->{
                            _id,
                            label,
                            color
                        },
                        featured
                    }`,
                    params: { featuredIds, regionalCommunityId },
                    perspective: "published",
                    stega: false,
                });

                items = [...items, ...(recentNews || [])];
            }
        } else {
            // Just get recent news
            const { data } = await sanityFetch({
                query: `*[_type == "newsPost" && references($regionalCommunityId)] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
                    title,
                    subtitle,
                    excerpt,
                    slug,
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
                    author->{
                        _id,
                        name,
                        image{
                            asset->{
                                _id,
                                url
                            }
                        }
                    },
                    publishedAt,
                    organizations[]->{
                        _id,
                        name
                    },
                    locationDetails,
                    tags[]->{
                        _id,
                        label,
                        color
                    },
                    featured
                }`,
                params: { regionalCommunityId },
                perspective: "published",
                stega: false,
            });

            items = data || [];
        }

        return items;
    } catch (error) {
        console.error('Error fetching dynamic news:', error);
        return [];
    }
};

/**
 * Fetch dynamic case studies for regional community template
 * @param regionalCommunityId - Regional community ID
 * @param mode - Fetching mode (featured-first or recent)
 * @param maxItems - Maximum number of items to return
 * @returns Array of case studies (approved only) with featured items first when applicable
 */
export const fetchDynamicCaseStudies = async ({
    regionalCommunityId,
    mode = "dynamic-featured",
    maxItems = 6
}: {
    regionalCommunityId: string;
    mode?: "dynamic-featured" | "dynamic-recent";
    maxItems?: number;
}) => {
    try {
        let items: any[] = [];

        if (mode === "dynamic-featured") {
            // First get featured case studies (approved only)
            const { data: featuredCaseStudies } = await sanityFetch({
                query: `*[_type == "caseStudy" && status == "approved" && featured == true && references($regionalCommunityId)] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
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
                    tags[]->{
                        _id,
                        label,
                        value,
                        color
                    },
                    studyPeriod,
                    studyLocation
                }`,
                params: { regionalCommunityId },
                perspective: "published",
                stega: false,
            });

            items = featuredCaseStudies || [];

            // If we need more items, get recent non-featured case studies
            if (items.length < maxItems) {
                const remainingCount = maxItems - items.length;
                const featuredIds = items.map((item: any) => item._id);

                const { data: recentCaseStudies } = await sanityFetch({
                    query: `*[_type == "caseStudy" && status == "approved" && !(_id in $featuredIds) && references($regionalCommunityId)] | order(publishedAt desc)[0...${remainingCount}]{
                        _id,
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
                        tags[]->{
                            _id,
                            label,
                            value,
                            color
                        },
                        studyPeriod,
                        studyLocation
                    }`,
                    params: { featuredIds, regionalCommunityId },
                    perspective: "published",
                    stega: false,
                });

                items = [...items, ...(recentCaseStudies || [])];
            }
        } else {
            // Just get recent case studies (approved only)
            const { data } = await sanityFetch({
                query: `*[_type == "caseStudy" && status == "approved" && references($regionalCommunityId)] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
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
                    tags[]->{
                        _id,
                        label,
                        value,
                        color
                    },
                    studyPeriod,
                    studyLocation
                }`,
                params: { regionalCommunityId },
                perspective: "published",
                stega: false,
            });

            items = data || [];
        }

        return items;
    } catch (error) {
        console.error('Error fetching dynamic case studies:', error);
        return [];
    }
};

/**
 * Fetch dynamic lived experiences for regional community template
 * @param regionalCommunityId - Regional community ID
 * @param mode - Fetching mode (featured-first or recent)
 * @param maxItems - Maximum number of items to return
 * @returns Array of lived experiences with featured items first when applicable
 */
export const fetchDynamicLivedExperiences = async ({
    regionalCommunityId,
    mode = "dynamic-featured",
    maxItems = 10
}: {
    regionalCommunityId: string;
    mode?: "dynamic-featured" | "dynamic-recent";
    maxItems?: number;
}) => {
    try {
        let items: any[] = [];

        if (mode === "dynamic-featured") {
            // First get featured lived experiences
            const { data: featuredExperiences } = await sanityFetch({
                query: `*[_type == "livedExperience" && featured == true && relatedCommunity._ref == $regionalCommunityId] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
                    title,
                    excerpt,
                    slug,
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
                    videoUrl,
                    duration,
                    publishedAt,
                    relatedCommunity->{
                        _id,
                        name,
                        slug
                    },
                    organizations[]->{
                        _id,
                        name,
                        slug,
                        acronym
                    },
                    tags[]->{
                        _id,
                        label,
                        value,
                        color
                    },
                    featured
                }`,
                params: { regionalCommunityId },
                perspective: "published",
                stega: false,
            });

            items = featuredExperiences || [];

            // If we need more items, get recent non-featured experiences
            if (items.length < maxItems) {
                const remainingCount = maxItems - items.length;
                const featuredIds = items.map((item: any) => item._id);

                const { data: recentExperiences } = await sanityFetch({
                    query: `*[_type == "livedExperience" && !(_id in $featuredIds) && relatedCommunity._ref == $regionalCommunityId] | order(publishedAt desc)[0...${remainingCount}]{
                        _id,
                        title,
                        excerpt,
                        slug,
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
                        videoUrl,
                        duration,
                        publishedAt,
                        relatedCommunity->{
                            _id,
                            name,
                            slug
                        },
                        organizations[]->{
                            _id,
                            name,
                            slug,
                            acronym
                        },
                        tags[]->{
                            _id,
                            label,
                            value,
                            color
                        },
                        featured
                    }`,
                    params: { featuredIds, regionalCommunityId },
                    perspective: "published",
                    stega: false,
                });

                items = [...items, ...(recentExperiences || [])];
            }
        } else {
            // Just get recent lived experiences
            const { data } = await sanityFetch({
                query: `*[_type == "livedExperience" && relatedCommunity._ref == $regionalCommunityId] | order(publishedAt desc)[0...${maxItems}]{
                    _id,
                    title,
                    excerpt,
                    slug,
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
                    videoUrl,
                    duration,
                    publishedAt,
                    relatedCommunity->{
                        _id,
                        name,
                        slug
                    },
                    organizations[]->{
                        _id,
                        name,
                        slug,
                        acronym
                    },
                    tags[]->{
                        _id,
                        label,
                        value,
                        color
                    },
                    featured
                }`,
                params: { regionalCommunityId },
                perspective: "published",
                stega: false,
            });

            items = data || [];
        }

        return items;
    } catch (error) {
        console.error('Error fetching dynamic lived experiences:', error);
        return [];
    }
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

export const fetchApprovedCaseStudies = async ({
                                                   limit = 12,
                                                   language = 'en', // Renamed from locale to match query parameter
                                               }: {
    limit?: number;
    language?: string; // Should match your supported languages
} = {}) => {
    const { data } = await sanityFetch({
        query: APPROVED_CASE_STUDIES_QUERY,
        params: {
            limit,
            language // Added missing language parameter
        },
        perspective: "published", // Changed from "approved" to standard perspective
        stega: false,
    });

    return data;
};

export const fetchApprovedCaseStudiesByLocale = async ({
                                                           limit = 12,
                                                           locale = 'en',
                                                       }: {
    limit?: number;
    locale?: string;
} = {}) => {
    const { data } = await sanityFetch({
        query: APPROVED_CASE_STUDIES_QUERY,
        params: {
            limit,
            language: locale // Map locale to language parameter
        },
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
        query: `*[_type == "caseStudy" && status == "approved" && defined(slug)]{
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

// Fetch user's submissions and drafts (authenticated, no CDN)
export const fetchUserSubmissionsAndDrafts = async ({ userId }: { userId: string }) => {
    try {
        const { data } = await sanityFetch({
            query: `{
        "submissions": *[_type == "caseStudy" && submittedBy == $userId] | order(submittedAt desc) {
          _id, title, excerpt, topic, status, featured,
          "slug": slug.current, submittedAt, publishedAt, reviewNotes,
          "image": image.asset->url,
          authors[]{ name, role },
          tags[]-> { _id, title, "value": value.current }
        },
        "drafts": *[_type == "caseStudyDraft" && userId == $userId] | order(lastSaved desc) {
          _id, title, excerpt, topic, lastSaved, formMetadata
        }
      }`,
            params: { userId },
        });
        return data ?? { submissions: [], drafts: [] };
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        return { submissions: [], drafts: [] };
    }
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

// Fetch translations for a case study - UPDATED
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
        translationStatus,
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

// Fetch approved case studies by regional community with RTL ordering support - UPDATED
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
    // SAFETY: orderDirection is derived from a boolean check and can only be 'asc' or 'desc'.
    // GROQ parameters cannot be used for sort directions — string interpolation is required here.
    const orderDirection = isRTL ? 'asc' : 'desc';

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
      tags,
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

// Search case studies - UPDATED
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
    let filters = [`_type == "caseStudy"`, `status == "approved"`];
    const params: Record<string, unknown> = { limit };

    if (language) {
        filters.push(`language == $language`);
        params.language = language;
    }

    if (searchTerm) {
        filters.push(`(
      title.en match $searchPattern ||
      title.es match $searchPattern ||
      title.fr match $searchPattern ||
      title.ar match $searchPattern ||
      excerpt.en match $searchPattern ||
      excerpt.es match $searchPattern ||
      excerpt.fr match $searchPattern ||
      excerpt.ar match $searchPattern
    )`);
        params.searchPattern = `${searchTerm}*`;
    }

    // Tag filtering using parameterized $tags array
    if (tags && tags.length > 0) {
        filters.push(`(
      count((tags.en[]->value.current)[@ in $tags]) > 0 ||
      count((tags.es[]->value.current)[@ in $tags]) > 0 ||
      count((tags.fr[]->value.current)[@ in $tags]) > 0 ||
      count((tags.ar[]->value.current)[@ in $tags]) > 0
    )`);
        params.tags = tags;
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
      tags
    }`,
        params,
        perspective: "published",
        stega: false,
    });

    return data;
};

// is good?
// export const fetchSanityPageBySlug = async ({
//                                                 slug,
//                                             }: {
//     slug: string;
// }) => {
//     const { data } = await sanityFetch({
//         query: PAGE_QUERY,
//         params: { slug },
//     });
//
//     return data;
// };
//
// export const fetchCaseStudyBySlug = async ({
//                                                slug,
//                                            }: {
//     slug: string;
// }) => {
//     const { data } = await sanityFetch({
//         query: CASE_STUDY_BY_SLUG_QUERY,
//         params: { slug },
//     });
//
//     return data;
// };
//
// // Remove language filtering from all fetch functions
// export const fetchSanityPostBySlug = async ({
//                                                 slug,
//                                             }: {
//     slug: string;
// }) => {
//     const { data } = await sanityFetch({
//         query: POST_QUERY,
//         params: { slug },
//     });
//
//     return data;
// };

export const fetchHomepageBySlug = async ({
  slug,
  locale = 'en',
}: {
  slug: string;
  locale?: string;
}) => {
  const { data } = await sanityFetch({
    query: HOMEPAGE_QUERY,
    params: {
      slug,
      language: locale
    },
  });

  return data;
};

export const fetchIndexHomepage = async ({
  locale = 'en',
}: {
  locale?: string;
} = {}) => {
  const { data } = await sanityFetch({
    query: INDEX_HOMEPAGE_QUERY,
    params: {
      language: locale
    },
  });

  return data;
};

export const fetchTranslationsForHomepage = async (homepageId: string) => {
  const { data } = await sanityFetch({
    query: `
      *[_type == "translation.metadata" && references($homepageId)][0]{
        "translations": translations[].value->{
          _id,
          language,
          slug
        }
      }.translations`,
    params: { homepageId },
    perspective: "published",
    stega: false,
  });

  return data;
};

export const fetchSanityHomepageBySlug = async ({
                                                  slug,
                                                  locale = 'en',
                                              }: {
    slug: string;
    locale?: string;
}) => {
    const { data } = await sanityFetch({
        query: HOMEPAGE_QUERY,
        params: {
            slug,
            language: locale
        },
    });

    return data;
};

export const fetchSanityHomepageStaticParams = async () => {
    const { data } = await sanityFetch({
        query: `*[_type == "homepage" && defined(slug)]{
      _id,
      slug { current },
      language
    }`,
        perspective: "published",
        stega: false,
    });

    return data;
};

// Re-export the new regional community query functions
export {
    fetchRegionalCommunityCaseStudiesBySlug,
    fetchRegionalCommunityCaseStudies
} from "@/sanity/queries/regional-community-case-studies";

export {
    fetchRegionalCommunityNewsBySlug,
    fetchRegionalCommunityNews
} from "@/sanity/queries/regional-community-news";

export {
    fetchRegionalCommunityLivedExperiencesBySlug,
    fetchRegionalCommunityLivedExperiences
} from "@/sanity/queries/regional-community-lived-experiences";
