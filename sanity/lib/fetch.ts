import { cachedFetch as sanityFetch } from "@/sanity/lib/cached-fetch";
import { SITE_ANNOUNCEMENT_QUERY } from "@/sanity/queries/site-announcement";
import { ACTIVE_PROFILE_PROMPTS_QUERY } from "@/sanity/queries/profile-prompt";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { REGIONAL_COMMUNITY_PAGE_QUERY } from "@/sanity/queries/regional-community-page";
import {
  HOMEPAGE_QUERY,
  INDEX_HOMEPAGE_QUERY,
} from "@/sanity/queries/homepage";
import {
    PAGE_QUERY_RESULT,
    // PAGES_SLUGS_QUERY_RESULT,
} from "@/sanity.types";

// export const fetchSanityPageBySlug = async ({
//   slug,
// }: {
//   slug: string;
// }): Promise<PAGE_QUERY_RESULT> => {
//   const { data } = await sanityFetch({
//     query: PAGE_QUERY,
//     params: { slug },
//   });
//
//   return data;
// };

/** The singleton site announcement (or null). Locale-agnostic fetch; the bar
 *  component resolves the localized message itself. */
export const fetchSiteAnnouncement = async () => {
    const { data } = await sanityFetch({
        query: SITE_ANNOUNCEMENT_QUERY,
    });
    return data;
};

/** Active, editor-ordered profile prompts. Components resolve the localized text. */
export const fetchActiveProfilePrompts = async () => {
    const { data } = await sanityFetch({
        query: ACTIVE_PROFILE_PROMPTS_QUERY,
    });
    return (data || []) as Array<{ id: string; prompt: Record<string, string>; category?: string }>;
};

export const fetchSanityPageBySlug = async ({
                                                slug,
                                                locale = 'en',
                                            }: {
    slug: string;
    locale?: string;
}): Promise<PAGE_QUERY_RESULT> => {
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
//   async (): Promise<PAGES_SLUGS_QUERY_RESULT> => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw GROQ string query returns untyped data; downstream templates depend on the loose shape (typegen is off-limits here)
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
            const featuredIds = items.map((item) => item._id);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw GROQ string query returns untyped data; downstream templates depend on the loose shape (typegen is off-limits here)
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
                const featuredIds = items.map((item) => item._id);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw GROQ string query returns untyped data; downstream templates depend on the loose shape (typegen is off-limits here)
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
                const featuredIds = items.map((item) => item._id);

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
