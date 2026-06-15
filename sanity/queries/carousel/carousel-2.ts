import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const carousel2Query = groq`
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
