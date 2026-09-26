/**
 * Grid-row blocks — a grid of cards, each card one of six types.
 *
 * These are GROQ projections, not queries: each is one `_type == "…" => {…}`
 * arm, spliced into a document query's block array. Restored character-exact
 * from `sanity/queries/grid/` (deleted in `fc7bc7c40`, recoverable from
 * git), which is where `lib/content/pages.ts` inlined them from — so the four
 * document queries that interpolate them come out byte-identical to the text
 * they carried before Task 14a split the file.
 *
 * `CASE_STUDY_CARD_FIELDS` was a private const in `grid-case-study.ts` shared
 * by that file's own eight queries; only the card projection survives here.
 */

export const CASE_STUDY_CARD_FIELDS = `
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
`;

export const GRID_CARD_PROJECTION = `
  _type == "grid-card" => {
    _type,
    _key,
    title,
    excerpt,
    image{
      ...,
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
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
`;

export const GRID_POST_PROJECTION = `
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
        alt
      },
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
`;

export const GRID_AGENDA_PROJECTION = `
  _type == "grid-agenda" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    agenda->{
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
    }
  }
`;

export const GRID_CASE_STUDY_PROJECTION = `
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
        ${CASE_STUDY_CARD_FIELDS}
      },
      null
    )
  }
`;

export const GRID_NEWS_PROJECTION = `
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
      slug,
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
        alt
      },
      author->{
        _id,
        name,
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
`;

export const GRID_LIVED_EXPERIENCE_PROJECTION = `
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
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
    }
  }
`;

export const GRID_ROW_PROJECTION = `
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    subtitle,
    description,
    gridColumns,
    cardVariant,
    initialDisplayCount,
    headerImage {
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
    columns[]{
      ${GRID_CARD_PROJECTION},
      ${GRID_POST_PROJECTION},
      ${GRID_AGENDA_PROJECTION},
      ${GRID_CASE_STUDY_PROJECTION},
      ${GRID_NEWS_PROJECTION},
      ${GRID_LIVED_EXPERIENCE_PROJECTION},
    },
  }
`;
