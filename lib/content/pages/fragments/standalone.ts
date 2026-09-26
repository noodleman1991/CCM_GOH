/**
 * Block projections with no sub-family — one `_type ==` arm each, no children.
 *
 * These are GROQ projections, not queries: each is one `_type == "…" => {…}`
 * arm, spliced into a document query's block array. Restored character-exact
 * from `sanity/queries/*.ts (root level)` (deleted in `fc7bc7c40`, recoverable from
 * git), which is where `lib/content/pages.ts` inlined them from — so the four
 * document queries that interpolate them come out byte-identical to the text
 * they carried before Task 14a split the file.
 *
 * Grouped by that shared property rather than split into eleven files: they
 * have no relationship to each other beyond having no internal structure,
 * and Task 14c walks them one at a time regardless.
 */

export const SECTION_HEADER_PROJECTION = `
  _type == "section-header" => {
    _type,
    _key,
    padding,
    sectionWidth,
    stackAlign,
    tagLine,
    title,
    description,
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

export const TEAM_GRID_PROJECTION = `
  _type == "team-grid" => {
    _type,
    _key,
    mode,
    manualMembers[]->{
      _id,
      name,
      slug,
      image {
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
        hotspot,
        crop,
        alt
      },
      organizationalAffiliation,
      communityMemberships[] {
        community->{
          _id,
          name
        },
        role
      }
    },
    regionalCommunity->{
      _id,
      name,
      slug
    },
    gridColumns,
    showTitle,
    title,
    showDescription,
    description,
    displayRole,
    displayAffiliation
  }
`;

export const TIMELINE_ROW_PROJECTION = `
  _type == "timeline-row" => {
    _type,
    _key,
    padding,
    timelines[]{
      title,
      tagLine,
      body[]{
        ...,
        _type == "image" => {
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
          }
        }
      },
    },
  }
`;

export const LOGO_CLOUD_1_PROJECTION = `
  _type == "logo-cloud-1" => {
    _type,
    _key,
    padding,
    title,
    description,
    layout,
    motionSpeed,
    images[]{
      ...,
      label,
      orgType,
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
  }
`;

export const FAQS_PROJECTION = `
  _type == "faqs" => {
    _type,
    _key,
    padding,
    faqs[]->{
      _id,
      // Localized question (Lane B), with legacy single-language fallback.
      "question": coalesce(question, { "en": title }),
      "title": coalesce(question.en, title),
      // Localized rich answer; fall back to legacy single-language body.
      "answer": coalesce(answer, { "en": body }),
      "body": coalesce(answer.en, body)[]{
        ...,
        _type == "image" => {
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
          }
        }
      },
    },
  }
`;

export const FORM_NEWSLETTER_PROJECTION = `
  _type == "form-newsletter" => {
    _type,
    _key,
    padding,
    stackAlign,
    consentText,
    buttonText,
    successMessage,
  }
`;

export const ALL_POSTS_PROJECTION = `
  _type == "all-posts" => {
    _type,
    _key,
    padding,
    mode,
    limit,
    manualPosts[]->{
      _ref
    },
  }
`;

export const REGION_MAP_PROJECTION = `
  _type == "region-map" => {
    _type,
    _key,
    padding,
    title,
    description,
    defaultFacet,
    allowedFacets,
  }
`;

export const PEOPLE_WIDGET_PROJECTION = `
  _type == "people-widget" => {
    _type,
    _key,
    padding,
    title,
    description,
    limit,
  }
`;

export const EVENTS_CALENDAR_PROJECTION = `
  _type == "events-calendar" => {
    _type,
    _key,
    padding,
    title,
    description,
    upcomingLimit,
  }
`;

export const FRESH_CONTENT_PROJECTION = `
  _type == "fresh-content" => {
    _type,
    _key,
    title,
    limit,
  }
`;
