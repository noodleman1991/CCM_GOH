// sanity/queries/grid/grid-case-study.ts

import { groq } from "next-sanity";
import { styledBodyProjection } from "@/sanity/queries/shared/styled-body";
import { cachedFetch as sanityFetch } from "@/sanity/lib/cached-fetch";
import { CaseStudy, CaseStudySearchParams, SupportedLanguage } from '@/types/case-study';

// ===== SHARED CASE STUDY PROJECTION FRAGMENT =====
const CASE_STUDY_PROJECTION_FRAGMENT = `
  _id,
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
    hotspot,
    crop,
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
`;

// Dereferences a polymorphic connection target into the minimal fields each
// content type's "Related" card needs. Shared by every detail query.
export const RELATED_CONTENT_PROJECTION = `
  relatedContent[]{
    relation,
    "target": target->{
      _type,
      _id,
      "slug": slug.current,
      title,
      excerpt,
      "image": image{ asset->{ _id, url }, alt },
      // lived experience specifics
      videoUrl,
      // project specifics (title is plain string there)
      status
    }
  }
`;

const CASE_STUDY_DETAIL_PROJECTION_FRAGMENT = `
  ${CASE_STUDY_PROJECTION_FRAGMENT},
  layout,
  content[]{ ${styledBodyProjection} },
  ${RELATED_CONTENT_PROJECTION},
  seoTitle,
  seoDescription,
  canonicalUrl,
  reviewNotes,
  reviewedBy,
  reviewedAt
`;

// ===== GRID/BLOCK QUERIES =====

// Fixed gridCaseStudyQuery - proper filtering syntax
// @sanity-typegen-ignore
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
    // Properly filter case study by status - use select for conditional referencing
    "caseStudy": select(
      caseStudy->status == "approved" => caseStudy->{
        ${CASE_STUDY_PROJECTION_FRAGMENT}
      },
      null
    )
  }
`;

// ===== BASIC CASE STUDY QUERIES =====

// Query for approved case studies only (public-facing)
export const APPROVED_CASE_STUDIES_QUERY = groq`
  *[_type == "caseStudy" && status == "approved"] | order(publishedAt desc, featured desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

// Query for case study by slug (approved only)
export const CASE_STUDY_BY_SLUG_QUERY = groq`
  *[_type == "caseStudy" && slug.current == $slug && status == "approved"][0]{
    ${CASE_STUDY_DETAIL_PROJECTION_FRAGMENT}
  }
`;

// Query for featured case studies (approved only)
export const FEATURED_CASE_STUDIES_QUERY = groq`
  *[_type == "caseStudy" && status == "approved" && featured == true] | order(publishedAt desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

// Query for approved case studies by regional community
export const APPROVED_CASE_STUDIES_BY_RC_QUERY = groq`
  *[_type == "caseStudy" && status == "approved" && references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id)] | order(publishedAt desc, featured desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

// Query for approved case studies by organization
export const APPROVED_CASE_STUDIES_BY_ORG_QUERY = groq`
  *[_type == "caseStudy" && status == "approved" && references(*[_type == "organization" && slug.current == $slug][0]._id)] | order(publishedAt desc, featured desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

// Query for approved case studies by project
export const APPROVED_CASE_STUDIES_BY_PROJECT_QUERY = groq`
  *[_type == "caseStudy" && status == "approved" && references(*[_type == "project" && slug.current == $slug][0]._id)] | order(publishedAt desc, featured desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

// ===== ADMIN QUERIES (Include all statuses) =====

// Admin query for all case studies (regardless of status)
export const ALL_CASE_STUDIES_ADMIN_QUERY = groq`
  *[_type == "caseStudy"] | order(submittedAt desc, publishedAt desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

// Admin query for case studies by status
export const CASE_STUDIES_BY_STATUS_QUERY = groq`
  *[_type == "caseStudy" && status == $status] | order(submittedAt desc)[0...$limit]{
    ${CASE_STUDY_PROJECTION_FRAGMENT}
  }
`;

// ===== FETCH FUNCTIONS =====

export const fetchApprovedCaseStudies = async ({
                                                   limit = 12,
                                               }: {
    limit?: number;
} = {}): Promise<CaseStudy[]> => {
    const { data } = await sanityFetch({
        query: APPROVED_CASE_STUDIES_QUERY,
        params: { limit },
        perspective: "published",
        stega: false,
    });

    return data || [];
};

export const fetchCaseStudyBySlug = async ({
                                               slug,
                                           }: {
    slug: string;
}): Promise<CaseStudy | null> => {
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
} = {}): Promise<CaseStudy[]> => {
    const { data } = await sanityFetch({
        query: FEATURED_CASE_STUDIES_QUERY,
        params: { limit },
        perspective: "published",
        stega: false,
    });

    return data || [];
};

export const fetchRegionalCommunityCaseStudies = async ({
                                                            slug,
                                                            limit = 6
                                                        }: {
    slug: string;
    limit?: number;
}): Promise<CaseStudy[]> => {
    const { data } = await sanityFetch({
        query: APPROVED_CASE_STUDIES_BY_RC_QUERY,
        params: { slug, limit },
        perspective: "published",
        stega: false,
    });

    return data || [];
};

export const fetchOrganizationCaseStudies = async ({
                                                       slug,
                                                       limit = 6
                                                   }: {
    slug: string;
    limit?: number;
}): Promise<CaseStudy[]> => {
    const { data } = await sanityFetch({
        query: APPROVED_CASE_STUDIES_BY_ORG_QUERY,
        params: { slug, limit },
        perspective: "published",
        stega: false,
    });

    return data || [];
};

export const fetchProjectCaseStudies = async ({
                                                  slug,
                                                  limit = 6
                                              }: {
    slug: string;
    limit?: number;
}): Promise<CaseStudy[]> => {
    const { data } = await sanityFetch({
        query: APPROVED_CASE_STUDIES_BY_PROJECT_QUERY,
        params: { slug, limit },
        perspective: "published",
        stega: false,
    });

    return data || [];
};

// Search function for approved case studies only
export const searchCaseStudies = async ({
                                            searchTerm,
                                            locale = 'en',
                                            tags,
                                            limit = 20,
                                        }: CaseStudySearchParams): Promise<CaseStudy[]> => {
    // Validate locale against whitelist to prevent injection via field name interpolation
    const validLocales: SupportedLanguage[] = ['en', 'es', 'fr', 'ar'];
    const safeLocale = validLocales.includes(locale as SupportedLanguage) ? locale : 'en';

    let filters = [`_type == "caseStudy"`, `status == "approved"`];
    const params: Record<string, unknown> = { limit };

    if (searchTerm) {
        filters.push(`(
      title.${safeLocale} match $searchPattern ||
      title.en match $searchPattern ||
      excerpt.${safeLocale} match $searchPattern ||
      excerpt.en match $searchPattern
    )`);
        params.searchPattern = `${searchTerm}*`;
    }

    // Uses $tags array parameter to prevent GROQ injection
    if (tags && tags.length > 0) {
        filters.push(`count((tags[]->value.current)[@ in $tags]) > 0`);
        params.tags = tags;
    }

    const { data } = await sanityFetch({
        query: `*[${filters.join(' && ')}] | order(featured desc, publishedAt desc)[0...$limit]{
      ${CASE_STUDY_PROJECTION_FRAGMENT}
    }`,
        params,
        perspective: "published",
        stega: false,
    });

    return data || [];
};

// Static params for approved case studies only
export const fetchCaseStudiesStaticParams = async (): Promise<{ slug: string }[]> => {
    const { data } = await sanityFetch({
        query: `*[_type == "caseStudy" && status == "approved" && defined(slug)]{
      "slug": slug.current
    }`,
        perspective: "published",
        stega: false,
    });

    return data || [];
};

// ===== ADMIN FUNCTIONS (Use with caution - includes all statuses) =====

export const fetchAllCaseStudiesAdmin = async ({
                                                   limit = 50,
                                               }: {
    limit?: number;
} = {}): Promise<CaseStudy[]> => {
    const { data } = await sanityFetch({
        query: ALL_CASE_STUDIES_ADMIN_QUERY,
        params: { limit },
        perspective: "previewDrafts", // Include drafts for admin
        stega: false,
    });

    return data || [];
};

export const fetchCaseStudiesByStatusAdmin = async ({
                                                        status,
                                                        limit = 50,
                                                    }: {
    status: string;
    limit?: number;
}): Promise<CaseStudy[]> => {
    const { data } = await sanityFetch({
        query: CASE_STUDIES_BY_STATUS_QUERY,
        params: { status, limit },
        perspective: "previewDrafts", // Include drafts for admin
        stega: false,
    });

    return data || [];
};
