/**
 * Content-flow inserts — regionalCommunityPage's custom (non-template) mode only.
 *
 * These are GROQ projections, not queries: each is one `_type == "…" => {…}`
 * arm, spliced into a document query's block array. Restored character-exact
 * from `sanity/queries/inserts/` (deleted in `fc7bc7c40`, recoverable from
 * git), which is where `lib/content/pages.ts` inlined them from — so the four
 * document queries that interpolate them come out byte-identical to the text
 * they carried before Task 14a split the file.
 *
 * None of the three appears in `PAGE_QUERY` or either homepage query.
 */

export const MANUAL_CONTENT_INSERT_PROJECTION = `
  _type == "manualContentInsert" => {
    _type,
    _key,
    title,
    content,
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
      alt,
      caption
    },
    layout,
    backgroundColor,
    padding
  }
`;

export const DYNAMIC_CONTENT_INSERT_PROJECTION = `
  _type == "dynamicContentInsert" => {
    _type,
    _key,
    queryType,
    displayStyle,
    itemCount,
    title,
    subtitle,
    showViewAllButton,
    backgroundColor,
    padding
  }
`;

export const SEPARATOR_BLOCK_PROJECTION = `
  _type == "separatorBlock" => {
    _type,
    _key,
    style,
    spacing,
    color
  }
`;
