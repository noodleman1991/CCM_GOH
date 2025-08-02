import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const gridCaseStudyQuery = groq`
  _type == "grid-case-study" => {
    _type,
    _key,
    showTags,
    showAuthors,
    showMetadata,
    customExcerpt,
    caseStudy->{
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
    }
  }
`;

// Query for published case studies (public facing)
export const PUBLISHED_CASE_STUDIES_QUERY = groq`
  *[_type == "caseStudy" && status == "published"] | order(publishedAt desc, featured desc)[0...$limit]{
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
  }
`;

// Query for approved case studies by regional community
export const APPROVED_CASE_STUDIES_BY_RC_QUERY = groq`
  *[_type == "caseStudy" && status == "approved" && references(*[_type == "regionalCommunity" && slug.current == $slug][0]._id)] | order(publishedAt desc, featured desc)[0...$limit]{
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
  }
`;

// Query for case study by slug with full content
export const CASE_STUDY_BY_SLUG_QUERY = groq`
  *[_type == "caseStudy" && slug.current == $slug][0]{
    _id,
    language,
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
    tags,
    studyPeriod,
    studyLocation,
    studyAreas[]{
      location,
      name,
      description
    },
    // Translation management
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
        title
      }
    },
    // SEO fields
    seoTitle,
    seoDescription,
    canonicalUrl
  }
`;

// Query for featured case studies (homepage)
export const FEATURED_CASE_STUDIES_QUERY = groq`
  *[_type == "caseStudy" && status == "published" && featured == true] | order(publishedAt desc)[0...$limit]{
    _id,
    language,
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
    tags
  }
`;

// Query for case studies by language
export const CASE_STUDIES_BY_LANGUAGE_QUERY = groq`
  *[_type == "caseStudy" && status == "published" && language == $language] | order(publishedAt desc)[0...$limit]{
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
  }
`;

// Query for case studies with translations (admin/editor view)
export const CASE_STUDIES_WITH_TRANSLATIONS_QUERY = groq`
  *[_type == "caseStudy" && language == "en"] | order(publishedAt desc, _createdAt desc)[0...$limit]{
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
      name,
      role,
      affiliation->{
        name,
        acronym
      }
    },
    translations[]{
      language,
      translationStatus,
      document->{
        _id,
        language,
        slug,
        title,
        status,
        publishedAt
      }
    }
  }
`;

// Query to find all translations of a specific case study
export const CASE_STUDY_TRANSLATIONS_QUERY = groq`
  {
    "base": *[_type == "caseStudy" && _id == $baseId][0]{
      _id,
      language,
      title,
      slug,
      status,
      publishedAt
    },
    "translations": *[_type == "caseStudy" && baseDocument._ref == $baseId]{
      _id,
      language,
      title,
      slug,
      status,
      publishedAt
    }
  }
`;
