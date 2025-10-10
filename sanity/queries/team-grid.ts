import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const teamGridQuery = groq`
  _type == "team-grid" => {
    _type,
    _key,
    mode,
    manualMembers[]->{
      _id,
      name,
      slug,
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
        alt
      },
      organizationalAffiliation,
      communityMemberships[] {
        community->{
          _id,
          name
        },
        role
      }
    },
    regionalCommunity->{
      _id,
      name,
      slug
    },
    gridColumns,
    showTitle,
    title,
    showDescription,
    description,
    displayRole,
    displayAffiliation
  }
`;
