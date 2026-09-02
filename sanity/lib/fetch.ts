import { cachedFetch as sanityFetch } from "@/sanity/lib/cached-fetch";
import { SITE_ANNOUNCEMENT_QUERY } from "@/sanity/queries/site-announcement";
import { ACTIVE_PROFILE_PROMPTS_QUERY } from "@/sanity/queries/profile-prompt";

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

// The three dead re-export barrels that used to sit here (forwarding
// fetchRegionalCommunityCaseStudies(BySlug)/-News(BySlug)/-LivedExperiences(BySlug)
// from sanity/queries/regional-community-*.ts) are gone: zero consumers ever
// imported these names from "@/sanity/lib/fetch" (grepped repo-wide — Task
// 6b's report has the evidence), and their three source files are deleted as
// part of that task, having been converted into lib/content/pages.ts. This
// file's own four live helpers above (fetchSiteAnnouncement,
// fetchActiveProfilePrompts, fetchDynamicCaseStudies,
// fetchDynamicLivedExperiences) are untouched.
