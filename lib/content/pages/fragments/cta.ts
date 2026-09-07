/**
 * Call-to-action blocks.
 *
 * These are GROQ projections, not queries: each is one `_type == "…" => {…}`
 * arm, spliced into a document query's block array. Restored character-exact
 * from `sanity/queries/cta/` (deleted in `fc7bc7c40`, recoverable from
 * git), which is where `lib/content/pages.ts` inlined them from — so the four
 * document queries that interpolate them come out byte-identical to the text
 * they carried before Task 14a split the file.
 *
 * `submit-story-banner` appears on the homepage only.
 */

export const CTA_1_PROJECTION = `
  _type == "cta-1" => {
    _type,
    _key,
    padding,
    background,
    sectionWidth,
    stackAlign,
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
  }
`;

export const SUBMIT_STORY_BANNER_PROJECTION = `
  _type == "submit-story-banner" => {
    _type,
    _key,
    padding,
    title,
    subtitle,
    ctaLabel,
    illustration{
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
      }
    },
  }
`;
