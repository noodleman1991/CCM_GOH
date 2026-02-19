import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";

/**
 * Query to fetch all active regional communities with i18n names
 */
export const REGIONAL_COMMUNITIES_QUERY = groq`
  *[_type == "regionalCommunity" && active == true] | order(orderRank){
    _id,
    "slug": slug.current,
    name {
      en,
      es,
      fr,
      ar
    },
    active
  }
`;

/**
 * Fetch all active regional communities from Sanity
 * Uses client.fetch instead of sanityFetch - works in API routes
 */
export async function getRegionalCommunities() {
  try {
    console.log('[RegionalCommunities] Fetching from Sanity...')
    const data = await client.fetch(REGIONAL_COMMUNITIES_QUERY);
    console.log('[RegionalCommunities] Fetched:', data?.length || 0, 'communities')
    return data;
  } catch (error) {
    console.error('[RegionalCommunities] Error fetching from Sanity:', error);
    return [];
  }
}
