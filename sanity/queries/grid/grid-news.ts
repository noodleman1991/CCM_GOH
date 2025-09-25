import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const gridNewsQuery = groq`
  _type == "grid-news" => {
    _type,
    _key,
    showTags,
    showAuthor,
    showMetadata,
    showLocation,
    customExcerpt,
    newsPost->{
      _id,
      title,
      subtitle,
      excerpt,
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
        alt
      },
      author->{
        _id,
        name,
        image{
          asset->{
            _id,
            url
          },
          alt
        }
      },
      publishedAt,
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
      locationDetails,
      tags[]->{
        _id,
        label,
        value,
        color
      },
      featured
    }
  }
`;