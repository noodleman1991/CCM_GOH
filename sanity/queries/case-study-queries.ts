import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";

/**
 * Fetch tags that are used in case studies
 * Returns tags with localized labels and case study counts
 */
export async function fetchCaseStudyTags() {
  return await client.fetch(
    groq`
      *[_type == "tag" && count(*[_type == "caseStudy" && references(^._id)]) > 0]
      | order(label.en asc) {
        _id,
        label,
        "value": value.current,
        color,
        category,
        "caseStudyCount": count(*[_type == "caseStudy" && references(^._id)])
      }
    `
  );
}

/**
 * Fetch regional communities that have case studies
 * Returns communities with localized names and case study counts
 */
export async function fetchCaseStudyCommunities() {
  return await client.fetch(
    groq`
      *[_type == "regionalCommunity"]
      | order(order asc, name.en asc) {
        _id,
        name,
        "slug": slug.current,
        "caseStudyCount": count(*[_type == "caseStudy" && references(^._id)])
      }
    `
  );
}
