import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

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
 */
export async function getRegionalCommunities() {
  const { data } = await sanityFetch({
    query: REGIONAL_COMMUNITIES_QUERY,
    tags: ['regionalCommunity']
  });

  return data;
}
