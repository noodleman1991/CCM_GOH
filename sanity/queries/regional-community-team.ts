import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

// Query for team members by community ID (dynamic mode)
export const REGIONAL_COMMUNITY_TEAM_QUERY = groq`
  *[_type == "author" && $communityId in communityMemberships[].community._ref] | order(name asc) [0...$limit] {
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
  }
`;

// Query for team members by IDs (manual mode)
export const TEAM_MEMBERS_BY_IDS_QUERY = groq`
  *[_type == "author" && _id in $memberIds] {
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
  }
`;

// Fetch team members for a regional community (dynamic mode)
export const fetchRegionalCommunityTeamMembers = async (params: {
  communityId: string;
  limit?: number;
}) => {
  const { communityId, limit = 20 } = params;

  const { data } = await sanityFetch({
    query: REGIONAL_COMMUNITY_TEAM_QUERY,
    params: { communityId, limit },
  });

  return data;
};

// Fetch specific team members by IDs (manual mode)
export const fetchTeamMembersByIds = async (params: {
  memberIds: string[];
}) => {
  const { memberIds } = params;

  if (!memberIds || memberIds.length === 0) return [];

  const { data } = await sanityFetch({
    query: TEAM_MEMBERS_BY_IDS_QUERY,
    params: { memberIds },
  });

  return data;
};
