/**
 * Split-row blocks — a row of columns, each column one of four types.
 *
 * These are GROQ projections, not queries: each is one `_type == "…" => {…}`
 * arm, spliced into a document query's block array. Restored character-exact
 * from `sanity/queries/split/` (deleted in `fc7bc7c40`, recoverable from
 * git), which is where `lib/content/pages.ts` inlined them from — so the four
 * document queries that interpolate them come out byte-identical to the text
 * they carried before Task 14a split the file.
 *
 * `SPLIT_ROW_PROJECTION` interpolates the four column projections, so they are declared before it.
 */

export const SPLIT_CONTENT_PROJECTION = `
  _type == "split-content" => {
    _type,
    _key,
    sticky,
    padding,
    tagLine,
    title,
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

export const SPLIT_CARDS_LIST_PROJECTION = `
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
      tagLine,
      title,
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

export const SPLIT_IMAGE_PROJECTION = `
  _type == "split-image" => {
    _type,
    _key,
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
      alt
    },
  }
`;

export const SPLIT_INFO_LIST_PROJECTION = `
  _type == "split-info-list" => {
    _type,
    _key,
    list[]{
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
      title,
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
      tags[],
    },
  }
`;

export const SPLIT_ROW_PROJECTION = `
  _type == "split-row" => {
    _type,
    _key,
    padding,
    noGap,
    splitColumns[]{
      ${SPLIT_CONTENT_PROJECTION},
      ${SPLIT_CARDS_LIST_PROJECTION},
      ${SPLIT_IMAGE_PROJECTION},
      ${SPLIT_INFO_LIST_PROJECTION},
    },
  }
`;
