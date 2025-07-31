import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const gridReportQuery = groq`
  _type == "grid-report" => {
    _type,
    _key,
    showTags,
    showDownloadButtons,
    showMetadata,
    report->{
      _id,
      title,
      subtitle,
      description,
      slug,
      reportType,
      year,
      publishDate,
      downloadCount,
      featured,
      accessLevel,
      coverImage{
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
      translations[]{
        language,
        fileSize,
        pages,
        "url": report.asset->url,
        "filename": asset->originalFilename,
        "mimeType": asset->mimeType,
        "id": asset->_id
      },
      tags[]->{
        _id,
        label,
        value,
        color,
        category
      },
      organizations[]->{
        _id,
        name,
        slug,
        logo{
          asset->{
            _id,
            url
          }
        }
      },
      authors[]{
        name,
        organization->{
          name,
          slug
        }
      }
    }
  }
`;
