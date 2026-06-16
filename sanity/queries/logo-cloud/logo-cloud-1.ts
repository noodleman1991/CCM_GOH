import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const logoCloud1Query = groq`
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
