import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const manualContentInsertQuery = groq`
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