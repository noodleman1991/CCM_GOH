import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const carousel2Query = groq`
  _type == "carousel-2" => {
    _type,
    _key,
    title,
    description,
    padding,
    colorVariant,
    testimonial[]->{
      _id,
      name,
      title,
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
