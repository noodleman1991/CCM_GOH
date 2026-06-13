import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const gridPostQuery = groq`
  _type == "grid-post" => {
    _type,
    _key,
    featured,
    newsPost->{
      _id,
      title,
      subtitle,
      slug,
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
      publishedAt,
      tags[]->{
        _id,
        label,
      },
    },
  }
`;
