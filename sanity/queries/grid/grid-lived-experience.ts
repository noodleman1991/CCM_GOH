import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const gridLivedExperienceQuery = groq`
  _type == "grid-lived-experience" => {
    _type,
    _key,
    showTags,
    showMetadata,
    showCommunity,
    showOrganizations,
    customExcerpt,
    livedExperience->{
      _id,
      title,
      excerpt,
      slug,
      thumbnail{
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
      videoUrl,
      duration,
      publishedAt,
      relatedCommunity->{
        _id,
        name,
        slug
      },
      organizations[]->{
        _id,
        name,
        slug,
        acronym
      },
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