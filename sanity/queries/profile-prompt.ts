import { groq } from "next-sanity";

/** Active profile prompts, in editor order. prompt is a Lane-B localized object. */
export const ACTIVE_PROFILE_PROMPTS_QUERY = groq`
  *[_type == "profilePrompt" && active == true] | order(orderRank asc){
    "id": _id,
    prompt,
    category
  }
`;
