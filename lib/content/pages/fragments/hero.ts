/**
 * Hero blocks.
 *
 * These are GROQ projections, not queries: each is one `_type == "…" => {…}`
 * arm, spliced into a document query's block array. Restored character-exact
 * from `sanity/queries/hero/` (deleted in `fc7bc7c40`, recoverable from
 * git), which is where `lib/content/pages.ts` inlined them from — so the four
 * document queries that interpolate them come out byte-identical to the text
 * they carried before Task 14a split the file.
 *
 * Two variants: `hero-2` is `hero-1` without the image group.
 */

export const HERO_1_PROJECTION = `
  _type == "hero-1" => {
    _type,
    _key,
    background{
      ...,
    },
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
    links[]{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
    padding,
    imagePosition,
  }
`;

export const HERO_2_PROJECTION = `
  _type == "hero-2" => {
    _type,
    _key,
    background{
      ...,
    },
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
    links[]{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
    padding,
  }
`;
