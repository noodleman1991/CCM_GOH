import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

// ===== GRID/BLOCK QUERIES =====

// Fixed gridCaseStudyQuery - only fetch approved case studies (field-level)
export const gridCaseStudyQuery = groq`
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    showStudyPeriod,
    showLocation,
    customExcerpt,
    customLayout,
    // Filter case study by status during reference resolution
    caseStudy->[status == "approved"][0]{
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
      projects[]->{
        _id,
        name,
        slug
      },
      tags[]->{
        _id,
        label,
        value,
        color
      },
      studyPeriod,
      studyLocation,
      studyAreas[]{
        location,
        name,
        description
      }
    }
  }
`;

// ===== CASE STUDY QUERIES (Field-Level) =====

// Query for approved case studies (field-level localization)
export const APPROVED_CASE_STUDIES_QUERY = groq`
  *[_type == "caseStudy" && status == "approved"] | order(publishedAt desc, featured desc)[0...$limit]{
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
    projects[]->{
      _id,
      name,
      slug
    },
    tags[]->{
      _id,
      label,
      value,
      color
    },
    studyPeriod,
    studyLocation,
    studyAreas[]{
      location,
      name,
      description
    }
  }
`;

// Query for case study by slug (field-level)
export const CASE_STUDY_BY_SLUG_QUERY = groq`
  *[_type == "caseStudy" && slug.current == $slug && status == "approved"][0]{
    _id,
    title,
    excerpt,
    content,
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
      color
    },
    studyPeriod,
    studyLocation,
    studyAreas[]{
      location,
      name,
      description
    },
    // SEO fields
    seoTitle,
    seoDescription,
    canonicalUrl
  }
`;

// Query for featured case studies (field-level)
export const FEATURED_CASE_STUDIES_QUERY = groq`
  *[_type == "caseStudy" && status == "approved" && featured == true] | order(publishedAt desc)[0...$limit]{
    _id,
    title,
    excerpt,
    slug,
    publishedAt,
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
  }
`;

// Query for approved case studies by regional community (field-level)
export const APPROVED_CASE_STUDIES_BY_RC_QUERY = groq`
  *[_type == "caseStudy" && status == "approved" && references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id)] | order(publishedAt desc, featured desc)[0...$limit]{
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
    projects[]->{
      _id,
      name,
      slug
    },
    tags[]->{
      _id,
      label,
      value,
      color
    },
    studyPeriod,
    studyLocation,
    studyAreas[]{
      location,
      name,
      description
    }
  }
`;

// ===== FETCH FUNCTIONS (Updated for Field-Level) =====

export const fetchApprovedCaseStudies = async ({
                                                   limit = 12,
                                               }: {
    limit?: number;
} = {}) => {
    const { data } = await sanityFetch({
        query: APPROVED_CASE_STUDIES_QUERY,
        params: { limit },
        perspective: "published",
        stega: false,
    });

    return data;
};

export const fetchCaseStudyBySlug = async ({
                                               slug,
                                           }: {
    slug: string;
}) => {
    const { data } = await sanityFetch({
        query: CASE_STUDY_BY_SLUG_QUERY,
        params: { slug },
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

// Fixed search function for field-level localization
export const searchCaseStudies = async ({
                                            searchTerm,
                                            locale = 'en',
                                            tags,
                                            limit = 20,
                                        }: {
    searchTerm?: string;
    locale?: string;
    tags?: string[];
    limit?: number;
}) => {
    let filters = [`_type == "caseStudy"`, `status == "approved"`];

    if (searchTerm) {
        filters.push(`(
            title.${locale} match "${searchTerm}*" ||
            title.en match "${searchTerm}*" ||
            excerpt.${locale} match "${searchTerm}*" ||
            excerpt.en match "${searchTerm}*"
        )`);
    }

    if (tags && tags.length > 0) {
        const tagFilters = tags.map(tag => `"${tag}" in tags[]->value.current`);
        filters.push(`(${tagFilters.join(' || ')})`);
    }

    const { data } = await sanityFetch({
        query: `*[${filters.join(' && ')}] | order(featured desc, publishedAt desc)[0...$limit]{
            _id,
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

export const fetchCaseStudiesStaticParams = async () => {
    const { data } = await sanityFetch({
        query: `*[_type == "caseStudy" && status == "approved" && defined(slug)]{
            _id,
            slug { current }
        }`,
        perspective: "published",
        stega: false,
    });

    return data;
};
