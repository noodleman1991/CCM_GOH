/**
 * Carousel blocks.
 *
 * These are GROQ projections, not queries: each is one `_type == "…" => {…}`
 * arm, spliced into a document query's block array. Restored character-exact
 * from `sanity/queries/carousel/` (deleted in `fc7bc7c40`, recoverable from
 * git), which is where `lib/content/pages.ts` inlined them from — so the four
 * document queries that interpolate them come out byte-identical to the text
 * they carried before Task 14a split the file.
 *
 * `carousel-1` is images; `carousel-2` is cards; `lived-experiences-carousel`
 * is a feed block whose items the page query does not dereference.
 */

export const CAROUSEL_1_PROJECTION = `
  _type == "carousel-1" => {
    _type,
    _key,
    title,
    description,
    background,
    padding,
    size,
    orientation,
    indicators,
    cardVariant,
    images[]{
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

export const CAROUSEL_2_PROJECTION = `
  _type == "carousel-2" => {
    _type,
    _key,
    title,
    description,
    padding,
    testimonial[]->{
      _id,
      name,
      // Localized job title (Lane B) with legacy single-language fallback.
      "title": coalesce(jobTitle, { "en": title }),
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
      // Localized rich quote object ({en,es,fr,ar}); the renderer resolves the
      // active locale. Falls back to wrapping the legacy single-language body.
      "quote": coalesce(quote, { "en": body }),
      rating,
      featured,
      relatedCommunity->{
        _id,
        name
      },
      organization->{
        _id,
        name
      },
      project->{
        _id,
        name
      },
    },
  }
`;

export const LIVED_EXPERIENCES_CAROUSEL_PROJECTION = `
  _type == "lived-experiences-carousel" => {
    _type,
    _key,
    title,
    subtitle,
    background,
    padding,
    filterBy,
    maxItems,
    featured,
  }
`;
