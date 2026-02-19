import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const carousel1Query = groq`
  _type == "carousel-1" => {
    _type,
    _key,
    title,
    description,
    background,
    padding,
    colorVariant,
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
